"use client";

import { useEffect, useState, type FormEvent } from "react";

interface Preferences {
  recommendationsEnabled: boolean;
  openToLastMinute: boolean;
  familyFriendlyOnly: boolean;
  lowPressurePreferred: boolean;
  categories: string[];
  preferredTimeWindows: string[];
  generalAreas: string[];
  pausedUntil: string | null;
}

const categoryOptions = [
  ["prayer", "Prayer"],
  ["families", "Families"],
  ["outdoors", "Outdoors"],
  ["food", "Coffee and meals"],
  ["service", "Service"],
  ["sports", "Sports and active gatherings"],
  ["young-adults", "Young adults"],
  ["whole-church", "Whole church"],
] as const;

const emptyPreferences: Preferences = {
  recommendationsEnabled: false,
  openToLastMinute: false,
  familyFriendlyOnly: false,
  lowPressurePreferred: true,
  categories: [],
  preferredTimeWindows: [],
  generalAreas: [],
  pausedUntil: null,
};

export function ConnectionPreferencesForm() {
  const [preferences, setPreferences] = useState<Preferences>(emptyPreferences);
  const [status, setStatus] = useState("Loading your explicit preferences…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/fellowship/preferences", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as {
          preferences?: Preferences;
          message?: string;
        };
        if (!response.ok || !result.preferences) {
          throw new Error(result.message ?? "Preferences could not be loaded.");
        }
        if (!active) return;
        setPreferences(result.preferences);
        setStatus("Recommendations use only the choices you save here and authorized meetup data.");
      })
      .catch((error: unknown) => {
        if (active) setStatus(error instanceof Error ? error.message : "Preferences could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, []);

  function toggleCategory(category: string) {
    setPreferences((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category],
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("Saving preferences…");
    const form = new FormData(event.currentTarget);
    const preferredTimeWindows = String(form.get("preferredTimeWindows") ?? "")
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    const generalAreas = String(form.get("generalAreas") ?? "")
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    const payload = { ...preferences, preferredTimeWindows, generalAreas };
    try {
      const response = await fetch("/api/fellowship/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        preferences?: Preferences;
        message?: string;
      };
      if (!response.ok || !result.preferences) {
        throw new Error(result.message ?? "Preferences could not be saved.");
      }
      setPreferences(result.preferences);
      setStatus("Preferences saved. Future recommendations must explain which saved choices matched.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Preferences could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="hub-panel connection-preferences-form" onSubmit={save}>
      <div className="preference-toggle-grid">
        <label>
          <input
            type="checkbox"
            checked={preferences.recommendationsEnabled}
            onChange={(event) =>
              setPreferences((current) => ({
                ...current,
                recommendationsEnabled: event.target.checked,
              }))
            }
          />
          <span><strong>Enable recommendations</strong><small>Suggest authorized meetups only when I opt in.</small></span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.openToLastMinute}
            onChange={(event) =>
              setPreferences((current) => ({ ...current, openToLastMinute: event.target.checked }))
            }
          />
          <span><strong>Open to last-minute invitations</strong><small>Include gatherings starting soon.</small></span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.familyFriendlyOnly}
            onChange={(event) =>
              setPreferences((current) => ({ ...current, familyFriendlyOnly: event.target.checked }))
            }
          />
          <span><strong>Family-friendly only</strong><small>Prefer gatherings that explicitly welcome children and guardians.</small></span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.lowPressurePreferred}
            onChange={(event) =>
              setPreferences((current) => ({ ...current, lowPressurePreferred: event.target.checked }))
            }
          />
          <span><strong>Prefer low-pressure gatherings</strong><small>Prioritize come-and-go, beginner-friendly invitations.</small></span>
        </label>
      </div>

      <fieldset>
        <legend>Gathering types I would like to see</legend>
        <div className="preference-category-grid">
          {categoryOptions.map(([value, label]) => (
            <label key={value}>
              <input
                type="checkbox"
                checked={preferences.categories.includes(value)}
                onChange={() => toggleCategory(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="host-meetup-form__row">
        <label>
          Preferred time windows
          <textarea
            name="preferredTimeWindows"
            rows={5}
            defaultValue={preferences.preferredTimeWindows.join("\n")}
            key={`times-${preferences.preferredTimeWindows.join("|")}`}
            placeholder={"Saturday morning\nSunday after worship\nWeeknights after 6:30 PM"}
          />
        </label>
        <label>
          General areas
          <textarea
            name="generalAreas"
            rows={5}
            defaultValue={preferences.generalAreas.join("\n")}
            key={`areas-${preferences.generalAreas.join("|")}`}
            placeholder={"Lowell area\nWithin a short drive\nOnline"}
          />
        </label>
        <label>
          Pause recommendations until
          <input
            type="date"
            value={preferences.pausedUntil?.slice(0, 10) ?? ""}
            onChange={(event) =>
              setPreferences((current) => ({
                ...current,
                pausedUntil: event.target.value ? `${event.target.value}T12:00:00.000Z` : null,
              }))
            }
          />
        </label>
      </div>

      <div className="recommendation-explanation-example">
        <p className="hub-kicker">How explanations must appear</p>
        <strong>Suggested because you selected:</strong>
        <p>
          {preferences.categories.length ? preferences.categories.join(", ") : "no categories yet"};{" "}
          {preferences.preferredTimeWindows.length
            ? preferences.preferredTimeWindows.join(", ")
            : "no saved time window"}; and{" "}
          {preferences.generalAreas.length ? preferences.generalAreas.join(", ") : "no saved area"}.
        </p>
        <small>
          Recommendations may not use prayer text, pastoral conversations, private messages, child
          records, counseling, inferred loneliness, or a hidden spiritual score.
        </small>
      </div>

      <div className="row-actions">
        <button className="hub-button hub-button--primary" disabled={busy}>
          {busy ? "Saving…" : "Save my preferences"}
        </button>
        <button
          className="hub-button hub-button--secondary"
          type="button"
          onClick={() =>
            setPreferences((current) => ({
              ...current,
              recommendationsEnabled: false,
              pausedUntil: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
            }))
          }
        >
          Pause for 30 days
        </button>
      </div>
      <p className="fellowship-notice" role="status" aria-live="polite">{status}</p>
    </form>
  );
}
