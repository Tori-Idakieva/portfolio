import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type Unavailable =
  | "disabled"
  | "rate_limited_short"
  | "rate_limited_daily"
  | "busy"
  | "upstream"
  | "timeout"
  | "conversation_full"
  | "match_failed";

// The Vercel Marketplace integration names these KV_REST_API_*; a direct Upstash setup uses UPSTASH_REDIS_REST_*.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const short = redis && new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(6, "10 m"), prefix: "rl:short" });
const daily = redis && new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(50, "1 d"), prefix: "rl:day" });
const global = redis && new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(1500, "1 d"), prefix: "rl:global" });

// Daily token budget across all visitors. Cache reads count at a tenth, as they cost about a tenth.
const DAILY_TOKENS = Number(process.env.DAILY_TOKEN_BUDGET) || 600_000;
const tokenKey = () => `tok:${new Date().toISOString().slice(0, 10)}`;

export type Usage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

export async function recordUsage(u: Usage): Promise<void> {
  if (!redis) return;
  const used = Math.ceil(
    u.input_tokens + u.output_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) / 10,
  );
  try {
    const key = tokenKey();
    await redis.incrby(key, used);
    await redis.expire(key, 60 * 60 * 48);
  } catch {
    // Counting is best effort; the per-request and daily request caps still apply.
  }
}

// Local development runs without Redis; production without Redis fails closed.
const allowWithoutRedis = process.env.NODE_ENV !== "production";

export async function checkAccess(ip: string): Promise<Unavailable | null> {
  if (process.env.AI_DISABLED === "1") return "disabled";
  if (!redis || !short || !daily || !global) return allowWithoutRedis ? null : "disabled";
  try {
    const [off, tokens] = await Promise.all([redis.get("ai:off"), redis.get<number>(tokenKey())]);
    if (off === "1") return "disabled";
    if (Number(tokens ?? 0) >= DAILY_TOKENS) return "busy";
    const [s, d] = await Promise.all([short.limit(ip), daily.limit(ip)]);
    if (!d.success) return "rate_limited_daily";
    if (!s.success) return "rate_limited_short";
    const g = await global.limit("all");
    if (!g.success) return "busy";
    return null;
  } catch {
    return "disabled";
  }
}

export function clientIp(headers: Headers): string {
  return headers.get("x-real-ip") || headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
