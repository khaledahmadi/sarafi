import { createFileRoute } from "@tanstack/react-router";
import { FeedbackView } from "@/components/site/FeedbackView";
import { publicFeedbackQuery, settingsQuery } from "@/lib/queries";
import { pageMeta, resolvePageLocale } from "@/i18n/meta";

export const Route = createFileRoute("/feedback")({
  loader: async ({ context }) => {
    const locale = await resolvePageLocale();
    await Promise.all([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(publicFeedbackQuery),
    ]);
    return { locale };
  },
  head: ({ loaderData }) =>
    pageMeta(loaderData?.locale ?? "fa", "meta.feedbackTitle", "meta.feedbackDescription"),
  component: FeedbackPage,
});

function FeedbackPage() {
  return <FeedbackView />;
}
