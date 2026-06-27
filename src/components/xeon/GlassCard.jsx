import React from "react";
import { motion } from "framer-motion";

export default function GlassCard({ children, className = "", glow = false, onClick, animate = true }) {
  const Comp = animate ? motion.div : "div";
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      }
    : {};

  return (
    <Comp
      {...motionProps}
      onClick={onClick}
      className={`xeon-glass rounded-xl p-4 ${glow ? "xeon-border-glow" : ""} ${onClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""} ${className}`}
    >
      {children}
    </Comp>
  );
}