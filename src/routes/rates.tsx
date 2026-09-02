import { createFileRoute } from "@tanstack/react-router";
import { settingsQuery, prefetchRateSources } from "@/lib/queries";
import { useRateSource } from "@/hooks/use-rate-source";
import { useRates } from "@/hooks/use-rates";
import { RateTable } from "@/components/site/RateTable";
import { CurrencyConverter } from "@/components/site/CurrencyConverter";
import { PageHero } from "@/components/site/Sections";
import { useSiteSettings } from "@/hooks/use-settings";
import { useLocale } from "@/i18n";
import { pageMeta, resolvePageLocale } from "@/i18n/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rates")({
  loader: async ({ context }) => {
    const locale = await resolvePageLocale();
    await Promise.all([
      prefetchRateSources(context.queryClient),
      context.queryClient.ensureQueryData(settingsQuery),
    ]);
    return { locale };
  },
  head: ({ loaderData }) =>
    pageMeta(loaderData?.locale ?? "fa", "meta.ratesTitle", "meta.ratesDescription"),
  component: RatesPage,
});

function RatesPage() {
  const { source } = useRateSource();
  const { data: rates = [], isFetching: ratesFetching } = useRates(source);
  const { get } = useSiteSettings();
  const { t } = useLocale();

  return (
    <>
      <PageHero
        variant="spotlight"
        eyebrow={t("rates.eyebrow")}
        title={get("rates.hero_title")}
        description={get("rates.hero_description")}
      />
      <div className="mx-auto max-w-6xl px-4 py-14">
        {get("rates.notice") && (
          <div className="mb-6 rounded-xl border border-success/30 bg-success/10 px-5 py-4 text-sm leading-7 text-foreground">
            {get("rates.notice")}
          </div>
        )}
        <div
          className={cn(
            "grid min-w-0 gap-6 transition-opacity duration-200 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-start",
            ratesFetching && "opacity-80",
          )}
        >
          <RateTable rates={rates} source={source} />
          <CurrencyConverter rates={rates} />
        </div>
      </div>
    </>
  );
}
