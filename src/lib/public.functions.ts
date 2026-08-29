import { apiAction, apiRequest } from "@/lib/api/client";
import type { ActionResult } from "@/lib/validation";

type DataArg<T> = { data: T };

export async function listRates() {
  const rows = await apiRequest<
    Array<{
      code: string;
      name_fa: string;
      flag: string | null;
      buy_rate: number | string;
      sell_rate: number | string;
      updated_at: string;
    }>
  >("/api/v1/rates");
  return rows.map((row) => ({
    ...row,
    buy_rate: Number(row.buy_rate),
    sell_rate: Number(row.sell_rate),
  }));
}

export type PublicFaq = {
  id: string;
  question: string;
  answer: string;
  keywords: string | null;
};

export async function listFaqs() {
  return apiRequest<PublicFaq[]>("/api/v1/faqs");
}

export async function listServices() {
  return apiRequest<
    Array<{ slug: string; title_fa: string; summary_fa: string; icon: string }>
  >("/api/v1/services");
}

export async function listBranches() {
  return apiRequest<
    Array<{
      id: string;
      name_fa: string;
      city_fa: string;
      country_fa: string;
      address_fa: string | null;
      phone: string | null;
      whatsapp: string | null;
      map_url: string | null;
    }>
  >("/api/v1/branches");
}

export async function listArticles() {
  return apiRequest<
    Array<{
      slug: string;
      title_fa: string;
      excerpt_fa: string;
      cover_url: string | null;
      published_at: string;
    }>
  >("/api/v1/articles");
}

export async function getArticle({ data }: DataArg<{ slug: string }>) {
  try {
    return await apiRequest<{
      slug: string;
      title_fa: string;
      excerpt_fa: string;
      body_fa: string;
      cover_url: string | null;
      published_at: string;
    }>(`/api/v1/articles/${encodeURIComponent(data.slug)}`);
  } catch {
    return null;
  }
}

export async function listSettings() {
  return apiRequest<
    Array<{
      key: string;
      group_key: string;
      label_fa: string;
      value: string;
      input_kind: string;
      hint_fa: string | null;
      sort_order: number;
    }>
  >("/api/v1/settings");
}

export type PublicComment = {
  id: string;
  author: string;
  body: string;
  created_at: string;
  replies: PublicComment[];
};

export async function listArticleComments({ data }: DataArg<{ slug: string }>) {
  return apiRequest<PublicComment[]>(`/api/v1/articles/${encodeURIComponent(data.slug)}/comments`);
}

export async function createArticleComment({
  data,
}: DataArg<{
  slug: string;
  body: string;
  parent_id?: string;
  guest_name?: string;
  guest_email?: string;
}>): Promise<ActionResult> {
  const { slug, ...body } = data;
  return apiAction(`/api/v1/articles/${encodeURIComponent(slug)}/comments`, {
    method: "POST",
    body,
  });
}

export type FeedbackItem = {
  id: string;
  author: string;
  body: string;
  rating: number;
  status: "pending" | "reviewed";
  created_at: string;
};

export async function listPublicFeedback() {
  return apiRequest<FeedbackItem[]>("/api/v1/feedback");
}

export async function createFeedback({
  data,
}: DataArg<{
  body: string;
  rating: number;
  guest_name?: string;
  guest_email?: string;
}>): Promise<ActionResult> {
  return apiAction("/api/v1/feedback", { method: "POST", body: data });
}

export async function validateContactMessage({
  data,
}: DataArg<{ name: string; phone: string; message: string }>): Promise<
  ActionResult<{ text: string }>
> {
  return apiAction<{ text: string }>("/api/v1/contact/validate", {
    method: "POST",
    body: data,
  });
}
