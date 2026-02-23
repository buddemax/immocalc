export function calcMarginalTaxRate(taxableIncome: number, assessment: "single" | "joint" = "single", churchTax = false) {
  let zve = assessment === "joint" ? taxableIncome / 2 : taxableIncome;
  zve = Math.floor(zve);

  const calcTax = (income: number) => {
    if (income <= 10347) return 0;
    if (income <= 14926) {
      const y = (income - 10347) / 10000;
      return (1088.67 * y + 1400) * y;
    }
    if (income <= 58596) {
      const z = (income - 14926) / 10000;
      return (206.43 * z + 2397) * z + 869.32;
    }
    if (income <= 277825) {
      return 0.42 * income - 9336.45;
    }
    return 0.45 * income - 17671.2;
  };

  const tax1 = calcTax(zve);
  const tax2 = calcTax(zve + 1);

  let marginalRate = tax2 - tax1;
  marginalRate *= 1.055;

  if (churchTax) {
    marginalRate *= 1.085;
  }

  return Math.min(marginalRate, 0.45 * 1.055 * (churchTax ? 1.085 : 1));
}

export interface AnnualTaxInput {
  annualRent: number;
  annualOperatingCostsDeductible: number;
  annualInterest: number;
  annualDepreciation: number;
  annualOtherDeductibleCosts?: number;
  marginalTaxRate: number;
  soliRate?: number;
  churchTaxRate?: number;
}

export function calcAnnualTax(input: AnnualTaxInput) {
  const taxableIncome =
    input.annualRent -
    input.annualOperatingCostsDeductible -
    input.annualInterest -
    input.annualDepreciation -
    (input.annualOtherDeductibleCosts ?? 0);

  const incomeTax = taxableIncome * input.marginalTaxRate;
  const soli = incomeTax > 0 ? incomeTax * (input.soliRate ?? 0) : 0;
  const churchTax = incomeTax > 0 ? incomeTax * (input.churchTaxRate ?? 0) : 0;
  const annualTax = incomeTax + soli + churchTax;

  return { taxableIncome, incomeTax, soli, churchTax, annualTax };
}

export function calcMonthlyTax(p: {
  warmRent: number;
  operatingCostsWithoutOwnReserve: number;
  monthlyInterest: number;
  monthlyDepreciation: number;
  marginalTaxRate: number;
  churchTaxRate?: number;
}) {
  const annual = calcAnnualTax({
    annualRent: p.warmRent * 12,
    annualOperatingCostsDeductible: p.operatingCostsWithoutOwnReserve * 12,
    annualInterest: p.monthlyInterest * 12,
    annualDepreciation: p.monthlyDepreciation * 12,
    marginalTaxRate: p.marginalTaxRate,
    churchTaxRate: p.churchTaxRate,
  });

  const monthlyTax = annual.annualTax / 12;
  return { taxableIncome: annual.taxableIncome / 12, monthlyTax };
}
