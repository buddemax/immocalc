import { PropertyWizard } from "@/components/property/PropertyWizard";

export default function PropertyWizardPage() {
  return (
    <div className="page-shell">
      <section className="page-header">
        <div>
          <h1>Neue Immobilie anlegen</h1>
          <p>Führe alle Eingaben Schritt für Schritt durch. Komplexe Begriffe haben eine kurze Infohilfe.</p>
        </div>
      </section>
      <PropertyWizard />
    </div>
  );
}
