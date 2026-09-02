import { useLocale } from "@/i18n";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  /** Tailwind size token — width and height stay equal (e.g. size-10 → 2.5rem × 2.5rem). */
  size?: "size-9" | "size-10";
  className?: string;
};

export function BrandMark({ size = "size-10", className }: BrandMarkProps) {
  const { t } = useLocale();
  const letterSize = size === "size-9" ? "text-sm" : "text-base";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid aspect-square shrink-0 flex-none place-items-center rounded-xl bg-accent",
        size,
        className,
      )}
    >
      <span className={cn("block font-extrabold leading-none text-accent-foreground", letterSize)}>
        {t("common.brandMark")}
      </span>
    </span>
  );
}
