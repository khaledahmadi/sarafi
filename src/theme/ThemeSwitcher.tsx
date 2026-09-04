import { useEffect, useRef, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useLocale } from "@/i18n/context";
import { cn } from "@/lib/utils";
import { THEMES, type Theme } from "./config";
import { useTheme } from "./context";

type Props = {
  className?: string;
  compact?: boolean;
  /**
   * `chrome` — sidebar/navbar tokens (light or dark theme).
   * `dark` — translucent on navy surfaces (heroes/footer).
   * `light` — muted on page surfaces.
   */
  variant?: "light" | "dark" | "chrome";
};

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const THEME_LABEL_KEYS = {
  light: "theme.light",
  dark: "theme.dark",
  system: "theme.system",
} as const;

export function ThemeSwitcher({
  className,
  compact = false,
  variant = "chrome",
}: Props) {
  const { t } = useLocale();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const ActiveIcon = THEME_ICONS[theme];

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("theme.label")}
        title={t("theme.label")}
        className={cn(
          "grid place-items-center font-semibold transition-colors",
          compact ? "size-9 rounded-lg" : "size-10 rounded-lg",
          variant === "chrome"
            ? "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80"
            : variant === "dark"
              ? "bg-white/10 text-navy-foreground hover:bg-white/20"
              : "bg-muted text-foreground hover:bg-muted/70",
        )}
      >
        <ActiveIcon className="size-4" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t("theme.label")}
          className="absolute end-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card p-1 text-card-foreground shadow-xl"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-sm font-semibold">{t("theme.label")}</p>
          </div>
          <div className="flex flex-col gap-1 pt-1">
            {THEMES.map((code: Theme) => {
              const selected = code === theme;
              const Icon = THEME_ICONS[code];
              return (
                <button
                  key={code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    setTheme(code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                    selected && "bg-muted/70 font-semibold",
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-80" aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-start">{t(THEME_LABEL_KEYS[code])}</span>
                  {selected ? <Check className="size-4 shrink-0 text-primary" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
