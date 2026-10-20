// Shared between the API route and the browser.
export const INPUT_LIMITS = { questionChars: 500, jobChars: 8000, jobMinChars: 40, turns: 8 } as const;

export const CUT_MARKER = "\n[[__cut__]]";

export const UNAVAILABLE_MESSAGES: Record<string, string> = {
  disabled: "The assistant is resting right now, so here's the pitch Viktoria wrote.",
  rate_limited_short: "That's a lot of questions in a few minutes. Try again in about ten minutes.",
  rate_limited_daily: "You've reached today's limit for the assistant. Viktoria is happy to answer by email.",
  busy: "The assistant has had a busy day and is paused until tomorrow. Viktoria is happy to answer by email.",
  upstream: "The assistant couldn't answer just now. Try again in a moment.",
  timeout: "The assistant took too long to answer. Try again in a moment.",
  conversation_full: "That's the limit for one conversation. Start a new one to keep going.",
  preview: "AI answers are switched off in this preview. They go live once the site is deployed with an API key.",
  match_failed: "Couldn't read that job ad. Try pasting just the requirements section.",
};

// These leave the panel usable: the visitor can retry or reset.
export const RECOVERABLE = new Set(["conversation_full", "match_failed", "upstream", "timeout", "preview"]);
