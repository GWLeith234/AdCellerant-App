import { getServerSession } from "next-auth";
import { authOptions, getRepForEmail } from "@/lib/auth";
import DashboardClient from "@/components/DashboardClient";

interface Props {
  params: { rep: string };
}

const VALID_REPS = ["george", "andy", "alex", "vendasta"];

export default async function RepFocusedPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const userRep = getRepForEmail(session?.user?.email || "");

  // Validate rep param
  const focusedRep = VALID_REPS.includes(params.rep) ? params.rep : null;

  return (
    <DashboardClient
      userEmail={session?.user?.email || ""}
      userName={session?.user?.name || ""}
      rep={focusedRep || userRep}
    />
  );
}
