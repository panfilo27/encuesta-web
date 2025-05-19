/**
 * dashboard.js - Funcionalidades para el dashboard de egresados
 * Carga noticias relevantes desde Firestore y maneja la validación del periodo de encuesta
 */

window.DashboardManager = (function() {
  // Estado y variables
  let currentUser = null;
  let isLoadingNews = false;
  let isSurveyButtonEnabled = false;
  let hasUserCompletedCurrentPeriod = false;
  
  // Referencias a elementos del DOM
  const domElements = {
    newsGrid: document.getElementById('dashboard-news-grid'),
    newsLoading: document.getElementById('news-loading'),
    noNewsMessage: document.getElementById('no-news-message'),
    surveyButton: document.getElementById('restartSurveyBtn'),
    surveyPeriodStatus: document.getElementById('survey-period-status'),
    surveyPeriodDetails: document.getElementById('survey-period-details'),
    surveyStatusMessage: document.getElementById('survey-status-message')
  };

  /**
   * Inicializa el dashboard manager
   */
  async function init() {
    console.log('[DashboardManager] Inicializando...');
    
    try {
      // Esperar a que Firebase esté disponible
      if (!firebase || !firebase.auth() || !firebase.firestore()) {
        console.error('[DashboardManager] Firebase no está disponible');
        return;
      }
      
      // Obtener usuario actual
      currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        console.error('[DashboardManager] No hay usuario autenticado');
        return;
      }
      
      // Inicializar componentes en paralelo
      await Promise.all([
        loadNews(),
        initSurveyPeriod()
      ]);
      
      // Configurar el botón de iniciar/reanudar encuesta
      setupSurveyButton();
      
      console.log('[DashboardManager] Inicialización completada');
    } catch (error) {
      console.error('[DashboardManager] Error en inicialización:', error);
    }
  }
  
  /**
   * Carga las noticias desde Firestore
   */
  async function loadNews() {
    if (isLoadingNews) return;
    isLoadingNews = true;
    
    // Mostrar loader y ocultar otros elementos
    domElements.newsLoading.style.display = 'flex';
    domElements.newsGrid.style.display = 'none';
    domElements.noNewsMessage.style.display = 'none';
    
    try {
      const db = firebase.firestore();
      
      // Obtener todas las noticias ordenadas por fecha de publicación (más recientes primero)
      const newsSnapshot = await db.collection('news')
        .orderBy('publishedAt', 'desc')
        .get();
      
      // Ocultar loader
      domElements.newsLoading.style.display = 'none';
      
      // Si no hay noticias, mostrar mensaje
      if (newsSnapshot.empty) {
        console.log('[DashboardManager] No hay noticias publicadas');
        domElements.noNewsMessage.style.display = 'block';
        return;
      }
      
      // Preparar array de noticias
      const allNews = newsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate() || new Date()
      }));
      
      // Mostrar la lista de noticias
      domElements.newsGrid.style.display = 'grid';
      domElements.newsGrid.innerHTML = '';
      
      // Renderizar cada noticia (mostrar máximo 6)
      const newsToShow = allNews.slice(0, 6);
      newsToShow.forEach(renderNewsItem);
      
      // Si no hay noticias para mostrar, mostrar mensaje
      if (newsToShow.length === 0) {
        domElements.noNewsMessage.style.display = 'block';
      }
      
    } catch (error) {
      console.error('[DashboardManager] Error al cargar noticias:', error);
      domElements.newsLoading.style.display = 'none';
      domElements.noNewsMessage.style.display = 'block';
      domElements.noNewsMessage.innerHTML = `
        <i class="fas fa-exclamation-triangle fa-2x"></i>
        <p>Error al cargar noticias. <a href="javascript:DashboardManager.loadNews()">Reintentar</a></p>
      `;
    } finally {
      isLoadingNews = false;
    }
  }
  
  /**
   * Renderiza un elemento de noticia en el grid
   */
  function renderNewsItem(news) {
    // Crear el elemento de noticia
    const newsItem = document.createElement('article');
    newsItem.className = 'news-item';
    
    // Formatear fecha - manejar diferentes formatos de publishedAt
    let publishedDate = '';
    if (news.publishedAt) {
      if (typeof news.publishedAt.toDate === 'function') {
        // Es un timestamp de Firestore
        publishedDate = formatDate(news.publishedAt.toDate());
      } else if (news.publishedAt instanceof Date) {
        // Ya es un objeto Date
        publishedDate = formatDate(news.publishedAt);
      } else {
        // Intenta convertirlo de otros formatos posibles
        try {
          publishedDate = formatDate(new Date(news.publishedAt));
        } catch (e) {
          console.warn('No se pudo formatear la fecha:', news.publishedAt);
        }
      }
    }
    
    // Truncar contenido para vista previa
    const previewContent = news.content && news.content.length > 120 
      ? news.content.substring(0, 120) + '...' 
      : (news.content || 'Sin contenido');
    
    // Generar HTML del item - sin botón "Leer más"
    newsItem.innerHTML = `
      <h3>${news.title || 'Sin título'}</h3>
      <div class="news-meta">
        <span class="news-date"><i class="far fa-calendar-alt"></i> ${publishedDate || 'Fecha no disponible'}</span>
      </div>
      <p>${news.content || 'Sin contenido'}</p>
    `;
    
    // Añadir a la lista
    domElements.newsGrid.appendChild(newsItem);
  }
  
  // Ya no necesitamos la función showNewsDetail pues mostramos el contenido completo directamente
  
  /**
   * Inicializa y valida el periodo de encuesta
   */
  async function initSurveyPeriod() {
    try {
      const db = firebase.firestore();
      const now = new Date();
      let isSurveyOpen = false;
      let currentPeriod = null;
      
      // Consultar directamente a Firestore
      console.log('[DashboardManager] Consultando periodo de encuesta actual...');
      const periodSnapshot = await db.collection('surveyPeriods')
        .where('active', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (!periodSnapshot.empty) {
        const periodDoc = periodSnapshot.docs[0];
        currentPeriod = {
          id: periodDoc.id,
          ...periodDoc.data()
        };
        
        console.log('[DashboardManager] Periodo activo encontrado:', currentPeriod);
        
        // Determinar si el periodo está abierto según las fechas
        const startDate = new Date(currentPeriod.startDate.seconds * 1000);
        const endDate = new Date(currentPeriod.endDate.seconds * 1000);
        isSurveyOpen = now >= startDate && now <= endDate;
        
        // Actualizar UI del periodo
        domElements.surveyPeriodStatus.textContent = isSurveyOpen ? 'Abierta' : 'Cerrada';
        domElements.surveyPeriodStatus.className = `survey-status ${isSurveyOpen ? 'status-open' : 'status-closed'}`;
        domElements.surveyPeriodDetails.textContent = `${formatDate(startDate)} - ${formatDate(endDate)} (${currentPeriod.name})`;
      } else {
        console.log('[DashboardManager] No hay periodos activos');
        domElements.surveyPeriodStatus.textContent = 'Cerrada';
        domElements.surveyPeriodStatus.className = 'survey-status status-closed';
        domElements.surveyPeriodDetails.textContent = 'No hay periodo configurado';
      }
      
      // Verificar si el usuario ya completó la encuesta en este periodo
      await checkUserSurveyStatus(currentPeriod);
      
      // Actualizar UI según estado
      updateSurveyButtonStatus(isSurveyOpen);
      
    } catch (error) {
      console.error('[DashboardManager] Error al inicializar periodo:', error);
      domElements.surveyPeriodStatus.textContent = 'Error';
      domElements.surveyPeriodStatus.className = 'survey-status status-closed';
      domElements.surveyPeriodDetails.textContent = 'Error al cargar periodo';
      updateSurveyButtonStatus(false, 'Error al cargar periodo de encuesta');
    }
  }
  
  /**
   * Verifica si el usuario ya completó la encuesta en el periodo actual
   * @param {Object} currentPeriod - El periodo actual activo, si existe
   */
  async function checkUserSurveyStatus(currentPeriod) {
    try {
      const db = firebase.firestore();
      const userId = currentUser.uid;
      
      // Si no hay periodo activo, no hay restricciones (aunque el botón estará deshabilitado por otras razones)
      if (!currentPeriod) {
        hasUserCompletedCurrentPeriod = false;
        return;
      }
      
      // Obtener datos del usuario
      const userDoc = await db.collection('usuarios').doc(userId).get();
      const userData = userDoc.data();
      
      // Si el usuario nunca ha completado una encuesta, puede proceder
      if (!userData.encuestaCompletada || !userData.ultimaFechaCompletada) {
        console.log('[DashboardManager] El usuario nunca ha completado una encuesta');
        hasUserCompletedCurrentPeriod = false;
        return;
      }
      
      // Convertir fechas para comparación
      const ultimaFecha = userData.ultimaFechaCompletada.toDate();
      const periodoInicio = currentPeriod.startDate.toDate();
      
      // IMPORTANTE: Si la última encuesta completada fue después del inicio del periodo actual,
      // significa que ya completó la encuesta en este periodo
      hasUserCompletedCurrentPeriod = ultimaFecha >= periodoInicio;
      
      console.log('[DashboardManager] Última encuesta completada:', ultimaFecha);
      console.log('[DashboardManager] Inicio del periodo actual:', periodoInicio);
      console.log('[DashboardManager] ¿Usuario completó encuesta en periodo actual?', hasUserCompletedCurrentPeriod);
      
    } catch (error) {
      console.error('[DashboardManager] Error al verificar estado de encuesta:', error);
      hasUserCompletedCurrentPeriod = true; // Por seguridad, asumir que ya completó
    }
  }
  
  /**
   * Actualiza el estado del botón de encuesta según el periodo
   */
  function updateSurveyButtonStatus(isSurveyPeriodOpen, errorMessage = null) {
    console.log('[DashboardManager] Actualizando estado del botón de encuesta:', {
      isSurveyPeriodOpen,
      hasUserCompletedCurrentPeriod,
      errorMessage
    });
    
    // Deshabilitar botón por defecto hasta comprobar
    domElements.surveyButton.disabled = true;
    domElements.surveyButton.classList.add('disabled');
    isSurveyButtonEnabled = false;
    
    // Si hay error, mostrar mensaje y mantener botón deshabilitado
    if (errorMessage) {
      domElements.surveyStatusMessage.textContent = errorMessage;
      domElements.surveyStatusMessage.style.display = 'block';
      domElements.surveyStatusMessage.className = 'alert-message error';
      return;
    }
    
    // Si el periodo está cerrado, mostrar mensaje
    if (!isSurveyPeriodOpen) {
      domElements.surveyStatusMessage.textContent = 'La encuesta no está abierta en este momento.';
      domElements.surveyStatusMessage.style.display = 'block';
      domElements.surveyStatusMessage.className = 'alert-message info';
      return;
    }
    
    // IMPORTANTE: Si ya completó la encuesta en este periodo, mantener deshabilitado y mostrar mensaje
    if (hasUserCompletedCurrentPeriod === true) {
      console.log('[DashboardManager] Usuario ya completó la encuesta en este periodo, deshabilitando botón');
      domElements.surveyButton.disabled = true;
      domElements.surveyButton.classList.add('disabled');
      isSurveyButtonEnabled = false;
      
      domElements.surveyStatusMessage.textContent = 'Ya has completado la encuesta en este periodo. Solo puedes contestar una vez por periodo.';
      domElements.surveyStatusMessage.style.display = 'block';
      domElements.surveyStatusMessage.className = 'alert-message success';
      return;
    }
    
    // Solo si el periodo está abierto Y no ha completado la encuesta, habilitar botón
    console.log('[DashboardManager] Habilitando botón de encuesta');
    domElements.surveyButton.disabled = false;
    domElements.surveyButton.classList.remove('disabled');
    domElements.surveyStatusMessage.style.display = 'none';
    isSurveyButtonEnabled = true;
  }
  
  /**
   * Configura el botón para iniciar/reanudar la encuesta
   */
  function setupSurveyButton() {
    if (domElements.surveyButton) {
      domElements.surveyButton.addEventListener('click', () => {
        if (!isSurveyButtonEnabled) return;
        
        // Guardar en localStorage que estamos iniciando la encuesta desde el módulo 1
        localStorage.setItem('current_module', '1');
        
        // Si hay datos guardados, preguntar si quiere continuarlos
        const hasModuleData = checkForSavedModuleData();
        
        if (hasModuleData) {
          if (confirm('Se encontraron datos guardados de una encuesta previa sin terminar. ¿Deseas continuar con esos datos?')) {
            window.location.href = 'modulo1.html';
          } else if (confirm('¿Deseas borrar los datos guardados y comenzar de nuevo?')) {
            clearAllModuleData();
            window.location.href = 'modulo1.html';
          }
        } else {
          // No hay datos guardados, iniciar desde cero
          window.location.href = 'modulo1.html';
        }
      });
    }
  }
  
  /**
   * Verifica si hay datos guardados en localStorage de módulos previos
   */
  function checkForSavedModuleData() {
    const moduleKeys = [
      'modulo1_data',
      'modulo2_data',
      'modulo3_data',
      'modulo4_data',
      'modulo5_data',
      'modulo6_data',
      'modulo7_data',
      'modulo8_data',
      'modulo9_data'
    ];
    
    return moduleKeys.some(key => {
      const data = localStorage.getItem(key);
      return data && data !== '{}' && data !== 'null';
    });
  }
  
  /**
   * Limpia todos los datos de módulos en localStorage
   */
  function clearAllModuleData() {
    const moduleKeys = [
      'modulo1_data',
      'modulo2_data',
      'modulo3_data',
      'modulo4_data',
      'modulo5_data',
      'modulo6_data',
      'modulo7_data',
      'modulo8_data',
      'modulo9_data'
    ];
    
    moduleKeys.forEach(key => localStorage.removeItem(key));
    console.log('[DashboardManager] Datos de módulos limpiados');
  }
  
  /**
   * Formatea una fecha para mostrar
   */
  function formatDate(date) {
    if (!date) return '';
    
    const options = {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    };
    
    return date.toLocaleDateString('es-MX', options);
  }
  
  // API pública
  return {
    init,
    loadNews
  };
})();

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function() {
  // La inicialización real se hará después de verificar que el usuario esté autenticado
  // Esto se maneja en el script embebido en dashboard.html que verifica firebase.auth().onAuthStateChanged
});
