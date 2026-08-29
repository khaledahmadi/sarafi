import { z } from "zod";

/**
 * Shared validation schemas with Persian, user-friendly messages.
 * Used by BOTH the client forms and the server functions so the rules
 * can never drift apart.
 */

export const currencyCode = z
  .string()
  .trim()
  .regex(/^[A-Z]{3,8}$/, "کد ارز نامعتبر است");

export const transferSchema = z.object({
  from_currency: currencyCode,
  to_currency: currencyCode,
  amount: z
    .number({ invalid_type_error: "مبلغ را به صورت عدد وارد کنید", required_error: "مبلغ را وارد کنید" })
    .finite("مبلغ را به صورت عدد وارد کنید")
    .positive("مبلغ باید بیشتر از صفر باشد")
    .max(100_000_000, "مبلغ وارد شده بیش از حد مجاز است"),
  destination_fa: z
    .string()
    .trim()
    .min(2, "کشور مقصد را انتخاب کنید")
    .max(80, "نام مقصد بیش از حد طولانی است"),
  recipient_name: z
    .string()
    .trim()
    .min(3, "نام گیرنده را کامل وارد کنید")
    .max(120, "نام گیرنده بیش از حد طولانی است"),
  recipient_detail: z
    .string()
    .trim()
    .min(3, "مشخصات حساب گیرنده را وارد کنید")
    .max(300, "مشخصات حساب بیش از حد طولانی است"),
  note: z.string().trim().max(500, "توضیحات حداکثر ۵۰۰ حرف باشد").optional(),
});

export type TransferInput = z.infer<typeof transferSchema>;

export const transferStatusSchema = z.enum(
  ["pending", "in_review", "processing", "completed", "rejected", "cancelled"],
  { invalid_type_error: "وضعیت انتخاب‌شده نامعتبر است" },
);

export const transferStatuses = transferStatusSchema.options;

export const uuidSchema = z.string().uuid("شناسه نامعتبر است");

const buyRateNumber = z
  .number({ invalid_type_error: "نرخ خرید را به صورت عدد وارد کنید", required_error: "نرخ خرید را وارد کنید" })
  .finite("نرخ خرید را به صورت عدد وارد کنید")
  .positive("نرخ خرید باید بیشتر از صفر باشد")
  .max(100_000_000, "نرخ خرید بیش از حد مجاز است");

const sellRateNumber = z
  .number({ invalid_type_error: "نرخ فروش را به صورت عدد وارد کنید", required_error: "نرخ فروش را وارد کنید" })
  .finite("نرخ فروش را به صورت عدد وارد کنید")
  .positive("نرخ فروش باید بیشتر از صفر باشد")
  .max(100_000_000, "نرخ فروش بیش از حد مجاز است");

export const rateSchema = z
  .object({
    id: uuidSchema,
    buy_rate: buyRateNumber,
    sell_rate: sellRateNumber,
  })
  .refine((v) => v.sell_rate >= v.buy_rate, {
    message: "نرخ فروش نمی‌تواند کمتر از نرخ خرید باشد",
    path: ["sell_rate"],
  });

export const staffNoteSchema = z.object({
  id: uuidSchema,
  staff_note: z.string().trim().max(500, "یادداشت حداکثر ۵۰۰ حرف باشد"),
});

export const appRoleSchema = z.enum(["admin", "staff", "customer"], {
  invalid_type_error: "نقش انتخاب‌شده نامعتبر است",
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "نام و تخلص را وارد کنید").max(100, "نام بیش از حد طولانی است"),
  phone: z
    .string()
    .trim()
    .min(6, "شماره تماس معتبر وارد کنید")
    .max(24, "شماره تماس بیش از حد طولانی است")
    .regex(/^[\d+\-\s()]+$/, "شماره تماس فقط می‌تواند رقم و علائم + - ( ) باشد"),
  message: z
    .string()
    .trim()
    .min(10, "متن پیام حداقل ۱۰ حرف باشد")
    .max(1000, "متن پیام حداکثر ۱۰۰۰ حرف باشد"),
});

export const emailSchema = z
  .string()
  .trim()
  .min(1, "ایمیل را وارد کنید")
  .email("ایمیل معتبر وارد کنید")
  .max(255, "ایمیل بیش از حد طولانی است");

export const passwordSchema = z
  .string()
  .min(6, "رمز عبور حداقل ۶ حرف باشد")
  .max(72, "رمز عبور حداکثر ۷۲ حرف باشد");

export const createAdminUserSchema = z.object({
  full_name: z.string().trim().min(3, "نام و تخلص را کامل وارد کنید").max(255, "نام بیش از حد طولانی است"),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .max(64, "شماره تماس بیش از حد طولانی است")
    .refine(
      (value) => value === "" || (/^[\d+\-\s()]+$/.test(value) && value.replace(/\D/g, "").length >= 6),
      "شماره تماس معتبر وارد کنید",
    ),
  password: passwordSchema,
  role: z.enum(["staff", "customer"], { invalid_type_error: "نقش انتخاب‌شده نامعتبر است" }),
});

/** Flattens a ZodError into a { field: message } map (first error per field). */
export function fieldErrorMap(error: z.ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!map[key]) map[key] = issue.message;
  }
  return map;
}

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/** Turns a raw error (DB/network) into a friendly Persian message. */
export function friendlyError(message: string | undefined): string {
  const raw = (message ?? "").toLowerCase();
  if (!raw) return "خطای نامشخص رخ داد. لطفاً دوباره تلاش کنید.";
  if (raw.includes("permission") || raw.includes("row-level") || raw.includes("policy")) {
    return "شما دسترسی لازم برای این عملیات را ندارید.";
  }
  if (raw.includes("duplicate") || raw.includes("unique")) {
    return "این اطلاعات از قبل ثبت شده است.";
  }
  if (raw.includes("network") || raw.includes("fetch")) {
    return "ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.";
  }
  if (raw.includes("invalid login") || raw.includes("credentials")) {
    return "ایمیل یا رمز عبور نادرست است.";
  }
  if (raw.includes("already registered") || raw.includes("user already")) {
    return "این ایمیل قبلاً ثبت شده است. وارد شوید.";
  }
  return "انجام عملیات ممکن نشد. لطفاً دوباره تلاش کنید.";
}

/** Parses a Persian/Arabic-digit numeric string into a JS number. */
export function parseNum(value: string): number {
  const normalized = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,\s]/g, "")
    .trim();
  if (!normalized) return NaN;
  return Number(normalized);
}

/** Keeps only digits and a single decimal point (Persian/Arabic digits allowed). */
export function sanitizeDecimalInput(value: string): string {
  const normalized = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/[^\d.]/g, "");
  const separator = normalized.indexOf(".");
  if (separator === -1) return normalized;
  return `${normalized.slice(0, separator + 1)}${normalized.slice(separator + 1).replace(/\./g, "")}`;
}

export function validateRateField(
  value: string,
  field: "buy_rate" | "sell_rate",
): string | undefined {
  if (!value.trim()) {
    return field === "buy_rate" ? "نرخ خرید را وارد کنید" : "نرخ فروش را وارد کنید";
  }
  const parsed = parseNum(value);
  const schema = field === "buy_rate" ? buyRateNumber : sellRateNumber;
  const result = schema.safeParse(parsed);
  return result.success ? undefined : result.error.issues[0]?.message;
}

export function validateRatePair(
  buy: string,
  sell: string,
): { buy_rate?: string; sell_rate?: string } {
  const buy_rate = validateRateField(buy, "buy_rate");
  const sell_rate = validateRateField(sell, "sell_rate");
  if (buy_rate || sell_rate) {
    return {
      ...(buy_rate ? { buy_rate } : {}),
      ...(sell_rate ? { sell_rate } : {}),
    };
  }
  if (parseNum(sell) < parseNum(buy)) {
    return { sell_rate: "نرخ فروش نمی‌تواند کمتر از نرخ خرید باشد" };
  }
  return {};
}

export const slugSchema = z
  .string()
  .trim()
  .min(3, "نشانی مقاله حداقل ۳ حرف باشد")
  .max(90, "نشانی مقاله بیش از حد طولانی است")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "نشانی فقط با حروف کوچک انگلیسی، رقم و خط تیره");

export const articleSchema = z.object({
  id: uuidSchema.optional(),
  slug: slugSchema,
  title_fa: z
    .string()
    .trim()
    .min(5, "عنوان مقاله حداقل ۵ حرف باشد")
    .max(160, "عنوان مقاله حداکثر ۱۶۰ حرف باشد"),
  excerpt_fa: z
    .string()
    .trim()
    .min(20, "خلاصه مقاله حداقل ۲۰ حرف باشد")
    .max(300, "خلاصه مقاله حداکثر ۳۰۰ حرف باشد"),
  body_fa: z.string().trim().min(1, "متن مقاله را وارد کنید").max(60_000, "متن مقاله بیش از حد طولانی است"),
  cover_url: z
    .string()
    .trim()
    .max(500, "نشانی تصویر بیش از حد طولانی است")
    .refine(
      (value) =>
        value === "" ||
        value.startsWith("/uploads/") ||
        /^https?:\/\//i.test(value),
      "نشانی تصویر معتبر نیست",
    )
    .optional(),
  is_published: z.boolean(),
});

export type ArticleInput = z.infer<typeof articleSchema>;

export function feedbackSchema(isLoggedIn: boolean) {
  return z.object({
    body: z
      .string()
      .trim()
      .min(1, "متن بازخورد را بنویسید")
      .max(2000, "متن بازخورد حداکثر ۲۰۰۰ حرف باشد"),
    rating: z.number().int().min(1, "امتیاز را انتخاب کنید").max(5, "امتیاز باید بین ۱ تا ۵ باشد"),
    guest_name: isLoggedIn
      ? z.string().trim().max(120).optional()
      : z.string().trim().min(2, "نام را وارد کنید").max(120, "نام بیش از حد طولانی است"),
    guest_email: isLoggedIn ? z.string().trim().max(255).optional() : emailSchema,
  });
}

export type FeedbackInput = z.infer<ReturnType<typeof feedbackSchema>>;

export function commentSchema(isLoggedIn: boolean) {
  return z.object({
    body: z
      .string()
      .trim()
      .min(1, "نظر شما را بنویسید")
      .max(5000, "متن نظر حداکثر ۵۰۰۰ حرف باشد"),
    guest_name: isLoggedIn
      ? z.string().trim().max(120).optional()
      : z.string().trim().min(2, "نام را وارد کنید").max(120, "نام بیش از حد طولانی است"),
    guest_email: isLoggedIn ? z.string().trim().max(255).optional() : emailSchema,
  });
}

const FA_LATIN: Record<string, string> = {
  ا: "a",
  آ: "a",
  ب: "b",
  پ: "p",
  ت: "t",
  ث: "s",
  ج: "j",
  چ: "ch",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "z",
  ر: "r",
  ز: "z",
  ژ: "zh",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "z",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ک: "k",
  ك: "k",
  گ: "g",
  ل: "l",
  م: "m",
  ن: "n",
  و: "v",
  ه: "h",
  ی: "y",
  ي: "y",
  ء: "",
  ئ: "y",
  ؤ: "v",
  ة: "h",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

/** Builds a URL-safe slug from a Persian or English title. */
export function suggestSlug(title: string): string {
  const transliterated = [...title.toLowerCase()].map((ch) => FA_LATIN[ch] ?? ch).join("");
  const slug = transliterated
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
  return slug.length >= 3 ? slug : slug ? `${slug}-item` : "item";
}

export function uniqueSlug(title: string, taken: string[]): string {
  const takenSet = new Set(taken.map((value) => value.toLowerCase()));
  const base = suggestSlug(title);
  if (!takenSet.has(base)) return base;
  for (let index = 2; index < 1000; index += 1) {
    const suffix = `-${index}`;
    const candidate = `${base.slice(0, 90 - suffix.length)}${suffix}`;
    if (!takenSet.has(candidate)) return candidate;
  }
  return `${base.slice(0, 76)}-${Date.now()}`;
}

/* ---------- Public content managed from the admin panel ---------- */

export const serviceSchema = z.object({
  id: uuidSchema.optional(),
  slug: slugSchema,
  title_fa: z.string().trim().min(3, "عنوان خدمت حداقل ۳ حرف باشد").max(120, "عنوان خدمت حداکثر ۱۲۰ حرف باشد"),
  summary_fa: z
    .string()
    .trim()
    .min(10, "توضیح خدمت حداقل ۱۰ حرف باشد")
    .max(400, "توضیح خدمت حداکثر ۴۰۰ حرف باشد"),
  icon: z.string().trim().min(2, "آیکون را انتخاب کنید").max(40, "نام آیکون نامعتبر است"),
  sort_order: z.number().int("ترتیب باید عدد صحیح باشد").min(0, "ترتیب نمی‌تواند منفی باشد").max(999, "ترتیب بیش از حد بزرگ است"),
  is_active: z.boolean(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export const faqSchema = z.object({
  id: uuidSchema.optional(),
  question: z.string().trim().min(3, "سؤال حداقل ۳ حرف باشد").max(200, "سؤال حداکثر ۲۰۰ حرف باشد"),
  answer: z.string().trim().min(3, "پاسخ حداقل ۳ حرف باشد").max(2000, "پاسخ حداکثر ۲۰۰۰ حرف باشد"),
  keywords: z.string().trim().max(300, "کلمات کلیدی حداکثر ۳۰۰ حرف باشد").optional().or(z.literal("")),
  sort_order: z.number().int("ترتیب باید عدد صحیح باشد").min(0).max(999),
  is_active: z.boolean(),
});

export type FaqInput = z.infer<typeof faqSchema>;

export const serviceIcons = [
  "send", "wallet", "coins", "globe", "briefcase", "landmark", "message-circle",
] as const;

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(""));

export const branchSchema = z.object({
  id: uuidSchema.optional(),
  name_fa: z.string().trim().min(3, "نام نمایندگی حداقل ۳ حرف باشد").max(120, "نام نمایندگی حداکثر ۱۲۰ حرف باشد"),
  city_fa: z.string().trim().min(2, "شهر را وارد کنید").max(80, "نام شهر بیش از حد طولانی است"),
  country_fa: z.string().trim().min(2, "کشور را وارد کنید").max(80, "نام کشور بیش از حد طولانی است"),
  address_fa: optionalText(300, "آدرس حداکثر ۳۰۰ حرف باشد"),
  phone: optionalText(30, "شماره تماس حداکثر ۳۰ حرف باشد"),
  whatsapp: optionalText(30, "شماره واتساپ حداکثر ۳۰ حرف باشد"),
  map_url: z
    .string()
    .trim()
    .url("نشانی نقشه معتبر نیست")
    .max(500, "نشانی نقشه بیش از حد طولانی است")
    .optional()
    .or(z.literal("")),
  sort_order: z.number().int("ترتیب باید عدد صحیح باشد").min(0, "ترتیب نمی‌تواند منفی باشد").max(999, "ترتیب بیش از حد بزرگ است"),
});

export type BranchInput = z.infer<typeof branchSchema>;

export const currencySchema = z
  .object({
    id: uuidSchema.optional(),
    code: currencyCode,
    name_fa: z.string().trim().min(2, "نام ارز را وارد کنید").max(80, "نام ارز بیش از حد طولانی است"),
    flag: optionalText(8, "پرچم حداکثر ۸ حرف باشد"),
    buy_rate: buyRateNumber,
    sell_rate: sellRateNumber,
    is_active: z.boolean(),
  })
  .refine((v) => v.sell_rate >= v.buy_rate, {
    message: "نرخ فروش نمی‌تواند کمتر از نرخ خرید باشد",
    path: ["sell_rate"],
  });

export type CurrencyInput = z.infer<typeof currencySchema>;

export const settingsSchema = z.object({
  values: z
    .array(
      z.object({
        key: z.string().trim().min(1, "کلید نامعتبر است").max(80, "کلید نامعتبر است"),
        value: z.string().max(8000, "متن وارد شده بیش از حد طولانی است"),
      }),
    )
    .min(1, "تغییری برای ذخیره وجود ندارد")
    .max(80, "تعداد فیلدها بیش از حد مجاز است"),
});
