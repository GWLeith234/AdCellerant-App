import { getServerSession } from "next-auth";
import { authOptions, getRepForEmail } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const session = await getServerSession(authOptions);
  const rep = getRepForEmail(session?.user?.email || "");

  // On first login, auto-redirect to rep's focused view
  // unless explicitly requesting team view
  if (rep && searchParams.view !== "team") {
    redirect(`/dashboard/${rep}`);
  }

  // Team view — no rep focus
  return (
    <DashboardClient
      userEmail={session?.user?.email || ""}
      userName={session?.user?.name || ""}
      rep={null}
    />
  );
}
