import { createFileRoute } from "@tanstack/react-router";
import { FeedbackView } from "@/components/site/FeedbackView";
import { publicFeedbackQuery, settingsQuery } from "@/lib/queries";
import { site } from "@/lib/site";

const title = `بازخورد | ${site.name}`;
const description = "ثبت بازخورد مشتریان و مشاهده فهرست بازخوردهای ثبت‌شده.";

export const Route = createFileRoute("/feedback")({
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
      context.queryClient.ensureQueryData(publicFeedbackQuery),
    ]);
  },
  component: FeedbackPage,
});

function FeedbackPage() {
  return <FeedbackView />;
}
