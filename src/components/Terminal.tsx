"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { certifications, person, ROLE_LABELS, skills, timeline, type Role } from "@/content/profile";
import { effectiveTheme, setTheme } from "@/lib/theme";

// A small interactive terminal in the header. Visitors run a few commands to explore the CV.
// Every line is rendered as plain text through React, never as HTML.
type Line =
  | { kind: "cmd" | "title" | "text" | "dim" | "ok" | "err"; text: string }
  | { kind: "row"; head: string; meta?: string; sub?: string }
  | { kind: "tags"; items: string[] }
  | { kind: "gap" };

const COMMANDS = ["whoami", "experience", "certs", "study", "stack", "contact"] as const;
const HELP: Record<string, string> = {
  whoami: "who Viktoria is",
  experience: "roles, newest first",
  certs: "current certifications",
  study: "degrees",
  stack: "main tools",
  contact: "how to get in touch",
  "lights off": "dark mode (lights on for light)",
  clear: "clear the screen",
};
const MAX_INPUT = 40;

// What "whoami" says for each role lens: who Viktoria is for that role, and the proof in one line.
const WHOAMI: Record<Role, [string, string]> = {
  all: [`Software engineer, ${person.location}`, "Ten years shipping frontend and full-stack software."],
  frontend: ["Frontend engineer: React, TypeScript, data-rich UI", "Built Harrier's UI at Isode and a custom React reporting UI at BlackRock."],
  product: ["Product engineer: users, discovery, delivery", "Took two AI products from idea to MVP with BlackRock's legal teams."],
  fullstack: ["Full-stack engineer: APIs, testing, CI/CD", "React frontends, Python endpoints and the pipelines that ship them."],
  consultant: ["Consultant: client delivery, advising founders", "Two award-winning client apps at ANDigital, an investor-ready PoC for Vynrr."],
  appsec: ["Security-minded engineer, MSc Ethical Hacking", "Security+, 10th of hundreds in BlackRock's CTF, SonarQube and Snyk in CI."],
};
const MAX_LINES = 80;

// Normalise what a visitor types: printable ASCII only, single spaces, lower case, bounded length.
export function cleanCommand(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, MAX_INPUT);
}

// The light switch: "lights off/on" or "theme dark/light". Returns null for anything else.
function lights(c: string): Line[] | null {
  const want = c === "lights off" || c === "theme dark" ? "dark" : c === "lights on" || c === "theme light" ? "light" : null;
  if (c === "theme" || c === "lights") {
    return [
      { kind: "row", head: "Now", meta: `${effectiveTheme()} mode` },
      { kind: "dim", text: "Try: lights off or lights on." },
    ];
  }
  if (!want) return null;
  const before = effectiveTheme();
  setTheme(want);
  if (before === want) return [{ kind: "dim", text: want === "dark" ? "The lights are already off." : "The lights are already on." }];
  return [{ kind: "ok", text: want === "dark" ? "*click* Lights off. Easier on the eyes." : "*click* Lights on." }];
}

function run(c: string, role: Role): Line[] | "clear" | "hire" {
  const switched = lights(c);
  if (switched) return switched;
  const text = (t: string): Line => ({ kind: "text", text: t });
  const dim = (t: string): Line => ({ kind: "dim", text: t });
  switch (c) {
    case "whoami": {
      const [what, proof] = WHOAMI[role];
      return [
        { kind: "title", text: person.name },
        text(what),
        text(proof),
        dim(role === "all" ? "Pick a role below the terminal to tailor the page." : `Viewing as: ${ROLE_LABELS[role]}. The page below has been tailored to match.`),
        dim(effectiveTheme() === "dark" ? "Too dark in here? Type: lights on" : "Bit bright in here? Type: lights off"),
      ];
    }
    case "experience":
      return [
        { kind: "title", text: "Experience" },
        ...timeline
          .filter((t) => t.lane !== "study")
          .sort((a, b) => b.from - a.from)
          .map((t): Line => ({ kind: "row", head: t.org, meta: t.dates, sub: t.label })),
      ];
    case "certs":
      return [
        { kind: "title", text: "Certifications" },
        ...certifications.map((c): Line => ({ kind: "row", head: `✓ ${c.name}`, sub: c.status })),
      ];
    case "study":
      return [
        { kind: "title", text: "Study" },
        ...timeline
          .filter((t) => t.lane === "study")
          .sort((a, b) => b.from - a.from)
          .map((t): Line => ({ kind: "row", head: t.label, meta: t.dates, sub: t.org })),
      ];
    case "stack":
      return [
        { kind: "title", text: "Main stack" },
        { kind: "tags", items: skills.stack.slice(0, 10).map((s) => s.name) },
        dim("Full list in the Toolkit section."),
      ];
    case "contact":
      return [
        { kind: "title", text: "Contact" },
        { kind: "row", head: "Email", meta: person.email },
        ...(person.linkedin ? [{ kind: "row", head: "LinkedIn", meta: "viktoria-idakieva" } as Line] : []),
        dim("Or run: sudo hire viktoria"),
      ];
    case "help":
    case "ls":
      return [
        { kind: "title", text: "Commands" },
        ...Object.entries(HELP).map(([k, v]): Line => ({ kind: "row", head: k, meta: v })),
      ];
    case "clear":
      return "clear";
    case "sudo hire viktoria":
    case "hire viktoria":
      return "hire";
    case "":
      return [];
    default:
      return [{ kind: "err", text: `command not found: ${c}` }, dim('Type "help" to see what works.')];
  }
}

function TermLine({ line }: { line: Line }) {
  switch (line.kind) {
    case "cmd":
      return (
        <p className="term-line">
          <span className="term-prompt">$</span> {line.text}
        </p>
      );
    case "row":
      return (
        <div className="term-line term-row">
          <span className="term-row-head">{line.head}</span>
          {line.meta && <span className="term-row-meta">{line.meta}</span>}
          {line.sub && <span className="term-row-sub">{line.sub}</span>}
        </div>
      );
    case "tags":
      return (
        <ul className="term-line term-tags">
          {line.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      );
    case "gap":
      return <div className="term-gap" aria-hidden="true" />;
    default:
      return <p className={`term-line term-${line.kind}`}>{line.text}</p>;
  }
}

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Terminal({ role }: { role: Role }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [typing, setTyping] = useState("");
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef(role);
  roleRef.current = role;
  // One command at a time, so output from two commands never interleaves.
  const runningRef = useRef(false);

  const push = (add: Line[]) => setLines((l) => [...l, ...add].slice(-MAX_LINES));

  const exec = useCallback(async (raw: string) => {
    const cmd = cleanCommand(raw);
    if (!cmd || runningRef.current) return;
    runningRef.current = true;
    setBusy(true);
    const fast = reduced();
    if (!fast) {
      for (let i = 1; i <= cmd.length; i++) {
        setTyping(cmd.slice(0, i));
        await wait(45);
      }
      await wait(180);
    }
    setTyping("");
    const result = run(cmd, roleRef.current);
    if (result === "clear") {
      setLines([]);
    } else {
      setLines((l) => (l.length ? [...l, { kind: "gap" }] : l));
      push([{ kind: "cmd", text: cmd }]);
      const out: Line[] = result === "hire" ? [{ kind: "ok", text: "Permission granted. Taking you to contact…" }] : result;
      for (const line of out) {
        if (!fast) await wait(60);
        push([line]);
      }
      if (result === "hire") {
        await wait(fast ? 0 : 700);
        document.getElementById("contact")?.scrollIntoView({ behavior: fast ? "auto" : "smooth" });
      }
    }
    runningRef.current = false;
    setBusy(false);
  }, []);

  // Picking a role re-runs whoami, so the terminal answers for that role and shows the page changed.
  const firstRole = useRef(true);
  useEffect(() => {
    if (firstRole.current) {
      firstRole.current = false;
      return;
    }
    exec("whoami");
  }, [role, exec]);

  // Introduce itself once the header has settled.
  useEffect(() => {
    const t = setTimeout(() => exec("whoami"), reduced() ? 0 : 1100);
    return () => clearTimeout(t);
  }, [exec]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, typing]);

  return (
    <aside className="term" aria-label="Interactive terminal: explore Viktoria's CV">
      <div className="term-bar" aria-hidden="true">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-bar-title">viktoria@portfolio: ~</span>
      </div>
      <div className="term-body" ref={bodyRef} aria-live="polite">
        {lines.map((l, i) => (
          <TermLine key={i} line={l} />
        ))}
        <form
          className="term-line term-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (busy) return;
            const cmd = input;
            setInput("");
            exec(cmd);
          }}
        >
          <span className="term-prompt" aria-hidden="true">
            $
          </span>
          {typing ? (
            <span className="term-typing">
              {typing}
              <span className="term-caret" aria-hidden="true" />
            </span>
          ) : (
            <>
              <label htmlFor="term-input" className="visually-hidden">
                Type a command, for example help
              </label>
              <input
                id="term-input"
                className="term-input"
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
                placeholder={busy ? "" : "type help, or pick below"}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={MAX_INPUT}
              />
            </>
          )}
        </form>
      </div>
      <div className="term-cmds" role="group" aria-label="Run a command">
        {COMMANDS.map((c) => (
          <button key={c} type="button" disabled={busy} onClick={() => exec(c)}>
            {c}
          </button>
        ))}
      </div>
    </aside>
  );
}
