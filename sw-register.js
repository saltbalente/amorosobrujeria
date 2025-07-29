// Script de registro del Service Worker para funcionalidad offline
(function() {
  'use strict';
  
  // Verificar si el navegador soporta Service Workers
  if ('serviceWorker' in navigator) {
    console.log('Service Worker soportado');
    
    // Registrar el Service Worker cuando la página se carga
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      .then(function(registration) {
        console.log('Service Worker registrado exitosamente:', registration.scope);
        
        // Verificar si hay una actualización disponible
        registration.addEventListener('updatefound', function() {
          const newWorker = registration.installing;
          console.log('Nueva versión del Service Worker encontrada');
          
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Hay una nueva versión disponible
                console.log('Nueva versión disponible, recargando...');
                window.location.reload();
              } else {
                // Primera instalación
                console.log('Contenido cacheado para uso offline');
                showOfflineReadyMessage();
              }
            }
          });
        });
        
        // Escuchar cambios en el estado del Service Worker
        navigator.serviceWorker.addEventListener('controllerchange', function() {
          console.log('Service Worker controller cambió, recargando página...');
          window.location.reload();
        });
        
      })
      .catch(function(error) {
        console.log('Error al registrar Service Worker:', error);
      });
    });
    
    // Verificar el estado de la conexión
    window.addEventListener('online', function() {
      console.log('Conexión restaurada');
      showConnectionStatus(true);
    });
    
    window.addEventListener('offline', function() {
      console.log('Conexión perdida - funcionando offline');
      showConnectionStatus(false);
    });
    
    // Mostrar estado inicial de la conexión
    if (!navigator.onLine) {
      showConnectionStatus(false);
    }
    
  } else {
    console.log('Service Worker no soportado en este navegador');
  }
  
  // Función para mostrar mensaje de listo para offline
  function showOfflineReadyMessage() {
    // Crear un elemento de notificación discreto
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    notification.textContent = '✓ Sitio listo para funcionar offline';
    
    document.body.appendChild(notification);
    
    // Mostrar la notificación
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  // Función para mostrar el estado de la conexión
  function showConnectionStatus(isOnline) {
    // Remover notificación anterior si existe
    const existingNotification = document.getElementById('connection-status');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Crear nueva notificación
    const notification = document.createElement('div');
    notification.id = 'connection-status';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${isOnline ? '#4CAF50' : '#FF9800'};
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    notification.textContent = isOnline ? '🌐 Conectado' : '📱 Modo Offline';
    
    document.body.appendChild(notification);
    
    // Mostrar la notificación
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 100);
    
    // Para modo offline, mantener visible más tiempo
    const hideDelay = isOnline ? 2000 : 4000;
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, hideDelay);
  }
  
  // Función para obtener estadísticas del cache (para debugging)
  function getCacheStats() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = function(event) {
        if (event.data.type === 'CACHE_STATUS') {
          console.log('Recursos en cache:', event.data.cacheSize);
          console.log('URLs cacheadas:', event.data.cachedUrls);
        }
      };
      
      navigator.serviceWorker.controller.postMessage({
        type: 'GET_CACHE_STATUS'
      }, [messageChannel.port2]);
    }
  }
  
  // Exponer función para debugging (opcional)
  window.getCacheStats = getCacheStats;
  
})();