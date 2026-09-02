import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import { useRoles, useSession } from "@/hooks/use-session";
import { useSignOut } from "@/hooks/use-sign-out";
import { useSiteSettings } from "@/hooks/use-settings";
import { resolveAuthNavState, type AuthUser } from "@/lib/api/auth-store";
import { LanguageSwitcher, useLocale } from "@/i18n";
import { BrandMark } from "@/components/site/BrandMark";

export function Header() {
  const { get } = useSiteSettings();
  const { t } = useLocale();
  const brandName = get("brand.name");

  const nav = useMemo(
    () =>
      [
        { to: "/", label: t("nav.home") },
        { to: "/rates", label: t("nav.rates") },
        { to: "/services", label: t("nav.services") },
        { to: "/branches", label: t("nav.branches") },
        { to: "/articles", label: t("nav.articles") },
        { to: "/about", label: t("nav.about") },
        { to: "/faq", label: t("nav.faq") },
        { to: "/feedback", label: t("nav.feedback") },
        { to: "/contact", label: t("nav.contact") },
      ] as const,
    [t],
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 surface-navy/95 surface-navy backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl flex-nowrap items-center gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <BrandMark />
          <span className="whitespace-nowrap text-base font-bold text-navy-foreground">
            {brandName}
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 flex-nowrap items-center justify-center gap-0.5 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="shrink-0 whitespace-nowrap rounded-lg px-2 py-2 text-sm text-navy-foreground/75 transition-colors hover:bg-white/10 hover:text-navy-foreground"
              activeProps={{ className: "bg-white/10 text-accent" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex shrink-0 items-center gap-2">
          <LanguageSwitcher compact />
          <div className="hidden lg:block">
            <HeaderAuth />
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderAuth() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, ready } = useSession();
  const { isStaff } = useRoles();
  const { signOut, signingOut } = useSignOut();
  const authNav = resolveAuthNavState(user, ready);
  const { t } = useLocale();

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  switch (authNav) {
    case "pending":
      return (
        <span
          className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-2 xl:px-3"
          aria-label={t("common.sessionChecking")}
          aria-busy="true"
        >
          <span className="size-4 shrink-0 animate-pulse rounded bg-white/25" />
          <span className="inline-block h-4 w-[7rem] animate-pulse rounded bg-white/25 xl:w-[9rem]" />
          <span className="size-4 shrink-0 animate-pulse rounded bg-white/25" />
        </span>
      );
    case "user":
      return user ? (
        <UserMenu
          user={user}
          isStaff={isStaff}
          menuOpen={menuOpen}
          menuRef={menuRef}
          signingOut={signingOut}
          onToggle={() => setMenuOpen((open) => !open)}
          onClose={() => setMenuOpen(false)}
          onSignOut={() => {
            setMenuOpen(false);
            void signOut();
          }}
        />
      ) : null;
    case "guest":
      return (
        <Link
          to="/auth"
          className="whitespace-nowrap rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        >
          {t("common.signIn")}
        </Link>
      );
    default: {
      const _never: never = authNav;
      return _never;
    }
  }
}

function UserMenu({
  user,
  isStaff,
  menuOpen,
  menuRef,
  signingOut,
  onToggle,
  onClose,
  onSignOut,
}: {
  user: AuthUser;
  isStaff: boolean;
  menuOpen: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  signingOut: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-2 text-sm font-semibold text-navy-foreground transition-colors hover:bg-white/20 xl:px-3"
      >
        <User className="size-4 shrink-0" />
        <span className="max-w-[7rem] truncate xl:max-w-[9rem]">{user.email}</span>
        <ChevronDown className="size-4 shrink-0 opacity-70" />
      </button>
      {menuOpen ? (
        <div
          role="menu"
          className="absolute end-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card p-1 text-card-foreground shadow-xl"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-semibold" dir="ltr">
              {user.email}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{t("common.account")}</p>
          </div>

          <div className="flex flex-col gap-1 pt-1">
            {isStaff ? (
              <Link
                to="/dashboard"
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
              >
                <LayoutDashboard className="size-4" /> {t("common.dashboard")}
              </Link>
            ) : null}

            <button
              onClick={onSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
            >
              <LogOut className="size-4" />
              {signingOut ? t("common.signingOut") : t("common.signOut")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
