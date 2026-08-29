import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Landmark,
  Wallet,
  MessageCircle,
  Coins,
  Globe,
  Briefcase,
  Send,
  ArrowLeft,
} from "lucide-react";
import { servicesQuery, settingsQuery } from "@/lib/queries";
import { PageHero } from "@/components/site/Sections";
import { site } from "@/lib/site";
import { useSiteSettings } from "@/hooks/use-settings";

const title = `خدمات حواله و تبادل ارز | ${site.name}`;
const description =
  "حواله یوان به چین، شارژ علی‌پی و وی‌چت‌پی، تبادل اسعار، حواله بین‌المللی و خدمات بازرگانی.";

export const Route = createFileRoute("/services")({
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
      context.queryClient.ensureQueryData(servicesQuery),
      context.queryClient.ensureQueryData(settingsQuery),
    ]);
  },
  component: ServicesPage,
});

const icons: Record<string, typeof Send> = {
  landmark: Landmark,
  wallet: Wallet,
  "message-circle": MessageCircle,
  coins: Coins,
  globe: Globe,
  briefcase: Briefcase,
};

function ServicesPage() {
  const { data: services } = useSuspenseQuery(servicesQuery);
  const { get } = useSiteSettings();

  return (
    <>
      <PageHero
        variant="soft"
        eyebrow="خدمات"
        title={get("services.hero_title")}
        description={get("services.hero_description")}
      />
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-5 md:grid-cols-2">
          {services.map((service) => {
            const Icon = icons[service.icon] ?? Send;
            return (
              <article key={service.slug} className="flex gap-5 p-6 card-elevated">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-accent">
                  <Icon className="size-6" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">{service.title_fa}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {service.summary_fa}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl surface-navy px-8 py-8">
          <div>
            <h2 className="text-xl font-bold text-navy-foreground">
              {get("services.cta_title")}
            </h2>
            <p className="mt-2 text-sm text-navy-foreground/70">{get("services.cta_text")}</p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground"
          >
            ثبت درخواست <ArrowLeft className="size-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
