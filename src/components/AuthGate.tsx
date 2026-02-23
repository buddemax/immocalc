"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { SignInButton } from "@clerk/nextjs";

const PUBLIC_ROUTES = ["/sign-in", "/sign-up"];

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="card mt-8 text-center">
        <p className="text-sm text-stone-600">Authentifizierung...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="card mt-8 space-y-3 text-center">
        <p className="text-sm text-stone-700">Bitte einloggen, um fortzufahren.</p>
        <SignInButton mode="redirect">
          <button type="button" className="button-primary">
            Einloggen
          </button>
        </SignInButton>
      </div>
    );
  }

  return <>{children}</>;
}
