"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import claudeBadge from "@/assets/certs/claude-developer-foundations.png";
import securityPlusBadge from "@/assets/certs/comptia-security-plus.png";
import {
  certifications,
  evidence,
  orderedEvidence,
  ROLE_LABELS,
  skills,
  stats,
  timeline,
  type Evidence,
  type Skill,
  type Role,
} from "@/content/profile";

export type Filter = { type: "org" | "skill" | "kind"; value: string; label: string; places?: string[] } | null;

// "MSc" in the toolkit means the Abertay degree; "CCDV-F" means the Anthropic certification.
const placeMatch = (place: string) => (place === "MSc" ? "Abertay" : place === "CCDV-F" ? "Anthropic" : place);
const allSkills = Object.values(skills).flat();

function skillFilter(name: string): Filter {
  const places = allSkills.find((t) => t.name === name)?.at ?? [];
  return { type: "skill", value: name, label: places.length ? `${name}: ${places.join(", ")}` : name, places: places.map(placeMatch) };
}

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function matches(item: Evidence, filter: Filter): boolean {
  if (!filter) return true;
  if (filter.type === "org") return item.org.includes(filter.value);
  if (filter.type === "kind") return item.kind === filter.value;
  return (item.stack?.includes(filter.value) ?? false) || (filter.places?.some((p) => item.org.includes(p)) ?? false);
}

/* ---------- Numbers that count up when they scroll into view ---------- */

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !("IntersectionObserver" in window)) return;
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 900);
        setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      setShown(0);
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);
  return <span ref={ref}>{shown}</span>;
}

export function Stats({ role }: { role: Role }) {
  return (
    <ul className="stats" aria-label="Highlights">
      {stats.map((s) => {
        const lit = role !== "all" && s.roles.includes(role);
        return (
          <li key={s.label} data-lit={lit || undefined}>
            <a href={`#${s.evidence}`}>
              <span className="stat-value">
                {s.prefix}
                <Counter value={s.value} />
                {s.suffix}
              </span>
              <span className="stat-label">{s.label}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Career timeline: click an organisation to filter the evidence ---------- */

const START = 2014;
const END = 2027.5;
const YEARS = Array.from({ length: Math.ceil(END - START) }, (_, i) => START + i);
const LANES = [
  { id: "work", label: "Work" },
  { id: "side", label: "Side" },
  { id: "study", label: "Study" },
] as const;

const LANE_KIND = { work: "Full-time", side: "Part-time side work", study: "Education" } as const;

export function Timeline({ filter, onFilter }: { filter: Filter; onFilter: (f: Filter) => void }) {
  const pos = (y: number) => `${((y - START) / (END - START)) * 100}%`;
  const [tip, setTip] = useState<{ i: number; x: number; y: number; below: boolean } | null>(null);

  function show(i: number, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2, 150), window.innerWidth - 150);
    const below = r.top < 200;
    setTip({ i, x, y: below ? r.bottom + 10 : r.top - 10, below });
  }

  // A fixed tooltip goes stale once the page moves.
  useEffect(() => {
    if (!tip) return;
    const hide = () => setTip(null);
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide);
      window.removeEventListener("resize", hide);
    };
  }, [tip]);

  const current = tip ? timeline[tip.i] : null;

  return (
    <section className="timeline wrap" id="timeline" aria-labelledby="timeline-title">
      <div className="section-head">
        <p className="label">Career</p>
        <h2 id="timeline-title">From Cardiff to BlackRock</h2>
        <p className="muted">Hover a bar for highlights, and select one to see only the work done there.</p>
      </div>
      <ul className="tl-legend" aria-label="Key">
        {(["work", "side", "study"] as const).map((k) => (
          <li key={k} data-lane={k}>
            <span className="tl-swatch" aria-hidden="true" />
            {LANE_KIND[k]}
          </li>
        ))}
      </ul>
      {/* Phones get a stacked list instead of a chart that would need sideways scrolling. */}
      <ol className="tl-list">
        {[...timeline].sort((a, b) => b.from - a.from).map((t) => {
          const active = filter?.type === "org" && filter.value === t.match;
          return (
            <li key={t.org} data-lane={t.lane}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => {
                  onFilter(active ? null : { type: "org", value: t.match, label: t.org });
                  if (!active) document.getElementById("work")?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
                }}
              >
                <span className="tl-list-kind">
                  {LANE_KIND[t.lane]} · {t.dates}
                </span>
                <span className="tl-list-title">
                  {t.org}, {t.label}
                </span>
                <span className="tl-list-hl">{t.highlights.join(" · ")}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="tl-scroll" onScroll={() => setTip(null)}>
        <div className="tl">
          <div className="tl-years" aria-hidden="true">
            {YEARS.map((y) => (
              <span key={y} style={{ left: pos(y) }}>
                {String(y).slice(2)}
              </span>
            ))}
          </div>
          {LANES.map((lane) => (
            <div key={lane.id} className="tl-lane">
              <span className="tl-lane-label">{lane.label}</span>
              {timeline.map((t, i) => {
                if (t.lane !== lane.id) return null;
                const active = filter?.type === "org" && filter.value === t.match;
                return (
                  <button
                    key={t.org}
                    type="button"
                    className="tl-bar"
                    data-lane={t.lane}
                    aria-pressed={active}
                    aria-describedby={tip?.i === i ? "tl-tip" : undefined}
                    style={{ left: pos(t.from), width: `calc(${pos(t.to)} - ${pos(t.from)})` }}
                    onPointerEnter={(e) => show(i, e.currentTarget)}
                    onPointerLeave={() => setTip(null)}
                    onFocus={(e) => show(i, e.currentTarget)}
                    onBlur={() => setTip(null)}
                    onClick={() => onFilter(active ? null : { type: "org", value: t.match, label: t.org })}
                  >
                    <span className="tl-org">{t.org}</span>
                    <span className="tl-role">{t.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Portalled to <body>: the section's reveal animation would otherwise anchor a fixed element to itself. */}
      {tip && current && createPortal(
        <div
          id="tl-tip"
          role="tooltip"
          className="tl-tip"
          data-lane={current.lane}
          data-below={tip.below || undefined}
          style={{ left: tip.x, top: tip.y }}
        >
          <p className="tl-tip-kind">{LANE_KIND[current.lane]} · {current.dates}</p>
          <p className="tl-tip-title">
            {current.org}, {current.label}
          </p>
          <ul>
            {current.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>,
        document.body,
      )}
    </section>
  );
}

/* ---------- Evidence ---------- */

const KIND_LABEL = { work: "Work", code: "Code", study: "Education", cert: "Certifications" } as const;

// Employers newest first; an item belongs to the first one named in its org.
const EMPLOYERS = timeline.filter((t) => t.lane !== "study").sort((a, b) => b.from - a.from);

type Group = { key: string; title: string; sub: string; items: Evidence[] };

function groupItems(items: Evidence[]): Group[] {
  const groups: Group[] = [
    ...EMPLOYERS.map((t) => ({ key: t.match, title: t.org, sub: `${t.label} · ${t.dates}`, items: [] as Evidence[] })),
    { key: "study", title: "Education", sub: "Abertay, Cardiff", items: [] },
  ];
  for (const item of items) {
    const key = item.kind !== "work" ? item.kind : EMPLOYERS.find((t) => item.org.includes(t.match))?.match;
    groups.find((g) => g.key === key)?.items.push(item);
  }
  return groups.filter((g) => g.items.length > 0);
}

export function EvidenceList({ role, filter, onFilter }: { role: Role; filter: Filter; onFilter: (f: Filter) => void }) {
  // GitHub projects have their own section below.
  // GitHub projects and certifications have their own sections.
  const items = orderedEvidence(role).filter((e) => e.kind !== "code" && e.kind !== "cert" && matches(e, filter));
  const relevant = role === "all" ? items : items.filter((e) => e.weight[role] >= 2);
  const rest = role === "all" ? [] : items.filter((e) => e.weight[role] < 2);
  const kinds = ["work", "study"] as const;

  return (
    <section className="evidence wrap" id="work" aria-labelledby="evidence-title">
      <div className="section-head">
        <p className="label">Experience</p>
        <h2 id="evidence-title">{role === "all" ? "What Viktoria has done, and where" : <>Strongest for {ROLE_LABELS[role]}</>}</h2>
        <p className="muted">
          {role === "all" ? "Grouped by employer, newest first. Open any line for the detail." : "Ranked by relevance to this role. Open any line for the detail."}
        </p>
      </div>
      <div className="filters" role="group" aria-label="Filter experience">
        <button type="button" className="chip" aria-pressed={!filter} onClick={() => onFilter(null)}>
          Everything
        </button>
        {kinds.map((k) => {
          const active = filter?.type === "kind" && filter.value === k;
          return (
            <button
              key={k}
              type="button"
              className="chip"
              aria-pressed={active}
              onClick={() => onFilter(active ? null : { type: "kind", value: k, label: KIND_LABEL[k] })}
            >
              {KIND_LABEL[k]}
            </button>
          );
        })}
        {filter && filter.type !== "kind" && (
          <button type="button" className="chip chip-active" onClick={() => onFilter(null)} aria-label={`Remove filter ${filter.label}`}>
            {filter.label} <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
      {items.length === 0 && <p className="muted">Nothing matches that filter.</p>}

      {role === "all" ? (
        <div className="groups">
          {groupItems(items).map((g) => (
            <section key={g.key} className="group" aria-labelledby={`g-${g.key}`}>
              <header className="group-head">
                <h3 id={`g-${g.key}`}>{g.title}</h3>
                <p>{g.sub}</p>
              </header>
              <ul className="rows">
                {g.items.map((e) => (
                  <Row key={e.id} item={e} role={role} onFilter={onFilter} showOrg={e.kind !== "work"} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <>
          <ol className="rows ranked">
            {relevant.map((e) => (
              <Row key={e.id} item={e} role={role} onFilter={onFilter} showOrg />
            ))}
          </ol>
          {rest.length > 0 && (
            <details className="rest">
              <summary>Less relevant for {ROLE_LABELS[role]} ({rest.length})</summary>
              <ol className="rows ranked">
                {rest.map((e) => (
                  <Row key={e.id} item={e} role={role} onFilter={onFilter} showOrg />
                ))}
              </ol>
            </details>
          )}
        </>
      )}
    </section>
  );
}

function Row({ item, role, onFilter, showOrg }: { item: Evidence; role: Role; onFilter: (f: Filter) => void; showOrg: boolean }) {
  const [open, setOpen] = useState(false);
  const flashRef = useRef<HTMLSpanElement>(null);
  const weight = role === "all" ? null : item.weight[role];
  const why = role === "all" ? null : item.why?.[role];

  // Arriving here from a citation, stat or certificate link opens the row and briefly lights it up
  // so the eye finds it. The jump scrolls within the page without touching the address or history,
  // so the browser's back button still means "leave this page".
  useEffect(() => {
    const arrive = () => {
      setOpen(true);
      flashRef.current?.animate([{ opacity: 1 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], {
        duration: reducedMotion() ? 1600 : 2600,
        easing: "ease-out",
      });
    };
    const scrollHere = (behavior: ScrollBehavior) =>
      document.getElementById(item.id)?.scrollIntoView({ behavior: reducedMotion() ? "auto" : behavior, block: "start" });
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href^='#']");
      if (link?.getAttribute("href") !== `#${item.id}`) return;
      e.preventDefault();
      scrollHere("smooth");
      arrive();
    };
    // A shared link such as /#study-msc still lands here. Wait for the page to settle so the
    // highlight is seen, then tidy the address.
    let timer = 0;
    const onHash = () => {
      if (window.location.hash !== `#${item.id}`) return;
      timer = window.setTimeout(() => {
        scrollHere("auto");
        arrive();
        try {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        } catch {
          // Some embedded viewers block history changes; the row still opens.
        }
      }, 450);
    };
    onHash();
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
    };
  }, [item.id]);

  return (
    <li
      id={item.id}
      className="row"
      data-kind={item.kind}
      data-open={open || undefined}
      style={{ viewTransitionName: `ev-${item.id}`, "--w": weight ?? 0 } as React.CSSProperties}
    >
      <span className="row-flash" ref={flashRef} aria-hidden="true" />
      <button type="button" className="row-head" aria-expanded={open} aria-controls={`${item.id}-more`} onClick={() => setOpen((o) => !o)}>
        {weight !== null && (
          <span className="fit" role="img" aria-label={`Relevance ${weight} of 3`}>
            <span />
          </span>
        )}
        <span className="row-main">
          <span className="row-title">{item.title}</span>
          {(showOrg || weight !== null) && (
            <span className="row-org">
              {item.org} · {item.period}
            </span>
          )}
          {!open && <span className="row-short">{item.short}</span>}
        </span>
        <span className="row-toggle" aria-hidden="true" />
      </button>
      {open && (
        <div className="row-more" id={`${item.id}-more`}>
          {why && <p className="why">{why}</p>}
          <p>{item.summary}</p>
          {item.image && (
            <figure className="shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image.src} alt={item.image.alt} loading="lazy" />
              <figcaption>{item.image.credit}</figcaption>
            </figure>
          )}
          {(item.link || item.sources) && (
            <p className="source">
              {item.link && <a href={item.link}>View the code on GitHub</a>}
              {item.sources?.map((s) => (
                <a key={s.href} href={s.href}>
                  {s.label}
                </a>
              ))}
            </p>
          )}
          {item.stack && (
            <ul className="tags" aria-label="Tools used, select one to filter">
              {item.stack.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => onFilter(skillFilter(s))}>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

/* ---------- Side projects on GitHub ---------- */

const BADGES = { "security-plus": securityPlusBadge, "claude-developer": claudeBadge };

export function Certifications() {
  return (
    <section className="certs wrap" id="certifications" aria-labelledby="certs-title">
      <div className="section-head">
        <p className="label">Certifications</p>
        <h2 id="certs-title">Certified, and what it adds</h2>
        <p className="muted">Each certification next to the skills it covers, and where Viktoria already uses them.</p>
      </div>
      <ul className="cert-list">
        {certifications.map((c) => (
          <li key={c.id} className="cert">
            <div className="cert-head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="cert-badge" src={BADGES[c.badge].src} alt={`${c.name} badge`} width={88} height={88} loading="lazy" />
              <div>
                <p className="cert-issuer">{c.issuer}</p>
                <h3>{c.name}</h3>
                <p className="cert-status">{c.status}</p>
              </div>
            </div>
            <p className="cert-summary">{c.summary}</p>
            <p className="cert-adds-label">What it adds</p>
            <ul className="cert-adds">
              {c.adds.map((a) => (
                <li key={a.skill}>
                  <span className="cert-skill">{a.skill}</span>
                  <span className="cert-detail">
                    {a.detail}{" "}
                    {a.evidence && (
                      <a href={`#${a.evidence}`} className="cert-see">
                        See the work
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <a className="cert-link" href={c.link}>
              About this certification ↗
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GitHubProjects() {
  const repos = evidence.filter((e) => e.kind === "code");
  return (
    <section className="repos wrap" id="github" aria-labelledby="repos-title">
      <div className="section-head">
        <p className="label">On GitHub</p>
        <h2 id="repos-title">Side projects</h2>
      </div>
      <ul className="repo-list">
        {repos.map((r) => (
          <li key={r.id} id={r.id}>
            <a href={r.link}>
              <span className="repo-name">{r.title}</span>
              <span className="repo-meta">{r.period}</span>
              <span className="repo-short">{r.short}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Spot the vulnerability ---------- */

const ROUNDS: { lang: string; title: string; lines: string[]; bad: number; name: string; fix: string }[] = [
  {
    lang: "React",
    title: "A comment component",
    lines: [
      "function Comment({ comment }) {",
      "  const author = comment.author.name;",
      "  return (",
      "    <article>",
      "      <strong>{author}</strong>",
      "      <div dangerouslySetInnerHTML={{ __html: comment.body }} />",
      "    </article>",
      "  );",
      "}",
    ],
    bad: 5,
    name: "Stored XSS",
    fix: "The body is user input rendered as raw HTML, so a comment can carry a script. Render it as text, or sanitise it with an allowlist such as DOMPurify first.",
  },
  {
    lang: "Express",
    title: "An invoice endpoint",
    lines: [
      'app.get("/api/invoices/:id", requireLogin, async (req, res) => {',
      "  const invoice = await db.invoices.findById(req.params.id);",
      "  if (!invoice) return res.sendStatus(404);",
      "  res.json(invoice);",
      "});",
    ],
    bad: 1,
    name: "Insecure direct object reference",
    fix: "Any logged-in user can read any invoice by changing the id. Scope the lookup to the owner, for example findOne({ id, ownerId: req.user.id }).",
  },
  {
    lang: "Python",
    title: "A user lookup",
    lines: [
      "def find_user(email):",
      "    cur = conn.cursor()",
      "    cur.execute(f\"SELECT * FROM users WHERE email = '{email}'\")",
      "    return cur.fetchone()",
    ],
    bad: 2,
    name: "SQL injection",
    fix: "The email is pasted into the query, so ' OR '1'='1 returns a user. Use a parameterised query: cur.execute(\"... WHERE email = %s\", (email,)).",
  },
];

export function SpotTheBug() {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = round >= ROUNDS.length;
  const r = ROUNDS[Math.min(round, ROUNDS.length - 1)];
  const answered = picked !== null;

  function pick(i: number) {
    if (answered) return;
    setPicked(i);
    if (i === r.bad) setScore((s) => s + 1);
  }

  function next() {
    setPicked(null);
    setRound((n) => n + 1);
  }

  return (
    <section className="bug wrap" id="security" aria-labelledby="bug-title">
      <div className="section-head">
        <p className="label">Try it</p>
        <h2 id="bug-title">Spot the vulnerability</h2>
        <p className="muted">
          The kind of thing Viktoria catches in code review. Click the line you&apos;d flag.
        </p>
      </div>
      <div className="bug-box">
        <div className="bug-bar">
          <span>{done ? "Finished" : `${r.lang} · ${r.title}`}</span>
          <span className="bug-score" aria-live="polite">
            {score}/{ROUNDS.length}
          </span>
        </div>
        {done ? (
          <div className="bug-end">
            <p className="bug-end-score">
              {score === ROUNDS.length ? "Clean sweep." : score > 0 ? "Not bad." : "Tricky, right?"} You found {score} of {ROUNDS.length}.
            </p>
            <p>
              Viktoria does this for real: triaging findings at BlackRock, running SonarQube and Snyk in CI, and placing 10th out of
              hundreds of teams in BlackRock&apos;s internal CTF.
            </p>
            <div className="form-row">
              <a className="btn" href="#blk-ctf">
                See the security work
              </a>
              <button
                type="button"
                className="btn-quiet"
                onClick={() => {
                  setRound(0);
                  setScore(0);
                  setPicked(null);
                }}
              >
                Play again
              </button>
            </div>
          </div>
        ) : (
          <>
            <ol className="code" aria-label={`${r.title}, ${r.lines.length} lines`}>
              {r.lines.map((line, i) => {
                const state = !answered ? undefined : i === r.bad ? "bad" : i === picked ? "miss" : undefined;
                return (
                  <li key={`${round}-${i}`} data-state={state}>
                    <button type="button" onClick={() => pick(i)} disabled={answered} aria-label={`Line ${i + 1}: ${line.trim()}`}>
                      <span className="ln" aria-hidden="true">
                        {i + 1}
                      </span>
                      <code>{line}</code>
                    </button>
                  </li>
                );
              })}
            </ol>
            {answered && (
              <div className="bug-verdict" role="status">
                <p>
                  <strong>{picked === r.bad ? "Got it." : `Not quite, it's line ${r.bad + 1}.`}</strong> {r.name}. {r.fix}
                </p>
                <button type="button" className="btn" onClick={next}>
                  {round === ROUNDS.length - 1 ? "See score" : "Next snippet"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ---------- Toolkit: click a tool to see the work at the places it was used ---------- */

export function Toolkit({ filter, onFilter }: { filter: Filter; onFilter: (f: Filter) => void }) {
  const groups: [string, Skill[]][] = [
    ["Builds with", skills.stack],
    ["Ships with", skills.practice],
    ["Secures with", skills.security],
    ["Accelerates with", skills.ai],
  ];
  return (
    <section className="toolkit wrap" id="toolkit" aria-labelledby="toolkit-title">
      <div className="section-head">
        <p className="label">Toolkit</p>
        <h2 id="toolkit-title">Tools, and where they were used</h2>
        <p className="muted">The number is how many places a tool was used. Select one to see that work.</p>
      </div>
      <div className="tk-groups">
        {groups.map(([label, list]) => (
          <div key={label} className="tk-group">
            <h3>{label}</h3>
            <ul>
              {list.map((t) => {
                const active = filter?.type === "skill" && filter.value === t.name;
                return (
                  <li key={t.name}>
                    {t.at.length > 0 ? (
                      <button
                        type="button"
                        className="tool"
                        aria-pressed={active}
                        title={`Used at ${t.at.join(", ")}`}
                        aria-label={`${t.name}, used at ${t.at.join(", ")}`}
                        onClick={() => {
                          // Tools learned through a certification point at that card instead of the experience list.
                          if (t.at.every((p) => p === "CCDV-F")) {
                            document.getElementById("certifications")?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
                            return;
                          }
                          onFilter(active ? null : skillFilter(t.name));
                          if (!active) document.getElementById("work")?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
                        }}
                      >
                        {t.name} <span className="tool-n">{t.at.length}</span>
                      </button>
                    ) : (
                      <span className="tool tool-plain">{t.name}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
