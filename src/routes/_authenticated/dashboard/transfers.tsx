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
import { fieldErrorMap, friendlyError, parseNum, transferSchema, transferStatuses } from "@/lib/validation";
import { faNum, site, statusLabels } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/dashboard/transfers")({
  head: () => ({
    meta: [
      { title: `درخواست‌های حواله | ${site.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TransfersPage,
});

const statusOptions = transferStatuses.map((status) => ({
  value: status,
  label: statusLabels[status] ?? status,
}));

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<Transfer | null>(null);

  const transfers = useQuery({
    queryKey: ["admin-transfers"],
    queryFn: listAdminTransfers,
  });
  const rates = useQuery(ratesQuery);

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
        throw new Error("اطلاعات فرم را بررسی کنید");
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
          ? "درخواست حواله ویرایش شد"
          : data?.reference
            ? `درخواست با کد ${data.reference} ثبت شد`
            : "درخواست حواله ثبت شد",
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
      toast.success("درخواست حواله حذف شد");
      setForm((prev) => (prev.id ? emptyForm : prev));
      invalidate();
    },
    onError: () => toast.error("حذف درخواست ممکن نشد"),
  });

  const setStatus = useMutation({
    mutationFn: async (vars: { id: string; status: string }) => {
      const result = await updateTransferStatus({ data: vars });
      if (!result.ok) throw new Error(result.message);
    },
    onSuccess: () => {
      toast.success("وضعیت درخواست بروزرسانی شد");
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
      toast.success("یادداشت ذخیره شد");
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
        <h1 className="text-2xl font-extrabold">درخواست‌های حواله</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          درخواست تازه ثبت کنید، ویرایش یا حذف کنید، وضعیت را به‌روزرسانی کنید و برای مشتری یادداشت بگذارید.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-4 p-5 card-elevated sm:grid-cols-2 sm:items-end">
            <TextField
              label="جست‌وجو"
              fieldSize="sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="کد پیگیری، گیرنده یا مقصد"
            />
            <div>
              <p className="form-label mb-2">فیلتر وضعیت</p>
              <AppSelect
                size="sm"
                ariaLabel="فیلتر وضعیت"
                value={filter}
                onValueChange={setFilter}
                options={[{ value: "all", label: "همه وضعیت‌ها" }, ...statusOptions]}
              />
            </div>
          </div>

          <div className="space-y-3">
            {transfers.isLoading && (
              <p className="rounded-xl bg-secondary p-5 text-sm text-muted-foreground">
                در حال بارگذاری…
              </p>
            )}
            {!transfers.isLoading && rows.length === 0 && (
              <p className="rounded-xl bg-secondary p-6 text-sm text-muted-foreground">
                درخواستی یافت نشد.
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
                          در حال ویرایش
                        </span>
                      )}
                    </p>
                    <p className="mt-1 font-bold">
                      {faNum(item.amount)} <span dir="ltr">{item.from_currency}</span> →{" "}
                      <span dir="ltr">{item.to_currency}</span>
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      گیرنده: {item.recipient_name} — {item.recipient_detail}
                    </p>
                    <p className="text-sm text-muted-foreground">مقصد: {item.destination_fa}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                      >
                        <Pencil className="size-3.5" /> ویرایش
                      </button>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => setPendingDelete(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60"
                      >
                        <Trash2 className="size-3.5" /> حذف
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <AppSelect
                      size="sm"
                      ariaLabel={`وضعیت درخواست ${item.reference}`}
                      value={item.status}
                      options={statusOptions}
                      onValueChange={(status) => setStatus.mutate({ id: item.id, status })}
                    />
                    <textarea
                      className={`${fieldClassSm} min-h-20`}
                      placeholder="یادداشت برای مشتری"
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
          <h2 className="text-base font-bold">{form.id ? "ویرایش درخواست" : "ثبت درخواست تازه"}</h2>
          <SelectField
            label="ارز مبدا"
            value={form.from_currency}
            options={currencyOptions}
            error={errors["from_currency"]}
            onValueChange={(value) => update("from_currency", value)}
          />
          <SelectField
            label="ارز مقصد"
            value={form.to_currency}
            options={currencyOptions}
            error={errors["to_currency"]}
            onValueChange={(value) => update("to_currency", value)}
          />
          <TextField
            label="مبلغ"
            inputMode="decimal"
            hint="مبلغ را به عدد وارد کنید"
            value={form.amount}
            error={errors["amount"]}
            onChange={(event) => update("amount", event.target.value)}
          />
          <SearchableSelectField
            label="کشور مقصد"
            hint="فقط کشورهای مربوط به ارزهای فعال"
            value={form.destination_fa}
            error={errors["destination_fa"]}
            options={destinationOptions}
            placeholder="انتخاب کشور"
            searchPlaceholder="جست‌وجوی کشور…"
            onValueChange={(value) => update("destination_fa", value)}
          />
          <TextField
            label="نام گیرنده"
            maxLength={120}
            value={form.recipient_name}
            error={errors["recipient_name"]}
            onChange={(event) => update("recipient_name", event.target.value)}
          />
          <TextField
            label="مشخصات حساب گیرنده"
            maxLength={300}
            value={form.recipient_detail}
            error={errors["recipient_detail"]}
            onChange={(event) => update("recipient_detail", event.target.value)}
          />
          <TextAreaField
            label="توضیحات (اختیاری)"
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
              {save.isPending ? "در حال ذخیره…" : form.id ? "ذخیره تغییرات" : "ثبت درخواست"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold"
              >
                لغو ویرایش
              </button>
            )}
          </div>
        </form>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        title="حذف درخواست حواله"
        itemName={pendingDelete ? `${pendingDelete.reference} — ${pendingDelete.recipient_name}` : undefined}
        description="این درخواست برای همیشه حذف می‌شود و دیگر قابل بازیابی نیست."
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
