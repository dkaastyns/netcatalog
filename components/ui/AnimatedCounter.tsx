"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform, useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
}

export function AnimatedCounter({ value }: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString("id-ID"));
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration: 2,
        ease: "easeOut",
      });
      return () => controls.stop();
    }
  }, [value, count, isInView]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}
