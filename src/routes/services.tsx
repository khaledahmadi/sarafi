import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { servicesQuery, settingsQuery } from "@/lib/queries";
import { PageHero } from "@/components/site/Sections";
import { useSiteSettings } from "@/hooks/use-settings";
import { getServiceIcon } from "@/lib/service-icons";
import { pickLocalized, useLocale } from "@/i18n";
import { pageMeta, resolvePageLocale } from "@/i18n/meta";

export const Route = createFileRoute("/services")({
  loader: async ({ context }) => {
    const locale = await resolvePageLocale();
    await Promise.all([
      context.queryClient.ensureQueryData(servicesQuery),
      context.queryClient.ensureQueryData(settingsQuery),
    ]);
    return { locale };
  },
  head: ({ loaderData }) =>
    pageMeta(loaderData?.locale ?? "fa", "meta.servicesTitle", "meta.servicesDescription"),
  component: ServicesPage,
});

function ServicesPage() {
  const { data: services } = useSuspenseQuery(servicesQuery);
  const { get } = useSiteSettings();
  const { locale, t } = useLocale();

  return (
    <>
      <PageHero
        variant="soft"
        eyebrow={t("services.eyebrow")}
        title={get("services.hero_title")}
        description={get("services.hero_description")}
      />
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-5 md:grid-cols-2">
          {services.map((service) => {
            const Icon = getServiceIcon(service.icon);
            return (
              <article key={service.slug} className="flex gap-5 p-6 card-elevated">
                <span className="icon-tile size-12 shrink-0 rounded-xl">
                  <Icon className="size-6" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold">
                    {pickLocalized(service, "title", locale)}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {pickLocalized(service, "summary", locale)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl surface-navy px-8 py-8">
          <div>
            <h2 className="text-xl font-bold text-navy-foreground">{get("services.cta_title")}</h2>
            <p className="mt-2 text-sm text-navy-foreground/70">{get("services.cta_text")}</p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground"
          >
            {t("services.cta")} <ArrowLeft className="size-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
