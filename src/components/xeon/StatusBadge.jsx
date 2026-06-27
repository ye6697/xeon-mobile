import React from "react";

const variants = {
  online: { bg: "bg-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400" },
  offline: { bg: "bg-neutral-500/20", text: "text-neutral-400", dot: "bg-neutral-500" },
  syncing: { bg: "bg-amber-500/20", text: "text-amber-400", dot: "bg-amber-400" },
  error: { bg: "bg-red-500/20", text: "text-red-400", dot: "bg-red-400" },
  active: { bg: "bg-red-900/20", text: "text-red-400", dot: "bg-red-500" },
  low: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  medium: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  high: { bg: "bg-orange-500/15", text: "text-orange-400", dot: "bg-orange-400" },
  critical: { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
  pending: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  confirmed: { bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  shipped: { bg: "bg-indigo-500/15", text: "text-indigo-400", dot: "bg-indigo-400" },
  delivered: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  cancelled: { bg: "bg-neutral-500/15", text: "text-neutral-400", dot: "bg-neutral-500" },
  open: { bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  in_progress: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  completed: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  under_review: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  blocked: { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
  inactive: { bg: "bg-neutral-500/15", text: "text-neutral-400", dot: "bg-neutral-500" },
};

export default function StatusBadge({ status, label }) {
  const v = variants[status] || variants.offline;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${v.bg} ${v.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
      {label || status}
    </span>
  );
}