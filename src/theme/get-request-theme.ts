import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { readThemeCookie } from "./cookie";
import type { Theme } from "./config";

/** Read the preferred theme from the request cookie during SSR. */
export const getRequestTheme = createServerFn({ method: "GET" }).handler(
  async (): Promise<Theme> => {
    return readThemeCookie(getRequestHeader("cookie"));
  },
);
