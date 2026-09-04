import { cn } from "@/lib/utils";
import { ratesQuery } from "@/lib/queries";
import { RATE_SOURCES, getRateSourceLabel, type RateSourceId } from "@/lib/rate-sources";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n";

type RateSourcePickerVariant = "inline" | "elevated";

export function RateSourcePicker({
  value,
  onChange,
  compact = false,
  variant = "elevated",
  showLabel = false,
}: {
  value: RateSourceId;
  onChange: (source: RateSourceId) => void;
  compact?: boolean;
  variant?: RateSourcePickerVariant;
  showLabel?: boolean;
}) {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();

  return (
    <div className="w-full">
      {showLabel && (
        <p className="mb-2 text-center text-[11px] font-semibold tracking-wide text-muted-foreground">
          {t("rates.marketSource")}
        </p>
      )}
      <div
        className={cn(
          "flex w-full gap-1 rounded-xl p-1",
          compact ? "text-xs" : "text-sm",
          variant === "elevated" && "border border-border bg-card shadow-sm",
          variant === "inline" && "bg-muted/60",
        )}
        role="tablist"
        aria-label={t("rates.sourceAria")}
      >
        {RATE_SOURCES.map((source) => {
          const active = source.id === value;
          return (
            <button
              key={source.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(source.id)}
              onMouseEnter={() => {
                void queryClient.prefetchQuery(ratesQuery(source.id));
              }}
              onFocus={() => {
                void queryClient.prefetchQuery(ratesQuery(source.id));
              }}
              className={cn(
                "min-h-11 flex-1 rounded-lg px-3 py-2.5 font-semibold transition-all duration-200",
                active
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
              )}
            >
              {getRateSourceLabel(source.id, locale)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
