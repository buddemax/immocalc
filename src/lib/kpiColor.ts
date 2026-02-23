export function getKpiColor(value: number, green: number, yellow: number): "green" | "yellow" | "red" {
  if (value >= green) {
    return "green";
  }
  if (value >= yellow) {
    return "yellow";
  }
  return "red";
}
