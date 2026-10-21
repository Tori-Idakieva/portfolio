"use client";

import { useEffect, useState } from "react";
import { effectiveTheme, setTheme, THEME_EVENT } from "@/lib/theme";

// A small light switch in the top bar. The terminal has its own way in: "lights off".
export function ThemeToggle() {
  const [theme, setLocal] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const sync = () => setLocal(effectiveTheme());
    sync();
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      onClick={() => setTheme(next)}
      // Hidden until mounted, so the server never renders the wrong icon.
      style={theme ? undefined : { visibility: "hidden" }}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}
