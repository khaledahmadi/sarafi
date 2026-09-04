import {
  DEFAULT_THEME,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
  resolveTheme,
  type Theme,
} from "./config";

export function readThemeCookie(cookieHeader?: string | null): Theme {
  const source =
    cookieHeader ?? (typeof document !== "undefined" ? document.cookie : "");
  if (!source) return DEFAULT_THEME;

  const match = source.match(new RegExp(`(?:^|;\\s*)${THEME_COOKIE}=([^;]*)`));
  if (!match?.[1]) return DEFAULT_THEME;
  try {
    return resolveTheme(decodeURIComponent(match[1]));
  } catch {
    return DEFAULT_THEME;
  }
}

export function writeThemeCookie(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.cookie = `${THEME_COOKIE}=${encodeURIComponent(theme)}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Runs before paint to apply `.dark` from the theme cookie (or system preference)
 * and reduce FOUC. Keep in sync with `applyResolvedTheme` in context.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)sarafi_theme=([^;]*)/);var t=m?decodeURIComponent(m[1]):"system";if(t!=="light"&&t!=="dark"&&t!=="system")t="system";var d=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;var r=document.documentElement;r.classList.toggle("dark",d==="dark");r.style.colorScheme=d;r.dataset.theme=t;r.dataset.resolvedTheme=d;}catch(e){}})();`;
