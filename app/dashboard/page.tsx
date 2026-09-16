import type { Metadata } from "next";
import SessionList from "@/components/SessionList";
import { listRecentSessions } from "@/lib/farm/sessions";

// Session data changes on every scan action — never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scan sessions · 巡检记录",
  description: "History of farm scan sessions, device or manual.",
};

export default async function DashboardPage() {
  const sessions = await listRecentSessions(10);
  return <SessionList sessions={sessions} />;
}
