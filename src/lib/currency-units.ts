/** Currencies quoted per 1,000 units on sarafi.af (IRR, PKR, JPY, INR). */
export const PER_1K_CURRENCY_CODES = new Set(["IRR", "PKR", "JPY", "INR"]);

export function currencyUnitSize(code: string): number {
  return PER_1K_CURRENCY_CODES.has(code) ? 1000 : 1;
}
