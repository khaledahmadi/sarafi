import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { readRateSourceCookie, type RateSourceId } from "./rate-sources";

/** Read the preferred rate market from the request cookie during SSR. */
export const getRequestRateSource = createServerFn({ method: "GET" }).handler(
  async (): Promise<RateSourceId> => {
    return readRateSourceCookie(getRequestHeader("cookie"));
  },
);
