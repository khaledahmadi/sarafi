import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { readLocaleCookie } from "./cookie";
import type { Locale } from "./config";

/** Read the preferred locale from the request cookie during SSR. */
export const getRequestLocale = createServerFn({ method: "GET" }).handler(
  async (): Promise<Locale> => {
    return readLocaleCookie(getRequestHeader("cookie"));
  },
);
