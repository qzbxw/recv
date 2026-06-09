"use client";

import { useCallback, useEffect, useRef } from "react";

export function useReveal() {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      { threshold: 0.1 }
    );
    observerRef.current = observer;
    refs.current.forEach((ref) => ref && observer.observe(ref));
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, []);

  return useCallback((el: HTMLElement | null) => {
    if (!el || refs.current.includes(el)) return;

    refs.current.push(el);
    observerRef.current?.observe(el);

    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("is-revealed");
      }
    });
  }, []);
}
