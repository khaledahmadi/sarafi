import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import { useSiteSettings } from "@/hooks/use-settings";
import { branchesQuery } from "@/lib/queries";
import { useRateSource } from "@/hooks/use-rate-source";
import { useRates } from "@/hooks/use-rates";
import { yearsOfExperience } from "@/lib/public-stats";

/** Live homepage/about glance numbers from currencies, branches, and founding year. */
export function useGlanceStats() {
  const { source } = useRateSource();
  const { data: rates } = useRates(source);
  const { data: branches } = useSuspenseQuery(branchesQuery);
  const { get } = useSiteSettings();
  const { n } = useLocale();
  const years = yearsOfExperience(get("brand.founded_year"));

  return [
    { key: "years", value: n(years, 0), label: get("home.stat1_label") },
    { key: "branches", value: n(branches.length, 0), label: get("home.stat2_label") },
    { key: "currencies", value: n(rates?.length ?? 0, 0), label: get("home.stat3_label") },
  ];
}
