"use client";

import { motion, type Variants } from "framer-motion";
import { useMemo } from "react";

interface TextRevealProps {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div" | "span";
}

// Pre-built at module level — never created during render.
const motionTags = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
  p: motion.p,
  div: motion.div,
  span: motion.span,
} as const;

export default function TextReveal({
  text,
  delay = 0,
  duration = 0.5,
  className = "",
  as: tag = "h1",
}: TextRevealProps) {
  const words = useMemo(() => text.split(" "), [text]);

  // Simple lookup — not creating a component during render.
  const MotionTag = motionTags[tag];

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i: number = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: delay * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
        duration: duration,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <MotionTag
      style={{ overflow: "hidden", display: "flex", flexWrap: "wrap", gap: "0.25em" }}
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span variants={child} style={{ display: "inline-block" }} key={index}>
          {word}
        </motion.span>
      ))}
    </MotionTag>
  );
}
