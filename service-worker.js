/* service-worker.js
   Cache-first para assets + preguntas.
   Detecta nueva versión y hace skipWaiting + clients.claim para activar inmediatamente.
   Cambia CACHE_NAME cuando quieras forzar actualización masiva.
*/

const CACHE_NAME = "test-informatica-v1"; // Incrementa esto si despliegas cambios mayores
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./questions.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Instalación: cachea todos los assets
self.addEventListener("install", (event) => {
  self.skipWaiting(); // fuerza que el SW instalado pase a waiting/activate rápido
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activación: elimina caches antiguas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Intentar responder desde cache; si no, obtener de red y actualizar cache.
// También intenta actualizar la cache en segundo plano.
self.addEventListener("fetch", (event) => {
  // Sólo manejamos GETs de la misma origen
  if (event.request.method !== "GET") return;

  const req = event.request;
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((networkResponse) => {
          // Guardar en cache la respuesta si es válida
          if (networkResponse && networkResponse.status === 200 && req.url.startsWith(self.location.origin)) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, networkResponse.clone());
            });
          }
          return networkResponse.clone();
        })
        .catch(() => {
          // si falla la red, devolvemos cache si existe
          return cached;
        });

      // Si hay cache, devolvemos inmediatamente y actualizamos en background
      return cached || networkFetch;
    })
  );
});

// Comunicación con la página: notificar cuando hay nueva SW waiting
// La página puede enviar 'CHECK_FOR_UPDATE' para solicitar estado
self.addEventListener("message", (event) => {
  if (!event.data) return;
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

