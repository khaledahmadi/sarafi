import type { Locale } from "./config";

type LocalizedFields<Base extends string> = {
  [K in `${Base}_fa` | `${Base}_en` | `${Base}_ps`]?: string | null | undefined;
};

/**
 * Pick a localized content field with fallback: requested locale → fa → en → first non-empty.
 */
export function pickLocalized<Base extends string>(
  row: LocalizedFields<Base>,
  base: Base,
  locale: Locale,
): string {
  const fa = row[`${base}_fa` as keyof typeof row];
  const en = row[`${base}_en` as keyof typeof row];
  const ps = row[`${base}_ps` as keyof typeof row];

  const byLocale: Record<Locale, string | null | undefined> = {
    fa: typeof fa === "string" ? fa : undefined,
    en: typeof en === "string" ? en : undefined,
    ps: typeof ps === "string" ? ps : undefined,
  };

  const preferred = byLocale[locale];
  if (preferred?.trim()) return preferred.trim();

  for (const candidate of [byLocale.fa, byLocale.en, byLocale.ps]) {
    if (candidate?.trim()) return candidate.trim();
  }

  return "";
}
