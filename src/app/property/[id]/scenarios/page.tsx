import { ScenariosPageClient } from "@/components/property/ScenariosPageClient";

export default async function PropertyScenariosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ScenariosPageClient propertyId={id} />;
}
