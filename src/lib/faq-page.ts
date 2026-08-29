import { normalizeChatText } from "./chatbot.ts";
import type { PublicFaq } from "./public.functions.ts";

export function filterFaqs(faqs: PublicFaq[], query: string): PublicFaq[] {
  const term = normalizeChatText(query);
  if (!term) return faqs;
  return faqs.filter((faq) => {
    const haystack = normalizeChatText(`${faq.question} ${faq.answer} ${faq.keywords ?? ""}`);
    return haystack.includes(term);
  });
}
