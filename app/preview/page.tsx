import Topbar from "@/components/Topbar";
import DashboardClient from "@/components/DashboardClient";

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-navy">
      <Topbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6">
        <DashboardClient
          userEmail="george.leith@adcellerant.com"
          userName="George Leith"
          rep="george"
        />
      </main>
    </div>
  );
}
