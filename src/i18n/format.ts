import { LOCALE_INTL, type Locale } from "./config";

const EASTERN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Fixed zone so SSR (UTC) and the browser produce the same formatted strings. */
const DISPLAY_TIME_ZONE = "Asia/Kabul";

function toEasternDigits(value: string): string {
  return value.replace(/\d/g, (digit) => EASTERN_DIGITS[Number(digit)] ?? digit);
}

/** Locale-aware number formatting. Uses Eastern digits for fa/ps. */
export function formatNumber(
  value: number | string,
  locale: Locale,
  digits = 2,
): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";

  if (locale === "en") {
    return new Intl.NumberFormat("en", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n);
  }

  const [intPart = "0", fracPart = ""] = n.toFixed(digits).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
  const raw = digits > 0 ? `${grouped}٫${fracPart}` : grouped;
  return toEasternDigits(raw);
}

/** Convert embedded digits in user-facing text to match the active locale. */
export function localizeDigits(text: string, locale: Locale): string {
  if (!text) return text;
  if (locale === "en") {
    return text.replace(/[۰-۹]/g, (digit) => String(EASTERN_DIGITS.indexOf(digit)));
  }
  return text.replace(/\d/g, (digit) => EASTERN_DIGITS[Number(digit)] ?? digit);
}

export function formatDate(value: string | Date, locale: Locale): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(LOCALE_INTL[locale], {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(value: string | Date, locale: Locale): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString(LOCALE_INTL[locale], {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value: string | Date, locale: Locale): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString(LOCALE_INTL[locale], {
    timeZone: DISPLAY_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
