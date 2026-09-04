import { Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { ArticleBookmarkMeta, type BlogArticle } from "@/components/site/ArticleCard";
import { pickLocalized, useLocale } from "@/i18n";

export function ArticleSectionHeading({ children }: { children: string }) {
  return (
    <div className="mb-4 flex w-full items-center justify-start gap-3 border-b border-dashed border-border pb-3 sm:mb-5">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/15" aria-hidden="true" />
      <h2 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">{children}</h2>
    </div>
  );
}

export function ArticleHero({ article }: { article: BlogArticle }) {
  const { locale, d } = useLocale();
  const title = pickLocalized(article as BlogArticle & { title_en?: string; title_ps?: string }, "title", locale);
  const excerpt = pickLocalized(article as BlogArticle & { excerpt_en?: string; excerpt_ps?: string }, "excerpt", locale);
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <Link
        to="/articles/$slug"
        params={{ slug: article.slug }}
        className="group grid min-h-[min(22rem,70vw)] grid-cols-1 md:min-h-[18rem] md:grid-cols-2"
        dir="ltr"
      >
        <div className="flex flex-col justify-between p-5 sm:p-6 lg:p-7" dir="rtl">
          <div>
            <h2 className="text-2xl font-semibold leading-[1.15] tracking-tight sm:text-3xl md:text-[2.125rem] md:leading-[1.12] lg:text-4xl">
              {title}
            </h2>
            {excerpt ? (
              <p className="mt-4 line-clamp-5 text-base leading-relaxed text-muted-foreground">
                {excerpt}
              </p>
            ) : null}
          </div>
          <div className="mt-6 flex flex-row items-center justify-between gap-3 border-t border-border pt-4" dir="ltr">
            <span className="text-foreground/50" aria-hidden="true">
              <Bookmark className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <time className="text-sm text-muted-foreground" dateTime={article.published_at} dir="rtl">
              {d(article.published_at)}
            </time>
          </div>
        </div>
        <div className="relative min-h-[14rem] bg-muted md:min-h-0 md:rounded-e-2xl">
          {article.cover_url ? (
            <img
              src={article.cover_url}
              alt=""
              className="h-full min-h-[14rem] w-full object-cover transition duration-500 group-hover:opacity-95 md:absolute md:inset-0 md:min-h-full"
            />
          ) : null}
        </div>
      </Link>
    </article>
  );
}

export function ArticleLatestRail({ articles }: { articles: BlogArticle[] }) {
  const { locale, t, d } = useLocale();
  if (articles.length === 0) return null;

  return (
    <div className="h-full overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="px-5 pt-4 sm:pt-5">
        <div className="mb-3 border-b border-dashed border-border pb-3">
          <h2 className="text-base font-semibold leading-tight tracking-tight sm:text-lg">{t("articles.latest")}</h2>
        </div>
      </div>
      <ul className="divide-y divide-border">
        {articles.map((item) => (
          <li key={item.slug}>
            <Link
              to="/articles/$slug"
              params={{ slug: item.slug }}
              className="group flex gap-3 px-4 py-3 transition hover:bg-muted/80 sm:px-5 sm:py-3.5"
            >
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-[4.5rem] sm:w-[6.75rem]">
                {item.cover_url ? (
                  <img src={item.cover_url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold leading-snug text-foreground transition group-hover:text-primary sm:text-base">
                  {pickLocalized(item as BlogArticle & { title_en?: string; title_ps?: string }, "title", locale)}
                </span>
                <time className="mt-1 block text-xs text-muted-foreground" dateTime={item.published_at}>
                  {d(item.published_at)}
                </time>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ArticleFourUp({ articles }: { articles: BlogArticle[] }) {
  const { locale } = useLocale();
  if (articles.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-4 lg:divide-x lg:divide-y-0 lg:divide-x-reverse">
        {articles.map((item) => {
          const title = pickLocalized(
            item as BlogArticle & { title_en?: string; title_ps?: string },
            "title",
            locale,
          );
          const excerpt = pickLocalized(
            item as BlogArticle & { excerpt_en?: string; excerpt_ps?: string },
            "excerpt",
            locale,
          );
          return (
          <Link
            key={item.slug}
            to="/articles/$slug"
            params={{ slug: item.slug }}
            className="group flex flex-col bg-card px-4 py-5 transition-colors hover:bg-muted/80 sm:px-5 sm:py-6"
          >
            <div className="aspect-[5/3] w-full overflow-hidden rounded-lg bg-muted">
              {item.cover_url ? (
                <img
                  src={item.cover_url}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              ) : null}
            </div>
            <div className="flex min-h-0 flex-1 flex-col pt-4">
              <h3 className="text-base font-semibold leading-snug text-foreground transition group-hover:text-primary">
                {title}
              </h3>
              {excerpt ? (
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
              ) : null}
            </div>
            <ArticleBookmarkMeta publishedAt={item.published_at} />
          </Link>
          );
        })}
      </div>
    </div>
  );
}
