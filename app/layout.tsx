import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "AdCellerant Command Center",
  description: "Sales pipeline command center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
