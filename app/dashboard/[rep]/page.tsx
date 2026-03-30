import RepDashboardClient from "./RepDashboardClient";

interface RepPageProps {
  params: Promise<{ rep: string }>;
}

export default async function RepPage({ params }: RepPageProps) {
  const { rep } = await params;
  return <RepDashboardClient repKey={rep} />;
}
