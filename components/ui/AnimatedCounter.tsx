"use client";

import { useEffect, useRef } from "react";

interface AnimatedCounterProps {
  value: number;
}

/**
 * Animates a number from 0 → value when it enters the viewport.
 *
 * Rewritten to use native browser APIs (IntersectionObserver + requestAnimationFrame)
 * instead of framer-motion — eliminates ~58 KiB from the initial JS bundle.
 *
 * Initial render shows the real value (no hydration flash), animation
 * triggers only once when the element scrolls into view.
 */
export function AnimatedCounter({ value }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated.current) return;
        hasAnimated.current = true;
        observer.disconnect();

        // Skip animation for users who prefer reduced motion
        if (prefersReduced) return;

        const DURATION = 1800; // ms
        const start = performance.now();

        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION, 1);
          // Cubic ease-out: fast start, slow finish — feels premium
          const eased = 1 - Math.pow(1 - progress, 3);
          if (el) {
            el.textContent = Math.round(eased * value).toLocaleString("id-ID");
          }
          if (progress < 1) requestAnimationFrame(tick);
        };

        // Start from 0
        el.textContent = "0";
        requestAnimationFrame(tick);
      },
      { threshold: 0.1, rootMargin: "-50px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  // Server-rendered value — shown immediately, no hydration flash
  return <span ref={ref}>{value.toLocaleString("id-ID")}</span>;
}
