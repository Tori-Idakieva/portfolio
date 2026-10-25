"use client";

import { useEffect, useMemo, useState } from "react";
import { evidence } from "@/content/profile";

export type Guess = "most" | "half" | "few";

export const GUESS_LABELS: Record<Guess, string> = { most: "Most of them", half: "About half", few: "Only a few" };

const STAGES = [
  { at: 0, text: "Reading the job ad" },
  { at: 18, text: "Pulling out the requirements" },
  { at: 40, text: `Checking each one against ${evidence.length} pieces of evidence` },
  { at: 70, text: "Scoring strong, partial or gap" },
  { at: 88, text: "Writing it up" },
];

// Short, readable lines from the pasted ad, so the scan shows the visitor's own words.
function phrases(job: string): string[] {
  return job
    .split(/\n+|(?<=[.;])\s+|•/)
    .map((s) => s.replace(/^\s*(?:[-*–]+|\d+[.)])\s*/, "").trim())
    .filter((s) => s.length > 12)
    .slice(0, 6)
    .map((s) => (s.length > 70 ? `${s.slice(0, 68).trimEnd()}…` : s));
}

// The match takes a while, so the wait walks through the job ad on an estimated timer and offers a guess
// to make it worth watching. Progress eases towards 95% and the result replaces it when it lands.
export function MatchLoading({ job, guess, onGuess }: { job: string; guess: Guess | null; onGuess: (g: Guess) => void }) {
  const [pct, setPct] = useState(0);
  const lines = useMemo(() => phrases(job), [job]);

  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => {
      const t = (performance.now() - start) / 1000;
      setPct(Math.min(95, Math.round(95 * (1 - Math.exp(-t / 9)))));
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  const stage = [...STAGES].reverse().find((s) => pct >= s.at)!;
  const scanned = Math.floor((Math.min(pct, 70) / 70) * lines.length);

  return (
    <div className="match-loading" aria-live="polite">
      <div className="ml-head">
        <span className="ml-stage">{stage.text}…</span>
        <span className="ml-pct">{pct}%</span>
      </div>
      <div className="ml-bar" role="progressbar" aria-label="Matching the job ad" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <span style={{ width: `${pct}%` }} />
      </div>

      {lines.length > 0 && (
        <ol className="ml-lines" aria-hidden="true">
          {lines.map((l, i) => (
            <li key={i} data-state={i < scanned ? "done" : i === scanned ? "now" : undefined}>
              <span className="ml-tick">{i < scanned ? "✓" : i === scanned ? "›" : "·"}</span>
              {l}
            </li>
          ))}
        </ol>
      )}

      <div className="ml-game">
        <p>
          <strong>While you wait:</strong> how many of the requirements do you think Viktoria fully meets?
        </p>
        <div className="ml-guesses" role="group" aria-label="Your guess">
          {(Object.keys(GUESS_LABELS) as Guess[]).map((g) => (
            <button key={g} type="button" className="chip" aria-pressed={guess === g} onClick={() => onGuess(g)}>
              {GUESS_LABELS[g]}
            </button>
          ))}
        </div>
        {guess && <p className="hint">Locked in. The answer appears with the results.</p>}
      </div>
    </div>
  );
}

// How the visitor's guess compares with the real result.
export function guessVerdict(guess: Guess, strong: number, total: number) {
  const share = total ? strong / total : 0;
  const actual: Guess = share >= 0.66 ? "most" : share >= 0.34 ? "half" : "few";
  return { right: actual === guess, actual };
}
