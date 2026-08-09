import { generateRotationProposal, type RotationInput } from "@church/group-rotation";
import {
  claimOutboxEvents,
  completeOutboxEvent,
  failOutboxEvent,
  runWorker,
} from "@church/worker-runtime";

function parseRotationInput(value: unknown): RotationInput {
  if (!value || typeof value !== "object") throw new Error("Rotation input snapshot is missing");
  const input = value as Partial<RotationInput>;
  if (
    !input.cycleId ||
    !input.seed ||
    !Array.isArray(input.households) ||
    !Array.isArray(input.groups) ||
    !Array.isArray(input.pairingHistory)
  ) {
    throw new Error("Rotation input snapshot is incomplete");
  }
  return input as RotationInput;
}

await runWorker("group-rotation-proposals", async (context) => {
  const events = await claimOutboxEvents(context, ["group_rotation.proposal_requested"]);
  let proposed = 0;
  for (const event of events) {
    try {
      const cycleId = typeof event.payload.cycle_id === "string" ? event.payload.cycle_id : null;
      const requestedBy =
        typeof event.payload.requested_by === "string" ? event.payload.requested_by : null;
      if (!cycleId || !requestedBy)
        throw new Error("Rotation request requires cycle_id and requested_by");
      const input = parseRotationInput(event.payload.input_snapshot);
      if (input.cycleId !== cycleId)
        throw new Error("Rotation input cycle does not match event cycle");
      const proposal = generateRotationProposal(input);
      context.log("rotation.proposal_generated", {
        cycleId,
        status: proposal.status,
        fingerprint: proposal.fingerprint,
        score: proposal.score.total,
        acceptedSwaps: proposal.optimization.acceptedSwaps,
        relationshipSignals: input.relationshipSignals?.length ?? 0,
      });

      if (!context.dryRun) {
        const { data: run, error: runError } = await context.supabase
          .from("rotation_runs")
          .insert({
            cycle_id: cycleId,
            seed: input.seed,
            algorithm_version: "graph-novelty-v2",
            status: proposal.status,
            input_snapshot: input,
            score_breakdown: proposal.score,
            constraint_issues: proposal.issues,
            fingerprint: proposal.fingerprint,
            generated_by: requestedBy,
            optimization_strategy: proposal.optimization.strategy,
            requested_refinement_passes: proposal.optimization.requestedPasses,
            completed_refinement_passes: proposal.optimization.completedPasses,
            accepted_swaps: proposal.optimization.acceptedSwaps,
            relationship_signal_count: input.relationshipSignals?.length ?? 0,
            content_free_signals_attested: true,
          })
          .select("id")
          .single();
        if (runError) throw runError;
        if (proposal.assignments.length) {
          const { error: assignmentError } = await context.supabase
            .from("rotation_assignments")
            .insert(
              proposal.assignments.map((assignment) => ({
                rotation_run_id: run.id,
                household_id: assignment.householdId,
                group_id: assignment.groupId,
                private_reasons: assignment.privateReasons,
                manually_adjusted: false,
              })),
            );
          if (assignmentError) throw assignmentError;
        }
      }
      await completeOutboxEvent(context, event.id);
      proposed += 1;
    } catch (error) {
      await failOutboxEvent(
        context,
        event.id,
        error instanceof Error ? error.message : "Rotation proposal failed",
      );
    }
  }
  return { claimed: events.length, proposed };
});
