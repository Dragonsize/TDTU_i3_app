import React from "react";

export default function SkeletonLoader({ count = 3, type = "file-list" }) {
  if (type === "file-list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-white/10 rounded-2xl p-4 animate-pulse"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "file-grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-pulse"
          >
            <div className="w-full h-48 bg-gray-200 dark:bg-gray-700" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "header") {
    return (
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between gap-4 animate-pulse">
          <div className="flex-1">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
          </div>
          <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (type === "preview") {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/3" />
        <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-96" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (type === "dashboard-stats") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 animate-pulse">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-white/10 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "dashboard-nav-cards") {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden mb-8 animate-pulse">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-neutral-800/20">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-white/5">
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="p-6 space-y-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-5/6 mb-2" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "dashboard-upcoming") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, itemIdx) => (
                <div key={itemIdx} className="flex items-center justify-between gap-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/4 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "chat") {
    return (
      <div className="space-y-4 animate-pulse">
        {/* Assistant message */}
        <div className="flex justify-start">
          <div className="max-w-xs bg-gray-100 dark:bg-gray-700 rounded-2xl p-4 space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-4/5" />
          </div>
        </div>

        {/* Assistant message */}
        <div className="flex justify-start">
          <div className="max-w-xs bg-gray-100 dark:bg-gray-700 rounded-2xl p-4 space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/5" />
          </div>
        </div>

        {/* Starter prompts skeleton */}
        <div className="pt-8 space-y-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-10 bg-gray-150 dark:bg-gray-700 rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (type === "calendar") {
    return (
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-40 h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
              <div className="w-48 h-10 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-48 h-10 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
              <div className="w-44 h-10 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
            </div>
          </div>
        </div>

        {/* Calendar grid skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8">
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-white/10 p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-8 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                ))}
              </div>
            </div>
          </div>

          {/* Calendar view */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 min-h-96 border border-gray-100 dark:border-white/10">
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {Array.from({ length: 7 }).map((_, idx) => (
                <div key={idx} className="h-8 bg-gray-100 dark:bg-gray-800 rounded" />
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, idx) => (
                <div key={idx} className="h-20 bg-gray-50 dark:bg-neutral-950 rounded border border-gray-100 dark:border-white/5" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "projects") {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between gap-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        </div>

        {/* Projects grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden"
            >
              {/* Project header gradient area */}
              <div className="h-24 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600" />

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
                </div>

                {/* Meta info skeleton */}
                <div className="flex items-center justify-between pt-2">
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "chat-channels") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {/* Sidebar - channels list */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-white/10 p-3 h-12"
            />
          ))}
        </div>

        {/* Main chat area */}
        <div className="md:col-span-2 space-y-4">
          {/* Header skeleton */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-white/10 p-4 h-16" />

          {/* Messages */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-white/10 p-4 space-y-3 min-h-64">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className={`flex ${idx % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <div className="w-2/3 max-w-xs bg-gray-100 dark:bg-gray-700 rounded-xl h-10" />
              </div>
            ))}
          </div>

          {/* Input skeleton */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-white/10 h-12" />
        </div>
      </div>
    );
  }

  return null;
}
