"use client";

import { motion } from "framer-motion";

export default function GlobalLoading() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="relative flex flex-col items-center">
        {/* Animated Icon Container */}
        <div className="relative flex items-center justify-center w-20 h-20 mb-8">
          <motion.div
            className="absolute inset-0 rounded-[20px] border-4 border-slate-200/40"
          />
          <motion.div
            className="absolute inset-0 rounded-[20px] border-4 border-[var(--blue-mirage)] border-t-transparent border-l-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="w-8 h-8 bg-[var(--blue-mirage)] rounded-lg shadow-lg"
            animate={{ 
              scale: [1, 0.8, 1],
              rotate: [0, 90, 180]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        {/* Text and Dots */}
        <div className="flex flex-col items-center gap-3">
          <motion.h2 
            className="text-lg font-bold tracking-wide uppercase"
            style={{ color: "var(--text-primary)" }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Netcatalog
          </motion.h2>
          <div className="flex gap-1.5">
             {[0, 1, 2].map((i) => (
               <motion.div 
                 key={i}
                 className="w-1.5 h-1.5 rounded-full"
                 style={{ background: "var(--text-muted)" }}
                 animate={{ y: [0, -5, 0], opacity: [0.3, 1, 0.3] }}
                 transition={{ 
                   duration: 0.8, 
                   repeat: Infinity, 
                   ease: "easeInOut",
                   delay: i * 0.15 
                 }}
               />
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
