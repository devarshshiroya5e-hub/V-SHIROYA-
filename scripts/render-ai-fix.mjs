import fs from "node:fs";
import path from "node:path";

const serverFile = path.resolve("dist/server.cjs");
if (!fs.existsSync(serverFile)) {
  console.error("render-ai-fix: dist/server.cjs not found");
  process.exit(1);
}

let source = fs.readFileSync(serverFile, "utf8");

// Keep the backend OpenRouter-only and use a fast model that can be configured in Render.
source = source.replaceAll("google/gemini-3-flash-preview", "openai/gpt-4.1-mini");

// Robust CORS must exist in the ACTUAL Render build, before every API route.
if (!source.includes("__V_SHIROYA_CORS_V2__")) {
  const anchor = 'app.use(express.urlencoded({ limit: "100mb", extended: true }));';
  const corsBlock = `${anchor}

// __V_SHIROYA_CORS_V2__
const allowedOrigins = new Set([
  "https://v-shiroya-insurance.web.app",
  "https://v-shiroya-insurance.firebaseapp.com",
  "https://v-shiroya-policy.onrender.com",
  ...String(process.env.CORS_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean)
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.has(origin) || origin.endsWith(".web.app") || origin.endsWith(".firebaseapp.com"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "false");
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});`;
  if (!source.includes(anchor)) {
    console.error("render-ai-fix: CORS anchor not found");
    process.exit(1);
  }
  source = source.replace(anchor, corsBlock);
}

// Accept both API path variants. This prevents an HTML SPA fallback when an old deployed
// frontend uses /analyze-policy while the current frontend uses /api/analyze-policy.
source = source.replace(
  'app.post("/api/analyze-policy", async (req, res) => {',
  'const analyzePolicyHandler = async (req, res) => {'
);
source = source.replace(
  '});\n\napp.get("/api/policies", (req, res) => {',
  '};\napp.post("/api/analyze-policy", analyzePolicyHandler);\napp.post("/analyze-policy", analyzePolicyHandler);\n\napp.get("/api/policies", (req, res) => {'
);

// Never return index.html for a missing API route. JSON parsing errors like
// Unexpected token < usually happen when an API request receives the SPA HTML shell.
const apiFallbackAnchor = '    app.use(express.static(distPath));\n    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));';
if (source.includes(apiFallbackAnchor)) {
  source = source.replace(apiFallbackAnchor, `    app.use(express.static(distPath));
    app.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint not found" }));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));`);
}

// Make backend responses diagnosable and guarantee JSON for malformed request bodies.
if (!source.includes("__V_SHIROYA_JSON_ERROR_V1__")) {
  const startAnchor = 'async function startServer() {';
  const errorBlock = `// __V_SHIROYA_JSON_ERROR_V1__
app.use((err, _req, res, next) => {
  if (err && (err.type === "entity.parse.failed" || err instanceof SyntaxError)) {
    return res.status(400).json({ error: "Invalid JSON request body" });
  }
  next(err);
});

async function startServer() {`;
  if (source.includes(startAnchor)) source = source.replace(startAnchor, errorBlock);
}

fs.writeFileSync(serverFile, source, "utf8");

// Keep the existing UI/design untouched. Only change API URLs in the built JavaScript.
const assetsDir = path.resolve("dist/assets");
const apiBase = "https://v-shiroya-policy.onrender.com";
const backendPaths = [
  "/api/analyze-policy",
  "/api/stats",
  "/api/policies",
  "/api/security/audit",
  "/api/notifications",
  "/api/auth/me"
];
if (fs.existsSync(assetsDir)) {
  for (const name of fs.readdirSync(assetsDir)) {
    if (!name.endsWith(".js")) continue;
    const file = path.join(assetsDir, name);
    let js = fs.readFileSync(file, "utf8");
    for (const endpoint of backendPaths) {
      js = js.replaceAll(`\"${endpoint}`, `\"${apiBase}${endpoint}`);
      js = js.replaceAll(`'${endpoint}`, `'${apiBase}${endpoint}`);
      js = js.replaceAll('`' + endpoint, '`' + apiBase + endpoint);
    }
    fs.writeFileSync(file, js, "utf8");
  }
}

console.log("render-ai-fix: backend CORS, API fallbacks, JSON errors, aliases, and non-visual API routing applied");
