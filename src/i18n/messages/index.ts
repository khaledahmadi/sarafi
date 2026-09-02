import type { Locale } from "../config";
import type { Messages } from "./fa";
import { fa } from "./fa";
import { en } from "./en";
import { ps } from "./ps";

export const catalogs: Record<Locale, Messages> = {
  fa,
  en,
  ps,
};

export type { Messages };
export { fa, en, ps };
