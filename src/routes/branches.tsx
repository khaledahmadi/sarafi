import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Phone, MessageCircle } from "lucide-react";
import { branchesQuery, settingsQuery } from "@/lib/queries";
import { PageHero } from "@/components/site/Sections";
import { useSiteSettings } from "@/hooks/use-settings";
import { pickLocalized, useLocale } from "@/i18n";
import { pageMeta, resolvePageLocale } from "@/i18n/meta";

export const Route = createFileRoute("/branches")({
  loader: async ({ context }) => {
    const locale = await resolvePageLocale();
    await Promise.all([
      context.queryClient.ensureQueryData(branchesQuery),
      context.queryClient.ensureQueryData(settingsQuery),
    ]);
    return { locale };
  },
  head: ({ loaderData }) =>
    pageMeta(loaderData?.locale ?? "fa", "meta.branchesTitle", "meta.branchesDescription"),
  component: BranchesPage,
});

function BranchesPage() {
  const { data: branches } = useSuspenseQuery(branchesQuery);
  const { get } = useSiteSettings();
  const { locale, t } = useLocale();

  return (
    <>
      <PageHero
        variant="soft"
        eyebrow={t("branches.eyebrow")}
        title={get("branches.hero_title")}
        description={get("branches.hero_description")}
      />
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-14 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <article key={branch.id} className="p-6 card-elevated">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {pickLocalized(branch as typeof branch & { city_en?: string; country_en?: string }, "city", locale)}{" "}
              —{" "}
              {pickLocalized(branch as typeof branch & { city_en?: string; country_en?: string }, "country", locale)}
            </span>
            <h2 className="mt-4 text-lg font-bold">
              {pickLocalized(branch as typeof branch & { name_en?: string }, "name", locale)}
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {branch.address_fa && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 text-accent" />
                  <span className="leading-7">
                    {pickLocalized(
                      {
                        address_fa: branch.address_fa,
                        address_en: (branch as { address_en?: string }).address_en,
                        address_ps: (branch as { address_ps?: string }).address_ps,
                      },
                      "address",
                      locale,
                    )}
                  </span>
                </li>
              )}
              {branch.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-accent" />
                  <a href={`tel:${branch.phone.replace(/\s/g, "")}`} dir="ltr">
                    {branch.phone}
                  </a>
                </li>
              )}
              {branch.whatsapp && (
                <li className="flex items-center gap-2">
                  <MessageCircle className="size-4 text-accent" />
                  <a
                    href={`https://wa.me/${branch.whatsapp.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    dir="ltr"
                  >
                    {branch.whatsapp}
                  </a>
                </li>
              )}
            </ul>
          </article>
        ))}
      </div>
    </>
  );
}
