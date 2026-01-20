import { z } from "zod";

export const AiRuntimeSchema = z.union([z.literal("disabled"), z.literal("ollama"), z.literal("openrouter_byok")]);
export type AiRuntime = z.infer<typeof AiRuntimeSchema>;

export type RuntimeMessage = { role: "user" | "assistant"; content: string };

function normalizeBaseUrl(input: string) {
  const raw = String(input || "").trim();
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export async function fetchOllamaModels(baseUrl: string) {
  const url = `${normalizeBaseUrl(baseUrl)}/api/tags`;
  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) throw new Error(`Ollama models request failed (${resp.status}).`);
  const data = (await resp.json()) as { models?: Array<{ name?: string }> };
  const models = (data.models ?? []).map((m) => String(m.name || "").trim()).filter(Boolean);
  return Array.from(new Set(models));
}

export async function fetchOpenRouterModels(apiKey: string) {
  const key = String(apiKey || "").trim();
  if (!key) throw new Error("Missing OpenRouter API key.");
  const resp = await fetch("https://openrouter.ai/api/v1/models", {
    method: "GET",
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!resp.ok) throw new Error(resp.status === 401 ? "Invalid OpenRouter key." : `OpenRouter request failed (${resp.status}).`);
  const data = (await resp.json()) as { data?: Array<{ id?: string }> };
  const ids = (data.data ?? []).map((m) => String(m.id || "").trim()).filter(Boolean);
  return Array.from(new Set(ids));
}

export async function sendRuntimeChat(args: {
  runtime: AiRuntime;
  model: string;
  messages: RuntimeMessage[];
  ollamaBaseUrl: string;
  openRouterApiKey: string;
  signal?: AbortSignal;
}) {
  const model = String(args.model || "").trim();
  if (!model) throw new Error("Pick a model first.");

  if (args.runtime === "ollama") {
    const url = `${normalizeBaseUrl(args.ollamaBaseUrl)}/api/chat`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: args.messages,
      }),
      signal: args.signal,
    });

    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      throw new Error(`Ollama chat failed (${resp.status}). ${t}`.trim());
    }

    const data = (await resp.json()) as { message?: { content?: string } };
    const content = String(data.message?.content || "");
    if (!content.trim()) throw new Error("Ollama returned an empty response.");
    return content;
  }

  if (args.runtime === "openrouter_byok") {
    const key = String(args.openRouterApiKey || "").trim();
    if (!key) throw new Error("Paste an OpenRouter API key first.");

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: args.messages,
      }),
      signal: args.signal,
    });

    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      throw new Error(resp.status === 401 ? "Invalid OpenRouter key." : `OpenRouter chat failed (${resp.status}). ${t}`.trim());
    }

    const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = String(data.choices?.[0]?.message?.content || "");
    if (!content.trim()) throw new Error("OpenRouter returned an empty response.");
    return content;
  }

  throw new Error("AI runtime is disabled.");
}
