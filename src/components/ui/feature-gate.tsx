import { ReactNode } from "react";
import { FeatureKey, isFeatureEnabled, PlanTier } from "@/lib/featureFlags";

interface FeatureGateProps {
  planTier: PlanTier;
  feature: FeatureKey;
  children: ReactNode;
}

export function FeatureGate({ planTier, feature, children }: FeatureGateProps) {
  if (isFeatureEnabled(planTier, feature)) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      Diese Funktion ist in der Pro-Version verfügbar. Du kannst die übrigen Eingaben trotzdem weiter bearbeiten.
    </div>
  );
}
