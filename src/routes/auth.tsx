import heroImage from "@/assets/hero-navy.jpg";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { homePathForUser, login, signup } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/hooks/use-session";
import { errorClass, fieldClass, fieldWithError, labelClass } from "@/lib/forms";
import { emailSchema, friendlyError, passwordSchema } from "@/lib/validation";
import { isTrustedDevice, setTrustedDevice } from "@/lib/trusted-device";
import { useLocale } from "@/i18n";
import { pageMeta, resolvePageLocale } from "@/i18n/meta";

export const Route = createFileRoute("/auth")({
  loader: async () => ({ locale: await resolvePageLocale() }),
  head: ({ loaderData }) => {
    const base = pageMeta(
      loaderData?.locale ?? "fa",
      "meta.authTitle",
      "meta.authDescription",
    );
    return {
      ...base,
      meta: [...base.meta, { name: "robots", content: "noindex" }],
    };
  },
  ssr: false,
  component: AuthPage,
});

const signInSchema = z.object({ email: emailSchema, password: passwordSchema });

const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(3, "Enter your full name").max(100),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(24),
});

type FieldErrors = Partial<Record<"email" | "password" | "fullName" | "phone", string>>;

function collectErrors(error: z.ZodError) {
  const map: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "") as keyof FieldErrors;
    if (key && !map[key]) map[key] = issue.message;
  }
  return map;
}

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const { user, ready } = useSession();
  const navigate = useNavigate();
  const { t } = useLocale();

  useEffect(() => {
    setRemember(isTrustedDevice());
  }, []);

  useEffect(() => {
    if (ready && user) navigate({ to: homePathForUser(user), replace: true });
  }, [ready, user, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setTrustedDevice(remember);
    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse(form);
        if (!parsed.success) {
          setErrors(collectErrors(parsed.error));
          toast.error(t("auth.formInvalid"));
          return;
        }
        setErrors({});
        const result = await signup({
          email: parsed.data.email,
          password: parsed.data.password,
          full_name: parsed.data.fullName,
          phone: parsed.data.phone,
        });
        if ("id" in result) {
          navigate({ to: homePathForUser(result) });
          return;
        }
        const message = friendlyError(result.message);
        setErrors({
          email: result.fieldErrors?.["email"] ?? message,
          ...(result.fieldErrors ?? {}),
        });
        toast.error(message);
      } else {
        const parsed = signInSchema.safeParse(form);
        if (!parsed.success) {
          setErrors(collectErrors(parsed.error));
          toast.error(t("auth.formInvalid"));
          return;
        }
        setErrors({});
        try {
          const user = await login(parsed.data.email, parsed.data.password);
          navigate({ to: homePathForUser(user) });
        } catch (error) {
          const message =
            error instanceof ApiError ? t("auth.badCredentials") : friendlyError(undefined);
          setErrors({ password: message });
          toast.error(message);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  function update(key: keyof typeof form, value: string) {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  }

  return (
    <div className="relative isolate overflow-hidden surface-navy">
      <img
        src={heroImage}
        alt=""
        aria-hidden="true"
        width={1920}
        height={1088}
        className="absolute inset-0 size-full object-cover opacity-40"
      />
      <div className="absolute inset-0 wave-pattern" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-md flex-col justify-center px-4 py-16">
        <div className="rounded-2xl bg-card p-7 text-card-foreground shadow-lg">
          <h1 className="text-xl font-extrabold">
            {mode === "signin" ? t("auth.signInHeading") : t("auth.signUpHeading")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("auth.subtitle")}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className={labelClass} htmlFor="fullName">
                    {t("auth.fullNameLabel")}
                  </label>
                  <input
                    id="fullName"
                    className={fieldWithError(fieldClass, errors.fullName)}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? "fullName-error" : undefined}
                    value={form.fullName}
                    maxLength={100}
                    onChange={(e) => update("fullName", e.target.value)}
                  />
                  {errors.fullName && (
                    <span id="fullName-error" className={errorClass} role="alert">
                      {errors.fullName}
                    </span>
                  )}
                </div>
                <div>
                  <label className={labelClass} htmlFor="phone">
                    {t("auth.phone")}
                  </label>
                  <input
                    id="phone"
                    className={fieldWithError(fieldClass, errors.phone)}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                    value={form.phone}
                    maxLength={24}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                  {errors.phone && (
                    <span id="phone-error" className={errorClass} role="alert">
                      {errors.phone}
                    </span>
                  )}
                </div>
              </>
            )}
            <div>
              <label className={labelClass} htmlFor="email">
                {t("auth.email")}
              </label>
              <input
                id="email"
                className={fieldWithError(fieldClass, errors.email)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                type="email"
                autoComplete="email"
                value={form.email}
                maxLength={255}
                onChange={(e) => update("email", e.target.value)}
              />
              {errors.email && (
                <span id="email-error" className={errorClass} role="alert">
                  {errors.email}
                </span>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="password">
                {t("auth.password")}
              </label>
              <input
                id="password"
                className={fieldWithError(fieldClass, errors.password)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={form.password}
                maxLength={72}
                onChange={(e) => update("password", e.target.value)}
              />
              {errors.password ? (
                <span id="password-error" className={errorClass} role="alert">
                  {errors.password}
                </span>
              ) : (
                mode === "signup" && (
                  <span className="form-hint mt-1 block">{t("auth.passwordHint")}</span>
                )
              )}
            </div>
            <label className="flex items-start gap-2.5 rounded-xl border border-input bg-muted/40 px-3 py-2.5">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="mt-0.5 size-4 accent-primary"
              />
              <span className="text-xs leading-5">
                <span className="block font-semibold text-foreground">{t("auth.rememberTitle")}</span>
                <span className="form-hint block">{t("auth.rememberHint")}</span>
              </span>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {mode === "signin" ? t("auth.signInCta") : t("auth.signUpTab")}
            </button>
          </form>

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setErrors({});
            }}
            className="mt-5 w-full text-sm text-primary"
          >
            {mode === "signin" ? t("auth.switchToSignUp") : t("auth.switchToSignIn")}
          </button>
        </div>

        <Link to="/" className="mt-6 text-center text-sm text-navy-foreground/70">
          {t("auth.backHome")}
        </Link>
      </div>
    </div>
  );
}
