const runtimeVersion =
  new URL(self.location.href).searchParams.get("v") || "unknown";
const DEFAULT_ICON = "/images/prax_brand.png";

function normalizeUrl(href) {
  try {
    return new URL(href || "/", self.location.origin).toString();
  } catch {
    return new URL("/", self.location.origin).toString();
  }
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: "window",
      });

      await Promise.all(
        clients.map((client) =>
          client.postMessage({
            type: "HOP_RUNTIME_SW_ACTIVATED",
            version: runtimeVersion,
          })
        )
      );
    })()
  );
});

self.addEventListener("push", (event) => {
  const payload = (() => {
    try {
      return event.data ? event.data.json() : null;
    } catch {
      return null;
    }
  })();

  const title = payload?.title || "House of Prax";
  const href = normalizeUrl(payload?.href);

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload?.body || "",
      icon: payload?.icon || DEFAULT_ICON,
      badge: payload?.badge || DEFAULT_ICON,
      tag: payload?.tag || undefined,
      data: {
        href,
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const href = normalizeUrl(event.notification.data?.href);

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windowClients) {
        try {
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(href);

          if (clientUrl.origin !== targetUrl.origin) {
            continue;
          }

          if ("navigate" in client) {
            await client.navigate(href);
          }

          if ("focus" in client) {
            await client.focus();
          }

          return;
        } catch {
          // Ignore malformed client URLs.
        }
      }

      await self.clients.openWindow(href);
    })()
  );
});
