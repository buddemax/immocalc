"use client";

import { ChangeEvent } from "react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helpText?: string;
  hint?: string;
  unit?: string;
  inputSize?: "md" | "lg";
  step?: number;
  min?: number;
  max?: number;
}

export function NumberInput({
  label,
  value,
  onChange,
  helpText,
  hint,
  unit,
  inputSize = "md",
  step = 0.01,
  min,
  max,
}: NumberInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    onChange(Number.isFinite(next) ? next : 0);
  };

  return (
    <label>
      <span className="label">
        <span>{label}</span>
        {helpText ? <InfoTooltip text={helpText} /> : null}
      </span>
      <div className="relative">
        <input
          className={`input ${inputSize === "lg" ? "min-h-[52px]" : ""} ${unit ? "pr-14" : ""}`}
          type="number"
          value={value}
          onChange={handleChange}
          step={step}
          min={min}
          max={max}
        />
        {unit ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-500">{unit}</span> : null}
      </div>
      {hint ? <p className="field-help">{hint}</p> : null}
    </label>
  );
}
