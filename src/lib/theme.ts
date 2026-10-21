// Light and dark mode. The site starts light; dark is the visitor's own choice, remembered in
// localStorage. The CSS reads data-theme on <html> (see globals.css).

export type ThemeChoice = "light" | "dark";
const KEY = "theme";
export const THEME_EVENT = "theme:change";

export function effectiveTheme(): ThemeChoice {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "dark") root.dataset.theme = "dark";
  else delete root.dataset.theme;
  try {
    if (choice === "dark") window.localStorage.setItem(KEY, "dark");
    else window.localStorage.removeItem(KEY);
  } catch {
    // Private windows can block storage; the switch still works for this visit.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

// Runs in <head> before the first paint, so a saved choice never flashes the other theme.
export const THEME_BOOT = `try{var t=localStorage.getItem("${KEY}");if(t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
