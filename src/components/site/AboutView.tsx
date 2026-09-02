import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Clock,
  Handshake,
  MapPin,
  Phone,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHero, SectionHeading } from "@/components/site/Sections";
import { pickLocalized, useLocale } from "@/i18n";

const valueIcons = [ShieldCheck, TrendingUp, Users, Handshake];

export type AboutStat = { key: string; value: string; label: string };
export type AboutValue = { title: string; text: string };
export type AboutBranch = {
  id: string;
  name_fa: string;
  name_en?: string | null;
  name_ps?: string | null;
  city_fa: string;
  city_en?: string | null;
  city_ps?: string | null;
  country_fa: string;
  country_en?: string | null;
  country_ps?: string | null;
};

export function AboutView({
  brandName,
  heroDescription,
  intro,
  stats,
  values,
  branches,
  phone,
  address,
  hours,
  foundedYear,
}: {
  brandName: string;
  heroDescription: string;
  intro: string[];
  stats: AboutStat[];
  values: AboutValue[];
  branches: AboutBranch[];
  phone: string;
  address: string;
  hours: string;
  foundedYear: string;
}) {
  const { locale, t, n } = useLocale();
  const [lead, ...rest] = intro;
  const foundedLabel = foundedYear ? n(foundedYear, 0) : "";

  return (
    <>
      <PageHero variant="soft" eyebrow={t("about.eyebrow")} title={brandName} description={heroDescription}>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5"
          >
            {t("about.requestTransfer")} <ArrowLeft className="size-4" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-navy-foreground hover:bg-white/10"
          >
            {t("about.contactExperts")}
          </Link>
        </div>
      </PageHero>

      {stats.length > 0 ? (
        <section aria-label={t("about.glanceAria")} className="relative z-10 mx-auto -mt-6 max-w-6xl px-4 md:-mt-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.key} className="px-4 py-5 text-center sm:px-5 sm:py-6 card-elevated">
                <p className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs font-medium text-muted-foreground sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div>
            <SectionHeading
              eyebrow={t("about.storyEyebrow")}
              title={t("about.storyTitle", { brand: brandName })}
            />
            {lead ? (
              <p className="text-base font-medium leading-9 text-foreground md:text-lg">{lead}</p>
            ) : null}
            <div className="mt-5 space-y-4 text-sm leading-8 text-muted-foreground">
              {rest.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
          </div>

          <aside className="p-6 sm:p-7 card-elevated">
            <p className="text-sm font-semibold text-accent">{t("about.hqEyebrow")}</p>
            <h2 className="mt-2 text-xl font-bold">{t("about.hqTitle")}</h2>
            <div className="gold-rule mt-4" />
            <ul className="mt-6 space-y-4 text-sm">
              {foundedLabel ? (
                <li className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
                    <Building2 className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("about.founded")}</p>
                    <p className="mt-0.5 font-semibold">
                      {t("about.foundedFrom", { year: foundedLabel })}
                    </p>
                  </div>
                </li>
              ) : null}
              {address ? (
                <li className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
                    <MapPin className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("common.address")}</p>
                    <p className="mt-0.5 font-semibold leading-7">{address}</p>
                  </div>
                </li>
              ) : null}
              {hours ? (
                <li className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
                    <Clock className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("common.hours")}</p>
                    <p className="mt-0.5 font-semibold">{hours}</p>
                  </div>
                </li>
              ) : null}
              {phone ? (
                <li className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
                    <Phone className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("common.phone")}</p>
                    <a href={`tel:${phone.replace(/\s/g, "")}`} className="mt-0.5 block font-semibold" dir="ltr">
                      {phone}
                    </a>
                  </div>
                </li>
              ) : null}
            </ul>
            <Link
              to="/contact"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              {t("about.contactHq")} <ArrowLeft className="size-4" />
            </Link>
          </aside>
        </div>
      </section>

      {values.length > 0 ? (
        <section className="bg-secondary/60">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <SectionHeading
              eyebrow={t("about.principlesEyebrow")}
              title={t("about.principlesTitle")}
              description={t("about.principlesDesc")}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((item, index) => {
                const Icon = valueIcons[index] ?? ShieldCheck;
                return (
                  <article key={item.title} className="flex h-full flex-col p-6 card-elevated">
                    <div className="flex items-center justify-between">
                      <span className="grid size-11 place-items-center rounded-xl bg-primary text-accent">
                        <Icon className="size-5" />
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">
                        {n(index + 1, 0)}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-7 text-muted-foreground">{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {branches.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <SectionHeading
            eyebrow={t("about.regionalEyebrow")}
            title={t("about.regionalTitle")}
            action={
              <Link to="/branches" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">
                {t("about.viewAllBranches")}
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <article key={branch.id} className="flex items-start gap-4 p-5 card-elevated">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {pickLocalized(branch, "city", locale)} — {pickLocalized(branch, "country", locale)}
                  </p>
                  <h3 className="mt-1 font-bold">{pickLocalized(branch, "name", locale)}</h3>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl surface-navy px-6 py-8 sm:px-8 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-accent">{t("about.readyStart")}</p>
            <h2 className="mt-2 text-xl font-bold text-navy-foreground md:text-2xl">
              {t("about.readyStartTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-navy-foreground/70">
              {t("about.readyStartText")}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              to="/dashboard"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground"
            >
              {t("about.submitRequest")} <ArrowLeft className="size-4" />
            </Link>
            <Link
              to="/rates"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-navy-foreground hover:bg-white/10"
            >
              {t("about.viewLiveRates")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
