const SHELL_CACHE = "church-hub-shell-v2";
const OFFLINE_CACHE = "church-hub-offline-v2";
const SHELL = ["/icon.svg", "/offline"];
const OFFLINE_SAFE_PATHS = new Set([
  "/api/offline/service-schedule",
  "/api/offline/weekly-lesson"
]);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![SHELL_CACHE, OFFLINE_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function fetchAndCacheOfflineSafe(request) {
  try {
    const response = await fetch(request, { cache: "no-store", credentials: "include" });
    if (response.ok && response.headers.get("X-Church-Offline-Safe") === "true") {
      const cache = await caches.open(OFFLINE_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return undefined;
  }
}

function offlineUnavailableResponse() {
  return new Response(JSON.stringify({ error: "Offline snapshot unavailable" }), {
    status: 503,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  if (OFFLINE_SAFE_PATHS.has(url.pathname)) {
    const network = fetchAndCacheOfflineSafe(event.request);
    event.waitUntil(network.then(() => undefined));
    event.respondWith(
      caches
        .open(OFFLINE_CACHE)
        .then((cache) => cache.match(event.request))
        .then(async (cached) => cached || (await network) || offlineUnavailableResponse())
    );
    return;
  }

  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/accept-invitation") ||
    url.pathname === "/login" ||
    url.pathname === "/request-access" ||
    url.pathname === "/mfa"
  ) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request, { cache: "no-store", credentials: "include" }).catch(() => caches.match("/offline")));
    return;
  }

  if (SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((hit) => hit || fetch(event.request)));
  }
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Church Hub update",
    body: "Open the member hub for the latest approved update.",
    url: "/this-week",
    tag: "church-hub-update",
    icon: "/icon.svg",
    badge: "/icon.svg"
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Keep the generic privacy-safe fallback.
  }
  const url = typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/this-week";
  event.waitUntil(
    self.registration.showNotification(String(payload.title).slice(0, 80), {
      body: String(payload.body).slice(0, 180),
      tag: String(payload.tag || "church-hub-update").slice(0, 80),
      icon: payload.icon || "/icon.svg",
      badge: payload.badge || "/icon.svg",
      data: { url },
      renotify: false
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/this-week";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) {
        existing.navigate(target);
        return existing.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_CHURCH_HUB_CACHES") {
    event.waitUntil(caches.delete(OFFLINE_CACHE));
  }
});
