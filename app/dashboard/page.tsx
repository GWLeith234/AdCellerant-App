import { getServerSession } from "next-auth";
import { authOptions, getRepForEmail } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const rep = getRepForEmail(session?.user?.email || "");

  return (
    <div>
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">
          Welcome, {session?.user?.name || "User"}
        </h2>
        <p className="text-muted text-sm">
          Logged in as{" "}
          <span className="text-blue">{session?.user?.email}</span>
          {rep && (
            <>
              {" "}
              — Rep: <span className="text-orange font-semibold">{rep}</span>
            </>
          )}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">Pipeline</p>
          <p className="text-2xl font-bold text-white">—</p>
          <p className="text-muted text-xs mt-1">HubSpot data loads on connect</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">Booked Revenue</p>
          <p className="text-2xl font-bold text-white">—</p>
          <p className="text-muted text-xs mt-1">Upload CSV to populate</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">Target Tracking</p>
          <p className="text-2xl font-bold text-white">—</p>
          <p className="text-muted text-xs mt-1">Upload Excel to populate</p>
        </div>
      </div>
    </div>
  );
}
