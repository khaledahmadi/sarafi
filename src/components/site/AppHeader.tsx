import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  Clock,
  ExternalLink,
  LogOut,
  ShieldCheck,
  User,
} from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useSignOut } from "@/hooks/use-sign-out";
import { useSessionCountdown } from "@/hooks/use-session-countdown";
import { site } from "@/lib/site";

/** Header for the private dashboard, separate from the public site. */
export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useSession();
  const { signOut, signingOut } = useSignOut();
  const countdown = useSessionCountdown();

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex h-[var(--app-header-height)] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-base font-extrabold text-accent-foreground">
              س
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold">{site.name}</span>
              <span className="text-[11px] text-muted-foreground">داشبورد</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            <ExternalLink className="size-3.5" /> سایت عمومی
          </a>

          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted/70"
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
                            {countdown.idleLimited ? "مهلت بی‌فعالیتی" : "اعتبار نشست"}
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
                              ? "bg-accent/15 text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <ShieldCheck className="size-3" />
                          {countdown.trusted ? "دستگاه مورد اعتماد" : "دستگاه عمومی"}
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      void signOut();
                    }}
                    disabled={signingOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                  >
                    <LogOut className="size-4" />
                    {signingOut ? "در حال خروج…" : "خروج از حساب"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
