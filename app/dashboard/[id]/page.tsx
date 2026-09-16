import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SessionDetail from "@/components/SessionDetail";
import { getSession } from "@/lib/farm/sessions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Farm scan · 农场巡检",
  description: "Plants flagged with a detected illness during this scan session.",
};

export default async function SessionPage(props: PageProps<"/dashboard/[id]">) {
  const { id } = await props.params;
  const session = await getSession(id);
  if (!session) notFound();
  return <SessionDetail session={session} />;
}
