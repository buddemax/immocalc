"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";

const COLORS = ["#8a6038", "#4d7c0f", "#1d4ed8"];

export function FinancingPieChart({
  loan1,
  loan2,
  equity,
}: {
  loan1: number;
  loan2: number;
  equity: number;
}) {
  const data = [
    { name: "Darlehen I", value: loan1 },
    { name: "Darlehen II", value: loan2 },
    { name: "Eigenkapital", value: equity },
  ];

  return (
    <div className="card h-[340px]">
      <h3 className="mb-3 text-base font-semibold text-stone-800">Finanzierungsstruktur</h3>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={110} label>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
