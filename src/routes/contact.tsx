import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/site/Sections";
import { TextAreaField, TextField } from "@/components/site/Field";
import { validateContactMessage } from "@/lib/contact.functions";
import { contactSchema, fieldErrorMap, resolveValidationMessage, translateFieldErrors } from "@/lib/validation";
import { settingsQuery } from "@/lib/queries";
import { useSiteSettings } from "@/hooks/use-settings";
import { useLocale } from "@/i18n";
import { pageMeta, resolvePageLocale } from "@/i18n/meta";

export const Route = createFileRoute("/contact")({
  loader: async ({ context }) => {
    const locale = await resolvePageLocale();
    await context.queryClient.ensureQueryData(settingsQuery);
    return { locale };
  },
  head: ({ loaderData }) =>
    pageMeta(loaderData?.locale ?? "fa", "meta.contactTitle", "meta.contactDescription"),
  component: ContactPage,
});

function ContactPage() {
  const { get } = useSiteSettings();
  const { t, dir } = useLocale();
  const phone = get("contact.phone");
  const whatsapp = get("contact.whatsapp").replace(/[^\d]/g, "");
  const email = get("contact.email");
  const address = get("contact.address");
  const hours = get("contact.hours");
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const local = contactSchema.safeParse(form);
    if (!local.success) {
      setErrors(fieldErrorMap(local.error, t));
      toast.error(t("contact.formInvalid"));
      return;
    }
    setBusy(true);
    try {
      const result = await validateContactMessage({ data: form });
      if (!result.ok) {
        setErrors(translateFieldErrors(result.fieldErrors, t));
        toast.error(resolveValidationMessage(result.message ?? "validation.formInvalid", t));
        return;
      }
      setErrors({});
      window.open(
        `https://wa.me/${whatsapp}?text=${encodeURIComponent(result.data.text)}`,
        "_blank",
        "noopener",
      );
      toast.success(t("contact.whatsappReady"));
    } finally {
      setBusy(false);
    }
  }

  const cards = [
    { icon: Phone, label: t("common.phone"), value: phone, href: `tel:${phone}`, valueDir: "ltr" as const },
    {
      icon: MessageCircle,
      label: t("contact.whatsapp"),
      value: phone,
      href: `https://wa.me/${whatsapp}`,
      valueDir: "ltr" as const,
    },
    { icon: Mail, label: t("common.email"), value: email, href: `mailto:${email}`, valueDir: "ltr" as const },
    { icon: MapPin, label: t("common.address"), value: address, valueDir: dir },
    { icon: Clock, label: t("common.hours"), value: hours, valueDir: dir },
  ];

  return (
    <>
      <PageHero
        variant="deep"
        eyebrow={t("contact.eyebrow")}
        title={t("contact.heroTitle")}
        description={get("contact.hero_description")}
      />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {cards.map((item) => (
            <div key={item.label} className="flex items-start gap-4 p-5 card-elevated">
              <span className="icon-tile size-10 shrink-0 rounded-xl">
                <item.icon className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="text-sm font-semibold" dir={item.valueDir}>
                    {item.value}
                  </a>
                ) : (
                  <p className="text-sm font-semibold leading-7">{item.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="p-7 card-elevated">
          <h2 className="text-lg font-bold">{t("contact.quickMessage")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("contact.quickMessageHint")}</p>
          <div className="mt-6 space-y-4">
            <TextField
              label={t("contact.fullName")}
              maxLength={100}
              value={form.name}
              error={errors["name"]}
              onChange={(e) => update("name", e.target.value)}
            />
            <TextField
              label={t("contact.phoneLabel")}
              inputMode="tel"
              maxLength={24}
              value={form.phone}
              error={errors["phone"]}
              onChange={(e) => update("phone", e.target.value)}
            />
            <TextAreaField
              label={t("contact.message")}
              className="min-h-32 resize-y"
              maxLength={1000}
              value={form.message}
              error={errors["message"]}
              onChange={(e) => update("message", e.target.value)}
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy ? t("contact.checking") : t("contact.send")}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
