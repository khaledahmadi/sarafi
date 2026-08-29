import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { articlesQuery, settingsQuery } from "@/lib/queries";
import { ArticleCard } from "@/components/site/ArticleCard";
import {
  ArticleFourUp,
  ArticleHero,
  ArticleLatestRail,
  ArticleSectionHeading,
} from "@/components/site/ArticleBlog";
import { PageHero } from "@/components/site/Sections";
import { useSiteSettings } from "@/hooks/use-settings";
import { site } from "@/lib/site";

const title = `وبلاگ و مقالات آموزشی | ${site.name}`;
const description =
  "مقالات آموزشی درباره حواله یوان، شارژ علی‌پی، وی‌چت‌پی و تحلیل نرخ برابری اسعار.";

export const Route = createFileRoute("/articles/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(articlesQuery),
      context.queryClient.ensureQueryData(settingsQuery),
    ]);
  },
  component: ArticlesPage,
});

function ArticlesPage() {
  const { data: articles } = useSuspenseQuery(articlesQuery);
  const { get } = useSiteSettings();
  const hero = articles[0];
  const teasers = articles.slice(1, 4);
  const latest = articles.slice(4, 9);
  const moreRows: typeof articles[] = [];
  for (let i = 9; i < articles.length; i += 4) {
    moreRows.push(articles.slice(i, i + 4));
  }

  return (
    <>
      <PageHero
        variant="soft"
        eyebrow="وبلاگ"
        title={get("home.articles_title", "راهنما و اخبار بازار ارز")}
        description={description}
      />
      <div className="bg-muted/30">
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:space-y-5 sm:px-5 sm:py-5 lg:space-y-7 lg:px-6 lg:py-6">
        <div className="flex w-full items-center justify-start gap-3 border-b border-dashed border-border pb-3">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/15" aria-hidden="true" />
          <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-[2rem]">
            مقالات و راهنماها
          </h2>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-muted-foreground shadow-sm">
            مقاله‌ای منتشر نشده است.
          </div>
        ) : (
          <>
            <section className="grid gap-5 lg:grid-cols-12 lg:gap-8">
              {hero ? (
                <div className={`flex flex-col ${latest.length > 0 ? "lg:col-span-8" : "lg:col-span-12"}`}>
                  <ArticleHero article={hero} />
                  {teasers.length > 0 ? (
                    <div className="mt-5 border-t border-dashed border-border pt-5">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                        {teasers.map((article) => (
                          <ArticleCard
                            key={article.slug}
                            slug={article.slug}
                            title={article.title_fa}
                            excerpt={article.excerpt_fa}
                            coverUrl={article.cover_url}
                            publishedAt={article.published_at}
                            heading="h3"
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {latest.length > 0 ? (
                <aside className="lg:col-span-4">
                  <ArticleLatestRail articles={latest} />
                </aside>
              ) : null}
            </section>

            {moreRows.map((row, index) => (
              <section key={row[0]?.slug ?? index}>
                {index === 0 ? <ArticleSectionHeading>سایر مقالات</ArticleSectionHeading> : null}
                <ArticleFourUp articles={row} />
              </section>
            ))}
          </>
        )}
        </div>
      </div>
    </>
  );
}
