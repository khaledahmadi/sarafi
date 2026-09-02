import { useQuery } from "@tanstack/react-query";

import { ratesQuery } from "@/lib/queries";
import type { RateSourceId } from "@/lib/rate-sources";

/** Client-side rates for the selected market — does not suspend the route on tab change. */
export function useRates(source: RateSourceId) {
  return useQuery(ratesQuery(source));
}
