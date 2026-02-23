"use client";

import { useEffect, useRef, useState } from "react";

interface InfoTooltipProps {
  text: string;
  className?: string;
}

export function InfoTooltip({ text, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <span ref={rootRef} className={`group relative inline-flex ${className ?? ""}`}>
      <button
        type="button"
        aria-label="Information anzeigen"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-brand-300 bg-brand-50 text-[11px] font-semibold text-brand-800 transition-colors hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-200"
      >
        i
      </button>
      <span
        role="tooltip"
        className={`absolute left-1/2 top-[115%] z-30 w-72 -translate-x-1/2 rounded-lg border border-stone-300 bg-white p-3 text-xs normal-case tracking-normal text-stone-700 shadow-lg transition-opacity ${
          open ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"
        }`}
      >
        {text}
      </span>
    </span>
  );
}
