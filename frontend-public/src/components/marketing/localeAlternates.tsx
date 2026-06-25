"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Locale } from "@/i18n";

export type LocaleAlternates = Partial<Record<Locale, string>>;

type LocaleAlternatesContextValue = {
  alternates: LocaleAlternates | null;
  setAlternates: (next: LocaleAlternates | null) => void;
};

const LocaleAlternatesContext = createContext<LocaleAlternatesContextValue | null>(null);

export function LocaleAlternatesProvider({
  children,
  initialValue = null,
}: {
  children: React.ReactNode;
  initialValue?: LocaleAlternates | null;
}) {
  const [alternates, setAlternates] = useState<LocaleAlternates | null>(initialValue);

  useEffect(() => {
    setAlternates(initialValue);
  }, [initialValue]);

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
  const key = alternates ? `${alternates.en ?? ""}|${alternates.ru ?? ""}|${alternates.uk ?? ""}|${alternates.uz ?? ""}|${alternates.de ?? ""}` : "";
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
