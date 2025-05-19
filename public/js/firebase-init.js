/**
 * firebase-init.js
 * Inicializa Firebase para la aplicación de encuestas
 */

//console.log('[Firebase Init] Cargando inicializador de Firebase');

// Inicializa Firebase usando la API compat de la CDN
window.initFirebase = function() {
  //console.log('[Firebase Init] Iniciando inicialización de Firebase');
  
  try {
    // Verificar que firebase esté disponible
    if (!window.firebase) {
      throw new Error('El objeto firebase no está disponible. Verifica que los scripts de Firebase están cargados correctamente.');
    }
    
    //console.log('[Firebase Init] Firebase disponible:', window.firebase.SDK_VERSION || 'Versión desconocida');
    
    // Verificar si ya hay una app inicializada
    if (window.firebase.apps && window.firebase.apps.length) {
      //console.log('[Firebase Init] Firebase ya inicializado. Usando instancia existente.');
      return window.firebase.app();
    }
    
    // Configuración de Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyBxiq4nbHs_0qtKjc5V9-aGEClM7IBweiA",
      authDomain: "encuestaweb-bfc0a.firebaseapp.com",
      projectId: "encuestaweb-bfc0a",
      storageBucket: "encuestaweb-bfc0a.firebasestorage.app",
      messagingSenderId: "493294629103",
      appId: "1:493294629103:web:304a5805d2bf484f07eb1a",
      measurementId: "G-JLQWWN1K0T"
    };
    
    //console.log('[Firebase Init] Inicializando Firebase con configuración');
    
    // Inicializar Firebase
    const app = window.firebase.initializeApp(firebaseConfig);
    //console.log('[Firebase Init] Firebase inicializado exitosamente');
    
    // Inicializar servicios explícitamente para verificar que están disponibles
    if (window.firebase.auth) {
      //console.log('[Firebase Init] Servicio Auth disponible');
      window.auth = window.firebase.auth();
    } else {
      //console.warn('[Firebase Init] Advertencia: Firebase Auth no está disponible');
    }
    
    if (window.firebase.firestore) {
      //console.log('[Firebase Init] Servicio Firestore disponible');
      window.db = window.firebase.firestore();
    } else {
      //console.warn('[Firebase Init] Advertencia: Firebase Firestore no está disponible');
    }
    
    // Exportar la app
    window.firebaseApp = app;
    return app;
    
  } catch (error) {
    //console.error('[Firebase Init] Error al inicializar Firebase:', error);
    //console.error('[Firebase Init] Stack trace:', error.stack);
    
    // Mostrar una alerta con el error
    alert('Error al inicializar Firebase: ' + error.message);
    return null;
  }
};

// Auto-inicialización para páginas que no llaman explícitamente a initFirebase
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  //console.log('[Firebase Init] Documento ya cargado. Inicializando Firebase automáticamente.');
  window.initFirebase();
} else {
  document.addEventListener('DOMContentLoaded', function() {
    //console.log('[Firebase Init] Evento DOMContentLoaded detectado. Inicializando Firebase automáticamente.');
    window.initFirebase();
  });
}
