"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Generating deep dive...",
  "Building your analysis...",
  "Extracting key insights...",
  "Connecting the dots...",
  "Preparing full context...",
  "Synthesising the signal...",
];

export function DeepLoader() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24">
      {/* Spinner */}
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-white/5" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-400" />
        <div className="absolute inset-[5px] animate-spin rounded-full border-2 border-transparent border-t-purple-400 [animation-direction:reverse] [animation-duration:1.4s]" />
      </div>

      {/* Rotating message */}
      <p
        className="text-sm font-medium text-zinc-400 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {MESSAGES[idx]}
      </p>

      <p className="text-xs text-zinc-600">AI-powered analysis takes a few seconds</p>
    </div>
  );
}
