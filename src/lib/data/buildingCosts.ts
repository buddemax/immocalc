export const BUILDING_COSTS_PER_SQM: Record<string, number> = {
  "vor 1925": 462,
  "1925-1950": 462,
  "1951-1960": 462,
  "1961-1970": 538,
  "1971-1980": 730,
  "1981-1990": 922,
  "1991-2000": 1281,
  "2001-2010": 1793,
  "ab 2010": 2057,
};

export function calcBuildingShare(p: {
  livingArea: number;
  buildingCostPerSqm: number;
  groundFactor: number;
  hasGarage: boolean;
}) {
  const garageFactor = p.hasGarage ? 1.05 : 1;
  const buildingValue = p.buildingCostPerSqm * p.livingArea * garageFactor;
  const groundValue = p.livingArea * p.groundFactor * p.buildingCostPerSqm;
  return buildingValue / (buildingValue + groundValue);
}
