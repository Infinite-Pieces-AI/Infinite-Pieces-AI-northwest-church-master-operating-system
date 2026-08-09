import { notFound } from "next/navigation";
import { FellowshipThread } from "@/components/fellowship-thread";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";
import { loadFellowshipMeetupDetail } from "@/lib/fellowship";

export default async function FellowshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;
  const detail = await loadFellowshipMeetupDetail(viewer, id).catch(() => null);
  if (!detail) notFound();
  return <><PageHeading eyebrow="Fellowship invitation" title={detail.meetup.title} description="Respond, prepare, use the participant-only thread, and check current instructions before traveling." /><FellowshipThread initial={detail} demo={viewer.demo} /></>;
}
