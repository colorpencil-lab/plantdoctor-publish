import type { Metadata } from "next";
import FarmDashboard from "@/components/FarmDashboard";
import { DEMO_SESSION } from "@/lib/farm/demo";

export const metadata: Metadata = {
  title: "Farm dashboard · 农场看板",
  description:
    "Plants flagged with a detected illness in the latest farm camera scan.",
};

export default function DashboardPage() {
  return <FarmDashboard session={DEMO_SESSION} />;
}
