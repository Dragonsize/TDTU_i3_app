"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2, PauseCircle, CheckCircle2 } from "lucide-react";

export const STATUS_CONFIG = {
  in_process: { label: "In Progress", icon: Loader2, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400", border: "border-blue-100 dark:border-blue-800" },
  pause: { label: "Paused", icon: PauseCircle, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400", border: "border-amber-100 dark:border-amber-800" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-800" },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.in_process;
  const Icon = cfg.icon;
  return (
    <motion.span
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color} ${cfg.border} transition-colors`}
    >
      <Icon className={`w-3.5 h-3.5 ${status === 'in_process' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </motion.span>
  );
}
