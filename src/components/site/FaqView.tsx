import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CircleHelp,
  Clock,
  MessageCircle,
  Phone,
  Search,
  Send,
  X,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHero, SectionHeading } from "@/components/site/Sections";
import { useSiteSettings } from "@/hooks/use-settings";
import { openSiteChat } from "@/lib/chat-widget";
import { filterFaqs } from "@/lib/faq-page";
import { faqsQuery } from "@/lib/queries";
import { pickLocalized, useLocale } from "@/i18n";
import { cn } from "@/lib/utils";

export function FaqView() {
  const { data: faqs } = useSuspenseQuery(faqsQuery);
  const { get } = useSiteSettings();
  const { locale, t, n } = useLocale();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | undefined>(faqs[0]?.id);
  const filtered = useMemo(() => filterFaqs(faqs, query), [faqs, query]);
  const phone = get("contact.phone");
  const hours = get("contact.hours");

  useEffect(() => {
    setOpenId((current) => {
      if (current && filtered.some((faq) => faq.id === current)) return current;
      return filtered[0]?.id;
    });
  }, [filtered]);

  return (
    <>
      <PageHero
        variant="soft"
        eyebrow={t("faq.eyebrow")}
        title={t("faq.heroTitle")}
        description={t("faq.heroDescription")}
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={openSiteChat}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5"
          >
            <MessageCircle className="size-4" />
            {t("faq.askInChat")}
          </button>
          <Link
            to="/contact"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-navy-foreground hover:bg-white/10"
          >
            {t("faq.contactExperts")}
          </Link>
        </div>
      </PageHero>

      <section className="relative z-10 mx-auto -mt-6 max-w-6xl px-4 md:-mt-8">
        <div className="relative card-elevated">
          <label className="sr-only" htmlFor="faq-search">
            {t("faq.searchLabel")}
          </label>
          <Search className="pointer-events-none absolute top-1/2 end-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="faq-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("faq.searchPlaceholderLong")}
            className={cn(
              "h-14 w-full bg-transparent pe-12 text-base outline-none [&::-webkit-search-cancel-button]:hidden",
              query ? "ps-14" : "ps-4",
            )}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 start-3 grid size-11 -translate-y-1/2 place-items-center rounded-lg"
              aria-label={t("faq.clearSearch")}
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
          <div>
            <SectionHeading
              eyebrow={t("faq.sectionEyebrow")}
              title={t("faq.sectionTitle")}
              description={
                faqs.length === 0
                  ? t("faq.emptySoon")
                  : t("faq.count", {
                      filtered: n(filtered.length, 0),
                      total: n(faqs.length, 0),
                    })
              }
            />

            {faqs.length === 0 ? (
              <EmptyCard title={t("faq.emptyTitle")} text={t("faq.emptyText")} />
            ) : filtered.length === 0 ? (
              <EmptyCard
                title={t("faq.noResultsTitle")}
                text={t("faq.noResultsText")}
                action={
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold"
                  >
                    {t("faq.clearSearch")}
                  </button>
                }
              />
            ) : (
              <Accordion
                type="single"
                collapsible
                value={openId ?? ""}
                onValueChange={setOpenId}
                className="space-y-3"
              >
                {filtered.map((faq, index) => (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card px-4 sm:px-5"
                  >
                    <AccordionTrigger className="gap-3 py-5 text-start text-base font-bold hover:no-underline">
                      <span className="flex min-w-0 flex-1 items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold",
                            openId === faq.id
                              ? "bg-primary text-accent"
                              : "bg-primary/8 text-primary",
                          )}
                        >
                          {n(index + 1, 0)}
                        </span>
                        <span className="min-w-0 leading-7">
                          {pickLocalized(
                            {
                              question_fa: faq.question,
                              question_en: faq.question_en,
                              question_ps: faq.question_ps,
                            },
                            "question",
                            locale,
                          )}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="ps-11 text-sm leading-8 text-muted-foreground whitespace-pre-line sm:ps-12">
                      {pickLocalized(
                        {
                          answer_fa: faq.answer,
                          answer_en: faq.answer_en,
                          answer_ps: faq.answer_ps,
                        },
                        "answer",
                        locale,
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="p-6 card-elevated">
              <span className="grid size-11 place-items-center rounded-xl bg-primary text-accent">
                <CircleHelp className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-bold">{t("faq.stillNeedHelp")}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{t("faq.stillNeedHelpText")}</p>
              <div className="gold-rule mt-4" />
              <ul className="mt-5 space-y-4 text-sm">
                {hours ? (
                  <li className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
                      <Clock className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("common.hours")}</p>
                      <p className="mt-0.5 font-semibold leading-7">{hours}</p>
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
              <button
                type="button"
                onClick={openSiteChat}
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
              >
                <MessageCircle className="size-4" />
                {t("faq.openChat")}
              </button>
              <Link
                to="/contact"
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold"
              >
                {t("faq.contactPage")}
              </Link>
            </div>

            <Link
              to="/rates"
              className="flex items-center justify-between gap-3 p-5 card-elevated"
            >
              <div>
                <p className="text-xs font-semibold text-accent">{t("faq.ratesDay")}</p>
                <p className="mt-1 text-sm font-bold">{t("faq.viewLiveRates")}</p>
              </div>
              <ArrowLeft className="size-4 text-muted-foreground" />
            </Link>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl surface-navy px-6 py-8 sm:px-8 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-accent">{t("faq.readyTransfer")}</p>
            <h2 className="mt-2 text-xl font-bold text-navy-foreground md:text-2xl">
              {t("faq.readyTransferTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-navy-foreground/70">
              {t("faq.readyTransferText")}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              to="/dashboard"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground"
            >
              <Send className="size-4" />
              {t("faq.submitRequest")}
            </Link>
            <Link
              to="/services"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-navy-foreground hover:bg-white/10"
            >
              {t("faq.viewServices")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function EmptyCard({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-12 text-center card-elevated">
      <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/8 text-primary">
        <CircleHelp className="size-5" />
      </span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">{text}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
