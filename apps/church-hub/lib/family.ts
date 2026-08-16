import type { Viewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export interface FamilyMemberRecord {
  id: string;
  displayName: string;
  email: string;
  relationship: string;
  primaryContact: boolean;
}

export interface ChildRecord {
  id: string;
  preferredName: string;
  birthDate: string | null;
  className: string | null;
  ageBand: string | null;
  latestCheckinState: string | null;
  latestCheckinAt: string | null;
}

export interface PickupRecord {
  id: string;
  childId: string;
  displayName: string;
  relationship: string | null;
  phoneLastFour: string | null;
  active: boolean;
}

export interface MediaPermissionRecord {
  id: string;
  childId: string;
  scope: string;
  granted: boolean;
  effectiveFrom: string;
  revokedAt: string | null;
}

export interface ParentConnectionRecord {
  id: string;
  otherProfileId: string;
  otherDisplayName: string;
  status: string;
  updatedAt: string;
}

export interface PlaydateRecord {
  id: string;
  title: string | null;
  status: string;
  startsAt: string | null;
  generalLocation: string | null;
}

export interface FamilyWorkspace {
  configured: boolean;
  household: { id: string; name: string } | null;
  members: FamilyMemberRecord[];
  children: ChildRecord[];
  pickups: PickupRecord[];
  mediaPermissions: MediaPermissionRecord[];
  parentConnections: ParentConnectionRecord[];
  playdates: PlaydateRecord[];
  checkinProviderUrl: string | null;
}

const emptyWorkspace: FamilyWorkspace = {
  configured: false,
  household: null,
  members: [],
  children: [],
  pickups: [],
  mediaPermissions: [],
  parentConnections: [],
  playdates: [],
  checkinProviderUrl: null,
};

function profileFromJoin(
  value:
    | { display_name?: string | null; email?: string | null }
    | Array<{ display_name?: string | null; email?: string | null }>
    | null,
) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function loadFamilyWorkspace(viewer: Viewer): Promise<FamilyWorkspace> {
  if (
    viewer.demo ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return {
      ...emptyWorkspace,
      checkinProviderUrl:
        process.env.PLANNING_CENTER_PRECHECK_URL ?? process.env.CHMS_CHECKIN_URL ?? null,
    };
  }

  const supabase = await createClient();
  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("profile_id", viewer.id)
    .is("ended_at", null)
    .order("started_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership?.household_id) {
    return {
      ...emptyWorkspace,
      configured: true,
      checkinProviderUrl:
        process.env.PLANNING_CENTER_PRECHECK_URL ?? process.env.CHMS_CHECKIN_URL ?? null,
    };
  }

  const householdId = String(membership.household_id);
  const [householdResult, memberResult, childResult, connectionResult] = await Promise.all([
    supabase.from("households").select("id,name").eq("id", householdId).maybeSingle(),
    supabase
      .from("household_members")
      .select("profile_id,relationship,is_primary_contact,profile:profiles(display_name,email)")
      .eq("household_id", householdId)
      .is("ended_at", null),
    supabase
      .from("children")
      .select("id,preferred_name,birth_date")
      .eq("household_id", householdId)
      .eq("active", true)
      .order("preferred_name"),
    supabase
      .from("parent_connections")
      .select("id,requesting_guardian_id,receiving_guardian_id,status,updated_at")
      .or(`requesting_guardian_id.eq.${viewer.id},receiving_guardian_id.eq.${viewer.id}`)
      .order("updated_at", { ascending: false }),
  ]);

  if (householdResult.error) throw householdResult.error;
  if (memberResult.error) throw memberResult.error;
  if (childResult.error) throw childResult.error;
  if (connectionResult.error) throw connectionResult.error;

  const childRows = (childResult.data ?? []) as Array<{
    id: string;
    preferred_name: string;
    birth_date: string | null;
  }>;
  const childIds = childRows.map((child) => child.id);
  const memberRows = (memberResult.data ?? []) as Array<{
    profile_id: string;
    relationship: string;
    is_primary_contact: boolean;
    profile:
      | { display_name?: string | null; email?: string | null }
      | Array<{ display_name?: string | null; email?: string | null }>
      | null;
  }>;

  const otherProfileIds = Array.from(
    new Set(
      (
        (connectionResult.data ?? []) as Array<{
          requesting_guardian_id: string;
          receiving_guardian_id: string;
        }>
      ).map((connection) =>
        connection.requesting_guardian_id === viewer.id
          ? connection.receiving_guardian_id
          : connection.requesting_guardian_id,
      ),
    ),
  );

  const connectionIds = ((connectionResult.data ?? []) as Array<{ id: string }>).map(
    (connection) => connection.id,
  );
  const playdatePromise = connectionIds.length
    ? supabase
        .from("playdate_proposals")
        .select(
          "id,parent_connection_id,proposed_by,proposed_window_start,proposed_window_end,general_location,notes,status,created_at,updated_at",
        )
        .in("parent_connection_id", connectionIds)
        .order("proposed_window_start", { ascending: true })
        .limit(25)
    : Promise.resolve({ data: [], error: null });

  const [
    pickupResult,
    permissionResult,
    classLinkResult,
    checkinResult,
    otherProfilesResult,
    playdateResult,
  ] = await Promise.all([
    childIds.length
      ? supabase
          .from("authorized_pickups")
          .select("id,child_id,display_name,relationship_label,phone_last_four,active")
          .in("child_id", childIds)
          .order("display_name")
      : Promise.resolve({ data: [], error: null }),
    childIds.length
      ? supabase
          .from("media_permissions")
          .select("id,child_id,scope,granted,effective_from,revoked_at")
          .in("child_id", childIds)
          .is("revoked_at", null)
          .order("effective_from", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    childIds.length
      ? supabase
          .from("class_links")
          .select("child_id,kids_class:kids_classes(name,age_band)")
          .in("child_id", childIds)
          .is("ends_on", null)
      : Promise.resolve({ data: [], error: null }),
    childIds.length
      ? supabase
          .from("checkin_status_events")
          .select("child_id,state,occurred_at")
          .in("child_id", childIds)
          .order("occurred_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [], error: null }),
    otherProfileIds.length
      ? supabase.from("profiles").select("id,display_name").in("id", otherProfileIds)
      : Promise.resolve({ data: [], error: null }),
    playdatePromise,
  ]);

  if (pickupResult.error) throw pickupResult.error;
  if (permissionResult.error) throw permissionResult.error;
  if (classLinkResult.error) throw classLinkResult.error;
  if (checkinResult.error) throw checkinResult.error;
  if (otherProfilesResult.error) throw otherProfilesResult.error;
  if (playdateResult.error) throw playdateResult.error;

  const classByChild = new Map<string, { name?: string | null; age_band?: string | null } | null>();
  for (const row of (classLinkResult.data ?? []) as Array<{
    child_id: string;
    kids_class:
      | { name?: string | null; age_band?: string | null }
      | Array<{ name?: string | null; age_band?: string | null }>
      | null;
  }>) {
    classByChild.set(
      row.child_id,
      Array.isArray(row.kids_class) ? (row.kids_class[0] ?? null) : row.kids_class,
    );
  }

  const latestCheckinByChild = new Map<string, { state: string; occurred_at: string }>();
  for (const row of (checkinResult.data ?? []) as Array<{
    child_id: string;
    state: string;
    occurred_at: string;
  }>) {
    if (!latestCheckinByChild.has(row.child_id)) latestCheckinByChild.set(row.child_id, row);
  }

  const otherProfiles = new Map(
    ((otherProfilesResult.data ?? []) as Array<{ id: string; display_name: string }>).map(
      (profile) => [profile.id, profile.display_name],
    ),
  );

  return {
    configured: true,
    household: householdResult.data
      ? { id: String(householdResult.data.id), name: String(householdResult.data.name) }
      : null,
    members: memberRows.map((row) => {
      const profile = profileFromJoin(row.profile);
      return {
        id: row.profile_id,
        displayName: profile?.display_name ?? "Member",
        email: profile?.email ?? "",
        relationship: row.relationship,
        primaryContact: row.is_primary_contact,
      };
    }),
    children: childRows.map((child) => {
      const kidsClass = classByChild.get(child.id) ?? null;
      const checkin = latestCheckinByChild.get(child.id) ?? null;
      return {
        id: child.id,
        preferredName: child.preferred_name,
        birthDate: child.birth_date,
        className: kidsClass?.name ?? null,
        ageBand: kidsClass?.age_band ?? null,
        latestCheckinState: checkin?.state ?? null,
        latestCheckinAt: checkin?.occurred_at ?? null,
      };
    }),
    pickups: (
      (pickupResult.data ?? []) as Array<{
        id: string;
        child_id: string;
        display_name: string;
        relationship_label: string | null;
        phone_last_four: string | null;
        active: boolean;
      }>
    ).map((row) => ({
      id: row.id,
      childId: row.child_id,
      displayName: row.display_name,
      relationship: row.relationship_label,
      phoneLastFour: row.phone_last_four,
      active: row.active,
    })),
    mediaPermissions: (
      (permissionResult.data ?? []) as Array<{
        id: string;
        child_id: string;
        scope: string;
        granted: boolean;
        effective_from: string;
        revoked_at: string | null;
      }>
    ).map((row) => ({
      id: row.id,
      childId: row.child_id,
      scope: row.scope,
      granted: row.granted,
      effectiveFrom: row.effective_from,
      revokedAt: row.revoked_at,
    })),
    parentConnections: (
      (connectionResult.data ?? []) as Array<{
        id: string;
        requesting_guardian_id: string;
        receiving_guardian_id: string;
        status: string;
        updated_at: string;
      }>
    ).map((row) => {
      const otherProfileId =
        row.requesting_guardian_id === viewer.id
          ? row.receiving_guardian_id
          : row.requesting_guardian_id;
      return {
        id: row.id,
        otherProfileId,
        otherDisplayName: otherProfiles.get(otherProfileId) ?? "Approved parent",
        status: row.status,
        updatedAt: row.updated_at,
      };
    }),
    playdates: (
      (playdateResult.data ?? []) as Array<{
        id: string;
        proposed_window_start: string;
        general_location: string;
        notes: string | null;
        status: string;
      }>
    ).map((row) => ({
      id: row.id,
      title: row.notes,
      status: row.status,
      startsAt: row.proposed_window_start,
      generalLocation: row.general_location,
    })),
    checkinProviderUrl:
      process.env.PLANNING_CENTER_PRECHECK_URL ?? process.env.CHMS_CHECKIN_URL ?? null,
  };
}
