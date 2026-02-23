import { TimelinePageClient } from "@/components/property/TimelinePageClient";

export default async function PropertyTimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TimelinePageClient propertyId={id} />;
}
