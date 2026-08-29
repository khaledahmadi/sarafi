import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { listRates } from "@/lib/public.functions";

/**
 * Polls FX rates periodically and highlights codes that changed.
 * Replaces Supabase realtime subscription.
 */
export function useLiveRates(pollMs = 15_000) {
  const queryClient = useQueryClient();
  const [changed, setChanged] = useState<string[]>([]);
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const rates = await listRates();
        if (cancelled) return;
        setConnected(true);
        const next = new Map(
          rates.map((rate) => [rate.code, `${rate.buy_rate}:${rate.sell_rate}`]),
        );
        const changedCodes: string[] = [];
        next.forEach((value, code) => {
          const prev = previousRef.current.get(code);
          if (prev !== undefined && prev !== value) changedCodes.push(code);
        });
        previousRef.current = next;
        if (changedCodes.length > 0) {
          queryClient.invalidateQueries({ queryKey: ["rates"] });
          setLastEventAt(new Date());
          setChanged((prev) => {
            const merged = [...prev];
            for (const code of changedCodes) {
              if (!merged.includes(code)) merged.push(code);
            }
            return merged;
          });
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setChanged([]), 2500);
        }
      } catch {
        if (!cancelled) setConnected(false);
      }
    };

    void poll();
    const id = setInterval(() => void poll(), pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pollMs, queryClient]);

  return { changed, lastEventAt, connected };
}
