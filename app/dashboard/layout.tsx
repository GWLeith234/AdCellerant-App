import Topbar from "@/components/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-navy">
      <Topbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6">{children}</main>
    </div>
  );
}
