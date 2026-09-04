import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  Clock,
  LogOut,
  ShieldCheck,
  User,
} from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useSignOut } from "@/hooks/use-sign-out";
import { useSessionCountdown } from "@/hooks/use-session-countdown";
import { useSiteSettings } from "@/hooks/use-settings";
import { LanguageSwitcher, useLocale } from "@/i18n";
import { ThemeSwitcher } from "@/theme";
import { BrandMark } from "@/components/site/BrandMark";

/** Header for the private dashboard, separate from the public site. */
export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, ready } = useSession();
  const { signOut, signingOut } = useSignOut();
  const countdown = useSessionCountdown();
  const { get } = useSiteSettings();
  const { t } = useLocale();
  const brandName = get("brand.name");

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-[var(--app-header-height)] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <BrandMark size="size-9" />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold">{brandName}</span>
              <span className="text-[11px] text-sidebar-foreground/70">
                {t("appHeader.dashboard")}
              </span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitcher compact variant="chrome" />
          <LanguageSwitcher compact variant="chrome" />

          {!ready ? (
            <span
              className="flex items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2"
              aria-label={t("common.sessionChecking")}
              aria-busy="true"
            >
              <span className="size-4 shrink-0 animate-pulse rounded bg-sidebar-foreground/20" />
              <span className="inline-block h-4 w-[9rem] animate-pulse rounded bg-sidebar-foreground/20" />
              <span className="size-4 shrink-0 animate-pulse rounded bg-sidebar-foreground/20" />
            </span>
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2 text-sm font-semibold transition-colors hover:bg-sidebar-accent/80"
              >
                <User className="size-4" />
                <span className="max-w-[9rem] truncate">{user.email}</span>
                <ChevronDown className="size-4 opacity-70" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute end-0 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card p-1 text-card-foreground shadow-xl"
                >
                  <div className="border-b border-border px-3 py-2.5">
                    <p className="truncate text-sm font-semibold" dir="ltr">
                      {user.email}
                    </p>
                    {countdown && (
                      <>
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="size-3.5" />
                            {countdown.idleLimited
                              ? t("appHeader.idleDeadline")
                              : t("appHeader.sessionValid")}
                          </span>
                          <span
                            aria-live="polite"
                            className={`font-semibold tabular-nums ${countdown.warning ? "text-destructive" : "text-foreground"}`}
                          >
                            {countdown.label}
                          </span>
                        </div>
                        <span
                          className={`mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                            countdown.trusted
                              ? "soft-badge-accent"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <ShieldCheck className="size-3" />
                          {countdown.trusted
                            ? t("appHeader.trustedDevice")
                            : t("appHeader.publicDevice")}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        void signOut();
                      }}
                      disabled={signingOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                    >
                      <LogOut className="size-4" />
                      {signingOut ? t("common.signingOut") : t("common.signOut")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
