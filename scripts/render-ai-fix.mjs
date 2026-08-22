import fs from "node:fs";
import path from "node:path";

const serverFile = path.resolve("dist/server.cjs");
if (!fs.existsSync(serverFile)) {
  console.error("render-ai-fix: dist/server.cjs not found");
  process.exit(1);
}

let source = fs.readFileSync(serverFile, "utf8");

// Keep the backend OpenRouter-only and use a fast default model.
source = source.replaceAll("google/gemini-3-flash-preview", "openai/gpt-4.1-mini");

// IMPORTANT: Do not depend on an exact esbuild output string. The previous script failed
// because esbuild changed quote/whitespace formatting and the old CORS anchor was not found.
if (!source.includes("__V_SHIROYA_CORS_V3__")) {
  const corsBlock = `
// __V_SHIROYA_CORS_V3__
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
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});
`;

  // Insert before the first application data declaration. This survives esbuild formatting.
  const dataAnchor = /const\s+DATA_FILE\s*=\s*path\.join/;
  const match = source.match(dataAnchor);
  if (!match || match.index === undefined) {
    console.error("render-ai-fix: CORS insertion point not found");
    process.exit(1);
  }
  source = source.slice(0, match.index) + corsBlock + source.slice(match.index);
}

// Never return index.html for an unknown API route. This prevents HTML being parsed as JSON.
if (!source.includes("__V_SHIROYA_API_404_V2__")) {
  const staticAnchor = 'app.use(express.static(distPath));';
  const staticIndex = source.indexOf(staticAnchor);
  if (staticIndex !== -1) {
    const insertAt = staticIndex + staticAnchor.length;
    const api404 = `\napp.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint not found", code: "API_NOT_FOUND" })); // __V_SHIROYA_API_404_V2__`;
    source = source.slice(0, insertAt) + api404 + source.slice(insertAt);
  }
}

// Guarantee JSON for malformed JSON request bodies.
if (!source.includes("__V_SHIROYA_JSON_ERROR_V2__")) {
  const startPattern = /async function startServer\s*\(\s*\)\s*\{/;
  const startMatch = source.match(startPattern);
  if (startMatch && startMatch.index !== undefined) {
    const errorBlock = `// __V_SHIROYA_JSON_ERROR_V2__
app.use((err, _req, res, next) => {
  if (err && (err.type === "entity.parse.failed" || err instanceof SyntaxError)) {
    return res.status(400).json({ error: "Invalid JSON request body", code: "INVALID_JSON" });
  }
  next(err);
});

`;
    source = source.slice(0, startMatch.index) + errorBlock + source.slice(startMatch.index);
  }
}

fs.writeFileSync(serverFile, source, "utf8");

// Keep the existing UI/design untouched. Only point API calls to the Render backend.
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

console.log("render-ai-fix: robust CORS and backend API patch applied");
