import heroNavy from "@/assets/hero-navy.jpg";

/**
 * Hero background variants.
 *
 * `default` matches the main-page hero exactly. To customise a page, pass
 * `variant="..."` to <PageHero /> — or override single pieces inline with the
 * `image`, `imageClassName`, `overlayClassName` or `pattern` props.
 *
 * To add a new look, add one entry here; no component changes needed.
 */
export type HeroVariantName = "default" | "soft" | "spotlight" | "deep" | "plain";

export type HeroVariant = {
  /** background image URL (omit for image-free heroes) */
  image?: string;
  /** classes applied to the <section> (base surface) */
  sectionClassName: string;
  /** classes applied to the background <img> */
  imageClassName: string;
  /** extra gradient/tint layer above the image */
  overlayClassName?: string;
  /** show the decorative wave pattern */
  pattern?: boolean;
};

export const heroVariants: Record<HeroVariantName, HeroVariant> = {
  // Same as the main page: navy surface + hero photo at 45% + wave pattern.
  default: {
    image: heroNavy,
    sectionClassName: "surface-navy",
    imageClassName: "opacity-45",
    pattern: true,
  },
  // Lighter, calmer image for content-heavy pages.
  soft: {
    image: heroNavy,
    sectionClassName: "surface-navy",
    imageClassName: "opacity-25",
    overlayClassName: "bg-gradient-to-b from-transparent to-navy/70",
    pattern: true,
  },
  // Gold-tinted radial focus, good for landing/CTA pages.
  spotlight: {
    image: heroNavy,
    sectionClassName: "surface-navy",
    imageClassName: "opacity-40",
    overlayClassName:
      "bg-[radial-gradient(circle_at_50%_20%,color-mix(in_oklab,var(--accent)_28%,transparent),transparent_65%)]",
    pattern: true,
  },
  // Darker, more serious tone (auth, legal, dashboards).
  deep: {
    image: heroNavy,
    sectionClassName: "surface-navy",
    imageClassName: "opacity-20",
    overlayClassName: "bg-navy/60",
  },
  // No photo at all — flat brand surface with the wave pattern.
  plain: {
    sectionClassName: "surface-navy",
    imageClassName: "",
    pattern: true,
  },
};
