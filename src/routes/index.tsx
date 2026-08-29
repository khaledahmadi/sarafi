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
import { ratesQuery, servicesQuery, articlesQuery, settingsQuery, branchesQuery } from "@/lib/queries";
import { RateTable } from "@/components/site/RateTable";
import { CurrencyConverter } from "@/components/site/CurrencyConverter";
import { SectionHeading } from "@/components/site/Sections";
import { ArticleCard } from "@/components/site/ArticleCard";
import { site } from "@/lib/site";
import { useGlanceStats } from "@/hooks/use-glance-stats";
import { useSiteSettings } from "@/hooks/use-settings";
import heroImage from "@/assets/hero-navy.jpg";

const title = `${site.name} | نرخ لحظه‌ای اسعار و حواله بین‌المللی`;
const description = site.description;

export const Route = createFileRoute("/")({
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
      context.queryClient.ensureQueryData(servicesQuery),
      context.queryClient.ensureQueryData(articlesQuery),
      context.queryClient.ensureQueryData(branchesQuery),
      context.queryClient.ensureQueryData(settingsQuery),
    ]);
  },
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
  const { data: rates } = useSuspenseQuery(ratesQuery);
  const { data: services } = useSuspenseQuery(servicesQuery);
  const { data: articles } = useSuspenseQuery(articlesQuery);
  const { get } = useSiteSettings();
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

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-2 backdrop-blur">
              <CurrencyConverter rates={rates} />
              <Link
                to="/rates"
                className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-accent"
              >
                {get("home.rates_full_link")} <ArrowLeft className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-foreground">
          <span className="inline-block size-2 animate-pulse rounded-full bg-success" />
          {get("home.live_rates_notice")}
        </div>
        <div className="mt-6">
          <RateTable rates={rates} compact showLiveLabel={false} />
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
                <h3 className="mt-5 text-lg font-bold">{service.title_fa}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{service.summary_fa}</p>
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
              title={article.title_fa}
              excerpt={article.excerpt_fa}
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
