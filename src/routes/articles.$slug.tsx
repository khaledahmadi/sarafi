import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { articleCommentsQuery, articleQuery, articlesQuery } from "@/lib/queries";
import { ArticleComments } from "@/components/site/ArticleComments";
import { ArticleShareBar } from "@/components/site/ArticleShareBar";
import { faDate, site } from "@/lib/site";

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
      return { meta: [{ title: "مقاله یافت نشد" }, { name: "robots", content: "noindex" }] };
    }
    const t = `${loaderData.article.title_fa} | ${site.name}`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.article.excerpt_fa },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.article.excerpt_fa },
      ],
    };
  },
  notFoundComponent: ArticleNotFound,
  component: ArticlePage,
});

function ArticleNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">این مقاله یافت نشد</h1>
      <Link to="/articles" className="mt-6 inline-block text-sm font-semibold text-primary">
        بازگشت به فهرست مقالات
      </Link>
    </div>
  );
}

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: article } = useSuspenseQuery(articleQuery(slug));
  const { data: articles } = useSuspenseQuery(articlesQuery);
  if (!article) return <ArticleNotFound />;

  const related = articles.filter((item) => item.slug !== article.slug).slice(0, 3);
  const hasRelated = related.length > 0;

  return (
    <div className="bg-muted/40">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:space-y-10 sm:py-10 lg:space-y-12 lg:py-12">
        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-10 xl:gap-12">
          <article
            className={`overflow-hidden rounded-3xl bg-card px-5 py-6 shadow-[0_2px_48px_-12px_rgba(0,0,0,0.08)] sm:px-7 sm:py-8 lg:px-8 lg:py-9 ${
              hasRelated ? "lg:col-span-8" : "lg:col-span-12"
            }`}
          >
            <h1 className="font-semibold tracking-tight text-foreground text-2xl sm:text-3xl md:text-[2.125rem] md:leading-[1.15] lg:text-[2.25rem]">
              {article.title_fa}
            </h1>

            <ArticleShareBar
              title={article.title_fa}
              path={`/articles/${article.slug}`}
              publishedAt={article.published_at}
              publishedAtLabel={faDate(article.published_at)}
            />

            {article.cover_url ? (
              <div className="mt-6 overflow-hidden rounded-2xl bg-muted sm:mt-8 sm:rounded-3xl">
                <img src={article.cover_url} alt={article.title_fa} className="w-full object-cover" />
              </div>
            ) : null}

            {article.body_fa.includes("<") ? (
              <div
                className="article-content mt-6 sm:mt-8"
                // Body HTML is sanitized with a strict allowlist on the server before saving.
                dangerouslySetInnerHTML={{ __html: article.body_fa }}
              />
            ) : (
              <div className="article-content mt-6 sm:mt-8">
                {article.body_fa.split("\n").map((paragraph, i) => (
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
                  مطالب مرتبط
                </h2>
              </div>
              <ul className="space-y-5">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to="/articles/$slug"
                      params={{ slug: item.slug }}
                      className="group block overflow-hidden rounded-2xl bg-neutral-950 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.22)] transition duration-300 hover:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.26)]"
                    >
                      {item.cover_url ? (
                        <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
                          <img
                            src={item.cover_url}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                      ) : null}
                      <div className="flex min-h-[5.5rem] flex-col bg-[#1c1c1e] px-4 pb-5 pt-4 transition-colors duration-300 group-hover:bg-[#242426] sm:min-h-[5.75rem] sm:px-5 sm:pb-6 sm:pt-5">
                        <p className="line-clamp-3 text-right text-[0.9375rem] font-medium leading-[1.45] tracking-[-0.015em] text-white sm:text-[0.96875rem]">
                          {item.title_fa}
                        </p>
                        <div className="mt-auto shrink-0 border-t border-white/10 pt-3.5 sm:pt-4">
                          <time
                            className="block w-full text-right text-[0.8125rem] leading-none text-white/50"
                            dateTime={item.published_at}
                          >
                            {faDate(item.published_at)}
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
