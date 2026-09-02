import { createFileRoute } from "@tanstack/react-router";
import { FaqView } from "@/components/site/FaqView";
import { faqsQuery, settingsQuery } from "@/lib/queries";
import { pageMeta, resolvePageLocale } from "@/i18n/meta";

export const Route = createFileRoute("/faq")({
  loader: async ({ context }) => {
    const locale = await resolvePageLocale();
    await Promise.all([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(faqsQuery),
    ]);
    return { locale };
  },
  head: ({ loaderData }) =>
    pageMeta(loaderData?.locale ?? "fa", "meta.faqTitle", "meta.faqDescription"),
  component: FaqPage,
});

function FaqPage() {
  return <FaqView />;
}
