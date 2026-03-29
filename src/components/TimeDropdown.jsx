"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TIME_OPTIONS = Array.from({ length: 96 }, (_, idx) => {
  const hour = String(Math.floor(idx / 4)).padStart(2, "0");
  const minute = String((idx % 4) * 15).padStart(2, "0");
  return `${hour}:${minute}`;
});

import { formatTimeLabel } from "@/lib/utils";

export default function TimeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full h-[40px] rounded-xl px-3 text-sm text-left flex items-center justify-between border border-gray-200 bg-white text-gray-900 hover:border-indigo-300 transition-colors dark:bg-neutral-900 dark:border-white/10 dark:text-white"
      >
        <span>{formatTimeLabel(value)}</span>
        <span className="text-gray-400">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl shadow-xl z-40 bg-white border border-slate-200 dark:bg-neutral-900 dark:border-white/10"
          >
            {TIME_OPTIONS.map((option) => {
              const active = option === value;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-600 font-semibold dark:bg-indigo-900/20 dark:text-indigo-400"
                      : "text-slate-800 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-white/5"
                  }`}
                >
                  {formatTimeLabel(option)}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
