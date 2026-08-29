import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AboutView } from "@/components/site/AboutView";
import { branchesQuery, ratesQuery, settingsQuery } from "@/lib/queries";
import { site } from "@/lib/site";
import { useGlanceStats } from "@/hooks/use-glance-stats";
import { paragraphs, useSiteSettings } from "@/hooks/use-settings";

const title = `درباره ${site.name} | صرافی معتبر`;
const description =
  "بیش از هجده سال تجربه در حواله بین‌المللی، تبادل اسعار و خدمات بازرگانی با تکیه بر اعتماد مشتریان.";

export const Route = createFileRoute("/about")({
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
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(ratesQuery),
      context.queryClient.ensureQueryData(branchesQuery),
    ]);
  },
  component: AboutPage,
});

function AboutPage() {
  const { get } = useSiteSettings();
  const { data: branches } = useSuspenseQuery(branchesQuery);
  const glanceStats = useGlanceStats();
  const intro = paragraphs(get("about.intro") || get("about.body"));
  const stats = [
    ...glanceStats,
    {
      key: "hours",
      value: get("about.stat4_value"),
      label: get("about.stat4_label"),
    },
  ].filter((stat) => stat.value || stat.label);
  const values = [1, 2, 3, 4]
    .map((n) => ({
      title: get(`about.value${n}_title`),
      text: get(`about.value${n}_text`),
    }))
    .filter((item) => item.title || item.text);

  return (
    <AboutView
      brandName={get("brand.name")}
      heroDescription={get("about.hero_description", description)}
      intro={intro}
      stats={stats}
      values={values}
      branches={branches}
      phone={get("contact.phone")}
      address={get("contact.address")}
      hours={get("contact.hours")}
      foundedYear={get("brand.founded_year")}
    />
  );
}
