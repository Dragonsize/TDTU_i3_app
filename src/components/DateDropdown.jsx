"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { 
  formatDateKey, 
  parseDateOnly, 
  formatDateButtonLabel, 
  monthGridMonday, 
  isSameDate 
} from "@/lib/utils";

export default function DateDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(() => parseDateOnly(value) || new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const parsed = parseDateOnly(value);
    if (parsed) setDisplayMonth(parsed);
  }, [value]);

  const days = monthGridMonday(displayMonth);
  const selected = parseDateOnly(value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full h-[40px] rounded-xl px-3 text-sm text-left flex items-center justify-between border border-gray-200 bg-white text-gray-900 hover:border-indigo-300 transition-colors dark:bg-neutral-900 dark:border-white/10 dark:text-white"
      >
        <span>{formatDateButtonLabel(value)}</span>
        <span className="text-gray-400">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute left-0 mt-1 w-[280px] rounded-xl shadow-xl z-40 p-3 bg-white border border-gray-200 dark:bg-neutral-900 dark:border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
                className="w-7 h-7 rounded-full text-slate-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/5"
              >
                ‹
              </button>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                {displayMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
              <button
                type="button"
                onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
                className="w-7 h-7 rounded-full text-slate-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/5"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((label, idx) => (
                <div key={`${label}-${idx}`} className="text-center text-xs py-1 text-slate-500 dark:text-gray-400">
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-0.5">
              {days.map((day) => {
                const inCurrentMonth = day.getMonth() === displayMonth.getMonth();
                const isSelected = selected && isSameDate(day, selected);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => {
                      onChange(formatDateKey(day));
                      setOpen(false);
                    }}
                    className={`w-9 h-9 mx-auto rounded-full text-sm transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white font-semibold shadow-md"
                        : inCurrentMonth
                          ? "text-slate-800 hover:bg-slate-100 dark:text-white dark:hover:bg-white/5"
                          : "text-slate-400 dark:text-gray-600"
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
