"use client";

import { useEffect } from "react";

type VitalName = "LCP" | "INP" | "CLS";

type VitalPayload = {
  name: VitalName;
  value: number;
  path: string;
  locale: "en" | "ru";
  navigation_type: string;
};

function navigationType() {
  const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return entry?.type || "navigate";
}

function sendVital(name: VitalName, value: number) {
  if (!Number.isFinite(value) || value < 0) return;
  const locale = document.documentElement.lang === "ru" ? "ru" : "en";
  const payload: VitalPayload = {
    name,
    value,
    path: window.location.pathname,
    locale,
    navigation_type: navigationType(),
  };
  const body = JSON.stringify(payload);
  if (
    navigator.sendBeacon
    && navigator.sendBeacon("/api/public/web-vitals", new Blob([body], { type: "application/json" }))
  ) {
    return;
  }
  void fetch("/api/public/web-vitals", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    credentials: "omit",
  });
}

export function WebVitalsReporter() {
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;

    let lcp = 0;
    let cls = 0;
    let clsWindowValue = 0;
    let clsWindowStart = 0;
    let clsWindowEnd = 0;
    let inp = 0;
    let flushed = false;
    const observers: PerformanceObserver[] = [];

    const observe = (
      type: string,
      callback: (entries: PerformanceEntryList) => void,
      options: PerformanceObserverInit = { type, buffered: true },
    ) => {
      try {
        const observer = new PerformanceObserver((list) => callback(list.getEntries()));
        observer.observe(options);
        observers.push(observer);
      } catch {
        // Unsupported entry types are expected in older browsers.
      }
    };

    observe("largest-contentful-paint", (entries) => {
      const latest = entries.at(-1);
      if (latest) lcp = latest.startTime;
    });
    observe("layout-shift", (entries) => {
      for (const entry of entries) {
        const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
        if (shift.hadRecentInput) continue;
        if (
          clsWindowStart > 0
          && entry.startTime - clsWindowEnd < 1000
          && entry.startTime - clsWindowStart < 5000
        ) {
          clsWindowValue += shift.value || 0;
        } else {
          clsWindowValue = shift.value || 0;
          clsWindowStart = entry.startTime;
        }
        clsWindowEnd = entry.startTime;
        cls = Math.max(cls, clsWindowValue);
      }
    });
    observe(
      "event",
      (entries) => {
        for (const entry of entries) {
          const event = entry as PerformanceEntry & { duration: number; interactionId?: number };
          if (event.interactionId && event.duration > inp) inp = event.duration;
        }
      },
      { type: "event", buffered: true, durationThreshold: 40 } as PerformanceObserverInit,
    );

    const flush = () => {
      if (flushed) return;
      flushed = true;
      if (lcp > 0) sendVital("LCP", lcp);
      sendVital("CLS", cls);
      if (inp > 0) sendVital("INP", inp);
      observers.forEach((observer) => observer.disconnect());
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return null;
}
