import { useEffect, useState, useSyncExternalStore } from "react";
import { getRenderAuthSnapshot, getServerAuthSnapshot, subscribeAuth } from "@/lib/api/auth-store";
import { getLastActivity } from "@/lib/activity";
import { isTrustedDevice, onTrustedDeviceChange, UNTRUSTED_IDLE_MS } from "@/lib/trusted-device";

function faDigits(value: string) {
  return value.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);
}

/**
 * Remaining lifetime of the current session, refreshed every second.
 * On untrusted devices the countdown also accounts for the inactivity timeout.
 */
export function useSessionCountdown() {
  const snapshot = useSyncExternalStore(subscribeAuth, getRenderAuthSnapshot, getServerAuthSnapshot);
  const [trusted, setTrusted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const expiresAt = snapshot.expiresAt;

  useEffect(() => {
    setTrusted(isTrustedDevice());
    return onTrustedDeviceChange(() => setTrusted(isTrustedDevice()));
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;

  const tokenMsLeft = expiresAt * 1000 - now;
  const idleMsLeft = trusted
    ? Number.POSITIVE_INFINITY
    : getLastActivity() + UNTRUSTED_IDLE_MS - now;
  const idleFirst = idleMsLeft < tokenMsLeft;
  const msLeft = Math.max(0, Math.min(tokenMsLeft, idleMsLeft));

  const totalSeconds = Math.floor(msLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const label = faDigits(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);

  return {
    msLeft,
    label,
    trusted,
    idleLimited: !trusted && idleFirst,
    expired: msLeft === 0,
    warning: msLeft > 0 && msLeft <= 2 * 60 * 1000,
  };
}
