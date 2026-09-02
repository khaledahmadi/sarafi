export const LOCALES = ["fa", "en", "ps"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fa";

export const LOCALE_COOKIE = "sarafi_locale";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const RTL_LOCALES: ReadonlySet<Locale> = new Set(["fa", "ps"]);

export const LOCALE_LABELS: Record<Locale, string> = {
  fa: "فارسی",
  en: "English",
  ps: "پښتو",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  fa: "🇦🇫",
  en: "🇬🇧",
  ps: "🇦🇫",
};

export const LOCALE_INTL: Record<Locale, string> = {
  fa: "fa-AF",
  en: "en",
  ps: "ps-AF",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function localeDir(locale: Locale): "rtl" | "ltr" {
  return RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.has(locale);
}
