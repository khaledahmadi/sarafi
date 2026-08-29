import { useSuspenseQuery } from "@tanstack/react-query";
import { useSiteSettings } from "@/hooks/use-settings";
import { branchesQuery, ratesQuery } from "@/lib/queries";
import { yearsOfExperience } from "@/lib/public-stats";
import { faNum } from "@/lib/site";

/** Live homepage/about glance numbers from currencies, branches, and founding year. */
export function useGlanceStats() {
  const { data: rates } = useSuspenseQuery(ratesQuery);
  const { data: branches } = useSuspenseQuery(branchesQuery);
  const { get } = useSiteSettings();
  const years = yearsOfExperience(get("brand.founded_year"));

  return [
    { key: "years", value: faNum(years, 0), label: get("home.stat1_label") },
    { key: "branches", value: faNum(branches.length, 0), label: get("home.stat2_label") },
    { key: "currencies", value: faNum(rates.length, 0), label: get("home.stat3_label") },
  ];
}
