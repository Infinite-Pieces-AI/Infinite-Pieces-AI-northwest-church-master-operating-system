import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
function validSignature(raw: string, provided: string | null) {
  const secret = process.env.WEBHOOK_SIGNING_SECRET;
  if (!secret || !provided) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-church-signature")))
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  return NextResponse.json(
    {
      accepted: true,
      note: "Map the verified vendor event into the outbox before mutating church state.",
    },
    { status: 202 },
  );
}
