import DashboardClient from "@/components/DashboardClient";

interface Props {
  params: { rep: string };
}

const VALID_REPS = ["george", "andy", "alex", "vendasta"];

export default function RepFocusedPage({ params }: Props) {
  const focusedRep = VALID_REPS.includes(params.rep) ? params.rep : "george";

  return (
    <DashboardClient
      userEmail="george.leith@adcellerant.com"
      userName="George Leith"
      rep={focusedRep}
    />
  );
}
