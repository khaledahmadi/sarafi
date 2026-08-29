export const site = {
  name: "صرافی سروری",
  nameEn: "Sarafi Sarwari",
  tagline: "حواله، تبادل ارز و پرداخت‌های بین‌المللی",
  description:
    "نرخ لحظه‌ای اسعار، حواله یوان به چین، شارژ علی‌پی و وی‌چت‌پی و خدمات بازرگانی با شبکه نمایندگی‌های مطمئن.",
  phone: "+93 70 000 0000",
  whatsapp: "+93700000000",
  email: "info@sarafisarwari.com",
  address: "کابل، سرای شهزاده، بازار ارز، طبقه دوم",
  hours: "شنبه تا پنجشنبه، ۸:۰۰ تا ۱۷:۰۰",
  baseCurrency: "AFN",
  baseCurrencyFa: "افغانی",
} as const;

export const statusLabels: Record<string, string> = {
  pending: "در انتظار بررسی",
  in_review: "در حال بررسی",
  processing: "در حال انجام",
  completed: "تکمیل شده",
  rejected: "رد شده",
  cancelled: "لغو شده",
};

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function faNum(value: number | string, digits = 2) {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  const [intPart, fracPart = ""] = n.toFixed(digits).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
  const raw = digits > 0 ? `${grouped}٫${fracPart}` : grouped;
  return raw.replace(/\d/g, (digit) => FA_DIGITS[Number(digit)] ?? digit);
}

export function faDate(value: string) {
  return new Date(value).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
