/**
 * Shared form styling tokens.
 * All inputs, labels, helper text and validation errors across the app use
 * these so contrast stays consistent (see form-* utilities in src/styles.css).
 */
export const labelClass = "form-label mb-2";

export const hintClass = "form-hint";

export const errorClass = "form-error mt-1 block";

export const fieldClass = "form-field rounded-xl px-4 py-3 text-sm transition";

export const fieldClassSm = "form-field rounded-lg px-3 py-2 text-sm transition";

/** Adds the invalid state to a field class when an error message is present. */
export function fieldWithError(base: string, error?: string | undefined) {
  return error ? `${base} form-field-invalid` : base;
}
