import { createFileRoute } from "@tanstack/react-router";
import { FaqView } from "@/components/site/FaqView";
import { faqsQuery, settingsQuery } from "@/lib/queries";
import { site } from "@/lib/site";

const title = `سؤالات متداول | ${site.name}`;
const description = "پاسخ پرسش‌های رایج مشتریان درباره نرخ اسعار، حواله و خدمات صرافی.";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(faqsQuery),
    ]);
  },
  component: FaqPage,
});

function FaqPage() {
  return <FaqView />;
}
