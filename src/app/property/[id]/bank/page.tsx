import { BankPageClient } from "@/components/property/BankPageClient";

export default async function PropertyBankPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BankPageClient propertyId={id} />;
}
