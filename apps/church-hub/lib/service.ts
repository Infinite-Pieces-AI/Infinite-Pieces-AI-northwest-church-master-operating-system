import type { Viewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { serviceOpportunities, type ServiceOpportunity } from "@/lib/service-data";

export type ServiceSignupStatus = "going" | "waitlisted" | "cancelled" | null;
export interface ServiceOpportunityView extends ServiceOpportunity { joinedStatus: ServiceSignupStatus; startsAt?: string; endsAt?: string; }

export async function loadServiceOpportunities(viewer: Viewer): Promise<ServiceOpportunityView[]> {
  if (viewer.demo) return serviceOpportunities.map((item) => ({ ...item, joinedStatus: null }));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_opportunities")
    .select("id,title,need_statement,impact_statement,partner_name,general_location,age_requirements,physical_requirements,skills,accessibility_notes,safeguarding_requirements,what_to_bring,family_friendly,recurrence_rule,service_shifts(id,starts_at,ends_at,capacity,status)")
    .eq("publication_status", "published")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const shiftIds = (data ?? []).flatMap((item) => (Array.isArray(item.service_shifts) ? item.service_shifts.map((shift) => String(shift.id)) : []));
  const { data: signups } = shiftIds.length
    ? await supabase.from("service_shift_signups").select("shift_id,status").eq("profile_id", viewer.id).in("shift_id", shiftIds)
    : { data: [] };
  const signupMap = new Map((signups ?? []).map((signup) => [String(signup.shift_id), String(signup.status) as ServiceSignupStatus]));

  return Promise.all((data ?? []).flatMap((item) => {
    const shifts = Array.isArray(item.service_shifts) ? item.service_shifts : [];
    const shift = shifts.filter((candidate) => ["open", "full"].includes(String(candidate.status))).sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)))[0];
    if (!shift) return [];
    return [async () => {
      const { data: count } = await supabase.rpc("service_shift_signup_count", { requested_shift_id: shift.id });
      const startsAt = String(shift.starts_at);
      const endsAt = String(shift.ends_at);
      return {
        id: String(item.id), title: String(item.title), need: String(item.need_statement), impact: String(item.impact_statement), partner: String(item.partner_name),
        dateLabel: new Date(startsAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }), duration: `${new Date(startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}–${new Date(endsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
        location: String(item.general_location), ageRequirement: String(item.age_requirements), physicalRequirements: item.physical_requirements ? String(item.physical_requirements) : "See approved shift details", skills: Array.isArray(item.skills) ? item.skills.map(String) : [],
        accessibility: item.accessibility_notes ? String(item.accessibility_notes) : "Ask the service leader", safeguarding: item.safeguarding_requirements ? String(item.safeguarding_requirements) : "Follow the approved service plan", whatToBring: item.what_to_bring ? String(item.what_to_bring) : "No additional items listed",
        familyFriendly: Boolean(item.family_friendly), recurring: Boolean(item.recurrence_rule), shiftId: String(shift.id), shiftLabel: "Upcoming shift", capacity: Number(shift.capacity), signedUp: Number(count ?? 0), joinedStatus: signupMap.get(String(shift.id)) ?? null, startsAt, endsAt,
      } satisfies ServiceOpportunityView;
    }];
  }).map((factory) => factory()));
}
