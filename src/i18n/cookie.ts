import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  resolveLocale,
  type Locale,
} from "./config";

export function readLocaleCookie(cookieHeader?: string | null): Locale {
  const source =
    cookieHeader ?? (typeof document !== "undefined" ? document.cookie : "");
  if (!source) return DEFAULT_LOCALE;

  const match = source.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`));
  if (!match?.[1]) return DEFAULT_LOCALE;
  try {
    return resolveLocale(decodeURIComponent(match[1]));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function writeLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/** Runs before paint to set lang/dir from the locale cookie and reduce FOUC. */
export const LOCALE_BOOTSTRAP_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)sarafi_locale=([^;]*)/);var l=m?decodeURIComponent(m[1]):"fa";if(l!=="fa"&&l!=="en"&&l!=="ps")l="fa";document.documentElement.lang=l;document.documentElement.dir=l==="en"?"ltr":"rtl";document.documentElement.dataset.locale=l;}catch(e){}})();`;
