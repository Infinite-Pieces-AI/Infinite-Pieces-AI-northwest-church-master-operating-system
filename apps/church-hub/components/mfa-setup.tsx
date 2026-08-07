"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface FactorState {
  id: string;
  status: "verified" | "unverified";
}

export function MfaSetup({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [factor, setFactor] = useState<FactorState | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("Checking your MFA status…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (!active) return;
        if (error) {
          setMessage("MFA status could not be loaded.");
          return;
        }
        const totpFactors = data.totp ?? [];
        const verified = totpFactors.find((item) => item.status === "verified");
        const unverified = totpFactors.find((item) => item.status === "unverified");
        const selected = verified ?? unverified;
        setFactor(selected ? { id: selected.id, status: selected.status } : null);
        setMessage(
          verified
            ? "Enter the current six-digit code from your authenticator app."
            : unverified
              ? "Finish verifying the authenticator factor you already started."
              : "Enroll an authenticator app before opening privileged administration.",
        );
      } catch {
        if (active) setMessage("MFA is not configured in this environment.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function enroll() {
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Boston Church Lowell Hub",
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setFactor({ id: data.id, status: "unverified" });
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setMessage("Scan the QR code, then enter the six-digit code to verify enrollment.");
    } catch {
      setMessage("MFA enrollment could not be started.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!factor || !/^\d{6}$/.test(code)) {
      setMessage("Enter a valid six-digit authenticator code.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code,
      });
      if (error) {
        setMessage("The authenticator code was not accepted.");
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setMessage("MFA verification could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="hub-panel mfa-panel">
      <p className="hub-kicker">Privileged account protection</p>
      <h1>Verify multifactor authentication</h1>
      <p>
        Ministers, content editors, moderators, safety administrators, technical administrators, and
        super administrators must use an authenticator factor before privileged operations.
      </p>

      {!factor ? (
        <button className="button button-primary" type="button" onClick={enroll} disabled={busy}>
          {busy ? "Starting…" : "Enroll authenticator app"}
        </button>
      ) : (
        <div className="auth-form">
          {qrCode ? (
            <div className="mfa-qr">
              {/* Supabase returns a data URL generated for this user's pending TOTP factor. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="Authenticator enrollment QR code" width="220" height="220" />
              {secret ? (
                <details>
                  <summary>Cannot scan the QR code?</summary>
                  <code>{secret}</code>
                </details>
              ) : null}
            </div>
          ) : null}
          <label>
            Six-digit authenticator code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
            />
          </label>
          <button className="button button-primary" type="button" onClick={verify} disabled={busy}>
            {busy ? "Verifying…" : "Verify and continue"}
          </button>
        </div>
      )}

      <p className="form-message" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
