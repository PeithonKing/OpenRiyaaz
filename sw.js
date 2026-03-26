const CACHE_NAME = "openriyaaz-no-cache";

self.addEventListener("install", (event) => {
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    // Clear all existing caches to ensure nothing is stored
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    return caches.delete(key);
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

self.addEventListener("fetch", (event) => {
    // A pure network-only strategy. 
    // We must provide a fetch handler for the PWA to be considered "installable".
    event.respondWith(fetch(event.request));
});
