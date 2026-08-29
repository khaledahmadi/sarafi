/** Shared "last user activity" clock used for untrusted-device idle timeout. */
let lastActivity = Date.now();
let installed = false;

const EVENTS = ["pointerdown", "keydown", "scroll", "visibilitychange"] as const;

export function getLastActivity() {
  return lastActivity;
}

export function markActivity() {
  lastActivity = Date.now();
}

/** Installs global activity listeners once; returns an unsubscribe for the caller. */
export function trackActivity(onActivity: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    markActivity();
    onActivity();
  };
  EVENTS.forEach((event) => window.addEventListener(event, handler, { passive: true }));
  installed = true;
  return () => {
    EVENTS.forEach((event) => window.removeEventListener(event, handler));
  };
}

export function activityTrackingInstalled() {
  return installed;
}
