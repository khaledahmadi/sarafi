import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { articleCommentsQuery } from "@/lib/queries";
import { createArticleComment, type PublicComment } from "@/lib/public.functions";
import { commentSchema, fieldErrorMap } from "@/lib/validation";
import { faDate, faNum } from "@/lib/site";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full min-h-[44px] rounded-2xl border-0 bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:bg-card sm:min-h-9";

type CommentFormState = {
  guestName: string;
  guestEmail: string;
  body: string;
};

const emptyForm: CommentFormState = { guestName: "", guestEmail: "", body: "" };

function CommentForm({
  slug,
  parentId,
  submitLabel,
  onDone,
}: {
  slug: string;
  parentId?: string;
  submitLabel: string;
  onDone?: () => void;
}) {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [form, setForm] = useState<CommentFormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = commentSchema(Boolean(user)).safeParse({
        body: form.body,
        guest_name: form.guestName,
        guest_email: form.guestEmail,
      });
      if (!parsed.success) {
        setErrors(fieldErrorMap(parsed.error));
        throw new Error("اطلاعات فرم را بررسی کنید");
      }
      setErrors({});
      return createArticleComment({
        data: {
          slug,
          body: parsed.data.body,
          ...(parentId ? { parent_id: parentId } : {}),
          ...(user
            ? {}
            : {
                guest_name: parsed.data.guest_name,
                guest_email: parsed.data.guest_email,
              }),
        },
      });
    },
    onSuccess: (result) => {
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }
      toast.success(parentId ? "پاسخ شما ثبت شد" : "نظر شما ثبت شد");
      setForm(emptyForm);
      setTouched({});
      void queryClient.invalidateQueries({ queryKey: ["article-comments", slug] });
      onDone?.();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function validateField(field: "guest_name" | "guest_email" | "body", value: string) {
    const parsed = commentSchema(Boolean(user)).safeParse({
      body: field === "body" ? value : form.body,
      guest_name: field === "guest_name" ? value : form.guestName,
      guest_email: field === "guest_email" ? value : form.guestEmail,
    });
    if (!parsed.success) {
      const next = fieldErrorMap(parsed.error);
      setErrors((prev) => ({ ...prev, [field]: next[field] ?? "" }));
      return;
    }
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setTouched({ guest_name: true, guest_email: true, body: true });
        submit.mutate();
      }}
    >
      {!user ? (
        <div>
          <label className="sr-only" htmlFor={parentId ? `reply-name-${parentId}` : "comment-name"}>
            نام
          </label>
          <input
            id={parentId ? `reply-name-${parentId}` : "comment-name"}
            value={form.guestName}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, guestName: event.target.value }));
              if (touched.guest_name) validateField("guest_name", event.target.value);
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, guest_name: true }));
              validateField("guest_name", form.guestName);
            }}
            placeholder="نام"
            className={cn(inputClass, "mb-3", errors.guest_name && "form-field-invalid")}
            aria-invalid={Boolean(errors.guest_name)}
          />
          {errors.guest_name ? (
            <p className="mb-3 text-xs font-semibold text-destructive" role="alert">
              {errors.guest_name}
            </p>
          ) : null}
          <label className="sr-only" htmlFor={parentId ? `reply-email-${parentId}` : "comment-email"}>
            ایمیل
          </label>
          <input
            id={parentId ? `reply-email-${parentId}` : "comment-email"}
            type="email"
            value={form.guestEmail}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, guestEmail: event.target.value }));
              if (touched.guest_email) validateField("guest_email", event.target.value);
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, guest_email: true }));
              validateField("guest_email", form.guestEmail);
            }}
            placeholder="ایمیل"
            className={cn(inputClass, errors.guest_email && "form-field-invalid")}
            aria-invalid={Boolean(errors.guest_email)}
          />
          {errors.guest_email ? (
            <p className="mt-1 text-xs font-semibold text-destructive" role="alert">
              {errors.guest_email}
            </p>
          ) : null}
        </div>
      ) : null}

      <label className="sr-only" htmlFor={parentId ? `reply-body-${parentId}` : "comment-body"}>
        {parentId ? "پاسخ شما" : "نظر شما"}
      </label>
      <textarea
        id={parentId ? `reply-body-${parentId}` : "comment-body"}
        required
        rows={parentId ? 3 : 4}
        value={form.body}
        onChange={(event) => {
          setForm((prev) => ({ ...prev, body: event.target.value }));
          if (touched.body) validateField("body", event.target.value);
        }}
        onBlur={() => {
          setTouched((prev) => ({ ...prev, body: true }));
          validateField("body", form.body);
        }}
        placeholder={parentId ? "پاسخ شما" : "نظر شما"}
        className={cn(inputClass, "min-h-[4.5rem] py-3", errors.body && "form-field-invalid")}
        aria-invalid={Boolean(errors.body)}
      />
      {errors.body ? (
        <p className="text-xs font-semibold text-destructive" role="alert">
          {errors.body}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={submit.isPending}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:shadow-md disabled:opacity-50 sm:min-h-10"
        >
          {submit.isPending ? "در حال ارسال…" : submitLabel}
        </button>
        {onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground sm:min-h-10"
          >
            لغو
          </button>
        ) : null}
      </div>
    </form>
  );
}

function CommentCard({
  comment,
  slug,
}: {
  comment: PublicComment;
  slug: string;
}) {
  const [replyOpen, setReplyOpen] = useState(false);

  return (
    <li className="space-y-3">
      <div className="rounded-2xl bg-card p-5 shadow-[0_2px_32px_-8px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{comment.author}</p>
          <time className="text-xs text-muted-foreground" dateTime={comment.created_at}>
            {faDate(comment.created_at)}
          </time>
        </div>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">{comment.body}</p>
        <button
          type="button"
          onClick={() => setReplyOpen((open) => !open)}
          className="mt-3 text-sm font-semibold text-primary"
        >
          {replyOpen ? "بستن پاسخ" : "پاسخ"}
        </button>
        {replyOpen ? (
          <div className="mt-4">
            <CommentForm
              slug={slug}
              parentId={comment.id}
              submitLabel="ارسال پاسخ"
              onDone={() => setReplyOpen(false)}
            />
          </div>
        ) : null}
      </div>
      {comment.replies.length > 0 ? (
        <ul className="ms-4 space-y-3 border-s border-border ps-4 sm:ms-6 sm:ps-5">
          {comment.replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} slug={slug} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ArticleComments({ slug }: { slug: string }) {
  const comments = useQuery(articleCommentsQuery(slug));
  const items = comments.data ?? [];
  const total = items.reduce((count, item) => count + 1 + item.replies.length, 0);

  return (
    <section>
      <div className="mb-5 flex w-full items-center justify-start gap-3 sm:mb-6">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/15" aria-hidden="true" />
        <h2 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
          نظرات
          {total > 0 ? <span className="ms-2 text-base font-medium text-muted-foreground">({faNum(total, 0)})</span> : null}
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl bg-card px-5 py-6 text-sm text-muted-foreground shadow-[0_2px_32px_-8px_rgba(0,0,0,0.06)]">
          هنوز نظری ثبت نشده است. اولین نظر را شما بنویسید.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <CommentCard key={item.id} comment={item} slug={slug} />
          ))}
        </ul>
      )}

      <div className="mt-6">
        <CommentForm slug={slug} submitLabel="ارسال نظر" />
      </div>
    </section>
  );
}
