"use client";

import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { YearProjection } from "@/lib/calculations/projection";
import { formatEuro, formatPercent } from "@/lib/utils/format";

interface ProjectionTableProps {
  data: YearProjection[];
}

export function ProjectionTable({ data }: ProjectionTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 46,
    overscan: 8,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const columns = useMemo(
    () => [
      "Jahr",
      "Warmmiete",
      "Schuldenstand",
      "Zinssatz",
      "CF vor St.",
      "Steuern",
      "CF nach St.",
      "Nettovermögen",
    ],
    [],
  );

  return (
    <div className="card">
      <h2 className="mb-4 text-lg font-semibold">Kennzahlen im Verlauf (50 Jahre)</h2>
      <div className="table grid grid-cols-8 bg-stone-100 font-semibold">
        {columns.map((column) => (
          <div key={column} className="border-b border-stone-300 px-4 py-3 text-xs uppercase tracking-wide text-stone-700">
            {column}
          </div>
        ))}
      </div>
      <div ref={parentRef} className="h-[540px] overflow-auto">
        <div style={{ height: `${totalSize}px`, position: "relative" }}>
          {virtualRows.map((virtualRow) => {
            const row = data[virtualRow.index];
            return (
              <div
                key={row.year}
                className="grid grid-cols-8 border-b border-stone-200 bg-white text-sm"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="px-4 py-3 font-semibold text-stone-800">{row.year}</div>
                <div className="px-4 py-3">{formatEuro(row.warmRent)}</div>
                <div className="px-4 py-3">{formatEuro(row.totalDebtEnd)}</div>
                <div className="px-4 py-3">{formatPercent(row.weightedInterestRate)}</div>
                <div className="px-4 py-3">{formatEuro(row.operativeCashflow)}</div>
                <div className="px-4 py-3">{formatEuro(row.tax)}</div>
                <div className="px-4 py-3">{formatEuro(row.afterTaxCashflow)}</div>
                <div className="px-4 py-3">{formatEuro(row.netEquity)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
