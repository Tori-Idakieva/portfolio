"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { MatchOutput } from "@/lib/ai";

type Strength = MatchOutput["requirements"][number]["strength"];

export const STRENGTH_LABELS: Record<Strength, string> = {
  strong: "Strong",
  partial: "Partial",
  gap: "Gap",
};
const ORDER: Strength[] = ["strong", "partial", "gap"];

const plain = (t: string) => t.replace(/\s*\[\[[a-z0-9-]+\]\]/g, "");

// A one-glance picture of the match: the share of strong, partial and gap requirements, then one
// mark per requirement in the order the list shows them. Hovering a mark names it; clicking one
// scrolls the list below to that requirement. The list itself is the full, readable version.
export function MatchChart({ result, onPick }: { result: MatchOutput; onPick: (i: number) => void }) {
  const reqs = result.requirements;
  const counts = ORDER.map((s) => ({
    s,
    n: reqs.filter((r) => r.strength === s).length,
  })).filter((c) => c.n > 0);
  const [hover, setHover] = useState<number | null>(null);
  if (!reqs.length) return null;

  return (
    <figure className="mc" aria-label="Match overview">
      <div className="mc-bar" aria-hidden="true">
        {counts.map(({ s, n }) => (
          <span key={s} data-strength={s} style={{ flexGrow: n }} />
        ))}
      </div>
      <figcaption className="mc-legend">
        {counts.map(({ s, n }) => (
          <span key={s}>
            <i data-strength={s} aria-hidden="true" />
            <strong>{n}</strong> {STRENGTH_LABELS[s].toLowerCase()}
          </span>
        ))}
        <span className="mc-total">of {reqs.length} requirements</span>
      </figcaption>

      <ol className="mc-strip" aria-label="Requirements by strength">
        {reqs.map((r, i) => (
          <li key={i}>
            <button
              type="button"
              data-strength={r.strength}
              aria-label={`${i + 1}. ${STRENGTH_LABELS[r.strength]}: ${plain(r.requirement)}. Show in list.`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => onPick(i)}
            >
              <span aria-hidden="true">{i + 1}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mc-tip" aria-hidden="true">
        {hover === null ? (
          "Hover or tap a square to see the requirement."
        ) : (
          <>
            <strong>{STRENGTH_LABELS[reqs[hover].strength]}:</strong> {plain(reqs[hover].requirement)}
          </>
        )}
      </p>
    </figure>
  );
}

// A scrolling box that says so: a fade and a "more below" button show whenever content is hidden
// underneath, since overlay scrollbars (macOS, phones) stay invisible until you scroll.
export function ScrollHint({
  children,
  label,
}: {
  children: (ref: React.RefObject<HTMLOListElement | null>) => ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLOListElement | null>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="scroll-hint" data-more={more}>
      {children(ref)}
      {more && (
        <button
          type="button"
          className="scroll-more"
          onClick={() =>
            ref.current?.scrollBy({
              top: ref.current.clientHeight * 0.8,
              behavior: "smooth",
            })
          }
        >
          {label} <span aria-hidden="true">↓</span>
        </button>
      )}
    </div>
  );
}
