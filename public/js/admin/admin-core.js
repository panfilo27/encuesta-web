/**
 * admin-core.js - Funcionalidad principal del panel administrativo
 * Maneja la autenticación, verificación de rol y carga dinámica de vistas
 */

// Acceso directo a Firestore - usar la instancia global si está disponible
let db;

try {
  // Intentar usar la instancia global creada en firebase-init.js
  if (window.db) {
    console.log('[Admin Core] Usando instancia global de Firestore');
    db = window.db;
  } else if (firebase && firebase.firestore) {
    console.log('[Admin Core] Creando nueva instancia de Firestore');
    db = firebase.firestore();
  } else {
    console.error('[Admin Core] No se puede acceder a Firestore. Firebase no está correctamente inicializado.');
    throw new Error('Firebase Firestore no está disponible');
  }
} catch (error) {
  console.error('[Admin Core] Error al acceder a Firestore:', error);
  // No lanzar error aquí, lo manejaremos en las funciones que usan db
}

// Objeto para almacenar estado global del panel
const adminState = {
  // Usuario actual
  currentUser: null,
  
  // Vista actualmente cargada
  currentView: null,
  
  // Datos del usuario administrador
  adminData: null,
  
  // Filtros globales que se pueden aplicar en múltiples vistas
  globalFilters: {
    carrera: 'todas',
    anioEgreso: 'todos',
    fechaInicio: null,
    fechaFin: null
  }
};

/**
 * Inicializa el panel de administración
 */
function initAdminPanel() {
  // Configurar logout
  setTimeout(() => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          // Cerrar sesión en Firebase
          if (firebase && firebase.auth) {
            await firebase.auth().signOut();
          }
        } catch (error) {
          console.error('[Admin Core] Error al cerrar sesión en Firebase:', error);
        } finally {
          // Limpiar localStorage
          localStorage.clear();
          // Redirigir a la pantalla de autenticación
          window.location.href = 'auth.html';
        }
      });
    }
  }, 0); // Esperar a que el DOM esté listo

  
  try {
    // Registrar estado global y DOM
    
    // Configurar eventos para los elementos del sidebar
    setupSidebarNavigation();
    
    // Cargar la vista por defecto (dashboard general - nivel 1)
    loadView('level1-dashboard');
    
  } catch (error) {
    
    // Mostrar error en la interfaz
    const contentArea = document.getElementById('admin-content-area');
    if (contentArea) {
      contentArea.innerHTML = `
        <div style="padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px;">
          <h3>Error al inicializar panel</h3>
          <p><strong>Mensaje:</strong> ${error.message}</p>
          <pre style="background: #f8f8f8; padding: 10px; overflow: auto; max-height: 200px;">${error.stack || 'No stack trace disponible'}</pre>
          <button onclick="location.reload()" style="padding: 8px 15px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Recargar página</button>
        </div>
      `;
    }
  }
}

/**
 * Configura la navegación del sidebar
 */
function setupSidebarNavigation() {
  console.log('[Admin Core] Iniciando configuración de navegación del sidebar');
  
  try {
    // Obtener todos los elementos del sidebar
    const sidebarItems = document.querySelectorAll('.sidebar-nav li');
    console.log(`[Admin Core] Encontrados ${sidebarItems.length} elementos en el sidebar`);
    
    // Si no hay elementos, puede ser un problema con los selectores o el DOM
    if (sidebarItems.length === 0) {
      console.warn('[Admin Core] No se encontraron elementos en el sidebar. Verificando estructura HTML:');
      const sidebarNav = document.querySelector('.sidebar-nav');
      if (sidebarNav) {
      } else {
        const sidebar = document.querySelector('.admin-sidebar');
        if (sidebar) {
          console.log('[Admin Core] Contenido HTML de .admin-sidebar:', sidebar.innerHTML);
        }
      }
    }
    
    // Configurar eventos para cada elemento
    sidebarItems.forEach((item, index) => {
      console.log(`[Admin Core] Configurando elemento #${index} del sidebar:`, item.textContent.trim());
      
      item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Obtener la vista a cargar
        const viewName = item.getAttribute('data-view');
        console.log(`[Admin Core] Clic en elemento de sidebar. Vista solicitada: ${viewName}`);
        
        // Remover la clase 'active' de todos los elementos
        sidebarItems.forEach(el => el.classList.remove('active'));
        
        // Añadir la clase 'active' al elemento clickeado
        item.classList.add('active');
        
        // Cargar la vista solicitada
        loadView(viewName);
      });
      
      console.log(`[Admin Core] Evento click configurado para ${item.textContent.trim()}`);
    });
    
    console.log('[Admin Core] Configuración de navegación del sidebar completada');
  } catch (error) {
    console.error('[Admin Core] Error al configurar navegación del sidebar:', error);
    console.error('[Admin Core] Stack trace:', error.stack);
  }
}

/**
 * Carga una vista en el área de contenido principal
 * @param {string} viewName - Nombre de la vista a cargar (corresponde al archivo HTML)
 * @param {Object} params - Parámetros adicionales para la vista (opcional)
 */
async function loadView(viewName, params = {}) {
  console.log(`[AdminCore] Cargando vista: ${viewName}`, params);
  
  if (!viewName) return;
  
  // Si es la misma vista y no hay parámetros específicos, no hacer nada
  if (viewName === adminState.currentView && Object.keys(params).length === 0) {
    return;
  }
  
  console.log(`[Admin Core] Cargando vista: ${viewName}`);
  
  // Mostrar indicador de carga
  const contentArea = document.getElementById('admin-content-area');
  contentArea.innerHTML = `
    <div class="admin-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando vista: ${viewName}...</p>
    </div>
  `;
  
  try {
    // Construir la URL de la vista (usando ruta relativa en lugar de absoluta)
    const viewURL = `views/admin/${viewName}.html`;
    console.log(`[Admin Core] Intentando cargar vista desde: ${viewURL}`);
    
    // Cargar el HTML de la vista
    const response = await fetch(viewURL);
    console.log(`[Admin Core] Respuesta del fetch: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // Intentamos cargar directamente level1-dashboard como fallback mientras se desarrolla
      if (viewName === 'level1-dashboard') {
        console.log('[Admin Core] Usando contenido de dashboard estático como fallback');
        
        // Contenido estático del dashboard para desarrollo
        contentArea.innerHTML = `
          <div class="admin-dashboard">
            <div class="page-header">
              <h1 class="page-title"><i class="fas fa-tachometer-alt"></i> Dashboard General</h1>
            </div>
            <div class="admin-card">
              <h3>Dashboard en Desarrollo</h3>
              <p>Las vistas HTML no se están cargando correctamente. Por favor verifica la estructura de directorios.</p>
              <p>Ruta intentada: ${viewURL}</p>
              <p>Estado de la respuesta: ${response.status} ${response.statusText}</p>
            </div>
          </div>
        `;
        
        // Actualizar el estado
        adminState.currentView = viewName;
        return;
      }
      
      throw new Error(`Error al cargar la vista ${viewName}: ${response.status} ${response.statusText}`);
    }
    
    const viewHTML = await response.text();
    console.log(`[Admin Core] Vista HTML cargada: ${viewHTML.substring(0, 100)}...`);
    
    // Actualizar el contenido
    contentArea.innerHTML = viewHTML;
    
    // Actualizar el estado
    adminState.currentView = viewName;
    
    // Cargar el script específico de la vista si existe
    loadViewScript(viewName, params);
    
  } catch (error) {
    console.error('[Admin Core] Error al cargar la vista:', error);
    
    // Mostrar mensaje de error con más detalles
    contentArea.innerHTML = `
      <div class="admin-loading">
        <i class="fas fa-exclamation-circle" style="color: #F44336;"></i>
        <p>Error al cargar la vista '${viewName}'</p>
        <p style="color: #F44336;">${error.message}</p>
        <p>Verifica que exista el archivo en: /views/admin/${viewName}.html</p>
        <button class="admin-btn admin-btn-primary" onclick="location.reload()">
          Recargar Página
        </button>
      </div>
    `;
  }
}

/**
 * Carga el script JavaScript específico para una vista
 * @param {string} viewName - Nombre de la vista
 * @param {Object} params - Parámetros para inicializar la vista
 */
function loadViewScript(viewName, params = {}) {
  console.log(`[Admin Core] Cargando script para la vista: ${viewName}`);
  
  // Corregir el nombre de la vista para buscar la función de inicialización
  // Convertir guiones a camelCase (ej: level1-dashboard -> Level1Dashboard)
  const viewNameCapitalized = viewName.split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  const scriptSrc = `js/admin/${viewName}.js`;
  const scriptAlreadyLoaded = Array.from(document.querySelectorAll('script')).some(s => 
    s.src.includes(scriptSrc)
  );
  
  // Si el script ya está cargado, solo ejecutar la inicialización
  if (scriptAlreadyLoaded) {
    // Inicializar módulo según la vista
    if (viewName === 'level1-dashboard' && window.Level1Dashboard && typeof window.Level1Dashboard.init === 'function') {
      window.Level1Dashboard.init(params);
    } else if (viewName === 'career-management' && window.CareerManagement && typeof window.CareerManagement.init === 'function') {
      window.CareerManagement.init(params);
    } else {
      console.warn(`No se encuentra la función de inicialización para la vista ${viewName}`);
    }
    
    return;
  }
  
  // Crear el nuevo script solo si no existe
  const script = document.createElement('script');
  script.src = scriptSrc;
  script.setAttribute('data-view', viewName);
  
  script.onload = function() {
    console.log(`[Admin Core] Script cargado correctamente: ${scriptSrc}`);
    
    // Si el script expone una función init, llamarla con los parámetros
    if (window[`init${viewNameCapitalized}`]) {
      console.log(`[Admin Core] Llamando a init${viewNameCapitalized}() con parámetros:`, params);
      window[`init${viewNameCapitalized}`](params);
    } else {
      console.warn(`[Admin Core] No se encontró función init${viewNameCapitalized}() en ${scriptSrc}`);
    }
    
    // Si estamos cargando el dashboard principal, primero inicializar el dashboard básico
  // Después inicializar las gráficas si están disponibles
  if (viewName === 'level1-dashboard') {
    console.log('[Admin Core] Preparando inicialización de dashboard');
    
    // Función para inicializar gráficas después del dashboard
    const initDashboardCharts = () => {
      console.log('[Admin Core] Preparando inicialización de gráficas del dashboard');
      
      // Verificar primero si el contenedor de gráficas existe
      const chartsContainer = document.querySelector('.charts-container');
      if (!chartsContainer) {
        console.error('[Admin Core] No se encontró el contenedor de gráficas en el DOM');
        return;
      }
      
      // Verificar si la función de inicialización está disponible
      if (window.initAdminCharts && typeof window.initAdminCharts === 'function') {
        console.log('[Admin Core] DOM listo, inicializando gráficas del dashboard');
        try {
          window.initAdminCharts();
        } catch (error) {
          console.error('[Admin Core] Error al inicializar gráficas:', error);
        }
      } else {
        console.log('[Admin Core] La función initAdminCharts no está disponible. Intentando cargar el script...');
        
        // Intentar cargar el script manualmente
        const script = document.createElement('script');
        script.src = 'js/admin/charts/admin-chart-manager.js';
        script.onload = function() {
          console.log('[Admin Core] Script de gráficas cargado manualmente');
          if (window.initAdminCharts && typeof window.initAdminCharts === 'function') {
            try {
              window.initAdminCharts();
            } catch (error) {
              console.error('[Admin Core] Error al inicializar gráficas después de carga manual:', error);
            }
          } else {
            console.error('[Admin Core] La función initAdminCharts sigue sin estar disponible después de cargar el script');
          }
        };
        
        script.onerror = function(e) {
          console.error('[Admin Core] Error al cargar el script de gráficas:', e);
        };
        
        document.body.appendChild(script);
      }
    };
    
    // Primero cargar e inicializar el script básico del dashboard
    // Si ya existe la función global, usarla directamente
    if (window.initLevel1Dashboard) {
      window.initLevel1Dashboard();
      // Luego inicializar las gráficas con un retraso
      setTimeout(initDashboardCharts, 500);
    } else {
      // Si no existe, cargar directamente el script del dashboard
      const dashboardScript = document.createElement('script');
      dashboardScript.src = 'js/admin/level1-dashboard.js';
      dashboardScript.onload = function() {
        if (window.initLevel1Dashboard) {
          window.initLevel1Dashboard();
          // Luego inicializar las gráficas con un retraso
          setTimeout(initDashboardCharts, 500);
        }
      };
      document.body.appendChild(dashboardScript);
    }
  }
  };
  
  script.onerror = function() {
    console.error(`Error al cargar el script para la vista ${viewName}`);
  };
  
  // Añadir el script al documento
  document.body.appendChild(script);
}

/**
 * Navega a una vista de detalle basada en selección de gráfica
 * Ejemplo: Al hacer clic en una carrera, ir a vista detallada de carrera
 * @param {string} viewName - Nombre de la vista a cargar
 * @param {Object} params - Parámetros para la vista (ej: id de carrera)
 */
function navigateToDetailView(viewName, params = {}) {
  // Actualizar la navegación visual en el sidebar
  const sidebarItems = document.querySelectorAll('.sidebar-nav li');
  sidebarItems.forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Cargar la vista con los parámetros
  loadView(viewName, params);
}

/**
 * Verifica si el usuario es administrador y tiene acceso al panel
 */
function verifyAdminAccess() {
  console.log('[Admin Core] Iniciando verificación de acceso administrativo');
  
  try {
    // Verificar si el usuario está autenticado
    console.log('[Admin Core] Escuchando cambios de estado de autenticación');
    firebase.auth().onAuthStateChanged(async (user) => {
      console.log('[Admin Core] Estado de autenticación cambiado. Usuario:', user ? user.email : 'No autenticado');
      
      if (user) {
        try {
          console.log('[Admin Core] Almacenando usuario actual en adminState');
          // Guardar el usuario actual
          adminState.currentUser = user;
          
          // Verificar el rol en Firestore
          console.log(`[Admin Core] Consultando datos del usuario ${user.uid} en Firestore`);
          const userDoc = await db.collection('usuarios').doc(user.uid).get();
          
          console.log('[Admin Core] Datos de usuario obtenidos de Firestore. Existe:', userDoc.exists);
          if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('[Admin Core] Rol del usuario:', userData.rol);
            
            if (userData.rol === 'admin') {
              console.log('[Admin Core] Confirmado: el usuario tiene rol de administrador');
              // Guardar los datos del administrador
              adminState.adminData = userData;
              
              // Establecer que es admin en localStorage para futuras visitas
              localStorage.setItem('user_role', 'admin');
              console.log('[Admin Core] Role de admin guardado en localStorage');
              
              // Inicializar el panel
              console.log('[Admin Core] Llamando a initAdminPanel() para inicializar la UI');
              initAdminPanel();
            } else {
              console.log('[Admin Core] El usuario NO tiene permisos de administrador. Redirigiendo al dashboard');
              // Redirigir al dashboard
              window.location.href = 'dashboard.html';
            }
          } else {
            console.log('[Admin Core] El documento del usuario no existe en Firestore. Redirigiendo al dashboard');
            window.location.href = 'dashboard.html';
          }
        } catch (error) {
          console.error('[Admin Core] Error al verificar rol de usuario:', error);
          console.error('[Admin Core] Stack trace:', error.stack);
          alert('Error al verificar el rol de administrador: ' + error.message);
          // Redirigir al dashboard en caso de error
          window.location.href = 'dashboard.html';
        }
      } else {
        // No hay usuario autenticado, redirigir al login
        console.log('[Admin Core] Usuario no autenticado. Redirigiendo a la página de inicio de sesión');
        localStorage.removeItem('user_role');
        window.location.href = 'auth.html';
      }
    });
  } catch (error) {
    console.error('[Admin Core] Error crítico al configurar verificación de acceso:', error);
    console.error('[Admin Core] Stack trace:', error.stack);
    alert('Error crítico al verificar acceso administrativo: ' + error.message);
    window.location.href = 'auth.html';
  }
}

// Iniciar la verificación de acceso inmediatamente (sin esperar DOMContentLoaded)
(function() {
  console.log('[Admin Core] Script cargado. Verificando acceso al panel administrativo');
  
  // Verificar si existe la inicialización de Firebase
  if (typeof firebase !== 'undefined' && firebase.app) {
    // Ejecutar con un pequeño retraso para asegurar que la UI esté lista
    setTimeout(() => {
      console.log('[Admin Core] Iniciando verificación de acceso administrativo');
      verifyAdminAccess();
    }, 100); // Un pequeño retraso para asegurar que todo esté listo
  } else {
    console.error('[Admin Core] Firebase no está inicializado. Redirigiendo a la página de inicio.');
    window.location.href = 'auth.html';
  }
})();
