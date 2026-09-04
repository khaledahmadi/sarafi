import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, LayoutDashboard, LogOut, Menu, User } from "lucide-react";
import { useRoles, useSession } from "@/hooks/use-session";
import { useSignOut } from "@/hooks/use-sign-out";
import { useSiteSettings } from "@/hooks/use-settings";
import { resolveAuthNavState, type AuthUser } from "@/lib/api/auth-store";
import { LanguageSwitcher, useLocale } from "@/i18n";
import { ThemeSwitcher } from "@/theme";
import { BrandMark } from "@/components/site/BrandMark";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string };

export function Header() {
  const { get } = useSiteSettings();
  const { t, dir } = useLocale();
  const brandName = get("brand.name");
  const [mobileOpen, setMobileOpen] = useState(false);

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
      ] satisfies NavItem[],
    [t],
  );

  useEffect(() => {
    function onResize() {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setMobileOpen(false);
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar/95 text-sidebar-foreground backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 sm:gap-3">
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-sidebar-foreground transition-colors hover:bg-sidebar-accent/80 lg:hidden"
          aria-label={mobileOpen ? t("common.closeMenu") : t("common.openMenu")}
          aria-expanded={mobileOpen}
          aria-controls="mobile-main-menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3">
          <BrandMark size="size-9" />
          <span className="truncate text-sm font-bold text-sidebar-foreground sm:text-base">
            {brandName}
          </span>
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex"
          aria-label={t("common.mainMenu")}
        >
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="shrink-0 whitespace-nowrap rounded-lg px-2 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              activeProps={{ className: "bg-sidebar-accent font-semibold text-accent" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeSwitcher compact variant="chrome" />
          <LanguageSwitcher compact variant="chrome" />
          <div className="hidden lg:block">
            <HeaderAuth />
          </div>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          id="mobile-main-menu"
          side={dir === "rtl" ? "right" : "left"}
          className="flex w-[min(100%,20rem)] flex-col gap-0 bg-sidebar p-0 text-sidebar-foreground sm:max-w-sm"
        >
          <SheetHeader className="border-b border-sidebar-border px-4 py-4 text-start">
            <SheetTitle className="flex items-center gap-2.5 text-sidebar-foreground">
              <BrandMark size="size-9" />
              <span className="truncate text-base font-bold">{brandName}</span>
            </SheetTitle>
          </SheetHeader>

          <nav
            className="flex-1 overflow-y-auto px-3 py-3"
            aria-label={t("common.mainMenu")}
          >
            <ul className="flex flex-col gap-1">
              {nav.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    activeOptions={{ exact: item.to === "/" }}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )}
                    activeProps={{
                      className:
                        "bg-sidebar-accent font-semibold text-accent hover:text-accent",
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <HeaderAuth onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

function HeaderAuth({ onNavigate }: { onNavigate?: () => void }) {
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
          className="flex w-full items-center gap-2 rounded-lg bg-sidebar-accent px-2.5 py-2 xl:w-auto xl:px-3"
          aria-label={t("common.sessionChecking")}
          aria-busy="true"
        >
          <span className="size-4 shrink-0 animate-pulse rounded bg-sidebar-foreground/20" />
          <span className="inline-block h-4 w-[7rem] animate-pulse rounded bg-sidebar-foreground/20 xl:w-[9rem]" />
          <span className="size-4 shrink-0 animate-pulse rounded bg-sidebar-foreground/20" />
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
          {...(onNavigate ? { onNavigate } : {})}
          onSignOut={() => {
            setMenuOpen(false);
            onNavigate?.();
            void signOut();
          }}
        />
      ) : null;
    case "guest":
      return (
        <Link
          to="/auth"
          onClick={() => onNavigate?.()}
          className="flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground lg:w-auto"
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
  onNavigate,
  onSignOut,
}: {
  user: AuthUser;
  isStaff: boolean;
  menuOpen: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  signingOut: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="relative w-full lg:w-auto" ref={menuRef}>
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex w-full items-center gap-2 rounded-lg bg-sidebar-accent px-2.5 py-2 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent/80 lg:w-auto xl:px-3"
      >
        <User className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-start lg:max-w-[7rem] xl:max-w-[9rem]">
          {user.email}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-70" />
      </button>
      {menuOpen ? (
        <div
          role="menu"
          className="absolute inset-x-0 bottom-full z-50 mb-2 overflow-hidden rounded-xl border border-border bg-card p-1 text-card-foreground shadow-xl lg:inset-x-auto lg:bottom-auto lg:end-0 lg:top-full lg:mt-2 lg:mb-0 lg:w-56"
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
                onClick={() => {
                  onClose();
                  onNavigate?.();
                }}
                className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
              >
                <LayoutDashboard className="size-4" /> {t("common.dashboard")}
              </Link>
            ) : null}

            <button
              type="button"
              onClick={onSignOut}
              disabled={signingOut}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
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
