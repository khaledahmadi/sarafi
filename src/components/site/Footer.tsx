import { Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-settings";
import { useLocale } from "@/i18n";
import { BrandMark } from "@/components/site/BrandMark";

export function Footer() {
  const { get } = useSiteSettings();
  const { t } = useLocale();
  const brandName = get("brand.name");

  return (
    <footer className="surface-navy mt-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="font-bold text-navy-foreground">{brandName}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-navy-foreground/70">{get("brand.description")}</p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-accent">{t("footer.quickAccess")}</h3>
          <div className="mt-4 flex flex-col gap-2.5 text-sm text-navy-foreground/75">
            <Link to="/rates">{t("footer.rates")}</Link>
            <Link to="/services">{t("footer.services")}</Link>
            <Link to="/branches">{t("footer.branches")}</Link>
            <Link to="/articles">{t("footer.articles")}</Link>
            <Link to="/faq">{t("footer.faq")}</Link>
            <Link to="/contact">{t("footer.contact")}</Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-accent">{t("footer.contactHeading")}</h3>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-navy-foreground/75">
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-accent" />
              <span dir="ltr">{get("contact.phone")}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-accent" />
              <span dir="ltr">{get("contact.email")}</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-accent" />
              <span>{get("contact.address")}</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4 text-accent" />
              <span>{get("contact.hours")}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-navy-foreground/50">
        © {new Date().getFullYear()} {brandName} — {t("footer.rights")}
      </div>
    </footer>
  );
}
