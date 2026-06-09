"use client";

import { useEffect } from "react";

/**
 * Single client island that powers the marketing pages' presentational
 * behavior so the page bodies themselves can stay Server Components:
 * - reveals `[data-reveal]` sections as they enter the viewport;
 * - tracks the pointer over `.lend-spotlight-card` elements via one
 *   delegated listener (feeds the `--mouse-x`/`--mouse-y` spotlight vars).
 */
export function MarketingInteractions() {
  useEffect(() => {
    document.documentElement.dataset.theme = "dark";

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const observeWithin = (root: ParentNode) => {
      root
        .querySelectorAll<HTMLElement>("[data-reveal]:not(.is-revealed)")
        .forEach((el) => observer.observe(el));
    };
    observeWithin(document);

    // Streamed/suspended content can arrive after hydration.
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.hasAttribute("data-reveal")) observer.observe(node);
          observeWithin(node);
        });
      });
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    const handleMouseMove = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest<HTMLElement>(".lend-spotlight-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
    };
    document.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return null;
}
