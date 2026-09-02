import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  localeDir,
  type Locale,
} from "./config";
import { writeLocaleCookie } from "./cookie";
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatTime,
} from "./format";
import { translate, type MessageKey, type TranslateFn } from "./translate";

type LocaleContextValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
  n: (value: number | string, digits?: number) => string;
  d: (value: string | Date) => string;
  dt: (value: string | Date) => string;
  time: (value: string | Date) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function applyDocumentLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  const dir = localeDir(locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
  document.documentElement.dataset["locale"] = locale;
}

type LocaleProviderProps = {
  children: ReactNode;
  /** Must come from SSR loader so server HTML and client hydrate with the same locale. */
  initialLocale?: Locale;
};

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: LocaleProviderProps) {
  // Use only the SSR-provided locale for the first paint — never read document.cookie
  // here, or server (fa default) and client (cookie) will hydrate mismatched text.
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeLocaleCookie(next);
    applyDocumentLocale(next);
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const t: TranslateFn = (key, vars) => translate(locale, key, vars);
    return {
      locale,
      dir: localeDir(locale),
      setLocale,
      t,
      n: (value, digits = 2) => formatNumber(value, locale, digits),
      d: (value) => formatDate(value, locale),
      dt: (value) => formatDateTime(value, locale),
      time: (value) => formatTime(value, locale),
    };
  }, [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Safe fallback for rare out-of-tree usage (error pages before provider).
    const locale = DEFAULT_LOCALE;
    return {
      locale,
      dir: localeDir(locale),
      setLocale: () => undefined,
      t: (key, vars) => translate(locale, key, vars),
      n: (value, digits = 2) => formatNumber(value, locale, digits),
      d: (value) => formatDate(value, locale),
      dt: (value) => formatDateTime(value, locale),
      time: (value) => formatTime(value, locale),
    };
  }
  return ctx;
}

export function useT(): TranslateFn {
  return useLocale().t;
}

export type { MessageKey };
