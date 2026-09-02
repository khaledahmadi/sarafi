import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { prefetchRateSources } from "@/lib/queries";
import {
  DEFAULT_RATE_SOURCE,
  hasRateSourceCookie,
  isRateSourceId,
  readRateSourceStorage,
  writeRateSourceCookie,
  writeRateSourceStorage,
  type RateSourceId,
} from "@/lib/rate-sources";

type RateSourceContextValue = {
  source: RateSourceId;
  setSource: (source: RateSourceId) => void;
};

const RateSourceContext = createContext<RateSourceContextValue | null>(null);

export function RateSourceProvider({
  children,
  initialSource = DEFAULT_RATE_SOURCE,
}: {
  children: ReactNode;
  /** SSR-resolved cookie value so the first paint matches the user's market. */
  initialSource?: RateSourceId;
}) {
  const queryClient = useQueryClient();
  const resolvedInitial = isRateSourceId(initialSource)
    ? initialSource
    : DEFAULT_RATE_SOURCE;
  const [source, setSourceState] = useState<RateSourceId>(resolvedInitial);

  useEffect(() => {
    void prefetchRateSources(queryClient);
  }, [queryClient]);

  // Prefer cookie (SSR). If missing, migrate legacy localStorage before paint.
  useLayoutEffect(() => {
    if (hasRateSourceCookie()) {
      writeRateSourceStorage(resolvedInitial);
      return;
    }
    const stored = readRateSourceStorage();
    if (stored) {
      setSourceState(stored);
      writeRateSourceCookie(stored);
      return;
    }
    writeRateSourceCookie(resolvedInitial);
  }, [resolvedInitial]);

  const setSource = (next: RateSourceId) => {
    setSourceState(next);
    writeRateSourceCookie(next);
    writeRateSourceStorage(next);
  };

  return (
    <RateSourceContext.Provider value={{ source, setSource }}>
      {children}
    </RateSourceContext.Provider>
  );
}

export function useRateSource() {
  const context = useContext(RateSourceContext);
  if (!context) {
    throw new Error("useRateSource must be used within RateSourceProvider");
  }
  return context;
}
