import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Phone, MessageCircle } from "lucide-react";
import { branchesQuery, settingsQuery } from "@/lib/queries";
import { PageHero } from "@/components/site/Sections";
import { site } from "@/lib/site";
import { useSiteSettings } from "@/hooks/use-settings";

const title = `شبکه نمایندگی‌ها | ${site.name}`;
const description =
  "نشانی، شماره تماس و واتس‌اپ دفتر مرکزی و نمایندگی‌های ما در افغانستان و امارات.";

export const Route = createFileRoute("/branches")({
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
      context.queryClient.ensureQueryData(branchesQuery),
      context.queryClient.ensureQueryData(settingsQuery),
    ]);
  },
  component: BranchesPage,
});

function BranchesPage() {
  const { data: branches } = useSuspenseQuery(branchesQuery);
  const { get } = useSiteSettings();

  return (
    <>
      <PageHero
        variant="soft"
        eyebrow="نمایندگی‌ها"
        title={get("branches.hero_title")}
        description={get("branches.hero_description")}
      />
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-14 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <article key={branch.id} className="p-6 card-elevated">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {branch.city_fa} — {branch.country_fa}
            </span>
            <h2 className="mt-4 text-lg font-bold">{branch.name_fa}</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {branch.address_fa && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 text-accent" />
                  <span className="leading-7">{branch.address_fa}</span>
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
