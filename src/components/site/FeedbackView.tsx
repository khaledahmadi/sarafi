import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { FeedbackList } from "@/components/site/FeedbackList";
import { TextAreaField, TextField } from "@/components/site/Field";
import { PageHero } from "@/components/site/Sections";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { createFeedback, listPublicFeedback } from "@/lib/public.functions";
import { fieldErrorMap, feedbackSchema, resolveValidationMessage, translateFieldErrors } from "@/lib/validation";
import { useLocale } from "@/i18n";
import { cn } from "@/lib/utils";

const emptyForm = { body: "", rating: 0, guest_name: "", guest_email: "" };

export function FeedbackView() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const list = useQuery({
    queryKey: ["public-feedback"],
    queryFn: listPublicFeedback,
  });

  const submit = useMutation({
    mutationFn: () =>
      createFeedback({
        data: user ? { body: form.body, rating: form.rating } : form,
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        setErrors(translateFieldErrors(result.fieldErrors, t));
        toast.error(resolveValidationMessage(result.message ?? "validation.formInvalid", t));
        return;
      }
      setForm(emptyForm);
      setErrors({});
      setPage(1);
      toast.success(t("feedback.success"));
      void queryClient.invalidateQueries({ queryKey: ["public-feedback"] });
      void queryClient.invalidateQueries({ queryKey: ["staff-feedback"] });
      void queryClient.invalidateQueries({ queryKey: ["manage-stats"] });
    },
    onError: () => toast.error(t("feedback.submitFailed")),
  });

  const rows = list.data ?? [];

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = feedbackSchema(Boolean(user)).safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrorMap(parsed.error, t));
      toast.error(t("feedback.formInvalid"));
      return;
    }
    setErrors({});
    submit.mutate();
  }

  return (
    <>
      <PageHero
        variant="soft"
        eyebrow={t("feedback.eyebrow")}
        title={t("feedback.heroTitle")}
        description={t("feedback.heroDescription")}
      />

      <section className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <form onSubmit={onSubmit} className="space-y-4 p-5 card-elevated">
          <h2 className="text-lg font-extrabold">{t("feedback.newFeedback")}</h2>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{t("feedback.rating")}</legend>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setForm((current) => ({ ...current, rating: value }));
                      if (errors["rating"]) setErrors((current) => ({ ...current, rating: "" }));
                    }}
                    className="grid size-11 place-items-center rounded-lg"
                    aria-label={t("feedback.starsAria", { count: value })}
                    aria-pressed={form.rating === value}
                  >
                    <Star
                      className={cn(
                        "size-6",
                        form.rating >= value ? "fill-accent text-accent" : "text-muted-foreground",
                      )}
                    />
                  </button>
                );
              })}
            </div>
            {errors["rating"] ? (
              <p className="mt-1 text-sm text-destructive" role="alert">
                {errors["rating"]}
              </p>
            ) : null}
          </fieldset>
          {user ? null : (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label={t("feedback.name")}
                value={form.guest_name}
                error={errors["guest_name"]}
                onChange={(event) => {
                  setForm((current) => ({ ...current, guest_name: event.target.value }));
                  if (errors["guest_name"]) setErrors((current) => ({ ...current, guest_name: "" }));
                }}
              />
              <TextField
                label={t("feedback.email")}
                type="email"
                dir="ltr"
                value={form.guest_email}
                error={errors["guest_email"]}
                onChange={(event) => {
                  setForm((current) => ({ ...current, guest_email: event.target.value }));
                  if (errors["guest_email"]) setErrors((current) => ({ ...current, guest_email: "" }));
                }}
              />
            </div>
          )}
          <TextAreaField
            label={t("feedback.body")}
            value={form.body}
            error={errors["body"]}
            onChange={(event) => {
              setForm((current) => ({ ...current, body: event.target.value }));
              if (errors["body"]) setErrors((current) => ({ ...current, body: "" }));
            }}
          />
          <Button type="submit" className="min-h-11" disabled={submit.isPending}>
            {submit.isPending ? t("feedback.submitting") : t("feedback.send")}
          </Button>
        </form>

        <section className="space-y-4">
          <h2 className="text-lg font-extrabold">{t("feedback.allFeedback")}</h2>
          <FeedbackList
            rows={rows}
            page={page}
            onPageChange={setPage}
            loading={list.isLoading}
          />
        </section>
      </section>
    </>
  );
}
