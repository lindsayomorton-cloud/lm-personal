// POST /api/ask — the "Ask my résumé" assistant on linsmeetsworld.com.
// Runs as a Cloudflare Pages Function. Needs the ANTHROPIC_API_KEY secret set in
// Cloudflare: Workers & Pages → this project → Settings → Variables and Secrets.
//
// The browser sends only the visitor's words. The rules and Lindsay's profile live
// here, so the endpoint can only answer about Lindsay, never act as a general chatbot.
import Anthropic from "@anthropic-ai/sdk";
import { ASK_RULES, FIT_RULES } from "../../bot/prompts.js";

const MODEL = "claude-opus-5-5";
const ALLOWED_ORIGINS = ["https://linsmeetsworld.com", "https://www.linsmeetsworld.com"];
const MAX_TURNS = 8;          // recent chat turns kept per question
const MAX_QUESTION = 1000;    // characters per chat message
const MAX_ROLE = 12000;       // characters of pasted job description

const text = (body, status) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

function buildRequest(body) {
  if (body.mode === "fit") {
    const role = typeof body.role === "string" ? body.role.trim().slice(0, MAX_ROLE) : "";
    if (!role) return null;
    return {
      system: FIT_RULES,
      messages: [{ role: "user", content: "ROLE\n" + role }],
      max_tokens: 6000,
      output_config: { effort: "medium" },
    };
  }
  const turns = Array.isArray(body.turns) ? body.turns.slice(-MAX_TURNS) : [];
  const messages = turns
    .filter((t) => t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string" && t.content.trim())
    .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_QUESTION) }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return null;
  return { system: ASK_RULES, messages, max_tokens: 1500, output_config: { effort: "low" } };
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return text("Not allowed.", 403);
  if (!env.ANTHROPIC_API_KEY) return text("The assistant isn't set up yet.", 503);

  let body;
  try { body = await request.json(); } catch { return text("Bad request.", 400); }
  const params = buildRequest(body || {});
  if (!params) return text("Bad request.", 400);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 });
  const stream = client.beta.messages.stream({
    model: MODEL,
    // If a safety check declines a request, re-run it on a fallback model instead of failing.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    ...params,
  });

  // Stream plain text to the browser as it's written.
  const enc = new TextEncoder();
  const out = new ReadableStream({
    start(controller) {
      stream.on("text", (delta) => controller.enqueue(enc.encode(delta)));
      stream.finalMessage()
        .then((msg) => {
          if (msg.stop_reason === "refusal") controller.enqueue(enc.encode("\n\nI can't help with that one. Try asking about Lindsay's experience."));
          controller.close();
        })
        .catch((err) => {
          console.error("ask failed", err && err.status, err && err.message);
          controller.error(err);
        });
    },
    cancel() { stream.abort(); },
  });
  return new Response(out, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
