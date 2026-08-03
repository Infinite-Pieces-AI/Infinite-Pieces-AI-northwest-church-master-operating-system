import Link from "next/link";
import { AccessRequestForm } from "@/components/access-request-form";
export default function RequestAccessPage(){return <section className="auth-card auth-card--wide"><p className="auth-eyebrow">Invitation workflow</p><h1>Request member access.</h1><p>A leader verifies each request before a unique, single-use invitation is sent. A shared congregation code is intentionally not supported.</p><AccessRequestForm/><Link className="back-public" href="/login">← Back to sign-in</Link></section>}
