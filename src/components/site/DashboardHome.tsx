import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeDollarSign,
  FileText,
  MapPin,
  Newspaper,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { faDate, faNum, statusLabels } from "@/lib/site";
import { cn } from "@/lib/utils";

const transferStatuses = [
  "pending",
  "in_review",
  "processing",
  "completed",
  "rejected",
  "cancelled",
] as const;

type TransferStatus = (typeof transferStatuses)[number];

export type DashboardStats = {
  transfers: number;
  pending: number;
  currencies: number;
  services: number;
  branches: number;
  articles: number;
  pending_comments: number;
  pending_feedbacks: number;
};

export type DashboardTransfer = {
  id: string;
  reference: string;
  amount: number | string;
  from_currency: string;
  to_currency: string;
  status: string;
  created_at: string;
};

type StatCard = {
  label: string;
  value: number | undefined;
  to:
    | "/dashboard/transfers"
    | "/dashboard/rates"
    | "/dashboard/services"
    | "/dashboard/branches"
    | "/dashboard/blog";
  icon: typeof Send;
  hint: string;
  adminOnly?: boolean;
};

function isTransferStatus(value: string): value is TransferStatus {
  return (transferStatuses as readonly string[]).includes(value);
}

function statusClass(status: string): string {
  const key: TransferStatus = isTransferStatus(status) ? status : "pending";
  switch (key) {
    case "pending":
      return "bg-warning/15 text-warning-foreground";
    case "in_review":
    case "processing":
      return "bg-primary/10 text-primary";
    case "completed":
      return "bg-success/15 text-success";
    case "rejected":
    case "cancelled":
      return "bg-destructive/10 text-destructive";
    default: {
      const _never: never = key;
      return _never;
    }
  }
}

function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "صبح بخیر";
  if (hour < 18) return "بعدازظهر بخیر";
  return "عصر بخیر";
}

function StatTile({
  card,
  loading,
  compact = false,
}: {
  card: StatCard;
  loading: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      to={card.to}
      title={card.hint}
      className={cn(
        "group flex flex-col card-elevated transition hover:-translate-y-0.5",
        compact ? "min-h-[4.75rem] justify-between gap-2 p-3" : "min-h-[7.5rem] justify-between p-5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn("font-medium text-muted-foreground", compact ? "text-xs leading-5" : "text-sm")}>
          {card.label}
        </p>
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-lg bg-primary text-accent",
            compact ? "size-8" : "size-11 rounded-xl",
          )}
        >
          <card.icon className={compact ? "size-3.5" : "size-5"} />
        </span>
      </div>
      <p className={cn("font-extrabold tracking-tight", compact ? "text-lg" : "mt-2 text-2xl")}>
        {loading || card.value === undefined ? (
          <Skeleton className={compact ? "h-6 w-10" : "h-8 w-16"} />
        ) : (
          faNum(card.value, 0)
        )}
      </p>
      {compact ? null : <p className="mt-4 text-xs text-muted-foreground">{card.hint}</p>}
    </Link>
  );
}

export function DashboardHome({
  displayName,
  isAdmin,
  stats,
  statsLoading,
  recent,
  recentLoading,
}: {
  displayName: string;
  isAdmin: boolean;
  stats?: DashboardStats;
  statsLoading: boolean;
  recent?: DashboardTransfer[];
  recentLoading: boolean;
}) {
  const today = new Date().toLocaleDateString("fa-IR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const overview: StatCard[] = [
    {
      label: "کل درخواست‌ها",
      value: stats?.transfers,
      to: "/dashboard/transfers",
      icon: Send,
      hint: "همه حواله‌های ثبت‌شده",
    },
    {
      label: "ارزهای فعال",
      value: stats?.currencies,
      to: "/dashboard/rates",
      icon: BadgeDollarSign,
      hint: "نرخ‌های قابل معامله در سایت",
    },
    {
      label: "مقالات",
      value: stats?.articles,
      to: "/dashboard/blog",
      icon: Newspaper,
      hint: "محتوای منتشرشده و پیش‌نویس",
    },
    {
      label: "خدمات",
      value: stats?.services,
      to: "/dashboard/services",
      icon: Sparkles,
      hint: "خدمات نمایش‌داده‌شده در سایت",
      adminOnly: true,
    },
    {
      label: "نمایندگی‌ها",
      value: stats?.branches,
      to: "/dashboard/branches",
      icon: MapPin,
      hint: "دفاتر و شبکه نمایندگی",
      adminOnly: true,
    },
  ].filter((card) => isAdmin || !card.adminOnly);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">{greeting()}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{displayName}</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
            وضعیت حواله‌ها، نرخ‌ها و محتوای سایت را از اینجا دنبال کنید.
          </p>
        </div>
        <div className="rounded-xl bg-secondary px-4 py-3 text-sm">
          <p className="text-xs text-muted-foreground">امروز</p>
          <p className="mt-0.5 font-semibold">{today}</p>
          <p className="mt-1 text-xs text-muted-foreground">{isAdmin ? "مدیر سیستم" : "کارشناس"}</p>
        </div>
      </header>

      <section aria-label="نمای کلی">
        <h2 className="mb-3 text-base font-bold">نمای کلی</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {overview.map((card) => (
            <StatTile key={card.label} card={card} loading={statsLoading} compact />
          ))}
        </div>
      </section>

      <section className="overflow-hidden card-elevated">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold">آخرین درخواست‌های حواله</h2>
            <p className="mt-1 text-xs text-muted-foreground">پنج درخواست تازه‌تر</p>
          </div>
          <Link
            to="/dashboard/transfers"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary"
          >
            همه درخواست‌ها <ArrowLeft className="size-4" />
          </Link>
        </div>

        {recentLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : recent?.length ? (
          <ul className="divide-y divide-border">
            {recent.map((row) => (
              <li key={row.id}>
                <Link
                  to="/dashboard/transfers"
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {row.reference}
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {faNum(row.amount)} <span dir="ltr">{row.from_currency}</span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <span dir="ltr">{row.to_currency}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <time className="text-xs text-muted-foreground" dateTime={row.created_at}>
                      {faDate(row.created_at)}
                    </time>
                    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusClass(row.status))}>
                      {statusLabels[row.status] ?? row.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-semibold">درخواستی ثبت نشده است</p>
            <p className="mt-1 text-sm text-muted-foreground">حواله‌های جدید مشتریان اینجا دیده می‌شوند.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold">دسترسی سریع</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/dashboard/transfers"
            className="inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted/60"
          >
            درخواست‌های حواله <Send className="size-4 text-accent" />
          </Link>
          <Link
            to="/dashboard/rates"
            className="inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted/60"
          >
            بروزرسانی نرخ‌ها <BadgeDollarSign className="size-4 text-accent" />
          </Link>
          {isAdmin ? (
            <>
              <Link
                to="/dashboard/pages"
                className="inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted/60"
              >
                ویرایش صفحات <FileText className="size-4 text-accent" />
              </Link>
              <Link
                to="/dashboard/users"
                className="inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted/60"
              >
                کاربران و نقش‌ها <Users className="size-4 text-accent" />
              </Link>
            </>
          ) : (
            <Link
              to="/dashboard/blog"
              className="inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted/60"
            >
              مدیریت وبلاگ <Newspaper className="size-4 text-accent" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
