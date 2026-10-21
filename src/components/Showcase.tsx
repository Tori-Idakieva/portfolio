"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { JUMP_EVENT, scrollToElement } from "@/lib/scroll";
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

export function matches(item: Evidence, filter: Filter): boolean {
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
                  if (!active) scrollToElement("work");
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

  // Arriving from a citation, stat or certificate link (see jumpTo in Portfolio) opens the row and
  // briefly lights it up so the eye finds it.
  useEffect(() => {
    const onArrive = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== item.id) return;
      setOpen(true);
      flashRef.current?.animate([{ opacity: 1 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], {
        duration: reducedMotion() ? 1600 : 2600,
        easing: "ease-out",
      });
    };
    window.addEventListener(JUMP_EVENT, onArrive);
    return () => window.removeEventListener(JUMP_EVENT, onArrive);
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
          <li key={c.id} id={c.id} className="cert">
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

// A pool of snippets; each game deals a random three. Every one says what's wrong, how Viktoria
// would fix it, and what it costs a business if it ships.
type Snippet = { lang: string; title: string; lines: string[]; bad: number; name: string; why: string; fix: string; risk: string };

const SNIPPETS: Snippet[] = [
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
    why: "The body is user input rendered as raw HTML, so a comment can carry a script.",
    fix: "Render it as text, or sanitise it with an allowlist such as DOMPurify, and back it with a Content Security Policy.",
    risk: "The script runs in every reader's browser: it can steal sessions and act as your users, with the incident costs and loss of trust that follow.",
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
    why: "Any logged-in user can read any invoice by changing the id in the URL.",
    fix: "Scope the lookup to the owner, for example findOne({ id, ownerId: req.user.id }), and add a test that one user can't read another's invoice.",
    risk: "Customers see each other's financial data: a reportable personal data breach under UK GDPR, with possible fines and lost customers.",
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
    why: "The email is pasted into the query, so ' OR '1'='1 returns a user.",
    fix: "Use a parameterised query: cur.execute(\"... WHERE email = %s\", (email,)), and give the app's database user only the access it needs.",
    risk: "An attacker can read or change the whole users table: stolen credentials, a data breach and possibly the full database.",
  },
  {
    lang: "Next.js",
    title: "A client-side rates widget",
    lines: [
      '"use client";',
      "",
      "export async function getRates() {",
      '  const res = await fetch("https://api.fx.example/rates", {',
      '    headers: { Authorization: "Bearer sk_live_9f3a71c2" },',
      "  });",
      "  return res.json();",
      "}",
    ],
    bad: 4,
    name: "Secret shipped to the browser",
    why: "Code in a client component is sent to every visitor, so anyone can read the live key in their dev tools.",
    fix: "Rotate the key, keep it in a server-side environment variable, and call the API from a server route that the browser calls instead.",
    risk: "Anyone can use the paid account: surprise bills, rate limits that take your feature down, or access to data behind the key.",
  },
  {
    lang: "Express",
    title: "A login callback",
    lines: [
      'app.get("/login/callback", async (req, res) => {',
      "  await completeLogin(req);",
      "  res.redirect(req.query.next);",
      "});",
    ],
    bad: 2,
    name: "Open redirect",
    why: "The redirect target comes straight from the URL, so a link on your domain can send people anywhere.",
    fix: "Only accept relative paths, or check the target against an allowlist of your own URLs, and fall back to the home page.",
    risk: "Phishing emails can use your trusted login link to land customers on a fake page that harvests their passwords.",
  },
  {
    lang: "Express",
    title: "An admin route",
    lines: [
      'router.delete("/api/users/:id", async (req, res) => {',
      "  await db.users.delete(req.params.id);",
      "  res.sendStatus(204);",
      "});",
    ],
    bad: 0,
    name: "Missing authorisation",
    why: "Nothing checks who is calling, so anyone who finds the endpoint can delete accounts.",
    fix: "Require login and an admin role in middleware before the handler runs, log admin actions, and test that ordinary users get a 403.",
    risk: "Customer accounts and data can be wiped by anyone: an outage, a data-loss incident and a hard conversation with the regulator.",
  },
  {
    lang: "Node.js",
    title: "Password storage",
    lines: [
      'import crypto from "node:crypto";',
      "",
      "export function hashPassword(password) {",
      '  return crypto.createHash("md5").update(password).digest("hex");',
      "}",
    ],
    bad: 3,
    name: "Weak password hashing",
    why: "MD5 is fast and unsalted, so leaked hashes can be cracked in bulk within hours.",
    fix: "Use a slow, salted algorithm built for passwords, such as Argon2id or bcrypt, and rehash old passwords when users next sign in.",
    risk: "If the database ever leaks, most passwords are recovered, and customers who reuse them lose their other accounts too.",
  },
  {
    lang: "Express",
    title: "An admin check",
    lines: [
      'const token = req.headers.authorization?.split(" ")[1];',
      "const user = jwt.decode(token);",
      'if (user?.role === "admin") return next();',
      "res.sendStatus(403);",
    ],
    bad: 1,
    name: "Unverified JWT",
    why: "jwt.decode reads the token without checking its signature, so anyone can write their own admin token.",
    fix: "Use jwt.verify with the secret and a fixed algorithm list, for example { algorithms: [\"HS256\"] }, and keep tokens short-lived.",
    risk: "Anyone can become an admin: full control of the application and its data.",
  },
  {
    lang: "Flask",
    title: "A file download",
    lines: [
      '@app.get("/files/<path:name>")',
      "def download(name):",
      '    return open(f"/srv/uploads/{name}", "rb").read()',
    ],
    bad: 2,
    name: "Path traversal",
    why: "The filename comes from the URL, so ../../etc/passwd walks out of the uploads folder.",
    fix: "Use send_from_directory, or resolve the path and reject anything outside the uploads folder, and look files up by id rather than name.",
    risk: "Attackers can read server files such as configuration and keys, often the first step to a full compromise.",
  },
];

const ROUND_COUNT = 3;

function deal(avoid: Snippet[] = []): Snippet[] {
  const fresh = SNIPPETS.filter((s) => !avoid.includes(s));
  const from = fresh.length >= ROUND_COUNT ? fresh : SNIPPETS;
  return [...from].sort(() => Math.random() - 0.5).slice(0, ROUND_COUNT);
}

export function SpotTheBug() {
  // The first render uses a fixed set so server and browser agree; the browser then deals at random.
  const [rounds, setRounds] = useState<Snippet[]>(() => SNIPPETS.slice(0, ROUND_COUNT));
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  useEffect(() => setRounds(deal()), []);
  const done = round >= rounds.length;
  const r = rounds[Math.min(round, rounds.length - 1)];
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
          The kind of thing Viktoria catches in code review. Click the line you&apos;d flag. There are three snippets each game, dealt at random.
        </p>
      </div>
      <div className="bug-box">
        <div className="bug-bar">
          <span>{done ? "Finished" : `${r.lang} · ${r.title}`}</span>
          <span className="bug-score" aria-live="polite">
            {score}/{rounds.length}
          </span>
        </div>
        {done ? (
          <div className="bug-end">
            <p className="bug-end-score">
              {score === rounds.length ? "Clean sweep." : score > 0 ? "Not bad." : "Tricky, right?"} You found {score} of {rounds.length}.
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
                  setRounds((prev) => deal(prev));
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
                  <li key={`${r.title}-${i}`} data-state={state}>
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
                  <strong>{picked === r.bad ? "Got it." : `Not quite, it's line ${r.bad + 1}.`}</strong> {r.name}. {r.why}
                </p>
                <dl className="bug-notes">
                  <div>
                    <dt>How Viktoria would fix it</dt>
                    <dd>{r.fix}</dd>
                  </div>
                  <div>
                    <dt>Business risk if it ships</dt>
                    <dd>{r.risk}</dd>
                  </div>
                </dl>
                <button type="button" className="btn" onClick={next}>
                  {round === rounds.length - 1 ? "See score" : "Next snippet"}
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
                            scrollToElement("certifications");
                            return;
                          }
                          onFilter(active ? null : skillFilter(t.name));
                          if (!active) scrollToElement("work");
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
