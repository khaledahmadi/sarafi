import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Maximize2, MessageCircle, Minimize2, Send, X } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-settings";
import { OPEN_CHAT_EVENT } from "@/lib/chat-widget";
import { chatSuggestions, composeChatReply, detectChatIntent, type ChatContext, type ChatRate } from "@/lib/chatbot";
import { articlesQuery, branchesQuery, faqsQuery, ratesQuery, servicesQuery } from "@/lib/queries";
import { faNum } from "@/lib/site";
import { whatsappHref } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  rates?: ChatRate[];
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.244-.73.244-1.088 0-.058 0-.144-.03-.215-.1-.172-2.434-1.39-2.678-1.39zm-2.908 7.593c-1.747 0-3.48-.53-4.942-1.49L7.793 24.41l1.132-3.337a8.955 8.955 0 0 1-1.72-5.272c0-4.955 4.04-8.995 8.997-8.995S25.2 10.845 25.2 15.8c0 4.958-4.04 8.998-8.998 8.998zm0-19.798c-5.96 0-10.8 4.842-10.8 10.8 0 1.964.53 3.898 1.546 5.574L5 27.176l5.974-1.92a10.807 10.807 0 0 0 16.03-9.455c0-5.958-4.842-10.8-10.802-10.8z"
      />
    </svg>
  );
}

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ContactWidgets() {
  const { get } = useSiteSettings();
  const queryClient = useQueryClient();
  const brandName = get("brand.name");
  const whatsapp = whatsappHref(get("contact.whatsapp"));
  const rates = useQuery({ ...ratesQuery, enabled: true });
  const branches = useQuery({ ...branchesQuery, enabled: true });
  const services = useQuery({ ...servicesQuery, enabled: true });
  const articles = useQuery({ ...articlesQuery, enabled: true });
  const faqs = useQuery({ ...faqsQuery, enabled: true });

  const context = useMemo<ChatContext>(
    () => ({
      brandName,
      tagline: get("brand.tagline"),
      description: get("brand.description"),
      phone: get("contact.phone"),
      hours: get("contact.hours"),
      address: get("contact.address"),
      email: get("contact.email"),
      whatsapp: get("contact.whatsapp"),
      rates: rates.data ?? [],
      branches: branches.data ?? [],
      services: services.data ?? [],
      articles: articles.data ?? [],
      faqs: faqs.data ?? [],
    }),
    [articles.data, brandName, branches.data, faqs.data, get, rates.data, services.data],
  );
  const suggestions = chatSuggestions(context.faqs);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "bot",
      text: `سلام، به ${brandName} خوش آمدید. نرخ لحظه‌ای، حواله، خدمات، نمایندگی‌ها یا تماس را بپرسید.`,
    },
  ]);
  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function closeChat() {
    setOpen(false);
    setExpanded(false);
  }

  function openChat() {
    setOpen(true);
    void queryClient.invalidateQueries({ queryKey: ["rates"] });
  }

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (expanded) {
        setExpanded(false);
        return;
      }
      closeChat();
    }
    function onPointer(event: MouseEvent) {
      if (expanded) return;
      if (!panelRef.current?.contains(event.target as Node)) closeChat();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [expanded, open]);

  useEffect(() => {
    function onOpenChat() {
      setOpen(true);
      void queryClient.invalidateQueries({ queryKey: ["rates"] });
    }
    window.addEventListener(OPEN_CHAT_EVENT, onOpenChat);
    return () => {
      window.removeEventListener(OPEN_CHAT_EVENT, onOpenChat);
      if (replyTimer.current) clearTimeout(replyTimer.current);
    };
  }, [queryClient]);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setMessages((current) => [...current, { id: nextId(), role: "user", text: trimmed }]);
    setDraft("");
    setPending(true);
    let nextContext = context;
    if (detectChatIntent(trimmed) === "RATES") {
      try {
        const freshRates = await queryClient.fetchQuery(ratesQuery);
        nextContext = { ...context, rates: freshRates };
      } catch {
        nextContext = context;
      }
    }
    const reply = composeChatReply(trimmed, nextContext);
    replyTimer.current = setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: nextId(), role: "bot", text: reply.text, rates: reply.rates },
      ]);
      setPending(false);
    }, 350);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(draft);
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {whatsapp ? (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="گفتگو در واتساپ"
          className="pointer-events-auto absolute bottom-5 left-5 grid size-14 place-items-center rounded-full bg-success text-success-foreground shadow-[0_8px_24px_-8px_oklch(0.45_0.12_155/0.7)] transition hover:brightness-110"
        >
          <WhatsAppIcon className="size-8" />
        </a>
      ) : null}

      <div className="pointer-events-auto absolute bottom-5 right-5 flex flex-col items-end" ref={panelRef}>
        {open ? (
          <div
            id={panelId}
            role="dialog"
            aria-label="گفتگوی پشتیبانی"
            aria-expanded={expanded}
            className={cn(
              "flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-28px_oklch(0.23_0.065_264/0.45)]",
              expanded
                ? "mb-0 h-[calc(100svh-var(--app-header-height)-2.5rem)] max-h-[calc(100svh-var(--app-header-height)-2.5rem)] w-[min(40rem,calc(100vw-2.5rem))]"
                : "mb-3 h-[min(32rem,calc(100svh-7rem))] w-[min(22rem,calc(100vw-2.5rem))]",
            )}
          >
            <div className="flex items-start justify-between gap-3 bg-primary px-4 py-3 text-primary-foreground">
              <div>
                <p className="text-sm font-bold">{brandName}</p>
                <p className="mt-0.5 text-xs text-primary-foreground/75">پاسخگوی خودکار</p>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setExpanded((current) => !current)}
                  className="grid size-11 place-items-center rounded-lg"
                  aria-label={expanded ? "کوچک‌کردن گفتگو" : "بزرگ‌کردن گفتگو"}
                  aria-pressed={expanded}
                >
                  {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </button>
                <button
                  type="button"
                  onClick={closeChat}
                  className="grid size-11 place-items-center rounded-lg"
                  aria-label="بستن گفتگو"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div ref={threadRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-2xl px-3 py-2.5 text-sm leading-7",
                    expanded ? "max-w-[36rem]" : "max-w-[92%]",
                    message.role === "bot"
                      ? "rounded-ss-md bg-muted"
                      : "ms-auto rounded-se-md bg-primary text-primary-foreground",
                  )}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                  {message.rates && message.rates.length > 0 ? <ChatRateCard rates={message.rates} /> : null}
                </div>
              ))}
              {pending ? (
                <p className="max-w-[90%] rounded-2xl rounded-ss-md bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                  در حال نوشتن…
                </p>
              ) : null}
            </div>

            <div className="space-y-3 border-t border-border p-3">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled={pending}
                    onClick={() => void ask(item.text)}
                    className="min-h-11 rounded-full border border-border px-3 text-xs font-semibold disabled:opacity-60"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <form onSubmit={onSubmit} className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`${panelId}-message`}>
                  پیام شما
                </label>
                <input
                  id={`${panelId}-message`}
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="پیام خود را بنویسید…"
                  className="min-h-11 flex-1 rounded-xl bg-muted px-3 text-sm"
                />
                <button
                  type="submit"
                  disabled={pending || !draft.trim()}
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
                  aria-label="ارسال پیام"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {expanded ? null : (
          <div className="flex items-center gap-2.5" dir="ltr">
            {open ? null : (
              <button
                type="button"
                onClick={openChat}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-4 text-sm font-semibold text-card-foreground shadow-[0_8px_24px_-10px_oklch(0.23_0.065_264/0.35)]"
              >
                <span aria-hidden="true">👋</span>
                <span dir="rtl">با ما گفتگو کنید</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (open) {
                  closeChat();
                  return;
                }
                openChat();
              }}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={open ? "بستن گفتگو" : "باز کردن گفتگو"}
              className="grid size-14 place-items-center rounded-full bg-primary text-accent shadow-[0_8px_24px_-8px_oklch(0.23_0.065_264/0.55)] transition hover:brightness-110"
            >
              {open ? <X className="size-6" /> : <MessageCircle className="size-7" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatRateCard({ rates }: { rates: ChatRate[] }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl bg-card text-card-foreground">
      <table className="w-full text-right text-xs">
        <thead className="bg-secondary/80 text-muted-foreground">
          <tr>
            <th className="px-2.5 py-2 font-semibold">ارز</th>
            <th className="px-2.5 py-2 font-semibold">خرید</th>
            <th className="px-2.5 py-2 font-semibold">فروش</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => (
            <tr key={rate.code} className="border-t border-border">
              <td className="px-2.5 py-2 font-semibold">
                {rate.flag ? <span className="me-1">{rate.flag}</span> : null}
                {rate.name_fa}
                <span className="ms-1 font-normal text-muted-foreground" dir="ltr">
                  {rate.code}
                </span>
              </td>
              <td className="px-2.5 py-2 tabular-nums text-success">{faNum(rate.buy_rate)}</td>
              <td className="px-2.5 py-2 tabular-nums text-destructive">{faNum(rate.sell_rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link
        to="/rates"
        className="block border-t border-border px-2.5 py-2 text-center text-[11px] font-semibold text-primary"
      >
        جدول کامل نرخ لحظه‌ای
      </Link>
    </div>
  );
}
