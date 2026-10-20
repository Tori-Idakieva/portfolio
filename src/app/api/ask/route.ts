import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  AskInput,
  chatPrompt,
  historyTooLong,
  LIMITS,
  MatchOutput,
  matchPrompt,
  MODEL,
  pitchPrompt,
  sanitiseMatch,
  SYSTEM_PROMPT,
} from "@/lib/ai";
import { CUT_MARKER } from "@/lib/shared";
import { checkAccess, clientIp, recordUsage, type Unavailable } from "@/lib/guard";

export const runtime = "nodejs";
export const maxDuration = 30;


const client = new Anthropic({ timeout: LIMITS.timeoutMs, maxRetries: 1 });

// Server-side refusal fallbacks are only offered on these model families.
const fallbackParams = /^claude-(opus|fable|sonnet)-5/.test(MODEL)
  ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
  : {};

const system: Anthropic.Beta.BetaTextBlockParam[] = [
  { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral", ttl: "1h" } },
];

function unavailable(reason: Unavailable, status = 200) {
  return Response.json({ unavailable: reason }, { status });
}

function upstreamReason(err: unknown): Unavailable {
  if (err instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  return "upstream";
}

// Requests are small JSON objects; anything bigger is refused before parsing.
const MAX_BODY_BYTES = 16 * 1024;

// Only this site's own pages may call the endpoint from a browser.
function crossOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") === "cross-site";
  try {
    return new URL(origin).host !== (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return true;
  }
}

async function readBody(req: Request): Promise<string | null> {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES || !req.body) return null;
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (let r = await reader.read(); !r.done; r = await reader.read()) {
    size += r.value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(r.value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function POST(req: Request) {
  if (crossOrigin(req)) return Response.json({ error: "forbidden" }, { status: 403 });
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return Response.json({ error: "unsupported_media_type" }, { status: 415 });
  }
  const raw = await readBody(req);
  if (raw === null) return Response.json({ error: "too_large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = AskInput.safeParse(body);
  if (!parsed.success) {
    if (
      typeof body === "object" && body !== null && (body as { mode?: string }).mode === "chat" &&
      Array.isArray((body as { history?: unknown[] }).history) &&
      (body as { history: unknown[] }).history.length >= LIMITS.turns
    ) {
      return unavailable("conversation_full");
    }
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  const input = parsed.data;
  if (input.mode === "chat" && historyTooLong(input.history)) return unavailable("conversation_full");

  const blocked = await checkAccess(clientIp(req.headers));
  if (blocked) return unavailable(blocked);

  if (input.mode === "match") {
    for (const fewer of [false, true]) {
      try {
        const res = await client.beta.messages.parse({
          model: MODEL,
          max_tokens: LIMITS.maxTokens.match,
          output_config: { effort: "low", format: zodOutputFormat(MatchOutput) },
          system,
          messages: [{ role: "user", content: matchPrompt(input.job, fewer) }],
          ...fallbackParams,
        });
        await recordUsage(res.usage);
        if (res.stop_reason === "refusal") return unavailable("match_failed");
        if (res.parsed_output) return Response.json({ match: sanitiseMatch(res.parsed_output) });
      } catch (err) {
        if (err instanceof Anthropic.APIError || err instanceof Anthropic.APIConnectionError) {
          return unavailable(upstreamReason(err));
        }
        // Unparseable or truncated JSON: retry once with fewer requirements.
      }
    }
    return unavailable("match_failed");
  }

  const content = input.mode === "pitch" ? pitchPrompt(input.role) : chatPrompt(input);
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: LIMITS.maxTokens[input.mode],
    output_config: { effort: "low" },
    system,
    messages: [{ role: "user", content }],
    ...fallbackParams,
  });

  // Wait for the first event so connection errors become a clean JSON response.
  const iterator = stream[Symbol.asyncIterator]();
  let first: IteratorResult<Anthropic.Beta.BetaRawMessageStreamEvent>;
  try {
    first = await iterator.next();
  } catch (err) {
    return unavailable(upstreamReason(err));
  }

  const encoder = new TextEncoder();
  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: Anthropic.Beta.BetaRawMessageStreamEvent) => {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      };
      try {
        if (!first.done) emit(first.value);
        for (let next = await iterator.next(); !next.done; next = await iterator.next()) emit(next.value);
        const final = await stream.finalMessage();
        await recordUsage(final.usage);
        if (final.stop_reason === "max_tokens") controller.enqueue(encoder.encode(CUT_MARKER));
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\nI can't help with that one. Ask me about Viktoria's experience instead."));
        }
      } catch {
        controller.enqueue(encoder.encode(CUT_MARKER));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body$, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
