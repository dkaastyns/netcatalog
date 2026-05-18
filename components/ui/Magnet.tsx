"use client";

import { useRef, useState, ReactNode } from "react";
import { motion } from "framer-motion";

interface MagnetProps {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  intensity?: number;
}

export default function Magnet({
  children,
  padding = 0,
  disabled = false,
  intensity = 0.5,
}: MagnetProps) {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const magnetRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !magnetRef.current) return;

    const { clientX, clientY } = e;
    const { width, height, left, top } = magnetRef.current.getBoundingClientRect();
    
    // Calculate distance from center
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    
    setPosition({ x: x * intensity, y: y * intensity });
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    setIsActive(true);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setIsActive(false);
    setPosition({ x: 0, y: 0 });
  };

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
      }}
    >
      {children}
    </motion.div>
  );
}
