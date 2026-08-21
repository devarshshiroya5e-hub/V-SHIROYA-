import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 10000);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

const DATA_FILE = path.join(process.cwd(), "policies_db.json");
const SECURITY_LOGS_FILE = path.join(process.cwd(), "security_audit.json");

// OpenRouter-only configuration. Supports one key, six keys, or more.
function getOpenRouterKeys(): string[] {
  const keys: string[] = [];
  const listValue = process.env.OPENROUTER_API_KEYS || "";
  for (const key of listValue.split(/[,\n\r]+/)) {
    const cleaned = key.trim();
    if (cleaned) keys.push(cleaned);
  }
  for (let i = 1; i <= 12; i++) {
    const key = process.env[`OPENROUTER_API_KEY_${i}`]?.trim();
    if (key) keys.push(key);
  }
  const single = process.env.OPENROUTER_API_KEY?.trim();
  if (single) keys.push(single);
  return [...new Set(keys)].filter(Boolean);
}

const configuredModels = (process.env.OPENROUTER_MODELS || process.env.OPENROUTER_MODEL || "google/gemini-3-flash-preview")
  .split(/[,\n\r]+/)
  .map((m) => m.trim())
  .filter(Boolean);

const PDF_ENGINE = process.env.OPENROUTER_PDF_ENGINE || "cloudflare-ai";
let keyRotationIndex = 0;

function parseJsonSafely(content: string): any | null {
  if (!content) return null;
  let cleaned = content.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch {}
  }
  return null;
}

function normalizeResult(result: any): any {
  const output = result && typeof result === "object" ? { ...result } : {};
  const numeric = (value: any) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  };

  output.premiumAmount = numeric(output.premiumAmount);
  output.sumAssured = numeric(output.sumAssured);
  output.additionalDetails = Array.isArray(output.additionalDetails) ? output.additionalDetails : [];
  output.missingFields = Array.isArray(output.missingFields) ? output.missingFields : [];
  output.uncertainFields = Array.isArray(output.uncertainFields) ? output.uncertainFields : [];
  output.fieldConfidenceMap = output.fieldConfidenceMap && typeof output.fieldConfidenceMap === "object" ? output.fieldConfidenceMap : {};
  if (!output.insuredPerson && output.ownerName) output.insuredPerson = output.ownerName;

  if (output.endDate) {
    const end = new Date(output.endDate);
    if (!Number.isNaN(end.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const days = Math.ceil((end.getTime() - today.getTime()) / 86400000);
      output.policyStatus = days < 0 ? "EXPIRED" : days <= 30 ? "EXPIRING SOON" : "ACTIVE";
    }
  }
  if (!["ACTIVE", "EXPIRING SOON", "EXPIRED"].includes(output.policyStatus)) output.policyStatus = "ACTIVE";

  const haystack = [output.policyType, output.providerCompany, output.extractedText,
    ...(output.additionalDetails || []).map((x: any) => `${x?.label || ""} ${x?.value || ""}`)]
    .join(" ").toLowerCase();

  if (!output.category) {
    if (/vehicle|motor|car|bike|two wheeler|chassis|engine no|registration no|third party|own damage|idv/.test(haystack)) output.category = "Vehicle";
    else if (/health|mediclaim|hospital|floater|cashless|room rent|critical illness|pre-existing/.test(haystack)) output.category = "Health";
    else if (/fire|property|shopkeeper|burglary|building|material damage|home insurance/.test(haystack)) output.category = "Fire";
    else if (/life|term|jeevan|endowment|ulip|pension|annuity|death benefit/.test(haystack)) output.category = "Life";
    else if (/travel|trip|passport|overseas/.test(haystack)) output.category = "Travel";
    else output.category = "General";
  }
  if (!output.policyType) output.policyType = `${output.category} Insurance`;
  if (typeof output.confidence !== "number") output.confidence = 70;
  return output;
}

const POLICY_SCHEMA_PROMPT = `
Return ONLY one valid JSON object with this exact shape. Use null when a field is not visible. Never guess or invent information.
{
  "documentType": string | null,
  "detectedInsurer": string | null,
  "appliedTemplate": string | null,
  "ownerName": string | null,
  "policyNumber": string | null,
  "providerCompany": string | null,
  "policyType": string | null,
  "startDate": string | null,
  "endDate": string | null,
  "premiumAmount": number | null,
  "premiumFrequency": string | null,
  "sumAssured": number | null,
  "insuredPerson": string | null,
  "nominee": string | null,
  "nomineeRelationship": string | null,
  "phoneNumber": string | null,
  "email": string | null,
  "address": string | null,
  "dateOfBirth": string | null,
  "agentName": string | null,
  "agentPhone": string | null,
  "branchName": string | null,
  "paymentMode": string | null,
  "policyStatus": "ACTIVE" | "EXPIRING SOON" | "EXPIRED",
  "maturityDate": string | null,
  "additionalDetails": [{"label": string, "value": string, "confidence": "high" | "medium" | "low"}],
  "missingFields": [string],
  "uncertainFields": [string],
  "confidence": number,
  "extractedText": string,
  "fieldConfidenceMap": {"fieldName": "high" | "medium" | "low"}
}`;

const ANALYSIS_SYSTEM_PROMPT = `You are V-SHIROYA Policy AI, a high-accuracy insurance policy document analyst and OCR auditor.
Analyze the COMPLETE uploaded insurance PDF, including every page, table, schedule, header, footer, endorsement, rider, stamp, fine print, and scanned image.
Rules:
1. Read the entire document, not only the first page.
2. Extract only information actually visible in the document.
3. Preserve policy numbers and names exactly where possible.
4. Normalize dates to YYYY-MM-DD only when unambiguous; otherwise preserve original text and mark uncertain.
5. Extract all monetary values with labels. Do not confuse premium, sum insured, sum assured, IDV, deductible, GST, or claim amount.
6. For family/health policies, list all covered persons and member-level details in additionalDetails.
7. For life policies, inspect policy schedule, premium details, maturity/benefit tables, riders, nominee/appointee information, and policy term.
8. For motor policies, inspect registration number, chassis/engine number, IDV, own damage, third-party cover, add-ons, deductibles, and policy period.
9. For health policies, inspect base sum insured, cumulative/no-claim bonus, members, room-rent limits, waiting periods, exclusions, and policy period.
10. For scanned PDFs, use the PDF's OCR/visual content. Do not assume the PDF has a text layer.
11. Put any visible field that does not fit a top-level property into additionalDetails.
12. missingFields must list important fields that are genuinely absent or unreadable.
13. uncertainFields must list fields where the document is ambiguous or OCR is unclear.
14. confidence is an overall 0-100 extraction confidence.

${POLICY_SCHEMA_PROMPT}`;

async function callOpenRouterForDocument(fileData: string | undefined, fileName: string, mimeType: string, instruction: string): Promise<any> {
  const keys = getOpenRouterKeys();
  if (!keys.length) throw new Error("No OpenRouter API key is configured. Add OPENROUTER_API_KEY_1...OPENROUTER_API_KEY_6 in Render.");

  const isPdf = (mimeType || "").toLowerCase() === "application/pdf" || /\.pdf$/i.test(fileName);
  const cleanBase64 = (fileData || "").includes("base64,") ? ((fileData || "").split("base64,").pop() || "") : (fileData || "");
  if (!cleanBase64) throw new Error("Uploaded document data is empty.");

  const content: any[] = [{
    type: "text",
    text: `${ANALYSIS_SYSTEM_PROMPT}\n\nUser instruction: ${instruction || "Analyze the complete policy document and extract all policy information."}`
  }];

  if (isPdf) {
    content.push({
      type: "file",
      file: { filename: fileName || "policy.pdf", file_data: `data:application/pdf;base64,${cleanBase64}` }
    });
  } else {
    content.push({ type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${cleanBase64}` } });
  }

  const startIndex = keyRotationIndex % keys.length;
  const orderedKeys = keys.slice(startIndex).concat(keys.slice(0, startIndex));
  keyRotationIndex = (startIndex + 1) % keys.length;
  const failures: string[] = [];

  for (const apiKey of orderedKeys) {
    for (const model of configuredModels) {
      const payload: any = {
        model,
        messages: [
          { role: "system", content: "You are a precise insurance document extraction engine. Return valid JSON only." },
          { role: "user", content }
        ],
        max_tokens: Number(process.env.OPENROUTER_MAX_TOKENS || 12000),
        temperature: 0.1,
        response_format: { type: "json_object" }
      };
      if (isPdf) payload.plugins = [{ id: "file-parser", pdf: { engine: PDF_ENGINE } }];

      try {
        console.log(`OpenRouter policy scan: model=${model}, key=${apiKey.slice(0, 8)}..., pdf=${isPdf}`);
        let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "https://v-shiroya-policy.onrender.com",
            "X-Title": "V-SHIROYA Policy AI"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok && response.status === 400) {
          const firstError = await response.text();
          if (/response.?format|json_object|structured/i.test(firstError)) {
            const retryPayload = { ...payload };
            delete retryPayload.response_format;
            response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.APP_URL || "https://v-shiroya-policy.onrender.com",
                "X-Title": "V-SHIROYA Policy AI"
              },
              body: JSON.stringify(retryPayload)
            });
          }
        }

        if (!response.ok) {
          const errorText = await response.text();
          const shortError = errorText.replace(/\s+/g, " ").slice(0, 500);
          failures.push(`${model}: HTTP ${response.status} ${shortError}`);
          console.warn(`OpenRouter failure ${response.status} for ${model}: ${shortError}`);
          continue;
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        const parsed = parseJsonSafely(typeof text === "string" ? text : JSON.stringify(text || {}));
        if (!parsed) {
          failures.push(`${model}: model returned non-JSON output`);
          continue;
        }
        return normalizeResult(parsed);
      } catch (error: any) {
        const message = error?.message || String(error);
        failures.push(`${model}: ${message}`);
        console.warn(`OpenRouter request exception for ${model}:`, message);
      }
    }
  }

  throw new Error(`All OpenRouter AI attempts failed. ${failures.slice(-8).join(" | ")}`);
}

function loadPolicies(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) { console.error("Error reading policies_db.json:", error); }
  return [];
}

function savePolicies(policies: any[]) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(policies, null, 2), "utf-8"); }
  catch (error) { console.error("Error saving policies_db.json:", error); }
}

function loadAuditLogs(): any[] {
  try {
    if (fs.existsSync(SECURITY_LOGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SECURITY_LOGS_FILE, "utf-8"));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) { console.error("Error reading security_audit.json:", error); }
  return [];
}

function addAuditLog(action: string, actor: string, details: string, req: express.Request) {
  const logs = loadAuditLogs();
  logs.unshift({ id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`, timestamp: new Date().toISOString(), action, actor, details, ipAddress: req.ip || "127.0.0.1" });
  try { fs.writeFileSync(SECURITY_LOGS_FILE, JSON.stringify(logs.slice(0, 100), null, 2), "utf-8"); }
  catch (error) { console.error("Failed to save audit log:", error); }
}

app.get("/api/health", (_req, res) => {
  const keys = getOpenRouterKeys();
  res.json({ ok: true, service: "V Shiroya AI Backend", aiProvider: "OpenRouter", openRouterConfigured: keys.length > 0, openRouterKeyCount: keys.length, models: configuredModels, pdfEngine: PDF_ENGINE, timestamp: new Date().toISOString() });
});

app.get("/api/auth/me", (_req, res) => {
  res.json({ user: { id: "acc-1", name: "VIJAY SHIROYA", email: "vijay.ca@policyai.com", firmName: "VIJAY SHIROYA & Co. Chartered Accountants", role: "Senior Accountant / Auditor", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" } });
});

app.post("/api/analyze-policy", async (req, res) => {
  const { fileData, fileName, mimeType, instruction } = req.body || {};
  try {
    if (!fileName) return res.status(400).json({ error: "Filename is required" });
    if (!fileData) return res.status(400).json({ error: "PDF/document data is required" });
    if (!getOpenRouterKeys().length) return res.status(500).json({ error: "OpenRouter API keys are not configured on Render." });
    console.log(`Processing policy document: ${fileName} (${mimeType || "application/pdf"})`);
    const extraction = await callOpenRouterForDocument(fileData, fileName, mimeType || "application/pdf", instruction || "Analyze the complete policy document and extract all fields.");
    addAuditLog("POLICY_ANALYSIS", "VIJAY SHIROYA (CA)", `Analyzed document: ${fileName}`, req);
    res.json({ success: true, extraction });
  } catch (error: any) {
    console.error("Policy AI analysis error:", error);
    res.status(500).json({ error: "AI analysis failed.", details: error?.message || "Unknown OpenRouter error", fileName: fileName || "uploaded_file" });
  }
});

app.get("/api/policies", (req, res) => {
  let policies = loadPolicies();
  const query = String(req.query.q || "").toLowerCase().trim();
  const statusFilter = String(req.query.status || "ALL");
  const providerFilter = String(req.query.provider || "ALL");
  if (query) policies = policies.filter((p: any) => String(p.ownerName || "").toLowerCase().includes(query) || String(p.policyNumber || "").toLowerCase().includes(query) || String(p.phoneNumber || "").toLowerCase().includes(query) || String(p.providerCompany || "").toLowerCase().includes(query) || String(p.policyType || "").toLowerCase().includes(query));
  if (statusFilter !== "ALL") policies = policies.filter((p: any) => p.policyStatus === statusFilter);
  if (providerFilter !== "ALL") policies = policies.filter((p: any) => p.providerCompany === providerFilter);
  res.json({ success: true, count: policies.length, policies });
});

app.post("/api/policies/check-duplicate", (req, res) => {
  const { policyNumber, ownerName, phoneNumber } = req.body || {};
  const policies = loadPolicies();
  const pn = String(policyNumber || "").toLowerCase().trim();
  const owner = String(ownerName || "").toLowerCase().trim();
  const duplicate = policies.find((p: any) => (pn && String(p.policyNumber || "").toLowerCase().trim() === pn) || Boolean(owner && phoneNumber && String(p.ownerName || "").toLowerCase().trim() === owner && p.phoneNumber === phoneNumber));
  res.json({ isDuplicate: Boolean(duplicate), existingPolicy: duplicate || null });
});

app.post("/api/policies", (req, res) => {
  try {
    const policyData = req.body || {};
    const policies = loadPolicies();
    const newPolicy = { ...policyData, id: policyData.id || `pol-${Date.now()}`, createdAt: policyData.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), userId: "acc-1" };
    policies.unshift(newPolicy);
    savePolicies(policies);
    addAuditLog("POLICY_CREATED", "VIJAY SHIROYA (CA)", `Saved policy #${newPolicy.policyNumber || "UNASSIGNED"}`, req);
    res.json({ success: true, policy: newPolicy });
  } catch (error: any) { res.status(500).json({ error: "Failed to save policy record", details: error?.message }); }
});

app.put("/api/policies/:id", (req, res) => {
  try {
    const policies = loadPolicies();
    const index = policies.findIndex((p: any) => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Policy record not found" });
    policies[index] = { ...policies[index], ...req.body, updatedAt: new Date().toISOString() };
    savePolicies(policies);
    addAuditLog("POLICY_UPDATED", "VIJAY SHIROYA (CA)", `Updated policy #${policies[index].policyNumber || "UNASSIGNED"}`, req);
    res.json({ success: true, policy: policies[index] });
  } catch (error: any) { res.status(500).json({ error: "Failed to update policy", details: error?.message }); }
});

app.delete("/api/policies/:id", (req, res) => {
  try {
    const policies = loadPolicies();
    const existing = policies.find((p: any) => p.id === req.params.id);
    if (!existing) return res.status(404).json({ error: "Policy not found" });
    savePolicies(policies.filter((p: any) => p.id !== req.params.id));
    addAuditLog("POLICY_DELETED", "VIJAY SHIROYA (CA)", `Deleted policy #${existing.policyNumber || "UNASSIGNED"}`, req);
    res.json({ success: true, message: "Policy deleted successfully" });
  } catch (error: any) { res.status(500).json({ error: "Failed to delete policy", details: error?.message }); }
});

app.get("/api/stats", (_req, res) => {
  const policies = loadPolicies();
  const currentMonth = new Date().toISOString().slice(0, 7);
  res.json({ totalPolicies: policies.length, activePolicies: policies.filter((p: any) => p.policyStatus === "ACTIVE").length, expiredPolicies: policies.filter((p: any) => p.policyStatus === "EXPIRED").length, expiringSoonPolicies: policies.filter((p: any) => p.policyStatus === "EXPIRING SOON").length, totalPremiumValue: policies.reduce((sum: number, p: any) => sum + (Number(p.premiumAmount) || 0), 0), policiesAddedThisMonth: policies.filter((p: any) => String(p.createdAt || "").startsWith(currentMonth)).length });
});

app.get("/api/security/audit", (_req, res) => res.json({ success: true, logs: loadAuditLogs() }));

let notificationHistoryLogs: any[] = [];
app.post("/api/notifications/send-alert", (req, res) => {
  try {
    const { policyIds, channel = "EMAIL", customMessage } = req.body || {};
    const policies = loadPolicies();
    const today = new Date();
    const targetPolicies = policies.filter((p: any) => {
      if (Array.isArray(policyIds) && policyIds.length) return policyIds.includes(p.id);
      if (p.policyStatus === "EXPIRING SOON") return true;
      if (!p.endDate) return false;
      const days = Math.ceil((new Date(p.endDate).getTime() - today.getTime()) / 86400000);
      return days >= 0 && days <= 30;
    });
    if (!targetPolicies.length) return res.status(400).json({ success: false, message: "No policies found for alert dispatch." });
    const alerts = targetPolicies.map((p: any) => {
      const daysLeft = p.endDate ? Math.ceil((new Date(p.endDate).getTime() - today.getTime()) / 86400000) : 30;
      const alert = { id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, policyId: p.id, policyNumber: p.policyNumber, ownerName: p.ownerName, recipientEmail: p.email || `${String(p.ownerName || "client").toLowerCase().replace(/\s+/g, ".")}@client-insurance.com`, recipientPhone: p.phoneNumber || "N/A", channel, subject: `URGENT: 30-Day Policy Renewal Notice - ${p.providerCompany} Policy #${p.policyNumber}`, body: customMessage || `Dear ${p.ownerName}, your ${p.providerCompany} policy #${p.policyNumber} expires in ${daysLeft} days on ${p.endDate || "upcoming date"}.`, status: "DELIVERED", sentAt: new Date().toISOString(), daysLeft };
      notificationHistoryLogs.unshift(alert);
      return alert;
    });
    addAuditLog("30DAY_EXPIRY_ALERT_DISPATCH", "V Shiroya Notification Service", `Dispatched ${alerts.length} alerts`, req);
    res.json({ success: true, message: `Dispatched ${alerts.length} alert(s).`, countSent: alerts.length, alerts });
  } catch (error: any) { res.status(500).json({ error: "Failed to process notification alert request", details: error?.message }); }
});
app.get("/api/notifications/history", (_req, res) => res.json({ success: true, count: notificationHistoryLogs.length, logs: notificationHistoryLogs }));

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`V Shiroya Express Server running on 0.0.0.0:${PORT}`);
    console.log(`OpenRouter keys configured: ${getOpenRouterKeys().length}`);
    console.log(`OpenRouter models: ${configuredModels.join(", ")}`);
    console.log(`PDF engine: ${PDF_ENGINE}`);
  });
}

startServer().catch((error) => { console.error("Server startup failed:", error); process.exit(1); });
