"use client";
import { useEffect } from "react";

/**
 * LandingAnimations — client-side scroll effects
 *
 * 1. Navbar shadow on scroll (requestAnimationFrame-throttled)
 * 2. Scroll-reveal: elements with `.animate-fadeUp` are hidden by default
 *    (via CSS `[data-animate]` attribute) and revealed via IntersectionObserver
 *    as they enter the viewport. This avoids animating elements already visible
 *    on initial paint (which PageSpeed flags as layout-shift risk).
 */
export function LandingAnimations() {
  useEffect(() => {
    // ── 1. Navbar scroll shadow ──────────────────────────────────────
    const nav = document.querySelector(".nc-nav") as HTMLElement | null;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (nav) {
            nav.classList.toggle("scrolled", window.scrollY > 10);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // ── 2. Scroll-reveal for .animate-fadeUp elements ────────────────
    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReduced) {
      const revealEls = document.querySelectorAll<HTMLElement>(
        ".animate-fadeUp, .animate-fadeIn, .animate-scaleIn, .animate-slideInLeft"
      );

      // Mark each element so CSS can hide it initially
      revealEls.forEach((el) => {
        // Skip elements already in the top viewport (above-the-fold content)
        const rect = el.getBoundingClientRect();
        if (rect.top > window.innerHeight * 0.85) {
          el.setAttribute("data-reveal", "pending");
        }
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              el.setAttribute("data-reveal", "visible");
              observer.unobserve(el);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: "0px 0px -40px 0px",
        }
      );

      revealEls.forEach((el) => {
        if (el.getAttribute("data-reveal") === "pending") {
          observer.observe(el);
        }
      });

      return () => {
        window.removeEventListener("scroll", onScroll);
        observer.disconnect();
      };
    }

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
