import type { Locale } from "./config";
import { catalogs, type Messages } from "./messages";

type NestedKeyOf<T, Prefix extends string = ""> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: NestedKeyOf<
        T[K],
        Prefix extends "" ? K : `${Prefix}.${K}`
      >;
    }[keyof T & string];

export type MessageKey = NestedKeyOf<Messages>;

type Vars = Record<string, string | number>;

function getByPath(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function translate(
  locale: Locale,
  key: MessageKey | string,
  vars?: Vars,
): string {
  const fromLocale = getByPath(catalogs[locale], key);
  const fallback = getByPath(catalogs.fa, key);
  let text = fromLocale ?? fallback ?? key;

  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }

  return text;
}

export type TranslateFn = (
  key: MessageKey | string,
  vars?: Vars,
) => string;
