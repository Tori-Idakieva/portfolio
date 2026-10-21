// Scrolls an element into view and keeps correcting until it actually lands there.
//
// A single smooth scrollIntoView goes wrong when the page changes height mid-scroll, which is
// what happens here: a filter re-renders the experience list, a row opens, a view transition
// runs. On long phone pages (and in iOS Safari especially) that left visitors short of the
// target. So: wait for React to render, scroll, wait for the scroll to settle, re-measure, and
// glide the rest of the way. Any touch, wheel or key from the visitor hands control back.

const SETTLE_FRAMES = 8;
const MAX_TRIES = 3;
const MAX_WAIT_MS = 2500;

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function whenSettled(done: () => void) {
  let last = window.scrollY;
  let still = 0;
  const start = performance.now();
  const tick = () => {
    const y = window.scrollY;
    still = Math.abs(y - last) < 1 ? still + 1 : 0;
    last = y;
    if (still >= SETTLE_FRAMES || performance.now() - start > MAX_WAIT_MS) done();
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function scrollToElement(id: string, block: ScrollLogicalPosition = "start") {
  let cancelled = false;
  const cancel = () => {
    cancelled = true;
  };
  const events = ["touchstart", "wheel", "keydown"] as const;
  const stop = () => events.forEach((e) => window.removeEventListener(e, cancel));
  events.forEach((e) => window.addEventListener(e, cancel, { passive: true }));

  let tries = 0;
  const go = () => {
    const el = document.getElementById(id);
    if (!el || cancelled) return stop();
    // Measure where the browser would put the element, honouring scroll-margin and padding,
    // then move back and glide there. Both jumps happen before the next paint, so nothing flickers.
    const from = window.scrollY;
    el.scrollIntoView({ behavior: "instant", block });
    const to = window.scrollY;
    if (Math.abs(to - from) < 4 || tries >= MAX_TRIES) return stop();
    tries += 1;
    if (!reducedMotion()) {
      window.scrollTo({ top: from, behavior: "instant" });
      window.scrollTo({ top: to, behavior: "smooth" });
    }
    whenSettled(go);
  };
  requestAnimationFrame(() => requestAnimationFrame(go));
}
