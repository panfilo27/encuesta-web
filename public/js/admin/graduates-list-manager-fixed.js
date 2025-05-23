/**
 * graduates-list-manager.js
 * Gestión de la lista de egresados para el panel de administración
 */

window.GraduatesListManager = (function() {
  // Variables privadas
  let initialized = false;
  let graduatesList = [];
  let filteredGraduates = [];
  let careers = [];
  let periods = [];
  
  // Configuración de paginación
  let currentPage = 1;
  const pageSize = 10;
  let totalPages = 0;
  
  // Referencias a elementos del DOM
  let graduatesTable;
  let graduatesListElement;
  let paginationInfo;
  let prevPageBtn;
  let nextPageBtn;
  
  // Filtros
  let searchInput;
  let searchBtn;
  let careerFilter;
  let periodFilter;
  let applyFiltersBtn;
  
  // Modal de detalles
  let graduateDetailsModal;
  
  /**
   * Inicialización del gestor de lista de egresados
   */
  async function init() {
    if (initialized) return;
    
    console.log('[Graduates List Manager] Inicializando...');
    
    // Obtener referencias a elementos del DOM
    graduatesTable = document.querySelector('.graduates-table');
    graduatesListElement = document.getElementById('graduates-list');
    paginationInfo = document.getElementById('pagination-info');
    prevPageBtn = document.getElementById('prev-page');
    nextPageBtn = document.getElementById('next-page');
    
    // Filtros
    searchInput = document.getElementById('graduates-search');
    searchBtn = document.getElementById('search-graduates-btn');
    careerFilter = document.getElementById('filter-career-graduates');
    periodFilter = document.getElementById('filter-period-graduates');
    applyFiltersBtn = document.getElementById('apply-graduates-filters');
    
    if (!graduatesListElement || !paginationInfo) {
      console.error('[Graduates List Manager] No se encontraron elementos necesarios en el DOM');
      return;
    }
    
    // Crear modal para ver detalles de egresados
    createGraduateDetailsModal();
    
    // Configurar eventos
    searchBtn.addEventListener('click', () => {
      filterGraduates();
    });
    
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        filterGraduates();
      }
    });
    
    applyFiltersBtn.addEventListener('click', filterGraduates);
    
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderGraduatesList();
      }
    });
    
    nextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderGraduatesList();
      }
    });
    
    // Cargar datos iniciales
    await loadData();
    
    initialized = true;
    console.log('[Graduates List Manager] Inicializado correctamente');
  }
  
  /**
   * Carga los datos de egresados desde Firestore
   */
  async function loadData() {
    try {
      showLoading(true);
      
      const db = firebase.firestore();
      
      // Cargar lista de carreras
      const careersSnapshot = await db.collection('carreras').get();
      careers = careersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Cargar lista de periodos
      const periodsSnapshot = await db.collection('surveyPeriods').orderBy('startDate', 'desc').get();
      periods = periodsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Llenar selectores de filtros
      populateFilters();
      
      // Cargar egresados - optimizamos la carga para evitar bloqueo
      const usersSnapshot = await db.collection('usuarios')
        .where('rol', '==', 'egresado')
        .limit(50) // Limitamos a 50 registros para mejor rendimiento
        .get();
      
      // Procesamos de forma más eficiente sin cargar historial individual
      graduatesList = usersSnapshot.docs.map(doc => {
        const userData = doc.data();
        
        // Obtener carrera del usuario desde los datos ya cargados
        let careerName = 'No especificada';
        if (userData.carreraId) {
          const carrera = careers.find(c => c.id === userData.carreraId);
          if (carrera) {
            careerName = carrera.nombre;
          }
        }
        
        return {
          id: doc.id,
          nombre: userData.nombre || 'Sin nombre',
          apellidos: (userData.apellidoPaterno || '') + ' ' + (userData.apellidoMaterno || ''),
          email: userData.email || 'Sin correo',
          carrera: careerName,
          carreraId: userData.carreraId || null,
          lastSurveyDate: userData.ultimaEncuesta ? new Date(userData.ultimaEncuesta.seconds * 1000) : null,
          userData: userData
        };
      });
      
      // Aplicar filtros iniciales
      filteredGraduates = [...graduatesList];
      
      // Renderizar lista
      renderGraduatesList();
      
      console.log('[Graduates List Manager] Datos cargados correctamente:', graduatesList.length, 'egresados');
      
    } catch (error) {
      console.error('[Graduates List Manager] Error al cargar datos:', error);
      showError('Error al cargar la lista de egresados. Intente nuevamente.');
    } finally {
      showLoading(false);
    }
  }
  
  /**
   * Llena los selectores de filtros con datos
   */
  function populateFilters() {
    // Llenar selector de carreras
    careerFilter.innerHTML = '<option value="all">Todas las carreras</option>';
    careers.forEach(career => {
      const option = document.createElement('option');
      option.value = career.id;
      option.textContent = career.nombre;
      careerFilter.appendChild(option);
    });
    
    // Llenar selector de periodos
    periodFilter.innerHTML = '<option value="all">Todos los periodos</option>';
    periods.forEach(period => {
      const startDate = period.startDate.toDate ? period.startDate.toDate() : new Date(period.startDate.seconds * 1000);
      const option = document.createElement('option');
      option.value = period.id;
      option.textContent = period.name || formatDate(startDate);
      periodFilter.appendChild(option);
    });
  }
  
  /**
   * Filtra la lista de egresados según los criterios de búsqueda
   */
  function filterGraduates() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    const selectedCareer = careerFilter.value;
    const selectedPeriod = periodFilter.value;
    
    filteredGraduates = graduatesList.filter(graduate => {
      // Filtro de búsqueda por nombre o correo
      const matchesSearch = !searchQuery || 
        graduate.nombre.toLowerCase().includes(searchQuery) || 
        graduate.apellidos.toLowerCase().includes(searchQuery) || 
        graduate.email.toLowerCase().includes(searchQuery);
      
      // Filtro por carrera
      const matchesCareer = selectedCareer === 'all' || graduate.carreraId === selectedCareer;
      
      // Filtro por periodo - esto requeriría más datos y lógica adicional
      // Por ahora, no filtramos por periodo ya que necesitaríamos saber
      // en qué periodo completó la encuesta cada egresado
      const matchesPeriod = true; // selectedPeriod === 'all';
      
      return matchesSearch && matchesCareer && matchesPeriod;
    });
    
    // Resetear a primera página
    currentPage = 1;
    
    // Renderizar lista filtrada
    renderGraduatesList();
  }
  
  /**
   * Renderiza la lista de egresados en la tabla
   */
  function renderGraduatesList() {
    // Calcular páginas
    totalPages = Math.ceil(filteredGraduates.length / pageSize);
    
    // Actualizar información de paginación
    paginationInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
    
    // Actualizar estado de botones de paginación
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    
    // Obtener registros para la página actual
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentPageData = filteredGraduates.slice(startIndex, endIndex);
    
    // Limpiar lista
    graduatesListElement.innerHTML = '';
    
    if (currentPageData.length === 0) {
      // No hay datos
      const emptyRow = document.createElement('tr');
      emptyRow.className = 'empty-row';
      
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = 4;
      emptyCell.className = 'text-center';
      emptyCell.textContent = 'No se encontraron egresados con los criterios de búsqueda.';
      
      emptyRow.appendChild(emptyCell);
      graduatesListElement.appendChild(emptyRow);
      return;
    }
    
    // Crear filas para cada egresado
    currentPageData.forEach(graduate => {
      const row = document.createElement('tr');
      
      // Celda para nombre
      const nameCell = document.createElement('td');
      nameCell.textContent = `${graduate.nombre} ${graduate.apellidos}`.trim();
      row.appendChild(nameCell);
      
      // Celda para carrera
      const careerCell = document.createElement('td');
      careerCell.textContent = graduate.carrera;
      row.appendChild(careerCell);
      
      // Celda para correo
      const emailCell = document.createElement('td');
      emailCell.textContent = graduate.email;
      row.appendChild(emailCell);
      
      // Celda para acciones
      const actionsCell = document.createElement('td');
      
      const viewBtn = document.createElement('button');
      viewBtn.className = 'action-btn';
      viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
      viewBtn.title = 'Ver detalles';
      viewBtn.addEventListener('click', () => showGraduateDetails(graduate));
      
      actionsCell.appendChild(viewBtn);
      row.appendChild(actionsCell);
      
      // Añadir fila a la tabla
      graduatesListElement.appendChild(row);
    });
  }
  
  /**
   * Crea el modal para ver detalles de egresados
   */
  function createGraduateDetailsModal() {
    // Eliminar modal si ya existe
    const existingModal = document.getElementById('graduate-details-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Crear elemento del modal
    graduateDetailsModal = document.createElement('div');
    graduateDetailsModal.id = 'graduate-details-modal';
    graduateDetailsModal.className = 'graduate-details-modal';
    graduateDetailsModal.style.display = 'none'; // Inicialmente oculto
    
    // Contenido del modal
    graduateDetailsModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-user-graduate"></i> Detalles del Egresado</h3>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="graduate-info" id="graduate-info-container">
            <!-- La información del egresado se cargará aquí -->
          </div>
        </div>
        <div class="modal-footer">
          <button class="admin-btn admin-btn-secondary close-details-btn">Cerrar</button>
        </div>
      </div>
    `;
    
    // Estilos específicos inline para el modal
    graduateDetailsModal.style.position = 'fixed';
    graduateDetailsModal.style.top = '0';
    graduateDetailsModal.style.left = '0';
    graduateDetailsModal.style.width = '100%';
    graduateDetailsModal.style.height = '100%';
    graduateDetailsModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    graduateDetailsModal.style.zIndex = '1000';
    graduateDetailsModal.style.display = 'flex';
    graduateDetailsModal.style.justifyContent = 'center';
    graduateDetailsModal.style.alignItems = 'center';
    
    // Estilos para el contenido del modal
    const modalContent = graduateDetailsModal.querySelector('.modal-content');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.borderRadius = '8px';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '800px';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflowY = 'auto';
    modalContent.style.position = 'relative';
    
    // Estilos para el encabezado
    const modalHeader = graduateDetailsModal.querySelector('.modal-header');
    modalHeader.style.display = 'flex';
    modalHeader.style.justifyContent = 'space-between';
    modalHeader.style.alignItems = 'center';
    modalHeader.style.padding = '15px 20px';
    modalHeader.style.borderBottom = '1px solid #ddd';
    
    // Estilos para el cuerpo
    const modalBody = graduateDetailsModal.querySelector('.modal-body');
    modalBody.style.padding = '20px';
    
    // Estilos para el pie
    const modalFooter = graduateDetailsModal.querySelector('.modal-footer');
    modalFooter.style.padding = '15px 20px';
    modalFooter.style.borderTop = '1px solid #ddd';
    modalFooter.style.textAlign = 'right';
    
    // Estilos para el botón de cierre
    const closeBtn = graduateDetailsModal.querySelector('.close-modal');
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#555';
    
    // Agregar modal al DOM
    document.body.appendChild(graduateDetailsModal);
    
    // Configurar eventos del modal
    closeBtn.addEventListener('click', hideGraduateDetails);
    const closeDetailsBtn = graduateDetailsModal.querySelector('.close-details-btn');
    closeDetailsBtn.addEventListener('click', hideGraduateDetails);
    
    // Cerrar al hacer clic fuera del contenido
    graduateDetailsModal.addEventListener('click', e => {
      if (e.target === graduateDetailsModal) {
        hideGraduateDetails();
      }
    });
  }
  
  /**
   * Muestra los detalles de un egresado en el modal
   */
  function showGraduateDetails(graduate) {
    console.log('[Graduates List Manager] Mostrando detalles del egresado:', graduate);
    
    // Asegurar que el modal existe
    if (!graduateDetailsModal) {
      console.error('[Graduates List Manager] El modal no está inicializado');
      createGraduateDetailsModal();
    }
    
    const infoContainer = document.getElementById('graduate-info-container');
    if (!infoContainer) {
      console.error('[Graduates List Manager] No se encontró el contenedor de información');
      return;
    }
    
    infoContainer.innerHTML = '';
    
    // Datos básicos que se ven en la imagen compartida
    const userData = graduate.userData || {};
    
    const detailsHTML = `
      <div class="info-section">
        <h4>Información del Egresado</h4>
        <div class="graduate-info">
          <div class="info-group">
            <div class="info-label">Nombre</div>
            <div class="info-value">${userData.nombre || 'No especificado'}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Apellido Paterno</div>
            <div class="info-value">${userData.apellidoPaterno || 'No especificado'}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Apellido Materno</div>
            <div class="info-value">${userData.apellidoMaterno || 'No especificado'}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Carrera Asignada</div>
            <div class="info-value">${userData.carreraAsignada || 'No especificada'}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Email</div>
            <div class="info-value">${userData.email || 'No especificado'}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Encuesta Completada</div>
            <div class="info-value">${userData.encuestaCompletada ? 'Sí' : 'No'}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Fecha Última Actualización</div>
            <div class="info-value">${userData.fechaUltimaActualizacionPerfil || 'No disponible'}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Rol</div>
            <div class="info-value">${userData.rol || 'No especificado'}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Última Fecha Completada</div>
            <div class="info-value">${userData.ultimaFechaCompletada || 'No disponible'}</div>
          </div>
          <div class="info-group">
            <div class="info-label">User ID</div>
            <div class="info-value">${userData.userId || graduate.id || 'No especificado'}</div>
          </div>
        </div>
      </div>
    `;
    
    infoContainer.innerHTML = detailsHTML;
    
    // Mostrar el modal
    graduateDetailsModal.style.display = 'flex';
    console.log('[Graduates List Manager] Modal mostrado');
  }
  
  /**
   * Oculta el modal de detalles
   */
  function hideGraduateDetails() {
    if (graduateDetailsModal) {
      graduateDetailsModal.style.display = 'none';
    }
  }
  
  /**
   * Muestra u oculta el indicador de carga
   */
  function showLoading(show) {
    // Eliminar filas existentes
    const existingLoadingRow = graduatesListElement.querySelector('.loading-row');
    if (existingLoadingRow) {
      existingLoadingRow.remove();
    }
    
    if (show) {
      // Crear fila de carga
      const loadingRow = document.createElement('tr');
      loadingRow.className = 'loading-row';
      
      const loadingCell = document.createElement('td');
      loadingCell.colSpan = 4;
      loadingCell.className = 'text-center';
      
      const spinner = document.createElement('div');
      spinner.className = 'spinner-container';
      spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando egresados...';
      
      loadingCell.appendChild(spinner);
      loadingRow.appendChild(loadingCell);
      graduatesListElement.appendChild(loadingRow);
    }
  }
  
  /**
   * Muestra un mensaje de error
   */
  function showError(message) {
    // Eliminar filas existentes
    graduatesListElement.innerHTML = '';
    
    // Crear fila de error
    const errorRow = document.createElement('tr');
    errorRow.className = 'error-row';
    
    const errorCell = document.createElement('td');
    errorCell.colSpan = 4;
    errorCell.className = 'text-center';
    errorCell.textContent = message;
    
    errorRow.appendChild(errorCell);
    graduatesListElement.appendChild(errorRow);
  }
  
  /**
   * Formatea una fecha para mostrar
   */
  function formatDate(date) {
    if (!date) return 'N/A';
    
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Exponer funciones públicas
  return {
    init,
    loadData
  };
})();

// Inicializar automáticamente cuando el módulo esté listo
// Exponemos una función global que puede ser llamada desde level1-dashboard.js
window.initGraduatesListManager = function() {
  console.log('[Graduates List Manager] Inicialización global solicitada');
  if (window.GraduatesListManager) {
    window.GraduatesListManager.init();
  }
};

// Auto-inicialización cuando se carga el DOM completamente
document.addEventListener('DOMContentLoaded', function() {
  console.log('[Graduates List Manager] Evento DOMContentLoaded detectado');
  // Permitir que la inicialización del panel principal tenga prioridad
  setTimeout(function() {
    if (window.GraduatesListManager) {
      console.log('[Graduates List Manager] Auto-inicializando...');
      window.GraduatesListManager.init();
    }
  }, 1000);
});

// Registrar cuando el script se ha cargado completamente
console.log('[Graduates List Manager] Script cargado');
