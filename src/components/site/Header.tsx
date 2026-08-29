import { useEffect, useRef, useState, type RefObject } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import { useRoles, useSession } from "@/hooks/use-session";
import { useSignOut } from "@/hooks/use-sign-out";
import { useSiteSettings } from "@/hooks/use-settings";
import { resolveAuthNavState, type AuthUser } from "@/lib/api/auth-store";
import { site } from "@/lib/site";

const nav = [
  { to: "/", label: "خانه" },
  { to: "/rates", label: "نرخ لحظه‌ای" },
  { to: "/services", label: "خدمات" },
  { to: "/branches", label: "نمایندگی‌ها" },
  { to: "/articles", label: "وبلاگ" },
  { to: "/about", label: "درباره ما" },
  { to: "/faq", label: "سؤالات متداول" },
  { to: "/feedback", label: "بازخورد" },
  { to: "/contact", label: "تماس" },
] as const;

export function Header() {
  const { get } = useSiteSettings();
  const brandName = get("brand.name");

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 surface-navy/95 surface-navy backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-accent text-lg font-extrabold text-accent-foreground">
            س
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold text-navy-foreground">{brandName}</span>
            <span className="text-[11px] text-navy-foreground/60">{site.nameEn}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-lg px-3 py-2 text-sm text-navy-foreground/75 transition-colors hover:bg-white/10 hover:text-navy-foreground"
              activeProps={{ className: "bg-white/10 text-accent" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <HeaderAuth />
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
          className="inline-block h-9 w-28 animate-pulse rounded-lg bg-white/15"
          aria-label="در حال بررسی نشست"
        />
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
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        >
          ورود / ثبت‌نام
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
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-navy-foreground transition-colors hover:bg-white/20"
      >
        <User className="size-4" />
        <span className="max-w-[9rem] truncate">{user.email}</span>
        <ChevronDown className="size-4 opacity-70" />
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
            <p className="mt-0.5 text-[11px] text-muted-foreground">حساب کاربری</p>
          </div>

          {isStaff ? (
            <Link
              to="/dashboard"
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
            >
              <LayoutDashboard className="size-4" /> داشبورد
            </Link>
          ) : null}

          <button
            onClick={onSignOut}
            disabled={signingOut}
            className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-border px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
          >
            <LogOut className="size-4" />
            {signingOut ? "در حال خروج…" : "خروج از حساب"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
