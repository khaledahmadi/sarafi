import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";

import appCss from "../styles.css?url";
import { Header } from "../components/site/Header";
import { AppHeader } from "../components/site/AppHeader";
import { ContactWidgets } from "../components/site/ContactWidgets";
import { Footer } from "../components/site/Footer";
import { ManageShell } from "../components/site/ManageShell";
import { NavigationTopLoader } from "../components/navigation-top-loader";
import { settingsQuery } from "../lib/queries";
import { bootstrapAuth } from "../lib/api/auth";
import { getAuthSnapshot, markReactHydrated, subscribeAuth } from "../lib/api/auth-store";
import { useHasMounted } from "../hooks/use-has-mounted";
import { useSessionExpiry } from "../hooks/use-session-expiry";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-extrabold text-primary">۴۰۴</h1>
        <h2 className="mt-4 text-xl font-bold">صفحه پیدا نشد</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          صفحه‌ای که به دنبال آن هستید وجود ندارد یا منتقل شده است.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            بازگشت به خانه
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold">این صفحه بارگذاری نشد</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          مشکلی رخ داده است. می‌توانید مجدداً تلاش کنید یا به خانه بازگردید.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            تلاش مجدد
          </button>
          <a
            href="/"
            className="rounded-lg border border-input bg-background px-5 py-2.5 text-sm font-semibold"
          >
            خانه
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: ({ context }) => context.queryClient.fetchQuery(settingsQuery),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "صرافی سروری" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Sarwari Sarafi" },
      { property: "og:title", content: "Sarwari Sarafi" },
      { name: "twitter:title", content: "Sarwari Sarafi" },
      {
        name: "description",
        content:
          "Sarafi Digital Suite is a professional web application for managing and showcasing Sarafi services.",
      },
      {
        property: "og:description",
        content:
          "Sarafi Digital Suite is a professional web application for managing and showcasing Sarafi services.",
      },
      {
        name: "twitter:description",
        content:
          "Sarafi Digital Suite is a professional web application for managing and showcasing Sarafi services.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        <Analytics />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const mounted = useHasMounted();
  const isAppArea = pathname.startsWith("/dashboard");

  useLayoutEffect(() => {
    markReactHydrated();
  }, []);

  useEffect(() => {
    void bootstrapAuth();
    let previousUserId: string | null | undefined;
    return subscribeAuth(() => {
      const userId = getAuthSnapshot().user?.id ?? null;
      if (previousUserId === undefined) {
        previousUserId = userId;
        return;
      }
      if (previousUserId === userId) return;
      previousUserId = userId;
      void router.invalidate();
      if (userId) queryClient.invalidateQueries();
    });
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationTopLoader />
      <SessionExpiryWatcher />
      {isAppArea ? (
        <div className="flex min-h-screen flex-col bg-muted/30">
          <AppHeader />
          <main className="flex-1">
            <ManageShell>{mounted ? <Outlet /> : null}</ManageShell>
          </main>
        </div>
      ) : (
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
          {mounted ? <ContactWidgets /> : null}
        </div>
      )}
      {mounted ? <Toaster position="top-center" dir="rtl" richColors /> : null}
    </QueryClientProvider>
  );
}

function SessionExpiryWatcher() {
  useSessionExpiry();
  return null;
}
