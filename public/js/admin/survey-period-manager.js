/**
 * survey-period-manager.js
 * Gestión de periodos de apertura y cierre de encuestas
 */

window.SurveyPeriodManager = (function() {
  // Variables privadas
  let initialized = false;
  let currentPeriodData = null;
  
  // Referencias a elementos del DOM
  let periodStatusElement;
  let periodDetailsElement;
  let manageButton;
  
  // Modal y formulario
  let periodModal;
  let periodForm;
  
  /**
   * Inicialización del gestor de periodos
   */
  async function init() {
    if (initialized) return;
    
    console.log('[Survey Period Manager] Inicializando...');
    
    // Obtener referencias a elementos del DOM
    periodStatusElement = document.getElementById('survey-period-status');
    periodDetailsElement = document.getElementById('survey-period-details');
    manageButton = document.getElementById('manage-survey-period');
    
    if (!periodStatusElement || !periodDetailsElement || !manageButton) {
      console.error('[Survey Period Manager] No se encontraron elementos necesarios en el DOM');
      return;
    }
    
    // Crear modal para gestión de periodos
    createPeriodModal();
    
    // Configurar eventos
    manageButton.addEventListener('click', openPeriodModal);
    
    // Cargar datos actuales
    await loadCurrentPeriod();
    
    initialized = true;
    console.log('[Survey Period Manager] Inicializado correctamente');
  }
  
  /**
   * Crea el modal para gestión de periodos
   */
  function createPeriodModal() {
    // Crear elemento del modal
    periodModal = document.createElement('div');
    periodModal.id = 'period-modal';
    periodModal.className = 'admin-modal';
    periodModal.style.display = 'none';
    
    // Contenido del modal - Con una estructura mejorada para los márgenes
    periodModal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h2><i class="fas fa-calendar-alt"></i> Gestionar Periodo de Encuestas</h2>
          <span class="admin-modal-close">&times;</span>
        </div>
        <div class="admin-modal-body">
          <form id="period-form">
            <div class="form-group">
              <label for="period-start-date">Fecha de inicio:</label>
              <div class="date-input-container">
                <input type="date" id="period-start-date" required>
              </div>
              <div class="form-help">La fecha de inicio debe ser hoy o una fecha futura</div>
            </div>
            <div class="form-group">
              <label for="period-end-date">Fecha de fin:</label>
              <div class="date-input-container">
                <input type="date" id="period-end-date" required>
              </div>
              <div class="form-help">La fecha de fin debe ser posterior a la fecha de inicio</div>
            </div>
            <div class="form-group">
              <label for="period-name">Nombre del periodo:</label>
              <div class="input-container">
                <input type="text" id="period-name" placeholder="Ej. Semestre Primavera 2025" required>
              </div>
            </div>
            <div class="form-message" id="period-message"></div>
            <div class="form-actions">
              <button type="button" class="admin-btn admin-btn-secondary" id="close-period-btn">Cancelar</button>
              <button type="submit" class="admin-btn admin-btn-primary">Guardar Periodo</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Agregar modal al DOM
    document.body.appendChild(periodModal);
    
    // Configurar eventos del modal
    const closeBtn = periodModal.querySelector('.admin-modal-close');
    const cancelBtn = periodModal.querySelector('#close-period-btn');
    periodForm = periodModal.querySelector('#period-form');
    
    closeBtn.addEventListener('click', closePeriodModal);
    cancelBtn.addEventListener('click', closePeriodModal);
    periodForm.addEventListener('submit', savePeriod);
    
    // Validación de fechas en tiempo real
    const startDateInput = periodForm.querySelector('#period-start-date');
    const endDateInput = periodForm.querySelector('#period-end-date');
    
    startDateInput.addEventListener('change', validateDates);
    endDateInput.addEventListener('change', validateDates);
  }
  
  /**
   * Abre el modal de gestión de periodos
   */
  function openPeriodModal() {
    if (!periodModal) return;
    
    // Establecer valores actuales si existe un periodo
    if (currentPeriodData) {
      const startDate = new Date(currentPeriodData.startDate.seconds * 1000);
      const endDate = new Date(currentPeriodData.endDate.seconds * 1000);
      
      periodForm.querySelector('#period-start-date').value = formatDateForInput(startDate);
      periodForm.querySelector('#period-end-date').value = formatDateForInput(endDate);
      periodForm.querySelector('#period-name').value = currentPeriodData.name;
    } else {
      // Valores por defecto: fecha de hoy y un mes después
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      periodForm.querySelector('#period-start-date').value = formatDateForInput(today);
      periodForm.querySelector('#period-end-date').value = formatDateForInput(nextMonth);
      periodForm.querySelector('#period-name').value = '';
    }
    
    // Mostrar modal
    periodModal.style.display = 'block';
  }
  
  /**
   * Cierra el modal de gestión de periodos
   */
  function closePeriodModal() {
    if (!periodModal) return;
    periodModal.style.display = 'none';
    
    // Limpiar mensaje
    const messageEl = periodForm.querySelector('#period-message');
    messageEl.textContent = '';
    messageEl.className = 'form-message';
  }
  
  /**
   * Valida las fechas de inicio y fin
   */
  function validateDates() {
    const startDateInput = periodForm.querySelector('#period-start-date');
    const endDateInput = periodForm.querySelector('#period-end-date');
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a inicio del día
    
    let isValid = true;
    
    // Validar fecha de inicio
    if (startDate < today) {
      startDateInput.setCustomValidity('La fecha de inicio debe ser hoy o una fecha futura');
      isValid = false;
    } else {
      startDateInput.setCustomValidity('');
    }
    
    // Validar fecha de fin
    if (endDate <= startDate) {
      endDateInput.setCustomValidity('La fecha de fin debe ser posterior a la fecha de inicio');
      isValid = false;
    } else {
      endDateInput.setCustomValidity('');
    }
    
    return isValid;
  }
  
  /**
   * Guarda el nuevo periodo de encuestas
   */
  async function savePeriod(event) {
    event.preventDefault();
    
    if (!validateDates()) {
      return;
    }
    
    const messageEl = periodForm.querySelector('#period-message');
    messageEl.textContent = 'Guardando...';
    messageEl.className = 'form-message info';
    
    try {
      const startDateInput = periodForm.querySelector('#period-start-date');
      const endDateInput = periodForm.querySelector('#period-end-date');
      const nameInput = periodForm.querySelector('#period-name');
      
      const startDate = new Date(startDateInput.value);
      const endDate = new Date(endDateInput.value);
      const name = nameInput.value.trim();
      
      // Guardar en Firestore
      const db = firebase.firestore();
      const periodData = {
        startDate: firebase.firestore.Timestamp.fromDate(startDate),
        endDate: firebase.firestore.Timestamp.fromDate(endDate),
        name,
        active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Primero desactivamos cualquier periodo activo
      const activePeriodsSnapshot = await db.collection('surveyPeriods')
        .where('active', '==', true)
        .get();
      
      const batch = db.batch();
      activePeriodsSnapshot.forEach(doc => {
        batch.update(doc.ref, { active: false });
      });
      
      // Crear nuevo periodo
      const newPeriodRef = db.collection('surveyPeriods').doc();
      batch.set(newPeriodRef, periodData);
      
      await batch.commit();
      
      // Actualizar datos locales
      currentPeriodData = {
        id: newPeriodRef.id,
        ...periodData
      };
      
      updatePeriodUI();
      
      messageEl.textContent = '¡Periodo guardado correctamente!';
      messageEl.className = 'form-message success';
      
      // Cerrar modal después de un tiempo
      setTimeout(closePeriodModal, 1500);
      
    } catch (error) {
      console.error('[Survey Period Manager] Error al guardar periodo:', error);
      messageEl.textContent = `Error: ${error.message}`;
      messageEl.className = 'form-message error';
    }
  }
  
  /**
   * Carga el periodo actual desde Firestore
   */
  async function loadCurrentPeriod() {
    try {
      const db = firebase.firestore();
      const periodSnapshot = await db.collection('surveyPeriods')
        .where('active', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (periodSnapshot.empty) {
        console.log('[Survey Period Manager] No hay periodos activos');
        currentPeriodData = null;
      } else {
        const periodDoc = periodSnapshot.docs[0];
        currentPeriodData = {
          id: periodDoc.id,
          ...periodDoc.data()
        };
        console.log('[Survey Period Manager] Periodo cargado:', currentPeriodData);
      }
      
      updatePeriodUI();
      
    } catch (error) {
      console.error('[Survey Period Manager] Error al cargar periodo:', error);
    }
  }
  
  /**
   * Actualiza la interfaz con los datos del periodo actual
   */
  function updatePeriodUI() {
    if (!periodStatusElement || !periodDetailsElement) return;
    
    if (!currentPeriodData) {
      // No hay periodo configurado
      periodStatusElement.textContent = 'Cerrada';
      periodStatusElement.className = 'survey-status status-closed';
      periodDetailsElement.textContent = 'No configurado';
      return;
    }
    
    // Comprobar si el periodo está activo según las fechas
    const now = new Date();
    const startDate = new Date(currentPeriodData.startDate.seconds * 1000);
    const endDate = new Date(currentPeriodData.endDate.seconds * 1000);
    
    const isActive = now >= startDate && now <= endDate;
    
    // Actualizar estado
    if (isActive) {
      periodStatusElement.textContent = 'Abierta';
      periodStatusElement.className = 'survey-status status-open';
    } else if (now < startDate) {
      periodStatusElement.textContent = 'Pendiente';
      periodStatusElement.className = 'survey-status status-closed';
    } else {
      periodStatusElement.textContent = 'Finalizada';
      periodStatusElement.className = 'survey-status status-closed';
    }
    
    // Actualizar detalles
    periodDetailsElement.textContent = `${formatDate(startDate)} - ${formatDate(endDate)} (${currentPeriodData.name})`;
  }
  
  /**
   * Verifica si la encuesta está abierta actualmente
   * Esta función puede ser llamada desde otros módulos
   */
  function isSurveyOpen() {
    if (!currentPeriodData) return false;
    
    const now = new Date();
    const startDate = new Date(currentPeriodData.startDate.seconds * 1000);
    const endDate = new Date(currentPeriodData.endDate.seconds * 1000);
    
    return now >= startDate && now <= endDate;
  }
  
  /**
   * Formatea una fecha para mostrar en la UI
   */
  function formatDate(date) {
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  /**
   * Formatea una fecha para inputs date (YYYY-MM-DD)
   */
  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Actualiza automáticamente el estado de la encuesta
   * cada minuto para reflejar cambios sin recargar
   */
  function startAutoUpdate() {
    setInterval(updatePeriodUI, 60000); // Cada minuto
  }
  
  // Exponer funciones públicas
  return {
    init,
    isSurveyOpen,
    loadCurrentPeriod
  };
})();

// Los estilos ahora están en el archivo survey-period-manager.css
