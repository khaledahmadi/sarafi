import { Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { faDate } from "@/lib/site";

export type BlogArticle = {
  slug: string;
  title_fa: string;
  excerpt_fa: string;
  cover_url: string | null;
  published_at: string;
};

export function ArticleBookmarkMeta({ publishedAt }: { publishedAt: string }) {
  return (
    <div className="mt-4 flex flex-row items-center justify-between gap-2 border-t border-border pt-3" dir="ltr">
      <span className="text-foreground/45" aria-hidden="true">
        <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} />
      </span>
      <time className="text-xs text-muted-foreground sm:text-sm" dateTime={publishedAt} dir="rtl">
        {faDate(publishedAt)}
      </time>
    </div>
  );
}

type ArticleCardProps = {
  slug: string;
  title: string;
  excerpt?: string;
  coverUrl: string | null;
  publishedAt: string;
  heading?: "h2" | "h3";
};

export function ArticleCard({
  slug,
  title,
  excerpt,
  coverUrl,
  publishedAt,
  heading: Heading = "h2",
}: ArticleCardProps) {
  return (
    <Link
      to="/articles/$slug"
      params={{ slug }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="aspect-[5/3] w-full overflow-hidden bg-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Heading className="text-[15px] font-semibold leading-snug text-foreground transition group-hover:text-primary sm:text-base">
          {title}
        </Heading>
        {excerpt ? (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
        ) : (
          <div className="flex-1" />
        )}
        <ArticleBookmarkMeta publishedAt={publishedAt} />
      </div>
    </Link>
  );
}
