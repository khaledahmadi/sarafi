import { faNum, site } from "./site.ts";

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
  flag?: string | null;
  buy_rate: number;
  sell_rate: number;
};

export type ChatBranch = {
  name_fa: string;
  city_fa: string;
  country_fa: string;
  address_fa?: string | null;
  phone?: string | null;
};

export type ChatFaq = {
  question: string;
  answer: string;
  keywords?: string | null;
};

export type ChatContext = {
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
  services: Array<{ title_fa: string; summary_fa?: string }>;
  articles: Array<{ title_fa: string }>;
  faqs: ChatFaq[];
};

export type ChatReply = {
  text: string;
  rates?: ChatRate[];
};

const intentKeywords: Record<Exclude<ChatIntent, "FALLBACK">, string[]> = {
  GREETING: ["سلام", "درود", "صبح بخیر", "hello", "hi"],
  RATES: ["نرخ", "قیمت", "اسعار", "دلار", "دالر", "یورو", "یوان", "تومان", "درهم", "پوند", "لیر", "روپیه", "خرید", "فروش"],
  TRANSFER: ["حواله", "ارسال پول", "انتقال", "علی پی", "علی‌پی", "ویچت", "وی‌چت"],
  BRANCHES: ["نمایندگی", "شعبه", "دفتر", "آدرس", "کجا"],
  HOURS: ["ساعت", "ساعات", "باز هستید", "کی باز"],
  CONTACT: ["تماس", "تلفن", "شماره", "ایمیل", "واتساپ", "واتس"],
  SERVICES: ["خدمات", "چه کاری", "چی کار"],
  ABOUT: ["درباره", "کی هستید", "شما کی", "معرفی"],
  ARTICLES: ["مقاله", "مقالات", "وبلاگ", "اخبار", "راهنما"],
  ACCOUNT: ["ورود", "وارد", "ثبت نام", "ثبت‌نام", "حساب", "پنل"],
  FEEDBACK: ["بازخورد", "نظر مشتری"],
};

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

export function normalizeChatText(text: string): string {
  return text
    .trim()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .toLowerCase();
}

export function matchRates(text: string, rates: ChatRate[]): ChatRate[] {
  const query = normalizeChatText(text);
  if (!query || rates.length === 0) return [];
  return rates.filter((rate) => {
    const aliases = rateAliases[rate.code] ?? [];
    const tokens = [normalizeChatText(rate.code), normalizeChatText(rate.name_fa), ...aliases.map(normalizeChatText)];
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
  const hits = keywords.filter((keyword) => query.includes(keyword)).length;
  if (hits === 0) return 0;
  let score = hits;
  if (intent === "RATES" && (query.includes("نرخ") || query.includes("قیمت") || query.includes("اسعار"))) {
    score += 3;
  }
  if (intent === "TRANSFER" && query.includes("حواله") && !query.includes("نرخ") && !query.includes("قیمت")) {
    score += 2;
  }
  return score;
}

export function replyToChat(intent: ChatIntent, context: ChatContext, text = ""): ChatReply {
  switch (intent) {
    case "GREETING":
      return {
        text: `سلام، به ${context.brandName} خوش آمدید. می‌توانید نرخ لحظه‌ای، حواله، خدمات، نمایندگی‌ها، ساعات کاری یا تماس را بپرسید.`,
      };
    case "RATES":
      return formatRatesReply(context, text);
    case "TRANSFER":
      return {
        text: "برای حواله وارد حساب کاربری شوید و درخواست ثبت کنید. ارز مبدأ و مقصد، مبلغ و مشخصات گیرنده را وارد کنید تا کارشناسان بررسی کنند.",
      };
    case "BRANCHES":
      if (context.branches.length === 0) {
        return { text: `دفتر مرکزی: ${context.address}` };
      }
      return {
        text: [
          "نمایندگی‌های فعال:",
          ...context.branches.slice(0, 6).map((branch) => {
            const place = `${branch.city_fa}، ${branch.country_fa}`;
            const extra = [branch.address_fa, branch.phone].filter(Boolean).join(" — ");
            return extra ? `• ${branch.name_fa} — ${place}\n  ${extra}` : `• ${branch.name_fa} — ${place}`;
          }),
          `دفتر مرکزی: ${context.address}`,
        ].join("\n"),
      };
    case "HOURS":
      return { text: `ساعات کاری: ${context.hours}` };
    case "CONTACT":
      return {
        text: [
          `تلفن: ${context.phone}`,
          context.whatsapp ? `واتساپ: ${context.whatsapp}` : "",
          `ایمیل: ${context.email}`,
          `آدرس: ${context.address}`,
          `ساعات کاری: ${context.hours}`,
        ]
          .filter(Boolean)
          .join("\n"),
      };
    case "SERVICES":
      if (context.services.length === 0) {
        return { text: "خدمات ما شامل حواله، تبادل ارز و پرداخت‌های بین‌المللی است. جزئیات در صفحه خدمات آمده است." };
      }
      return {
        text: [
          "خدمات فعلی:",
          ...context.services.slice(0, 8).map((service) =>
            service.summary_fa ? `• ${service.title_fa}: ${service.summary_fa}` : `• ${service.title_fa}`,
          ),
        ].join("\n"),
      };
    case "ABOUT":
      return {
        text: [context.brandName, context.tagline, context.description].filter(Boolean).join("\n"),
      };
    case "ARTICLES":
      if (context.articles.length === 0) {
        return { text: "مقاله‌ای در وبلاگ منتشر نشده است. صفحه مقالات را کمی بعد ببینید." };
      }
      return {
        text: ["آخرین مطالب وبلاگ:", ...context.articles.slice(0, 5).map((article) => `• ${article.title_fa}`)].join(
          "\n",
        ),
      };
    case "ACCOUNT":
      return {
        text: "از دکمه ورود / ثبت‌نام بالای سایت وارد حساب شوید. بعد از ورود می‌توانید درخواست حواله ثبت کنید و وضعیت آن را ببینید.",
      };
    case "FEEDBACK":
      return {
        text: "نظر خود را در صفحه بازخورد ثبت کنید. بازخورد دیگران هم همان‌جا دیده می‌شود.",
      };
    case "FALLBACK":
      if (context.faqs.length > 0) {
        return {
          text: [
            "متوجه نشدم. می‌توانید نرخ امروز، حواله، خدمات یا یکی از این سؤال‌ها را بپرسید:",
            ...context.faqs.slice(0, 4).map((faq) => `• ${faq.question}`),
          ].join("\n"),
        };
      }
      return {
        text: "متوجه نشدم. می‌توانید بپرسید: نرخ امروز، نحوه حواله، خدمات، نمایندگی‌ها، ساعات کاری یا راه‌های تماس.",
      };
    default: {
      const _never: never = intent;
      return _never;
    }
  }
}

function formatRatesReply(context: ChatContext, text: string): ChatReply {
  if (context.rates.length === 0) {
    return { text: "الان نرخ فعالی در سایت ثبت نشده است. کمی بعد دوباره بپرسید یا صفحه نرخ لحظه‌ای را ببینید." };
  }
  const matched = matchRates(text, context.rates);
  const rows = matched.length > 0 ? matched : context.rates;
  const heading =
    matched.length === 1
      ? `نرخ ${rows[0].name_fa} بر مبنای ${site.baseCurrencyFa}:`
      : `نرخ‌های فعلی بر مبنای ${site.baseCurrencyFa}:`;
  return {
    text: [
      heading,
      ...rows.map(
        (rate) =>
          `• ${rate.name_fa} (${rate.code}): خرید ${faNum(rate.buy_rate)} / فروش ${faNum(rate.sell_rate)}`,
      ),
      "جدول کامل در صفحه نرخ لحظه‌ای است.",
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

export function chatSuggestions(faqs: ChatFaq[]): Array<{ label: string; text: string }> {
  const extra = faqs.slice(0, 2).map((faq) => ({
    label: faq.question.length > 18 ? `${faq.question.slice(0, 18)}…` : faq.question,
    text: faq.question,
  }));
  return [...systemSuggestions.slice(0, extra.length > 0 ? 3 : 4), ...extra];
}
