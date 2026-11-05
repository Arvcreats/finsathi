/* FinSathi service worker — caches the app shell so the app opens offline.
   Bump CACHE_VERSION whenever the shell files change. */
var CACHE_VERSION = "finsathi-v2-final";
var SHELL = ["./", "index.html", "style.css", "app.js", "logo.png", "manifest.json"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE_VERSION).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k === CACHE_VERSION ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  if (e.request.method !== "GET") return;
  // Never cache AI/API calls — they must always go to the network.
  if (e.request.url.indexOf("generativelanguage.googleapis.com") !== -1) return;
  if (e.request.url.indexOf("api.groq.com") !== -1) return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      return hit || fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function(c){ c.put(e.request, copy); });
        return res;
      }).catch(function(){ return caches.match("index.html"); });
    })
  );
});
