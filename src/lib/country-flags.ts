/** ISO 3166-1 alpha-2 countries with Persian names and flag emoji. */

export type CountryFlag = {
  code: string;
  nameFa: string;
  flag: string;
};

export function flagFromIso(code: string): string {
  return [...code.toUpperCase()]
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join("");
}

const COUNTRIES: { code: string; nameFa: string }[] = [
  { code: "AF", nameFa: "افغانستان" },
  { code: "AL", nameFa: "آلبانیا" },
  { code: "DZ", nameFa: "الجزایر" },
  { code: "AD", nameFa: "آندورا" },
  { code: "AO", nameFa: "آنگولا" },
  { code: "AG", nameFa: "آنتیگوا و باربودا" },
  { code: "AR", nameFa: "آرژانتین" },
  { code: "AM", nameFa: "ارمنستان" },
  { code: "AU", nameFa: "استرالیا" },
  { code: "AT", nameFa: "اتریش" },
  { code: "AZ", nameFa: "آذربایجان" },
  { code: "BS", nameFa: "باهاما" },
  { code: "BH", nameFa: "بحرین" },
  { code: "BD", nameFa: "بنگلادش" },
  { code: "BB", nameFa: "باربادوس" },
  { code: "BY", nameFa: "بلاروس" },
  { code: "BE", nameFa: "بلژیک" },
  { code: "BZ", nameFa: "بلیز" },
  { code: "BJ", nameFa: "بنین" },
  { code: "BT", nameFa: "بوتان" },
  { code: "BO", nameFa: "بولیوی" },
  { code: "BA", nameFa: "بوسنی و هرزگوین" },
  { code: "BW", nameFa: "بوتسوانا" },
  { code: "BR", nameFa: "برزیل" },
  { code: "BN", nameFa: "برونئی" },
  { code: "BG", nameFa: "بلغارستان" },
  { code: "BF", nameFa: "بورکینافاسو" },
  { code: "BI", nameFa: "بوروندی" },
  { code: "CV", nameFa: "کیپ‌ورد" },
  { code: "KH", nameFa: "کامبوج" },
  { code: "CM", nameFa: "کامرون" },
  { code: "CA", nameFa: "کانادا" },
  { code: "CF", nameFa: "جمهوری آفریقای مرکزی" },
  { code: "TD", nameFa: "چاد" },
  { code: "CL", nameFa: "شیلی" },
  { code: "CN", nameFa: "چین" },
  { code: "CO", nameFa: "کلمبیا" },
  { code: "KM", nameFa: "کومور" },
  { code: "CG", nameFa: "کنگو" },
  { code: "CD", nameFa: "جمهوری دموکراتیک کنگو" },
  { code: "CR", nameFa: "کاستاریکا" },
  { code: "CI", nameFa: "ساحل عاج" },
  { code: "HR", nameFa: "کرواسی" },
  { code: "CU", nameFa: "کوبا" },
  { code: "CY", nameFa: "قبرس" },
  { code: "CZ", nameFa: "چک" },
  { code: "DK", nameFa: "دانمارک" },
  { code: "DJ", nameFa: "جیبوتی" },
  { code: "DM", nameFa: "دومینیکا" },
  { code: "DO", nameFa: "جمهوری دومینیکن" },
  { code: "EC", nameFa: "اکوادور" },
  { code: "EG", nameFa: "مصر" },
  { code: "SV", nameFa: "السالوادور" },
  { code: "GQ", nameFa: "گینه استوایی" },
  { code: "ER", nameFa: "اریتره" },
  { code: "EE", nameFa: "استونی" },
  { code: "SZ", nameFa: "اسواتینی" },
  { code: "ET", nameFa: "اتیوپی" },
  { code: "FJ", nameFa: "فیجی" },
  { code: "FI", nameFa: "فنلاند" },
  { code: "FR", nameFa: "فرانسه" },
  { code: "GA", nameFa: "گابن" },
  { code: "GM", nameFa: "گامبیا" },
  { code: "GE", nameFa: "گرجستان" },
  { code: "DE", nameFa: "آلمان" },
  { code: "GH", nameFa: "غنا" },
  { code: "GR", nameFa: "یونان" },
  { code: "GD", nameFa: "گرنادا" },
  { code: "GT", nameFa: "گواتمالا" },
  { code: "GN", nameFa: "گینه" },
  { code: "GW", nameFa: "گینه بیسائو" },
  { code: "GY", nameFa: "گویانا" },
  { code: "HT", nameFa: "هائیتی" },
  { code: "HN", nameFa: "هندوراس" },
  { code: "HU", nameFa: "مجارستان" },
  { code: "IS", nameFa: "ایسلند" },
  { code: "IN", nameFa: "هند" },
  { code: "ID", nameFa: "اندونزی" },
  { code: "IR", nameFa: "ایران" },
  { code: "IQ", nameFa: "عراق" },
  { code: "IE", nameFa: "ایرلند" },
  { code: "IL", nameFa: "اسرائیل" },
  { code: "IT", nameFa: "ایتالیا" },
  { code: "JM", nameFa: "جامائیکا" },
  { code: "JP", nameFa: "جاپان" },
  { code: "JO", nameFa: "اردن" },
  { code: "KZ", nameFa: "قزاقستان" },
  { code: "KE", nameFa: "کنیا" },
  { code: "KI", nameFa: "کیریباتی" },
  { code: "KP", nameFa: "کره شمالی" },
  { code: "KR", nameFa: "کره جنوبی" },
  { code: "KW", nameFa: "کویت" },
  { code: "KG", nameFa: "قرقیزستان" },
  { code: "LA", nameFa: "لائوس" },
  { code: "LV", nameFa: "لتونی" },
  { code: "LB", nameFa: "لبنان" },
  { code: "LS", nameFa: "لسوتو" },
  { code: "LR", nameFa: "لیبریا" },
  { code: "LY", nameFa: "لیبیا" },
  { code: "LI", nameFa: "لیختن‌اشتاین" },
  { code: "LT", nameFa: "لیتوانی" },
  { code: "LU", nameFa: "لوکزامبورگ" },
  { code: "MG", nameFa: "ماداگاسکار" },
  { code: "MW", nameFa: "مالاوی" },
  { code: "MY", nameFa: "مالزیا" },
  { code: "MV", nameFa: "مالدیو" },
  { code: "ML", nameFa: "مالی" },
  { code: "MT", nameFa: "مالت" },
  { code: "MH", nameFa: "جزایر مارشال" },
  { code: "MR", nameFa: "موریتانی" },
  { code: "MU", nameFa: "موریس" },
  { code: "MX", nameFa: "مکزیک" },
  { code: "FM", nameFa: "میکرونزی" },
  { code: "MD", nameFa: "مولداوی" },
  { code: "MC", nameFa: "موناکو" },
  { code: "MN", nameFa: "مغولستان" },
  { code: "ME", nameFa: "مونته‌نگرو" },
  { code: "MA", nameFa: "مراکش" },
  { code: "MZ", nameFa: "موزامبیک" },
  { code: "MM", nameFa: "میانمار" },
  { code: "NA", nameFa: "نامیبیا" },
  { code: "NR", nameFa: "نائورو" },
  { code: "NP", nameFa: "نپال" },
  { code: "NL", nameFa: "هولند" },
  { code: "NZ", nameFa: "نیوزیلند" },
  { code: "NI", nameFa: "نیکاراگوئه" },
  { code: "NE", nameFa: "نیجر" },
  { code: "NG", nameFa: "نیجریه" },
  { code: "MK", nameFa: "مقدونیه شمالی" },
  { code: "NO", nameFa: "ناروی" },
  { code: "OM", nameFa: "عمان" },
  { code: "PK", nameFa: "پاکستان" },
  { code: "PW", nameFa: "پالائو" },
  { code: "PS", nameFa: "فلسطین" },
  { code: "PA", nameFa: "پاناما" },
  { code: "PG", nameFa: "پاپوا گینه نو" },
  { code: "PY", nameFa: "پاراگوئه" },
  { code: "PE", nameFa: "پرو" },
  { code: "PH", nameFa: "فیلیپین" },
  { code: "PL", nameFa: "لهستان" },
  { code: "PT", nameFa: "پرتغال" },
  { code: "QA", nameFa: "قطر" },
  { code: "RO", nameFa: "رومانیا" },
  { code: "RU", nameFa: "روسیه" },
  { code: "RW", nameFa: "رواندا" },
  { code: "KN", nameFa: "سنت کیتس و نویس" },
  { code: "LC", nameFa: "سنت لوسیا" },
  { code: "VC", nameFa: "سنت وینسنت و گرنادین" },
  { code: "WS", nameFa: "ساموآ" },
  { code: "SM", nameFa: "سان مارینو" },
  { code: "ST", nameFa: "سائوتومه و پرنسیپ" },
  { code: "SA", nameFa: "عربستان سعودی" },
  { code: "SN", nameFa: "سنگال" },
  { code: "RS", nameFa: "صربستان" },
  { code: "SC", nameFa: "سیشل" },
  { code: "SL", nameFa: "سیرالئون" },
  { code: "SG", nameFa: "سنگاپور" },
  { code: "SK", nameFa: "اسلواکی" },
  { code: "SI", nameFa: "اسلوونی" },
  { code: "SB", nameFa: "جزایر سلیمان" },
  { code: "SO", nameFa: "سومالی" },
  { code: "ZA", nameFa: "افریقای جنوبی" },
  { code: "SS", nameFa: "سودان جنوبی" },
  { code: "ES", nameFa: "هسپانیه" },
  { code: "LK", nameFa: "سری‌لانکا" },
  { code: "SD", nameFa: "سودان" },
  { code: "SR", nameFa: "سورینام" },
  { code: "SE", nameFa: "سویدن" },
  { code: "CH", nameFa: "سویس" },
  { code: "SY", nameFa: "سوریه" },
  { code: "TW", nameFa: "تایوان" },
  { code: "TJ", nameFa: "تاجیکستان" },
  { code: "TZ", nameFa: "تانزانیا" },
  { code: "TH", nameFa: "تایلند" },
  { code: "TL", nameFa: "تیمور شرقی" },
  { code: "TG", nameFa: "توگو" },
  { code: "TO", nameFa: "تونگا" },
  { code: "TT", nameFa: "ترینیداد و توباگو" },
  { code: "TN", nameFa: "تونس" },
  { code: "TR", nameFa: "ترکیه" },
  { code: "TM", nameFa: "ترکمنستان" },
  { code: "TV", nameFa: "تووالو" },
  { code: "UG", nameFa: "اوگاندا" },
  { code: "UA", nameFa: "اوکراین" },
  { code: "AE", nameFa: "امارات متحده عربی" },
  { code: "GB", nameFa: "بریتانیا" },
  { code: "US", nameFa: "ایالات متحده آمریکا" },
  { code: "UY", nameFa: "اروگوئه" },
  { code: "UZ", nameFa: "ازبکستان" },
  { code: "VU", nameFa: "وانواتو" },
  { code: "VA", nameFa: "واتیکان" },
  { code: "VE", nameFa: "ونزوئلا" },
  { code: "VN", nameFa: "ویتنام" },
  { code: "YE", nameFa: "یمن" },
  { code: "ZM", nameFa: "زامبیا" },
  { code: "ZW", nameFa: "زیمبابوه" },
  { code: "HK", nameFa: "هنگ‌کنگ" },
  { code: "MO", nameFa: "ماکائو" },
  { code: "EU", nameFa: "اتحادیه اروپا" },
  { code: "XK", nameFa: "کوزوو" },
];

export const NO_FLAG_VALUE = "__none__";

export const COUNTRY_FLAGS: CountryFlag[] = COUNTRIES.map((country) => ({
  ...country,
  flag: flagFromIso(country.code),
})).sort((a, b) => a.nameFa.localeCompare(b.nameFa, "fa"));

export function findCountryByNameFa(nameFa: string): CountryFlag | undefined {
  const needle = nameFa.trim();
  if (!needle) return undefined;
  return COUNTRY_FLAGS.find((country) => country.nameFa === needle);
}

function toCountryOption(country: CountryFlag) {
  return {
    value: country.nameFa,
    label: `${country.flag}  ${country.nameFa}`,
    keywords: `${country.code} ${country.nameFa}`,
  };
}

function withCurrentCountryOption(
  options: ReturnType<typeof toCountryOption>[],
  currentName?: string,
) {
  const current = currentName?.trim() ?? "";
  if (current && !options.some((option) => option.value === current)) {
    options.unshift({
      value: current,
      label: current,
      keywords: current,
    });
  }
  return options;
}

export function countryNameOptions(currentName?: string) {
  return withCurrentCountryOption(COUNTRY_FLAGS.map(toCountryOption), currentName);
}

export function countryNameOptionsForIsoCodes(
  isoCodes: Iterable<string>,
  currentName?: string,
) {
  const allowed = new Set(
    [...isoCodes].map((code) => code.trim().toUpperCase()).filter(Boolean),
  );
  return withCurrentCountryOption(
    COUNTRY_FLAGS.filter((country) => allowed.has(country.code)).map(toCountryOption),
    currentName,
  );
}

export function countryFlagOptions(currentFlag?: string) {
  const options = [
    { value: NO_FLAG_VALUE, label: "بدون پرچم", keywords: "none empty" },
    ...COUNTRY_FLAGS.map((country) => ({
      value: country.flag,
      label: `${country.flag}  ${country.nameFa}`,
      keywords: country.code,
    })),
  ];

  if (currentFlag && !options.some((option) => option.value === currentFlag)) {
    options.splice(1, 0, {
      value: currentFlag,
      label: `${currentFlag}  پرچم فعلی`,
      keywords: "current",
    });
  }

  return options;
}
