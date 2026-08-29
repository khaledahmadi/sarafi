import { flagFromIso } from "@/lib/country-flags";

export type CurrencyCode = {
  code: string;
  nameFa: string;
  flag: string;
};

const CURRENCIES: { code: string; nameFa: string; country: string }[] = [
  { code: "AED", nameFa: "درهم امارات", country: "AE" },
  { code: "AFN", nameFa: "افغانی", country: "AF" },
  { code: "ALL", nameFa: "لک آلبانیا", country: "AL" },
  { code: "AMD", nameFa: "درام ارمنستان", country: "AM" },
  { code: "ANG", nameFa: "گیلدر آنتیل هولند", country: "NL" },
  { code: "AOA", nameFa: "کوانزای آنگولا", country: "AO" },
  { code: "ARS", nameFa: "پزو آرژانتین", country: "AR" },
  { code: "AUD", nameFa: "دالر استرالیا", country: "AU" },
  { code: "AWG", nameFa: "فلورین آروبا", country: "NL" },
  { code: "AZN", nameFa: "منات آذربایجان", country: "AZ" },
  { code: "BAM", nameFa: "مارک بوسنی", country: "BA" },
  { code: "BBD", nameFa: "دالر باربادوس", country: "BB" },
  { code: "BDT", nameFa: "تاکای بنگلادش", country: "BD" },
  { code: "BGN", nameFa: "لف بلغارستان", country: "BG" },
  { code: "BHD", nameFa: "دینار بحرین", country: "BH" },
  { code: "BIF", nameFa: "فرانک بوروندی", country: "BI" },
  { code: "BMD", nameFa: "دالر برمودا", country: "GB" },
  { code: "BND", nameFa: "دالر برونئی", country: "BN" },
  { code: "BOB", nameFa: "بولیویانو", country: "BO" },
  { code: "BRL", nameFa: "رئال برزیل", country: "BR" },
  { code: "BSD", nameFa: "دالر باهاما", country: "BS" },
  { code: "BTN", nameFa: "انگولتروم بوتان", country: "BT" },
  { code: "BWP", nameFa: "پولای بوتسوانا", country: "BW" },
  { code: "BYN", nameFa: "روبل بلاروس", country: "BY" },
  { code: "BZD", nameFa: "دالر بلیز", country: "BZ" },
  { code: "CAD", nameFa: "دالر کانادا", country: "CA" },
  { code: "CDF", nameFa: "فرانک کنگو", country: "CD" },
  { code: "CHF", nameFa: "فرانک سویس", country: "CH" },
  { code: "CLP", nameFa: "پزو شیلی", country: "CL" },
  { code: "CNY", nameFa: "یوان چین", country: "CN" },
  { code: "COP", nameFa: "پزو کلمبیا", country: "CO" },
  { code: "CRC", nameFa: "کولون کاستاریکا", country: "CR" },
  { code: "CUP", nameFa: "پزو کوبا", country: "CU" },
  { code: "CVE", nameFa: "اسکودوی کیپ‌ورد", country: "CV" },
  { code: "CZK", nameFa: "کورونای چک", country: "CZ" },
  { code: "DJF", nameFa: "فرانک جیبوتی", country: "DJ" },
  { code: "DKK", nameFa: "کرون دانمارک", country: "DK" },
  { code: "DOP", nameFa: "پزو دومینیکن", country: "DO" },
  { code: "DZD", nameFa: "دینار الجزایر", country: "DZ" },
  { code: "EGP", nameFa: "پوند مصر", country: "EG" },
  { code: "ERN", nameFa: "ناکفای اریتره", country: "ER" },
  { code: "ETB", nameFa: "بیر اتیوپی", country: "ET" },
  { code: "EUR", nameFa: "یورو", country: "EU" },
  { code: "FJD", nameFa: "دالر فیجی", country: "FJ" },
  { code: "FKP", nameFa: "پوند فالکلند", country: "GB" },
  { code: "GBP", nameFa: "پوند انگلیس", country: "GB" },
  { code: "GEL", nameFa: "لاری گرجستان", country: "GE" },
  { code: "GHS", nameFa: "سدی غنا", country: "GH" },
  { code: "GIP", nameFa: "پوند جبل‌الطارق", country: "GB" },
  { code: "GMD", nameFa: "دالاسی گامبیا", country: "GM" },
  { code: "GNF", nameFa: "فرانک گینه", country: "GN" },
  { code: "GTQ", nameFa: "کتزال گواتمالا", country: "GT" },
  { code: "GYD", nameFa: "دالر گویانا", country: "GY" },
  { code: "HKD", nameFa: "دالر هنگ‌کنگ", country: "HK" },
  { code: "HNL", nameFa: "لمپیرای هندوراس", country: "HN" },
  { code: "HTG", nameFa: "گورد هائیتی", country: "HT" },
  { code: "HUF", nameFa: "فورینت مجارستان", country: "HU" },
  { code: "IDR", nameFa: "روپیه اندونزی", country: "ID" },
  { code: "ILS", nameFa: "شیکل اسرائیل", country: "IL" },
  { code: "INR", nameFa: "روپیه هند", country: "IN" },
  { code: "IQD", nameFa: "دینار عراق", country: "IQ" },
  { code: "IRR", nameFa: "تومان ایران", country: "IR" },
  { code: "ISK", nameFa: "کرون ایسلند", country: "IS" },
  { code: "JMD", nameFa: "دالر جامائیکا", country: "JM" },
  { code: "JOD", nameFa: "دینار اردن", country: "JO" },
  { code: "JPY", nameFa: "ین جاپان", country: "JP" },
  { code: "KES", nameFa: "شیلینگ کنیا", country: "KE" },
  { code: "KGS", nameFa: "سوم قرقیزستان", country: "KG" },
  { code: "KHR", nameFa: "ریل کامبوج", country: "KH" },
  { code: "KMF", nameFa: "فرانک کومور", country: "KM" },
  { code: "KPW", nameFa: "وون کره شمالی", country: "KP" },
  { code: "KRW", nameFa: "وون کره جنوبی", country: "KR" },
  { code: "KWD", nameFa: "دینار کویت", country: "KW" },
  { code: "KYD", nameFa: "دالر جزایر کایمان", country: "GB" },
  { code: "KZT", nameFa: "تنگه قزاقستان", country: "KZ" },
  { code: "LAK", nameFa: "کیپ لائوس", country: "LA" },
  { code: "LBP", nameFa: "لیره لبنان", country: "LB" },
  { code: "LKR", nameFa: "روپیه سری‌لانکا", country: "LK" },
  { code: "LRD", nameFa: "دالر لیبریا", country: "LR" },
  { code: "LSL", nameFa: "لوتی لسوتو", country: "LS" },
  { code: "LYD", nameFa: "دینار لیبیا", country: "LY" },
  { code: "MAD", nameFa: "درهم مراکش", country: "MA" },
  { code: "MDL", nameFa: "لئوی مولداوی", country: "MD" },
  { code: "MGA", nameFa: "آریاری ماداگاسکار", country: "MG" },
  { code: "MKD", nameFa: "دینار مقدونیه", country: "MK" },
  { code: "MMK", nameFa: "کیات میانمار", country: "MM" },
  { code: "MNT", nameFa: "توغریک مغولستان", country: "MN" },
  { code: "MOP", nameFa: "پاتاکای ماکائو", country: "MO" },
  { code: "MRU", nameFa: "اوگوئیای موریتانی", country: "MR" },
  { code: "MUR", nameFa: "روپیه موریس", country: "MU" },
  { code: "MVR", nameFa: "روفیه مالدیو", country: "MV" },
  { code: "MWK", nameFa: "کواچای مالاوی", country: "MW" },
  { code: "MXN", nameFa: "پزو مکزیک", country: "MX" },
  { code: "MYR", nameFa: "رینگیت مالزیا", country: "MY" },
  { code: "MZN", nameFa: "متیکال موزامبیک", country: "MZ" },
  { code: "NAD", nameFa: "دالر نامیبیا", country: "NA" },
  { code: "NGN", nameFa: "نایرای نیجریه", country: "NG" },
  { code: "NIO", nameFa: "کوردوبای نیکاراگوئه", country: "NI" },
  { code: "NOK", nameFa: "کرون ناروی", country: "NO" },
  { code: "NPR", nameFa: "روپیه نپال", country: "NP" },
  { code: "NZD", nameFa: "دالر نیوزیلند", country: "NZ" },
  { code: "OMR", nameFa: "ریال عمان", country: "OM" },
  { code: "PAB", nameFa: "بالبوآ پاناما", country: "PA" },
  { code: "PEN", nameFa: "سول پرو", country: "PE" },
  { code: "PGK", nameFa: "کینای پاپوا", country: "PG" },
  { code: "PHP", nameFa: "پزو فیلیپین", country: "PH" },
  { code: "PKR", nameFa: "روپیه پاکستان", country: "PK" },
  { code: "PLN", nameFa: "زلوتی لهستان", country: "PL" },
  { code: "PYG", nameFa: "گوارانی پاراگوئه", country: "PY" },
  { code: "QAR", nameFa: "ریال قطر", country: "QA" },
  { code: "RON", nameFa: "لئوی رومانیا", country: "RO" },
  { code: "RSD", nameFa: "دینار صربستان", country: "RS" },
  { code: "RUB", nameFa: "روبل روسیه", country: "RU" },
  { code: "RWF", nameFa: "فرانک رواندا", country: "RW" },
  { code: "SAR", nameFa: "ریال عربستان", country: "SA" },
  { code: "SBD", nameFa: "دالر جزایر سلیمان", country: "SB" },
  { code: "SCR", nameFa: "روپیه سیشل", country: "SC" },
  { code: "SDG", nameFa: "پوند سودان", country: "SD" },
  { code: "SEK", nameFa: "کرون سویدن", country: "SE" },
  { code: "SGD", nameFa: "دالر سنگاپور", country: "SG" },
  { code: "SHP", nameFa: "پوند سنت هلن", country: "GB" },
  { code: "SLE", nameFa: "لئون سیرالئون", country: "SL" },
  { code: "SOS", nameFa: "شیلینگ سومالی", country: "SO" },
  { code: "SRD", nameFa: "دالر سورینام", country: "SR" },
  { code: "SSP", nameFa: "پوند سودان جنوبی", country: "SS" },
  { code: "STN", nameFa: "دوبرای سائوتومه", country: "ST" },
  { code: "SYP", nameFa: "لیره سوریه", country: "SY" },
  { code: "SZL", nameFa: "لیلانگنی اسواتینی", country: "SZ" },
  { code: "THB", nameFa: "بات تایلند", country: "TH" },
  { code: "TJS", nameFa: "سامانی تاجیکستان", country: "TJ" },
  { code: "TMT", nameFa: "منات ترکمنستان", country: "TM" },
  { code: "TND", nameFa: "دینار تونس", country: "TN" },
  { code: "TOP", nameFa: "پاآنگای تونگا", country: "TO" },
  { code: "TRY", nameFa: "لیر ترکیه", country: "TR" },
  { code: "TTD", nameFa: "دالر ترینیداد", country: "TT" },
  { code: "TWD", nameFa: "دالر تایوان", country: "TW" },
  { code: "TZS", nameFa: "شیلینگ تانزانیا", country: "TZ" },
  { code: "UAH", nameFa: "گریونا اوکراین", country: "UA" },
  { code: "UGX", nameFa: "شیلینگ اوگاندا", country: "UG" },
  { code: "USD", nameFa: "دالر آمریکا", country: "US" },
  { code: "UYU", nameFa: "پزو اروگوئه", country: "UY" },
  { code: "UZS", nameFa: "سوم ازبکستان", country: "UZ" },
  { code: "VES", nameFa: "بولیوار ونزوئلا", country: "VE" },
  { code: "VND", nameFa: "دانگ ویتنام", country: "VN" },
  { code: "VUV", nameFa: "واتوی وانواتو", country: "VU" },
  { code: "WST", nameFa: "تالا ساموآ", country: "WS" },
  { code: "XAF", nameFa: "فرانک آفریقای مرکزی", country: "CM" },
  { code: "XCD", nameFa: "دالر کارائیب شرقی", country: "AG" },
  { code: "XOF", nameFa: "فرانک غرب آفریقا", country: "SN" },
  { code: "XPF", nameFa: "فرانک اقیانوسیه", country: "FR" },
  { code: "YER", nameFa: "ریال یمن", country: "YE" },
  { code: "ZAR", nameFa: "راند افریقای جنوبی", country: "ZA" },
  { code: "ZMW", nameFa: "کواچای زامبیا", country: "ZM" },
  { code: "ZWL", nameFa: "دالر زیمبابوه", country: "ZW" },
];

export const CURRENCY_CODES: CurrencyCode[] = CURRENCIES.map((currency) => ({
  code: currency.code,
  nameFa: currency.nameFa,
  flag: flagFromIso(currency.country),
})).sort((a, b) => a.code.localeCompare(b.code));

const byCode = new Map(CURRENCY_CODES.map((currency) => [currency.code, currency]));
const countryByCurrencyCode = new Map(CURRENCIES.map((currency) => [currency.code, currency.country]));

export function findCurrencyCode(code: string): CurrencyCode | undefined {
  return byCode.get(code.toUpperCase());
}

export function countryCodeForCurrency(code: string): string | undefined {
  return countryByCurrencyCode.get(code.trim().toUpperCase());
}

export function currencyCodeOptions(
  currentCode?: string,
  options?: { excludeCodes?: Iterable<string> },
) {
  const excluded = new Set(
    [...(options?.excludeCodes ?? [])].map((code) => code.trim().toUpperCase()).filter(Boolean),
  );
  const current = currentCode?.trim().toUpperCase() ?? "";
  if (current) excluded.delete(current);

  const list = CURRENCY_CODES.filter((currency) => !excluded.has(currency.code)).map((currency) => ({
    value: currency.code,
    label: `${currency.flag}  ${currency.code} — ${currency.nameFa}`,
    keywords: `${currency.code} ${currency.nameFa}`,
  }));

  if (current && !list.some((option) => option.value === current)) {
    list.unshift({
      value: current,
      label: current,
      keywords: current,
    });
  }

  return list;
}
