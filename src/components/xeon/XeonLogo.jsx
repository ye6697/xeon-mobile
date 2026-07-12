import React from "react";
import { motion } from "framer-motion";

export default function XeonLogo({ size = 32, animate = true }) {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={animate ? { opacity: 0, scale: 0.8 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: "linear-gradient(135deg, #ff3347 0%, #780d1b 100%)",
          boxShadow: "0 0 22px rgba(255, 51, 71, 0.45), 0 0 60px rgba(255, 51, 71, 0.12)",
        }}
      />
      <span
        className="relative font-bold tracking-wider text-white"
        style={{
          fontSize: size * 0.35,
          fontFamily: "'Inter', sans-serif",
          textShadow: "0 0 10px rgba(255, 51, 71, 0.7)",
        }}
      >
        X
      </span>
    </motion.div>
  );
}
