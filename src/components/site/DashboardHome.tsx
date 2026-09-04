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
import { useLocale } from "@/i18n";
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
      return "soft-badge-warning border";
    case "in_review":
    case "processing":
      return "soft-badge-primary border";
    case "completed":
      return "soft-badge-success border";
    case "rejected":
    case "cancelled":
      return "bg-destructive/10 text-destructive border border-destructive/30";
    default: {
      const _never: never = key;
      return _never;
    }
  }
}

function greetingKey(now = new Date()): "dashboard.greetingMorning" | "dashboard.greetingAfternoon" | "dashboard.greetingEvening" {
  const hour = now.getHours();
  if (hour < 12) return "dashboard.greetingMorning";
  if (hour < 18) return "dashboard.greetingAfternoon";
  return "dashboard.greetingEvening";
}

function StatTile({
  card,
  loading,
  compact = false,
  n,
}: {
  card: StatCard;
  loading: boolean;
  compact?: boolean;
  n: (value: number | string, digits?: number) => string;
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
            "grid shrink-0 place-items-center rounded-lg icon-tile",
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
          n(card.value, 0)
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
  const { t, n, d } = useLocale();
  const today = d(new Date());

  const overview: StatCard[] = [
    {
      label: t("dashboard.totalRequests"),
      value: stats?.transfers,
      to: "/dashboard/transfers",
      icon: Send,
      hint: t("dashboard.totalRequestsHint"),
    },
    {
      label: t("dashboard.activeCurrencies"),
      value: stats?.currencies,
      to: "/dashboard/rates",
      icon: BadgeDollarSign,
      hint: t("dashboard.currenciesHint"),
    },
    {
      label: t("dashboard.articles"),
      value: stats?.articles,
      to: "/dashboard/blog",
      icon: Newspaper,
      hint: t("dashboard.articlesHint"),
    },
    {
      label: t("dashboard.services"),
      value: stats?.services,
      to: "/dashboard/services",
      icon: Sparkles,
      hint: t("dashboard.servicesHint"),
      adminOnly: true,
    },
    {
      label: t("dashboard.branches"),
      value: stats?.branches,
      to: "/dashboard/branches",
      icon: MapPin,
      hint: t("dashboard.branchesHint"),
      adminOnly: true,
    },
  ].filter((card): card is StatCard => isAdmin || !card.adminOnly);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">{t(greetingKey())}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{displayName}</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        <div className="rounded-xl bg-secondary px-4 py-3 text-sm">
          <p className="text-xs text-muted-foreground">{t("dashboard.today")}</p>
          <p className="mt-0.5 font-semibold">{today}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isAdmin ? t("dashboard.roleAdmin") : t("dashboard.roleStaff")}
          </p>
        </div>
      </header>

      <section aria-label={t("dashboard.overviewShort")}>
        <h2 className="mb-3 text-base font-bold">{t("dashboard.overviewShort")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {overview.map((card) => (
            <StatTile key={card.label} card={card} loading={statsLoading} compact n={n} />
          ))}
        </div>
      </section>

      <section className="overflow-hidden card-elevated">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold">{t("dashboard.recentTransfers")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.recentTransfersHint")}</p>
          </div>
          <Link
            to="/dashboard/transfers"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary"
          >
            {t("dashboard.allRequests")} <ArrowLeft className="size-4" />
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
                      {n(row.amount)} <span dir="ltr">{row.from_currency}</span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <span dir="ltr">{row.to_currency}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <time className="text-xs text-muted-foreground" dateTime={row.created_at}>
                      {d(row.created_at)}
                    </time>
                    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusClass(row.status))}>
                      {t(`status.${row.status}`)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-semibold">{t("dashboard.emptyTransfers")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.emptyTransfersHint")}</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold">{t("dashboard.quickAccess")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/dashboard/transfers"
            className="inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted/60"
          >
            {t("dashboard.transferRequests")} <Send className="size-4 text-accent" />
          </Link>
          <Link
            to="/dashboard/rates"
            className="inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted/60"
          >
            {t("dashboard.updateRates")} <BadgeDollarSign className="size-4 text-accent" />
          </Link>
          {isAdmin ? (
            <>
              <Link
                to="/dashboard/pages"
                className="inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted/60"
              >
                {t("dashboard.editPages")} <FileText className="size-4 text-accent" />
              </Link>
              <Link
                to="/dashboard/users"
                className="inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted/60"
              >
                {t("dashboard.manageUsers")} <Users className="size-4 text-accent" />
              </Link>
            </>
          ) : (
            <Link
              to="/dashboard/blog"
              className="inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted/60"
            >
              {t("dashboard.manageBlog")} <Newspaper className="size-4 text-accent" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
