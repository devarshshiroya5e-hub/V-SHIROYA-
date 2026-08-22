import fs from "node:fs";
import path from "node:path";

// This optional post-build patch must never make Render fail. The actual server
// is compiled by the build script; this only adds deployment compatibility.
const serverFile = path.resolve("dist/server.cjs");
if (!fs.existsSync(serverFile)) {
  console.warn("render-ai-fix: dist/server.cjs is not available yet; skipping optional patch");
  process.exit(0);
}

let source = fs.readFileSync(serverFile, "utf8");
source = source.replaceAll("google/gemini-3-flash-preview", "openai/gpt-4.1-mini");

if (!source.includes("__V_SHIROYA_CORS_RENDER__")) {
  const marker = "const DATA_FILE";
  const index = source.indexOf(marker);
  if (index >= 0) {
    const corsBlock = `// __V_SHIROYA_CORS_RENDER__
const allowedOrigins = new Set(["https://v-shiroya-insurance.web.app", "https://v-shiroya-insurance.firebaseapp.com", "https://v-shiroya-policy.onrender.com", ...String(process.env.CORS_ORIGINS || "").split(",").map((v) => v.trim()).filter(Boolean)]);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.has(origin) || origin.endsWith(".web.app") || origin.endsWith(".firebaseapp.com"))) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});
`;
    source = source.slice(0, index) + corsBlock + source.slice(index);
  } else {
    console.warn("render-ai-fix: CORS insertion point not found; continuing without failing deployment");
  }
}

fs.writeFileSync(serverFile, source, "utf8");
console.log("render-ai-fix: optional OpenRouter/CORS compatibility patch completed");
