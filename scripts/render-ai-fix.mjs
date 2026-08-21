import fs from "node:fs";
import path from "node:path";

const serverFile = path.resolve("dist/server.cjs");
if (!fs.existsSync(serverFile)) {
  console.warn("render-ai-fix: dist/server.cjs not found; skipping");
  process.exit(0);
}

let source = fs.readFileSync(serverFile, "utf8");

// OpenRouter-only: replace the old Google/Gemini default with an OpenAI model
// routed through OpenRouter. No Google API key is used.
source = source.replaceAll("google/gemini-3-flash-preview", "openai/gpt-4.1-mini");

// Some providers may return message.content as an array. Normalize it before
// JSON parsing so a valid AI answer is not incorrectly treated as a failure.
const oldParser = 'const text = data?.choices?.[0]?.message?.content;\n        const parsed = parseJsonSafely(typeof text === "string" ? text : JSON.stringify(text || {}));';
const newParser = `const rawContent = data?.choices?.[0]?.message?.content;
        const text = Array.isArray(rawContent)
          ? rawContent.map((part) => typeof part === "string" ? part : (part?.text || "")).join("\\n")
          : rawContent;
        const parsed = parseJsonSafely(typeof text === "string" ? text : JSON.stringify(text || {}));`;
if (source.includes(oldParser)) source = source.replace(oldParser, newParser);

// Allow a separately hosted Firebase/static frontend to call the Render API.
// API keys remain server-side and are never exposed to the browser.
const bodyLine = 'app.use(express.urlencoded({ limit: "100mb", extended: true }));';
const corsBlock = `${bodyLine}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});`;
if (source.includes(bodyLine) && !source.includes("Access-Control-Allow-Origin")) {
  source = source.replace(bodyLine, corsBlock);
}

fs.writeFileSync(serverFile, source, "utf8");

// If the frontend is served from Firebase/static hosting, route only the AI
// analysis call to the Render backend. The UI and all visual code remain unchanged.
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

console.log("render-ai-fix: patched backend and frontend AI API successfully");
