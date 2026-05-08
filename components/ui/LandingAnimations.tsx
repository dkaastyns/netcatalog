"use client";
import { useEffect } from "react";

// Handles scroll-based navbar shadow effect
export function LandingAnimations() {
  useEffect(() => {
    const nav = document.querySelector(".nc-nav") as HTMLElement | null;
    if (!nav) return;

    const onScroll = () => {
      if (window.scrollY > 10) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
