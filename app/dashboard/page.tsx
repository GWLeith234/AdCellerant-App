import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Default to George's rep view for now (auth disabled)
  redirect("/dashboard/george");
}
