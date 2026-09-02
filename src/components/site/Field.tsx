import * as React from "react";
import { Check, ChevronsUpDown, type LucideIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { errorClass, fieldWithError, hintClass, labelClass } from "@/lib/forms";
import { sanitizeDecimalInput } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n";

/**
 * Form primitives. Labels, placeholders, helper text and errors stay consistent.
 * Direction follows the active locale (rtl for fa/ps, ltr for en).
 */

type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string | undefined;
  error?: string | undefined;
  className?: string | undefined;
  children: React.ReactNode;
};

export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("text-start", className)}>
      <label className={labelClass} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <span className={errorClass} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className={`${hintClass} mt-1 block`}>{hint}</span>
      ) : null}
    </div>
  );
}

type TextFieldProps = Omit<React.ComponentProps<"input">, "size"> & {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  fieldSize?: "md" | "sm" | undefined;
};

const base = "form-field rounded-xl px-4 py-3 text-sm transition";
const baseSm = "form-field rounded-lg px-3 py-2 text-sm transition";

export function TextField({
  label,
  hint,
  error,
  fieldSize = "md",
  className,
  id,
  ...rest
}: TextFieldProps) {
  const { dir } = useLocale();
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  return (
    <Field label={label} htmlFor={fieldId} hint={hint} error={error}>
      <input
        id={fieldId}
        dir={dir}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(fieldWithError(fieldSize === "sm" ? baseSm : base, error), className)}
        {...rest}
      />
    </Field>
  );
}

type NumberFieldProps = Omit<TextFieldProps, "onChange" | "inputMode" | "type"> & {
  onValueChange: (value: string) => void;
  onValidate?: (value: string) => void;
};

export function NumberField({
  label,
  hint,
  error,
  fieldSize = "md",
  className,
  id,
  value,
  onValueChange,
  onValidate,
  ...rest
}: NumberFieldProps) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  const [touched, setTouched] = React.useState(false);

  function commit(next: string, shouldValidate: boolean) {
    onValueChange(next);
    if (shouldValidate) onValidate?.(next);
  }

  return (
    <Field label={label} htmlFor={fieldId} hint={hint} error={error}>
      <input
        id={fieldId}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        dir="ltr"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(
          fieldWithError(fieldSize === "sm" ? baseSm : base, error),
          "text-left tabular-nums",
          className,
        )}
        {...rest}
        value={value}
        onChange={(event) => commit(sanitizeDecimalInput(event.target.value), touched)}
        onBlur={() => {
          setTouched(true);
          commit(sanitizeDecimalInput(String(value ?? "")), true);
        }}
      />
    </Field>
  );
}

type TextAreaFieldProps = React.ComponentProps<"textarea"> & {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
};

export function TextAreaField({ label, hint, error, className, id, ...rest }: TextAreaFieldProps) {
  const { dir } = useLocale();
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  return (
    <Field label={label} htmlFor={fieldId} hint={hint} error={error}>
      <textarea
        id={fieldId}
        dir={dir}
        aria-invalid={Boolean(error)}
        className={cn(fieldWithError(base, error), "min-h-24 leading-7", className)}
        {...rest}
      />
    </Field>
  );
}

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
  keywords?: string;
  icon?: LucideIcon;
};

type AppSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  size?: "md" | "sm" | undefined;
  className?: string | undefined;
  ariaLabel?: string | undefined;
  id?: string | undefined;
  error?: string | undefined;
};

/** Accessible, styled dropdown (replaces native <select>). Direction follows locale. */
export function AppSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  size = "md",
  className,
  ariaLabel,
  id,
  error,
}: AppSelectProps) {
  const { t, dir } = useLocale();
  const resolvedPlaceholder = placeholder ?? t("common.selectPlaceholder");

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled ?? false} dir={dir}>
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={Boolean(error)}
        className={cn(
          fieldWithError(size === "sm" ? baseSm : base, error),
          "flex min-w-0 max-w-full items-center justify-between gap-2 overflow-hidden text-start font-medium data-[placeholder]:text-muted-foreground [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate [&>svg]:shrink-0",
          size === "sm" ? "h-10" : "h-12",
          className,
        )}
      >
        <SelectValue placeholder={resolvedPlaceholder} />
      </SelectTrigger>
      <SelectContent dir={dir} className="max-h-72 text-start">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-start">
            <span className="flex items-center gap-2">
              {option.icon ? <option.icon className="size-4 shrink-0" /> : null}
              <span className="flex flex-col items-start">
                <span>{option.label}</span>
                {option.hint && (
                  <span className="text-[11px] text-muted-foreground">{option.hint}</span>
                )}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type SelectFieldProps = AppSelectProps & {
  label: string;
  hint?: string | undefined;
};

export function SelectField({ label, hint, className, ...rest }: SelectFieldProps) {
  const autoId = React.useId();
  const fieldId = rest.id ?? autoId;
  return (
    <Field label={label} htmlFor={fieldId} hint={hint} error={rest.error} className={cn("min-w-0", className)}>
      <AppSelect {...rest} id={fieldId} />
    </Field>
  );
}

type SearchableSelectProps = AppSelectProps & {
  searchPlaceholder?: string | undefined;
};

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  disabled,
  size = "md",
  className,
  ariaLabel,
  id,
  error,
}: SearchableSelectProps) {
  const { t, dir } = useLocale();
  const resolvedPlaceholder = placeholder ?? t("common.selectPlaceholder");
  const resolvedSearch = searchPlaceholder ?? t("common.searchEllipsis");
  const [open, setOpen] = React.useState(false);
  const listId = React.useId();
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          aria-invalid={Boolean(error)}
          disabled={disabled ?? false}
          className={cn(
            fieldWithError(size === "sm" ? baseSm : base, error),
            "flex min-w-0 max-w-full items-center justify-between gap-2 overflow-hidden text-start font-medium",
            size === "sm" ? "h-10" : "h-12",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate">{selected?.label ?? resolvedPlaceholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        dir={dir}
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command dir={dir}>
          <CommandInput placeholder={resolvedSearch} aria-label={resolvedSearch} />
          <CommandList id={listId} role="listbox">
            <CommandEmpty>{t("common.noResults")}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.hint ?? ""} ${option.keywords ?? ""}`}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-col items-start">
                    <span>{option.label}</span>
                    {option.hint && (
                      <span className="text-[11px] text-muted-foreground">{option.hint}</span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type SearchableSelectFieldProps = SearchableSelectProps & {
  label: string;
  hint?: string | undefined;
};

export function SearchableSelectField({
  label,
  hint,
  className,
  ...rest
}: SearchableSelectFieldProps) {
  const autoId = React.useId();
  const fieldId = rest.id ?? autoId;
  return (
    <Field
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={rest.error}
      className={cn("min-w-0", className)}
    >
      <SearchableSelect {...rest} id={fieldId} />
    </Field>
  );
}
