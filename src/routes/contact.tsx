import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/site/Sections";
import { TextAreaField, TextField } from "@/components/site/Field";
import { validateContactMessage } from "@/lib/contact.functions";
import { contactSchema, fieldErrorMap } from "@/lib/validation";
import { settingsQuery } from "@/lib/queries";
import { site } from "@/lib/site";
import { useSiteSettings } from "@/hooks/use-settings";

const title = `تماس با ${site.name}`;
const description =
  "شماره تماس، واتس‌اپ، ایمیل و نشانی دفتر مرکزی برای دریافت نرخ حواله و مشاوره.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: ContactPage,
});

function ContactPage() {
  const { get } = useSiteSettings();
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
      setErrors(fieldErrorMap(local.error));
      toast.error("اطلاعات فرم را بررسی کنید");
      return;
    }
    setBusy(true);
    try {
      const result = await validateContactMessage({ data: form });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }
      setErrors({});
      window.open(
        `https://wa.me/${whatsapp}?text=${encodeURIComponent(result.data.text)}`,
        "_blank",
        "noopener",
      );
      toast.success("پیام شما در واتس‌اپ آماده ارسال است");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHero
        variant="deep"
        eyebrow="تماس"
        title="با ما در ارتباط باشید"
        description={get("contact.hero_description")}
      />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {[
            { icon: Phone, label: "تلفن", value: phone, href: `tel:${phone}` },
            {
              icon: MessageCircle,
              label: "واتس‌اپ",
              value: phone,
              href: `https://wa.me/${whatsapp}`,
            },
            { icon: Mail, label: "ایمیل", value: email, href: `mailto:${email}` },
            { icon: MapPin, label: "نشانی", value: address },
            { icon: Clock, label: "ساعات کاری", value: hours },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-4 p-5 card-elevated">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-accent">
                <item.icon className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                {item.href ? (
                  <a
                    href={item.href}
                    className="text-sm font-semibold"
                    dir={item.label === "نشانی" || item.label === "ساعات کاری" ? "rtl" : "ltr"}
                  >
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
          <h2 className="text-lg font-bold">ارسال پیام سریع</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            پیام شما از طریق واتس‌اپ به کارشناسان ما ارسال می‌شود.
          </p>
          <div className="mt-6 space-y-4">
            <TextField
              label="نام و تخلص"
              maxLength={100}
              value={form.name}
              error={errors["name"]}
              onChange={(e) => update("name", e.target.value)}
            />
            <TextField
              label="شماره تماس"
              inputMode="tel"
              maxLength={24}
              value={form.phone}
              error={errors["phone"]}
              onChange={(e) => update("phone", e.target.value)}
            />
            <TextAreaField
              label="پیام"
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
              {busy ? "در حال بررسی…" : "ارسال پیام"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
