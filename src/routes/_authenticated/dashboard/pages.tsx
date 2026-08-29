import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeDollarSign,
  Building2,
  ExternalLink,
  Home,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoles } from "@/hooks/use-session";
import { TextAreaField, TextField } from "@/components/site/Field";
import { fieldClassSm } from "@/lib/forms";
import { listAdminSettings, saveSettings } from "@/lib/portal.functions";
import { settingsSchema } from "@/lib/validation";
import { faNum, site } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/pages")({
  head: () => ({
    meta: [
      { title: `محتوای صفحات | ${site.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PagesManagePage,
});

type Row = {
  key: string;
  group_key: string;
  label_fa: string;
  value: string;
  input_kind: string;
  hint_fa: string | null;
  sort_order: number;
};

type GroupMeta = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const GROUP_ORDER = ["brand", "home", "about", "contact", "services", "rates", "branches"] as const;

const groupMeta: Record<string, GroupMeta> = {
  brand: {
    title: "برند",
    description: "نام، شعار، معرفی کوتاه و سال شروع فعالیت برای محاسبه سال تجربه.",
    href: "/",
    icon: Sparkles,
  },
  home: {
    title: "صفحه اصلی",
    description:
      "متن‌های صفحه نخست. آمار سال تجربه، نمایندگی و ارز از داده‌های سیستم محاسبه می‌شود.",
    href: "/",
    icon: Home,
  },
  about: {
    title: "درباره ما",
    description: "داستان مجموعه، ارزش‌ها و آمارهایی که در صفحه درباره ما نمایش داده می‌شوند.",
    href: "/about",
    icon: Building2,
  },
  contact: {
    title: "تماس با ما",
    description: "شماره تماس، واتساپ، ایمیل، آدرس و ساعات کاری دفتر مرکزی.",
    href: "/contact",
    icon: Phone,
  },
  services: {
    title: "خدمات",
    description: "عنوان و توضیح صفحه خدمات و متن دعوت به ثبت حواله.",
    href: "/services",
    icon: Sparkles,
  },
  rates: {
    title: "نرخ‌ها",
    description: "عنوان و اعلامیه صفحه نرخ لحظه‌ای اسعار.",
    href: "/rates",
    icon: BadgeDollarSign,
  },
  branches: {
    title: "نمایندگی‌ها",
    description: "عنوان و توضیح صفحه شبکه دفاتر و نمایندگی‌ها.",
    href: "/branches",
    icon: MapPin,
  },
};

function metaFor(groupKey: string): GroupMeta {
  return (
    groupMeta[groupKey] ?? {
      title: groupKey,
      description: "متن‌های این بخش در سایت عمومی نمایش داده می‌شوند.",
      href: "/",
      icon: Sparkles,
    }
  );
}

function fieldLimit(kind: string) {
  return kind === "text" ? 400 : 8000;
}

function PagesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
        <div className="space-y-4 p-6 card-elevated">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function PagesManagePage() {
  const { isAdmin, loading } = useRoles();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [activeGroup, setActiveGroup] = useState<string>("");
  const [query, setQuery] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const settings = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => (await listAdminSettings()) as Row[],
  });

  useEffect(() => {
    if (!settings.data) return;
    setDraft(Object.fromEntries(settings.data.map((row) => [row.key, row.value])));
    setActiveGroup((current) => {
      if (current && settings.data.some((row) => row.group_key === current)) return current;
      const keys = new Set(settings.data.map((row) => row.group_key));
      return GROUP_ORDER.find((key) => keys.has(key)) ?? settings.data[0]?.group_key ?? "";
    });
  }, [settings.data]);

  const groups = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const row of settings.data ?? []) {
      const list = map.get(row.group_key) ?? [];
      list.push(row);
      map.set(row.group_key, list);
    }
    const known = GROUP_ORDER.filter((key) => map.has(key)).map((key) => [key, map.get(key) ?? []] as const);
    const extra = [...map.entries()].filter(([key]) => !GROUP_ORDER.includes(key as (typeof GROUP_ORDER)[number]));
    return [...known, ...extra];
  }, [settings.data]);

  const dirtyKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const row of settings.data ?? []) {
      if ((draft[row.key] ?? row.value) !== row.value) keys.add(row.key);
    }
    return keys;
  }, [settings.data, draft]);

  const dirtyByGroup = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of settings.data ?? []) {
      if (!dirtyKeys.has(row.key)) continue;
      counts.set(row.group_key, (counts.get(row.group_key) ?? 0) + 1);
    }
    return counts;
  }, [settings.data, dirtyKeys]);

  const term = query.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    if (!term) return groups;
    return groups.filter(([groupKey, rows]) => {
      const meta = metaFor(groupKey);
      if (meta.title.toLowerCase().includes(term) || groupKey.includes(term)) return true;
      return rows.some(
        (row) =>
          row.label_fa.toLowerCase().includes(term) ||
          row.key.toLowerCase().includes(term) ||
          (draft[row.key] ?? "").toLowerCase().includes(term),
      );
    });
  }, [draft, groups, term]);

  const activeRows = useMemo(() => {
    const rows = groups.find(([key]) => key === activeGroup)?.[1] ?? [];
    if (!term) return rows;
    return rows.filter(
      (row) =>
        row.label_fa.toLowerCase().includes(term) ||
        row.key.toLowerCase().includes(term) ||
        (draft[row.key] ?? "").toLowerCase().includes(term),
    );
  }, [activeGroup, draft, groups, term]);

  const shortRows = activeRows.filter((row) => row.input_kind === "text");
  const longRows = activeRows.filter((row) => row.input_kind !== "text");
  const activeMeta = metaFor(activeGroup);
  const ActiveIcon = activeMeta.icon;
  const dirtyCount = dirtyKeys.size;

  useEffect(() => {
    if (dirtyCount === 0) return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirtyCount]);

  const save = useMutation({
    mutationFn: async () => {
      const values = (settings.data ?? [])
        .filter((row) => dirtyKeys.has(row.key))
        .map((row) => ({ key: row.key, value: draft[row.key] ?? "" }));
      const parsed = settingsSchema.safeParse({ values });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "اطلاعات وارد شده معتبر نیست");
      }
      const result = await saveSettings({ data: { values } });
      if (!result.ok) throw new Error(result.message);
    },
    onSuccess: async () => {
      const next = (settings.data ?? []).map((row) => ({
        ...row,
        value: draft[row.key] ?? row.value,
      }));
      queryClient.setQueryData(["admin-settings"], next);
      queryClient.setQueryData(["site-settings"], next);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-settings"] }),
        queryClient.invalidateQueries({ queryKey: ["site-settings"] }),
      ]);
      toast.success("محتوای سایت ذخیره شد");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function discard() {
    if (!settings.data) return;
    setDraft(Object.fromEntries(settings.data.map((row) => [row.key, row.value])));
    setConfirmDiscard(false);
    toast.success("تغییرات لغو شد");
  }

  function updateField(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  if (loading || (isAdmin && settings.isLoading)) {
    return <PagesSkeleton />;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center card-elevated">
        <h1 className="text-lg font-bold">دسترسی محدود</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          ویرایش محتوای صفحات تنها برای مدیر سیستم مجاز است.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">محتوای صفحات</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
            هر بخش را جداگانه ویرایش کنید. فقط همان متن در سایت عمومی به‌روز می‌شود.
          </p>
        </div>
        <label className="relative w-full sm:max-w-72">
          <Search className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجوی عنوان یا متن…"
            className={cn(fieldClassSm, "w-full pe-10")}
          />
        </label>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-label="بخش‌های محتوا" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {visibleGroups.map(([groupKey, rows]) => {
            const meta = metaFor(groupKey);
            const Icon = meta.icon;
            const changed = dirtyByGroup.get(groupKey) ?? 0;
            const selected = groupKey === activeGroup;
            return (
              <button
                key={groupKey}
                type="button"
                onClick={() => setActiveGroup(groupKey)}
                className={cn(
                  "flex min-h-11 min-w-44 shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-start transition lg:min-w-0 lg:w-full",
                  selected
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/60",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                    selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{meta.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{faNum(rows.length)} فیلد</span>
                </span>
                {changed > 0 ? (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
                    {faNum(changed)}
                  </span>
                ) : null}
              </button>
            );
          })}
          {visibleGroups.length === 0 ? (
            <p className="rounded-xl bg-secondary px-4 py-6 text-sm text-muted-foreground">موردی یافت نشد.</p>
          ) : null}
        </nav>

        <section className="overflow-hidden card-elevated">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ActiveIcon className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-bold">{activeMeta.title}</h2>
                <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">{activeMeta.description}</p>
              </div>
            </div>
            <Link
              to={activeMeta.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-primary hover:bg-primary/10"
            >
              مشاهده صفحه
              <ExternalLink className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {activeRows.length === 0 ? (
              <p className="rounded-xl bg-secondary px-4 py-8 text-center text-sm text-muted-foreground">
                در این بخش فیلدی برای نمایش نیست.
              </p>
            ) : (
              <>
                {shortRows.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {shortRows.map((row) => (
                      <TextField
                        key={row.key}
                        label={row.label_fa}
                        hint={row.hint_fa ?? undefined}
                        maxLength={fieldLimit(row.input_kind)}
                        value={draft[row.key] ?? ""}
                        onChange={(event) => updateField(row.key, event.target.value)}
                      />
                    ))}
                  </div>
                ) : null}
                {longRows.map((row) => {
                  const limit = fieldLimit(row.input_kind);
                  const length = (draft[row.key] ?? "").length;
                  return (
                    <div key={row.key} className="space-y-1">
                      <TextAreaField
                        label={row.label_fa}
                        hint={row.hint_fa ?? undefined}
                        maxLength={limit}
                        className={row.input_kind === "longtext" ? "min-h-48" : "min-h-28"}
                        value={draft[row.key] ?? ""}
                        onChange={(event) => updateField(row.key, event.target.value)}
                      />
                      <p className="text-end text-xs text-muted-foreground">
                        {faNum(length)} از {faNum(limit)} نویسه
                      </p>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </section>
      </div>

      <div
        className={cn(
          "sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur",
          dirtyCount === 0 && "opacity-80",
        )}
      >
        <p className="text-sm text-muted-foreground">
          {dirtyCount === 0 ? "همه تغییرات ذخیره شده‌اند." : `${faNum(dirtyCount)} تغییر ذخیره‌نشده`}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={dirtyCount === 0 || save.isPending}
            onClick={() => setConfirmDiscard(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium disabled:opacity-50"
          >
            <RotateCcw className="size-4" />
            انصراف
          </button>
          <button
            type="button"
            disabled={dirtyCount === 0 || save.isPending}
            onClick={() => save.mutate()}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <Save className="size-4" />
            {save.isPending ? "در حال ذخیره…" : "ذخیره تغییرات"}
          </button>
        </div>
      </div>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>لغو تغییرات؟</AlertDialogTitle>
            <AlertDialogDescription>
              {faNum(dirtyCount)} تغییر ذخیره‌نشده به حالت قبلی برمی‌گردد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ادامه ویرایش</AlertDialogCancel>
            <AlertDialogAction onClick={discard}>لغو تغییرات</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
