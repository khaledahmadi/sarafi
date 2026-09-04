import { z } from "zod";
import type { TranslateFn } from "@/i18n/translate";

/**
 * Shared validation schemas.
 * Zod issue messages are i18n keys (`validation.*`); translate with
 * `fieldErrorMap(error, t)` / `translateFieldErrors(map, t)` before display.
 */

export const currencyCode = z
  .string()
  .trim()
  .regex(/^[A-Z]{3,8}$/, "validation.invalidCurrency");

export const transferSchema = z.object({
  from_currency: currencyCode,
  to_currency: currencyCode,
  amount: z
    .number({
      invalid_type_error: "validation.amountNumber",
      required_error: "validation.amountRequired",
    })
    .finite("validation.amountNumber")
    .positive("validation.amountPositive")
    .max(100_000_000, "validation.amountTooLarge"),
  destination_fa: z
    .string()
    .trim()
    .min(2, "validation.destinationRequired")
    .max(80, "validation.destinationTooLong"),
  recipient_name: z
    .string()
    .trim()
    .min(3, "validation.recipientNameMin")
    .max(120, "validation.recipientNameTooLong"),
  recipient_detail: z
    .string()
    .trim()
    .min(3, "validation.recipientDetailMin")
    .max(300, "validation.recipientDetailTooLong"),
  note: z.string().trim().max(500, "validation.noteTooLong").optional(),
});

export type TransferInput = z.infer<typeof transferSchema>;

export const transferStatusSchema = z.enum(
  ["pending", "in_review", "processing", "completed", "rejected", "cancelled"],
  { invalid_type_error: "validation.invalidStatus" },
);

export const transferStatuses = transferStatusSchema.options;

export const uuidSchema = z.string().uuid("validation.invalidId");

const buyRateNumber = z
  .number({
    invalid_type_error: "validation.buyRateNumber",
    required_error: "validation.buyRateRequired",
  })
  .finite("validation.buyRateNumber")
  .positive("validation.buyRatePositive")
  .max(100_000_000, "validation.buyRateTooLarge");

const sellRateNumber = z
  .number({
    invalid_type_error: "validation.sellRateNumber",
    required_error: "validation.sellRateRequired",
  })
  .finite("validation.sellRateNumber")
  .positive("validation.sellRatePositive")
  .max(100_000_000, "validation.sellRateTooLarge");

export const rateSchema = z
  .object({
    id: uuidSchema,
    buy_rate: buyRateNumber,
    sell_rate: sellRateNumber,
  })
  .refine((v) => v.sell_rate >= v.buy_rate, {
    message: "validation.sellBelowBuy",
    path: ["sell_rate"],
  });

export const staffNoteSchema = z.object({
  id: uuidSchema,
  staff_note: z.string().trim().max(500, "validation.staffNoteTooLong"),
});

export const appRoleSchema = z.enum(["admin", "staff", "customer"], {
  invalid_type_error: "validation.invalidRole",
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "validation.nameMin").max(100, "validation.nameTooLong"),
  phone: z
    .string()
    .trim()
    .min(6, "validation.phoneMin")
    .max(24, "validation.phoneTooLong")
    .regex(/^[\d+\-\s()]+$/, "validation.phoneFormat"),
  message: z
    .string()
    .trim()
    .min(10, "validation.messageMin")
    .max(1000, "validation.messageMax"),
});

export const emailSchema = z
  .string()
  .trim()
  .min(1, "validation.emailRequired")
  .email("validation.invalidEmail")
  .max(255, "validation.emailTooLong");

export const passwordSchema = z
  .string()
  .min(6, "validation.passwordMin")
  .max(72, "validation.passwordMax");

export const createAdminUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "validation.fullNameMin")
    .max(255, "validation.fullNameTooLong"),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .max(64, "validation.phoneTooLong")
    .refine(
      (value) =>
        value === "" || (/^[\d+\-\s()]+$/.test(value) && value.replace(/\D/g, "").length >= 6),
      "validation.phoneMin",
    ),
  password: passwordSchema,
  role: z.enum(["staff", "customer"], { invalid_type_error: "validation.invalidRole" }),
});

const MESSAGE_KEY_RE = /^(validation|admin|auth|media)\./;

/** Maps legacy Persian/English API strings to i18n keys (transition + older responses). */
const LEGACY_VALIDATION_MESSAGES: Record<string, string> = {
  "کد ارز نامعتبر است": "validation.invalidCurrency",
  "مبلغ را به صورت عدد وارد کنید": "validation.amountNumber",
  "مبلغ را وارد کنید": "validation.amountRequired",
  "مبلغ باید بیشتر از صفر باشد": "validation.amountPositive",
  "مبلغ وارد شده بیش از حد مجاز است": "validation.amountTooLarge",
  "کشور مقصد را انتخاب کنید": "validation.destinationRequired",
  "نام مقصد بیش از حد طولانی است": "validation.destinationTooLong",
  "نام گیرنده را کامل وارد کنید": "validation.recipientNameMin",
  "نام گیرنده بیش از حد طولانی است": "validation.recipientNameTooLong",
  "مشخصات حساب گیرنده را وارد کنید": "validation.recipientDetailMin",
  "مشخصات حساب بیش از حد طولانی است": "validation.recipientDetailTooLong",
  "توضیحات حداکثر ۵۰۰ حرف باشد": "validation.noteTooLong",
  "وضعیت انتخاب‌شده نامعتبر است": "validation.invalidStatus",
  "شناسه نامعتبر است": "validation.invalidId",
  "نرخ خرید را به صورت عدد وارد کنید": "validation.buyRateNumber",
  "نرخ خرید را وارد کنید": "validation.buyRateRequired",
  "نرخ خرید باید بیشتر از صفر باشد": "validation.buyRatePositive",
  "نرخ خرید بیش از حد مجاز است": "validation.buyRateTooLarge",
  "نرخ فروش را به صورت عدد وارد کنید": "validation.sellRateNumber",
  "نرخ فروش را وارد کنید": "validation.sellRateRequired",
  "نرخ فروش باید بیشتر از صفر باشد": "validation.sellRatePositive",
  "نرخ فروش بیش از حد مجاز است": "validation.sellRateTooLarge",
  "نرخ فروش نمی‌تواند کمتر از نرخ خرید باشد": "validation.sellBelowBuy",
  "یادداشت حداکثر ۵۰۰ حرف باشد": "validation.staffNoteTooLong",
  "نقش انتخاب‌شده نامعتبر است": "validation.invalidRole",
  "نام و تخلص را وارد کنید": "validation.nameMin",
  "نام بیش از حد طولانی است": "validation.nameTooLong",
  "شماره تماس معتبر وارد کنید": "validation.phoneMin",
  "شماره تماس بیش از حد طولانی است": "validation.phoneTooLong",
  "شماره تماس فقط می‌تواند رقم و علائم + - ( ) باشد": "validation.phoneFormat",
  "متن پیام حداقل ۱۰ حرف باشد": "validation.messageMin",
  "متن پیام حداکثر ۱۰۰۰ حرف باشد": "validation.messageMax",
  "ایمیل را وارد کنید": "validation.emailRequired",
  "ایمیل معتبر وارد کنید": "validation.invalidEmail",
  "ایمیل نامعتبر است": "validation.invalidEmail",
  "ایمیل بیش از حد طولانی است": "validation.emailTooLong",
  "رمز عبور حداقل ۶ حرف باشد": "validation.passwordMin",
  "رمز عبور حداکثر ۷۲ حرف باشد": "validation.passwordMax",
  "نام و تخلص را کامل وارد کنید": "validation.fullNameMin",
  "نشانی مقاله حداقل ۳ حرف باشد": "validation.slugMin",
  "نشانی مقاله بیش از حد طولانی است": "validation.slugTooLong",
  "نشانی فقط با حروف کوچک انگلیسی، رقم و خط تیره": "validation.slugFormat",
  "عنوان مقاله حداقل ۵ حرف باشد": "validation.articleTitleMin",
  "عنوان مقاله حداکثر ۱۶۰ حرف باشد": "validation.articleTitleMax",
  "خلاصه مقاله حداقل ۲۰ حرف باشد": "validation.articleExcerptMin",
  "خلاصه مقاله حداکثر ۳۰۰ حرف باشد": "validation.articleExcerptMax",
  "متن مقاله را وارد کنید": "validation.articleBodyRequired",
  "متن مقاله بیش از حد طولانی است": "validation.articleBodyTooLong",
  "متن مقاله حداقل ۳۰ حرف باشد": "validation.articleBodyMin",
  "نشانی تصویر بیش از حد طولانی است": "validation.coverUrlTooLong",
  "نشانی تصویر معتبر نیست": "validation.coverUrlInvalid",
  "متن بازخورد را بنویسید": "validation.feedbackBodyRequired",
  "متن بازخورد حداکثر ۲۰۰۰ حرف باشد": "validation.feedbackBodyMax",
  "امتیاز را انتخاب کنید": "validation.ratingRequired",
  "امتیاز باید بین ۱ تا ۵ باشد": "validation.ratingRange",
  "نام را وارد کنید": "validation.guestNameMin",
  "نظر شما را بنویسید": "validation.commentBodyRequired",
  "متن نظر را وارد کنید": "validation.commentBodyRequired",
  "متن نظر حداکثر ۵۰۰۰ حرف باشد": "validation.commentBodyMax",
  "متن نظر بیش از حد طولانی است": "validation.commentBodyMax",
  "عنوان خدمت حداقل ۳ حرف باشد": "validation.serviceTitleMin",
  "عنوان خدمت حداکثر ۱۲۰ حرف باشد": "validation.serviceTitleMax",
  "توضیح خدمت حداقل ۱۰ حرف باشد": "validation.serviceSummaryMin",
  "توضیح خدمت حداکثر ۴۰۰ حرف باشد": "validation.serviceSummaryMax",
  "آیکون را انتخاب کنید": "validation.iconRequired",
  "نام آیکون نامعتبر است": "validation.iconInvalid",
  "ترتیب باید عدد صحیح باشد": "validation.sortOrderInt",
  "ترتیب نمی‌تواند منفی باشد": "validation.sortOrderNegative",
  "ترتیب بیش از حد بزرگ است": "validation.sortOrderTooLarge",
  "سؤال حداقل ۳ حرف باشد": "validation.questionMin",
  "سؤال را وارد کنید": "validation.questionMin",
  "سؤال حداکثر ۲۰۰ حرف باشد": "validation.questionMax",
  "سؤال انگلیسی حداکثر ۲۰۰ حرف باشد": "validation.questionEnMax",
  "سؤال پشتو حداکثر ۲۰۰ حرف باشد": "validation.questionPsMax",
  "پاسخ حداقل ۳ حرف باشد": "validation.answerMin",
  "پاسخ را وارد کنید": "validation.answerMin",
  "پاسخ حداکثر ۲۰۰۰ حرف باشد": "validation.answerMax",
  "پاسخ انگلیسی حداکثر ۲۰۰۰ حرف باشد": "validation.answerEnMax",
  "پاسخ پشتو حداکثر ۲۰۰۰ حرف باشد": "validation.answerPsMax",
  "کلمات کلیدی حداکثر ۳۰۰ حرف باشد": "validation.keywordsMax",
  "نام نمایندگی حداقل ۳ حرف باشد": "validation.branchNameMin",
  "نام نمایندگی حداکثر ۱۲۰ حرف باشد": "validation.branchNameMax",
  "شهر را وارد کنید": "validation.cityRequired",
  "نام شهر بیش از حد طولانی است": "validation.cityTooLong",
  "کشور را وارد کنید": "validation.countryRequired",
  "نام کشور بیش از حد طولانی است": "validation.countryTooLong",
  "آدرس حداکثر ۳۰۰ حرف باشد": "validation.addressMax",
  "شماره تماس حداکثر ۳۰ حرف باشد": "validation.phoneMax30",
  "شماره واتساپ حداکثر ۳۰ حرف باشد": "validation.whatsappMax",
  "نشانی نقشه معتبر نیست": "validation.mapUrlInvalid",
  "نشانی نقشه بیش از حد طولانی است": "validation.mapUrlTooLong",
  "نام ارز را وارد کنید": "validation.currencyNameRequired",
  "نام ارز بیش از حد طولانی است": "validation.currencyNameTooLong",
  "پرچم حداکثر ۸ حرف باشد": "validation.flagTooLong",
  "کلید نامعتبر است": "validation.settingsKeyInvalid",
  "متن وارد شده بیش از حد طولانی است": "validation.settingsValueTooLong",
  "تغییری برای ذخیره وجود ندارد": "validation.settingsNoChanges",
  "تعداد فیلدها بیش از حد مجاز است": "validation.settingsTooManyFields",
  "این کد ارز قبلاً ثبت شده است": "admin.ratesCodeExists",
  "این نشانی قبلاً استفاده شده است": "validation.slugTaken",
  "ارز مقصد را متفاوت انتخاب کنید": "validation.toCurrencyDifferent",
  "این ایمیل قبلاً ثبت شده است": "validation.emailAlreadyRegistered",
  "این ایمیل قبلاً ثبت شده است. وارد شوید.": "validation.emailAlreadyRegistered",
  "نقش مدیر قابل انتخاب نیست": "validation.adminRoleNotAllowed",
  "ایجاد مدیر جدید مجاز نیست. تنها یک مدیر کافی است.": "validation.adminCreateForbidden",
  "اطلاعات فرم را بررسی کنید": "validation.formInvalid",
  "Enter your full name": "validation.fullNameMin",
  "Enter a valid phone number": "validation.phoneMin",
  "فایل تصویر خالی است": "media.emptyImage",
  "حجم تصویر نباید بیشتر از ۵ مگابایت باشد": "media.maxSize",
  "فقط تصویرهای JPG، PNG، WEBP یا GIF مجاز است": "media.invalidType",
};

export function resolveValidationMessage(message: string, t: TranslateFn): string {
  if (!message) return t("validation.unknownError");
  if (MESSAGE_KEY_RE.test(message)) return t(message);
  const mapped = LEGACY_VALIDATION_MESSAGES[message];
  if (mapped) return t(mapped);
  return message;
}

/** Flattens a ZodError into a { field: translatedMessage } map (first error per field). */
export function fieldErrorMap(error: z.ZodError, t: TranslateFn): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!map[key]) map[key] = resolveValidationMessage(issue.message, t);
  }
  return map;
}

/** Translates server/API fieldErrors that may be keys or legacy Persian strings. */
export function translateFieldErrors(
  errors: Record<string, string> | undefined | null,
  t: TranslateFn,
): Record<string, string> {
  if (!errors) return {};
  const map: Record<string, string> = {};
  for (const [key, message] of Object.entries(errors)) {
    map[key] = resolveValidationMessage(message, t);
  }
  return map;
}

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/** Maps a raw error (DB/network) to an i18n key. */
export function friendlyErrorKey(message: string | undefined): string {
  const raw = (message ?? "").toLowerCase();
  if (!raw) return "validation.unknownError";
  if (MESSAGE_KEY_RE.test(message ?? "")) return message as string;
  if (raw.includes("permission") || raw.includes("row-level") || raw.includes("policy")) {
    return "validation.permissionDenied";
  }
  if (raw.includes("duplicate") || raw.includes("unique")) {
    return "validation.duplicateEntry";
  }
  if (raw.includes("network") || raw.includes("fetch")) {
    return "validation.networkError";
  }
  if (raw.includes("invalid login") || raw.includes("credentials")) {
    return "auth.badCredentials";
  }
  if (raw.includes("already registered") || raw.includes("user already")) {
    return "validation.emailAlreadyRegistered";
  }
  const legacy = message ? LEGACY_VALIDATION_MESSAGES[message] : undefined;
  if (legacy) return legacy;
  return "validation.operationFailed";
}

/** Turns a raw error into a localized friendly message. */
export function friendlyError(message: string | undefined, t?: TranslateFn): string {
  const key = friendlyErrorKey(message);
  return t ? t(key) : key;
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
    return field === "buy_rate" ? "validation.buyRateRequired" : "validation.sellRateRequired";
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
    return { sell_rate: "validation.sellBelowBuy" };
  }
  return {};
}

/** Translates rate-pair validation keys for inline display. */
export function translateRatePairErrors(
  pair: { buy_rate?: string; sell_rate?: string },
  t: TranslateFn,
): { buy_rate?: string; sell_rate?: string } {
  return {
    ...(pair.buy_rate ? { buy_rate: resolveValidationMessage(pair.buy_rate, t) } : {}),
    ...(pair.sell_rate ? { sell_rate: resolveValidationMessage(pair.sell_rate, t) } : {}),
  };
}

export const slugSchema = z
  .string()
  .trim()
  .min(3, "validation.slugMin")
  .max(90, "validation.slugTooLong")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "validation.slugFormat");

export const articleSchema = z.object({
  id: uuidSchema.optional(),
  slug: slugSchema,
  title_fa: z
    .string()
    .trim()
    .min(5, "validation.articleTitleMin")
    .max(160, "validation.articleTitleMax"),
  excerpt_fa: z
    .string()
    .trim()
    .min(20, "validation.articleExcerptMin")
    .max(300, "validation.articleExcerptMax"),
  body_fa: z
    .string()
    .trim()
    .min(1, "validation.articleBodyRequired")
    .max(60_000, "validation.articleBodyTooLong"),
  cover_url: z
    .string()
    .trim()
    .max(500, "validation.coverUrlTooLong")
    .refine(
      (value) =>
        value === "" || value.startsWith("/uploads/") || /^https?:\/\//i.test(value),
      "validation.coverUrlInvalid",
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
      .min(1, "validation.feedbackBodyRequired")
      .max(2000, "validation.feedbackBodyMax"),
    rating: z
      .number()
      .int()
      .min(1, "validation.ratingRequired")
      .max(5, "validation.ratingRange"),
    guest_name: isLoggedIn
      ? z.string().trim().max(120).optional()
      : z
          .string()
          .trim()
          .min(2, "validation.guestNameMin")
          .max(120, "validation.nameTooLong"),
    guest_email: isLoggedIn ? z.string().trim().max(255).optional() : emailSchema,
  });
}

export type FeedbackInput = z.infer<ReturnType<typeof feedbackSchema>>;

export function commentSchema(isLoggedIn: boolean) {
  return z.object({
    body: z
      .string()
      .trim()
      .min(1, "validation.commentBodyRequired")
      .max(5000, "validation.commentBodyMax"),
    guest_name: isLoggedIn
      ? z.string().trim().max(120).optional()
      : z
          .string()
          .trim()
          .min(2, "validation.guestNameMin")
          .max(120, "validation.nameTooLong"),
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
  title_fa: z
    .string()
    .trim()
    .min(3, "validation.serviceTitleMin")
    .max(120, "validation.serviceTitleMax"),
  summary_fa: z
    .string()
    .trim()
    .min(10, "validation.serviceSummaryMin")
    .max(400, "validation.serviceSummaryMax"),
  icon: z.string().trim().min(2, "validation.iconRequired").max(40, "validation.iconInvalid"),
  sort_order: z
    .number()
    .int("validation.sortOrderInt")
    .min(0, "validation.sortOrderNegative")
    .max(999, "validation.sortOrderTooLarge"),
  is_active: z.boolean(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export const faqSchema = z.object({
  id: uuidSchema.optional(),
  question: z
    .string()
    .trim()
    .min(3, "validation.questionMin")
    .max(200, "validation.questionMax"),
  question_en: z.string().trim().max(200, "validation.questionEnMax").optional().or(z.literal("")),
  question_ps: z.string().trim().max(200, "validation.questionPsMax").optional().or(z.literal("")),
  answer: z.string().trim().min(3, "validation.answerMin").max(2000, "validation.answerMax"),
  answer_en: z.string().trim().max(2000, "validation.answerEnMax").optional().or(z.literal("")),
  answer_ps: z.string().trim().max(2000, "validation.answerPsMax").optional().or(z.literal("")),
  keywords: z.string().trim().max(300, "validation.keywordsMax").optional().or(z.literal("")),
  sort_order: z.number().int("validation.sortOrderInt").min(0).max(999),
  is_active: z.boolean(),
});

export type FaqInput = z.infer<typeof faqSchema>;

export const serviceIcons = [
  "send",
  "wallet",
  "coins",
  "globe",
  "briefcase",
  "landmark",
  "message-circle",
] as const;

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(""));

export const branchSchema = z.object({
  id: uuidSchema.optional(),
  name_fa: z
    .string()
    .trim()
    .min(3, "validation.branchNameMin")
    .max(120, "validation.branchNameMax"),
  city_fa: z.string().trim().min(2, "validation.cityRequired").max(80, "validation.cityTooLong"),
  country_fa: z
    .string()
    .trim()
    .min(2, "validation.countryRequired")
    .max(80, "validation.countryTooLong"),
  address_fa: optionalText(300, "validation.addressMax"),
  phone: optionalText(30, "validation.phoneMax30"),
  whatsapp: optionalText(30, "validation.whatsappMax"),
  map_url: z
    .string()
    .trim()
    .url("validation.mapUrlInvalid")
    .max(500, "validation.mapUrlTooLong")
    .optional()
    .or(z.literal("")),
  sort_order: z
    .number()
    .int("validation.sortOrderInt")
    .min(0, "validation.sortOrderNegative")
    .max(999, "validation.sortOrderTooLarge"),
});

export type BranchInput = z.infer<typeof branchSchema>;

export const currencySchema = z
  .object({
    id: uuidSchema.optional(),
    code: currencyCode,
    name_fa: z
      .string()
      .trim()
      .min(2, "validation.currencyNameRequired")
      .max(80, "validation.currencyNameTooLong"),
    flag: optionalText(8, "validation.flagTooLong"),
    buy_rate: buyRateNumber,
    sell_rate: sellRateNumber,
    is_active: z.boolean(),
  })
  .refine((v) => v.sell_rate >= v.buy_rate, {
    message: "validation.sellBelowBuy",
    path: ["sell_rate"],
  });

export type CurrencyInput = z.infer<typeof currencySchema>;

export const settingsSchema = z.object({
  values: z
    .array(
      z.object({
        key: z.string().trim().min(1, "validation.settingsKeyInvalid").max(80, "validation.settingsKeyInvalid"),
        value: z.string().max(8000, "validation.settingsValueTooLong"),
      }),
    )
    .min(1, "validation.settingsNoChanges")
    .max(80, "validation.settingsTooManyFields"),
});
