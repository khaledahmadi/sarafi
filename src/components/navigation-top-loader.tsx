import { useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { NProgress } from "@/lib/nprogress";

/**
 * Shows the same top bar on hard refresh / first visit (Minimals-style).
 * Client navigations are started by the TanStack Router bridge.
 */
function NavigationTopLoaderInitialLoad() {
  useEffect(() => {
    NProgress.start();
  }, []);

  return null;
}

/**
 * Ensures the loader completes on TanStack Router navigations,
 * including search-only updates and initial page load.
 */
function NavigationTopLoaderRouteSync() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });

  useEffect(() => {
    const complete = () => {
      NProgress.done();
    };

    if (document.readyState === "complete") {
      requestAnimationFrame(() => {
        requestAnimationFrame(complete);
      });
      return;
    }

    window.addEventListener("load", complete, { once: true });
    return () => {
      window.removeEventListener("load", complete);
    };
  }, [pathname, search]);

  return null;
}

function NavigationTopLoaderRouterBridge() {
  const router = useRouter();

  useEffect(() => {
    const stopStart = router.subscribe("onBeforeLoad", (event) => {
      if (event.pathChanged || event.hrefChanged) {
        NProgress.start();
      }
    });
    const stopDone = router.subscribe("onResolved", () => {
      NProgress.done();
    });
    return () => {
      stopStart();
      stopDone();
    };
  }, [router]);

  return null;
}

export function NavigationTopLoader() {
  return (
    <>
      <NavigationTopLoaderRouterBridge />
      <NavigationTopLoaderInitialLoad />
      <NavigationTopLoaderRouteSync />
    </>
  );
}
