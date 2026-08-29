import { useSuspenseQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/queries";
import { site } from "@/lib/site";

export type SettingRow = {
  key: string;
  group_key: string;
  label_fa: string;
  value: string;
  input_kind: string;
  hint_fa: string | null;
  sort_order: number;
};

/** Fallbacks keep the public pages readable before the settings query resolves. */
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

/**
 * Site-wide editable content. Everything here is managed by admins in
 * /dashboard/pages and rendered on the public website.
 */
export function useSiteSettings() {
  const query = useSuspenseQuery(settingsQuery);
  const rows = query.data as SettingRow[];
  const map = new Map(rows.map((row) => [row.key, row.value]));

  function get(key: string, fallback = ""): string {
    const value = map.get(key);
    if (value && value.trim()) return value;
    return fallbacks[key] ?? fallback;
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
