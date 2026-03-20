"use client";

import { SessionProvider } from "next-auth/react";
import { RevenueDataProvider } from "@/lib/RevenueDataContext";
import { DealDataProvider } from "@/lib/DealDataContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RevenueDataProvider>
        <DealDataProvider>{children}</DealDataProvider>
      </RevenueDataProvider>
    </SessionProvider>
  );
}
