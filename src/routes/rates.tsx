import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ratesQuery, settingsQuery } from "@/lib/queries";
import { RateTable } from "@/components/site/RateTable";
import { CurrencyConverter } from "@/components/site/CurrencyConverter";
import { PageHero } from "@/components/site/Sections";
import { site } from "@/lib/site";
import { useSiteSettings } from "@/hooks/use-settings";

const title = `نرخ لحظه‌ای اسعار | ${site.name}`;
const description =
  "جدول نرخ خرید و فروش دالر، یورو، یوان، درهم و سایر ارزها بر مبنای افغانی، با بروزرسانی لحظه‌ای.";

export const Route = createFileRoute("/rates")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(ratesQuery),
      context.queryClient.ensureQueryData(settingsQuery),
    ]);
  },
  component: RatesPage,
});

function RatesPage() {
  const { data: rates } = useSuspenseQuery(ratesQuery);
  const { get } = useSiteSettings();

  return (
    <>
      <PageHero
        variant="spotlight"
        eyebrow="بازار ارز"
        title={get("rates.hero_title")}
        description={get("rates.hero_description")}
      />
      <div className="mx-auto max-w-6xl px-4 py-14">
        {get("rates.notice") && (
          <div className="mb-6 rounded-xl border border-success/30 bg-success/10 px-5 py-4 text-sm leading-7 text-foreground">
            {get("rates.notice")}
          </div>
        )}
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-start">
          <RateTable rates={rates} />
          <CurrencyConverter rates={rates} />
        </div>
      </div>
    </>
  );
}
