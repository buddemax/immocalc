export type HelpKey =
  | "micro_location_score"
  | "transfer_tax"
  | "allocable_hausgeld"
  | "afa"
  | "personal_tax_rate"
  | "breakeven_interest"
  | "valuation_band"
  | "confidence"
  | "scenario"
  | "net_equity"
  | "micro_location_auto"
  | "micro_location_source";

export interface HelpDefinition {
  title: string;
  text: string;
}

export const HELP_TEXTS: Record<HelpKey, HelpDefinition> = {
  micro_location_score: {
    title: "Mikrolage-Score",
    text: "Der Wert beschreibt, wie attraktiv die direkte Nachbarschaft ist. Ein höherer Score bedeutet meist stabilere Nachfrage und geringeres Leerstandsrisiko.",
  },
  transfer_tax: {
    title: "Grunderwerbsteuer",
    text: "Diese Steuer fällt beim Kauf der Immobilie einmalig an. Sie erhöht dein eingesetztes Startkapital und wirkt sich damit auf die Rendite aus.",
  },
  allocable_hausgeld: {
    title: "Umlagefähiges Hausgeld",
    text: "Das sind Kosten, die du rechtlich über die Nebenkosten auf Mieter umlegen darfst. Nicht umlagefähige Anteile senken deinen eigenen Cashflow.",
  },
  afa: {
    title: "AfA",
    text: "AfA bedeutet Abschreibung: Ein Teil des Gebäudewerts wird steuerlich über Jahre verteilt abgesetzt. Das reduziert in der Regel die laufende Steuerlast.",
  },
  personal_tax_rate: {
    title: "Persönlicher Steuersatz",
    text: "Das ist der Steuersatz, mit dem zusätzliche Einkünfte bei dir versteuert werden. Er beeinflusst direkt den Cashflow nach Steuern.",
  },
  breakeven_interest: {
    title: "Break-even-Zins",
    text: "Dieser Wert zeigt, bis zu welchem Zinssatz dein monatlicher Cashflow noch tragfähig bleibt. Je höher der Wert, desto robuster ist die Finanzierung.",
  },
  valuation_band: {
    title: "Ertragswert-Band",
    text: "Das Band zeigt keine exakte Zahl, sondern einen realistischen Korridor. Es macht sichtbar, wie stark Annahmen und Marktdaten das Ergebnis verändern können.",
  },
  confidence: {
    title: "Confidence",
    text: "Confidence bewertet die Verlässlichkeit einer Datenquelle von 0 bis 1. Höhere Werte bedeuten meist bessere Datenqualität und weniger Schätzanteil.",
  },
  scenario: {
    title: "Szenario",
    text: "Szenarien rechnen verschiedene Entwicklungen durch, z. B. Basis, optimistisch oder konservativ. So siehst du, wie stabil dein Ergebnis unter veränderten Annahmen bleibt.",
  },
  net_equity: {
    title: "Nettovermögen",
    text: "Das Nettovermögen ist der Immobilienwert minus verbleibende Schulden. Es zeigt, wie viel Substanz du bis zu einem bestimmten Jahr aufgebaut hast.",
  },
  micro_location_auto: {
    title: "Automatische Mikrolage",
    text: "Die Bewertung nutzt Adresse, Entfernungen und Umgebungsdaten, um einen objektiven Score zwischen 1 und 10 zu berechnen.",
  },
  micro_location_source: {
    title: "Score-Quelle",
    text: "Die Quelle zeigt, ob der Wert automatisch ermittelt, manuell gesetzt oder als Standard übernommen wurde.",
  },
};
