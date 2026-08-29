import { useEffect, useState } from "react";

/** False on the server and during hydration; true after the first client paint. */
export function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
