import { queryOptions } from "@tanstack/react-query";
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

export const ratesQuery = queryOptions({
  queryKey: ["rates"],
  queryFn: () => listRates(),
  staleTime: 60_000,
});

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
