"use client";

import { useEffect, useState } from "react";
import { scrollToElement } from "@/lib/scroll";

type Item = { id: string; label: string };

// A numbered index pinned to the right edge on wide screens. It lights up the section being read
// and jumps to any other. Built from the page's own section heads, so it never drifts out of sync.
export function SectionRail() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>("main section[id]")].filter((s) =>
      s.querySelector(":scope > .section-head"),
    );
    setItems(sections.map((s) => ({ id: s.id, label: s.querySelector(".section-head .label")?.textContent ?? s.id })));

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));

    // Only show the rail once the visitor is past the header, and hide it again at the contact section.
    const header = document.getElementById("top");
    const contact = document.getElementById("contact");
    const onScroll = () => {
      const h = header?.getBoundingClientRect();
      const c = contact?.getBoundingClientRect();
      setShown(!!h && h.bottom < 0 && (!c || c.top > window.innerHeight * 0.5));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!items.length) return null;
  return (
    <nav className="rail" aria-label="Page sections" data-shown={shown}>
      <ol>
        {items.map((it, i) => (
          <li key={it.id}>
            <button
              type="button"
              aria-current={active === it.id ? "true" : undefined}
              onClick={() => scrollToElement(it.id)}
              tabIndex={shown ? 0 : -1}
            >
              <span className="rail-label">{it.label}</span>
              <span className="rail-num">{String(i + 1).padStart(2, "0")}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
