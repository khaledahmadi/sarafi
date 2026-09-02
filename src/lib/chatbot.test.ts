import assert from "node:assert/strict";
import { test } from "node:test";
import {
  answerChat,
  buildChatSuggestions,
  chatSuggestions,
  composeChatReply,
  detectChatIntent,
  matchFaq,
  matchRates,
  replyToChat,
  type ChatContext,
} from "./chatbot.ts";

const context: ChatContext = {
  locale: "fa",
  brandName: "صرافی سروری",
  tagline: "حواله و تبادل ارز",
  description: "خدمات حواله و نرخ لحظه‌ای",
  phone: "+93 70 000 0000",
  hours: "شنبه تا پنجشنبه",
  address: "کابل",
  email: "info@example.com",
  whatsapp: "+93700000000",
  rates: [
    { code: "USD", name_fa: "دالر", buy_rate: 70, sell_rate: 71 },
    { code: "EUR", name_fa: "یورو", buy_rate: 76, sell_rate: 77 },
  ],
  branches: [{ name_fa: "دفتر کابل", city_fa: "کابل", country_fa: "افغانستان", phone: "070000" }],
  services: [{ title_fa: "حواله یوان", summary_fa: "ارسال یوان به چین" }],
  articles: [{ title_fa: "راهنمای حواله" }],
  faqs: [{ question: "کارمزد حواله چقدر است؟", answer: "کارمزد بسته به مقصد اعلام می‌شود.", keywords: "کارمزد، کمیسیون" }],
};

test("detectChatIntent maps rate questions", () => {
  assert.equal(detectChatIntent("نرخ دلار امروز"), "RATES");
});

test("detectChatIntent maps transfer questions", () => {
  assert.equal(detectChatIntent("چطور حواله ثبت کنم"), "TRANSFER");
});

test("detectChatIntent maps system topics", () => {
  assert.equal(detectChatIntent("درباره صرافی بگویید"), "ABOUT");
  assert.equal(detectChatIntent("آخرین مقالات وبلاگ"), "ARTICLES");
  assert.equal(detectChatIntent("چطور وارد حساب شوم"), "ACCOUNT");
});

test("replyToChat includes live rates", () => {
  const reply = replyToChat("RATES", context, "نرخ امروز");
  assert.match(reply.text, /دالر/);
  assert.match(reply.text, /USD/);
  assert.equal(reply.rates?.length, 2);
});

test("replyToChat fallback stays on-site", () => {
  const reply = replyToChat("FALLBACK", context);
  assert.doesNotMatch(reply.text, /wa\.me/);
});

test("matchFaq prefers admin questions", () => {
  const hit = matchFaq("کارمزد حواله", context.faqs);
  assert.equal(hit?.answer, "کارمزد بسته به مقصد اعلام می‌شود.");
});

test("matchRates finds a specific currency", () => {
  const rows = matchRates("نرخ یورو چند است", context.rates);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.code, "EUR");
});

test("answerChat uses FAQ for custom transfer questions", () => {
  const reply = answerChat("کارمزد حواله چقدر است؟", context);
  assert.equal(reply, "کارمزد بسته به مقصد اعلام می‌شود.");
});

test("answerChat prefers live rates over FAQ", () => {
  const reply = composeChatReply("نرخ دلار امروز", context);
  assert.match(reply.text, /دالر/);
  assert.equal(reply.rates?.[0]?.code, "USD");
});

test("answerChat answers services and branches from the system", () => {
  assert.match(answerChat("چه خدماتی دارید؟", context), /حواله یوان/);
  assert.match(answerChat("نمایندگی‌های شما کجاست؟", context), /دفتر کابل/);
  assert.match(answerChat("آخرین مقالات", context), /راهنمای حواله/);
});

test("chatSuggestions always includes live rates", () => {
  const chips = chatSuggestions(context.faqs);
  assert.equal(chips[0]?.text, "نرخ امروز اسعار چقدر است؟");
  assert.ok(chips.some((chip) => chip.text.includes("کارمزد")));
});

test("buildChatSuggestions uses locale messages and localized FAQ text", () => {
  const chips = buildChatSuggestions(
    [
      {
        id: "1",
        question: "کارمزد حواله چقدر است؟",
        question_en: "What is the transfer fee?",
        answer: "کارمزد بسته به مقصد اعلام می‌شود.",
        answer_en: "Fees depend on the destination.",
        keywords: "fee",
      },
    ],
    "en",
    {
      suggestRates: "Today's rates",
      suggestRatesText: "What are today's exchange rates?",
      suggestTransfer: "Transfer",
      suggestTransferText: "How do I submit a transfer?",
      suggestServices: "Services",
      suggestServicesText: "What services do you offer?",
      suggestBranches: "Branches",
      suggestBranchesText: "Where are your branches?",
    },
  );
  assert.equal(chips[0]?.text, "What are today's exchange rates?");
  assert.ok(chips.some((chip) => chip.text === "What is the transfer fee?"));
});

test("buildChatSuggestions skips FAQ chips without active-locale text", () => {
  const chips = buildChatSuggestions(
    [
      {
        id: "1",
        question: "کارمزد حواله چقدر است؟",
        answer: "کارمزد بسته به مقصد اعلام می‌شود.",
        keywords: "fee",
      },
    ],
    "en",
    {
      suggestRates: "Today's rates",
      suggestRatesText: "What are today's exchange rates?",
      suggestTransfer: "Transfer",
      suggestTransferText: "How do I submit a transfer?",
      suggestServices: "Services",
      suggestServicesText: "What services do you offer?",
      suggestBranches: "Branches",
      suggestBranchesText: "Where are your branches?",
    },
  );
  assert.equal(chips.length, 4);
  assert.ok(chips.every((chip) => !chip.text.includes("کارمزد")));
});

test("composeChatReply answers Pashto branch suggestions in Pashto", () => {
  const reply = composeChatReply("ستاسو نمایندګۍ چیرته دي؟", { ...context, locale: "ps" });
  assert.match(reply.text, /فعالې نمایندګۍ|مرکزي دفتر/);
  assert.doesNotMatch(reply.text, /متوجه نشدم/);
});

test("replyToChat fallback uses active locale", () => {
  const reply = replyToChat("FALLBACK", { ...context, locale: "en", faqs: [] });
  assert.match(reply.text, /I didn't understand/);
});
