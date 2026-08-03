import { redirect } from "next/navigation";
import { requiresMfa } from "@church/authorization";
import { requireViewer } from "@/lib/auth/viewer";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  if (!viewer.demo && requiresMfa(viewer.roles) && viewer.aal !== "aal2") {
    redirect("/mfa?next=%2Fadmin");
  }
  return children;
}
