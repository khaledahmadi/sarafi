import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { LOCALES, LOCALE_FLAGS, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { useLocale } from "@/i18n/context";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Compact trigger for tight header slots */
  compact?: boolean;
  variant?: "light" | "dark";
};

export function LanguageSwitcher({
  className,
  compact = false,
  variant = "dark",
}: Props) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        aria-label={t("language.label")}
        className={cn(
          "flex items-center gap-2 font-semibold transition-colors",
          compact ? "rounded-lg px-2.5 py-2 text-sm" : "rounded-lg px-3 py-2 text-sm",
          variant === "dark"
            ? "bg-white/10 text-navy-foreground hover:bg-white/20"
            : "bg-muted text-foreground hover:bg-muted/70",
        )}
      >
        <span className="text-base leading-none" aria-hidden="true">
          {LOCALE_FLAGS[locale]}
        </span>
        <span className={cn("max-w-[7rem] truncate", compact && "hidden sm:inline")}>
          {LOCALE_LABELS[locale]}
        </span>
        <ChevronDown className="size-4 opacity-70" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t("language.label")}
          className="absolute end-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card p-1 text-card-foreground shadow-xl"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-sm font-semibold">{t("language.label")}</p>
          </div>
          <div className="flex flex-col gap-1 pt-1">
            {LOCALES.map((code) => {
              const selected = code === locale;
              return (
                <button
                  key={code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    setLocale(code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                    selected && "bg-muted/70 font-semibold",
                  )}
                >
                  <span className="text-base leading-none" aria-hidden="true">
                    {LOCALE_FLAGS[code]}
                  </span>
                  <span className="min-w-0 flex-1 text-start">{LOCALE_LABELS[code]}</span>
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
