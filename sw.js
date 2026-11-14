// Enkel service worker: gör appen installerbar och startbar utan nät.
const CACHE = "rutiner-v2";
const SHELL = ["./", "index.html", "styles.css", "app.js", "images.js", "manifest.json", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())) });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())) });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const cacheable = u.origin === location.origin || u.hostname === "www.gstatic.com" || u.hostname.endsWith("fonts.googleapis.com") || u.hostname.endsWith("fonts.gstatic.com");
  if (!cacheable) return; // Firestore m.m. går direkt mot nätet
  // nätet först, cache som reserv
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)) } return r })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
});
