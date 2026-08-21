import fs from "node:fs";
import path from "node:path";

const serverFile = path.resolve("dist/server.cjs");
if (!fs.existsSync(serverFile)) {
  console.warn("render-ai-fix: dist/server.cjs not found; skipping");
  process.exit(0);
}

let source = fs.readFileSync(serverFile, "utf8");

// Keep the AI provider OpenRouter-only. Use an OpenAI model through OpenRouter
// instead of the previous Google/Gemini default. Render still supplies the
// OPENROUTER_API_KEY_* secrets; no Google API key is used.
source = source.replaceAll("google/gemini-3-flash-preview", "openai/gpt-4.1-mini");

// Make the model list resilient: configured models are tried first, followed
// by known OpenRouter PDF-capable fallbacks.
source = source.replace(
  /const configuredModels = \((.*?)\)\n\s*\.split\(/s,
  "const configuredModels = Array.from(new Set((($1) || \"openai/gpt-4.1-mini,openai/gpt-4o-mini\").split("
);

// Some providers may return content in a structured array. Normalize it to
// text before JSON parsing so a successful AI response is not reported as a failure.
const oldParser = 'const text = data?.choices?.[0]?.message?.content;\n        const parsed = parseJsonSafely(typeof text === "string" ? text : JSON.stringify(text || {}));';
const newParser = `const rawContent = data?.choices?.[0]?.message?.content;
        const text = Array.isArray(rawContent)
          ? rawContent.map((part) => typeof part === "string" ? part : (part?.text || "")).join("\\n")
          : rawContent;
        const parsed = parseJsonSafely(typeof text === "string" ? text : JSON.stringify(text || {}));`;
if (source.includes(oldParser)) source = source.replace(oldParser, newParser);

// Allow a separately hosted Firebase/static frontend to call the Render API.
// Credentials are not enabled because the analyzer uses bearer keys only on
// the server and the browser never receives those keys.
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
console.log("render-ai-fix: patched dist/server.cjs successfully");
