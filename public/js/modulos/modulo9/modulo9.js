/**
 * Módulo 9 - Comentarios y Sugerencias
 * 
 * Este archivo maneja la funcionalidad del módulo final de la encuesta,
 * que permite al egresado proporcionar comentarios sobre distintas áreas.
 */

// Función principal de inicialización del módulo 9
window.initModulo9UI = function() {
  console.log('[Módulo 9] Inicializando interfaz...');
  
  // Variables del DOM
  const form = document.getElementById('modulo9-form');
  const prevBtn = document.getElementById('prevBtn');
  const finalizarBtn = document.getElementById('finalizarBtn');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const questionsCompleted = document.getElementById('questions-completed');
  
  // Campos de texto para comentarios
  const academico = document.getElementById('academico-text');
  const docentes = document.getElementById('docentes-text');
  const instalaciones = document.getElementById('instalaciones-text');
  const servicios = document.getElementById('servicios-text');
  const otros = document.getElementById('otros-text');
  
  // Contadores de caracteres
  const academicoCounter = document.getElementById('academico-counter');
  const docentesCounter = document.getElementById('docentes-counter');
  const instalacionesCounter = document.getElementById('instalaciones-counter');
  const serviciosCounter = document.getElementById('servicios-counter');
  const otrosCounter = document.getElementById('otros-counter');
  
  let comentariosData = {
    academico: '',
    docentes: '',
    instalaciones: '',
    servicios: '',
    otros: ''
  };
  
  /**
   * Inicializa el sistema de pestañas
   */
  function initTabSystem() {
    // Manejar clic en botones de pestañas
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        // Desactivar pestañas actuales
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Activar pestaña seleccionada
        button.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        // Guardar datos al cambiar de pestaña
        guardarDatosLocalmente();
      });
    });
  }
  
  /**
   * Inicializa los contadores de caracteres para los campos de texto
   */
  function initCharacterCounters() {
    // Configurar contador para cada campo
    setupCounter(academico, academicoCounter);
    setupCounter(docentes, docentesCounter);
    setupCounter(instalaciones, instalacionesCounter);
    setupCounter(servicios, serviciosCounter);
    setupCounter(otros, otrosCounter);
  }
  
  /**
   * Configura un contador de caracteres para un campo de texto
   * @param {HTMLElement} input - Campo de texto
   * @param {HTMLElement} counter - Elemento del contador
   */
  function setupCounter(input, counter) {
    if (!input || !counter) return;
    
    // Actualizar contador inicial
    counter.textContent = input.value.length;
    
    // Actualizar contador al escribir
    input.addEventListener('input', () => {
      counter.textContent = input.value.length;
      
      // Guardar datos automáticamente al escribir (debounced)
      clearTimeout(input.saveTimeout);
      input.saveTimeout = setTimeout(() => {
        guardarDatosLocalmente();
      }, 1000);
    });
  }
  
  /**
   * Actualiza el contador de preguntas respondidas
   */
  function actualizarContadorPreguntas() {
    let count = 0;
    
    if (comentariosData.academico.trim()) count++;
    if (comentariosData.docentes.trim()) count++;
    if (comentariosData.instalaciones.trim()) count++;
    if (comentariosData.servicios.trim()) count++;
    if (comentariosData.otros.trim()) count++;
    
    if (questionsCompleted) {
      questionsCompleted.textContent = count;
    }
  }
  
  /**
   * Carga los datos del formulario desde localStorage o Firebase
   */
  async function cargarDatos() {
    showPreloader();
    console.log('[Módulo 9] Cargando datos...');
    
    try {
      // Esperar a que la autenticación se inicialice completamente
      const user = await new Promise(authResolve => {
        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
          unsubscribe(); // Dejar de escuchar cambios de autenticación
          authResolve(user);
        });
      });
      
      // Verificar si hay un usuario autenticado
      if (!user) {
        console.error('[Módulo 9] No hay usuario autenticado');
        hidePreloader();
        return;
      }
      
      console.log('[Módulo 9] Usuario autenticado:', user.email);
      
      try {
        // Primero intentar cargar desde Firebase
        const datosFirebase = await cargarDatosFirebase(user.uid);
        
        if (datosFirebase) {
          console.log('[Módulo 9] Datos cargados desde Firebase');
          comentariosData = datosFirebase;
        } else {
          // Si no hay datos en Firebase, cargar desde localStorage
          const savedData = localStorage.getItem('modulo9_data');
          if (savedData) {
            console.log('[Módulo 9] Datos cargados desde localStorage');
            comentariosData = JSON.parse(savedData);
          }
        }
      } catch (error) {
        console.error('[Módulo 9] Error al cargar datos desde Firebase:', error);
        
        // Intentar cargar desde localStorage en caso de error
        const savedData = localStorage.getItem('modulo9_data');
        if (savedData) {
          console.log('[Módulo 9] Usando datos de localStorage por error en Firebase');
          comentariosData = JSON.parse(savedData);
        }
      } finally {
        // Asignar valores a los campos del formulario siempre
        actualizarFormulario();
        actualizarContadorPreguntas();
        hidePreloader();
      }
    } catch (error) {
      console.error('[Módulo 9] Error general al cargar datos:', error);
      hidePreloader();
    }
  }
  
  /**
   * Carga los datos desde Firebase usando la subcolección historialEncuestas
   * @param {string} userId - ID del usuario actual
   * @returns {Promise<Object>} - Datos de comentarios
   */
  function cargarDatosFirebase(userId) {
    // Referencia a la subcolección historialEncuestas del usuario
    const historialEncuestasRef = firebase.firestore()
      .collection('usuarios')
      .doc(userId)
      .collection('historialEncuestas');
    
    // Consultar la última encuesta completada, ordenada por fecha descendente
    return historialEncuestasRef
      .orderBy('fechaCompletado', 'desc')
      .limit(1)
      .get()
      .then(querySnapshot => {
        if (!querySnapshot.empty) {
          const docMasReciente = querySnapshot.docs[0];
          if (docMasReciente.data() && docMasReciente.data().comentariosSugerencias) {
            return Comentarios.parseComentariosFirestore(docMasReciente.data().comentariosSugerencias);
          }
        }
        return null;
      });
  }
  
  /**
   * Actualiza el formulario con los datos cargados
   */
  function actualizarFormulario() {
    if (academico) academico.value = comentariosData.academico || '';
    if (docentes) docentes.value = comentariosData.docentes || '';
    if (instalaciones) instalaciones.value = comentariosData.instalaciones || '';
    if (servicios) servicios.value = comentariosData.servicios || '';
    if (otros) otros.value = comentariosData.otros || '';
    
    // Actualizar contadores
    if (academicoCounter) academicoCounter.textContent = (comentariosData.academico || '').length;
    if (docentesCounter) docentesCounter.textContent = (comentariosData.docentes || '').length;
    if (instalacionesCounter) instalacionesCounter.textContent = (comentariosData.instalaciones || '').length;
    if (serviciosCounter) serviciosCounter.textContent = (comentariosData.servicios || '').length;
    if (otrosCounter) otrosCounter.textContent = (comentariosData.otros || '').length;
  }
  
  /**
   * Guarda los datos en localStorage
   */
  function guardarDatosLocalmente() {
    // Obtener valores actuales
    recogerDatosFormulario();
    
    // Guardar en localStorage
    localStorage.setItem('modulo9_data', JSON.stringify(comentariosData));
    console.log('[Módulo 9] Datos guardados en localStorage');
    
    // Actualizar contador
    actualizarContadorPreguntas();
  }
  
  /**
   * Guarda los datos en localStorage (ahora no guarda en Firebase directamente)
   * @returns {Promise<void>}
   */
  async function guardarDatosFirebase() {
    try {
      // Esperar a que la autenticación se inicialice completamente
      const user = await new Promise(authResolve => {
        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
          unsubscribe(); // Dejar de escuchar cambios de autenticación
          authResolve(user);
        });
      });
      
      // Verificar si hay un usuario autenticado
      if (!user) {
        console.error('[Módulo 9] No hay usuario autenticado');
        return Promise.reject('No hay usuario autenticado');
      }
      
      console.log('[Módulo 9] Usuario autenticado al guardar:', user.email);
      
      // Obtener datos actuales
      recogerDatosFormulario();
      
      // Guardar en localStorage con información del usuario (igual que los otros módulos)
      localStorage.setItem('modulo9_data', JSON.stringify({
        ...comentariosData,
        userId: user.uid,
        timestamp: new Date().toISOString()
      }));
      
      console.log('[Módulo 9] Datos guardados en localStorage. Se guardarán en Firebase al finalizar la encuesta.');
      
      // Simular éxito ya que ahora solo guardamos en localStorage
      return Promise.resolve();
    } catch (error) {
      console.error('[Módulo 9] Error al guardar datos:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Recoge los datos actuales del formulario
   */
  function recogerDatosFormulario() {
    comentariosData = {
      academico: academico ? academico.value.trim() : '',
      docentes: docentes ? docentes.value.trim() : '',
      instalaciones: instalaciones ? instalaciones.value.trim() : '',
      servicios: servicios ? servicios.value.trim() : '',
      otros: otros ? otros.value.trim() : ''
    };
  }
  
  // La función finalizarEncuesta local ha sido eliminada y reemplazada por window.finalizarEncuestaGlobal

  /**
   * Configura los botones de navegación
   */
  function setupNavigation() {
    // Botón de atrás
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        // Guardar datos actuales
        guardarDatosLocalmente();
        
        // Navegar al módulo anterior
        window.location.href = 'modulo8.html';
      });
    }
    
    // Botón de finalizar
    if (finalizarBtn) {
      finalizarBtn.addEventListener('click', () => {
        // Confirmar finalización
        if (confirm('¿Estás seguro de que deseas finalizar la encuesta? Una vez completada, no podrás realizar cambios.')) {
          showPreloader(); // Mostrar preloader antes de iniciar el proceso
          guardarDatosLocalmente(); // Asegurar que los últimos datos de M9 estén en localStorage
          if (typeof window.finalizarEncuestaGlobal === 'function') {
            window.finalizarEncuestaGlobal().catch(error => {
              // El manejo de errores detallado ya está en finalizarEncuestaGlobal
              // Aquí solo nos aseguramos de ocultar el preloader si algo muy arriba falla.
              console.error('[Módulo 9] Error al invocar finalizarEncuestaGlobal:', error);
              hidePreloader();
            });
          } else {
            console.error('[Módulo 9] Error: finalizarEncuestaGlobal no está definida.');
            alert('Error crítico: La función para finalizar la encuesta no está disponible. Contacta a soporte.');
            hidePreloader();
          }
        }
      });
    }
    
    // Manejar envío del formulario (prevenir comportamiento por defecto)
    if (form) {
      form.addEventListener('submit', event => {
        event.preventDefault();
        finalizarEncuesta();
      });
    }
  }
  
  // Mostrar preloader
  function showPreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.style.display = 'flex';
  }
  
  // Ocultar preloader
  function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.style.display = 'none';
  }
  
  // Inicializar componentes
  initTabSystem();
  initCharacterCounters();
  setupNavigation();
  cargarDatos();
  
  console.log('[Módulo 9] Interfaz inicializada correctamente');
};

// Ejecutar cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Módulo 9] DOM cargado, esperando inicialización...');
});
