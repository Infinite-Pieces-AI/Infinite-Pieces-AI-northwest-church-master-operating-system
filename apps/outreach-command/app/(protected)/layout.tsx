import type { ReactNode } from "react";
import { OutreachShell } from "@/components/outreach-shell";
import { requireOutreachViewer } from "@/lib/auth/viewer";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const viewer = await requireOutreachViewer();
  return <OutreachShell viewer={viewer}>{children}</OutreachShell>;
}
