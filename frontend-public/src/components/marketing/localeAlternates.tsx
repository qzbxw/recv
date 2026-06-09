"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type LocaleAlternates = Partial<Record<"en" | "ru", string>>;

type LocaleAlternatesContextValue = {
  alternates: LocaleAlternates | null;
  setAlternates: (next: LocaleAlternates | null) => void;
};

const LocaleAlternatesContext = createContext<LocaleAlternatesContextValue | null>(null);

export function LocaleAlternatesProvider({ children }: { children: React.ReactNode }) {
  const [alternates, setAlternates] = useState<LocaleAlternates | null>(null);
  return (
    <LocaleAlternatesContext.Provider value={{ alternates, setAlternates }}>
      {children}
    </LocaleAlternatesContext.Provider>
  );
}

export function useLocaleAlternates(): LocaleAlternates | null {
  return useContext(LocaleAlternatesContext)?.alternates ?? null;
}

/**
 * Lets a page (e.g. a blog post) tell the shared header which URL each language
 * maps to, so the language switcher swaps to the translated page instead of the
 * landing page. Cleans up on unmount so other routes fall back to path swapping.
 */
export function useRegisterLocaleAlternates(alternates: LocaleAlternates | null) {
  const ctx = useContext(LocaleAlternatesContext);
  const set = ctx?.setAlternates;
  const key = alternates ? `${alternates.en ?? ""}|${alternates.ru ?? ""}` : "";
  const stableSet = useCallback(
    (next: LocaleAlternates | null) => set?.(next),
    [set],
  );
  useEffect(() => {
    stableSet(alternates);
    return () => stableSet(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, stableSet]);
}
