# Group rotation proposal worker

Consumes a leadership-requested, restricted input snapshot, generates a deterministic graph-aware proposal, stores the audit fingerprint and score, and stops. It never approves a cycle, activates memberships, creates member channels, or exposes private reasons.
