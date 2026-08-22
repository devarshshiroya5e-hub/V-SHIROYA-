import fs from "node:fs";
import path from "node:path";

const serverFile = path.resolve("dist/server.cjs");
if (!fs.existsSync(serverFile)) {
  console.error("render-ai-fix: dist/server.cjs not found");
  process.exit(1);
}

let source = fs.readFileSync(serverFile, "utf8");

// OpenRouter-only: no Google API key is used.
source = source.replaceAll("google/gemini-3-flash-preview", "openai/gpt-4.1-mini");

const oldParser = 'const text = data?.choices?.[0]?.message?.content;\n        const parsed = parseJsonSafely(typeof text === "string" ? text : JSON.stringify(text || {}));';
const newParser = `const rawContent = data?.choices?.[0]?.message?.content;
        const text = Array.isArray(rawContent)
          ? rawContent.map((part) => typeof part === "string" ? part : (part?.text || "")).join("\\n")
          : rawContent;
        const parsed = parseJsonSafely(typeof text === "string" ? text : JSON.stringify(text || {}));`;
source = source.replace(oldParser, newParser);

// Firebase Hosting and Render are different origins. Always install CORS before routes.
if (!source.includes("__V_SHIROYA_CORS__")) {
  const anchor = 'app.use(express.urlencoded({ limit: "100mb", extended: true }));';
  const corsBlock = `${anchor}

// __V_SHIROYA_CORS__
const allowedOrigins = new Set([
  "https://v-shiroya-insurance.web.app",
  "https://v-shiroya-insurance.firebaseapp.com",
  "https://v-shiroya-policy.onrender.com",
  ...String(process.env.CORS_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean)
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.has(origin) || origin.endsWith(".web.app") || origin.endsWith(".firebaseapp.com") || origin.endsWith(".onrender.com"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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

fs.writeFileSync(serverFile, source, "utf8");

// Keep the existing UI unchanged, but route AI analysis directly to Render.
const assetsDir = path.resolve("dist/assets");
if (fs.existsSync(assetsDir)) {
  for (const name of fs.readdirSync(assetsDir)) {
    if (!name.endsWith(".js")) continue;
    const file = path.join(assetsDir, name);
    let js = fs.readFileSync(file, "utf8");
    if (js.includes("/api/analyze-policy")) {
      js = js.replaceAll("/api/analyze-policy", "https://v-shiroya-policy.onrender.com/api/analyze-policy");
      fs.writeFileSync(file, js, "utf8");
    }
  }
}

console.log("render-ai-fix: OpenRouter, CORS, and frontend API patches applied successfully");
