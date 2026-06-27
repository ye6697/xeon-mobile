import React from "react";
import { motion } from "framer-motion";

export default function PulseRing({ isActive, size = 120 }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {isActive && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-red-800/30"
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.7,
          height: size * 0.7,
          background: isActive
            ? "radial-gradient(circle, rgba(139, 26, 26, 0.3) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(60, 60, 60, 0.2) 0%, transparent 70%)",
        }}
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}