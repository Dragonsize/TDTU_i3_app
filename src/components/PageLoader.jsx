import React from "react";

export default function PageLoader({ label = "Loading...", fullHeight = true }) {
  return (
    <div className={`w-full bg-white flex items-center justify-center px-4 ${fullHeight ? "min-h-[100dvh]" : "min-h-screen"}`}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-950 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-['Arimo']">{label}</p>
      </div>
    </div>
  );
}
