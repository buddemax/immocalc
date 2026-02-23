"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function PropertySubnav({ propertyId }: { propertyId: string }) {
  const pathname = usePathname();
  const items = [
    { href: `/property/${propertyId}/cockpit`, label: "Cockpit" },
    { href: `/property/${propertyId}/valuation`, label: "Bewertung" },
    { href: `/property/${propertyId}/scenarios`, label: "Szenarien" },
    { href: `/property/${propertyId}/bank`, label: "Bank" },
    { href: `/property/${propertyId}/timeline`, label: "Verlauf" },
    { href: `/property/${propertyId}/charts`, label: "Charts" },
  ];

  return (
    <div className="card space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">Du befindest dich in der Objektansicht</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item) => (
          <Link
            key={item.href}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
              pathname === item.href
                ? "border-brand-300 bg-brand-100 text-brand-900"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100",
            )}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
