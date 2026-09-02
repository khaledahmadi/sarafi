import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { localizeDigits } from "@/i18n/format";
import { catalogs } from "@/i18n/messages";
import { settingsQuery } from "@/lib/queries";
import { site } from "@/lib/site";

export type SettingRow = {
  key: string;
  group_key: string;
  label_fa: string;
  value: string;
  value_en?: string | null;
  value_ps?: string | null;
  input_kind: string;
  hint_fa: string | null;
  sort_order: number;
};

/** Fallbacks keep the public pages readable before the settings query resolves (Farsi defaults). */
const fallbacks: Record<string, string> = {
  "brand.name": site.name,
  "brand.tagline": site.tagline,
  "brand.description": site.description,
  "brand.founded_year": "2008",
  "contact.phone": site.phone,
  "contact.whatsapp": site.whatsapp,
  "contact.email": site.email,
  "contact.address": site.address,
  "contact.hours": site.hours,
  "home.badge": "نرخ لحظه‌ای اسعار",
  "home.hero_title": "حواله و تبادل ارز",
  "home.hero_title_accent": "با اطمینان",
  "home.hero_description": site.description,
  "home.cta_primary": "ثبت درخواست حواله",
  "home.cta_secondary": "مشاهده نرخ لحظه‌ای",
  "home.live_rates_notice": "نرخ‌ها به‌صورت زنده بروزرسانی می‌شوند",
  "home.stat1_label": "سال تجربه",
  "home.stat2_label": "نمایندگی فعال",
  "home.stat3_label": "ارز قابل معامله",
  "home.services_title": "خدمات صرافی",
  "home.services_description":
    "حواله یوان به چین، شارژ علی‌پی و وی‌چت‌پی، تبادل اسعار و خدمات بازرگانی.",
  "home.why_title": "اعتماد، سرعت و نرخ شفاف",
  "home.adv1_title": "سرعت انتقال",
  "home.adv1_text": "حواله‌ها پس از تایید، در کوتاه‌ترین زمان به مقصد می‌رسند.",
  "home.adv2_title": "امنیت و اعتماد",
  "home.adv2_text": "هر درخواست در سیستم ثبت می‌شود و وضعیت آن قابل پیگیری است.",
  "home.adv3_title": "نرخ رقابتی",
  "home.adv3_text": "نرخ خرید و فروش بر اساس بازار روز و با کارمزد شفاف اعلام می‌شود.",
  "home.adv4_title": "شبکه بین‌المللی",
  "home.adv4_text": "نمایندگی‌ها در افغانستان، امارات و چین پوشش حواله را کامل می‌کنند.",
  "home.articles_title": "راهنما و اخبار بازار ارز",
  "home.services_eyebrow": "خدمات ما",
  "home.why_eyebrow": `چرا ${site.name}؟`,
  "home.articles_eyebrow": "مقالات",
  "home.rates_full_link": "جدول کامل نرخ برابری اسعار",
  "home.rates_table_link": "مشاهده جدول کامل نرخ‌ها",
  "home.articles_all_link": "همه مقالات",
  "services.hero_title": "خدمات صرافی",
  "services.hero_description":
    "حواله یوان به چین، شارژ علی‌پی و وی‌چت‌پی، تبادل اسعار، حواله بین‌المللی و خدمات بازرگانی.",
  "services.cta_title": "آماده ثبت اولین حواله خود هستید؟",
  "services.cta_text": "درخواست خود را ثبت کنید تا کارشناسان نرخ و زمان انتقال را اعلام کنند.",
  "rates.hero_title": "نرخ لحظه‌ای برابری اسعار",
  "rates.hero_description": `نرخ‌های زیر بر مبنای ${site.baseCurrencyFa} (${site.baseCurrency}) محاسبه شده‌اند.`,
  "rates.notice":
    "نرخ‌ها به‌صورت زنده بروزرسانی می‌شوند و ممکن است در لحظه معامله اندکی تفاوت داشته باشند.",
  "branches.hero_title": "شبکه دفاتر و نمایندگی‌ها",
  "branches.hero_description":
    "نشانی، شماره تماس و واتس‌اپ دفتر مرکزی و نمایندگی‌های ما در افغانستان و امارات.",
  "contact.hero_description":
    "شماره تماس، واتس‌اپ، ایمیل و نشانی دفتر مرکزی برای دریافت نرخ حواله و مشاوره.",
  "about.hero_description":
    "بیش از هجده سال تجربه در حواله بین‌المللی، تبادل اسعار و خدمات بازرگانی با تکیه بر اعتماد مشتریان.",
  "about.value1_title": "اعتماد",
  "about.value1_text": "هر حواله با ثبت شفاف و پیگیری در پنل مشتری انجام می‌شود.",
  "about.value2_title": "نرخ منصفانه",
  "about.value2_text": "نرخ‌ها بر اساس بازار روز تعیین می‌شود تا هزینه انتقال روشن باشد.",
  "about.value3_title": "پاسخگویی",
  "about.value3_text": "کارشناسان ما وضعیت درخواست را تا تکمیل حواله پیگیری می‌کنند.",
  "about.value4_title": "تعهد",
  "about.value4_text": "شبکه نمایندگی‌ها در افغانستان، امارات و چین خدمات را پایدار نگه می‌دارد.",
  "about.stat4_value": "۲۴/۷",
  "about.stat4_label": "پشتیبانی حواله",
};

/** Keys that have translations under `settings.*` in the i18n catalogs. */
const LOCALIZED_SETTING_KEYS = new Set([
  "brand.name",
  "brand.tagline",
  "brand.description",
  "home.badge",
  "home.hero_title",
  "home.hero_title_accent",
  "home.hero_description",
  "home.cta_primary",
  "home.cta_secondary",
  "home.live_rates_notice",
  "home.stat1_label",
  "home.stat2_label",
  "home.stat3_label",
  "home.services_title",
  "home.services_description",
  "home.why_title",
  "home.adv1_title",
  "home.adv1_text",
  "home.adv2_title",
  "home.adv2_text",
  "home.adv3_title",
  "home.adv3_text",
  "home.adv4_title",
  "home.adv4_text",
  "home.articles_title",
  "home.services_eyebrow",
  "home.why_eyebrow",
  "home.articles_eyebrow",
  "home.rates_full_link",
  "home.rates_table_link",
  "home.articles_all_link",
  "services.hero_title",
  "services.hero_description",
  "services.cta_title",
  "services.cta_text",
  "rates.hero_title",
  "rates.hero_description",
  "rates.notice",
  "branches.hero_title",
  "branches.hero_description",
  "contact.hero_description",
  "about.hero_description",
  "about.value1_title",
  "about.value1_text",
  "about.value2_title",
  "about.value2_text",
  "about.value3_title",
  "about.value3_text",
  "about.value4_title",
  "about.value4_text",
  "about.stat4_value",
  "about.stat4_label",
]);

function settingsCatalogValue(locale: Locale, key: string): string | undefined {
  if (!LOCALIZED_SETTING_KEYS.has(key)) return undefined;
  const parts = key.split(".");
  let current: unknown = catalogs[locale].settings;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * Site-wide editable content. Everything here is managed by admins in
 * /dashboard/pages and rendered on the public website.
 *
 * Locale note: prefers `value_en` / `value_ps` from the API when present.
 * Otherwise, for en/ps, empty DB values (or values that still equal the FA
 * default) resolve from the `settings.*` message catalog. Custom admin FA
 * overrides still show as FA until per-locale values are filled in.
 */
export function useSiteSettings() {
  const query = useSuspenseQuery(settingsQuery);
  const { locale } = useLocale();
  const rows = query.data as SettingRow[];
  const map = new Map(rows.map((row) => [row.key, row]));

  function get(key: string, fallback = ""): string {
    const row = map.get(key);
    const faValue = row?.value?.trim() ?? "";
    const faFallback = fallbacks[key] ?? fallback;

    const finish = (value: string) => localizeDigits(value, locale);

    if (locale === "en") {
      const en = row?.value_en?.trim();
      if (en) return finish(en);
    }
    if (locale === "ps") {
      const ps = row?.value_ps?.trim();
      if (ps) return finish(ps);
    }

    if (locale !== "fa" && LOCALIZED_SETTING_KEYS.has(key)) {
      if (!faValue || faValue === faFallback) {
        return finish(settingsCatalogValue(locale, key) ?? faFallback);
      }
      return finish(faValue);
    }

    if (faValue) return finish(faValue);
    return finish(faFallback);
  }

  return { rows, get, loading: query.isLoading };
}

/** Splits a long-text setting into paragraphs. */
export function paragraphs(value: string): string[] {
  return value
    .split(/\n{1,}/)
    .map((line) => line.trim())
    .filter(Boolean);
}
