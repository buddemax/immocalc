"use client";

import { calcFullRepaymentYear, calcLoanSchedule } from "@/lib/calculations/financing";
import { formatEuro, formatPercent } from "@/lib/utils/format";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface LoanCalculatorProps {
  title: string;
  amount: number;
  interestRate: number;
  initialRepayment: number;
  startYear: number;
}

export function LoanCalculator({ title, amount, interestRate, initialRepayment, startYear }: LoanCalculatorProps) {
  const schedule = calcLoanSchedule(
    {
      amount,
      interestRate,
      initialRepayment,
    },
    startYear,
  );

  const firstYear = schedule[0];
  const fullRepaymentYear = calcFullRepaymentYear(schedule);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="flex items-center gap-2 text-base font-semibold text-stone-800">
        {title}
        <InfoTooltip text="Die Übersicht zeigt dir die wichtigsten Kennzahlen für das Darlehen in den ersten Jahren." />
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <p>Darlehen: {formatEuro(amount)}</p>
        <p>Zins: {formatPercent(interestRate)}</p>
        <p>Tilgung Start: {formatPercent(initialRepayment)}</p>
        <p>Rate Monat 1: {formatEuro(firstYear.monthlyPayment)}</p>
        <p>Zinsen Jahr 1: {formatEuro(firstYear.interest)}</p>
        <p>Tilgung Jahr 1: {formatEuro(firstYear.repayment)}</p>
      </div>
      <p className="mt-4 text-sm text-stone-600">
        Schuldenfrei: {fullRepaymentYear ? fullRepaymentYear : "nicht innerhalb 50 Jahren"}
      </p>
    </div>
  );
}
