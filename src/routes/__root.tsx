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
import { SpeedInsights } from "@vercel/speed-insights/react";

import appCss from "../styles.css?url";
import { FONT_STYLESHEET_URL } from "../lib/fonts";
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
import { RateSourceProvider } from "../hooks/use-rate-source";
import { useSessionExpiry } from "../hooks/use-session-expiry";
import { getRequestRateSource } from "../lib/get-request-rate-source";
import {
  LocaleProvider,
  LOCALE_BOOTSTRAP_SCRIPT,
  translate,
  useLocale,
} from "@/i18n";
import { getRequestLocale } from "@/i18n/get-request-locale";
import {
  ThemeProvider,
  THEME_BOOTSTRAP_SCRIPT,
  useTheme,
} from "@/theme";
import { getRequestTheme } from "@/theme/get-request-theme";

function NotFoundComponent() {
  const { t } = useLocale();
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-extrabold text-primary">{t("errors.notFoundCode")}</h1>
        <h2 className="mt-4 text-xl font-bold">{t("errors.notFoundTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("errors.notFoundBody")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {t("common.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useLocale();

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold">{t("errors.pageFailedTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("errors.pageFailedBody")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {t("common.retry")}
          </button>
          <a
            href="/"
            className="rounded-lg border border-input bg-background px-5 py-2.5 text-sm font-semibold"
          >
            {t("common.home")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async ({ context }) => {
    const [, locale, rateSource, theme] = await Promise.all([
      context.queryClient.fetchQuery(settingsQuery),
      getRequestLocale(),
      getRequestRateSource(),
      getRequestTheme(),
    ]);
    return { locale, rateSource, theme };
  },
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        name: "author",
        content: translate(loaderData?.locale ?? "fa", "meta.author"),
      },
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
        href: FONT_STYLESHEET_URL,
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
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOTSTRAP_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="min-h-svh bg-background font-sans text-foreground antialiased" suppressHydrationWarning>
        {children}
        <Scripts />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { locale, rateSource, theme } = Route.useLoaderData();
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
      <LocaleProvider initialLocale={locale}>
        <ThemeProvider initialTheme={theme}>
          <DocumentLocaleSync />
          <RateSourceProvider initialSource={rateSource}>
            <NavigationTopLoader />
            <SessionExpiryWatcher />
            {isAppArea ? (
              <div className="flex min-h-screen flex-col bg-background">
                <AppHeader />
                <main className="flex-1 bg-muted/30">
                  <ManageShell>{mounted ? <Outlet /> : null}</ManageShell>
                </main>
              </div>
            ) : (
              <div className="flex min-h-screen flex-col bg-background">
                <Header />
                <main className="flex-1">
                  <Outlet />
                </main>
                <Footer />
                {mounted ? <ContactWidgets /> : null}
              </div>
            )}
            <LocaleToaster mounted={mounted} />
          </RateSourceProvider>
        </ThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

/** Keep <html lang/dir> aligned after hydrate (shell defaults to fa + bootstrap script). */
function DocumentLocaleSync() {
  const { locale, dir } = useLocale();
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.documentElement.dataset["locale"] = locale;
  }, [locale, dir]);
  return null;
}

function LocaleToaster({ mounted }: { mounted: boolean }) {
  const { dir } = useLocale();
  const { resolvedTheme } = useTheme();
  if (!mounted) return null;
  return <Toaster position="top-center" dir={dir} theme={resolvedTheme} richColors />;
}

function SessionExpiryWatcher() {
  useSessionExpiry();
  return null;
}
