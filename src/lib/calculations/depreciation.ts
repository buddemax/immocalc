import { PropertyInput } from "@/lib/domain/property";
import { calcPurchaseCosts } from "@/lib/calculations/core";

export function calcDepreciation(p: PropertyInput) {
  const purchaseCosts = calcPurchaseCosts(p);
  const initialInvestActivated = p.initialInvestments
    .filter((investment) => investment.taxTreatment === "activate")
    .reduce((sum, investment) => sum + investment.cost, 0);

  const depreciationBase = (p.purchasePrice + purchaseCosts.totalAmount + initialInvestActivated) * p.buildingSharePercent;
  const annualDepreciation = depreciationBase * p.depreciationRate;
  const monthlyDepreciation = annualDepreciation / 12;

  return { depreciationBase, annualDepreciation, monthlyDepreciation };
}
