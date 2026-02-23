import { ValuationPageClient } from "@/components/property/ValuationPageClient";

export default async function PropertyValuationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ValuationPageClient propertyId={id} />;
}
