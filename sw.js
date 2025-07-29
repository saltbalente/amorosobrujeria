// Configuración del Service Worker
const CACHE_NAME = 'consulta-maestrolujan-v1.0';
const OFFLINE_PAGE = 'offline.html';

// Recursos críticos que se cachean inmediatamente
const CRITICAL_RESOURCES = [
  './',
  'index.html',
  'offline.html',
  'manifest.json',
  'sw-register.js',
  // Archivos CSS de LiteSpeed
  'wp-content/litespeed/ucss/94e3637108b931cd5311c5a80b3b95ae9433.css?ver=38159',
  // Archivos JS de LiteSpeed
  'wp-content/plugins/litespeed-cache/assets/js/instant_click.min.js',
  'wp-content/plugins/litespeed-cache/assets/js/css_async.min.js',
  // Fuentes placeholder
  'wp-content/plugins/elementor/assets/lib/font-awesome/webfonts/fa-brands-400.woff2',
  'wp-content/plugins/elementor/assets/lib/font-awesome/webfonts/fa-solid-900.woff2',
  'wp-content/plugins/elementor/assets/lib/eicons/fonts/eicons.woff2',
  // Imágenes del dominio original
  'wp-content/uploads/2025/05/AMOR-CON-ESPIRITU.png',
  'wp-content/uploads/2025/05/telefono-20x20.png',
  'wp-content/uploads/2025/05/ntjgte.png',
  'wp-content/uploads/2025/05/fhjwf.png',
  'wp-content/uploads/2025/05/cropped-vgcj-32x32.png',
  'wp-content/uploads/2025/05/cropped-vgcj-192x192.png',
  'wp-content/uploads/2025/05/cropped-vgcj-180x180.png',
  'wp-content/uploads/2025/05/cropped-vgcj.png',
  // Video local
  'videos/Video_2.mov',
  'wp-json/oembed/1.0/embed0f5d.json',
  'wp-json/oembed/1.0/embed6599',
  'wp-json/wp/v2/pages/17700.json'
];

// URLs externas que necesitamos cachear (CDNs que mantenemos)
const EXTERNAL_RESOURCES = [
  // Aquí se pueden agregar CDNs externos si es necesario
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Cacheando recursos críticos...');
      // Cachear todos los recursos críticos
      return cache.addAll([...CRITICAL_RESOURCES, ...EXTERNAL_RESOURCES]);
    })
  );
  
  // Forzar la activación inmediata
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activado y listo');
      // Tomar control de todas las páginas inmediatamente
      return self.clients.claim();
    })
  );
});

// Interceptar todas las peticiones de red
self.addEventListener('fetch', event => {
  // Solo manejar peticiones HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Si tenemos una respuesta en cache, la devolvemos
        if (cachedResponse) {
          console.log('Service Worker: Sirviendo desde cache:', event.request.url);
          return cachedResponse;
        }
        
        // Si no está en cache, intentamos obtenerla de la red
        return fetch(event.request)
          .then(response => {
            // Verificar si la respuesta es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar la respuesta porque es un stream que solo se puede usar una vez
            const responseToCache = response.clone();
            
            // Agregar la respuesta al cache para futuras peticiones
            caches.open(CACHE_NAME)
              .then(cache => {
                // Solo cachear recursos del mismo origen o recursos específicos
                if (event.request.url.startsWith(self.location.origin) || 
                    EXTERNAL_RESOURCES.some(url => event.request.url.includes(url))) {
                  cache.put(event.request, responseToCache);
                  console.log('Service Worker: Recurso agregado al cache:', event.request.url);
                }
              });
            
            return response;
          })
          .catch(() => {
            // Si la red falla, intentamos servir la página offline
            console.log('Service Worker: Red no disponible, sirviendo página offline');
            
            // Para navegación, servir la página principal
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE);
            }
            
            // Para imágenes, servir una imagen placeholder si está disponible
            if (event.request.destination === 'image') {
              return caches.match('wp-content/uploads/2025/05/cropped-vgcj-32x32.png');
            }
            
            // Para otros recursos, servir la página offline
            return caches.match(OFFLINE_PAGE);
          });
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.open(CACHE_NAME).then(cache => {
      return cache.keys();
    }).then(keys => {
      event.ports[0].postMessage({
        type: 'CACHE_STATUS',
        cachedUrls: keys.map(request => request.url),
        cacheSize: keys.length
      });
    });
  }
});

// Sincronización en segundo plano (para cuando vuelva la conexión)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Sincronización en segundo plano');
    event.waitUntil(
      // Aquí puedes agregar lógica para sincronizar datos cuando vuelva la conexión
      Promise.resolve()
    );
  }
});

console.log('Service Worker: Cargado y listo para funcionar offline');