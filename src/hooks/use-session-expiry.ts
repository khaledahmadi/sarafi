import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocale } from "@/i18n";
import { logout, refreshSession } from "@/lib/api/auth";
import { getAuthSnapshot, subscribeAuth } from "@/lib/api/auth-store";
import { getLastActivity, trackActivity } from "@/lib/activity";
import { isTrustedDevice, onTrustedDeviceChange, UNTRUSTED_IDLE_MS } from "@/lib/trusted-device";

const WARN_BEFORE_MS = 2 * 60 * 1000;

/**
 * Watches the app session and signs the user out when it ends.
 * Trusted devices keep the session alive with silent refreshes.
 * Untrusted devices expire after UNTRUSTED_IDLE_MS of inactivity.
 */
export function useSessionExpiry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const expiring = useRef(false);

  useEffect(() => {
    let expiresAt: number | null = null;

    const clearTimers = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };

    const endSession = async (message: string) => {
      if (expiring.current) return;
      expiring.current = true;
      clearTimers();
      await queryClient.cancelQueries();
      queryClient.clear();
      await logout();
      toast.error(message);
      navigate({ to: "/auth", replace: true });
      expiring.current = false;
    };

    const expireNow = async () => {
      if (expiring.current) return;
      expiring.current = true;
      clearTimers();
      try {
        const user = await refreshSession();
        if (user) {
          expiring.current = false;
          expiresAt = getAuthSnapshot().expiresAt;
          schedule();
          return;
        }
      } catch {
        /* fall through */
      }
      expiring.current = false;
      await endSession(t("session.expired"));
    };

    const schedule = () => {
      clearTimers();
      if (!expiresAt) return;
      const trusted = isTrustedDevice();
      const tokenMsLeft = expiresAt * 1000 - Date.now();
      const idleMsLeft = trusted
        ? Number.POSITIVE_INFINITY
        : getLastActivity() + UNTRUSTED_IDLE_MS - Date.now();
      const idleFirst = idleMsLeft < tokenMsLeft;
      const msLeft = Math.min(tokenMsLeft, idleMsLeft);

      if (msLeft <= 0) {
        if (idleFirst) {
          void endSession(t("session.idleLogout"));
        } else {
          void expireNow();
        }
        return;
      }

      const warnIn = msLeft - WARN_BEFORE_MS;
      if (warnIn > 0) {
        timers.current.push(
          setTimeout(() => {
            toast.warning(t("session.expiringSoon"), {
              description: idleFirst ? t("session.untrustedWarn") : t("session.tokenWarn"),
            });
          }, warnIn),
        );
      }
      timers.current.push(
        setTimeout(() => (idleFirst ? void schedule() : void expireNow()), msLeft),
      );
    };

    const refresh = () => {
      const snap = getAuthSnapshot();
      expiresAt = snap.expiresAt;
      if (expiresAt) schedule();
      else clearTimers();
    };

    refresh();
    const unsubscribe = subscribeAuth(refresh);

    const stopActivity = trackActivity(() => {
      if (expiresAt && !isTrustedDevice()) schedule();
    });
    const stopTrustedWatch = onTrustedDeviceChange(() => schedule());
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      clearTimers();
      stopActivity();
      stopTrustedWatch();
      window.removeEventListener("focus", onFocus);
      unsubscribe();
    };
  }, [navigate, queryClient, t]);
}
