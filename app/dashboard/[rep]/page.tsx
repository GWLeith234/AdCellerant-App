import DashboardClient from "@/components/DashboardClient";

interface Props {
  params: Promise<{ rep: string }>;
}

const VALID_REPS = ["george", "andy", "alex", "vendasta"];

export default async function RepFocusedPage({ params }: Props) {
  const { rep } = await params;
  const focusedRep = VALID_REPS.includes(rep) ? rep : "george";

  return (
    <DashboardClient
      userEmail="george.leith@adcellerant.com"
      userName="George Leith"
      rep={focusedRep}
    />
  );
}
