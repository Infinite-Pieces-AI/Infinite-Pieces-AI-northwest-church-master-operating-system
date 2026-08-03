
export const aiAllowedSources = [
  "approved_belief_document",
  "published_sermon_transcript",
  "published_weekly_lesson",
  "minister_approved_study_resource",
  "licensed_scripture_passage",
  "public_ministry_faq"
] as const;

export const aiProhibitedDataClasses = [
  "child_record",
  "private_prayer_request",
  "counseling_record",
  "attendance_record",
  "safeguarding_report",
  "medical_note",
  "custody_detail",
  "private_channel_message"
] as const;

export type AiAllowedSource = (typeof aiAllowedSources)[number];
export type AiProhibitedDataClass = (typeof aiProhibitedDataClasses)[number];

export interface AiCitation {
  documentId: string;
  title: string;
  sourceType: AiAllowedSource;
  excerpt: string;
  canonicalUrl?: string;
}

export interface AiAnswer {
  scripture: { references: string[]; licensedText?: string };
  churchTeaching: string;
  aiExplanation: string;
  citations: AiCitation[];
  requiresPastoralFollowUp: boolean;
}

export function assertAiRequestAllowed(input: {
  requestedDataClasses: readonly string[];
  publishAutomatically?: boolean;
  recipientIsMinor?: boolean;
}): void {
  const prohibited = input.requestedDataClasses.filter((item) =>
    aiProhibitedDataClasses.includes(item as AiProhibitedDataClass)
  );

  if (prohibited.length) {
    throw new Error(`AI request contains prohibited data classes: ${prohibited.join(", ")}`);
  }
  if (input.publishAutomatically) throw new Error("AI output may not publish automatically");
  if (input.recipientIsMinor) throw new Error("AI may not communicate independently with a minor");
}

export function buildBibleCompanionSystemPrompt(): string {
  return [
    "You are a retrieval-grounded study assistant for an approved church knowledge library.",
    "Return three visibly separate sections named SCRIPTURE, CHURCH TEACHING, and AI EXPLANATION.",
    "SCRIPTURE may contain exact text only when the passage was supplied by an approved licensed provider.",
    "CHURCH TEACHING must summarize only church-authored or minister-approved material.",
    "AI EXPLANATION must be clearly labeled as generated explanation and never as doctrine.",
    "Cite every substantive claim to an approved source.",
    "Do not claim pastoral, legal, medical, safeguarding, or doctrinal authority.",
    "Do not access or infer private prayer, child, counseling, attendance, medical, or safeguarding data.",
    "When the approved library does not support an answer, say so and recommend speaking with a minister."
  ].join(" ");
}

/** Backward-compatible alias for early consumers of the package. */
export const bibleCompanionSystemPrompt = buildBibleCompanionSystemPrompt;

export interface CurriculumDayDraft {
  day: number;
  title: string;
  scriptureReferences: readonly string[];
  reflectionQuestion: string;
  practicePrompt: string;
  groupDiscussionPrompt?: string;
}

export interface WeeklyCurriculumDraft {
  lessonId: string;
  sourceDocumentIds: readonly string[];
  theme: string;
  days: readonly CurriculumDayDraft[];
  generatedStatus: "draft_only";
  requiresMinisterReview: true;
  citationsRequired: true;
}

export function buildSermonCurriculumSystemPrompt(): string {
  return [
    buildBibleCompanionSystemPrompt(),
    "Transform the approved sermon outline into a seven-day draft curriculum.",
    "Each day must include a concise title, cited Scripture references, one reflection question, and one practical action.",
    "Do not invent a church position, promise an outcome, or treat generated text as the minister's words.",
    "Return a draft only. A minister must review every day before it is visible to members."
  ].join(" ");
}

export interface ImagePromptDraftInput {
  theme: string;
  emotionalTone: string;
  intendedUse: "bible_tab" | "public_website" | "social_media" | "event" | "sermon_series";
  brandNotes: readonly string[];
  prohibitedElements?: readonly string[];
}

export interface ImagePromptDraft {
  prompt: string;
  negativePrompt: string;
  generatedPeopleAreFictional: true;
  requiresHumanApproval: true;
}

export function buildImagePromptDraft(input: ImagePromptDraftInput): ImagePromptDraft {
  const theme = input.theme.trim().slice(0, 300);
  const emotionalTone = input.emotionalTone.trim().slice(0, 160);
  if (!theme || !emotionalTone) throw new Error("Image prompt theme and emotional tone are required");
  const prohibited = [
    "no real member likenesses",
    "no child faces without a separately approved real-media workflow",
    "no private information",
    "no fabricated event photography presented as documentary evidence",
    ...(input.prohibitedElements ?? [])
  ];
  return {
    prompt: [
      `Create an original visual concept for ${input.intendedUse}.`,
      `Theme: ${theme}.`,
      `Emotional tone: ${emotionalTone}.`,
      `Brand direction: ${input.brandNotes.join(", ") || "warm, accessible, community-centered"}.`,
      "Any people shown must be clearly fictional or illustrative rather than representations of actual church members."
    ].join(" "),
    negativePrompt: prohibited.join(", "),
    generatedPeopleAreFictional: true,
    requiresHumanApproval: true
  };
}
