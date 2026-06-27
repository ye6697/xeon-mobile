import React from "react";
import { motion } from "framer-motion";

export default function PageHeader({ title, subtitle, right }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-5 pt-3 pb-2"
    >
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && (
          <p className="text-xs text-neutral-500 mt-0.5 tracking-wide">{subtitle}</p>
        )}
      </div>
      {right && <div>{right}</div>}
    </motion.div>
  );
}