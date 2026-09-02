import type { Locale } from "@/i18n/config";
import { pickLocalized } from "@/i18n/content";

export const RATE_SOURCES = [
  {
    id: "sarai_shahzada",
    label_fa: "سرای شهزاده",
    label_en: "Sarai Shahzada",
    label_ps: "سرای شهزاده",
  },
  {
    id: "da_afg_bank",
    label_fa: "د افغانستان بانک",
    label_en: "Da Afghanistan Bank",
    label_ps: "د افغانستان بانک",
  },
] as const;

export type RateSourceId = (typeof RATE_SOURCES)[number]["id"];

export const DEFAULT_RATE_SOURCE: RateSourceId = "sarai_shahzada";

export const RATE_SOURCE_COOKIE = "sarafi_rate_source";
export const RATE_SOURCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const RATE_SOURCE_STORAGE_KEY = "sarafi_rate_source";

export function getRateSourceLabel(source: RateSourceId, locale: Locale = "fa") {
  const item = RATE_SOURCES.find((entry) => entry.id === source);
  if (!item) return source;
  return pickLocalized(item, "label", locale) || source;
}

export function isRateSourceId(value: string): value is RateSourceId {
  return RATE_SOURCES.some((item) => item.id === value);
}

export function readRateSourceCookie(cookieHeader?: string | null): RateSourceId {
  const source =
    cookieHeader ?? (typeof document !== "undefined" ? document.cookie : "");
  if (!source) return DEFAULT_RATE_SOURCE;

  const match = source.match(
    new RegExp(`(?:^|;\\s*)${RATE_SOURCE_COOKIE}=([^;]*)`),
  );
  if (!match?.[1]) return DEFAULT_RATE_SOURCE;
  try {
    const value = decodeURIComponent(match[1]);
    return isRateSourceId(value) ? value : DEFAULT_RATE_SOURCE;
  } catch {
    return DEFAULT_RATE_SOURCE;
  }
}

/** True when the rate-source cookie is present (even if it equals the default). */
export function hasRateSourceCookie(cookieHeader?: string | null): boolean {
  const source =
    cookieHeader ?? (typeof document !== "undefined" ? document.cookie : "");
  if (!source) return false;
  return new RegExp(`(?:^|;\\s*)${RATE_SOURCE_COOKIE}=`).test(source);
}

export function writeRateSourceCookie(source: RateSourceId): void {
  if (typeof document === "undefined") return;
  document.cookie = `${RATE_SOURCE_COOKIE}=${encodeURIComponent(source)}; path=/; max-age=${RATE_SOURCE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function readRateSourceStorage(): RateSourceId | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const stored = localStorage.getItem(RATE_SOURCE_STORAGE_KEY);
    return stored && isRateSourceId(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeRateSourceStorage(source: RateSourceId): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(RATE_SOURCE_STORAGE_KEY, source);
  } catch {
    // Ignore quota / private-mode failures; cookie remains the SSR source of truth.
  }
}
