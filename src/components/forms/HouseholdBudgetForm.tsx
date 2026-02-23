"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatEuro } from "@/lib/utils/format";

interface BudgetRow {
  category: string;
  annualAmount: number;
  comment?: string;
}

export function HouseholdBudgetForm() {
  const entries = useQuery(api.householdBudgets.list as never) as Array<{ _id: string; income: BudgetRow[]; expenses: BudgetRow[] }> | undefined;
  const upsert = useMutation(api.householdBudgets.upsert as never) as unknown as (
    args: unknown,
  ) => Promise<unknown>;
  const existing = entries?.[0];

  const [income, setIncome] = useState<BudgetRow[]>(existing?.income ?? [{ category: "Gehalt", annualAmount: 0 }]);
  const [expenses, setExpenses] = useState<BudgetRow[]>(existing?.expenses ?? [{ category: "Wohnen", annualAmount: 0 }]);
  const totalIncome = income.reduce((sum, row) => sum + (row.annualAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, row) => sum + (row.annualAmount || 0), 0);
  const annualBalance = totalIncome - totalExpenses;

  useEffect(() => {
    if (existing) {
      setIncome(existing.income);
      setExpenses(existing.expenses);
    }
  }, [existing]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await upsert({
      id: existing?._id,
      personalInfo: {
        name: "",
        address: "",
        city: "",
        maritalStatus: "",
        propertyRegime: "",
        children: "",
        referenceDate: new Date().toISOString().slice(0, 10),
      },
      income,
      expenses,
    });
  };

  return (
    <form className="card space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 md:grid-cols-3">
        <p className="text-sm font-semibold text-stone-700">Jahreseinnahmen: {formatEuro(totalIncome)}</p>
        <p className="text-sm font-semibold text-stone-700">Jahresausgaben: {formatEuro(totalExpenses)}</p>
        <p className="text-sm font-semibold text-stone-700">Saldo pro Jahr: {formatEuro(annualBalance)}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="space-y-2 rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-base font-semibold">Einnahmen</p>
          <p className="text-sm text-stone-600">Trage alle regelmäßigen jährlichen Einnahmen ein.</p>
          {income.map((row, index) => (
            <div key={`income-${index}`} className="grid grid-cols-2 gap-2">
              <input
                className="input"
                placeholder="Kategorie"
                value={row.category}
                onChange={(event) => {
                  const next = [...income];
                  next[index] = { ...next[index], category: event.target.value };
                  setIncome(next);
                }}
              />
              <input
                className="input"
                type="number"
                placeholder="EUR/Jahr"
                value={row.annualAmount}
                onChange={(event) => {
                  const next = [...income];
                  next[index] = { ...next[index], annualAmount: Number(event.target.value) };
                  setIncome(next);
                }}
              />
            </div>
          ))}
          <button
            className="button-secondary"
            type="button"
            onClick={() => setIncome((rows) => [...rows, { category: "", annualAmount: 0 }])}
          >
            Einnahme hinzufügen
          </button>
        </section>

        <section className="space-y-2 rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-base font-semibold">Ausgaben</p>
          <p className="text-sm text-stone-600">Hier kommen alle jährlichen Kosten deines Haushalts hinein.</p>
          {expenses.map((row, index) => (
            <div key={`expense-${index}`} className="grid grid-cols-2 gap-2">
              <input
                className="input"
                placeholder="Kategorie"
                value={row.category}
                onChange={(event) => {
                  const next = [...expenses];
                  next[index] = { ...next[index], category: event.target.value };
                  setExpenses(next);
                }}
              />
              <input
                className="input"
                type="number"
                placeholder="EUR/Jahr"
                value={row.annualAmount}
                onChange={(event) => {
                  const next = [...expenses];
                  next[index] = { ...next[index], annualAmount: Number(event.target.value) };
                  setExpenses(next);
                }}
              />
            </div>
          ))}
          <button
            className="button-secondary"
            type="button"
            onClick={() => setExpenses((rows) => [...rows, { category: "", annualAmount: 0 }])}
          >
            Ausgabe hinzufügen
          </button>
        </section>
      </div>
      <button className="button-primary" type="submit">
        Speichern
      </button>
    </form>
  );
}
