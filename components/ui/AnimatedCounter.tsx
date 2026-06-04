"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform, useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
}

export function AnimatedCounter({ value }: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    Math.round(latest).toLocaleString("id-ID")
  );
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    // Respect prefers-reduced-motion — skip animation, jump to final value
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (isInView) {
      if (prefersReduced) {
        count.set(value);
        return;
      }
      const controls = animate(count, value, {
        duration: 1.8,
        ease: [0.22, 1, 0.36, 1], // custom spring-like ease-out
      });
      return () => controls.stop();
    }
  }, [value, count, isInView]);

  return (
    <motion.span
      ref={ref}
      style={{
        display: "inline-block",
        // Promote to GPU layer for smooth text rendering during animation
        willChange: "contents",
      }}
    >
      {rounded}
    </motion.span>
  );
}
