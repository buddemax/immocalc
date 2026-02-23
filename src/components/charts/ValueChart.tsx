"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { YearProjection } from "@/lib/calculations/projection";

export function ValueChart({ data }: { data: YearProjection[] }) {
  return (
    <div className="card h-[340px]">
      <h3 className="mb-3 text-base font-semibold text-stone-800">Wertentwicklung vs. Restschuld</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="propertyValueStart" stroke="#1e3a8a" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="totalDebtStart" stroke="#b91c1c" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
