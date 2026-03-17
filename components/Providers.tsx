"use client";

import { SessionProvider } from "next-auth/react";
import { RevenueDataProvider } from "@/lib/RevenueDataContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RevenueDataProvider>{children}</RevenueDataProvider>
    </SessionProvider>
  );
}
