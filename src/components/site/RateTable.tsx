import { faNum, site } from "@/lib/site";
import { useLiveRates } from "@/hooks/use-live-rates";

type Rate = {
  code: string;
  name_fa: string;
  flag: string | null;
  buy_rate: number;
  sell_rate: number;
  updated_at: string;
};

export function RateTable({
  rates,
  compact = false,
  showLiveLabel = true,
}: {
  rates: Rate[];
  compact?: boolean;
  showLiveLabel?: boolean;
}) {
  const visible = compact ? rates.slice(0, 6) : rates;
  const { changed, lastEventAt, connected } = useLiveRates();

  return (
    <div className="overflow-hidden card-elevated">
      {showLiveLabel && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/60 px-4 py-2.5 text-xs">
          <span className="inline-flex items-center gap-2 font-semibold">
            <span
              className={`inline-block size-2 rounded-full ${
                connected ? "animate-pulse bg-success" : "bg-muted-foreground/50"
              }`}
            />
            {connected ? "نرخ‌ها به‌صورت زنده بروزرسانی می‌شوند" : "در حال اتصال به نرخ زنده…"}
          </span>
          {lastEventAt && (
            <span className="text-muted-foreground">
              آخرین تغییر:{" "}
              {lastEventAt.toLocaleTimeString("fa-IR", { timeZone: "Asia/Kabul", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="surface-navy">
            <tr className="text-navy-foreground/80">
              <th className="px-4 py-3.5 font-semibold">ارز</th>
              <th className="px-4 py-3.5 font-semibold">کد</th>
              <th className="px-4 py-3.5 font-semibold">نرخ خرید ({site.baseCurrency})</th>
              <th className="px-4 py-3.5 font-semibold">نرخ فروش ({site.baseCurrency})</th>
              <th className="hidden px-4 py-3.5 font-semibold sm:table-cell">آخرین بروزرسانی</th>
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
                  {rate.name_fa}
                </td>
                <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground" dir="ltr">
                  {rate.code}
                </td>
                <td className="px-4 py-3.5 font-semibold text-success">{faNum(rate.buy_rate)}</td>
                <td className="px-4 py-3.5 font-semibold text-destructive">
                  {faNum(rate.sell_rate)}
                </td>
                <td className="hidden px-4 py-3.5 text-xs text-muted-foreground sm:table-cell">
                  {new Date(rate.updated_at).toLocaleString("fa-IR", {
                    timeZone: "Asia/Kabul",
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
