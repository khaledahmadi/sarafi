const STORAGE_KEY = "sarafi.trusted_device";
const EVENT = "sarafi:trusted-device-change";

/** Untrusted devices are signed out after this much inactivity. */
export const UNTRUSTED_IDLE_MS = 30 * 60 * 1000;

export function isTrustedDevice() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setTrustedDevice(trusted: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (trusted) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function onTrustedDeviceChange(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
