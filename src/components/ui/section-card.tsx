import { ReactNode } from "react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface SectionCardProps {
  title: string;
  description?: string;
  helpText?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, description, helpText, actions, children }: SectionCardProps) {
  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900">
            {title}
            {helpText ? <InfoTooltip text={helpText} /> : null}
          </h2>
          {description ? <p className="mt-1 text-sm text-stone-600">{description}</p> : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </section>
  );
}
