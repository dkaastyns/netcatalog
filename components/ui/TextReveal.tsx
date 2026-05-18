"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface TextRevealProps {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
  as?: React.ElementType;
}

export default function TextReveal({
  text,
  delay = 0,
  duration = 0.5,
  className = "",
  as: Component = "h1",
}: TextRevealProps) {
  // Split words to animate individually
  const words = useMemo(() => text.split(" "), [text]);

  const container: any = {
    hidden: { opacity: 0 },
    visible: (i: number = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: delay * i },
    }),
  };

  const child: any = {
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

  const MotionComponent = motion(Component as any);

  return (
    <MotionComponent
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
    </MotionComponent>
  );
}
