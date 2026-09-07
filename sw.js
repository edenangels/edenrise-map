// EdenRise map — offline service worker. App shell + data: network-first (fresh when online, cached when not).
// Tiles (ortho / terrain / hillshade): cache-first, and "Guardar para offline" pre-caches the estate at z14–19.
const V = "edr-v1"; const SHELL = "edr-shell-" + V, TILES = "edr-tiles-" + V;
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil((async () => { for (const k of await caches.keys()) if (!k.endsWith(V)) await caches.delete(k); await self.clients.claim(); })()); });
self.addEventListener("message", async e => {
  if (e.data && e.data.type === "precache") { const urls = e.data.urls || []; const c = await caches.open(TILES); let n = 0;
    for (let i = 0; i < urls.length; i += 8) { await Promise.all(urls.slice(i, i + 8).map(async u => { try { if (!(await c.match(u))) { const r = await fetch(u); if (r.ok) await c.put(u, r); } n++; } catch (err) {} })); e.source && e.source.postMessage({ type: "precache-progress", n, total: urls.length }); }
    e.source && e.source.postMessage({ type: "precache-done", n, total: urls.length }); }
  if (e.data && e.data.type === "precache-clear") { await caches.delete(TILES); e.source && e.source.postMessage({ type: "precache-cleared" }); }
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url); if (e.request.method !== "GET") return;
  if (u.origin === location.origin && /\/(ortho2025|terrain|hillshade)\//.test(u.pathname)) {   // tiles: cache first
    e.respondWith((async () => { const c = await caches.open(TILES); const hit = await c.match(e.request); if (hit) return hit; try { const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; } catch (err) { return new Response("", { status: 504 }); } })()); return; }
  if (u.origin === location.origin) {                                                         // shell + data: network first, fall back to cache
    e.respondWith((async () => { const c = await caches.open(SHELL); try { const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; } catch (err) { const hit = await c.match(e.request, { ignoreSearch: true }); return hit || new Response("offline", { status: 503 }); } })()); }
});
