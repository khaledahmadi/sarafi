import { RateSourcePicker } from "@/components/site/RateSourcePicker";
import { useRateSource } from "@/hooks/use-rate-source";
import { useLiveRates } from "@/hooks/use-live-rates";
import { getRateSourceLabel } from "@/lib/rate-sources";
import { site } from "@/lib/site";
import type { RateSourceId } from "@/lib/rate-sources";
import { pickLocalized, useLocale } from "@/i18n";

type Rate = {
  code: string;
  name_fa: string;
  name_en?: string | null;
  name_ps?: string | null;
  flag: string | null;
  buy_rate: number;
  sell_rate: number;
  updated_at: string;
};

export function RateTable({
  rates,
  source,
  compact = false,
  showLiveLabel = true,
  showSourcePicker = true,
}: {
  rates: Rate[];
  source: RateSourceId;
  compact?: boolean;
  showLiveLabel?: boolean;
  showSourcePicker?: boolean;
}) {
  const { setSource } = useRateSource();
  const { locale, t, n, time } = useLocale();
  const visible = compact ? rates.slice(0, 6) : rates;
  const { changed, lastEventAt, connected } = useLiveRates(source);
  const sourceLabel = getRateSourceLabel(source, locale);

  return (
    <div className="overflow-hidden card-elevated">
      {showSourcePicker && (
        <div className="border-b border-border bg-muted/20 px-4 py-3.5">
          <RateSourcePicker value={source} onChange={setSource} variant="inline" compact={compact} />
        </div>
      )}
      {showLiveLabel && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/60 px-4 py-2.5 text-xs">
          <span className="inline-flex items-center gap-2 font-semibold">
            <span
              className={`inline-block size-2 rounded-full ${
                connected ? "animate-pulse bg-success" : "bg-muted-foreground/50"
              }`}
            />
            {connected ? t("rates.liveRates", { source: sourceLabel }) : t("rates.connecting")}
          </span>
          {lastEventAt && (
            <span className="text-muted-foreground">
              {t("rates.lastChange")} {time(lastEventAt)}
            </span>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-start text-sm">
          <thead className="surface-navy">
            <tr className="text-navy-foreground/80">
              <th className="px-4 py-3.5 font-semibold">{t("rates.currency")}</th>
              <th className="px-4 py-3.5 font-semibold">{t("rates.code")}</th>
              <th className="px-4 py-3.5 font-semibold">
                {t("rates.buyRate", { base: site.baseCurrency })}
              </th>
              <th className="px-4 py-3.5 font-semibold">
                {t("rates.sellRate", { base: site.baseCurrency })}
              </th>
              <th className="hidden px-4 py-3.5 font-semibold sm:table-cell">{t("rates.updated")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((rate) => (
              <tr
                key={rate.code}
                className={`border-t border-border transition-colors duration-500 ${
                  changed.includes(rate.code) ? "bg-accent/20" : "even:bg-secondary/50"
                }`}
              >
                <td className="px-4 py-3.5 font-medium">
                  <span className="me-2">{rate.flag}</span>
                  {pickLocalized(rate, "name", locale)}
                </td>
                <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground" dir="ltr">
                  {rate.code}
                </td>
                <td className="px-4 py-3.5 font-semibold text-success">{n(rate.buy_rate)}</td>
                <td className="px-4 py-3.5 font-semibold text-destructive">{n(rate.sell_rate)}</td>
                <td className="hidden px-4 py-3.5 text-xs text-muted-foreground sm:table-cell">
                  {time(rate.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
