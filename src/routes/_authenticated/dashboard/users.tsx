import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  Users2,
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
import { useLocale } from "@/i18n";
import { useRoles, useSession } from "@/hooks/use-session";
import { AppSelect, SelectField, TextField } from "@/components/site/Field";
import { fieldClass, labelClass } from "@/lib/forms";
import { createAdminUser, listAdminUsers, setUserRole } from "@/lib/portal.functions";
import { ACTIONS_CELL_CONTENT, ACTIONS_COLUMN_ALIGN } from "@/lib/data-table";
import { createAdminUserSchema, fieldErrorMap, translateFieldErrors, resolveValidationMessage } from "@/lib/validation";
import { site } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/dashboard/users")({
  head: () => ({
    meta: [
      { title: `Users | ${site.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UsersPage,
});

type AppRole = "admin" | "staff" | "customer";

const roleBadge: Record<AppRole, string> = {
  admin: "soft-badge-accent border",
  staff: "soft-badge-primary border",
  customer: "bg-secondary text-secondary-foreground border-border",
};

const roleOrder: AppRole[] = ["customer", "staff", "admin"];
const assignableRoles: AppRole[] = ["customer", "staff"];
const roleRank: Record<AppRole, number> = { customer: 0, staff: 1, admin: 2 };

type SortKey = "full_name" | "phone" | "role" | "created_at";
type SortDir = "asc" | "desc";

const pageSizes = [5, 10, 25, 50, 100];

type Member = {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  roles: AppRole[];
};

type CreateForm = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: AppRole;
};

const emptyForm: CreateForm = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  role: "staff",
};

function initials(name: string | null) {
  const clean = (name ?? "").trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function UsersPage() {
  const { t, n, d, dir } = useLocale();
  const roleLabels = {
    admin: t("admin.roleAdmin"),
    staff: t("admin.roleStaff"),
    customer: t("admin.roleCustomer"),
  } as const;
  const sortLabels: Record<SortKey, string> = {
    full_name: t("admin.sortUser"),
    phone: t("admin.staffPhone"),
    role: t("admin.sortRole"),
    created_at: t("admin.sortJoined"),
  };

  const { isAdmin, loading } = useRoles();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [pending, setPending] = useState<{ member: Member; role: AppRole } | null>(null);
  const [form, setForm] = useState<CreateForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const members = useQuery({
    queryKey: ["admin-members"],
    enabled: isAdmin,
    queryFn: async (): Promise<Member[]> => {
      const users = await listAdminUsers();
      return users.map((u) => ({
        id: u.id,
        full_name: u.full_name,
        phone: u.phone,
        created_at: u.created_at,
        roles: u.roles as AppRole[],
      }));
    },
  });

  const createUser = useMutation({
    mutationFn: async (state: CreateForm) => {
      const parsed = createAdminUserSchema.safeParse(state);
      if (!parsed.success) {
        setErrors(fieldErrorMap(parsed.error, t));
        throw new Error(t("admin.formIncomplete"));
      }
      setErrors({});
      return createAdminUser({ data: parsed.data });
    },
    onSuccess: (result) => {
      if (!result.ok) {
        setErrors(translateFieldErrors(result.fieldErrors, t));
        toast.error(resolveValidationMessage(result.message ?? "validation.operationFailed", t));
        return;
      }
      toast.success(t("admin.userCreated", { role: roleLabels[form.role] }));
      setForm(emptyForm);
      setErrors({});
      void queryClient.invalidateQueries({ queryKey: ["admin-members"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setRole = useMutation({
    mutationFn: async (vars: { userId: string; role: AppRole }) => {
      const result = await setUserRole({ data: vars });
      if (!result.ok) throw new Error(resolveValidationMessage(result.message ?? "validation.operationFailed", t));
    },
    onSuccess: (_data, vars) => {
      const member = members.data?.find((m) => m.id === vars.userId);
      toast.success(t("admin.roleChanged", { name: member?.full_name ?? t("admin.unnamed"), role: roleLabels[vars.role] }));
      void queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      void queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const counts = useMemo(() => {
    const all = members.data ?? [];
    const by = (role: AppRole) => all.filter((m) => (m.roles[0] ?? "customer") === role).length;
    return { total: all.length, admin: by("admin"), staff: by("staff"), customer: by("customer") };
  }, [members.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = (members.data ?? []).filter((member) => {
      const role = member.roles[0] ?? "customer";
      if (roleFilter !== "all" && role !== roleFilter) return false;
      if (!term) return true;
      return [member.full_name ?? "", member.phone ?? "", member.id]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortKey === "role") {
        return (roleRank[a.roles[0] ?? "customer"] - roleRank[b.roles[0] ?? "customer"]) * dir;
      }
      if (sortKey === "created_at") {
        return (Date.parse(a.created_at) - Date.parse(b.created_at)) * dir;
      }
      const av = (a[sortKey] ?? "").toString();
      const bv = (b[sortKey] ?? "").toString();
      return av.localeCompare(bv, "fa") * dir;
    });
  }, [members.data, search, roleFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  function toggleSort(key: SortKey) {
    setPage(1);
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "created_at" ? "desc" : "asc");
  }

  function exportCsv() {
    if (filtered.length === 0) {
      toast.error(t("admin.noDataExport"));
      return;
    }
    const header = [t("admin.csvUserId"), t("admin.csvName"), t("admin.csvPhone"), t("admin.csvRole"), t("admin.csvJoined")];
    const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = [
      header.map(cell).join(","),
      ...filtered.map((m) =>
        [
          m.id,
          m.full_name ?? "",
          m.phone ?? "",
          roleLabels[m.roles[0] ?? "customer"],
          new Date(m.created_at).toISOString().slice(0, 10),
        ]
          .map(cell)
          .join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sarafi-users-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("admin.usersCsvReady", { count: n(filtered.length, 0) }));
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  if (!isAdmin) {
    return (
      <div className="p-6 card-elevated">
        <h1 className="text-lg font-bold">{t("admin.accessDeniedTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("admin.usersAccess")}
        </p>
      </div>
    );
  }

  const stats = [
    { label: t("admin.usersTotal"), value: counts.total, icon: Users2 },
    { label: t("admin.roleAdmin"), value: counts.admin, icon: ShieldCheck },
    { label: t("admin.roleStaff"), value: counts.staff, icon: UserCog },
    { label: t("admin.roleCustomer"), value: counts.customer, icon: Users2 },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">{t("admin.usersTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("admin.usersSubtitle")}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 p-4 card-elevated">
            <span className="icon-badge size-10 rounded-xl">
              <stat.icon className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-extrabold">{n(stat.value, 0)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
      <div className="grid gap-4 p-5 card-elevated lg:grid-cols-[1fr_13rem_11rem_auto] lg:items-end">
        <div>
          <label className={labelClass} htmlFor="user-search">
            {t("admin.usersSearch")}
          </label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="user-search"
              dir={dir}
              className={`${fieldClass} pe-10`}
              placeholder={t("admin.usersSearchPh")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="role-filter">
            {t("admin.roleFilter")}
          </label>
          <div className="mt-2">
            <AppSelect
              id="role-filter"
              value={roleFilter}
              options={[
                { value: "all", label: t("admin.allRoles") },
                ...roleOrder.map((role) => ({ value: role, label: roleLabels[role] })),
              ]}
              onValueChange={(value) => {
                setRoleFilter(value as "all" | AppRole);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="page-size">
            {t("admin.pageSize")}
          </label>
          <div className="mt-2">
            <AppSelect
              id="page-size"
              value={String(pageSize)}
              options={pageSizes.map((size) => ({
                value: String(size),
                label: `${t("admin.rows", { count: n(size, 0) })}`,
              }))}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
        >
          <Download className="size-4" /> {t("admin.exportCsv")}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("admin.usersShowing", { shown: n(paginated.length, 0), total: n(filtered.length, 0), page: n(currentPage, 0), pages: n(totalPages, 0) })}
      </p>

      <div className="overflow-x-auto card-elevated">
        <table
          className={`w-full min-w-[46rem] text-sm ${dir === "ltr" ? "text-left" : "text-right"}`}
        >
          <thead className="bg-secondary/80">
            <tr>
              {(["full_name", "phone", "role", "created_at"] as SortKey[]).map((key) => (
                <th key={key} className="px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort(key)}
                    className="inline-flex items-center gap-1 font-semibold hover:text-primary"
                    aria-label={t("admin.sortBy", { label: sortLabels[key] })}
                  >
                    {sortLabels[key]}
                    <ArrowUpDown
                      className={`size-3.5 ${sortKey === key ? "text-primary" : "opacity-40"}`}
                    />
                    {sortKey === key && (
                      <span className="text-[10px] text-muted-foreground">
                        {sortDir === "asc" ? t("admin.asc") : t("admin.desc")}
                      </span>
                    )}
                  </button>
                </th>
              ))}
              <th className={`px-4 py-3 font-semibold ${ACTIONS_COLUMN_ALIGN}`}>
                    {t("admin.changeRole")}
                  </th>
            </tr>
          </thead>

          <tbody>
            {!members.isLoading && filtered.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={5}>
                  {t("admin.usersEmpty")}
                </td>
              </tr>
            )}
            {paginated.map((member) => {
              const current = member.roles[0] ?? "customer";
              const isSelf = member.id === user?.id;
              const isAdminAccount = current === "admin";
              const updating = setRole.isPending && setRole.variables?.userId === member.id;
              const actionsCell = (
                <td className={`px-4 py-3 ${ACTIONS_COLUMN_ALIGN}`}>
                  <div className={ACTIONS_CELL_CONTENT}>
                    {isSelf || isAdminAccount ? (
                      <span className="text-xs text-muted-foreground">{t("admin.cannotChangeRole")}</span>
                    ) : updating ? (
                      <span className="text-xs text-muted-foreground">{t("admin.saving")}</span>
                    ) : (
                      <div className="w-40">
                        <AppSelect
                          size="sm"
                          ariaLabel={t("admin.roleLabel") + ` ${member.full_name ?? t("admin.userFallback")}`}
                          value={current}
                          options={assignableRoles.map((role) => ({
                            value: role,
                            label: roleLabels[role],
                          }))}
                          onValueChange={(value) => {
                            const role = value as AppRole;
                            if (role !== current) setPending({ member, role });
                          }}
                        />
                      </div>
                    )}
                  </div>
                </td>
              );
              return (
                <tr key={member.id} className="border-t border-border transition hover:bg-secondary/40">
                                    <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {initials(member.full_name)}
                      </span>
                      <span>
                        <span className="font-semibold">{member.full_name ?? t("admin.unnamed")}</span>
                        {isSelf && (
                          <span className="ms-2 rounded-full soft-badge-accent px-2 py-0.5 text-[10px] font-bold">
                            {t("admin.yourAccount")}
                          </span>
                        )}
                        <span
                          className="mt-0.5 block font-mono text-[11px] text-muted-foreground"
                          dir="ltr"
                        >
                          {member.id.slice(0, 8)}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3" dir="ltr">
                    {member.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${roleBadge[current]}`}
                    >
                      {roleLabels[current]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {d(member.created_at)}
                  </td>
                  {actionsCell}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {t("admin.pageOf", { page: n(currentPage, 0), pages: n(totalPages, 0) })}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold disabled:opacity-40"
          >
            <ChevronRight className="size-3.5" /> {t("common.previous")}
          </button>
          <button
            type="button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold disabled:opacity-40"
          >
            {t("common.next")} <ChevronLeft className="size-3.5" />
          </button>
        </div>
      </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            createUser.mutate(form);
          }}
          className="h-fit space-y-4 p-5 card-elevated"
        >
          <h2 className="text-base font-bold">{t("admin.addStaff")}</h2>
          <p className="text-xs leading-6 text-muted-foreground">
            {t("admin.addStaffHint")}
          </p>
          <TextField
            label={t("admin.staffFullName")}
            value={form.full_name}
            error={errors["full_name"]}
            maxLength={255}
            onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
          />
          <TextField
            label={t("admin.staffEmail")}
            type="email"
            dir="ltr"
            autoComplete="off"
            value={form.email}
            error={errors["email"]}
            maxLength={255}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <TextField
            label={t("admin.staffPhone")}
            dir="ltr"
            value={form.phone}
            error={errors["phone"]}
            maxLength={64}
            hint={t("admin.optionalHint")}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          />
          <TextField
            label={t("admin.staffPassword")}
            type="password"
            autoComplete="new-password"
            value={form.password}
            error={errors["password"]}
            maxLength={72}
            hint={t("admin.minChars6")}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />
          <SelectField
            label={t("admin.roleLabel")}
            value={form.role}
            error={errors["role"]}
            options={assignableRoles.map((role) => ({ value: role, label: roleLabels[role] }))}
            onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as AppRole }))}
          />
          <button
            type="submit"
            disabled={createUser.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            <Plus className="size-4" />
            {createUser.isPending ? t("common.submitting") : t("admin.registerUser")}
          </button>
        </form>
      </div>

      <AlertDialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent dir="rtl" className="text-right">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.roleConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.roleConfirmBody", {
                name: pending?.member.full_name ?? t("admin.thisUser"),
                from: roleLabels[pending?.member.roles[0] ?? "customer"],
                to: pending ? roleLabels[pending.role] : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:flex-row-reverse sm:justify-start">
            <AlertDialogAction
              onClick={() => {
                if (pending) setRole.mutate({ userId: pending.member.id, role: pending.role });
                setPending(null);
              }}
            >
              {t("admin.confirmAndSave")}
            </AlertDialogAction>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
