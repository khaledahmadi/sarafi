const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function toAsciiYear(value: string): number {
  const normalized = value.replace(/[۰-۹]/g, (digit) => String(FA_DIGITS.indexOf(digit)));
  return Number(normalized.trim());
}

/** Years since the Gregorian founding year. Invalid years return 0. */
export function yearsOfExperience(foundedYear: string, now = new Date()): number {
  const year = toAsciiYear(foundedYear);
  const current = now.getFullYear();
  if (!Number.isFinite(year) || year < 1900 || year > current) return 0;
  return current - year;
}
