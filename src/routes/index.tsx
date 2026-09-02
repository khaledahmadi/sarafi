import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ShieldCheck,
  Timer,
  Globe2,
  BadgePercent,
  Landmark,
  Wallet,
  MessageCircle,
  Coins,
  Globe,
  Briefcase,
  Send,
} from "lucide-react";
import { ratesQuery, servicesQuery, articlesQuery, settingsQuery, branchesQuery, prefetchRateSources } from "@/lib/queries";
import { useRateSource } from "@/hooks/use-rate-source";
import { useRates } from "@/hooks/use-rates";
import { RateTable } from "@/components/site/RateTable";
import { RatesCalculatorCard } from "@/components/site/RatesCalculatorCard";
import { SectionHeading } from "@/components/site/Sections";
import { ArticleCard } from "@/components/site/ArticleCard";
import { site } from "@/lib/site";
import { useGlanceStats } from "@/hooks/use-glance-stats";
import { useSiteSettings } from "@/hooks/use-settings";
import { pickLocalized, useLocale } from "@/i18n";
import { pageMeta, resolvePageLocale } from "@/i18n/meta";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/hero-navy.jpg";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const locale = await resolvePageLocale();
    await Promise.all([
      prefetchRateSources(context.queryClient),
      context.queryClient.ensureQueryData(servicesQuery),
      context.queryClient.ensureQueryData(articlesQuery),
      context.queryClient.ensureQueryData(branchesQuery),
      context.queryClient.ensureQueryData(settingsQuery),
    ]);
    return { locale };
  },
  head: ({ loaderData }) =>
    pageMeta(loaderData?.locale ?? "fa", "meta.homeTitle", "meta.homeDescription"),
  component: Index,
});

const icons: Record<string, typeof Send> = {
  landmark: Landmark,
  wallet: Wallet,
  "message-circle": MessageCircle,
  coins: Coins,
  globe: Globe,
  briefcase: Briefcase,
};

/** Icons stay in code; every text below is editable in /dashboard/pages. */
const advantageIcons = [Timer, ShieldCheck, BadgePercent, Globe2];

function Index() {
  const { source, setSource } = useRateSource();
  const { data: rates = [], isFetching: ratesFetching } = useRates(source);
  const { data: services } = useSuspenseQuery(servicesQuery);
  const { data: articles } = useSuspenseQuery(articlesQuery);
  const { get } = useSiteSettings();
  const { locale } = useLocale();
  const stats = useGlanceStats();

  const advantages = [1, 2, 3, 4]
    .map((n, index) => ({
      icon: advantageIcons[index] ?? ShieldCheck,
      title: get(`home.adv${n}_title`),
      text: get(`home.adv${n}_text`),
    }))
    .filter((item) => item.title || item.text);

  return (
    <>
      <section className="relative isolate overflow-hidden surface-navy">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover opacity-60"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:py-28 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
              {get("home.badge")}
            </span>
            <h1 className="mt-6 text-3xl font-extrabold leading-tight text-navy-foreground md:text-5xl">
              {get("home.hero_title")}{" "}
              <span className="text-gradient-gold">{get("home.hero_title_accent")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-8 text-navy-foreground/75 md:text-base">
              {get("home.hero_description")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5"
              >
                {get("home.cta_primary")} <ArrowLeft className="size-4" />
              </Link>
              <Link
                to="/rates"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-navy-foreground hover:bg-white/10"
              >
                {get("home.cta_secondary")}
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {stats.map((stat) => (
                <div key={stat.key}>
                  <dt className="text-2xl font-extrabold text-accent">{stat.value}</dt>
                  <dd className="mt-1 text-xs text-navy-foreground/60">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div
            className={cn(
              "mx-auto w-full max-w-md transition-opacity duration-200 lg:mx-0 lg:max-w-sm xl:max-w-md",
              ratesFetching && "opacity-80",
            )}
          >
            <RatesCalculatorCard
              rates={rates}
              source={source}
              onSourceChange={setSource}
              compact
              footer={
                <Link
                  to="/rates"
                  className="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80 sm:text-sm"
                >
                  {get("home.rates_full_link")} <ArrowLeft className="size-4" />
                </Link>
              }
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-foreground">
          <span className="inline-block size-2 animate-pulse rounded-full bg-success" />
          {get("home.live_rates_notice")}
        </div>
        <div className={cn("mt-6 transition-opacity duration-200", ratesFetching && "opacity-80")}>
          <RateTable rates={rates} source={source} compact showLiveLabel={false} />
          <div className="mt-4 text-center">
            <Link
              to="/rates"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              {get("home.rates_table_link")} <ArrowLeft className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          eyebrow={get("home.services_eyebrow")}
          title={get("home.services_title")}
          description={get("home.services_description")}
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = icons[service.icon] ?? Send;
            return (
              <article
                key={service.slug}
                className="group p-6 card-elevated transition-transform hover:-translate-y-1"
              >
                <span className="grid size-12 place-items-center rounded-xl bg-primary text-accent">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold">
                  {pickLocalized(
                    {
                      title_fa: service.title_fa,
                      title_en: (service as { title_en?: string }).title_en,
                      title_ps: (service as { title_ps?: string }).title_ps,
                    },
                    "title",
                    locale,
                  )}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {pickLocalized(
                    {
                      summary_fa: service.summary_fa,
                      summary_en: (service as { summary_en?: string }).summary_en,
                      summary_ps: (service as { summary_ps?: string }).summary_ps,
                    },
                    "summary",
                    locale,
                  )}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="surface-navy wave-pattern">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold text-accent">{get("home.why_eyebrow")}</p>
            <h2 className="mt-3 text-2xl font-bold text-navy-foreground md:text-3xl">
              {get("home.why_title")}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {advantages.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/12 bg-white/5 p-6">
                <item.icon className="size-7 text-accent" />
                <h3 className="mt-4 font-bold text-navy-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-navy-foreground/65">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          eyebrow={get("home.articles_eyebrow")}
          title={get("home.articles_title")}
          action={
            <Link to="/articles" className="text-sm font-semibold text-primary">
              {get("home.articles_all_link")}
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:gap-6">
          {articles.slice(0, 3).map((article) => (
            <ArticleCard
              key={article.slug}
              slug={article.slug}
              title={pickLocalized(
                {
                  title_fa: article.title_fa,
                  title_en: (article as { title_en?: string }).title_en,
                  title_ps: (article as { title_ps?: string }).title_ps,
                },
                "title",
                locale,
              )}
              excerpt={pickLocalized(
                {
                  excerpt_fa: article.excerpt_fa,
                  excerpt_en: (article as { excerpt_en?: string }).excerpt_en,
                  excerpt_ps: (article as { excerpt_ps?: string }).excerpt_ps,
                },
                "excerpt",
                locale,
              )}
              coverUrl={article.cover_url}
              publishedAt={article.published_at}
              heading="h3"
            />
          ))}
        </div>
      </section>
    </>
  );
}
