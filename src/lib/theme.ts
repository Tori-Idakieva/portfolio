// Light and dark mode. "system" follows the device; the other two are the visitor's own choice,
// remembered in localStorage. The CSS reads data-theme on <html> (see globals.css).

export type ThemeChoice = "light" | "dark" | "system";
const KEY = "theme";
export const THEME_EVENT = "theme:change";

export function storedTheme(): ThemeChoice {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function effectiveTheme(): "light" | "dark" {
  const t = document.documentElement.dataset.theme;
  if (t === "light" || t === "dark") return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;
  try {
    if (choice === "system") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, choice);
  } catch {
    // Private windows can block storage; the switch still works for this visit.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

// Runs in <head> before the first paint, so a saved choice never flashes the other theme.
export const THEME_BOOT = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
