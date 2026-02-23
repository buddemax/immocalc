import { ChartsPageClient } from "@/components/property/ChartsPageClient";

export default async function PropertyChartsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChartsPageClient propertyId={id} />;
}
