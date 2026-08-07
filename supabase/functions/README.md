# Edge functions

Edge functions are reserved for verified server-to-server boundaries and privileged workflows.
They must validate caller identity or provider signatures, use idempotency keys, enqueue durable
outbox events, redact sensitive payloads, and fail closed when a provider verification adapter is not
configured.

Do not use edge functions to bypass Row Level Security for ordinary member requests.
