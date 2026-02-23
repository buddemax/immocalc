import { CockpitPageClient } from "@/components/property/CockpitPageClient";

export default async function PropertyCockpitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CockpitPageClient propertyId={id} />;
}
