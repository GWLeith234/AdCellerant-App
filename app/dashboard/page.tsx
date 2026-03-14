import { getServerSession } from "next-auth";
import { authOptions, getRepForEmail } from "@/lib/auth";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const rep = getRepForEmail(session?.user?.email || "");

  return (
    <DashboardClient
      userEmail={session?.user?.email || ""}
      userName={session?.user?.name || ""}
      rep={rep}
    />
  );
}
