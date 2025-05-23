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
  
  // Variable para controlar si se muestra mensaje de carga de librería
  let shownXlsxWarning = false;
  
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
    exportExcelBtn = document.getElementById('export-excel-graduates');
    
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
    
    // El modal se creará la primera vez que se necesite
    // (cuando el usuario haga clic en "Ver detalles")
    console.log('[Graduates List Manager] El modal se creará cuando sea necesario');
    
    // Verificar si la librería xlsx está disponible
    if (exportExcelBtn && typeof XLSX === 'undefined' && !shownXlsxWarning) {
      console.warn('[Graduates List Manager] La librería SheetJS (xlsx) no está cargada. El botón de exportar a Excel no funcionará correctamente.');
      exportExcelBtn.setAttribute('disabled', 'disabled');
      exportExcelBtn.title = 'La librería de Excel no está disponible';
      shownXlsxWarning = true;
    }
    
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
  
  // Evento para exportar a Excel
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', exportToExcel);
  }
  
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
      console.log('[Graduates List Manager] Periodos encontrados:', periodsSnapshot.size);
      
      periods = periodsSnapshot.docs.map(doc => {
        const periodData = doc.data();
        console.log('[Graduates List Manager] Periodo:', doc.id, periodData.name || 'Sin nombre');
        return {
          id: doc.id,
          ...periodData
        };
      });
      
      // Llenar selectores de filtros
      populateFilters();
      
      // Cargar egresados - optimizamos la carga para evitar bloqueo
      const usersSnapshot = await db.collection('usuarios')
        .where('rol', '==', 'egresado')
        .limit(50) // Limitamos a 50 registros para mejor rendimiento
        .get();
      
      // Crear una lista para almacenar las promesas de carga de historial
      const historialPromises = [];
      
      // Procesamos los datos básicos de los egresados
      graduatesList = await Promise.all(usersSnapshot.docs.map(async doc => {
        const userData = doc.data();
        
        // Obtener carrera del usuario desde los datos ya cargados
        let careerName = 'No especificada';
        if (userData.carrera) {
          // La carrera puede ser directamente el nombre
          careerName = userData.carrera;
        }
        
        // Cargar historial de encuestas para este usuario
        let historialEncuestas = [];
        try {
          const historialSnapshot = await db.collection('usuarios').doc(doc.id)
            .collection('historialEncuestas')
            .get();
            
          if (!historialSnapshot.empty) {
            historialEncuestas = historialSnapshot.docs.map(encuestaDoc => ({
              id: encuestaDoc.id,
              periodoId: encuestaDoc.data().periodoId || '',
              periodoNombre: encuestaDoc.data().periodoNombre || '',
              fechaCompletado: encuestaDoc.data().fechaCompletado
            }));
            console.log(`[Graduates List Manager] Cargadas ${historialEncuestas.length} encuestas para ${userData.nombre || 'usuario'}`);
          }
        } catch (error) {
          console.error(`[Graduates List Manager] Error al cargar historial para ${doc.id}:`, error);
        }
        
        // Agregar los datos del usuario incluyendo su historial
        return {
          id: doc.id,
          nombre: userData.nombre || 'Sin nombre',
          apellidos: (userData.apellidoPaterno || '') + ' ' + (userData.apellidoMaterno || ''),
          email: userData.email || 'Sin correo',
          carrera: careerName,
          carreraId: userData.carrera || null, // Usamos carrera en lugar de carreraId
          lastSurveyDate: userData.ultimaEncuesta ? new Date(userData.ultimaEncuesta.seconds * 1000) : null,
          userData: { ...userData, historialEncuestas } // Agregamos el historial a los datos del usuario
        };
      }));
      
      console.log('[Graduates List Manager] Graduados con historial cargados:', graduatesList.length);
      
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
      option.value = career.nombre; // Usamos el nombre como valor, no el ID
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
    
    console.log('[Debug] Filtro de carrera seleccionado:', selectedCareer);
    
    // Depurar los primeros 5 egresados para verificar sus valores de carrera
    if (selectedCareer !== 'all') {
      console.log('[Debug] Verificando valores de carrera de los primeros 5 egresados:');
      graduatesList.slice(0, 5).forEach((g, i) => {
        console.log(`Egresado ${i+1}: nombre=${g.nombre}, carrera=${g.carrera}`);
      });
    }
    
    filteredGraduates = graduatesList.filter(graduate => {
      // Filtro de búsqueda por nombre o correo
      const matchesSearch = !searchQuery || 
        graduate.nombre.toLowerCase().includes(searchQuery) || 
        graduate.apellidos.toLowerCase().includes(searchQuery) || 
        graduate.email.toLowerCase().includes(searchQuery);
      
      // Filtro por carrera
      const matchesCareer = selectedCareer === 'all' || graduate.carrera === selectedCareer;
      
      // Depurar cada resultado de comparación si se está filtrando por carrera
      if (selectedCareer !== 'all' && graduate.nombre.includes('Ana')) {
        console.log(`Comparando: "${graduate.carrera}" === "${selectedCareer}" = ${graduate.carrera === selectedCareer}`);
      }
      
      // Filtro por periodo - verificamos la encuesta completada en ese periodo
      let matchesPeriod = selectedPeriod === 'all';
  
      // Si se seleccionó un periodo específico, verificamos si el egresado contestó en ese periodo
      if (!matchesPeriod && graduate.userData && graduate.userData.historialEncuestas) {
        // Si tenemos historial de encuestas precargado, buscamos la del periodo seleccionado
        const encuestaEnPeriodo = graduate.userData.historialEncuestas.find(encuesta => 
          encuesta.periodoId === selectedPeriod
        );
        matchesPeriod = !!encuestaEnPeriodo;
      }
      
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
    console.log('Creando modal de detalles de egresados');
    
    // Eliminar modal si ya existe
    const existingModal = document.getElementById('graduate-details-modal');
    if (existingModal) {
      console.log('Modal existente encontrado, eliminando...');
      existingModal.remove();
    }
    
    // Crear elemento del modal directamente
    const modalElement = document.createElement('div');
    modalElement.id = 'graduate-details-modal';
    
    // Asignamos estilos directamente al elemento
    Object.assign(modalElement.style, {
      display: 'none', // Importante: inicialmente oculto
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: '9999',
      overflow: 'auto'
    });
    
    // Contenido HTML interno
    modalElement.innerHTML = `
      <div class="modal-content" style="
        background-color: #fff;
        border-radius: 8px;
        width: 90%;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        margin: 50px auto;
      ">
        <div class="modal-header" style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #ddd;
          background-color: #f8f9fa;
        ">
          <h3 style="margin: 0; font-size: 1.2rem;"><i class="fas fa-user-graduate"></i> Detalles del Egresado</h3>
          <button class="close-modal" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #555;
          ">&times;</button>
        </div>
        <div class="modal-body" style="padding: 20px;">
          <div class="graduate-info" id="graduate-info-container">
            <!-- La información del egresado se cargará aquí -->
          </div>
        </div>
        <div class="modal-footer" style="
          padding: 15px 20px;
          border-top: 1px solid #ddd;
          text-align: right;
          background-color: #f8f9fa;
        ">
          <button class="admin-btn admin-btn-secondary close-details-btn" style="
            padding: 8px 16px;
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">Cerrar</button>
        </div>
      </div>
    `;
    
    // Añadir al DOM
    document.body.appendChild(modalElement);
    
    // Guardar referencia al modal
    graduateDetailsModal = modalElement;
    
    console.log('Modal creado, estado inicial:', getComputedStyle(graduateDetailsModal).display);
    
    // Configurar eventos del modal
    const closeBtn = graduateDetailsModal.querySelector('.close-modal');
    const closeDetailsBtn = graduateDetailsModal.querySelector('.close-details-btn');
    
    closeBtn.addEventListener('click', hideGraduateDetails);
    closeDetailsBtn.addEventListener('click', hideGraduateDetails);
    
    // Cerrar al hacer clic fuera del contenido
    graduateDetailsModal.addEventListener('click', e => {
      if (e.target === graduateDetailsModal) {
        hideGraduateDetails();
      }
    });
    
    console.log('Eventos del modal configurados');
  }
  
  /**
   * Muestra los detalles de un egresado en el modal
   */
  function showGraduateDetails(graduate) {
    console.log('[Graduates List Manager] Mostrando detalles del egresado:', graduate);
    
    // Si no existe el modal, crearlo
    if (!graduateDetailsModal || !document.getElementById('graduate-details-modal')) {
      console.log('[Graduates List Manager] Modal no encontrado, creándolo nuevamente...');
      createGraduateDetailsModal();
    }
    
    if (!graduateDetailsModal) {
      console.error('[Graduates List Manager] No se pudo crear el modal');
      alert('Error: No se pudo mostrar los detalles del egresado.');
      return;
    }
    
    const infoContainer = graduateDetailsModal.querySelector('#graduate-info-container');
    if (!infoContainer) {
      console.error('[Graduates List Manager] No se encontró el contenedor de información');
      return;
    }
    
    // Limpiar el contenedor
    infoContainer.innerHTML = '';
    
    // Datos básicos del egresado
    const userData = graduate.userData || {};
    
    // Crear el contenido del modal
    const detailsHTML = `
      <div class="info-section">
        <h4 style="margin-top: 0; margin-bottom: 15px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px;">Información del Egresado</h4>
        <div class="graduate-info">
          <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap;">
            <div style="font-weight: bold; width: 200px; color: #555; margin-right: 10px;">Nombre</div>
            <div style="flex: 1; min-width: 200px;">${userData.nombre || graduate.nombre || 'No especificado'}</div>
          </div>
          <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap;">
            <div style="font-weight: bold; width: 200px; color: #555; margin-right: 10px;">Apellido Paterno</div>
            <div style="flex: 1; min-width: 200px;">${userData.apellidoPaterno || 'No especificado'}</div>
          </div>
          <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap;">
            <div style="font-weight: bold; width: 200px; color: #555; margin-right: 10px;">Apellido Materno</div>
            <div style="flex: 1; min-width: 200px;">${userData.apellidoMaterno || 'No especificado'}</div>
          </div>
          <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap;">
            <div style="font-weight: bold; width: 200px; color: #555; margin-right: 10px;">Carrera Asignada</div>
            <div style="flex: 1; min-width: 200px;">${userData.carreraAsignada || graduate.carrera || 'No especificada'}</div>
          </div>
          <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap;">
            <div style="font-weight: bold; width: 200px; color: #555; margin-right: 10px;">Email</div>
            <div style="flex: 1; min-width: 200px;">${userData.email || graduate.email || 'No especificado'}</div>
          </div>
          <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap;">
            <div style="font-weight: bold; width: 200px; color: #555; margin-right: 10px;">Encuesta Completada</div>
            <div style="flex: 1; min-width: 200px;">${userData.encuestaCompletada ? 'Sí' : 'No'}</div>
          </div>
          <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap;">
            <div style="font-weight: bold; width: 200px; color: #555; margin-right: 10px;">Fecha Última Actualización</div>
            <div style="flex: 1; min-width: 200px;">${userData.fechaUltimaActualizacionPerfil || 'No disponible'}</div>
          </div>
          <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap;">
            <div style="font-weight: bold; width: 200px; color: #555; margin-right: 10px;">Rol</div>
            <div style="flex: 1; min-width: 200px;">${userData.rol || 'No especificado'}</div>
          </div>
          <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap;">
            <div style="font-weight: bold; width: 200px; color: #555; margin-right: 10px;">Última Fecha Completada</div>
            <div style="flex: 1; min-width: 200px;">${userData.ultimaFechaCompletada || 'No disponible'}</div>
          </div>
          <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap;">
            <div style="font-weight: bold; width: 200px; color: #555; margin-right: 10px;">User ID</div>
            <div style="flex: 1; min-width: 200px;">${userData.userId || graduate.id || 'No especificado'}</div>
          </div>
        </div>
      </div>
    `;
    
    // Asignar el contenido
    infoContainer.innerHTML = detailsHTML;
    
    // Hacer visible el modal
    graduateDetailsModal.style.display = 'block';
    
    // Darle tiempo para que se renderice y luego cambiar a flex para centrar el contenido
    setTimeout(() => {
      console.log('[Graduates List Manager] Configurando modal como visible');
      Object.assign(graduateDetailsModal.style, {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      });
    }, 50);
  }
  
  /**
   * Oculta el modal de detalles
   */
  function hideGraduateDetails() {
    if (graduateDetailsModal) {
      graduateDetailsModal.style.display = 'none';
      console.log('[Graduates List Manager] Modal oculto');
    } else {
      console.warn('[Graduates List Manager] No se pudo ocultar el modal porque no existe');
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
  /**
   * Exporta los datos de egresados a Excel según los filtros aplicados actualmente
   * Solo exporta los egresados que coinciden con los criterios de filtro
   */
  async function exportToExcel() {
    try {
      // Verificar si la librería y el servicio están disponibles
      if (typeof XLSX === 'undefined') {
        alert('Error: La librería para exportar a Excel no está disponible');
        return;
      }
      
      if (typeof window.ExcelExportService === 'undefined') {
        alert('Error: El servicio de exportación a Excel no está disponible');
        return;
      }
      
      // Verificar si hay egresados filtrados para exportar
      if (filteredGraduates.length === 0) {
        alert('No hay egresados que coincidan con los criterios de búsqueda para exportar');
        return;
      }
      
      // Mostrar indicador de carga
      showLoading(true);
      
      console.log(`[Graduates List Manager] Exportando ${filteredGraduates.length} egresados filtrados`);
      
      // Obtener el periodo seleccionado
      const selectedPeriod = periodFilter.value;
      let success;
      
      // Obtener IDs de egresados filtrados para limitar la exportación
      const filteredGraduateIds = filteredGraduates.map(grad => grad.id);
      
      if (selectedPeriod === 'all') {
        console.log('[Graduates List Manager] Exportando la última encuesta de los egresados filtrados');
        // Exportar la última encuesta de cada egresado filtrado
        success = await window.ExcelExportService.exportarUltimasEncuestas(filteredGraduateIds);
      } else {
        // Buscar el nombre del periodo seleccionado
        const selectedPeriodObj = periods.find(p => p.id === selectedPeriod);
        const periodoNombre = selectedPeriodObj ? 
          (selectedPeriodObj.name || 'Periodo_' + selectedPeriod) : 
          'Periodo_' + selectedPeriod;
        
        console.log(`[Graduates List Manager] Exportando encuestas del periodo: ${periodoNombre} para ${filteredGraduateIds.length} egresados filtrados`);
        
        // Exportar encuestas del período seleccionado solo para los egresados filtrados
        success = await window.ExcelExportService.exportarEncuestasPorPeriodo(selectedPeriod, filteredGraduateIds);
      }
      
      if (success) {
        console.log('[Graduates List Manager] Exportación completada con éxito');
      } else {
        console.error('[Graduates List Manager] Error en la exportación');
      }
    } catch (error) {
      console.error('[Graduates List Manager] Error al exportar a Excel:', error);
      alert(`Error al exportar a Excel: ${error.message}`);
    } finally {
      showLoading(false);
    }
  }
  
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
