import { PropertyInput } from "@/lib/domain/property";

export interface OperatingCostCategory {
  key: string;
  label: string;
  monthlyAmount: number;
  transferable: boolean;
}

export interface OperatingCostBreakdown {
  categories: OperatingCostCategory[];
  landlordCo2Cost: number;
  transferable: number;
  nonTransferable: number;
  total: number;
}

export function calcPurchaseCosts(p: PropertyInput) {
  const brokerFee = p.purchasePrice * p.brokerFeePercent;
  const notaryFee = p.purchasePrice * p.notaryFeePercent;
  const landRegistry = p.purchasePrice * p.landRegistryPercent;
  const transferTax = p.purchasePrice * p.transferTaxPercent;
  const otherCosts = p.purchasePrice * p.otherCostsPercent;
  const totalPercent =
    p.brokerFeePercent + p.notaryFeePercent + p.landRegistryPercent + p.transferTaxPercent + p.otherCostsPercent;
  const totalAmount = brokerFee + notaryFee + landRegistry + transferTax + otherCosts;
  return { brokerFee, notaryFee, landRegistry, transferTax, otherCosts, totalPercent, totalAmount };
}

export function calcTotalInvestment(p: PropertyInput) {
  const purchaseCosts = calcPurchaseCosts(p);
  const initialInvestSum = p.initialInvestments.reduce((sum, investment) => sum + investment.cost, 0);
  return p.purchasePrice + purchaseCosts.totalAmount + initialInvestSum;
}

export function calc15PercentLimit(p: PropertyInput) {
  const purchaseCosts = calcPurchaseCosts(p);
  return 0.15 * p.buildingSharePercent * (p.purchasePrice + purchaseCosts.totalAmount) * 1.19;
}

export function calcRent(p: PropertyInput) {
  const coldRentLiving = p.livingArea * p.coldRentPerSqm;
  const netColdRent = coldRentLiving + p.parkingRent + p.otherRent;
  const warmRent = netColdRent + p.transferableCosts;
  return { coldRentLiving, netColdRent, warmRent };
}

export function calcOperatingCosts(p: PropertyInput) {
  const hausgeldNonTransferable = Math.max(0, p.hausgeldTotal - p.hausgeldTransferable);
  const ownMaintenanceReserve = (p.livingArea * p.maintenanceReservePerSqm) / 12;
  const vacancyReserve = p.vacancyReservePercent * calcRent(p).warmRent;
  const baseCategories: OperatingCostCategory[] = [
    {
      key: "betrkv_heating_hotwater",
      label: "Heizung/Warmwasser (BetrKV)",
      monthlyAmount: p.transferableCosts * 0.45,
      transferable: true,
    },
    {
      key: "betrkv_water_waste",
      label: "Wasser/Abwasser (BetrKV)",
      monthlyAmount: p.transferableCosts * 0.2,
      transferable: true,
    },
    {
      key: "betrkv_building_services",
      label: "Hauswart/Gebäudereinigung (BetrKV)",
      monthlyAmount: p.transferableCosts * 0.2,
      transferable: true,
    },
    {
      key: "betrkv_insurance_other",
      label: "Versicherungen/Sonstiges (BetrKV)",
      monthlyAmount: p.transferableCosts * 0.15,
      transferable: true,
    },
    {
      key: "property_tax",
      label: "Grundsteuer",
      monthlyAmount: p.propertyTax,
      transferable: false,
    },
    {
      key: "administration",
      label: "Verwaltungskosten",
      monthlyAmount: p.otherOperatingCosts,
      transferable: false,
    },
    {
      key: "house_money_non_transferable",
      label: "Hausgeld nicht umlagefähig",
      monthlyAmount: hausgeldNonTransferable,
      transferable: false,
    },
    {
      key: "maintenance_reserve",
      label: "Instandhaltungsrücklage",
      monthlyAmount: ownMaintenanceReserve,
      transferable: false,
    },
    {
      key: "vacancy_reserve",
      label: "Mietausfallwagnis",
      monthlyAmount: vacancyReserve,
      transferable: false,
    },
  ];

  const landlordCo2Cost = p.transferableCosts * 0.3 * (p.co2CostSplitLandlord ?? 0.5);
  baseCategories.push({
    key: "co2_share_landlord",
    label: "CO2-Kostenanteil Vermieter",
    monthlyAmount: landlordCo2Cost,
    transferable: false,
  });

  const transferable = baseCategories
    .filter((item) => item.transferable)
    .reduce((sum, item) => sum + item.monthlyAmount, 0);
  const nonTransferable = baseCategories
    .filter((item) => !item.transferable)
    .reduce((sum, item) => sum + item.monthlyAmount, 0);
  const total = transferable + nonTransferable;
  const percentOfRent = calcRent(p).netColdRent > 0 ? nonTransferable / calcRent(p).netColdRent : 0;

  return {
    categories: baseCategories,
    landlordCo2Cost,
    transferable,
    nonTransferable,
    total,
    percentOfRent,
    hausgeldNonTransferable,
    ownMaintenanceReserve,
    vacancyReserve,
  };
}

export function calcRecommendedReserve(p: PropertyInput) {
  const buildingValue = p.buildingSharePercent * p.purchasePrice;
  return ((buildingValue * (1 / 80) * 1.5 - 12 * p.wegReserve) / p.livingArea) || 0;
}
