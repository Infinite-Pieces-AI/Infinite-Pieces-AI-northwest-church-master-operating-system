export type { Database } from "./generated.types";

export interface PublicScheduleRecord {
  occurrenceDate: string;
  title: string;
  localTime: string;
  timezone: string;
  status: "scheduled" | "cancelled" | "small_groups";
  locationName: string;
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
  publicMessage?: string;
}

export function isSupabaseConfigured(environment: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(environment.NEXT_PUBLIC_SUPABASE_URL && environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
