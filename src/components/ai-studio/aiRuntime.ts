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

async function readTextStreamLines(args: {
  stream: ReadableStream<Uint8Array>;
  signal?: AbortSignal;
  onLine: (line: string) => void;
}) {
  const reader = args.stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (args.signal?.aborted) break;

    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      args.onLine(line);
    }
  }

  if (buffer.trim()) args.onLine(buffer);
}

export async function streamRuntimeChat(args: {
  runtime: AiRuntime;
  model: string;
  messages: RuntimeMessage[];
  ollamaBaseUrl: string;
  openRouterApiKey: string;
  signal?: AbortSignal;
  onDelta: (deltaText: string) => void;
}) {
  const model = String(args.model || "").trim();
  if (!model) throw new Error("Pick a model first.");

  // OLLAMA
  if (args.runtime === "ollama") {
    const url = `${normalizeBaseUrl(args.ollamaBaseUrl)}/api/chat`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: true,
        messages: args.messages,
      }),
      signal: args.signal,
    });

    if (!resp.ok || !resp.body) {
      const t = await resp.text().catch(() => "");
      throw new Error(`Ollama chat failed (${resp.status}). ${t}`.trim());
    }

    let full = "";
    await readTextStreamLines({
      stream: resp.body,
      signal: args.signal,
      onLine: (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        try {
          const parsed = JSON.parse(trimmed) as { message?: { content?: string }; done?: boolean };
          const chunk = String(parsed.message?.content || "");
          if (chunk) {
            full += chunk;
            args.onDelta(chunk);
          }
        } catch {
          // ignore broken lines
        }
      },
    });

    if (!full.trim()) throw new Error(args.signal?.aborted ? "Stopped." : "Ollama returned an empty response.");
    return full;
  }

  // OPENROUTER (OpenAI-compatible SSE)
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
        stream: true,
      }),
      signal: args.signal,
    });

    if (!resp.ok || !resp.body) {
      const t = await resp.text().catch(() => "");
      throw new Error(resp.status === 401 ? "Invalid OpenRouter key." : `OpenRouter chat failed (${resp.status}). ${t}`.trim());
    }

    let full = "";
    await readTextStreamLines({
      stream: resp.body,
      signal: args.signal,
      onLine: (line) => {
        let l = line;
        if (l.endsWith("\r")) l = l.slice(0, -1);
        if (!l.startsWith("data: ")) return;
        const data = l.slice(6).trim();
        if (!data || data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
          const chunk = String(parsed.choices?.[0]?.delta?.content || "");
          if (chunk) {
            full += chunk;
            args.onDelta(chunk);
          }
        } catch {
          // ignore partials
        }
      },
    });

    if (!full.trim()) throw new Error(args.signal?.aborted ? "Stopped." : "OpenRouter returned an empty response.");
    return full;
  }

  throw new Error("AI runtime is disabled.");
}
