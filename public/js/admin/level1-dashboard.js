/**
 * level1-dashboard-simplified.js
 * Versión simplificada del dashboard que solo maneja KPIs básicos
 */

window.Level1Dashboard = (function() {
  // Variables privadas del módulo
  let dataService;
  let dashboardInitialized = false;
  
  // Variables para filtros
  let activeFilters = {
    carrera: 'all'
  };
  
  // Variables de control
  let loadInProgress = false;
  let lastRefreshTime = 0;
  let refreshInProgress = false;
  const MIN_REFRESH_INTERVAL = 10000; // 10 segundos entre actualizaciones
  
  /**
   * Inicializa la vista del dashboard
   */
  async function init(params = {}) {
    // Evitar inicializaciones múltiples
    if (dashboardInitialized) {
      console.log('[Level1Dashboard] Ya inicializado, evitando reinicialización');
      return;
    }
    
    try {
      console.log('[Level1Dashboard] Inicializando panel principal simplificado');
      
      // Obtener referencia al servicio de datos
      dataService = window.adminDataService;
      
      if (!dataService) {
        console.error('Error: El servicio de datos no está disponible');
        return;
      }
      
      // Marcar como inicializado
      dashboardInitialized = true;
      
      // Inicializar filtro de carrera
      initCareerFilter();
      
      // Inicializar el gestor de periodos de encuestas
      if (window.SurveyPeriodManager) {
        await SurveyPeriodManager.init();
      } else {
        console.error('Error: El gestor de periodos no está disponible');
      }
      
      // Inicializar el gestor de lista de egresados
      // Si no está disponible, intentamos esperar a que se cargue (máximo 3 segundos)
      if (!window.GraduatesListManager || typeof window.GraduatesListManager.init !== 'function') {
        console.log('[Level1Dashboard] Esperando a que el gestor de lista de egresados se cargue...');
        
        // Intentar esperar a que GraduatesListManager se cargue (máx 3 segundos)
        let waitTime = 0;
        const checkInterval = 300; // ms
        const maxWaitTime = 3000; // 3 segundos máximo
        
        while (!window.GraduatesListManager && waitTime < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          waitTime += checkInterval;
        }
      }
      
      // Intentar inicializar después de esperar
      if (window.GraduatesListManager && typeof window.GraduatesListManager.init === 'function') {
        await window.GraduatesListManager.init();
      } else {
        console.error('Error: El gestor de lista de egresados no está disponible después de esperar');
        // Continuar de todos modos, solo que sin funcionalidad de lista de egresados
      }
      
      // Configurar evento de actualización
      const refreshBtn = document.getElementById('refresh-data');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
      }
      
      // Configurar evento para aplicar filtros
      const applyFiltersBtn = document.getElementById('apply-filters');
      if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
      }
      
      // Actualizar nombre del usuario en el encabezado
      updateUserHeader();
      
      // Inicializar gestor de periodos de encuesta
      if (window.SurveyPeriodManager) {
        try {
          console.log('[Level1Dashboard] Inicializando gestor de periodos');
          await window.SurveyPeriodManager.init();
        } catch (periodError) {
          console.error('[Level1Dashboard] Error al inicializar gestor de periodos:', periodError);
        }
      } else {
        console.warn('[Level1Dashboard] El gestor de periodos no está disponible');
      }
      
      // Cargar datos iniciales
      await loadData();
      
    } catch (error) {
      console.error("Error durante la inicialización:", error);
      dashboardInitialized = false; // Permitir reintentar la inicialización en caso de error
    }
  }

  /**
   * Actualiza el nombre del usuario en el encabezado de la barra lateral
   */
  function updateUserHeader() {
    try {
      const userHeader = document.getElementById('user-name-header');
      if (userHeader && firebase.auth().currentUser) {
        const user = firebase.auth().currentUser;
        if (user.displayName) {
          userHeader.textContent = user.displayName;
        } else if (user.email) {
          userHeader.textContent = user.email.split('@')[0];
        }
      }
    } catch (error) {
      console.log('No se pudo actualizar el nombre del usuario:', error);
    }
  }

  /**
   * Inicializa el filtro de carrera
   */
  function initCareerFilter() {
    // Obtener elemento del selector de carrera
    const careerSelect = document.getElementById('filter-career');
    
    // Establecer valor inicial
    if (careerSelect) careerSelect.value = activeFilters.carrera;
    
    // Cargar opciones de carrera
    loadCareerOptions();
  }

  /**
   * Carga las opciones de carrera para el filtro desde Firestore
   */
  async function loadCareerOptions() {
    try {
      const careerSelect = document.getElementById('filter-career');
      if (!careerSelect) return;
      
      // Limpiar opciones existentes, excepto la primera (Todas)
      while (careerSelect.options.length > 1) {
        careerSelect.remove(1);
      }
      
      // Obtener referencia a la colección de carreras en Firestore
      const carrerasRef = firebase.firestore().collection('carreras');
      const snapshot = await carrerasRef.get();
      
      if (snapshot.empty) {
        console.log('[Level1Dashboard] No se encontraron carreras en Firestore');
        return;
      }
      
      // Agregar cada carrera como una opción
      snapshot.forEach(doc => {
        const carrera = doc.data();
        const option = document.createElement('option');
        option.value = doc.id; // Usar el ID del documento como valor
        option.textContent = carrera.nombre || 'Carrera sin nombre';
        careerSelect.appendChild(option);
      });
      
      console.log(`[Level1Dashboard] ${snapshot.size} carreras cargadas desde Firestore`);
    } catch (error) {
      console.error("Error al cargar opciones de carrera:", error);
    }
  }

  /**
   * Aplica el filtro de carrera seleccionado y actualiza los datos
   */
  async function applyFilters() {
    try {
      // Obtener valor del filtro de carrera
      const careerSelect = document.getElementById('filter-career');
      
      if (!careerSelect) {
        return;
      }
      
      // Actualizar filtro activo
      activeFilters.carrera = careerSelect.value;
      
      // Mostrar indicador de carga
      showLoadingIndicators();
      
      // Aplicar filtro en el servicio de datos si está disponible
      if (dataService.setCareerFilter) {
        dataService.setCareerFilter(activeFilters.carrera);
      }
      
      // Recargar los datos
      await loadData();
    } catch (error) {
      console.error("Error al aplicar filtros:", error);
    }
  }

  /**
   * Carga los datos básicos para el dashboard simplificado
   */
  async function loadData() {
    // Evitar cargas simultáneas
    if (loadInProgress) {
      return;
    }
    
    loadInProgress = true;
    
    try {
      // Mostrar indicadores de carga
      showLoadingIndicators();
      
      // Cargar estadísticas básicas
      await loadBasicStats();
      
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      loadInProgress = false;
    }
  }

  /**
   * Actualiza los datos del dashboard
   */
  async function refreshData() {
    // Evitar actualizaciones demasiado frecuentes
    const now = Date.now();
    if (now - lastRefreshTime < MIN_REFRESH_INTERVAL || refreshInProgress) {
      return;
    }
    
    refreshInProgress = true;
    lastRefreshTime = now;
    
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) {
      // Cambiar texto e icono del botón
      const originalText = refreshBtn.innerHTML;
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
      refreshBtn.disabled = true;
      
      try {
        // Limpiar caché del servicio de datos si tiene esa función
        if (dataService.clearCache) {
          dataService.clearCache();
        }
        
        // Recargar los datos
        await loadData();
      } catch (error) {
        console.error("Error al actualizar datos:", error);
      } finally {
        // Restaurar botón
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
        refreshInProgress = false;
      }
    }
  }

  /**
   * Carga y muestra las estadísticas básicas (KPIs)
   */
  async function loadBasicStats() {
    try {
      // Obtener usuarios y encuestas
      const users = await dataService.getAllUsers();
      const surveys = await dataService.getAllSurveys();
      
      // Intentar obtener estadísticas de titulación si está disponible la función
      let graduationStats = { porcentajeTitulados: 0 };
      if (dataService.getGraduationStats) {
        graduationStats = await dataService.getGraduationStats(surveys);
      }
      
      // Actualizar KPIs
      updateKPI('kpi-total-graduates', users.length);
      updateKPI('kpi-completed-surveys', surveys.length);
      updateKPI('kpi-graduation-rate', `${graduationStats.porcentajeTitulados || 0}%`);
      
    } catch (error) {
      console.error("Error al cargar estadísticas básicas:", error);
      updateKPI('kpi-total-graduates', '?');
      updateKPI('kpi-completed-surveys', '?');
      updateKPI('kpi-graduation-rate', '?');
    }
  }
  
  /**
   * Actualiza el valor de un elemento KPI
   */
  function updateKPI(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    }
  }

  /**
   * Muestra indicadores de carga en todos los elementos KPI
   */
  function showLoadingIndicators() {
    // KPIs
    document.getElementById('kpi-total-graduates').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    document.getElementById('kpi-completed-surveys').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    document.getElementById('kpi-graduation-rate').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }

  // Exponer funciones públicas
  return {
    init,
    refreshData,
    applyFilters
  };
})();

/**
 * Función global de inicialización
 */
window.initLevel1Dashboard = async function(params = {}) {
  console.log('[Level1Dashboard] Inicialización global solicitada');
  
  // Iniciar primero el gestor de periodos si está disponible
  if (window.SurveyPeriodManager) {
    console.log('[Level1Dashboard] Inicializando gestor de periodos...');
    try {
      await SurveyPeriodManager.init();
    } catch (error) {
      console.error('[Level1Dashboard] Error al inicializar gestor de periodos:', error);
    }
  }
  
  // Luego iniciar el gestor de lista de egresados si está disponible
  if (window.GraduatesListManager) {
    console.log('[Level1Dashboard] Inicializando gestor de lista de egresados...');
    try {
      await GraduatesListManager.init();
    } catch (error) {
      console.error('[Level1Dashboard] Error al inicializar gestor de lista de egresados:', error);
    }
  }
  
  // Finalmente inicializar el propio dashboard
  console.log('[Level1Dashboard] Inicializando panel principal...');
  await Level1Dashboard.init(params);
};
