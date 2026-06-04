"use client";

import { useRef, useState, ReactNode } from "react";
import { motion } from "framer-motion";

interface MagnetProps {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  intensity?: number;
}

/**
 * Detect touch device once via lazy useState initializer.
 * Avoids useEffect setState (anti-pattern flagged by React Compiler).
 * On touch devices, Magnet is a no-op — saves framer-motion overhead on mobile.
 */
function detectTouch(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

export default function Magnet({
  children,
  padding = 0,
  disabled = false,
  intensity = 0.5,
}: MagnetProps) {
  // Lazy initializer: runs once on mount, avoids unnecessary re-renders
  const [isTouchDevice] = useState<boolean>(detectTouch);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const magnetRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || isTouchDevice || !magnetRef.current) return;

    const { clientX, clientY } = e;
    const { width, height, left, top } =
      magnetRef.current.getBoundingClientRect();

    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);

    setPosition({ x: x * intensity, y: y * intensity });
  };

  const handleMouseEnter = () => {
    if (disabled || isTouchDevice) return;
    setIsActive(true);
  };

  const handleMouseLeave = () => {
    if (disabled || isTouchDevice) return;
    setIsActive(false);
    setPosition({ x: 0, y: 0 });
  };

  // On touch devices render children directly — no animation overhead
  if (isTouchDevice) {
    return <>{children}</>;
  }

  return (
    <motion.div
      ref={magnetRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 15,
        mass: 0.1,
      }}
      style={{
        display: "inline-block",
        padding: padding,
        position: "relative",
        zIndex: isActive ? 10 : 1,
        // GPU-accelerated transform for smooth magnet effect
        willChange: "transform",
      }}
    >
      {children}
    </motion.div>
  );
}
