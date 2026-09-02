import type { Locale } from "@/i18n/config";
import { LOCALES } from "@/i18n/config";
import { pickLocalized } from "@/i18n/content";
import { formatNumber } from "@/i18n/format";
import { translate } from "@/i18n/translate";
import type { PublicFaq } from "@/lib/public.functions";

export const chatIntents = [
  "GREETING",
  "RATES",
  "TRANSFER",
  "BRANCHES",
  "HOURS",
  "CONTACT",
  "SERVICES",
  "ABOUT",
  "ARTICLES",
  "ACCOUNT",
  "FEEDBACK",
  "FALLBACK",
] as const;

export type ChatIntent = (typeof chatIntents)[number];

const liveIntents = [
  "GREETING",
  "RATES",
  "BRANCHES",
  "HOURS",
  "CONTACT",
  "SERVICES",
  "ABOUT",
  "ARTICLES",
  "ACCOUNT",
  "FEEDBACK",
] as const;

export type ChatRate = {
  code: string;
  name_fa: string;
  name_en?: string | null;
  name_ps?: string | null;
  flag?: string | null;
  buy_rate: number;
  sell_rate: number;
};

export type ChatBranch = {
  name_fa: string;
  name_en?: string | null;
  name_ps?: string | null;
  city_fa: string;
  city_en?: string | null;
  city_ps?: string | null;
  country_fa: string;
  country_en?: string | null;
  country_ps?: string | null;
  address_fa?: string | null;
  address_en?: string | null;
  address_ps?: string | null;
  phone?: string | null;
};

export type ChatService = {
  title_fa: string;
  title_en?: string | null;
  title_ps?: string | null;
  summary_fa?: string | null;
  summary_en?: string | null;
  summary_ps?: string | null;
};

export type ChatArticle = {
  title_fa: string;
  title_en?: string | null;
  title_ps?: string | null;
};

export type ChatFaq = {
  question: string;
  answer: string;
  keywords?: string | null;
};

export type ChatContext = {
  locale: Locale;
  brandName: string;
  tagline: string;
  description: string;
  phone: string;
  hours: string;
  address: string;
  email: string;
  whatsapp: string;
  rates: ChatRate[];
  branches: ChatBranch[];
  services: ChatService[];
  articles: ChatArticle[];
  faqs: ChatFaq[];
};

export type ChatReply = {
  text: string;
  rates?: ChatRate[];
};

const intentKeywords: Record<Exclude<ChatIntent, "FALLBACK">, string[]> = {
  GREETING: [
    "سلام",
    "درود",
    "صبح بخیر",
    "hello",
    "hi",
    "hey",
    "good morning",
    "ښه راغلاست",
    "سلام علیکم",
  ],
  RATES: [
    "نرخ",
    "قیمت",
    "اسعار",
    "دلار",
    "دالر",
    "یورو",
    "یوان",
    "تومان",
    "درهم",
    "پوند",
    "لیر",
    "روپیه",
    "خرید",
    "فروش",
    "rate",
    "rates",
    "exchange",
    "price",
    "currency",
    "today",
    "نرخونه",
    "بیه",
    "اسعارو",
    "پیرود",
    "پلور",
  ],
  TRANSFER: [
    "حواله",
    "ارسال پول",
    "انتقال",
    "علی پی",
    "علی‌پی",
    "ویچت",
    "وی‌چت",
    "transfer",
    "remittance",
    "send money",
    "submit",
    "ثبت",
  ],
  BRANCHES: [
    "نمایندگی",
    "نمایندګ",
    "شعبه",
    "دفتر",
    "آدرس",
    "کجا",
    "چیرته",
    "branch",
    "branches",
    "office",
    "location",
    "where",
    "address",
    "پته",
  ],
  HOURS: [
    "ساعت",
    "ساعات",
    "باز هستید",
    "کی باز",
    "hours",
    "open",
    "working hours",
    "schedule",
    "د کار ساعت",
    "خلاص",
  ],
  CONTACT: [
    "تماس",
    "تلفن",
    "شماره",
    "ایمیل",
    "واتساپ",
    "واتس",
    "contact",
    "phone",
    "email",
    "whatsapp",
    "call",
    "اړیکه",
    "تلیفون",
    "برېښنالیک",
  ],
  SERVICES: [
    "خدمات",
    "چه کاری",
    "چی کار",
    "services",
    "service",
    "offer",
    "what do you",
    "کوم خدمات",
  ],
  ABOUT: [
    "درباره",
    "کی هستید",
    "شما کی",
    "معرفی",
    "about",
    "who are you",
    "introduce",
    "زموږ په اړه",
  ],
  ARTICLES: [
    "مقاله",
    "مقالات",
    "وبلاگ",
    "اخبار",
    "راهنما",
    "article",
    "articles",
    "blog",
    "news",
    "guide",
    "لیکنه",
    "بلاګ",
  ],
  ACCOUNT: [
    "ورود",
    "وارد",
    "ثبت نام",
    "ثبت‌نام",
    "حساب",
    "پنل",
    "sign in",
    "login",
    "register",
    "account",
    "dashboard",
    "ننوتل",
  ],
  FEEDBACK: [
    "بازخورد",
    "نظر مشتری",
    "feedback",
    "review",
    "comment",
    "نظر",
  ],
};

const suggestionIntents: Array<{ intent: Exclude<ChatIntent, "FALLBACK">; key: string }> = [
  { intent: "RATES", key: "chat.suggestRatesText" },
  { intent: "TRANSFER", key: "chat.suggestTransferText" },
  { intent: "SERVICES", key: "chat.suggestServicesText" },
  { intent: "BRANCHES", key: "chat.suggestBranchesText" },
];

const rateAliases: Record<string, string[]> = {
  USD: ["usd", "dollar", "دلار", "دالر"],
  EUR: ["eur", "euro", "یورو"],
  CNY: ["cny", "yuan", "یوان"],
  IRR: ["irr", "toman", "تومان", "ریال"],
  AED: ["aed", "dirham", "درهم"],
  GBP: ["gbp", "pound", "پوند"],
  TRY: ["try", "lira", "لیر"],
  PKR: ["pkr", "rupee", "روپیه", "کلدار", "کالدار"],
  SEK: ["sek", "krona", "کرون"],
  AUD: ["aud", "دالر استرالیا", "استرالیا"],
};

function t(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  return translate(locale, key, vars);
}

export function normalizeChatText(text: string): string {
  return text
    .trim()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ۍ/g, "ی")
    .replace(/ګ/g, "گ")
    .toLowerCase();
}

function localizedRateName(rate: ChatRate, locale: Locale): string {
  return (
    pickLocalized(
      { name_fa: rate.name_fa, name_en: rate.name_en, name_ps: rate.name_ps },
      "name",
      locale,
    ) || rate.name_fa
  );
}

export function matchRates(text: string, rates: ChatRate[], locale: Locale): ChatRate[] {
  const query = normalizeChatText(text);
  if (!query || rates.length === 0) return [];
  return rates.filter((rate) => {
    const aliases = rateAliases[rate.code] ?? [];
    const tokens = [
      normalizeChatText(rate.code),
      normalizeChatText(rate.name_fa),
      normalizeChatText(localizedRateName(rate, locale)),
      ...aliases.map(normalizeChatText),
    ];
    return tokens.some((token) => token.length >= 2 && query.includes(token));
  });
}

export function matchFaq(text: string, faqs: ChatFaq[]): ChatFaq | null {
  const hit = scoreFaq(text, faqs);
  return hit && hit.score >= 3 ? hit.faq : null;
}

function scoreFaq(text: string, faqs: ChatFaq[]): { faq: ChatFaq; score: number } | null {
  const query = normalizeChatText(text);
  if (!query || faqs.length === 0) return null;

  let best: { faq: ChatFaq; score: number } | null = null;
  for (const faq of faqs) {
    const question = normalizeChatText(faq.question);
    let score = 0;
    if (query === question) score += 8;
    if (query.length >= 4 && (question.includes(query) || query.includes(question))) score += 5;
    const keywords = (faq.keywords ?? "")
      .split(/[،,]+/)
      .map((item) => normalizeChatText(item))
      .filter((item) => item.length >= 2);
    score += keywords.filter((keyword) => query.includes(keyword)).length * 3;
    const words = query.split(/\s+/).filter((word) => word.length >= 3);
    score += words.filter((word) => question.includes(word)).length;
    if (!best || score > best.score) best = { faq, score };
  }
  return best;
}

function isLiveIntent(intent: ChatIntent): intent is (typeof liveIntents)[number] {
  return (liveIntents as readonly ChatIntent[]).includes(intent);
}

function matchSuggestionIntent(text: string): ChatIntent | null {
  const query = normalizeChatText(text);
  if (!query) return null;

  for (const { intent, key } of suggestionIntents) {
    for (const locale of LOCALES) {
      const suggestion = normalizeChatText(translate(locale, key));
      if (!suggestion) continue;
      if (query === suggestion || query.includes(suggestion) || suggestion.includes(query)) {
        return intent;
      }
    }
  }
  return null;
}

export function answerChat(text: string, context: ChatContext): string {
  return composeChatReply(text, context).text;
}

export function composeChatReply(text: string, context: ChatContext): ChatReply {
  const intent = detectChatIntent(text);
  if (intent === "RATES") return replyToChat(intent, context, text);
  if (isLiveIntent(intent)) return replyToChat(intent, context, text);

  const faq = matchFaq(text, context.faqs);
  if (faq) return { text: faq.answer };

  return replyToChat(intent, context, text);
}

export function detectChatIntent(text: string): ChatIntent {
  const query = normalizeChatText(text);
  if (!query) return "FALLBACK";

  const fromSuggestion = matchSuggestionIntent(text);
  if (fromSuggestion) return fromSuggestion;

  const ranked = (Object.entries(intentKeywords) as Array<[Exclude<ChatIntent, "FALLBACK">, string[]]>)
    .map(([intent, keywords]) => ({
      intent,
      score: scoreIntent(intent, keywords, query),
    }))
    .filter((row) => row.score > 0)
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.intent ?? "FALLBACK";
}

function scoreIntent(
  intent: Exclude<ChatIntent, "FALLBACK">,
  keywords: string[],
  query: string,
): number {
  const hits = keywords.filter((keyword) => query.includes(normalizeChatText(keyword))).length;
  if (hits === 0) return 0;
  let score = hits;
  if (
    intent === "RATES" &&
    (query.includes("نرخ") ||
      query.includes("قیمت") ||
      query.includes("اسعار") ||
      query.includes("rate") ||
      query.includes("نرخونه"))
  ) {
    score += 3;
  }
  if (
    intent === "TRANSFER" &&
    (query.includes("حواله") || query.includes("transfer")) &&
    !query.includes("نرخ") &&
    !query.includes("rate")
  ) {
    score += 2;
  }
  if (
    intent === "BRANCHES" &&
    (query.includes("نمایند") || query.includes("branch") || query.includes("چیرته") || query.includes("where"))
  ) {
    score += 2;
  }
  return score;
}

function branchLine(branch: ChatBranch, locale: Locale): string {
  const name = pickLocalized(branch, "name", locale);
  const city = pickLocalized(branch, "city", locale);
  const country = pickLocalized(branch, "country", locale);
  const address = pickLocalized(branch, "address", locale);
  const place = [city, country].filter(Boolean).join(locale === "en" ? ", " : "، ");
  const extra = [address, branch.phone].filter(Boolean).join(" — ");
  return extra ? `• ${name} — ${place}\n  ${extra}` : `• ${name} — ${place}`;
}

function serviceLine(service: ChatService, locale: Locale): string {
  const title = pickLocalized(service, "title", locale);
  const summary = pickLocalized(service, "summary", locale);
  return summary ? `• ${title}: ${summary}` : `• ${title}`;
}

function articleLine(article: ChatArticle, locale: Locale): string {
  return `• ${pickLocalized(article, "title", locale)}`;
}

export function replyToChat(intent: ChatIntent, context: ChatContext, text = ""): ChatReply {
  const { locale } = context;

  switch (intent) {
    case "GREETING":
      return { text: t(locale, "chat.replies.greeting", { brand: context.brandName }) };
    case "RATES":
      return formatRatesReply(context, text);
    case "TRANSFER":
      return { text: t(locale, "chat.replies.transfer") };
    case "BRANCHES":
      if (context.branches.length === 0) {
        return { text: t(locale, "chat.replies.mainOffice", { address: context.address }) };
      }
      return {
        text: [
          t(locale, "chat.replies.branchesHeading"),
          ...context.branches.slice(0, 6).map((branch) => branchLine(branch, locale)),
          t(locale, "chat.replies.mainOffice", { address: context.address }),
        ].join("\n"),
      };
    case "HOURS":
      return { text: t(locale, "chat.replies.hours", { hours: context.hours }) };
    case "CONTACT":
      return {
        text: [
          t(locale, "chat.replies.phone", { phone: context.phone }),
          context.whatsapp ? t(locale, "chat.replies.whatsapp", { whatsapp: context.whatsapp }) : "",
          t(locale, "chat.replies.email", { email: context.email }),
          t(locale, "chat.replies.address", { address: context.address }),
          t(locale, "chat.replies.hours", { hours: context.hours }),
        ]
          .filter(Boolean)
          .join("\n"),
      };
    case "SERVICES":
      if (context.services.length === 0) {
        return { text: t(locale, "chat.replies.servicesEmpty") };
      }
      return {
        text: [
          t(locale, "chat.replies.servicesHeading"),
          ...context.services.slice(0, 8).map((service) => serviceLine(service, locale)),
        ].join("\n"),
      };
    case "ABOUT":
      return {
        text: [context.brandName, context.tagline, context.description].filter(Boolean).join("\n"),
      };
    case "ARTICLES":
      if (context.articles.length === 0) {
        return { text: t(locale, "chat.replies.articlesEmpty") };
      }
      return {
        text: [
          t(locale, "chat.replies.articlesHeading"),
          ...context.articles.slice(0, 5).map((article) => articleLine(article, locale)),
        ].join("\n"),
      };
    case "ACCOUNT":
      return { text: t(locale, "chat.replies.account") };
    case "FEEDBACK":
      return { text: t(locale, "chat.replies.feedback") };
    case "FALLBACK":
      if (context.faqs.length > 0) {
        return {
          text: [
            t(locale, "chat.replies.fallbackWithFaqs"),
            ...context.faqs.slice(0, 4).map((faq) => `• ${faq.question}`),
          ].join("\n"),
        };
      }
      return { text: t(locale, "chat.replies.fallback") };
    default: {
      const _never: never = intent;
      return _never;
    }
  }
}

function formatRatesReply(context: ChatContext, text: string): ChatReply {
  const { locale } = context;
  const currency = t(locale, "chat.replies.baseCurrency");

  if (context.rates.length === 0) {
    return { text: t(locale, "chat.replies.ratesEmpty") };
  }

  const matched = matchRates(text, context.rates, locale);
  const rows = matched.length > 0 ? matched : context.rates;
  const heading =
    matched.length === 1
      ? t(locale, "chat.replies.ratesHeadingSingle", {
          name: localizedRateName(rows[0], locale),
          currency,
        })
      : t(locale, "chat.replies.ratesHeading", { currency });

  return {
    text: [
      heading,
      ...rows.map((rate) =>
        t(locale, "chat.replies.rateLine", {
          name: localizedRateName(rate, locale),
          code: rate.code,
          buy: formatNumber(rate.buy_rate, locale),
          sell: formatNumber(rate.sell_rate, locale),
        }),
      ),
      t(locale, "chat.replies.ratesFooter"),
    ].join("\n"),
    rates: rows,
  };
}

const systemSuggestions = [
  { label: "نرخ امروز", text: "نرخ امروز اسعار چقدر است؟" },
  { label: "حواله", text: "چطور حواله ثبت کنم؟" },
  { label: "خدمات", text: "چه خدماتی دارید؟" },
  { label: "نمایندگی‌ها", text: "نمایندگی‌های شما کجاست؟" },
] as const;

export type ChatSuggestionMessages = {
  suggestRates: string;
  suggestRatesText: string;
  suggestTransfer: string;
  suggestTransferText: string;
  suggestServices: string;
  suggestServicesText: string;
  suggestBranches: string;
  suggestBranchesText: string;
};

export function getPublicFaqQuestion(faq: PublicFaq, locale: Locale, strict = false): string {
  if (strict) {
    switch (locale) {
      case "fa":
        return faq.question?.trim() ?? "";
      case "en":
        return faq.question_en?.trim() ?? "";
      case "ps":
        return faq.question_ps?.trim() ?? "";
      default: {
        const _never: never = locale;
        return _never;
      }
    }
  }
  return pickLocalized(
    {
      question_fa: faq.question,
      question_en: faq.question_en,
      question_ps: faq.question_ps,
    },
    "question",
    locale,
  );
}

export function getPublicFaqAnswer(faq: PublicFaq, locale: Locale, strict = false): string {
  if (strict) {
    switch (locale) {
      case "fa":
        return faq.answer?.trim() ?? "";
      case "en":
        return faq.answer_en?.trim() ?? "";
      case "ps":
        return faq.answer_ps?.trim() ?? "";
      default: {
        const _never: never = locale;
        return _never;
      }
    }
  }
  return pickLocalized(
    {
      answer_fa: faq.answer,
      answer_en: faq.answer_en,
      answer_ps: faq.answer_ps,
    },
    "answer",
    locale,
  );
}

export function localizePublicFaq(faq: PublicFaq, locale: Locale, strict = false): ChatFaq | null {
  const question = getPublicFaqQuestion(faq, locale, strict);
  const answer = getPublicFaqAnswer(faq, locale, strict);
  if (strict && (!question || !answer)) return null;
  return {
    question,
    answer,
    keywords: faq.keywords,
  };
}

export function buildChatSuggestions(
  faqs: PublicFaq[],
  locale: Locale,
  messages: ChatSuggestionMessages,
): Array<{ label: string; text: string }> {
  const system = [
    { label: messages.suggestRates, text: messages.suggestRatesText },
    { label: messages.suggestTransfer, text: messages.suggestTransferText },
    { label: messages.suggestServices, text: messages.suggestServicesText },
    { label: messages.suggestBranches, text: messages.suggestBranchesText },
  ];
  const extra = faqs
    .map((faq) => localizePublicFaq(faq, locale, true))
    .filter((faq): faq is ChatFaq => faq !== null)
    .slice(0, 2)
    .map((faq) => ({
      label: faq.question.length > 18 ? `${faq.question.slice(0, 18)}…` : faq.question,
      text: faq.question,
    }));
  return [...system.slice(0, extra.length > 0 ? 3 : 4), ...extra];
}

/** @deprecated Use buildChatSuggestions with locale-aware messages. */
export function chatSuggestions(faqs: ChatFaq[]): Array<{ label: string; text: string }> {
  const extra = faqs.slice(0, 2).map((faq) => ({
    label: faq.question.length > 18 ? `${faq.question.slice(0, 18)}…` : faq.question,
    text: faq.question,
  }));
  return [...systemSuggestions.slice(0, extra.length > 0 ? 3 : 4), ...extra];
}
