import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 10000);
const DIST = path.join(process.cwd(), "dist");
const DATA_FILE = path.join(process.cwd(), "policies_db.json");

// Production frontend + local development origins. Render can override this with
// ALLOWED_ORIGINS as a comma-separated environment variable.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  "https://v-shiroya-insurance.web.app,https://v-shiroya-insurance.firebaseapp.com,https://v-shiroya-policy.onrender.com,http://localhost:5173")
  .split(",")
  .map((x) => x.trim().replace(/\/$/, ""))
  .filter(Boolean);

// CORS must run before every API route so normal responses, errors and OPTIONS
// preflight requests all receive the required headers.
app.use((req, res, next) => {
  const origin = typeof req.headers.origin === "string"
    ? req.headers.origin.replace(/\/$/, "")
    : "";

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

function getKeys(): string[] {
  const keys: string[] = [];
  for (const key of (process.env.OPENROUTER_API_KEYS || "").split(/[,\n\r]+/)) {
    if (key.trim()) keys.push(key.trim());
  }
  for (let i = 1; i <= 12; i++) {
    const key = process.env[`OPENROUTER_API_KEY_${i}`]?.trim();
    if (key) keys.push(key);
  }
  if (process.env.OPENROUTER_API_KEY?.trim()) keys.push(process.env.OPENROUTER_API_KEY.trim());
  return [...new Set(keys)];
}

const models = (process.env.OPENROUTER_MODELS || process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini")
  .split(/[,\n\r]+/)
  .map((x) => x.trim())
  .filter(Boolean);

// Mistral OCR is the safest default for scanned/image-only policy PDFs.
const pdfEngine = process.env.OPENROUTER_PDF_ENGINE || "mistral-ocr";
let rotation = 0;

function parseJson(content: unknown): any | null {
  if (typeof content !== "string") return content && typeof content === "object" ? content : null;
  let text = content.trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  try { return JSON.parse(text); } catch {}

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch {}
  }
  return null;
}

function loadPolicies(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error("Policy DB read error", error);
  }
  return [];
}

function savePolicies(data: any[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

async function analyzeDocument(fileData: string, fileName: string, mimeType: string, instruction: string) {
  const keys = getKeys();
  if (!keys.length) throw new Error("No OpenRouter API key is configured on Render.");

  const clean = fileData.includes("base64,") ? fileData.split("base64,").pop()! : fileData;
  if (!clean) throw new Error("Uploaded document is empty.");

  const isPdf = mimeType.toLowerCase() === "application/pdf" || /\.pdf$/i.test(fileName);
  const content: any[] = [{
    type: "text",
    text: `You are an insurance policy document analyzer. Read the complete document carefully and return ONLY one valid JSON object. Extract policy number, insurer, owner/insured person, policy type, start date, end date, premium amount, sum assured/sum insured, nominee, phone, email, address, policy status, and all other useful details. Do not invent data. Instruction: ${instruction || "Analyze the complete policy document."}`
  }];

  if (isPdf) {
    content.push({
      type: "file",
      file: {
        filename: fileName || "policy.pdf",
        file_data: `data:application/pdf;base64,${clean}`
      }
    });
  } else {
    content.push({
      type: "image_url",
      image_url: { url: `data:${mimeType || "image/jpeg"};base64,${clean}` }
    });
  }

  const orderedKeys = keys.slice(rotation % keys.length).concat(keys.slice(0, rotation % keys.length));
  rotation = (rotation + 1) % keys.length;
  const failures: string[] = [];

  for (const key of orderedKeys) {
    for (const model of models) {
      const payload: any = {
        model,
        messages: [
          { role: "system", content: "Return strict valid JSON only. Never wrap JSON in explanations." },
          { role: "user", content }
        ],
        temperature: 0.1,
        max_tokens: Number(process.env.OPENROUTER_MAX_TOKENS || 12000),
        response_format: { type: "json_object" }
      };

      if (isPdf) {
        payload.plugins = [{ id: "file-parser", pdf: { engine: pdfEngine } }];
      }

      // Some models/providers reject response_format. Retry the same request
      // without it before moving to another model/key.
      for (const withStructuredOutput of [true, false]) {
        const requestPayload = withStructuredOutput
          ? payload
          : (() => {
              const copy = { ...payload };
              delete copy.response_format;
              return copy;
            })();

        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.APP_URL || "https://v-shiroya-insurance.web.app",
              "X-Title": "V-SHIROYA Policy AI"
            },
            body: JSON.stringify(requestPayload),
            signal: AbortSignal.timeout(Number(process.env.OPENROUTER_TIMEOUT_MS || 180000))
          });

          if (!response.ok) {
            const errorText = (await response.text()).replace(/\s+/g, " ").slice(0, 800);
            failures.push(`${model} HTTP ${response.status}: ${errorText}`);
            if (withStructuredOutput && response.status === 400) continue;
            break;
          }

          const data: any = await response.json();
          const parsed = parseJson(data?.choices?.[0]?.message?.content);
          if (parsed) return parsed;

          failures.push(`${model}: returned invalid JSON`);
          break;
        } catch (error: any) {
          failures.push(`${model}: ${error?.message || String(error)}`);
          break;
        }
      }
    }
  }

  throw new Error(`All OpenRouter attempts failed. ${failures.slice(-8).join(" | ")}`);
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "V-SHIROYA Policy AI",
    provider: "OpenRouter",
    keyCount: getKeys().length,
    models,
    pdfEngine,
    timestamp: new Date().toISOString()
  });
});

const analyzeHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { fileData, fileName, mimeType, instruction } = req.body || {};
    if (!fileName) return res.status(400).json({ success: false, error: "Filename is required." });
    if (!fileData) return res.status(400).json({ success: false, error: "PDF/document data is required." });

    const extraction = await analyzeDocument(
      fileData,
      fileName,
      mimeType || "application/pdf",
      instruction || ""
    );

    return res.json({ success: true, extraction });
  } catch (error: any) {
    console.error("Policy analysis failed:", error?.message || error);
    return res.status(502).json({
      success: false,
      error: "AI analysis failed.",
      details: error?.message || "Unknown backend error"
    });
  }
};

app.post("/api/analyze-policy", analyzeHandler);
app.post("/analyze-policy", analyzeHandler);

app.get("/api/stats", (_req, res) => {
  const policies = loadPolicies();
  res.json({
    totalPolicies: policies.length,
    activePolicies: policies.filter((p) => p.policyStatus === "ACTIVE").length,
    expiredPolicies: policies.filter((p) => p.policyStatus === "EXPIRED").length,
    expiringSoonPolicies: policies.filter((p) => p.policyStatus === "EXPIRING SOON").length,
    totalPremiumValue: policies.reduce((sum, p) => sum + (Number(p.premiumAmount) || 0), 0)
  });
});

app.get("/api/policies", (_req, res) => res.json({ success: true, policies: loadPolicies() }));
app.post("/api/policies", (req, res) => {
  const policies = loadPolicies();
  const policy = {
    ...req.body,
    id: req.body?.id || `pol-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  policies.unshift(policy);
  savePolicies(policies);
  res.json({ success: true, policy });
});
app.put("/api/policies/:id", (req, res) => {
  const policies = loadPolicies();
  const i = policies.findIndex((p) => p.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: "Policy not found" });
  policies[i] = { ...policies[i], ...req.body, updatedAt: new Date().toISOString() };
  savePolicies(policies);
  res.json({ success: true, policy: policies[i] });
});
app.delete("/api/policies/:id", (req, res) => {
  const policies = loadPolicies();
  savePolicies(policies.filter((p) => p.id !== req.params.id));
  res.json({ success: true });
});

app.use("/api", (_req, res) => res.status(404).json({ success: false, error: "API endpoint not found" }));
app.use(express.static(DIST));
app.get("*", (_req, res) => res.sendFile(path.join(DIST, "index.html")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`V-SHIROYA backend listening on 0.0.0.0:${PORT}`);
  console.log(`OpenRouter keys: ${getKeys().length}; models: ${models.join(", ")}; PDF engine: ${pdfEngine}`);
});
