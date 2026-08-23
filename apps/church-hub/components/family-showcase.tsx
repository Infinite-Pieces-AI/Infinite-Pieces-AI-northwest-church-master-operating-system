"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PageHeading } from "./page-heading";

type FamilyView = "overview" | "checkin" | "household" | "pickup" | "media" | "parents";
type CheckinState = "not_checked_in" | "checked_in" | "ready_for_pickup" | "released";

type Child = {
  id: string;
  name: string;
  birthDate: string;
  ageBand: string;
  className: string;
  allergies: string;
  careNotes: string;
  checkinState: CheckinState;
  checkedInAt: string | null;
  securityCode: string | null;
};

type Adult = {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  primary: boolean;
};

type PickupAdult = {
  id: string;
  name: string;
  relationship: string;
  phoneLastFour: string;
  childIds: string[];
  active: boolean;
};

type Connection = {
  id: string;
  household: string;
  adults: string;
  status: "accepted" | "pending";
  shared: string;
};

type Playdate = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: "accepted" | "proposed";
  families: number;
};

type FamilyShowcaseState = {
  householdName: string;
  emergencyContact: string;
  adults: Adult[];
  children: Child[];
  pickups: PickupAdult[];
  consents: Record<string, Record<string, boolean>>;
  connections: Connection[];
  playdates: Playdate[];
};

const STORAGE_KEY = "boston-church-lowell-family-showcase-v3";

const services = [
  {
    id: "sunday-worship",
    label: "Sunday Worship",
    date: "Sunday, September 6",
    time: "10:00 AM–11:20 AM",
    place: "Butler Middle School",
  },
  {
    id: "midweek-childcare",
    label: "Midweek Fellowship Childcare",
    date: "Wednesday, September 9",
    time: "6:30 PM–8:15 PM",
    place: "Approved ministry location",
  },
  {
    id: "parents-night",
    label: "Parents’ Night Fellowship",
    date: "Friday, September 18",
    time: "6:00 PM–9:00 PM",
    place: "Approved ministry location",
  },
] as const;

const consentScopes = [
  ["private_household", "Private household album", "Visible only to verified household adults"],
  ["private_class_album", "Private class album", "Visible to authorized class families and leaders"],
  ["parent_community", "Parent community", "Visible inside approved parent groups"],
  ["internal_presentation", "Internal church presentation", "Slides shown during an internal church gathering"],
  ["public_website", "Public website", "May appear on the church’s public website"],
  ["official_social", "Official social media", "May appear on church-owned social accounts"],
  ["advertising", "Promotional advertising", "May be used in paid promotion"],
] as const;

const initialState: FamilyShowcaseState = {
  householdName: "The Parker Household",
  emergencyContact: "Jordan Parker · (978) 555-0142",
  adults: [
    {
      id: "adult-jordan",
      name: "Jordan Parker",
      relationship: "Parent / guardian",
      email: "jordan@example.invalid",
      phone: "(978) 555-0142",
      primary: true,
    },
    {
      id: "adult-avery",
      name: "Avery Parker",
      relationship: "Parent / guardian",
      email: "avery@example.invalid",
      phone: "(978) 555-0187",
      primary: false,
    },
  ],
  children: [
    {
      id: "child-mia",
      name: "Mia Parker",
      birthDate: "2018-04-12",
      ageBand: "Kindergarten–Grade 2",
      className: "Elementary Explorers",
      allergies: "No known allergies",
      careNotes: "May keep a small comfort item in her backpack.",
      checkinState: "not_checked_in",
      checkedInAt: null,
      securityCode: null,
    },
    {
      id: "child-noah",
      name: "Noah Parker",
      birthDate: "2021-08-03",
      ageBand: "Ages 3–5",
      className: "Preschool Sprouts",
      allergies: "Peanut allergy",
      careNotes: "Epinephrine plan reviewed with the Kids Kingdom lead.",
      checkinState: "not_checked_in",
      checkedInAt: null,
      securityCode: null,
    },
  ],
  pickups: [
    {
      id: "pickup-elena",
      name: "Elena Parker",
      relationship: "Grandparent",
      phoneLastFour: "2408",
      childIds: ["child-mia", "child-noah"],
      active: true,
    },
    {
      id: "pickup-marcus",
      name: "Marcus Hill",
      relationship: "Uncle",
      phoneLastFour: "7721",
      childIds: ["child-mia"],
      active: true,
    },
  ],
  consents: {
    "child-mia": {
      private_household: true,
      private_class_album: true,
      parent_community: true,
      internal_presentation: true,
      public_website: false,
      official_social: false,
      advertising: false,
    },
    "child-noah": {
      private_household: true,
      private_class_album: true,
      parent_community: false,
      internal_presentation: false,
      public_website: false,
      official_social: false,
      advertising: false,
    },
  },
  connections: [
    {
      id: "connection-lee",
      household: "The Lee Household",
      adults: "Maya and Chris Lee",
      status: "accepted",
      shared: "Email and in-app messaging",
    },
    {
      id: "connection-chen",
      household: "The Chen Household",
      adults: "Samuel and Ruth Chen",
      status: "pending",
      shared: "Nothing shared until accepted",
    },
  ],
  playdates: [
    {
      id: "playdate-shedd",
      title: "Family prayer walk and playground time",
      date: "Saturday, September 12",
      time: "10:00 AM–11:30 AM",
      location: "Shedd Park · general meeting point shared after acceptance",
      status: "accepted",
      families: 3,
    },
    {
      id: "playdate-lunch",
      title: "Lunch after Sunday worship",
      date: "Sunday, September 20",
      time: "12:00 PM–1:30 PM",
      location: "Public restaurant in Lowell",
      status: "proposed",
      families: 2,
    },
  ],
};

const qrPattern = [
  1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1,
  1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1,
  1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1,
  1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1,
  1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1,
  0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0,
  1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1,
  0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1,
  1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0,
  1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1,
  1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0,
  1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1,
  1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1,
];

const routes: Record<FamilyView, { title: string; eyebrow: string; description: string }> = {
  overview: {
    title: "Family",
    eyebrow: "Guardian-managed family operations",
    description:
      "A complete family command center for household information, Kids Kingdom check-in, pickup safety, media consent, and parent connection.",
  },
  checkin: {
    title: "Kids Kingdom Check-In",
    eyebrow: "Family · Sunday and event childcare",
    description:
      "Scan the household pass, confirm each child’s class and care information, print labels, and verify pickup with a private security code.",
  },
  household: {
    title: "Household",
    eyebrow: "Family · profile and care information",
    description:
      "Maintain household adults, children, emergency contacts, allergies, care notes, and age-appropriate class placement.",
  },
  pickup: {
    title: "Authorized Pickup",
    eyebrow: "Family · child-release safety",
    description:
      "Choose which trusted adults may pick up each child and keep verification information current.",
  },
  media: {
    title: "Media Consent",
    eyebrow: "Family · permission by exact use",
    description:
      "Allow or deny private albums, internal presentations, public pages, social media, and advertising separately for every child.",
  },
  parents: {
    title: "Parent Community",
    eyebrow: "Family · opt-in connection",
    description:
      "Connect adult-to-adult, plan public-place playdates, and join family fellowship without exposing children’s private locations or schedules.",
  },
};

function makeCode() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(100000 + (values[0] % 900000));
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function statusLabel(state: CheckinState) {
  if (state === "checked_in") return "Checked in";
  if (state === "ready_for_pickup") return "Ready for pickup";
  if (state === "released") return "Released to guardian";
  return "Not checked in";
}

export function FamilyShowcase({ initialView = "overview" }: { initialView?: FamilyView }) {
  const [view, setView] = useState<FamilyView>(initialView);
  const [state, setState] = useState<FamilyShowcaseState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [selectedService, setSelectedService] = useState(services[0].id);
  const [selectedChildren, setSelectedChildren] = useState<string[]>(
    initialState.children.map((child) => child.id),
  );
  const [selectedConsentChild, setSelectedConsentChild] = useState(initialState.children[0].id);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState(
    "Ask where to check in a child, update pickup permissions, change photo consent, or find other parents.",
  );
  const [notice, setNotice] = useState(
    "Interactive showcase records are stored only in this browser and never touch church production data.",
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setState(JSON.parse(stored) as FamilyShowcaseState);
    } catch {
      // A blocked or malformed localStorage entry should never prevent the showcase from loading.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [loaded, state]);

  const currentService = services.find((service) => service.id === selectedService) ?? services[0];
  const selectedConsent = state.consents[selectedConsentChild] ?? {};
  const checkedInCount = state.children.filter((child) => child.checkinState === "checked_in").length;
  const activePickupCount = state.pickups.filter((pickup) => pickup.active).length;
  const allowedPrivateAlbums = state.children.filter(
    (child) => state.consents[child.id]?.private_class_album,
  ).length;

  const heading = routes[view];

  function chooseView(nextView: FamilyView, message?: string) {
    setView(nextView);
    if (message) setNotice(message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function answerFamilyQuestion(question = assistantQuestion) {
    const normalized = question.toLowerCase();
    if (/check.?in|class|label|security code|scan/.test(normalized)) {
      chooseView("checkin");
      setAssistantAnswer(
        "I opened Kids Kingdom Check-In. Scan the household pass, select the children attending, confirm their class and care information, then create labels and a pickup code.",
      );
    } else if (/pickup|trusted adult|release|grandparent/.test(normalized)) {
      chooseView("pickup");
      setAssistantAnswer(
        "I opened Authorized Pickup, where guardians can add or pause trusted adults and control which children each adult may receive.",
      );
    } else if (/photo|media|consent|social|website/.test(normalized)) {
      chooseView("media");
      setAssistantAnswer(
        "I opened Media Consent. Each use is separate, so a private class album never automatically authorizes a public website or social post.",
      );
    } else if (/playdate|parent|family friend|connect/.test(normalized)) {
      chooseView("parents");
      setAssistantAnswer(
        "I opened Parent Community for opt-in adult connections and public-place family plans. Children’s homes, schools, and recurring schedules stay private.",
      );
    } else {
      chooseView("household");
      setAssistantAnswer(
        "I opened Household, where guardians can maintain adults, children, emergency contacts, allergies, care notes, and class placement.",
      );
    }
  }

  function checkInChildren() {
    const now = new Date().toISOString();
    setState((current) => ({
      ...current,
      children: current.children.map((child) =>
        selectedChildren.includes(child.id)
          ? {
              ...child,
              checkinState: "checked_in",
              checkedInAt: now,
              securityCode: makeCode(),
            }
          : child,
      ),
    }));
    setNotice(
      `${selectedChildren.length} child${selectedChildren.length === 1 ? "" : "ren"} checked in for ${currentService.label}. Labels and pickup codes are ready.`,
    );
  }

  function updateCheckinState(childId: string, checkinState: CheckinState) {
    setState((current) => ({
      ...current,
      children: current.children.map((child) =>
        child.id === childId ? { ...child, checkinState } : child,
      ),
    }));
  }

  function addAdult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (!name) return;
    setState((current) => ({
      ...current,
      adults: [
        ...current.adults,
        {
          id: makeId("adult"),
          name,
          relationship: String(data.get("relationship") ?? "Household adult"),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          primary: false,
        },
      ],
    }));
    event.currentTarget.reset();
    setNotice(`${name} was added to the showcase household.`);
  }

  function addChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (!name) return;
    const id = makeId("child");
    setState((current) => ({
      ...current,
      children: [
        ...current.children,
        {
          id,
          name,
          birthDate: String(data.get("birthDate") ?? ""),
          ageBand: String(data.get("ageBand") ?? "Age band pending"),
          className: String(data.get("className") ?? "Class placement pending"),
          allergies: String(data.get("allergies") ?? "No known allergies"),
          careNotes: String(data.get("careNotes") ?? ""),
          checkinState: "not_checked_in",
          checkedInAt: null,
          securityCode: null,
        },
      ],
      consents: {
        ...current.consents,
        [id]: Object.fromEntries(consentScopes.map(([scope]) => [scope, false])),
      },
    }));
    setSelectedChildren((current) => [...current, id]);
    event.currentTarget.reset();
    setNotice(`${name} was added with guardian-managed care and consent settings.`);
  }

  function addPickup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (!name) return;
    setState((current) => ({
      ...current,
      pickups: [
        ...current.pickups,
        {
          id: makeId("pickup"),
          name,
          relationship: String(data.get("relationship") ?? "Trusted adult"),
          phoneLastFour: String(data.get("phoneLastFour") ?? ""),
          childIds: data.getAll("children").map(String),
          active: true,
        },
      ],
    }));
    event.currentTarget.reset();
    setNotice(`${name} was added as an active trusted pickup adult.`);
  }

  function togglePickup(id: string) {
    setState((current) => ({
      ...current,
      pickups: current.pickups.map((pickup) =>
        pickup.id === id ? { ...pickup, active: !pickup.active } : pickup,
      ),
    }));
  }

  function toggleConsent(scope: string) {
    setState((current) => ({
      ...current,
      consents: {
        ...current.consents,
        [selectedConsentChild]: {
          ...(current.consents[selectedConsentChild] ?? {}),
          [scope]: !current.consents[selectedConsentChild]?.[scope],
        },
      },
    }));
  }

  function addPlaydate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    if (!title) return;
    setState((current) => ({
      ...current,
      playdates: [
        {
          id: makeId("playdate"),
          title,
          date: String(data.get("date") ?? "Date pending"),
          time: String(data.get("time") ?? "Time pending"),
          location: String(data.get("location") ?? "Public location pending"),
          status: "proposed",
          families: 1,
        },
        ...current.playdates,
      ],
    }));
    event.currentTarget.reset();
    setNotice(`“${title}” was added as a parent-to-parent proposal.`);
  }

  function resetShowcase() {
    setState(initialState);
    setSelectedChildren(initialState.children.map((child) => child.id));
    setSelectedConsentChild(initialState.children[0].id);
    window.localStorage.removeItem(STORAGE_KEY);
    setNotice("The family showcase was reset to its original review state.");
  }

  return (
    <>
      <PageHeading
        eyebrow={heading.eyebrow}
        title={heading.title}
        description={heading.description}
        actions={
          <button className="hub-button hub-button--secondary" type="button" onClick={resetShowcase}>
            Reset showcase
          </button>
        }
      />

      <section className="showcase-trust-strip" aria-live="polite">
        <span aria-hidden="true">◆</span>
        <div>
          <strong>Interactive finished-product showcase</strong>
          <p>{notice}</p>
        </div>
      </section>

      <section className="family-ai-guide">
        <div>
          <p className="hub-kicker">AI Family Guide</p>
          <h2>Tell Church Hub what your family needs.</h2>
          <p>{assistantAnswer}</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            answerFamilyQuestion();
          }}
        >
          <input
            value={assistantQuestion}
            onChange={(event) => setAssistantQuestion(event.target.value)}
            placeholder="How do I check in my kids or change pickup permission?"
          />
          <button className="hub-button hub-button--primary" type="submit">
            Guide me
          </button>
        </form>
        <div className="family-ai-guide__quick">
          {[
            ["Check in my children", "checkin"],
            ["Manage pickup adults", "pickup"],
            ["Change photo consent", "media"],
            ["Find parent connections", "parents"],
          ].map(([label, question]) => (
            <button key={label} type="button" onClick={() => answerFamilyQuestion(question)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <nav className="family-showcase-nav" aria-label="Family workspace sections">
        {(
          [
            ["overview", "Overview", "⌂"],
            ["checkin", "Kids Check-In", "▦"],
            ["household", "Household", "◇"],
            ["pickup", "Pickup", "✓"],
            ["media", "Media", "◫"],
            ["parents", "Parents", "∞"],
          ] as const
        ).map(([value, label, icon]) => (
          <button
            className={view === value ? "active" : ""}
            key={value}
            type="button"
            onClick={() => chooseView(value)}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {view === "overview" ? (
        <div className="family-showcase-overview">
          <section className="family-command-hero">
            <div>
              <p className="hub-kicker">Next family operation</p>
              <h2>{currentService.label}</h2>
              <p>
                {currentService.date} · {currentService.time}
                <br />
                {currentService.place}
              </p>
              <div className="row-actions">
                <button
                  className="hub-button hub-button--primary"
                  type="button"
                  onClick={() => chooseView("checkin")}
                >
                  Start family pre-check
                </button>
                <button
                  className="hub-button hub-button--secondary"
                  type="button"
                  onClick={() => setScannerOpen(true)}
                >
                  Show household QR
                </button>
              </div>
            </div>
            <div className="family-command-hero__status">
              <span>{state.children.length}</span>
              <strong>children ready</strong>
              <small>{activePickupCount} active pickup adults</small>
            </div>
          </section>

          <div className="family-showcase-metrics">
            <article>
              <span>Kids Kingdom</span>
              <strong>{checkedInCount}/{state.children.length}</strong>
              <small>currently checked in</small>
            </article>
            <article>
              <span>Pickup safety</span>
              <strong>{activePickupCount}</strong>
              <small>verified trusted adults</small>
            </article>
            <article>
              <span>Private albums</span>
              <strong>{allowedPrivateAlbums}/{state.children.length}</strong>
              <small>children allowed</small>
            </article>
            <article>
              <span>Parent plans</span>
              <strong>{state.playdates.length}</strong>
              <small>active or proposed</small>
            </article>
          </div>

          <div className="dashboard-grid">
            <section className="hub-panel hub-panel--span2">
              <div className="panel-heading">
                <div>
                  <p className="hub-kicker">{state.householdName}</p>
                  <h2>Family readiness</h2>
                </div>
                <button
                  className="hub-button hub-button--secondary"
                  type="button"
                  onClick={() => chooseView("household")}
                >
                  Manage household
                </button>
              </div>
              <div className="family-child-grid">
                {state.children.map((child) => (
                  <article key={child.id}>
                    <span className="family-child-grid__avatar">{child.name.slice(0, 1)}</span>
                    <div>
                      <strong>{child.name}</strong>
                      <small>{child.className} · {child.ageBand}</small>
                      <p>{child.allergies}</p>
                    </div>
                    <b className={`family-status family-status--${child.checkinState}`}>
                      {statusLabel(child.checkinState)}
                    </b>
                  </article>
                ))}
              </div>
            </section>

            <section className="hub-panel">
              <p className="hub-kicker">Private family album</p>
              <h2>Sunday moments</h2>
              <div className="family-photo-grid" aria-label="Illustrative private family album">
                <span>Craft</span>
                <span>Story</span>
                <span>Music</span>
                <span>Friends</span>
              </div>
              <p className="privacy-note">
                Album visibility follows each child’s exact guardian permission.
              </p>
            </section>

            <section className="hub-panel">
              <p className="hub-kicker">Trusted adults</p>
              <h2>Pickup ready</h2>
              <div className="compact-list">
                {state.pickups.filter((pickup) => pickup.active).slice(0, 3).map((pickup) => (
                  <article key={pickup.id}>
                    <span className="list-icon">✓</span>
                    <div>
                      <strong>{pickup.name}</strong>
                      <small>{pickup.relationship} · phone •••• {pickup.phoneLastFour}</small>
                    </div>
                  </article>
                ))}
              </div>
              <button
                className="hub-button hub-button--secondary"
                type="button"
                onClick={() => chooseView("pickup")}
              >
                Review pickup permissions
              </button>
            </section>

            <section className="hub-panel hub-panel--span2">
              <div className="panel-heading">
                <div>
                  <p className="hub-kicker">Parent community</p>
                  <h2>Upcoming family connection</h2>
                </div>
                <button
                  className="hub-button hub-button--secondary"
                  type="button"
                  onClick={() => chooseView("parents")}
                >
                  Open parent community
                </button>
              </div>
              {state.playdates.slice(0, 2).map((playdate) => (
                <article className="family-plan-card" key={playdate.id}>
                  <span aria-hidden="true">∞</span>
                  <div>
                    <strong>{playdate.title}</strong>
                    <small>{playdate.date} · {playdate.time} · {playdate.location}</small>
                  </div>
                  <b>{playdate.families} families</b>
                </article>
              ))}
            </section>
          </div>
        </div>
      ) : null}

      {view === "checkin" ? (
        <div className="family-checkin-workspace">
          <section className="checkin-control-panel">
            <div className="checkin-service-picker">
              <p className="hub-kicker">1 · Choose the church gathering</p>
              <h2>When are you checking in?</h2>
              <div>
                {services.map((service) => (
                  <button
                    className={selectedService === service.id ? "active" : ""}
                    type="button"
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <strong>{service.label}</strong>
                    <span>{service.date}</span>
                    <small>{service.time} · {service.place}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="checkin-scan-card">
              <p className="hub-kicker">2 · Identify the household</p>
              <h2>Scan or open the household pass</h2>
              <div className="showcase-qr" aria-label="Household QR preview">
                {qrPattern.map((filled, index) => (
                  <span className={filled ? "filled" : ""} key={index} />
                ))}
              </div>
              <strong>{state.householdName}</strong>
              <small>Household pass · changes when a guardian revokes it</small>
              <button className="hub-button hub-button--primary" type="button" onClick={() => setScannerOpen(true)}>
                Open scanner experience
              </button>
            </div>
          </section>

          <section className="hub-panel">
            <div className="panel-heading">
              <div>
                <p className="hub-kicker">3 · Confirm children and class placement</p>
                <h2>Who is attending?</h2>
              </div>
              <span className="pill">{selectedChildren.length} selected</span>
            </div>
            <div className="checkin-child-list">
              {state.children.map((child) => {
                const selected = selectedChildren.includes(child.id);
                return (
                  <article className={selected ? "selected" : ""} key={child.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          setSelectedChildren((current) =>
                            current.includes(child.id)
                              ? current.filter((id) => id !== child.id)
                              : [...current, child.id],
                          )
                        }
                      />
                      <span className="family-child-grid__avatar">{child.name.slice(0, 1)}</span>
                      <div>
                        <strong>{child.name}</strong>
                        <small>{child.className} · {child.ageBand}</small>
                      </div>
                    </label>
                    <div className="checkin-care-flags">
                      <span>{child.allergies}</span>
                      <span>{child.careNotes}</span>
                    </div>
                    <select
                      value={child.className}
                      onChange={(event) =>
                        setState((current) => ({
                          ...current,
                          children: current.children.map((row) =>
                            row.id === child.id ? { ...row, className: event.target.value } : row,
                          ),
                        }))
                      }
                    >
                      <option>Nursery</option>
                      <option>Preschool Sprouts</option>
                      <option>Elementary Explorers</option>
                      <option>Preteen Foundations</option>
                    </select>
                  </article>
                );
              })}
            </div>
            <div className="checkin-confirmation">
              <label>
                <input type="checkbox" defaultChecked />
                I reviewed allergies, care notes, class placement, and the adults authorized for pickup.
              </label>
              <button
                className="hub-button hub-button--primary"
                type="button"
                disabled={!selectedChildren.length}
                onClick={checkInChildren}
              >
                Check in and create labels
              </button>
            </div>
          </section>

          <section className="hub-panel">
            <div className="panel-heading">
              <div>
                <p className="hub-kicker">4 · Labels, classroom status, and release</p>
                <h2>Current child status</h2>
              </div>
              <button className="hub-button hub-button--secondary" type="button" onClick={() => window.print()}>
                Print label sheet
              </button>
            </div>
            <div className="checkin-label-grid">
              {state.children.map((child) => (
                <article key={child.id}>
                  <header>
                    <span>{child.name.slice(0, 1)}</span>
                    <div>
                      <strong>{child.name}</strong>
                      <small>{child.className}</small>
                    </div>
                    <b className={`family-status family-status--${child.checkinState}`}>
                      {statusLabel(child.checkinState)}
                    </b>
                  </header>
                  <dl>
                    <div><dt>Care flag</dt><dd>{child.allergies}</dd></div>
                    <div><dt>Pickup code</dt><dd>{child.securityCode ?? "Created at check-in"}</dd></div>
                    <div><dt>Checked in</dt><dd>{child.checkedInAt ? new Date(child.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}</dd></div>
                  </dl>
                  <div className="row-actions">
                    {child.checkinState === "checked_in" ? (
                      <button className="hub-button hub-button--secondary" type="button" onClick={() => updateCheckinState(child.id, "ready_for_pickup")}>Page guardian</button>
                    ) : null}
                    {child.checkinState === "ready_for_pickup" ? (
                      <button className="hub-button hub-button--primary" type="button" onClick={() => updateCheckinState(child.id, "released")}>Verify code and release</button>
                    ) : null}
                    {child.checkinState === "released" ? (
                      <button className="hub-button hub-button--secondary" type="button" onClick={() => updateCheckinState(child.id, "not_checked_in")}>Reset child status</button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {view === "household" ? (
        <div className="dashboard-grid">
          <section className="hub-panel">
            <p className="hub-kicker">Household identity</p>
            <h2>Core information</h2>
            <div className="family-form">
              <label>
                Household name
                <input value={state.householdName} onChange={(event) => setState((current) => ({ ...current, householdName: event.target.value }))} />
              </label>
              <label>
                Emergency contact
                <input value={state.emergencyContact} onChange={(event) => setState((current) => ({ ...current, emergencyContact: event.target.value }))} />
              </label>
              <button className="hub-button hub-button--primary" type="button" onClick={() => setNotice("Household information was saved in this browser.")}>Save household</button>
            </div>
          </section>

          <section className="hub-panel hub-panel--span2">
            <p className="hub-kicker">Household adults</p>
            <h2>Parents and guardians</h2>
            <div className="family-record-list">
              {state.adults.map((adult) => (
                <article key={adult.id}>
                  <span className="avatar">{adult.name.slice(0, 1)}</span>
                  <div>
                    <strong>{adult.name}</strong>
                    <small>{adult.relationship}{adult.primary ? " · Primary contact" : ""} · {adult.phone} · {adult.email}</small>
                  </div>
                </article>
              ))}
            </div>
            <details className="family-inline-details">
              <summary>Add another household adult</summary>
              <form className="family-form" onSubmit={addAdult}>
                <div className="family-form__row">
                  <label>Full name<input name="name" required /></label>
                  <label>Relationship<input name="relationship" placeholder="Parent, guardian, adult child…" /></label>
                </div>
                <div className="family-form__row">
                  <label>Email<input name="email" type="email" /></label>
                  <label>Phone<input name="phone" type="tel" /></label>
                </div>
                <button className="hub-button hub-button--primary" type="submit">Add household adult</button>
              </form>
            </details>
          </section>

          <section className="hub-panel hub-panel--span2">
            <p className="hub-kicker">Children and care details</p>
            <h2>Guardian-managed child profiles</h2>
            <div className="family-child-profile-grid">
              {state.children.map((child) => (
                <article key={child.id}>
                  <header><span>{child.name.slice(0, 1)}</span><div><strong>{child.name}</strong><small>{child.ageBand} · {child.className}</small></div></header>
                  <label>Allergy / medical flag<input value={child.allergies} onChange={(event) => setState((current) => ({ ...current, children: current.children.map((row) => row.id === child.id ? { ...row, allergies: event.target.value } : row) }))} /></label>
                  <label>Care notes<textarea rows={3} value={child.careNotes} onChange={(event) => setState((current) => ({ ...current, children: current.children.map((row) => row.id === child.id ? { ...row, careNotes: event.target.value } : row) }))} /></label>
                </article>
              ))}
            </div>
            <details className="family-inline-details">
              <summary>Add a child profile</summary>
              <form className="family-form" onSubmit={addChild}>
                <div className="family-form__row">
                  <label>Child’s name<input name="name" required /></label>
                  <label>Birth date<input name="birthDate" type="date" required /></label>
                </div>
                <div className="family-form__row">
                  <label>Age band<input name="ageBand" placeholder="Ages 3–5" /></label>
                  <label>Class placement<input name="className" placeholder="Preschool Sprouts" /></label>
                </div>
                <label>Allergies or care flag<input name="allergies" placeholder="No known allergies" /></label>
                <label>Care notes<textarea name="careNotes" rows={3} /></label>
                <button className="hub-button hub-button--primary" type="submit">Add child profile</button>
              </form>
            </details>
          </section>
        </div>
      ) : null}

      {view === "pickup" ? (
        <div className="dashboard-grid">
          <section className="hub-panel">
            <p className="hub-kicker">Add trusted adult</p>
            <h2>Pickup authorization</h2>
            <form className="family-form" onSubmit={addPickup}>
              <label>Adult’s full name<input name="name" required /></label>
              <label>Relationship<input name="relationship" placeholder="Grandparent, aunt, family friend…" /></label>
              <label>Last four phone digits<input name="phoneLastFour" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required /></label>
              <fieldset>
                <legend>May pick up</legend>
                {state.children.map((child) => <label className="family-check-line" key={child.id}><input name="children" type="checkbox" value={child.id} defaultChecked /> {child.name}</label>)}
              </fieldset>
              <button className="hub-button hub-button--primary" type="submit">Add trusted adult</button>
            </form>
          </section>
          <section className="hub-panel hub-panel--span2">
            <p className="hub-kicker">Current child-release permissions</p>
            <h2>Trusted adults</h2>
            <div className="family-record-list">
              {state.pickups.map((pickup) => (
                <article key={pickup.id}>
                  <span className="avatar">{pickup.name.slice(0, 1)}</span>
                  <div>
                    <strong>{pickup.name}</strong>
                    <small>{pickup.relationship} · phone •••• {pickup.phoneLastFour} · {pickup.childIds.map((id) => state.children.find((child) => child.id === id)?.name).filter(Boolean).join(", ")}</small>
                  </div>
                  <button className={`hub-button ${pickup.active ? "hub-button--secondary" : "hub-button--primary"}`} type="button" onClick={() => togglePickup(pickup.id)}>{pickup.active ? "Pause permission" : "Reactivate"}</button>
                </article>
              ))}
            </div>
            <p className="privacy-note">A name on this screen is never enough for release. The operational workflow still verifies the child label, pickup code, adult record, and guardian authorization.</p>
          </section>
        </div>
      ) : null}

      {view === "media" ? (
        <div className="dashboard-grid">
          <section className="hub-panel">
            <p className="hub-kicker">Choose child</p>
            <h2>Consent profile</h2>
            <div className="family-consent-child-picker">
              {state.children.map((child) => (
                <button className={selectedConsentChild === child.id ? "active" : ""} type="button" key={child.id} onClick={() => setSelectedConsentChild(child.id)}><span>{child.name.slice(0, 1)}</span><strong>{child.name}</strong><small>{child.className}</small></button>
              ))}
            </div>
          </section>
          <section className="hub-panel hub-panel--span2">
            <p className="hub-kicker">Permission by exact use</p>
            <h2>What may the church do with images of {state.children.find((child) => child.id === selectedConsentChild)?.name}?</h2>
            <div className="family-consent-list">
              {consentScopes.map(([scope, label, description]) => {
                const allowed = Boolean(selectedConsent[scope]);
                return <article key={scope}><div><strong>{label}</strong><small>{description}</small></div><button className={allowed ? "allowed" : "denied"} type="button" onClick={() => toggleConsent(scope)}><span>{allowed ? "Allowed" : "Not allowed"}</span><i /></button></article>;
              })}
            </div>
            <p className="privacy-note">No permission cascades into another scope. Public website, social media, and advertising remain off until a guardian explicitly enables each one.</p>
          </section>
        </div>
      ) : null}

      {view === "parents" ? (
        <div className="dashboard-grid">
          <section className="hub-panel">
            <p className="hub-kicker">Opt-in adult connections</p>
            <h2>Parent network</h2>
            <div className="family-record-list">
              {state.connections.map((connection) => (
                <article key={connection.id}>
                  <span className="avatar">{connection.household.replace("The ", "").slice(0, 1)}</span>
                  <div><strong>{connection.household}</strong><small>{connection.adults} · {connection.shared}</small></div>
                  {connection.status === "pending" ? <button className="hub-button hub-button--primary" type="button" onClick={() => setState((current) => ({ ...current, connections: current.connections.map((row) => row.id === connection.id ? { ...row, status: "accepted", shared: "Email and in-app messaging" } : row) }))}>Accept</button> : <span className="pill">Connected</span>}
                </article>
              ))}
            </div>
          </section>
          <section className="hub-panel hub-panel--span2">
            <p className="hub-kicker">Create public-place family plan</p>
            <h2>Propose a playdate or family outing</h2>
            <form className="family-form" onSubmit={addPlaydate}>
              <label>Activity title<input name="title" placeholder="Family prayer walk and playground time" required /></label>
              <div className="family-form__row"><label>Date<input name="date" type="date" required /></label><label>Time<input name="time" placeholder="10:00 AM–11:30 AM" required /></label></div>
              <label>General public location<input name="location" placeholder="Shedd Park · exact meeting point after acceptance" required /></label>
              <button className="hub-button hub-button--primary" type="submit">Create proposal</button>
            </form>
            <h3>Current family plans</h3>
            {state.playdates.map((playdate) => <article className="family-plan-card" key={playdate.id}><span aria-hidden="true">∞</span><div><strong>{playdate.title}</strong><small>{playdate.date} · {playdate.time} · {playdate.location}</small></div><b>{playdate.status}</b></article>)}
            <p className="privacy-note">A child’s school, home address, custody details, recurring schedule, and live location never appear in the parent directory or public invitation.</p>
          </section>
        </div>
      ) : null}

      {scannerOpen ? (
        <div className="family-scanner-modal" role="dialog" aria-modal="true" aria-label="Household QR scanner">
          <div>
            <button className="family-scanner-modal__close" type="button" onClick={() => setScannerOpen(false)} aria-label="Close scanner">×</button>
            <p className="hub-kicker">Kids Kingdom station</p>
            <h2>Scan household pass</h2>
            <div className="family-scanner-window"><span /><b>Position the family QR code inside the frame</b></div>
            <button className="hub-button hub-button--primary" type="button" onClick={() => { setScannerOpen(false); setNotice(`${state.householdName} was recognized and is ready for child selection.`); chooseView("checkin"); }}>Use showcase household pass</button>
            <small>Production can use the device camera, a kiosk scanner, or an approved church-management provider.</small>
          </div>
        </div>
      ) : null}
    </>
  );
}
