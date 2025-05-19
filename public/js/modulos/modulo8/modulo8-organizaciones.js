/**
 * Módulo 8 - Gestión de Organizaciones Sociales
 * 
 * Este archivo maneja la funcionalidad para añadir y eliminar
 * organizaciones sociales del formulario del Módulo 8.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Esperar a que se inicialice la UI del módulo 8
  const initInterval = setInterval(() => {
    if (window.initModulo8UI) {
      clearInterval(initInterval);
      initOrganizacionesUI();
    }
  }, 100);
});

/**
 * Inicializa la interfaz de usuario para gestionar organizaciones sociales
 */
function initOrganizacionesUI() {
  console.log('[Módulo 8 - Organizaciones] Inicializando interfaz para organizaciones');
  
  // Referencias a elementos del DOM
  const agregarBtn = document.getElementById('agregar-organizacion');
  const nuevaOrgInput = document.getElementById('nueva-organizacion');
  const organizacionesList = document.querySelector('.organizaciones-list');
  const emptyStateMessage = document.querySelector('.empty-state-message');
  
  // Asegurar que window.organizacionesSociales esté inicializado
  if (!window.organizacionesSociales) {
    window.organizacionesSociales = [];
  }
  
  // Renderizar organizaciones desde localStorage si existen
  window.renderOrganizacionesSociales = function() {
    if (!organizacionesList) return;
    
    // Limpiar lista
    organizacionesList.innerHTML = '';
    
    // Verificar si hay organizaciones
    if (window.organizacionesSociales.length === 0) {
      if (emptyStateMessage) emptyStateMessage.style.display = 'block';
      return;
    }
    
    // Ocultar mensaje de estado vacío
    if (emptyStateMessage) emptyStateMessage.style.display = 'none';
    
    // Renderizar cada organización
    window.organizacionesSociales.forEach((org, index) => {
      const template = document.getElementById('organizacion-item-template');
      if (!template) return;
      
      const clone = document.importNode(template.content, true);
      const orgItem = clone.querySelector('.organizacion-item');
      const orgNombre = clone.querySelector('.organizacion-nombre');
      const deleteBtn = clone.querySelector('.eliminar-organizacion');
      
      // Asignar datos
      orgNombre.textContent = org;
      
      // Aplicar estilos inline para asegurar que no sean azules
      if (deleteBtn) {
        // Quitar todas las clases para evitar estilos no deseados
        deleteBtn.className = 'btn-delete-custom';
        
        // Aplicar estilos directamente para mayor seguridad
        deleteBtn.style.backgroundColor = '#e8d0c9';
        deleteBtn.style.color = '#925445';
        deleteBtn.style.border = '1px solid #d5bcb5';
        deleteBtn.style.boxShadow = 'none';
        deleteBtn.style.textShadow = 'none';
        deleteBtn.style.borderRadius = '4px';
        deleteBtn.style.padding = '6px 10px';
        deleteBtn.style.display = 'inline-flex';
        deleteBtn.style.alignItems = 'center';
        deleteBtn.style.gap = '5px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.lineHeight = '1.2';
        deleteBtn.style.fontSize = '0.85rem';
        
        // Asegurar que el ícono también tenga el color correcto
        const icon = deleteBtn.querySelector('i');
        if (icon) {
          icon.style.color = '#925445';
        }
      }
      
      // Configurar evento para eliminar y para cambiar el color en hover
      deleteBtn.addEventListener('click', () => eliminarOrganizacion(index));
      
      // Agregar eventos para simular hover
      deleteBtn.addEventListener('mouseenter', () => {
        deleteBtn.style.backgroundColor = '#d7b5aa';
        deleteBtn.style.color = '#7d3b2c';
        deleteBtn.style.borderColor = '#c4a197';
        
        const icon = deleteBtn.querySelector('i');
        if (icon) {
          icon.style.color = '#7d3b2c';
        }
      });
      
      deleteBtn.addEventListener('mouseleave', () => {
        deleteBtn.style.backgroundColor = '#e8d0c9';
        deleteBtn.style.color = '#925445';
        deleteBtn.style.borderColor = '#d5bcb5';
        
        const icon = deleteBtn.querySelector('i');
        if (icon) {
          icon.style.color = '#925445';
        }
      });
      
      // Agregar a la lista
      organizacionesList.appendChild(clone);
    });
  };
  
  /**
   * Agrega una nueva organización a la lista
   */
  function agregarOrganizacion() {
    if (!nuevaOrgInput || !nuevaOrgInput.value.trim()) {
      mostrarErrorInput(nuevaOrgInput, 'Por favor, ingrese el nombre de la organización');
      return;
    }
    
    const nombreOrg = nuevaOrgInput.value.trim();
    
    // Verificar si ya existe
    if (window.organizacionesSociales.includes(nombreOrg)) {
      mostrarErrorInput(nuevaOrgInput, 'Esta organización ya ha sido agregada');
      return;
    }
    
    // Agregar organización
    window.organizacionesSociales.push(nombreOrg);
    
    // Limpiar input
    nuevaOrgInput.value = '';
    nuevaOrgInput.focus();
    
    // Renderizar lista actualizada
    window.renderOrganizacionesSociales();
    
    // Actualizar validación
    const orgSocialesValidation = document.getElementById('org-sociales-validation');
    if (orgSocialesValidation) {
      orgSocialesValidation.style.display = 'none';
    }
    
    // Notificar al usuario
    mostrarFeedback('Organización agregada correctamente');
  }
  
  /**
   * Elimina una organización de la lista
   * @param {number} index - Índice de la organización a eliminar
   */
  function eliminarOrganizacion(index) {
    if (index < 0 || index >= window.organizacionesSociales.length) return;
    
    // Eliminar organización
    const orgEliminada = window.organizacionesSociales.splice(index, 1)[0];
    
    // Renderizar lista actualizada
    window.renderOrganizacionesSociales();
    
    // Notificar al usuario
    mostrarFeedback(`"${orgEliminada}" ha sido eliminada`);
  }
  
  /**
   * Muestra un error en el input
   * @param {HTMLElement} inputElement - Elemento input con error
   * @param {string} mensaje - Mensaje de error
   */
  function mostrarErrorInput(inputElement, mensaje) {
    // Resaltar input con error
    inputElement.classList.add('is-invalid');
    
    // Crear elemento de error si no existe
    let errorElement = inputElement.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('invalid-feedback')) {
      errorElement = document.createElement('div');
      errorElement.className = 'invalid-feedback';
      inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
    }
    
    // Mostrar mensaje
    errorElement.textContent = mensaje;
    
    // Quitar error después de que el usuario comience a escribir
    const limpiador = () => {
      inputElement.classList.remove('is-invalid');
      inputElement.removeEventListener('input', limpiador);
    };
    inputElement.addEventListener('input', limpiador);
  }
  
  /**
   * Muestra un mensaje de retroalimentación
   * @param {string} mensaje - Mensaje a mostrar
   */
  function mostrarFeedback(mensaje) {
    // Buscar o crear el elemento de feedback
    let feedbackElement = document.getElementById('accion-feedback');
    if (!feedbackElement) {
      feedbackElement = document.createElement('div');
      feedbackElement.id = 'accion-feedback';
      feedbackElement.className = 'feedback-message';
      
      // Estilos para el elemento
      feedbackElement.style.position = 'fixed';
      feedbackElement.style.bottom = '20px';
      feedbackElement.style.right = '20px';
      feedbackElement.style.backgroundColor = '#4CAF50';
      feedbackElement.style.color = 'white';
      feedbackElement.style.padding = '10px 15px';
      feedbackElement.style.borderRadius = '5px';
      feedbackElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      feedbackElement.style.zIndex = '9999';
      feedbackElement.style.transition = 'opacity 0.3s ease';
      feedbackElement.style.opacity = '0';
      
      document.body.appendChild(feedbackElement);
    }
    
    // Actualizar mensaje y mostrar
    feedbackElement.textContent = mensaje;
    feedbackElement.style.opacity = '1';
    
    // Ocultar después de un tiempo
    setTimeout(() => {
      feedbackElement.style.opacity = '0';
    }, 3000);
  }
  
  // Configurar evento para agregar organización
  if (agregarBtn && nuevaOrgInput) {
    agregarBtn.addEventListener('click', agregarOrganizacion);
    
    // Permitir agregar al presionar Enter
    nuevaOrgInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        agregarOrganizacion();
      }
    });
  }
  
  // Renderizar organizaciones iniciales
  window.renderOrganizacionesSociales();
}
