import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AboutView } from "@/components/site/AboutView";
import { branchesQuery, prefetchRateSources, settingsQuery } from "@/lib/queries";
import { useGlanceStats } from "@/hooks/use-glance-stats";
import { paragraphs, useSiteSettings } from "@/hooks/use-settings";
import { useLocale } from "@/i18n";
import { pageMeta, resolvePageLocale } from "@/i18n/meta";

export const Route = createFileRoute("/about")({
  loader: async ({ context }) => {
    const locale = await resolvePageLocale();
    await Promise.all([
      context.queryClient.ensureQueryData(settingsQuery),
      prefetchRateSources(context.queryClient),
      context.queryClient.ensureQueryData(branchesQuery),
    ]);
    return { locale };
  },
  head: ({ loaderData }) =>
    pageMeta(loaderData?.locale ?? "fa", "meta.aboutTitle", "meta.aboutDescription"),
  component: AboutPage,
});

function AboutPage() {
  const { get } = useSiteSettings();
  const { t } = useLocale();
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
      heroDescription={get("about.hero_description", t("meta.aboutDescription"))}
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
