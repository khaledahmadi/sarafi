import { queryOptions, type QueryClient } from "@tanstack/react-query";
import {
  getArticle,
  listArticleComments,
  listArticles,
  listBranches,
  listFaqs,
  listPublicFeedback,
  listRates,
  listServices,
  listSettings,
} from "./public.functions";
import { DEFAULT_RATE_SOURCE, RATE_SOURCES, type RateSourceId } from "./rate-sources";

export const ratesQuery = (source: RateSourceId = DEFAULT_RATE_SOURCE) =>
  queryOptions({
    queryKey: ["rates", source],
    queryFn: () => listRates(source),
    staleTime: 30_000,
  });

export function prefetchRateSources(queryClient: QueryClient) {
  return Promise.all(RATE_SOURCES.map((market) => queryClient.ensureQueryData(ratesQuery(market.id))));
}

export const servicesQuery = queryOptions({
  queryKey: ["services"],
  queryFn: () => listServices(),
  staleTime: 5 * 60_000,
});

export const branchesQuery = queryOptions({
  queryKey: ["branches"],
  queryFn: () => listBranches(),
  staleTime: 5 * 60_000,
});

export const articlesQuery = queryOptions({
  queryKey: ["articles"],
  queryFn: () => listArticles(),
  staleTime: 5 * 60_000,
});

export const articleQuery = (slug: string) =>
  queryOptions({
    queryKey: ["article", slug],
    queryFn: () => getArticle({ data: { slug } }),
    staleTime: 5 * 60_000,
  });

export const articleCommentsQuery = (slug: string) =>
  queryOptions({
    queryKey: ["article-comments", slug],
    queryFn: () => listArticleComments({ data: { slug } }),
    staleTime: 60_000,
  });

export const settingsQuery = queryOptions({
  queryKey: ["site-settings"],
  queryFn: () => listSettings(),
  staleTime: 0,
});

export const faqsQuery = queryOptions({
  queryKey: ["faqs"],
  queryFn: () => listFaqs(),
  staleTime: 60_000,
});

export const publicFeedbackQuery = queryOptions({
  queryKey: ["public-feedback"],
  queryFn: () => listPublicFeedback(),
  staleTime: 30_000,
});
