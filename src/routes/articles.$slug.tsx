import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { articleCommentsQuery, articleQuery, articlesQuery } from "@/lib/queries";
import { ArticleComments } from "@/components/site/ArticleComments";
import { ArticleShareBar } from "@/components/site/ArticleShareBar";
import { pickLocalized, useLocale } from "@/i18n";
import { site } from "@/lib/site";

export const Route = createFileRoute("/articles/$slug")({
  loader: async ({ context, params }) => {
    const article = await context.queryClient.ensureQueryData(articleQuery(params.slug));
    if (!article) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData(articlesQuery),
      context.queryClient.ensureQueryData(articleCommentsQuery(params.slug)),
    ]);
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Article not found" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.article.title_fa} | ${site.name}`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.article.excerpt_fa },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.article.excerpt_fa },
      ],
    };
  },
  notFoundComponent: ArticleNotFound,
  component: ArticlePage,
});

function ArticleNotFound() {
  const { t } = useLocale();
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">{t("articles.notFound")}</h1>
      <Link to="/articles" className="mt-6 inline-block text-sm font-semibold text-primary">
        {t("articles.backToList")}
      </Link>
    </div>
  );
}

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: article } = useSuspenseQuery(articleQuery(slug));
  const { data: articles } = useSuspenseQuery(articlesQuery);
  const { locale, t, d } = useLocale();
  if (!article) return <ArticleNotFound />;

  const title = pickLocalized(article, "title", locale);
  const body = pickLocalized(article, "body", locale) || article.body_fa;
  const related = articles.filter((item) => item.slug !== article.slug).slice(0, 3);
  const hasRelated = related.length > 0;

  return (
    <div className="bg-muted/40">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:space-y-10 sm:py-10 lg:space-y-12 lg:py-12">
        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-10 xl:gap-12">
          <article
            className={`overflow-hidden rounded-3xl border border-border bg-card px-5 py-6 shadow-[var(--shadow-card)] sm:px-7 sm:py-8 lg:px-8 lg:py-9 ${
              hasRelated ? "lg:col-span-8" : "lg:col-span-12"
            }`}
          >
            <h1 className="font-semibold tracking-tight text-foreground text-2xl sm:text-3xl md:text-[2.125rem] md:leading-[1.15] lg:text-[2.25rem]">
              {title}
            </h1>

            <ArticleShareBar
              title={title}
              path={`/articles/${article.slug}`}
              publishedAt={article.published_at}
              publishedAtLabel={d(article.published_at)}
            />

            {article.cover_url ? (
              <div className="mt-6 overflow-hidden rounded-2xl bg-muted sm:mt-8 sm:rounded-3xl">
                <img src={article.cover_url} alt={title} className="w-full object-cover" />
              </div>
            ) : null}

            {body.includes("<") ? (
              <div
                className="article-content mt-6 sm:mt-8"
                // Body HTML is sanitized with a strict allowlist on the server before saving.
                dangerouslySetInnerHTML={{ __html: body }}
              />
            ) : (
              <div className="article-content mt-6 sm:mt-8">
                {body.split("\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            )}
          </article>

          {hasRelated ? (
            <aside className="mt-8 rounded-3xl bg-muted/70 p-5 sm:p-6 lg:col-span-4 lg:mt-0 lg:sticky lg:top-28">
              <div className="mb-5 flex w-full items-center gap-3 border-b border-border pb-4 sm:mb-6">
                <span className="h-7 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <h2 className="text-lg font-semibold leading-tight tracking-tight sm:text-xl">
                  {t("articles.related")}
                </h2>
              </div>
              <ul className="space-y-5">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to="/articles/$slug"
                      params={{ slug: item.slug }}
                      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition duration-300 hover:shadow-[var(--shadow-raised)]"
                    >
                      {item.cover_url ? (
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                          <img
                            src={item.cover_url}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                      ) : null}
                      <div className="flex min-h-[5.5rem] flex-col bg-card px-4 pb-5 pt-4 transition-colors duration-300 group-hover:bg-muted/40 sm:min-h-[5.75rem] sm:px-5 sm:pb-6 sm:pt-5">
                        <p className="line-clamp-3 text-start text-[0.9375rem] font-medium leading-[1.45] tracking-[-0.015em] text-card-foreground sm:text-[0.96875rem]">
                          {pickLocalized(item, "title", locale)}
                        </p>
                        <div className="mt-auto shrink-0 border-t border-border pt-3.5 sm:pt-4">
                          <time
                            className="block w-full text-start text-[0.8125rem] leading-none text-muted-foreground"
                            dateTime={item.published_at}
                          >
                            {d(item.published_at)}
                          </time>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>

        <ArticleComments slug={article.slug} />
      </div>
    </div>
  );
}
