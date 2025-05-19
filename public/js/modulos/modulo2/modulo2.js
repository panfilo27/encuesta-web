/* =====================================================
   Módulo 2: Lógica de evaluación de satisfacción académica
   ===================================================== */

// Importamos funciones de modelos (esta importación se manejará dinámicamente después)
// import { parseEvaluacionFirestore } from '../models/Evaluacion.js';

console.log('[Módulo 2] JS cargado');

/* ---------- Init dinámica ------------------------ */
window.initModulo2UI = function() {
  console.log('[Módulo 2] initModulo2UI llamada');
  
  // Referencias a elementos DOM
  const ratingCards = document.querySelectorAll('.rating-card');
  const ratingOptions = document.querySelectorAll('.rating-option');
  const questionsCompletedElement = document.getElementById('questions-completed');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  
  // Variables de estado
  let totalCompleted = 0;
  
  /* Funciones para manejar errores inline */
  function mostrarErrorCard(card, mensaje) {
    // Verificar si ya existe un mensaje de error
    let errorElement = card.querySelector('.error-message');
    
    // Si no existe, crear uno nuevo
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.style.color = '#ff3b30';
      errorElement.style.fontSize = '0.8rem';
      errorElement.style.marginTop = '10px';
      errorElement.style.display = 'block';
      errorElement.style.textAlign = 'center';
      card.appendChild(errorElement);
    }
    
    // Establecer el mensaje de error
    errorElement.textContent = mensaje;
    
    // Resaltar la tarjeta con error
    card.style.borderColor = '#ff3b30';
    card.style.boxShadow = '0 3px 10px rgba(255, 59, 48, 0.1)';
    
    // Animar la tarjeta para llamar la atención
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.style.animation = 'pulse 1s';
    setTimeout(() => {
      card.style.animation = '';
    }, 1000);
  }
  
  function ocultarErrorCard(card) {
    // Buscar si existe un mensaje de error
    let errorElement = card.querySelector('.error-message');
    
    // Si existe, eliminarlo
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
    
    // Quitar resaltado de error
    card.style.borderColor = '';
    card.style.boxShadow = '';
  }
  
  // Funciones auxiliares
  function updateCompletedCounter() {
    // Contar cuántas preguntas se han respondido
    const answeredQuestions = document.querySelectorAll('.rating-card .rating-indicator.completed');
    totalCompleted = answeredQuestions.length;
    
    // Actualizar contador en la interfaz
    if (questionsCompletedElement) {
      questionsCompletedElement.textContent = totalCompleted;
    }
  }
  
  // Importar la función para parsear datos desde Firestore
  let parseEvaluacionFirestore;
  try {
    parseEvaluacionFirestore = window.parseEvaluacionFirestore || import('../../models/Evaluacion.js').then(module => {
      window.parseEvaluacionFirestore = module.parseEvaluacionFirestore;
      return module.parseEvaluacionFirestore;
    });
  } catch (e) {
    console.error('[Módulo 2] Error al importar parseEvaluacionFirestore:', e);
  }
  
  // Configurar eventos para opciones de calificación
  ratingOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Encontrar la tarjeta padre
      const card = this.closest('.rating-card');
      const questionId = card.dataset.question;
      const hiddenInput = card.querySelector('input[type="hidden"]');
      const indicator = card.querySelector('.rating-indicator');
      
      // Quitar selección previa
      card.querySelectorAll('.rating-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // Marcar la opción seleccionada
      this.classList.add('selected');
      
      // Actualizar el input oculto con el valor
      if (hiddenInput) {
        hiddenInput.value = this.dataset.value;
      }
      
      // Marcar la pregunta como completada
      if (indicator) {
        indicator.classList.add('completed');
      }
      
      // Actualizar contador
      updateCompletedCounter();
      
      // Guardar datos automáticamente
      guardarDatosModulo2();
    });
  });
  
  // Guardar datos del módulo 2
  async function guardarDatosModulo2() {
    console.log('[Módulo 2] Guardando datos del formulario en localStorage');
    const form = document.querySelector('form');
    const formData = {};
    
    // Recopilar valores de inputs ocultos
    form.querySelectorAll('input[type="hidden"]').forEach(input => {
      if (input.name) {
        formData[input.name] = input.value;
      }
    });
    
    try {
      // Esperar a que la autenticación se inicialice completamente
      const user = await new Promise(authResolve => {
        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
          unsubscribe(); // Dejar de escuchar cambios de autenticación
          authResolve(user);
        });
      });
      
      // Añadir el ID de usuario para validación si está autenticado
      if (user) {
        console.log('[Módulo 2] Usuario autenticado al guardar:', user.email);
        formData.userId = user.uid;
      } else {
        console.log('[Módulo 2] No hay usuario autenticado al guardar datos');
      }
      
      // Guardar solo en localStorage
      localStorage.setItem('modulo2_data', JSON.stringify(formData));
      console.log('[Módulo 2] Datos guardados en localStorage');
      
      // Ya no guardamos en Firebase en cada paso, solo se hará al finalizar toda la encuesta
    } catch (error) {
      console.error('[Módulo 2] Error al guardar datos:', error);
    }
  }
  
  // Función para cargar datos desde Firebase
  async function cargarDatosDesdeFirebase() {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('[Módulo 2] Intentando cargar datos desde Firebase');
        
        // Esperar a que la autenticación se inicialice completamente
        const user = await new Promise(authResolve => {
          const unsubscribe = firebase.auth().onAuthStateChanged(user => {
            unsubscribe(); // Dejar de escuchar cambios de autenticación
            authResolve(user);
          });
        });
        
        // Verificar si hay un usuario autenticado
        if (!user) {
          console.log('[Módulo 2] No hay usuario autenticado para cargar datos de Firebase');
          return resolve(null);
        }
        
        console.log('[Módulo 2] Usuario autenticado:', user.email);
        
        // Referencia a la base de datos donde se almacena el historial de encuestas
        const db = firebase.firestore();
        const historialEncuestasRef = db.collection('usuarios').doc(user.uid).collection('historialEncuestas');
        
        // Consultar la última encuesta completada
        const querySnapshot = await historialEncuestasRef.orderBy('fechaCompletado', 'desc').limit(1).get();
        
        if (!querySnapshot.empty) {
          const docMasReciente = querySnapshot.docs[0];
          if (docMasReciente.data() && docMasReciente.data().satisfaccionAcademica) {
            console.log('[Módulo 2] Datos de la última encuesta encontrados en Firebase');
            
            // Usar parseEvaluacionFirestore si está disponible
            if (typeof window.parseEvaluacionFirestore === 'function') {
              const datosParseados = window.parseEvaluacionFirestore(docMasReciente.data().satisfaccionAcademica);
              console.log('[Módulo 2] Datos procesados con parseEvaluacionFirestore');
              return resolve(datosParseados);
            } else {
              // Si no está disponible, usar los datos crudos
              console.log('[Módulo 2] Datos crudos - parseEvaluacionFirestore no disponible');
              return resolve(docMasReciente.data().satisfaccionAcademica);
            }
          } else {
            console.log('[Módulo 2] La última encuesta no contiene datos de satisfacción académica.');
            return resolve(null);
          }
        } else {
          console.log('[Módulo 2] No se encontraron encuestas previas en el historial de Firebase');
          return resolve(null);
        }
      } catch (error) {
        console.error('[Módulo 2] Error al consultar Firebase:', error);
        return resolve(null);
      }
    });
  }
  
  // Función para aplicar los datos al formulario
  function aplicarDatosAlFormulario(data) {
    if (!data) {
      return false;
    }
    
    try {
      // Aplicar valores a los inputs ocultos y marcar las opciones seleccionadas
      for (const [name, value] of Object.entries(data)) {
        if (!value) continue;
        
        const hiddenInput = document.getElementById(name);
        if (hiddenInput) {
          hiddenInput.value = value;
          
          // Encontrar la tarjeta que contiene este input
          const card = hiddenInput.closest('.rating-card');
          if (card) {
            // Quitar selecciones previas
            card.querySelectorAll('.rating-option').forEach(opt => {
              opt.classList.remove('selected');
            });
            
            // Encontrar la opción que corresponde al valor y seleccionarla
            const option = card.querySelector(`.rating-option[data-value="${value}"]`);
            if (option) {
              option.classList.add('selected');
              
              // Marcar la pregunta como completada
              const indicator = card.querySelector('.rating-indicator');
              if (indicator) {
                indicator.classList.add('completed');
              }
            }
          }
        }
      }
      
      // Actualizar contador
      updateCompletedCounter();
      
      console.log('[Módulo 2] Datos aplicados al formulario');
      return true;
    } catch (error) {
      console.error('[Módulo 2] Error al aplicar datos:', error);
      return false;
    }
  }
  
  // Cargar datos guardados (primero intenta desde Firebase, luego localStorage)
  async function cargarDatosModulo2() {
    try {
      // 1. Intentar cargar desde Firebase primero
      const datosFirebase = await cargarDatosDesdeFirebase();
      if (datosFirebase) {
        console.log('[Módulo 2] Usando datos de Firebase');
        return aplicarDatosAlFormulario(datosFirebase);
      }
      
      // 2. Si no hay datos en Firebase, intentar desde localStorage
      const dataStr = localStorage.getItem('modulo2_data');
      if (!dataStr) {
        console.log('[Módulo 2] No hay datos guardados en localStorage');
        return false;
      }
      
      const datosLocal = JSON.parse(dataStr);
      console.log('[Módulo 2] Usando datos de localStorage');
      return aplicarDatosAlFormulario(datosLocal);
      
    } catch (error) {
      console.error('[Módulo 2] Error al cargar datos:', error);
      return false;
    }
  }
  
  // Validar formulario antes de pasar al siguiente módulo
  function validarFormulario() {
    // Eliminar todos los mensajes de error anteriores
    ratingCards.forEach(card => {
      ocultarErrorCard(card);
    });
    
    // Verificar si todas las preguntas han sido respondidas
    if (totalCompleted < 6) {
      // Encontrar y resaltar las tarjetas no completadas
      ratingCards.forEach(card => {
        const indicator = card.querySelector('.rating-indicator');
        if (!indicator.classList.contains('completed')) {
          mostrarErrorCard(card, 'Por favor, seleccione una opción');
        }
      });
      
      // Hacer scroll a la primera tarjeta con error
      const primerCardConError = document.querySelector('.rating-card .error-message');
      if (primerCardConError) {
        primerCardConError.closest('.rating-card').scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      
      return false; // No continuar
    }
    
    return true; // Todo validado correctamente
  }
  
  // Configurar el botón Siguiente para guardar datos y validar antes de ir al siguiente módulo
  if (nextBtn) {
    // Reemplazar el comportamiento anterior
    nextBtn.onclick = function(e) {
      e.preventDefault();
      
      // Guardar datos primero
      guardarDatosModulo2();
      
      // Validar y continuar solo si todo está completo
      if (validarFormulario()) {
        // Redirigir al módulo 3
        window.location.href = 'modulo3.html';
      }
    };
  }
  
  // Intentar cargar datos guardados
  cargarDatosModulo2();
};
