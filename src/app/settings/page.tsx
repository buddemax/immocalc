import { SettingsPageClient } from "@/components/settings/SettingsPageClient";

export default function SettingsPage() {
  return (
    <div className="page-shell">
      <section className="page-header">
        <div>
          <h1>Einstellungen</h1>
          <p>Passe die Grenzwerte für Kennzahlen an, damit Ampelfarben zu deiner Strategie passen.</p>
        </div>
      </section>
      <SettingsPageClient />
    </div>
  );
}
