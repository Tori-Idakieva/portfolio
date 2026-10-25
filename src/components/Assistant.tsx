"use client";

import { useEffect, useRef, useState } from "react";
import { evidenceById, type Role } from "@/content/profile";
import { CUT_MARKER, INPUT_LIMITS, RECOVERABLE, UNAVAILABLE_MESSAGES } from "@/lib/shared";
import type { MatchOutput } from "@/lib/ai";

type Unavailable = { unavailable: string };

export const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW === "1";

// Turns [[evidence-id]] citations into links; unknown ids are dropped.
function Cited({ text }: { text: string }) {
  const parts = text.split(/(\[\[[a-z0-9-]+\]\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[\[([a-z0-9-]+)\]\]$/);
        if (!m) return <span key={i}>{part}</span>;
        const item = evidenceById.get(m[1]);
        if (!item) return null;
        return (
          <a key={i} className="cite" href={`#${item.id}`}>
            {item.title}
          </a>
        );
      })}
    </>
  );
}

async function streamAsk(
  body: object,
  onText: (t: string) => void,
  signal?: AbortSignal,
): Promise<{ cut: boolean } | Unavailable> {
  if (PREVIEW) return { unavailable: "preview" };
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) return { unavailable: "upstream" };
  if (res.headers.get("content-type")?.includes("application/json")) return (await res.json()) as Unavailable;
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onText(text.replace(CUT_MARKER, "").replace(/\[\[[a-z0-9-]*$/, ""));
  }
  return { cut: text.includes(CUT_MARKER) };
}

function Notice({ reason }: { reason: string }) {
  return (
    <p className="notice" role="status">
      {UNAVAILABLE_MESSAGES[reason] ?? UNAVAILABLE_MESSAGES.upstream}{" "}
      {!RECOVERABLE.has(reason) && <a href="#contact">Email Viktoria</a>}
    </p>
  );
}

// The AI is a side door, not the front door: one compact section with two tabs.
export function Assistant({ role }: { role: Role }) {
  const [tab, setTab] = useState<"ask" | "match">("ask");
  return (
    <section className="assistant wrap" id="assistant" aria-labelledby="assistant-title">
      <div className="assistant-head">
        <p className="label">Quick answers</p>
        <h2 id="assistant-title">Ask an AI about Viktoria</h2>
        <p className="muted">
          It answers only from the CV and projects on this page, links its evidence, and says so when it doesn&apos;t know.
        </p>
      </div>
      <div className="assistant-body">
        <div className="tabs" role="tablist" aria-label="Assistant mode">
          <button type="button" role="tab" aria-selected={tab === "ask"} onClick={() => setTab("ask")}>
            Ask a question
          </button>
          <button type="button" role="tab" aria-selected={tab === "match"} onClick={() => setTab("match")}>
            Match a job ad
          </button>
        </div>
        <div role="tabpanel">{tab === "ask" ? <AskPanel role={role} /> : <MatchPanel />}</div>
      </div>
    </section>
  );
}

function MatchPanel() {
  const [job, setJob] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MatchOutput | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    setResult(null);
    if (PREVIEW) {
      setNotice("preview");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "match", job }),
      });
      const data = (await res.json()) as { match?: MatchOutput } & Partial<Unavailable>;
      if (data.match) setResult(data.match);
      else setNotice(data.unavailable ?? "upstream");
    } catch {
      setNotice("upstream");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="match" onSubmit={submit}>
      <label htmlFor="job">Paste a job description to see how Viktoria matches each requirement</label>
      <textarea
        id="job"
        value={job}
        onChange={(e) => setJob(e.target.value)}
        maxLength={INPUT_LIMITS.jobChars}
        rows={5}
        placeholder="We're looking for a senior engineer who…"
      />
      <div className="form-row">
        <button type="submit" className="btn" disabled={busy || job.trim().length < INPUT_LIMITS.jobMinChars}>
          {busy ? "Matching…" : "Match this role"}
        </button>
        <span className="hint">{job.length}/{INPUT_LIMITS.jobChars}. Sent to Claude to answer, not stored by this site.</span>
      </div>
      {notice && <Notice reason={notice} />}
      {result && (
        <div className="match-result" aria-live="polite">
          <p className="match-summary">
            <Cited text={result.summary} />
          </p>
          <ol className="reqs" tabIndex={0} aria-label="Requirements">
            {result.requirements.map((r, i) => (
              <li key={i} data-strength={r.strength}>
                <span className="strength">{r.strength === "strong" ? "Strong" : r.strength === "partial" ? "Partial" : "Gap"}</span>
                <div>
                  <p className="req">
                    <Cited text={r.requirement} />
                  </p>
                  <p>
                    <Cited text={r.explanation} />
                  </p>
                  {r.evidence.length > 0 && (
                    <p className="req-evidence">
                      {r.evidence.map((id) => (
                        <a key={id} className="cite" href={`#${id}`}>
                          {evidenceById.get(id)?.title}
                        </a>
                      ))}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </form>
  );
}

type Turn = { q: string; a: string; cut?: boolean };

const STARTERS: Record<Role, string[]> = {
  all: ["What kind of team does Viktoria do best in?", "What AI products has Viktoria built?", "Where does Viktoria work now?"],
  frontend: ["How does Viktoria approach accessibility?", "What's the most complex UI Viktoria has built?", "Has Viktoria built data visualisations?"],
  product: ["How does Viktoria work with users?", "Tell me about the Vynrr PoC.", "How does Viktoria turn vague ideas into products?"],
  fullstack: ["How does Viktoria approach testing?", "Has Viktoria designed APIs?", "What CI/CD has Viktoria set up?"],
  consultant: ["How does Viktoria work with clients?", "Tell me about the Vynrr PoC.", "Does Viktoria prefer remote or hybrid work?"],
  appsec: ["What security tooling has Viktoria set up?", "What is Viktoria studying in the MSc?", "Why is Viktoria interested in cybersecurity?"],
};

function AskPanel({ role }: { role: Role }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const full = turns.length >= INPUT_LIMITS.turns;

  // The conversation scrolls inside its own box. A new question moves to the top of the box, so
  // its answer streams in below it rather than stretching the page.
  useEffect(() => {
    const list = listRef.current;
    const last = list?.lastElementChild as HTMLElement | null;
    if (list && last) list.scrollTo({ top: last.offsetTop, behavior: "smooth" });
  }, [turns.length]);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed || busy || full) return;
    setBusy(true);
    setNotice(null);
    setQuestion("");
    const history = turns.map(({ q, a }) => ({ q, a }));
    setTurns((t) => [...t, { q: trimmed, a: "" }]);
    abortRef.current = new AbortController();
    try {
      const out = await streamAsk(
        { mode: "chat", role, question: trimmed, history },
        (a) => setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, a } : turn))),
        abortRef.current.signal,
      );
      if ("unavailable" in out) {
        setTurns((t) => t.slice(0, -1));
        setNotice(out.unavailable);
      } else if (out.cut) {
        setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, cut: true } : turn)));
      }
    } catch {
      setTurns((t) => t.slice(0, -1));
      setNotice("upstream");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setTurns([]);
    setNotice(null);
  }

  return (
    <div className="ask">
      {turns.length === 0 && (
        <div className="starters">
          {STARTERS[role].map((s) => (
            <button key={s} type="button" className="chip" onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <ol className="turns" aria-live="polite" ref={listRef} tabIndex={turns.length ? 0 : -1} aria-label="Conversation">
        {turns.map((t, i) => (
          <li key={i}>
            <p className="q">{t.q}</p>
            <p className="a">{t.a ? <Cited text={t.a} /> : busy && i === turns.length - 1 ? "Thinking…" : ""}</p>
            {t.cut && <p className="notice">Answer cut short. Try a narrower question.</p>}
          </li>
        ))}
      </ol>
      {notice && <Notice reason={notice} />}
      {full ? (
        <p className="notice">
          {UNAVAILABLE_MESSAGES.conversation_full}{" "}
          <button type="button" className="btn-quiet" onClick={reset}>
            Start a new conversation
          </button>
        </p>
      ) : (
        <form
          className="ask-form"
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
        >
          <label htmlFor="question" className="visually-hidden">
            Your question
          </label>
          <input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={INPUT_LIMITS.questionChars}
            placeholder="Ask anything about Viktoria's work"
            autoComplete="off"
          />
          <button type="submit" className="btn" disabled={busy || !question.trim()}>
            Ask
          </button>
          {turns.length > 0 && (
            <button type="button" className="btn-quiet" onClick={reset}>
              Clear
            </button>
          )}
        </form>
      )}
    </div>
  );
}
