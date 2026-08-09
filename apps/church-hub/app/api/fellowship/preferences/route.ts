import { getApiViewer } from "@/lib/auth/api-viewer";
import { createClient } from "@/lib/supabase/server";

const categories = [
  "prayer",
  "families",
  "outdoors",
  "food",
  "service",
  "sports",
  "young-adults",
  "whole-church",
] as const;

function textArray(value: unknown, maximumItems: number, maximumLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.replace(/\s+/g, " ").trim().slice(0, maximumLength))
    .filter(Boolean)
    .slice(0, maximumItems);
}

export async function GET() {
  const viewer = await getApiViewer();
  if (!viewer) return Response.json({ message: "Sign in is required." }, { status: 401 });
  if (viewer.demo) {
    return Response.json({
      preferences: {
        recommendationsEnabled: true,
        openToLastMinute: true,
        familyFriendlyOnly: false,
        lowPressurePreferred: true,
        categories: ["prayer", "families", "service"],
        preferredTimeWindows: ["Saturday morning", "Sunday after worship"],
        generalAreas: ["Lowell area"],
        pausedUntil: null,
      },
      demo: true,
    });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fellowship_preferences")
    .select(
      "recommendations_enabled,open_to_last_minute,family_friendly_only,low_pressure_preferred,categories,preferred_time_windows,general_areas,paused_until",
    )
    .eq("profile_id", viewer.id)
    .maybeSingle();
  if (error) return Response.json({ message: "Preferences could not be loaded." }, { status: 400 });
  return Response.json({
    preferences: {
      recommendationsEnabled: data?.recommendations_enabled ?? false,
      openToLastMinute: data?.open_to_last_minute ?? false,
      familyFriendlyOnly: data?.family_friendly_only ?? false,
      lowPressurePreferred: data?.low_pressure_preferred ?? true,
      categories: data?.categories ?? [],
      preferredTimeWindows: data?.preferred_time_windows ?? [],
      generalAreas: data?.general_areas ?? [],
      pausedUntil: data?.paused_until ?? null,
    },
  });
}

export async function PUT(request: Request) {
  try {
    const viewer = await getApiViewer();
    if (!viewer) return Response.json({ message: "Sign in is required." }, { status: 401 });
    const body = (await request.json()) as Record<string, unknown>;
    const selectedCategories = textArray(body.categories, 8, 40).filter((category) =>
      categories.includes(category as (typeof categories)[number]),
    );
    const preferredTimeWindows = textArray(body.preferredTimeWindows, 12, 80);
    const generalAreas = textArray(body.generalAreas, 12, 100);
    const pausedUntil = body.pausedUntil ? new Date(String(body.pausedUntil)) : null;
    if (pausedUntil && Number.isNaN(pausedUntil.getTime())) throw new Error("Choose a valid pause date.");

    const preferences = {
      recommendationsEnabled: body.recommendationsEnabled === true,
      openToLastMinute: body.openToLastMinute === true,
      familyFriendlyOnly: body.familyFriendlyOnly === true,
      lowPressurePreferred: body.lowPressurePreferred !== false,
      categories: selectedCategories,
      preferredTimeWindows,
      generalAreas,
      pausedUntil: pausedUntil?.toISOString() ?? null,
    };
    if (viewer.demo) return Response.json({ preferences, demo: true });

    const supabase = await createClient();
    const { error } = await supabase.from("fellowship_preferences").upsert(
      {
        profile_id: viewer.id,
        recommendations_enabled: preferences.recommendationsEnabled,
        open_to_last_minute: preferences.openToLastMinute,
        family_friendly_only: preferences.familyFriendlyOnly,
        low_pressure_preferred: preferences.lowPressurePreferred,
        categories: preferences.categories,
        preferred_time_windows: preferences.preferredTimeWindows,
        general_areas: preferences.generalAreas,
        paused_until: preferences.pausedUntil,
      },
      { onConflict: "profile_id" },
    );
    if (error) throw new Error("Preferences could not be saved.");
    return Response.json({ preferences });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Preferences could not be saved." },
      { status: 400 },
    );
  }
}
