
# Member PWA service worker boundary

The production service worker is emitted from `public/sw.js`. It intentionally avoids caching API,
authentication, member navigation, child, prayer, or channel responses. This directory documents
future service-worker source modules should the build move from a static worker to a compiled one.

Offline support may cache only an allowlisted application shell and clearly public assets. Private
church data must never be persisted to a shared browser cache.
