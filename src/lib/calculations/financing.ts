export interface LoanInput {
  amount: number;
  interestRate: number;
  initialRepayment: number;
  interestChanges?: { year: number; newRate: number }[];
  repaymentChanges?: { year: number; newRepayment: number }[];
  specialRepayments?: { year: number; amount: number }[];
}

export interface LoanYearResult {
  year: number;
  openingBalance: number;
  interestRate: number;
  interest: number;
  repayment: number;
  annuity: number;
  specialRepayment: number;
  closingBalance: number;
  monthlyPayment: number;
}

export function calcLoanSchedule(loan: LoanInput, startYear: number): LoanYearResult[] {
  const results: LoanYearResult[] = [];
  let balance = loan.amount;
  let currentRate = loan.interestRate;
  let currentRepayment = loan.initialRepayment;

  for (let i = 0; i < 50; i += 1) {
    const year = startYear + i;
    if (balance <= 0) {
      results.push({
        year,
        openingBalance: 0,
        interestRate: currentRate,
        interest: 0,
        repayment: 0,
        annuity: 0,
        specialRepayment: 0,
        closingBalance: 0,
        monthlyPayment: 0,
      });
      continue;
    }

    const rateChange = loan.interestChanges?.find((change) => change.year === year);
    const repaymentChange = loan.repaymentChanges?.find((change) => change.year === year);

    if (rateChange) {
      currentRate = rateChange.newRate;
    }
    if (repaymentChange) {
      currentRepayment = repaymentChange.newRepayment;
    }

    const openingBalance = balance;
    const annuity = openingBalance * (currentRate + currentRepayment);
    const interest = openingBalance * currentRate;

    const specialRepayment = loan.specialRepayments?.find((repayment) => repayment.year === year)?.amount ?? 0;
    let repayment = Math.max(0, annuity - interest);

    if (repayment + specialRepayment > openingBalance) {
      repayment = Math.max(0, openingBalance - specialRepayment);
    }

    const closingBalance = Math.max(0, openingBalance - repayment - specialRepayment);

    results.push({
      year,
      openingBalance,
      interestRate: currentRate,
      interest,
      repayment,
      annuity: interest + repayment,
      specialRepayment,
      closingBalance,
      monthlyPayment: (interest + repayment) / 12,
    });

    balance = closingBalance;
  }

  return results;
}

export function calcWeightedInterestRate(
  loan1Balance: number,
  loan1Rate: number,
  loan2Balance: number,
  loan2Rate: number,
) {
  const totalBalance = loan1Balance + loan2Balance;
  if (totalBalance === 0) {
    return 0;
  }
  return (loan1Balance * loan1Rate + loan2Balance * loan2Rate) / totalBalance;
}

export function calcFullRepaymentYear(schedule: LoanYearResult[]) {
  const entry = schedule.find((item) => item.closingBalance <= 1e-6 && item.openingBalance > 0);
  return entry?.year ?? null;
}
