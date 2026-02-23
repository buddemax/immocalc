import { AssetStatementForm } from "@/components/forms/AssetStatementForm";

export default function AssetsPage() {
  return (
    <div className="page-shell">
      <section className="page-header">
        <div>
          <h1>Vermögensaufstellung</h1>
          <p>Erfasse Vermögen und Verbindlichkeiten strukturiert für Bankgespräch und Gesamtbild deiner Finanzen.</p>
        </div>
      </section>
      <AssetStatementForm />
    </div>
  );
}
