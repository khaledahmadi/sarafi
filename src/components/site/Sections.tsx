import type { ReactNode } from "react";
import { heroVariants, type HeroVariantName } from "@/lib/hero";

export function PageHero({
  eyebrow,
  title,
  description,
  variant = "default",
  image,
  imageClassName,
  overlayClassName,
  pattern,
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  /** pick a preset background look; defaults to the main-page style */
  variant?: HeroVariantName;
  /** per-page overrides on top of the preset */
  image?: string;
  imageClassName?: string;
  overlayClassName?: string;
  pattern?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const preset = heroVariants[variant] ?? heroVariants.default;
  const bgImage = image ?? preset.image;
  const showPattern = pattern ?? preset.pattern ?? false;
  const overlay = overlayClassName ?? preset.overlayClassName;

  return (
    <section
      className={`relative isolate overflow-hidden ${preset.sectionClassName} ${className ?? ""}`}
    >
      {bgImage && (
        <img
          src={bgImage}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1088}
          className={`absolute inset-0 size-full object-cover ${
            imageClassName ?? preset.imageClassName
          }`}
        />
      )}
      {overlay && <div className={`absolute inset-0 ${overlay}`} aria-hidden="true" />}
      {showPattern && <div className="absolute inset-0 wave-pattern" aria-hidden="true" />}
      <div className="relative mx-auto max-w-6xl px-4 py-16 text-center md:py-20">
        {eyebrow && (
          <p className="mb-3 text-sm font-semibold tracking-wide text-accent">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-extrabold text-navy-foreground md:text-4xl">{title}</h1>
        {description && (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-navy-foreground/80 md:text-base">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}


export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 text-sm font-semibold text-accent">{eyebrow}</p>}
        <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
        <div className="gold-rule mt-3" />
        {description && (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
