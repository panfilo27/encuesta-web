/**
 * survey-period-manager.js
 * Gestión de periodos de apertura y cierre de encuestas
 * Incluye soporte para especificar fechas con horas
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
    
    // Contenido del modal - Ahora con campos para fecha y hora
    periodModal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h2><i class="fas fa-calendar-alt"></i> Gestionar Periodo de Encuestas</h2>
          <span class="admin-modal-close">&times;</span>
        </div>
        <div class="admin-modal-body">
          <form id="period-form">
            <div class="form-group">
              <label for="period-start-date">Fecha y hora de inicio:</label>
              <div class="datetime-input-container">
                <input type="date" id="period-start-date" required>
                <input type="time" id="period-start-time" required>
              </div>
              <div class="form-help">La fecha y hora de inicio debe ser posterior a la actual</div>
            </div>
            <div class="form-group">
              <label for="period-end-date">Fecha y hora de fin:</label>
              <div class="datetime-input-container">
                <input type="date" id="period-end-date" required>
                <input type="time" id="period-end-time" required>
              </div>
              <div class="form-help">La fecha y hora de fin debe ser posterior a la de inicio</div>
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
    
    // Añadir estilos adicionales para los inputs de fecha y hora
    const style = document.createElement('style');
    style.textContent = `
      .datetime-input-container {
        display: flex;
        gap: 10px;
      }
      .datetime-input-container input[type="date"] {
        flex: 2;
      }
      .datetime-input-container input[type="time"] {
        flex: 1;
      }
    `;
    document.head.appendChild(style);
    
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
    const startTimeInput = periodForm.querySelector('#period-start-time');
    const endTimeInput = periodForm.querySelector('#period-end-time');
    
    startDateInput.addEventListener('change', validateDates);
    endDateInput.addEventListener('change', validateDates);
    startTimeInput.addEventListener('change', validateDates);
    endTimeInput.addEventListener('change', validateDates);
  }
  
  /**
   * Abre el modal de gestión de periodos
   */
  function openPeriodModal() {
    // Restablecer formulario
    periodForm.reset();
    const messageEl = document.getElementById('period-message');
    messageEl.textContent = '';
    messageEl.className = 'form-message';
    
    // Establecer fecha y hora de inicio por defecto (ahora)
    const now = new Date();
    const startDateInput = document.getElementById('period-start-date');
    const startTimeInput = document.getElementById('period-start-time');
    
    startDateInput.value = formatDateForInput(now);
    startTimeInput.value = formatTimeForInput(now);
    
    // Establecer fecha y hora de fin por defecto (30 días después, misma hora)
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 30);
    
    const endDateInput = document.getElementById('period-end-date');
    const endTimeInput = document.getElementById('period-end-time');
    
    endDateInput.value = formatDateForInput(endDate);
    endTimeInput.value = formatTimeForInput(now);
    
    // Si hay un periodo activo, prellenar con esos datos
    if (currentPeriodData) {
      const startDate = new Date(currentPeriodData.startDate.seconds * 1000);
      const endDate = new Date(currentPeriodData.endDate.seconds * 1000);
      
      startDateInput.value = formatDateForInput(startDate);
      startTimeInput.value = formatTimeForInput(startDate);
      
      endDateInput.value = formatDateForInput(endDate);
      endTimeInput.value = formatTimeForInput(endDate);
      
      document.getElementById('period-name').value = currentPeriodData.name || '';
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
   * Valida las fechas y horas de inicio y fin
   */
  function validateDates() {
    const startDateInput = periodForm.querySelector('#period-start-date');
    const endDateInput = periodForm.querySelector('#period-end-date');
    const startTimeInput = periodForm.querySelector('#period-start-time');
    const endTimeInput = periodForm.querySelector('#period-end-time');
    
    // Combinar fecha y hora para crear objetos de fecha completos
    const startDateStr = startDateInput.value;
    const startTimeStr = startTimeInput.value || '00:00';
    const endDateStr = endDateInput.value;
    const endTimeStr = endTimeInput.value || '23:59';
    
    const startDate = new Date(`${startDateStr}T${startTimeStr}:00`);
    const endDate = new Date(`${endDateStr}T${endTimeStr}:00`);
    const now = new Date();
    
    // Validar fecha y hora de inicio
    if (startDate < now) {
      startDateInput.setCustomValidity('La fecha y hora de inicio debe ser posterior a la actual');
      startTimeInput.setCustomValidity('La fecha y hora de inicio debe ser posterior a la actual');
    } else {
      startDateInput.setCustomValidity('');
      startTimeInput.setCustomValidity('');
    }
    
    // Validar fecha y hora de fin
    if (endDate <= startDate) {
      endDateInput.setCustomValidity('La fecha y hora de fin debe ser posterior a la de inicio');
      endTimeInput.setCustomValidity('La fecha y hora de fin debe ser posterior a la de inicio');
    } else {
      endDateInput.setCustomValidity('');
      endTimeInput.setCustomValidity('');
    }
    
    // Reportar validación al formulario
    if (document.activeElement === startDateInput || document.activeElement === startTimeInput) {
      startDateInput.reportValidity();
    } else if (document.activeElement === endDateInput || document.activeElement === endTimeInput) {
      endDateInput.reportValidity();
    }
  }
  
  /**
   * Guarda el nuevo periodo de encuestas
   */
  async function savePeriod(event) {
    event.preventDefault();
    
    // Obtener valores del formulario
    const startDateInput = periodForm.querySelector('#period-start-date');
    const endDateInput = periodForm.querySelector('#period-end-date');
    const startTimeInput = periodForm.querySelector('#period-start-time');
    const endTimeInput = periodForm.querySelector('#period-end-time');
    const nameInput = periodForm.querySelector('#period-name');
    const messageEl = periodForm.querySelector('#period-message');
    
    // Validar datos
    validateDates();
    if (!periodForm.checkValidity()) {
      periodForm.reportValidity();
      return;
    }
    
    // Crear objetos de fecha combinando fecha y hora
    const startDateStr = startDateInput.value;
    const startTimeStr = startTimeInput.value || '00:00';
    const endDateStr = endDateInput.value;
    const endTimeStr = endTimeInput.value || '23:59';
    
    const startDate = new Date(`${startDateStr}T${startTimeStr}:00`);
    const endDate = new Date(`${endDateStr}T${endTimeStr}:00`);
    
    try {
      // Mostrar mensaje de carga
      messageEl.textContent = 'Guardando periodo...';
      messageEl.className = 'form-message info';
      
      // Crear objeto con los datos
      const periodData = {
        startDate: firebase.firestore.Timestamp.fromDate(startDate),
        endDate: firebase.firestore.Timestamp.fromDate(endDate),
        name: nameInput.value.trim(),
        active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Guardar en Firestore
      const db = firebase.firestore();
      
      // Si hay un periodo activo, desactivarlo primero
      if (currentPeriodData) {
        await db.collection('surveyPeriods').doc(currentPeriodData.id).update({
          active: false,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Crear nuevo periodo
      await db.collection('surveyPeriods').add(periodData);
      
      // Actualizar datos locales
      await loadCurrentPeriod();
      
      // Mostrar mensaje de éxito
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
   * Formatea una fecha para mostrar en la UI incluyendo hora
   */
  function formatDate(date) {
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
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
   * Formatea una hora para inputs time (HH:MM)
   */
  function formatTimeForInput(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
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
