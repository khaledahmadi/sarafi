import { Link2, Printer } from "lucide-react";
import { toast } from "sonner";
import { useHasMounted } from "@/hooks/use-has-mounted";

type ArticleShareBarProps = {
  title: string;
  path: string;
  publishedAtLabel: string;
  publishedAt: string;
};

function shareHref(base: string, path: string) {
  return `${base}${path}`;
}

export function ArticleShareBar({
  title,
  path,
  publishedAtLabel,
  publishedAt,
}: ArticleShareBarProps) {
  const mounted = useHasMounted();
  const origin = mounted && typeof window !== "undefined" ? window.location.origin : "";
  const url = shareHref(origin, path);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("پیوند مقاله کپی شد");
    } catch {
      toast.error("کپی پیوند ممکن نشد");
    }
  }

  return (
    <div className="mt-6 pt-1 sm:mt-8">
      <div className="flex flex-row items-center justify-between gap-3" dir="ltr">
        <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="چاپ"
            onClick={() => window.print()}
          >
            <span className="sr-only">چاپ</span>
            <Printer className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="کپی پیوند"
            onClick={() => void copyLink()}
          >
            <span className="sr-only">کپی پیوند</span>
            <Link2 className="h-5 w-5" aria-hidden="true" />
          </button>
          <a
            href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="تلگرام"
          >
            <span className="sr-only">اشتراک در تلگرام</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.588.75.75 0 0 0 0-1.212A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </a>
          <a
            href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="واتساپ"
          >
            <span className="sr-only">اشتراک در واتساپ</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.488.216.29.292.642.196.973l-.788 2.848 3.146-1.18c.293-.11.614-.083.886.072A8.934 8.934 0 0012 20.25z"
              />
            </svg>
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="ایکس"
          >
            <span className="sr-only">اشتراک در ایکس</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.259 3.75H21l-7.405 8.455L21 20.25h-6.523l-5.094-5.94L5.906 20.25H3l7.914-9.02L3 3.75h6.649l4.6 5.344 5.01-5.344z"
              />
            </svg>
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="فیسبوک"
          >
            <span className="sr-only">اشتراک در فیسبوک</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.988h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
          </a>
        </div>
        <time className="text-sm text-muted-foreground" dateTime={publishedAt} dir="rtl">
          {publishedAtLabel}
        </time>
      </div>
    </div>
  );
}
