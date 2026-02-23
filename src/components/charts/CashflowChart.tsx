"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { YearProjection } from "@/lib/calculations/projection";

export function CashflowChart({ data }: { data: YearProjection[] }) {
  return (
    <div className="card h-[340px]">
      <h3 className="mb-3 text-base font-semibold text-stone-800">Cashflow-Verlauf</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="operativeCashflow" stroke="#8a6038" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="afterTaxCashflow" stroke="#166534" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
