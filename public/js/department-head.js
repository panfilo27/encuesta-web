/**
 * department-head.js
 * Funcionalidad para el panel de jefe de departamento
 */

// Referencias a Firestore y Auth
let db;
let auth;

// Elementos del DOM
const domElements = {
  // Elementos principales
  preloader: document.getElementById('preloader'),
  userNameHeader: document.getElementById('user-name-header'),
  contentArea: document.getElementById('department-content-area'),
  
  // Sidebar y navegación
  sidebarLinks: document.querySelectorAll('.sidebar-nav li'),
  
  // Dashboard principal
  careerName: document.getElementById('career-name'),
  careerCode: document.getElementById('career-code'),
  graduatesCount: document.getElementById('graduates-count'),
  viewStatsBtn: document.getElementById('view-stats-btn'),
  viewGraduatesBtn: document.getElementById('view-graduates-btn'),
  
  // Otros
  logoutBtn: document.getElementById('logout-btn')
};

// Rutas de las vistas
const VIEWS = {
  DASHBOARD: 'department-dashboard',
  GRADUATE_STATS: 'graduate-stats'
};

// Estado global
let currentView = VIEWS.DASHBOARD;
let currentCareerData = null;

/**
 * Inicializa la página
 */
function init() {
  try {
    // Inicializar Firebase
    if (window.firebase) {
      db = window.firebase.firestore();
      auth = window.firebase.auth();
    } else {
      throw new Error('Firebase no está disponible');
    }

    // Configurar evento de logout
    if (domElements.logoutBtn) {
      domElements.logoutBtn.addEventListener('click', logout);
    }

    // Configurar eventos para los botones de acción rápida
    if (domElements.viewStatsBtn) {
      domElements.viewStatsBtn.addEventListener('click', () => {
        cargarVista(VIEWS.GRADUATE_STATS);
      });
    }



    if (domElements.viewGraduatesBtn) {
      domElements.viewGraduatesBtn.addEventListener('click', () => {
        alert('Funcionalidad para ver egresados en desarrollo');
      });
    }
    
    // Configurar navegación del sidebar
    configurarNavegacion();

    // Verificar autenticación y rol
    verificarAcceso();

  } catch (error) {
    console.error('Error al inicializar department-head.js:', error);
    mostrarError('Error al inicializar la aplicación. Por favor recarga la página.');
  }
}

/**
 * Verifica que el usuario tenga acceso como jefe de departamento
 */
async function verificarAcceso() {
  try {
    mostrarPreloader(true);

    // Verificar si el usuario está autenticado
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('[Department Head] Usuario autenticado:', user.email);

        try {
          // Verificar rol en Firestore
          const userDoc = await db.collection('usuarios').doc(user.uid).get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            
            if (userData.rol === 'jefeDepartamento') {
              // Usuario es jefe de departamento, cargar datos
              mostrarDatosUsuario(user, userData);
              cargarDatosCarrera(userData.carreraAsignada);
            } else {
              // No tiene el rol adecuado, redirigir según su rol
              console.log('[Department Head] El usuario no tiene rol de jefe de departamento:', userData.rol);
              
              if (userData.rol === 'admin') {
                window.location.href = 'admin.html';
              } else {
                window.location.href = 'dashboard.html';
              }
            }
          } else {
            console.log('[Department Head] No se encontraron datos del usuario en Firestore');
            window.location.href = 'auth.html';
          }
        } catch (error) {
          console.error('[Department Head] Error al verificar rol de usuario:', error);
          mostrarError('Error al verificar permisos de acceso');
          setTimeout(() => {
            window.location.href = 'auth.html';
          }, 2000);
        } finally {
          mostrarPreloader(false);
        }
      } else {
        // No hay usuario autenticado, redirigir
        console.log('[Department Head] Usuario no autenticado');
        window.location.href = 'auth.html';
      }
    });
  } catch (error) {
    console.error('[Department Head] Error en verificarAcceso:', error);
    mostrarPreloader(false);
    mostrarError('Error al verificar acceso');
  }
}

/**
 * Muestra los datos del usuario en la interfaz
 */
function mostrarDatosUsuario(user, userData) {
  if (domElements.userNameHeader) {
    const nombre = userData.nombre || '';
    const apellido = userData.apellidoPaterno || '';
    domElements.userNameHeader.textContent = `${nombre} ${apellido}`.trim() || 'Jefe de Departamento';
  }
}

/**
 * Carga los datos de la carrera asignada
 */
async function cargarDatosCarrera(carreraId) {
  if (!carreraId) {
    console.error('[Department Head] No hay carrera asignada');
    if (domElements.careerName) domElements.careerName.textContent = 'No asignada';
    if (domElements.careerCode) domElements.careerCode.textContent = 'N/A';
    if (domElements.graduatesCount) domElements.graduatesCount.textContent = '0';
    currentCareerData = null;
    return;
  }

  try {
    // Obtener datos de la carrera
    const carreraDoc = await db.collection('carreras').doc(carreraId).get();
    
    if (!carreraDoc.exists) {
      throw new Error('La carrera asignada no existe');
    }

    const carreraData = carreraDoc.data();
    
    // Guardar datos de la carrera en variable global para uso en otras vistas
    currentCareerData = {
      id: carreraId,
      ...carreraData
    };
    // Exponer datos de carrera en el ámbito global para filtro por defecto
    window.currentCareerData = currentCareerData;
    
    console.log('[Department Head] Datos de carrera cargados:', currentCareerData);
    
    // Mostrar datos en la interfaz
    if (domElements.careerName) {
      domElements.careerName.textContent = carreraData.nombre || 'Sin nombre';
    }
    
    if (domElements.careerCode) {
      domElements.careerCode.textContent = carreraData.clave || 'Sin clave';
    }

    // Contar egresados buscando en las encuestas completadas
    try {
      // Usar el nombre de la carrera para la comparación, no el ID
      const nombreCarrera = carreraData.nombre || '';
      console.log('[Department Head] Buscando egresados para la carrera:', nombreCarrera, '(ID:', carreraId, ')');
      
      if (!nombreCarrera) {
        throw new Error('No se encontró el nombre de la carrera');
      }
      
      // Obtener todos los usuarios
      const usuariosSnapshot = await db.collection('usuarios').get();
      let contadorEgresados = 0;
      let egresadosProcesados = 0;
      
      // Para cada usuario, revisar su colección de historialEncuestas
      for (const userDoc of usuariosSnapshot.docs) {
        try {
          const historialSnapshot = await db.collection('usuarios')
            .doc(userDoc.id)
            .collection('historialEncuestas')
            .orderBy('fechaCompletado', 'desc')
            .limit(1)
            .get();
          
          egresadosProcesados++;
          
          if (!historialSnapshot.empty) {
            const encuesta = historialSnapshot.docs[0].data();
            
            // Verificar si la encuesta tiene datos personales y si la carrera coincide (por nombre)
            if (encuesta && encuesta.datosPersonales) {
              const carreraEncuesta = encuesta.datosPersonales.carrera || '';
              console.log('[Department Head] Comparando:', {carreraEncuesta, nombreCarrera});
              
              // Comparar de forma flexible (ambos en minúsculas y eliminar espacios adicionales)
              const nombreCarreraLimpio = nombreCarrera.toLowerCase().trim();
              const carreraEncuestaLimpia = carreraEncuesta.toLowerCase().trim();
              
              if (nombreCarreraLimpio === carreraEncuestaLimpia || 
                  carreraEncuestaLimpia.includes(nombreCarreraLimpio) || 
                  nombreCarreraLimpio.includes(carreraEncuestaLimpia)) {
                contadorEgresados++;
                console.log('[Department Head] Encontrado egresado:', userDoc.id, 'carrera:', carreraEncuesta);
              }
            }
          }
        } catch (error) {
          console.error('[Department Head] Error al procesar historial de encuestas para usuario:', userDoc.id, error);
        }
      }
      
      console.log(`[Department Head] Procesados ${egresadosProcesados} usuarios, encontrados ${contadorEgresados} egresados para la carrera ${carreraId}`);
      
      if (domElements.graduatesCount) {
        domElements.graduatesCount.textContent = contadorEgresados.toString();
      }
    } catch (error) {
      console.error('[Department Head] Error al contar egresados:', error);
      if (domElements.graduatesCount) {
        domElements.graduatesCount.textContent = 'Error';
      }
    }

  } catch (error) {
    console.error('[Department Head] Error al cargar datos de carrera:', error);
    mostrarError('Error al cargar datos de la carrera asignada');
    
    // Mostrar valores por defecto
    if (domElements.careerName) domElements.careerName.textContent = 'Error al cargar';
    if (domElements.careerCode) domElements.careerCode.textContent = 'Error';
    if (domElements.graduatesCount) domElements.graduatesCount.textContent = '?';
  }
}

/**
 * Función para cerrar sesión
 */
async function logout() {
  try {
    await auth.signOut();
    localStorage.clear();
    window.location.href = 'auth.html';
  } catch (error) {
    console.error('[Department Head] Error al cerrar sesión:', error);
    mostrarError('Error al cerrar sesión');
  }
}

/**
 * Muestra u oculta el preloader
 */
function mostrarPreloader(mostrar) {
  if (domElements.preloader) {
    domElements.preloader.style.display = mostrar ? 'flex' : 'none';
  }
}

/**
 * Muestra un mensaje de error
 */
function mostrarError(mensaje) {
  alert(mensaje); // Implementación básica, se puede mejorar con un modal
  console.error('[Department Head] Error:', mensaje);
}

/**
 * Configura la navegación entre vistas
 */
function configurarNavegacion() {
  // Configurar eventos para los elementos del sidebar
  if (domElements.sidebarLinks) {
    domElements.sidebarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewName = link.dataset.view;
        
        if (viewName) {
          cargarVista(viewName);
        }
      });
    });
  }
}

/**
 * Carga una vista específica en el panel principal
 */
async function cargarVista(viewName) {
  try {
    // Validar que la vista existe
    if (!viewName || !Object.values(VIEWS).includes(viewName)) {
      throw new Error(`Vista no válida: ${viewName}`);
    }
    
    // Evitar recargar la misma vista
    if (viewName === currentView && viewName !== VIEWS.DASHBOARD) {
      console.log(`[Department Head] Ya estás en la vista ${viewName}`);
      return;
    }
    
    console.log(`[Department Head] Cargando vista: ${viewName}`);
    mostrarPreloader(true);
    
    // Actualizamos la vista actual
    currentView = viewName;
    
    // Actualizar clases activas en el sidebar
    actualizarSidebarActivo(viewName);
    
    try {
      // Diferentes acciones según la vista
      switch (viewName) {
        case VIEWS.DASHBOARD:
          // Cargar dashboard principal, que ya está en el HTML
          domElements.contentArea.innerHTML = ''; // Limpiar contenido actual
          location.reload(); // Forma simple de volver al dashboard principal
          return;
          
        case VIEWS.GRADUATE_STATS:
          // Cargar vista de estadísticas de egresados
          await cargarVistaEstadisticas();
          break;
          
        default:
          throw new Error(`Vista no implementada: ${viewName}`);
      }
      
    } catch (error) {
      console.error(`[Department Head] Error al cargar la vista ${viewName}:`, error);
      mostrarError(`Error al cargar la vista. ${error.message}`);
      
      // Si falla, volvemos al dashboard principal
      setTimeout(() => {
        location.reload();
      }, 2000);
      
    } finally {
      mostrarPreloader(false);
    }
    
  } catch (error) {
    console.error('[Department Head] Error en cargarVista:', error);
    mostrarError('Error al cambiar de vista');
    mostrarPreloader(false);
  }
}

/**
 * Actualiza las clases activas en el sidebar
 */
function actualizarSidebarActivo(viewName) {
  if (domElements.sidebarLinks) {
    domElements.sidebarLinks.forEach(link => {
      if (link.dataset.view === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}

/**
 * Carga la vista de estadísticas de egresados
 */
async function cargarVistaEstadisticas() {
  try {
    console.log('[Department Head] Cargando vista de estadísticas de egresados');
    
    // Cargar HTML de la vista desde el archivo externo
    const response = await fetch('views/department-head/graduate-stats.html');
    
    if (!response.ok) {
      throw new Error(`Error al cargar la vista: ${response.status} ${response.statusText}`);
    }
    
    const htmlContent = await response.text();
    domElements.contentArea.innerHTML = htmlContent;
    
    // Cargar script y estilos para las gráficas si no están ya cargados
    await cargarRecursosEstadisticas();
    
    // Inicializar el módulo de estadísticas con los datos de la carrera actual
    if (window.GraduateStats && currentCareerData) {
      window.GraduateStats.init(currentCareerData);
    } else {
      console.error('[Department Head] No se puede inicializar GraduateStats: ', {
        moduleAvailable: !!window.GraduateStats,
        careerDataAvailable: !!currentCareerData
      });
    }
    
  } catch (error) {
    console.error('[Department Head] Error al cargar vista de estadísticas:', error);
    throw error;
  }
}

/**
 * Carga los recursos necesarios para las estadísticas
 */
async function cargarRecursosEstadisticas() {
  return new Promise((resolve, reject) => {
    try {
      // Verificar si ya está cargado Chart.js
      if (window.Chart) {
        console.log('[Department Head] Chart.js ya está cargado');
      } else {
        // Cargar Chart.js desde CDN
        const chartScript = document.createElement('script');
        chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        document.head.appendChild(chartScript);
        
        chartScript.onload = () => {
          console.log('[Department Head] Chart.js cargado correctamente');
        };
        
        chartScript.onerror = (error) => {
          console.error('[Department Head] Error al cargar Chart.js:', error);
          reject(new Error('No se pudo cargar Chart.js'));
          return;
        };
      }
      
      // Verificar si ya está cargado el CSS de las estadísticas
      let cssLoaded = false;
      for (const styleSheet of document.styleSheets) {
        if (styleSheet.href && styleSheet.href.includes('department-head/graduate-stats.css')) {
          cssLoaded = true;
          break;
        }
      }
      
      if (!cssLoaded) {
        // Cargar CSS de estadísticas
        const statsStyles = document.createElement('link');
        statsStyles.rel = 'stylesheet';
        statsStyles.href = 'css/department-head/graduate-stats.css';
        document.head.appendChild(statsStyles);
      }
      
      // Verificar si ya está cargado el script de estadísticas
      if (window.GraduateStats) {
        console.log('[Department Head] Módulo de estadísticas ya está cargado');
        resolve();
      } else {
        // Cargar el script de estadísticas
        const statsScript = document.createElement('script');
        statsScript.src = 'js/department-head/graduate-stats.js';
        document.body.appendChild(statsScript);
        
        statsScript.onload = () => {
          console.log('[Department Head] Módulo de estadísticas cargado correctamente');
          resolve();
        };
        
        statsScript.onerror = (error) => {
          console.error('[Department Head] Error al cargar el módulo de estadísticas:', error);
          reject(new Error('No se pudo cargar el módulo de estadísticas'));
        };
      }
      
    } catch (error) {
      console.error('[Department Head] Error al cargar recursos de estadísticas:', error);
      reject(error);
    }
  });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
