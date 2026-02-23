import { HouseholdBudgetForm } from "@/components/forms/HouseholdBudgetForm";

export default function HouseholdPage() {
  return (
    <div className="page-shell">
      <section className="page-header">
        <div>
          <h1>Haushaltsrechnung</h1>
          <p>Hier vergleichst du jährliche Einnahmen und Ausgaben für eine realistische Tragfähigkeitsprüfung.</p>
        </div>
      </section>
      <HouseholdBudgetForm />
    </div>
  );
}
