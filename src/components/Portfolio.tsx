"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { orderedEvidence, person, pitches, ROLE_LABELS, ROLES, type Role } from "@/content/profile";
import { Assistant, PREVIEW } from "./Assistant";
import { Terminal } from "./Terminal";
import { Certifications, EvidenceList, GitHubProjects, SpotTheBug, Stats, Timeline, Toolkit, type Filter } from "./Showcase";

const ROLE_BLURBS: Record<Role, string> = {
  all: "The whole picture",
  frontend: "React, TypeScript, data UI",
  product: "Users, discovery, delivery",
  fullstack: "APIs, testing, CI/CD",
  consultant: "Client delivery, advising founders",
  appsec: "Pentesting, secure dev",
};

const [first, ...restParts] = person.name.split(" ");
const rest = restParts.join(" ");

export function Portfolio({ initialRole }: { initialRole: Role }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [filter, setFilter] = useState<Filter>(null);
  const [announcement, setAnnouncement] = useState("");
  const heroRef = useRef<HTMLElement>(null);

  // A soft light in the role's colour follows the pointer across the header.
  useEffect(() => {
    const el = heroRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return;
    let raf = 0;
    function onMove(e: PointerEvent) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el!.getBoundingClientRect();
        el!.style.setProperty("--px", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        el!.style.setProperty("--py", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
        el!.dataset.pointer = "";
      });
    }
    el.addEventListener("pointermove", onMove);
    return () => {
      el.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Static previews can't read the query string, so they accept #appsec style links.
  useEffect(() => {
    if (!PREVIEW) return;
    const fromHash = window.location.hash.slice(1);
    if ((ROLES as readonly string[]).includes(fromHash)) setRole(fromHash as Role);
  }, []);

  const withTransition = useCallback((apply: () => void) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !reduce) doc.startViewTransition(apply);
    else apply();
  }, []);

  const chooseRole = useCallback(
    (next: Role) => {
      withTransition(() => setRole(next));
      try {
        const url = new URL(window.location.href);
        if (next === "all") url.searchParams.delete("role");
        else url.searchParams.set("role", next);
        window.history.replaceState(null, "", url);
      } catch {
        // Some embedded viewers block history changes; the lens still works.
      }
      const count = next === "all" ? orderedEvidence(next).length : orderedEvidence(next).filter((e) => e.weight[next] >= 2).length;
      setAnnouncement(`Showing evidence for ${ROLE_LABELS[next]}, ${count} relevant items.`);
    },
    [withTransition],
  );

  const chooseFilter = useCallback(
    (f: Filter) => {
      withTransition(() => setFilter(f));
      setAnnouncement(f ? `Evidence filtered to ${f.label}.` : "Showing all evidence.");
    },
    [withTransition],
  );

  // Sections slide up as they enter the viewport. Anything already on screen stays put.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("main > section, .contact > .wrap"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    for (const el of targets) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.85) continue;
      el.querySelectorAll<HTMLElement>(".row, .repo-list li, .tool, .tl-bar, li").forEach((child, i) => child.style.setProperty("--i", String(i % 12)));
      el.classList.add("reveal");
      io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  return (
    <div className="page" data-lens={role}>
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>

      <nav className="topbar" aria-label="Sections">
        <span className="mark" aria-hidden="true">
          Viktoria Idakieva
        </span>
        <ul>
          <li>
            <a href="#work">Work</a>
          </li>
          <li>
            <a href="#timeline">Career</a>
          </li>
          <li>
            <a href="#security">Try it</a>
          </li>
          <li>
            <a href="#toolkit">Toolkit</a>
          </li>
          <li>
            <a href="#contact" className="nav-cta">
              Contact
            </a>
          </li>
        </ul>
      </nav>

      <header className="hero wrap" id="top" ref={heroRef}>
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-intro">
          <p className="eyebrow">Software engineer · {person.location}</p>
          <h1 className="hero-name" aria-label={person.name}>
            <Letters text={first} start={0} />{" "}
            <span className="hero-surname">
              <Letters text={rest} start={first.length + 1} />
            </span>
          </h1>
          <Rotator role={role} onPick={chooseRole} />
          <p className="headline">{person.headline}</p>
        </div>
        <Terminal role={role} />
        <LensPicker role={role} onChange={chooseRole} />
      </header>

      <main>
        <Assistant role={role} />
        <section className="pitch-band wrap" aria-labelledby="pitch-title">
          <div className="pitch-main">
            <h2 id="pitch-title" className="label">
              Why Viktoria{role === "all" ? "" : `, for ${/^[AEIOU]/.test(ROLE_LABELS[role]) ? "an" : "a"} ${ROLE_LABELS[role]} role`}
            </h2>
            <p className="pitch" key={role}>
              {pitches[role]}
            </p>
          </div>
          <Stats role={role} />
        </section>
        <EvidenceList role={role} filter={filter} onFilter={chooseFilter} />
        <Certifications />
        <SpotTheBug />
        <GitHubProjects />
        <Timeline
          filter={filter}
          onFilter={(f) => {
            chooseFilter(f);
            if (f) document.getElementById("work")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
        <Toolkit filter={filter} onFilter={chooseFilter} />
      </main>

      <Contact />
    </div>
  );
}

// Each letter rises into place in turn. Screen readers get the whole name from the h1's label.
function Letters({ text, start }: { text: string; start: number }) {
  return (
    <span className="word">
      {Array.from(text).map((ch, i) => (
        <span key={i} className="ch" aria-hidden="true" style={{ "--c": start + i } as React.CSSProperties}>
          {ch}
        </span>
      ))}
    </span>
  );
}

// One line that cycles through what Viktoria builds for each role. Clicking it picks that role;
// once a role is chosen the line settles on it.
const ROTATOR: { role: Exclude<Role, "all">; text: string }[] = [
  { role: "frontend", text: "accessible, data-rich interfaces" },
  { role: "product", text: "products with the people who use them" },
  { role: "fullstack", text: "features end to end" },
  { role: "consultant", text: "alongside client teams" },
  { role: "appsec", text: "software that is secure by design" },
];

function Rotator({ role, onPick }: { role: Role; onPick: (r: Role) => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (role !== "all") {
      setI(ROTATOR.findIndex((x) => x.role === role));
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % ROTATOR.length), 2600);
    return () => clearInterval(t);
  }, [role]);
  const cur = ROTATOR[i];
  return (
    <p className="rotator">
      <span className="rotator-lead">Builds</span>{" "}
      <button type="button" className="rotator-word" data-role={cur.role} key={cur.role} onClick={() => onPick(cur.role)} title={`Show the ${ROLE_LABELS[cur.role]} view`}>
        {cur.text}
      </button>
    </p>
  );
}

function LensPicker({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  return (
    <fieldset className="lens-picker">
      <legend>I&apos;m hiring for</legend>
      <div className="lens-options">
        {ROLES.map((r, i) => (
          <label key={r} className="lens-option" data-role={r} title={ROLE_BLURBS[r]} style={{ "--n": i } as React.CSSProperties}>
            <input type="radio" name="lens" value={r} checked={role === r} onChange={() => onChange(r)} />
            <span className="lens-dot" aria-hidden="true" />
            {r === "all" ? "Any role" : ROLE_LABELS[r]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Contact() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(person.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const range = document.createRange();
      const el = document.getElementById("email-text");
      if (el) {
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  }
  return (
    <footer className="contact" id="contact">
      <div className="contact-glow" aria-hidden="true" />
      <div className="wrap contact-grid">
        <div>
          <p className="label">Contact</p>
          <h2>
            Let&apos;s <em>talk.</em>
          </h2>
          <p className="contact-lede">Hiring for one of these roles, or want to talk through a project? Email is the quickest way to reach Viktoria.</p>
          <p className="email-row">
            <a id="email-text" className="email" href={`mailto:${person.email}`}>
              {person.email}
            </a>
            <button type="button" className="btn-quiet" onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </button>
            <span className="visually-hidden" aria-live="polite">
              {copied ? "Email address copied" : ""}
            </span>
          </p>
        </div>
        <dl className="contact-facts">
          <div>
            <dt>Roles</dt>
            <dd>{ROLES.filter((r) => r !== "all").map((r) => ROLE_LABELS[r]).join(", ")}</dd>
          </div>
          <div>
            <dt>Based in</dt>
            <dd>{person.location}</dd>
          </div>
          <div>
            <dt>Elsewhere</dt>
            <dd>
              <ul className="links">
                <li>
                  <a href={person.github}>GitHub ↗</a>
                </li>
                {person.linkedin && (
                  <li>
                    <a href={person.linkedin}>LinkedIn ↗</a>
                  </li>
                )}
                <li>
                  <a href="#assistant">Ask the AI</a>
                </li>
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </footer>
  );
}
