export function whatsappDigits(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function whatsappHref(phone: string, text?: string): string | null {
  const digits = whatsappDigits(phone);
  if (digits.length < 8) return null;
  const url = new URL(`https://wa.me/${digits}`);
  const message = text?.trim();
  if (message) url.searchParams.set("text", message);
  return url.toString();
}
