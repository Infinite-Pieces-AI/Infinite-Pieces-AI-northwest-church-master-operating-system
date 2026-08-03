import {
  buildBibleCompanionSystemPrompt,
  buildImagePromptDraft,
  buildSermonCurriculumSystemPrompt
} from "@church/ai";
import { claimOutboxEvents, completeOutboxEvent, failOutboxEvent, runWorker } from "@church/worker-runtime";

await runWorker("ai-jobs", async (context) => {
  const events = await claimOutboxEvents(context, [
    "ai.draft_requested",
    "ai.embedding_requested",
    "curriculum.draft_requested",
    "image_prompt.draft_requested"
  ]);
  let processed = 0;
  for (const event of events) {
    try {
      const approvedDocumentIds = Array.isArray(event.payload.approved_document_ids)
        ? event.payload.approved_document_ids.filter((id): id is string => typeof id === "string")
        : [];
      if (event.event_type !== "image_prompt.draft_requested" && !approvedDocumentIds.length) {
        throw new Error("AI jobs require an explicit approved-document allowlist");
      }
      if (event.event_type === "ai.draft_requested") {
        context.log("ai.draft_guardrails", {
          eventId: event.id,
          approvedDocumentCount: approvedDocumentIds.length,
          promptVersion: "bible-companion-v1",
          systemPromptBytes: buildBibleCompanionSystemPrompt().length
        });
        // Provider calls are intentionally not included. Add a server-only adapter that stores
        // citations, cost, safety flags, and a draft status; never auto-publish the response.
      } else if (event.event_type === "ai.embedding_requested") {
        context.log("ai.embedding_guardrails", { eventId: event.id, approvedDocumentCount: approvedDocumentIds.length });
      } else if (event.event_type === "curriculum.draft_requested") {
        const weeklyLessonId = typeof event.payload.weekly_lesson_id === "string" ? event.payload.weekly_lesson_id : null;
        if (!weeklyLessonId) throw new Error("Curriculum draft requires weekly_lesson_id");
        context.log("ai.curriculum_guardrails", {
          eventId: event.id,
          weeklyLessonId,
          approvedDocumentCount: approvedDocumentIds.length,
          promptVersion: "sermon-curriculum-v1",
          systemPromptBytes: buildSermonCurriculumSystemPrompt().length,
          publication: "minister-review-required"
        });
      } else {
        const draft = buildImagePromptDraft({
          theme: String(event.payload.theme ?? "Approved weekly teaching"),
          emotionalTone: String(event.payload.emotional_tone ?? "hopeful and welcoming"),
          intendedUse: (event.payload.intended_use ?? "sermon_series") as "bible_tab" | "public_website" | "social_media" | "event" | "sermon_series",
          brandNotes: Array.isArray(event.payload.brand_notes)
            ? event.payload.brand_notes.filter((value): value is string => typeof value === "string")
            : []
        });
        context.log("ai.image_prompt_guardrails", {
          eventId: event.id,
          promptBytes: draft.prompt.length,
          generatedPeopleAreFictional: draft.generatedPeopleAreFictional,
          publication: "human-approval-required"
        });
      }
      await completeOutboxEvent(context, event.id);
      processed += 1;
    } catch (error) {
      await failOutboxEvent(context, event.id, error instanceof Error ? error.message : "AI job failed");
    }
  }
  return { claimed: events.length, processed };
});
