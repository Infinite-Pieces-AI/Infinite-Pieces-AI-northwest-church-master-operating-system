import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const checkInProviders = ["planning_center", "existing_chms", "manual_fallback"] as const;
export type CheckInProviderName = (typeof checkInProviders)[number];

export interface PrecheckRequest {
  householdId: string;
  serviceSessionId: string;
  returnUrl: string;
}

export interface MirroredCheckInStatus {
  childId: string;
  serviceSessionId: string;
  classId?: string;
  state: "prechecked" | "checked_in" | "moved" | "pickup_requested" | "checked_out" | "cancelled";
  occurredAt: string;
  providerReference?: string;
}

export interface CheckInProviderAdapter {
  readonly name: CheckInProviderName;
  createPrecheckLink(request: PrecheckRequest): Promise<string>;
  fetchHouseholdStatus(
    householdId: string,
    serviceSessionId: string,
  ): Promise<readonly MirroredCheckInStatus[]>;
  healthCheck(): Promise<{ ok: boolean; detail: string }>;
}

export interface ChildLabelPayload {
  displayName: string;
  classLabel: string;
  pickupCode: string;
  /** Concise, approved operational flags only. Never print narrative records. */
  safetyFlags: readonly string[];
}

export interface LabelPrinterAdapter {
  readonly name: string;
  printChildAndGuardianLabels(
    payload: ChildLabelPayload,
  ): Promise<{ jobId: string; acceptedAt: string }>;
  healthCheck(): Promise<{ ok: boolean; detail: string }>;
}

interface PickupCredentialPayload {
  version: 1;
  keyId: string;
  serviceSessionId: string;
  householdId: string;
  nonce: string;
  expiresAt: string;
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

/**
 * Creates a short-lived opaque credential for a provider-approved check-in
 * session. It is not itself authority to release a child; the system of record
 * and trained volunteer must complete the approved verification workflow.
 */
export function createPickupCredential(input: {
  keyId: string;
  secret: string;
  serviceSessionId: string;
  householdId: string;
  expiresAt: Date;
}): string {
  if (input.secret.length < 32)
    throw new Error("Pickup credential secret must be at least 32 characters");
  if (input.expiresAt.getTime() <= Date.now())
    throw new Error("Pickup credential expiry must be in the future");
  const payload: PickupCredentialPayload = {
    version: 1,
    keyId: input.keyId,
    serviceSessionId: input.serviceSessionId,
    householdId: input.householdId,
    nonce: randomBytes(18).toString("base64url"),
    expiresAt: input.expiresAt.toISOString(),
  };
  const encoded = encode(JSON.stringify(payload));
  const signature = createHmac("sha256", input.secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyPickupCredential(input: {
  token: string;
  resolveSecret: (keyId: string) => string | undefined;
  expectedServiceSessionId: string;
}): PickupCredentialPayload {
  const [encoded, suppliedSignature] = input.token.split(".");
  if (!encoded || !suppliedSignature) throw new Error("Pickup credential is malformed");
  const payload = JSON.parse(decode(encoded)) as PickupCredentialPayload;
  if (
    payload.version !== 1 ||
    !payload.keyId ||
    !payload.serviceSessionId ||
    !payload.householdId
  ) {
    throw new Error("Pickup credential payload is invalid");
  }
  const secret = input.resolveSecret(payload.keyId);
  if (!secret || secret.length < 32)
    throw new Error("Pickup credential signing key is unavailable");
  const expected = createHmac("sha256", secret).update(encoded).digest();
  const supplied = Buffer.from(suppliedSignature, "base64url");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    throw new Error("Pickup credential signature is invalid");
  }
  if (payload.serviceSessionId !== input.expectedServiceSessionId)
    throw new Error("Pickup credential is for another service session");
  if (new Date(payload.expiresAt).getTime() <= Date.now())
    throw new Error("Pickup credential has expired");
  return payload;
}

export function assertCustomChildReleaseApproved(
  environment: NodeJS.ProcessEnv = process.env,
): void {
  if (environment.ALLOW_CUSTOM_CHILD_RELEASE !== "true") {
    throw new Error("Custom child release is disabled; use the approved ChMS/provider workflow");
  }
  if (
    environment.CHILD_RELEASE_SAFETY_REVIEW_ID?.trim().length === 0 ||
    !environment.CHILD_RELEASE_SAFETY_REVIEW_ID
  ) {
    throw new Error("Custom child release requires a documented safety review identifier");
  }
}
