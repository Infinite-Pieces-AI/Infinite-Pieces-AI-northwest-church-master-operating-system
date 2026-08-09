import { MfaSetup } from "@/components/mfa-setup";

function safeNextPath(value?: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/admin";
  }
  return value;
}

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <MfaSetup nextPath={safeNextPath(next)} />;
}
