import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/site/ConfirmDeleteDialog";
import { AppSelect, SearchableSelectField, SelectField, TextAreaField, TextField } from "@/components/site/Field";
import { countryNameOptionsForIsoCodes } from "@/lib/country-flags";
import { countryCodeForCurrency } from "@/lib/currency-codes";
import { fieldClassSm } from "@/lib/forms";
import {
  createTransfer,
  deleteTransfer,
  listAdminTransfers,
  updateTransfer,
  updateTransferNote,
  updateTransferStatus,
} from "@/lib/portal.functions";
import { ratesQuery } from "@/lib/queries";
import { useRateSource } from "@/hooks/use-rate-source";
import { fieldErrorMap, friendlyError, parseNum, transferSchema, transferStatuses } from "@/lib/validation";
import { site } from "@/lib/site";
import { useLocale } from "@/i18n";
import { pageMeta, resolvePageLocale } from "@/i18n/meta";

export const Route = createFileRoute("/_authenticated/dashboard/transfers")({
  loader: async () => ({ locale: await resolvePageLocale() }),
  head: ({ loaderData }) => {
    const base = pageMeta(loaderData?.locale ?? "fa", "meta.transfersTitle");
    return {
      ...base,
      meta: [...base.meta, { name: "robots", content: "noindex" }],
    };
  },
  component: TransfersPage,
});

type Transfer = Awaited<ReturnType<typeof listAdminTransfers>>[number];

type FormState = {
  id?: string;
  from_currency: string;
  to_currency: string;
  amount: string;
  destination_fa: string;
  recipient_name: string;
  recipient_detail: string;
  note: string;
};

const emptyForm: FormState = {
  from_currency: site.baseCurrency,
  to_currency: "CNY",
  amount: "",
  destination_fa: "افغانستان",
  recipient_name: "",
  recipient_detail: "",
  note: "",
};

function TransfersPage() {
  const queryClient = useQueryClient();
  const { source } = useRateSource();
  const { t, n } = useLocale();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<Transfer | null>(null);

  const statusOptions = transferStatuses.map((status) => ({
    value: status,
    label: t(`status.${status}`),
  }));

  const transfers = useQuery({
    queryKey: ["admin-transfers"],
    queryFn: listAdminTransfers,
  });
  const rates = useQuery(ratesQuery(source));

  const currencyOptions = useMemo(() => {
    const fromRates = (rates.data ?? []).map((row) => ({
      value: row.code,
      label: row.name_fa,
      hint: row.code,
    }));
    return [
      { value: site.baseCurrency, label: site.baseCurrencyFa, hint: site.baseCurrency },
      ...fromRates,
    ].filter((option, index, all) => all.findIndex((item) => item.value === option.value) === index);
  }, [rates.data]);

  const destinationOptions = useMemo(() => {
    const isoCodes = currencyOptions
      .map((option) => countryCodeForCurrency(option.value))
      .filter((code): code is string => Boolean(code));
    return countryNameOptionsForIsoCodes(isoCodes, form.destination_fa);
  }, [currencyOptions, form.destination_fa]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (transfers.data ?? []).filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!q) return true;
      return (
        row.reference.toLowerCase().includes(q) ||
        row.recipient_name.toLowerCase().includes(q) ||
        row.destination_fa.toLowerCase().includes(q)
      );
    });
  }, [transfers.data, search, filter]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-transfers"] });
    void queryClient.invalidateQueries({ queryKey: ["manage-stats"] });
    void queryClient.invalidateQueries({ queryKey: ["my-transfers"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, amount: parseNum(form.amount) };
      const parsed = transferSchema.safeParse(payload);
      if (!parsed.success) {
        setErrors(fieldErrorMap(parsed.error));
        throw new Error(t("common.formInvalid"));
      }
      const result = form.id
        ? await updateTransfer({ data: { id: form.id, ...parsed.data } })
        : await createTransfer({ data: parsed.data });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        throw new Error(result.message);
      }
      setErrors({});
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(
        form.id
          ? t("admin.transfersSaved")
          : data?.reference
            ? t("admin.transfersCreatedRef", { ref: data.reference })
            : t("admin.transfersCreated"),
      );
      setForm(emptyForm);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message || friendlyError(undefined)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTransfer({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(t("admin.transfersDeleted"));
      setForm((prev) => (prev.id ? emptyForm : prev));
      invalidate();
    },
    onError: () => toast.error(t("admin.transfersDeleteFailed")),
  });

  const setStatus = useMutation({
    mutationFn: async (vars: { id: string; status: string }) => {
      const result = await updateTransferStatus({ data: vars });
      if (!result.ok) throw new Error(result.message);
    },
    onSuccess: () => {
      toast.success(t("admin.transfersStatusUpdated"));
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setNote = useMutation({
    mutationFn: async (vars: { id: string; staff_note: string }) => {
      const result = await updateTransferNote({ data: vars });
      if (!result.ok) throw new Error(result.message);
    },
    onSuccess: () => {
      toast.success(t("admin.transfersNoteSaved"));
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function update(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function startEdit(item: Transfer) {
    setErrors({});
    setForm({
      id: item.id,
      from_currency: item.from_currency,
      to_currency: item.to_currency,
      amount: String(item.amount),
      destination_fa: item.destination_fa,
      recipient_name: item.recipient_name,
      recipient_detail: item.recipient_detail,
      note: item.note ?? "",
    });
  }

  function cancelEdit() {
    setForm(emptyForm);
    setErrors({});
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">{t("admin.transfersTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("admin.transfersSubtitle")}</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-4 p-5 card-elevated sm:grid-cols-2 sm:items-end">
            <TextField
              label={t("common.search")}
              fieldSize="sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("admin.transfersSearchPh")}
            />
            <div>
              <p className="form-label mb-2">{t("admin.statusFilter")}</p>
              <AppSelect
                size="sm"
                ariaLabel={t("admin.statusFilter")}
                value={filter}
                onValueChange={setFilter}
                options={[{ value: "all", label: t("common.all") }, ...statusOptions]}
              />
            </div>
          </div>

          <div className="space-y-3">
            {transfers.isLoading && (
              <p className="rounded-xl bg-secondary p-5 text-sm text-muted-foreground">
                {t("common.loading")}
              </p>
            )}
            {!transfers.isLoading && rows.length === 0 && (
              <p className="rounded-xl bg-secondary p-6 text-sm text-muted-foreground">
                {t("admin.transfersEmpty")}
              </p>
            )}
            {rows.map((item) => {
              const deleting = remove.isPending && remove.variables === item.id;
              return (
                <article key={item.id} className="grid gap-4 p-5 card-elevated md:grid-cols-[1.4fr_1fr]">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {item.reference}
                      {form.id === item.id && (
                        <span className="ms-2 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                          {t("common.editing")}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 font-bold">
                      {n(item.amount)} <span dir="ltr">{item.from_currency}</span> →{" "}
                      <span dir="ltr">{item.to_currency}</span>
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("admin.recipientLine", {
                        name: item.recipient_name,
                        detail: item.recipient_detail,
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("admin.destinationLine", { dest: item.destination_fa })}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                      >
                        <Pencil className="size-3.5" /> {t("common.edit")}
                      </button>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => setPendingDelete(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60"
                      >
                        <Trash2 className="size-3.5" /> {t("common.delete")}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <AppSelect
                      size="sm"
                      ariaLabel={t("admin.statusAria", { ref: item.reference })}
                      value={item.status}
                      options={statusOptions}
                      onValueChange={(status) => setStatus.mutate({ id: item.id, status })}
                    />
                    <textarea
                      className={`${fieldClassSm} min-h-20`}
                      placeholder={t("admin.noteCustomer")}
                      defaultValue={item.staff_note ?? ""}
                      maxLength={500}
                      onBlur={(event) =>
                        event.target.value !== (item.staff_note ?? "") &&
                        setNote.mutate({ id: item.id, staff_note: event.target.value })
                      }
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
          className="h-fit space-y-4 p-5 card-elevated"
        >
          <h2 className="text-base font-bold">
            {form.id ? t("admin.transfersEdit") : t("admin.transfersAdd")}
          </h2>
          <SelectField
            label={t("admin.fromCurrency")}
            value={form.from_currency}
            options={currencyOptions}
            error={errors["from_currency"]}
            onValueChange={(value) => update("from_currency", value)}
          />
          <SelectField
            label={t("admin.toCurrency")}
            value={form.to_currency}
            options={currencyOptions}
            error={errors["to_currency"]}
            onValueChange={(value) => update("to_currency", value)}
          />
          <TextField
            label={t("admin.amount")}
            inputMode="decimal"
            hint={t("admin.amountHint")}
            value={form.amount}
            error={errors["amount"]}
            onChange={(event) => update("amount", event.target.value)}
          />
          <SearchableSelectField
            label={t("admin.destination")}
            hint={t("admin.destinationHint")}
            value={form.destination_fa}
            error={errors["destination_fa"]}
            options={destinationOptions}
            placeholder={t("admin.destinationPh")}
            searchPlaceholder={t("admin.destinationSearch")}
            onValueChange={(value) => update("destination_fa", value)}
          />
          <TextField
            label={t("admin.recipientName")}
            maxLength={120}
            value={form.recipient_name}
            error={errors["recipient_name"]}
            onChange={(event) => update("recipient_name", event.target.value)}
          />
          <TextField
            label={t("admin.recipientDetail")}
            maxLength={300}
            value={form.recipient_detail}
            error={errors["recipient_detail"]}
            onChange={(event) => update("recipient_detail", event.target.value)}
          />
          <TextAreaField
            label={t("admin.noteOptional")}
            maxLength={500}
            value={form.note}
            error={errors["note"]}
            onChange={(event) => update("note", event.target.value)}
          />
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              <Plus className="size-4" />
              {save.isPending
                ? t("admin.saving")
                : form.id
                  ? t("admin.saveChanges")
                  : t("admin.registerRequest")}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold"
              >
                {t("admin.cancelEdit")}
              </button>
            )}
          </div>
        </form>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        title={t("admin.transfersDeleteTitle")}
        itemName={
          pendingDelete ? `${pendingDelete.reference} — ${pendingDelete.recipient_name}` : undefined
        }
        description={t("admin.transfersDeleteDesc")}
        pending={remove.isPending}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) remove.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
