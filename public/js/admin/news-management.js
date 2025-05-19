/**
 * news-management.js
 * Sistema de gestión de noticias para estudiantes
 */


/**
 * Sistema de gestión de noticias
 */
const NewsManagement = (function() {
  // Referencias a elementos del DOM
  let newsForm;
  let newsTitleInput;
  let newsContentInput;
  let newsCareerSelect;
  let newsList;
  let newsLoading;
  let noNewsMessage;
  let newsFilterSelect;
  let newsDetailModal;
  let currentNewsId = null;
  
  // Cache de noticias
  let newsCache = [];
  
  /**
   * Inicializa el sistema de gestión de noticias
   */
  function init() {
    console.log('[NewsManagement] Inicializando sistema de noticias');
    
    // Obtener referencias a elementos del DOM
    newsForm = document.getElementById('news-form');
    newsTitleInput = document.getElementById('news-title');
    newsContentInput = document.getElementById('news-content');
    newsCareerSelect = document.getElementById('news-career');
    newsList = document.getElementById('news-list');
    newsLoading = document.getElementById('news-loading');
    noNewsMessage = document.getElementById('no-news-message');
    newsFilterSelect = document.getElementById('news-filter');
    newsDetailModal = document.getElementById('news-detail-modal');

    // Debug: mostrar si los elementos existen
    if (!newsForm) console.warn('[NewsManagement][DEBUG] newsForm no encontrado');
    if (!newsTitleInput) console.warn('[NewsManagement][DEBUG] newsTitleInput no encontrado');
    if (!newsContentInput) console.warn('[NewsManagement][DEBUG] newsContentInput no encontrado');
    if (!newsCareerSelect) console.warn('[NewsManagement][DEBUG] newsCareerSelect no encontrado');
    if (!newsList) console.warn('[NewsManagement][DEBUG] newsList no encontrado');
    if (!newsLoading) console.warn('[NewsManagement][DEBUG] newsLoading no encontrado');
    if (!noNewsMessage) console.warn('[NewsManagement][DEBUG] noNewsMessage no encontrado');
    if (!newsFilterSelect) console.warn('[NewsManagement][DEBUG] newsFilterSelect no encontrado');
    if (!newsDetailModal) console.warn('[NewsManagement][DEBUG] newsDetailModal no encontrado');

    // Configurar eventos solo si los elementos existen
    if (newsForm) {
      newsForm.removeEventListener('submit', handleNewsSubmit);
      newsForm.addEventListener('submit', function(event) {
        event.preventDefault();
        handleNewsSubmit(event);
      });
    }
    if (newsFilterSelect) {
      newsFilterSelect.removeEventListener('change', filterNews);
      newsFilterSelect.addEventListener('change', filterNews);
    }
    // Configurar modal solo si existe
    if (newsDetailModal) {
      setupNewsModal();
    }
    // Cargar carreras y noticias solo si los selects y listas existen
    if (newsCareerSelect) {
      loadCareersForSelect();
    }
    if (newsList && newsLoading) {
      loadNews();
    }
  }
  
  /**
   * Configura los eventos del modal de detalles de noticia
   */
  function setupNewsModal() {
    const closeButtons = newsDetailModal.querySelectorAll('.modal-close, #btn-close-news-detail');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        newsDetailModal.style.display = 'none';
      });
    });
    
    const deleteButton = document.getElementById('btn-delete-news');
    if (deleteButton) {
      deleteButton.addEventListener('click', deleteCurrentNews);
    }
    
    // Cerrar modal al hacer clic fuera de su contenido
    window.addEventListener('click', (event) => {
      if (event.target === newsDetailModal) {
        newsDetailModal.style.display = 'none';
      }
    });
  }
  
  /**
   * Maneja el envío del formulario de noticias
   */
  async function handleNewsSubmit(event) {
    event.preventDefault();
    console.log('[NewsManagement][DEBUG] Evento submit disparado');
    // Validar formulario
    if (!newsForm.checkValidity()) {
      showToast('Por favor, completa todos los campos obligatorios.', 'error');
      return;
    }
    
    const title = newsTitleInput.value.trim();
    const content = newsContentInput.value.trim();
    const targetCareer = newsCareerSelect.value;
    
    // Verificar autenticación
    const user = firebase.auth().currentUser;
    if (!user) {
      console.error('[NewsManagement][DEBUG] Usuario no autenticado');
      showToast('Debes iniciar sesión para publicar noticias.', 'error');
      return;
    }
    try {
      // Deshabilitar el botón durante el envío
      const submitButton = newsForm.querySelector('button[type="submit"]');
      const originalText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';
      
      // Crear objeto de noticia
      const newsData = {
        title,
        content,
        publishedAt: new Date(),
        targetCareer,
        author: firebase.auth().currentUser.uid,
        authorName: firebase.auth().currentUser.displayName || 'Administrador'
      };
      
      // Guardar en Firestore
      const db = firebase.firestore();
      await db.collection('news').add(newsData);
      
      // Mostrar mensaje de éxito
      showToast('¡Noticia publicada con éxito!', 'success');
      
      // Limpiar formulario
      newsForm.reset();
      
      // Recargar noticias
      loadNews();
      
      // Restaurar botón
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
      
    } catch (error) {
      console.error('[NewsManagement] Error al publicar noticia:', error);
      showToast(`Error: ${error.message}`, 'error');
      
      // Restaurar botón
      const submitButton = newsForm.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar Noticia';
    }
  }
  
  /**
   * Carga las carreras disponibles en el select
   */
  async function loadCareersForSelect() {
    try {
      // Limpiar opciones actuales excepto la de "Todas las carreras"
      while (newsCareerSelect.options.length > 1) {
        newsCareerSelect.remove(1);
      }
      
      while (newsFilterSelect.options.length > 1) {
        newsFilterSelect.remove(1);
      }
      
      // Usar CareerManagementService para obtener las carreras
      const careerService = window.careerService || new CareerManagementService();
      window.careerService = careerService; // para reutilizar en otros módulos si es necesario
      let careers = [];
      try {
        careers = await careerService.getAllCareers();
      } catch (error) {
        console.error('[NewsManagement] Error al cargar carreras:', error);
        newsCareerSelect.innerHTML = '<option value="">Error al cargar carreras</option>';
        newsCareerSelect.disabled = true;
        return;
      }
      if (!careers.length) {
        console.log('[NewsManagement] No hay carreras disponibles');
        newsCareerSelect.innerHTML = '<option value="">No hay carreras</option>';
        newsCareerSelect.disabled = true;
        return;
      }
      // Llenar el select con las carreras
      newsCareerSelect.innerHTML = '<option value="">Selecciona una carrera</option>';
      careers.forEach(career => {
        const option = document.createElement('option');
        option.value = career.id;
        option.textContent = career.nombre || 'Sin nombre';
        newsCareerSelect.appendChild(option);
      });
      
      // Agregar al select de filtrado
      newsFilterSelect.innerHTML = '<option value="all">Todas las carreras</option>';
      careers.forEach(career => {
        const optionFilter = document.createElement('option');
        optionFilter.value = career.id;
        optionFilter.textContent = career.nombre || 'Sin nombre';
        newsFilterSelect.appendChild(optionFilter);
      });
      
    } catch (error) {
      console.error('[NewsManagement] Error al cargar carreras:', error);
    }
  }
  
  /**
   * Carga las noticias existentes desde Firestore
   */
  async function loadNews() {
    try {
      // Mostrar indicador de carga
      newsLoading.style.display = 'flex';
      noNewsMessage.style.display = 'none';
      newsList.innerHTML = '';
      
      // Obtener noticias de Firestore
      const db = firebase.firestore();
      const newsSnapshot = await db.collection('news')
        .orderBy('publishedAt', 'desc')
        .get();
      
      // Ocultar indicador de carga
      newsLoading.style.display = 'none';
      
      if (newsSnapshot.empty) {
        console.log('[NewsManagement] No hay noticias publicadas');
        noNewsMessage.style.display = 'flex';
        newsCache = [];
        return;
      }
      
      // Guardar noticias en cache
      newsCache = newsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt.toDate()
      }));
      
      // Aplicar filtro actual
      filterNews();
      
    } catch (error) {
      console.error('[NewsManagement] Error al cargar noticias:', error);
      newsLoading.style.display = 'none';
      noNewsMessage.style.display = 'flex';
      noNewsMessage.textContent = `Error: ${error.message}`;
    }
  }
  
  /**
   * Filtra las noticias según el carrera seleccionada
   */
  function filterNews() {
    // Limpiar lista actual
    newsList.innerHTML = '';
    
    // Obtener valor del filtro
    const filterValue = newsFilterSelect.value;
    
    // Filtrar noticias en cache
    let filteredNews = newsCache;
    
    if (filterValue !== 'all') {
      filteredNews = newsCache.filter(news => 
        news.targetCareer === filterValue || news.targetCareer === 'all'
      );
    }
    
    // Mostrar mensaje si no hay noticias
    if (filteredNews.length === 0) {
      noNewsMessage.style.display = 'flex';
      return;
    }
    
    // Ocultar mensaje de no hay noticias
    noNewsMessage.style.display = 'none';
    
    // Mostrar noticias filtradas
    filteredNews.forEach(renderNewsItem);
  }
  
  /**
   * Renderiza un item de noticia en la lista
   */
  function renderNewsItem(news) {
    const newsItem = document.createElement('div');
    newsItem.className = 'news-item';
    newsItem.dataset.id = news.id;
    
    // Obtener nombre de la carrera
    let targetText = 'Todas las carreras';
    if (news.targetCareer !== 'all') {
      const targetOption = newsFilterSelect.querySelector(`option[value="${news.targetCareer}"]`);
      if (targetOption) {
        targetText = targetOption.textContent;
      }
    }
    
    // Formatear fecha
    const publishDate = formatDate(news.publishedAt);
    
    // Truncar contenido para la vista previa
    const contentPreview = news.content.length > 150 
      ? news.content.substring(0, 150) + '...' 
      : news.content;
    
    newsItem.innerHTML = `
      <div class="news-item-header">
        <h3 class="news-item-title">${news.title}</h3>
        <div class="news-item-meta">
          <span class="news-date"><i class="far fa-calendar-alt"></i> ${publishDate}</span>
          <span class="news-target"><i class="fas fa-users"></i> ${targetText}</span>
        </div>
      </div>
      <div class="news-item-preview">${contentPreview}</div>
      <div class="news-item-actions">
        <button class="btn-text btn-view-news">Ver completo</button>
        <button class="btn-text btn-danger btn-delete-news">Eliminar</button>
      </div>
    `;
    
    // Configurar eventos de los botones
    const viewButton = newsItem.querySelector('.btn-view-news');
    const deleteButton = newsItem.querySelector('.btn-delete-news');
    
    viewButton.addEventListener('click', () => showNewsDetail(news));
    deleteButton.addEventListener('click', () => confirmDeleteNews(news.id));
    
    newsList.appendChild(newsItem);
  }
  
  /**
   * Muestra el modal de detalle de noticia
   */
  function showNewsDetail(news) {
    // Guardar ID de la noticia actual
    currentNewsId = news.id;
    
    // Obtener elementos del modal
    const titleEl = document.getElementById('news-detail-title');
    const dateEl = document.getElementById('news-detail-date');
    const targetEl = document.getElementById('news-detail-target');
    const contentEl = document.getElementById('news-detail-content');
    
    // Obtener nombre de la carrera
    let targetText = 'Todas las carreras';
    if (news.targetCareer !== 'all') {
      const targetOption = newsFilterSelect.querySelector(`option[value="${news.targetCareer}"]`);
      if (targetOption) {
        targetText = targetOption.textContent;
      }
    }
    
    // Actualizar contenido del modal
    titleEl.textContent = news.title;
    dateEl.textContent = formatDate(news.publishedAt);
    targetEl.textContent = targetText;
    contentEl.textContent = news.content;
    
    // Mostrar modal
    newsDetailModal.style.display = 'block';
  }
  
  /**
   * Confirma la eliminación de una noticia
   */
  function confirmDeleteNews(newsId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta noticia? Esta acción no se puede deshacer.')) {
      deleteNews(newsId);
    }
  }
  
  /**
   * Elimina la noticia actual mostrada en el modal
   */
  function deleteCurrentNews() {
    if (currentNewsId) {
      if (confirm('¿Estás seguro de que deseas eliminar esta noticia? Esta acción no se puede deshacer.')) {
        newsDetailModal.style.display = 'none';
        deleteNews(currentNewsId);
        currentNewsId = null;
      }
    }
  }
  
  /**
   * Elimina una noticia de Firestore
   */
  async function deleteNews(newsId) {
    try {
      // Eliminar de Firestore
      const db = firebase.firestore();
      await db.collection('news').doc(newsId).delete();
      
      // Mostrar mensaje de éxito
      showToast('Noticia eliminada con éxito', 'success');
      
      // Recargar noticias
      loadNews();
      
    } catch (error) {
      console.error('[NewsManagement] Error al eliminar noticia:', error);
      showToast(`Error: ${error.message}`, 'error');
    }
  }
  
  /**
   * Formatea una fecha para mostrarla
   */
  function formatDate(date) {
    if (!date) return '';
    
    const options = {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Date(date).toLocaleDateString('es-MX', options);
  }
  
  /**
   * Muestra un mensaje toast
   */
  function showToast(message, type = 'info') {
    // Verificar si existe el contenedor de toasts
    let toastContainer = document.getElementById('toast-container');
    
    // Crear contenedor si no existe
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    // Crear toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Añadir toast al contenedor
    toastContainer.appendChild(toast);
    
    // Remover toast después de 3 segundos
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
  
  // API pública
  const NewsManagementModule = {
    init,
    loadNews,
    filterNews
  };
  window.NewsManagement = NewsManagementModule;
  return NewsManagementModule;
})();
