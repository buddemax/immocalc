import type { Metadata } from "next";
import { AuthGate } from "@/components/AuthGate";
import { Navigation } from "@/components/navigation";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "immocal",
  description: "Immobilien-Kalkulator nach immocation-Prinzip",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <Providers>
          <div className="app-layout">
            <Navigation />
            <main className="app-content">
              <AuthGate>{children}</AuthGate>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
