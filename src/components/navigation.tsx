"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/", label: "Dashboard", subtitle: "Übersicht und Start" },
  { href: "/property/new", label: "Neue Immobilie", subtitle: "Schritt-für-Schritt Wizard" },
  { href: "/household", label: "Haushaltsrechnung", subtitle: "Einnahmen und Ausgaben" },
  { href: "/assets", label: "Vermögensaufstellung", subtitle: "Aktiva und Passiva" },
  { href: "/settings", label: "Einstellungen", subtitle: "Grenzwerte und Defaults" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="app-sidebar" aria-label="Hauptnavigation">
      <div className="mb-3 hidden md:block">
        <p className="text-2xl font-semibold text-brand-800">immocal</p>
        <p className="text-sm text-stone-600">Immobilienrechner mit klarer Schrittführung.</p>
      </div>

      <div className="mb-2 flex items-center justify-between md:hidden">
        <p className="text-lg font-semibold text-brand-800">immocal</p>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Navigation</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 md:block md:space-y-2 md:overflow-visible">
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== "/" && pathname?.startsWith(`${link.href}/`));
          return (
            <Link
              key={link.href}
              className={cn(
                "min-w-fit rounded-xl border px-3 py-2.5 transition-colors md:flex md:min-w-0 md:flex-col md:gap-0.5",
                active
                  ? "border-brand-300 bg-brand-100 text-brand-900"
                  : "border-transparent bg-white text-stone-700 hover:border-stone-200 hover:bg-stone-50",
              )}
              href={link.href}
            >
              <span className="text-sm font-semibold">{link.label}</span>
              <span className="hidden text-xs text-stone-600 md:block">{link.subtitle}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
