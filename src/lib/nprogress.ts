/**
 * NProgress-compatible top bar used by NavigationTopLoader.
 * Settings match edustaff-portal nextjs-toploader (height 3, crawl, no spinner).
 */

const MINIMUM = 0.08;
const SPEED = 200;
const TRICKLE_SPEED = 200;

let status: number | null = null;
let trickleTimer: ReturnType<typeof setTimeout> | null = null;
let removeTimer: ReturnType<typeof setTimeout> | null = null;

function clamp(n: number, min: number, max: number) {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function toBarPerc(n: number) {
  return (-1 + n) * 100;
}

function ensureRoot() {
  let root = document.getElementById("nprogress");
  if (root) return root;

  root = document.createElement("div");
  root.id = "nprogress";
  root.innerHTML = '<div class="bar" role="bar"><div class="peg"></div></div>';
  (document.body || document.documentElement).appendChild(root);
  return root;
}

function barEl() {
  return ensureRoot().querySelector<HTMLElement>('[role="bar"]');
}

function setBar(n: number, speed = SPEED) {
  const bar = barEl();
  if (!bar) return;
  bar.style.width = "100%";
  bar.style.transition = `transform ${speed}ms ease, opacity ${speed}ms ease`;
  bar.style.transform = `translate3d(${toBarPerc(n)}%,0,0)`;
}

function clearTrickle() {
  if (trickleTimer) {
    clearTimeout(trickleTimer);
    trickleTimer = null;
  }
}

function trickle() {
  if (status === null) return;
  const amount = status < 0.2 ? 0.1 : status < 0.5 ? 0.04 : status < 0.8 ? 0.02 : 0.005;
  set(status + Math.random() * amount);
  trickleTimer = setTimeout(trickle, TRICKLE_SPEED);
}

function set(n: number) {
  if (typeof document === "undefined") return;
  if (removeTimer) {
    clearTimeout(removeTimer);
    removeTimer = null;
  }

  const started = status !== null;
  n = clamp(n, MINIMUM, 1);
  status = n === 1 ? null : n;

  const root = ensureRoot();
  root.style.opacity = "1";
  if (!started) {
    setBar(0, 0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setBar(n));
    });
  } else {
    setBar(n);
  }

  if (n === 1) {
    setBar(1);
    removeTimer = setTimeout(() => {
      root.style.transition = `opacity ${SPEED}ms ease`;
      root.style.opacity = "0";
      removeTimer = setTimeout(() => {
        root.remove();
        removeTimer = null;
      }, SPEED);
    }, SPEED);
  }
}

export const NProgress = {
  start() {
    if (typeof document === "undefined") return;
    if (status === null) set(MINIMUM);
    clearTrickle();
    trickleTimer = setTimeout(trickle, TRICKLE_SPEED);
  },
  done() {
    if (typeof document === "undefined") return;
    if (status === null && !document.getElementById("nprogress")) return;
    clearTrickle();
    set(1);
  },
};
