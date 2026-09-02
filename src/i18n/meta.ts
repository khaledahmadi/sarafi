import { DEFAULT_LOCALE, type Locale } from "./config";
import { getRequestLocale } from "./get-request-locale";
import { translate, type MessageKey } from "./translate";
import { site } from "@/lib/site";

type MetaVars = Record<string, string | number>;

export async function resolvePageLocale(): Promise<Locale> {
  try {
    return await getRequestLocale();
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function metaTitle(
  locale: Locale,
  key: MessageKey | string,
  vars: MetaVars = {},
): string {
  return translate(locale, key, { brand: site.name, ...vars });
}

export function pageMeta(
  locale: Locale,
  titleKey: MessageKey | string,
  descriptionKey?: MessageKey | string,
) {
  const title = metaTitle(locale, titleKey);
  const description = descriptionKey
    ? translate(locale, descriptionKey, { brand: site.name })
    : undefined;
  return {
    title,
    description,
    meta: [
      { title },
      ...(description
        ? [
            { name: "description", content: description },
            { property: "og:title", content: title },
            { property: "og:description", content: description },
          ]
        : [{ property: "og:title", content: title }]),
    ],
  };
}
