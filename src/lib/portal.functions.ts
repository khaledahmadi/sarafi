import { apiAction, apiRequest } from "@/lib/api/client";
import type { ActionResult } from "@/lib/validation";

type DataArg<T> = { data: T };

export async function createTransfer({
  data,
}: DataArg<Record<string, unknown>>): Promise<ActionResult<{ reference: string }>> {
  return apiAction<{ reference: string }>("/api/v1/transfers", {
    method: "POST",
    body: data,
  });
}

export async function cancelTransfer({ data }: DataArg<{ id: string }>): Promise<ActionResult> {
  return apiAction(`/api/v1/transfers/${data.id}/cancel`, { method: "POST" });
}

export async function updateTransferStatus({
  data,
}: DataArg<{ id: string; status: string }>): Promise<ActionResult> {
  return apiAction(`/api/v1/admin/transfers/${data.id}/status`, {
    method: "PATCH",
    body: { status: data.status },
  });
}

export async function updateTransferNote({
  data,
}: DataArg<{ id: string; staff_note: string }>): Promise<ActionResult> {
  return apiAction(`/api/v1/admin/transfers/${data.id}/note`, {
    method: "PATCH",
    body: { staff_note: data.staff_note },
  });
}

export async function updateTransfer({
  data,
}: DataArg<{ id: string } & Record<string, unknown>>): Promise<ActionResult> {
  const { id, ...body } = data;
  return apiAction(`/api/v1/admin/transfers/${id}`, {
    method: "PUT",
    body,
  });
}

export async function deleteTransfer({ data }: DataArg<{ id: string }>): Promise<ActionResult> {
  return apiAction(`/api/v1/admin/transfers/${data.id}`, { method: "DELETE" });
}

export async function setUserRole({
  data,
}: DataArg<{ userId: string; role: string }>): Promise<ActionResult> {
  return apiAction(`/api/v1/admin/users/${data.userId}/role`, {
    method: "PUT",
    body: { role: data.role },
  });
}

export async function createAdminUser({
  data,
}: DataArg<{
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}>): Promise<ActionResult<{ id: string }>> {
  return apiAction<{ id: string }>("/api/v1/admin/users", {
    method: "POST",
    body: {
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      password: data.password,
      role: data.role,
    },
  });
}

function takeId(data: Record<string, unknown>): string | undefined {
  const id = data["id"];
  return typeof id === "string" ? id : undefined;
}

function withoutId(data: Record<string, unknown>): Record<string, unknown> {
  const body = { ...data };
  delete body["id"];
  return body;
}

export async function saveArticle({
  data,
}: DataArg<Record<string, unknown>>): Promise<ActionResult<{ slug: string }>> {
  const id = takeId(data);
  const body = withoutId(data);
  if (id) {
    return apiAction<{ slug: string }>(`/api/v1/admin/articles/${id}`, {
      method: "PUT",
      body,
    });
  }
  return apiAction<{ slug: string }>("/api/v1/admin/articles", {
    method: "POST",
    body,
  });
}

export async function deleteArticle({ data }: DataArg<{ id: string }>): Promise<ActionResult> {
  return apiAction(`/api/v1/admin/articles/${data.id}`, { method: "DELETE" });
}

export async function uploadArticleImage(file: File): Promise<ActionResult<{ url: string }>> {
  const body = new FormData();
  body.append("image", file);
  return apiAction<{ url: string }>("/api/v1/admin/uploads", {
    method: "POST",
    body,
  });
}

export async function saveService({ data }: DataArg<Record<string, unknown>>): Promise<ActionResult> {
  const id = takeId(data);
  const body = withoutId(data);
  if (id) {
    return apiAction(`/api/v1/admin/services/${id}`, { method: "PUT", body });
  }
  return apiAction("/api/v1/admin/services", { method: "POST", body });
}

export async function deleteService({ data }: DataArg<{ id: string }>): Promise<ActionResult> {
  return apiAction(`/api/v1/admin/services/${data.id}`, { method: "DELETE" });
}

export async function saveBranch({ data }: DataArg<Record<string, unknown>>): Promise<ActionResult> {
  const id = takeId(data);
  const body = withoutId(data);
  if (id) {
    return apiAction(`/api/v1/admin/branches/${id}`, { method: "PUT", body });
  }
  return apiAction("/api/v1/admin/branches", { method: "POST", body });
}

export async function deleteBranch({ data }: DataArg<{ id: string }>): Promise<ActionResult> {
  return apiAction(`/api/v1/admin/branches/${data.id}`, { method: "DELETE" });
}

export async function saveCurrency({
  data,
}: DataArg<Record<string, unknown>>): Promise<ActionResult> {
  const id = takeId(data);
  const body = withoutId(data);
  if (id) {
    return apiAction(`/api/v1/admin/currencies/${id}`, { method: "PUT", body });
  }
  return apiAction("/api/v1/admin/currencies", { method: "POST", body });
}

export async function deleteCurrency({ data }: DataArg<{ id: string }>): Promise<ActionResult> {
  return apiAction(`/api/v1/admin/currencies/${data.id}`, { method: "DELETE" });
}

export async function saveSettings({
  data,
}: DataArg<{ values: Array<{ key: string; value: string }> }>): Promise<ActionResult> {
  return apiAction("/api/v1/admin/settings", {
    method: "PUT",
    body: data,
  });
}

export async function listMyTransfers() {
  return apiRequest<
    Array<{
      id: string;
      reference: string;
      from_currency: string;
      to_currency: string;
      amount: number | string;
      destination_fa: string;
      recipient_name: string;
      status: string;
      staff_note: string | null;
      created_at: string;
    }>
  >("/api/v1/transfers/me");
}

export async function listAdminTransfers() {
  return apiRequest<
    Array<{
      id: string;
      reference: string;
      from_currency: string;
      to_currency: string;
      amount: number | string;
      destination_fa: string;
      recipient_name: string;
      recipient_detail: string;
      note: string | null;
      status: string;
      staff_note: string | null;
      created_at: string;
    }>
  >("/api/v1/admin/transfers?limit=200");
}

export async function listAdminRecentTransfers() {
  return apiRequest<
    Array<{
      id: string;
      reference: string;
      amount: number | string;
      from_currency: string;
      to_currency: string;
      status: string;
      created_at: string;
    }>
  >("/api/v1/admin/transfers/recent?limit=5");
}

export async function getAdminStats() {
  return apiRequest<{
    transfers: number;
    pending: number;
    currencies: number;
    services: number;
    branches: number;
    articles: number;
    pending_comments: number;
    pending_feedbacks: number;
  }>("/api/v1/admin/stats");
}

export async function listAdminCurrencies() {
  return apiRequest<
    Array<{
      id: string;
      code: string;
      name_fa: string;
      flag: string | null;
      buy_rate: number | string;
      sell_rate: number | string;
      sort_order: number;
      is_active: boolean;
      updated_at: string;
    }>
  >("/api/v1/admin/currencies");
}

export async function listAdminServices() {
  return apiRequest<
    Array<{
      id: string;
      slug: string;
      title_fa: string;
      summary_fa: string;
      icon: string;
      sort_order: number;
      is_active: boolean;
    }>
  >("/api/v1/admin/services");
}

export async function listAdminBranches() {
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
      sort_order: number;
    }>
  >("/api/v1/admin/branches");
}

export async function listAdminArticles() {
  return apiRequest<
    Array<{
      id: string;
      slug: string;
      title_fa: string;
      excerpt_fa: string;
      body_fa: string;
      cover_url: string | null;
      is_published: boolean;
      published_at: string;
      updated_at: string;
    }>
  >("/api/v1/admin/articles");
}

export async function listAdminSettings() {
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
  >("/api/v1/admin/settings");
}

export async function listAdminUsers() {
  return apiRequest<
    Array<{
      id: string;
      email: string;
      full_name: string | null;
      phone: string | null;
      roles: string[];
      created_at: string;
    }>
  >("/api/v1/admin/users");
}

export async function listAdminComments() {
  return apiRequest<
    Array<{
      id: string;
      article_title: string;
      author: string;
      body: string;
      is_approved: boolean;
      is_reply: boolean;
      created_at: string;
    }>
  >("/api/v1/admin/comments");
}

export async function approveComment({ data }: DataArg<{ id: string }>): Promise<ActionResult> {
  return apiAction(`/api/v1/admin/comments/${data.id}/approve`, { method: "PATCH" });
}

export async function deleteComment({ data }: DataArg<{ id: string }>): Promise<ActionResult> {
  return apiAction(`/api/v1/admin/comments/${data.id}`, { method: "DELETE" });
}

export async function listAdminFeedback() {
  return apiRequest<
    Array<{
      id: string;
      author: string;
      body: string;
      rating: number;
      status: "pending" | "reviewed";
      created_at: string;
    }>
  >("/api/v1/admin/feedback");
}

export async function reviewFeedback({ data }: DataArg<{ id: string }>): Promise<ActionResult> {
  return apiAction(`/api/v1/admin/feedback/${data.id}/review`, { method: "PATCH" });
}

export async function deleteAdminFeedback({
  data,
}: DataArg<{ id: string }>): Promise<ActionResult> {
  return apiAction(`/api/v1/admin/feedback/${data.id}`, { method: "DELETE" });
}

export async function listAdminFaqs() {
  return apiRequest<
    Array<{
      id: string;
      question: string;
      answer: string;
      keywords: string | null;
      sort_order: number;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>
  >("/api/v1/admin/faqs");
}

export async function saveFaq({ data }: DataArg<Record<string, unknown>>): Promise<ActionResult> {
  const id = takeId(data);
  const body = withoutId(data);
  if (id) {
    return apiAction(`/api/v1/admin/faqs/${id}`, { method: "PUT", body });
  }
  return apiAction("/api/v1/admin/faqs", { method: "POST", body });
}

export async function deleteFaq({ data }: DataArg<{ id: string }>): Promise<ActionResult> {
  return apiAction(`/api/v1/admin/faqs/${data.id}`, { method: "DELETE" });
}
