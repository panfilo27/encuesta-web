/* =====================================================
   Módulo 3: Lógica de ubicación laboral
   ===================================================== */

// Importamos funciones de modelos (esta importación se manejará dinámicamente después)
// import { parseUbicacionLaboralFirestore } from '../models/UbicacionLaboral.js';

console.log('[Módulo 3] JS cargado');

/* ---------- Init dinámica ------------------------ */
window.initModulo3UI = function() {
  console.log('[Módulo 3] initModulo3UI llamada');
  
  // Referencias a elementos DOM
  const activityOptions = document.querySelectorAll('.activity-option');
  const estudiosSection = document.getElementById('estudios-section');
  const trabajoSection = document.getElementById('trabajo-section');
  const ningunoSection = document.getElementById('ninguno-section');
  const questionsCompletedElement = document.getElementById('questions-completed');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const otroEstudioBlock = document.getElementById('otro-estudio-block');
  
  // Variables de estado
  let totalCompleted = 0;
  let actividadActual = '';
  
  // Actualizar contador de preguntas respondidas
  function updateCompletedCounter() {
    // Verificar las preguntas respondidas
    totalCompleted = 0;
    let totalPreguntas = 1; // Por defecto, solo hay 1 pregunta (actividad actual)
    
    // Verificar si se seleccionó actividad
    const actividadSelected = document.querySelector('input[name="actividad_actual"]:checked');
    if (actividadSelected) {
      totalCompleted++;
      
      // Si seleccionó "Estudia" o "Estudia y Trabaja", hay 2 preguntas en total
      if (actividadSelected.value.includes('Estudia')) {
        totalPreguntas = 2; // Ahora hay 2 preguntas totales
        const tipoEstudioSelected = document.querySelector('input[name="tipo_estudio"]:checked');
        if (tipoEstudioSelected) {
          totalCompleted++;
        }
      }
    }
    
    // Actualizar contador en la interfaz
    if (questionsCompletedElement) {
      questionsCompletedElement.textContent = totalCompleted;
      // Actualizar el total de preguntas dinámicamente
      const counterContainer = questionsCompletedElement.parentNode;
      if (counterContainer) {
        counterContainer.innerHTML = `<span id="questions-completed">${totalCompleted}</span>/${totalPreguntas} pregunta${totalPreguntas > 1 ? 's' : ''} respondida${totalCompleted !== 1 ? 's' : ''}`;
      }
    }
    
    // Habilitar/deshabilitar botón siguiente según la selección (no ocultar)
    if (nextBtn) {
      nextBtn.disabled = !actividadSelected;
    }
  }
  
  // Mostrar/ocultar secciones condicionales
  function toggleConditionalSections(actividad) {
    console.log(`[Módulo 3] Cambiando visibilidad para actividad: ${actividad}`);
    
    // Ocultar todas las secciones primero (usando display directamente)
    if (estudiosSection) estudiosSection.style.display = 'none';
    if (trabajoSection) trabajoSection.style.display = 'none';
    if (ningunoSection) ningunoSection.style.display = 'none';
    
    // Eliminar cualquier clase active que pudiera existir del estilo anterior
    if (estudiosSection) estudiosSection.classList.remove('active');
    if (trabajoSection) trabajoSection.classList.remove('active');
    if (ningunoSection) ningunoSection.classList.remove('active');
    
    // Mostrar secciones según la actividad seleccionada (usando display)
    if (actividad.includes('Estudia')) {
      if (estudiosSection) {
        estudiosSection.style.display = 'block';
        estudiosSection.classList.add('active'); // Mantenemos la clase por si el CSS la usa
      }
    }
    
    if (actividad.includes('Trabaja')) {
      if (trabajoSection) {
        trabajoSection.style.display = 'block';
        trabajoSection.classList.add('active');
      }
    }
    
    if (actividad === 'No estudia ni trabaja') {
      if (ningunoSection) {
        ningunoSection.style.display = 'block';
        ningunoSection.classList.add('active');
      }
    }
  }
  
  // Importar la función para parsear datos desde Firestore
  let parseUbicacionLaboralFirestore;
  try {
    parseUbicacionLaboralFirestore = window.parseUbicacionLaboralFirestore || import('../../models/UbicacionLaboral.js').then(module => {
      window.parseUbicacionLaboralFirestore = module.parseUbicacionLaboralFirestore;
      return module.parseUbicacionLaboralFirestore;
    });
  } catch (e) {
    console.error('[Módulo 3] Error al importar parseUbicacionLaboralFirestore:', e);
  }
  
  // Configurar eventos para opciones de actividad
  activityOptions.forEach(option => {
    const input = option.querySelector('input');
    const label = option.querySelector('label');
    
    if (input) {
      // Aplicar selección al hacer clic en cualquier parte del div o label
      option.addEventListener('click', function() {
        // Ejecutar el clic en el input para asegurar que se marque
        if (!input.checked) {
          input.checked = true;
          // Disparar evento change manualmente
          const event = new Event('change', { bubbles: true });
          input.dispatchEvent(event);
        }
      });
      
      if (label) {
        label.addEventListener('click', function(e) {
          e.preventDefault(); // Evitar comportamiento predeterminado
          if (!input.checked) {
            input.checked = true;
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
          }
        });
      }
      
      // Manejar eventos de cambio en los inputs
      input.addEventListener('change', function() {
        // Actualizar clase selected para todos los del mismo grupo
        const allOptionsInGroup = document.querySelectorAll(`.activity-option input[name="${this.name}"]`);
        allOptionsInGroup.forEach(groupInput => {
          const parentOption = groupInput.closest('.activity-option');
          if (parentOption) {
            if (groupInput.checked) {
              parentOption.classList.add('selected');
            } else {
              parentOption.classList.remove('selected');
            }
          }
        });
        
        // Manejar lógica específica por tipo de input
        if (this.name === 'actividad_actual') {
          actividadActual = this.value;
          toggleConditionalSections(this.value);
        }
        
        // Manejar tipo de estudio
        if (this.name === 'tipo_estudio') {
          // Mostrar/ocultar campo "otro" si se selecciona "Otra"
          if (otroEstudioBlock) {
            otroEstudioBlock.style.display = this.value === 'Otra' ? 'block' : 'none';
          }
        }
        
        // Actualizar contador y guardar datos
        updateCompletedCounter();
        guardarDatosModulo3();
      });
    }
  });
  
  // Guardar datos del módulo 3
  async function guardarDatosModulo3() {
    console.log('[Módulo 3] Guardando datos del formulario en localStorage');
    const form = document.querySelector('form');
    const formData = {};
    
    // Recopilar datos básicos del formulario
    formData.actividad_actual = form.querySelector('input[name="actividad_actual"]:checked')?.value || '';
    
    // Trabajando con datos limpios - reseteamos estos campos por defecto
    formData.estudia = false;
    formData.tipo_estudio = '';
    formData.otro_estudio = '';
    formData.especialidad_institucion = '';
    formData.trabaja = false;
    
    // Estudios (si aplica)
    if (formData.actividad_actual.includes('Estudia')) {
      formData.estudia = true;
      formData.tipo_estudio = form.querySelector('input[name="tipo_estudio"]:checked')?.value || '';
      
      // Si es "Otra", obtener el valor especificado
      if (formData.tipo_estudio === 'Otra') {
        formData.otro_estudio = form.querySelector('input[name="otro_estudio"]')?.value || '';
      }
      
      formData.especialidad_institucion = form.querySelector('input[name="especialidad_institucion"]')?.value || '';
    }
    
    // Trabajo (si aplica)
    formData.trabaja = formData.actividad_actual.includes('Trabaja');
    
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
        console.log('[Módulo 3] Usuario autenticado al guardar:', user.email);
        formData.userId = user.uid;
      } else {
        console.log('[Módulo 3] No hay usuario autenticado al guardar datos');
      }
      
      // Guardar solo en localStorage
      localStorage.setItem('modulo3_data', JSON.stringify(formData));
      console.log('[Módulo 3] Datos guardados en localStorage');
      
      // Ya no guardamos en Firebase en cada paso, solo se hará al finalizar toda la encuesta
    } catch (error) {
      console.error('[Módulo 3] Error al guardar datos:', error);
    }
  }
  
  // Función para cargar datos desde Firebase
  async function cargarDatosDesdeFirebase() {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('[Módulo 3] Intentando cargar datos desde Firebase');
        
        // Esperar a que la autenticación se inicialice completamente
        const user = await new Promise(authResolve => {
          const unsubscribe = firebase.auth().onAuthStateChanged(user => {
            unsubscribe(); // Dejar de escuchar cambios de autenticación
            authResolve(user);
          });
        });
        
        // Verificar si hay un usuario autenticado
        if (!user) {
          console.log('[Módulo 3] No hay usuario autenticado para cargar datos de Firebase');
          return resolve(null);
        }
        
        console.log('[Módulo 3] Usuario autenticado:', user.email);
        
        // Referencia a la base de datos donde se almacena el historial de encuestas
        const db = firebase.firestore();
        const historialEncuestasRef = db.collection('usuarios').doc(user.uid).collection('historialEncuestas');
        
        // Consultar la última encuesta completada
        const querySnapshot = await historialEncuestasRef.orderBy('fechaCompletado', 'desc').limit(1).get();
        
        if (!querySnapshot.empty) {
          const docMasReciente = querySnapshot.docs[0];
          if (docMasReciente.data() && docMasReciente.data().desempenoProfesional) {
            console.log('[Módulo 3] Datos de la última encuesta encontrados en Firebase');
            
            // Usar parseUbicacionLaboralFirestore si está disponible
            if (typeof window.parseUbicacionLaboralFirestore === 'function') {
              const datosParseados = window.parseUbicacionLaboralFirestore(docMasReciente.data().desempenoProfesional);
              console.log('[Módulo 3] Datos procesados con parseUbicacionLaboralFirestore');
              return resolve(datosParseados);
            } else {
              // Si no está disponible, usar los datos crudos
              console.log('[Módulo 3] Datos crudos - parseUbicacionLaboralFirestore no disponible');
              return resolve(docMasReciente.data().desempenoProfesional);
            }
          } else {
            console.log('[Módulo 3] La última encuesta no contiene datos de desempeño profesional.');
            return resolve(null);
          }
        } else {
          console.log('[Módulo 3] No se encontraron encuestas previas en el historial de Firebase');
          return resolve(null);
        }
      } catch (error) {
        console.error('[Módulo 3] Error al consultar Firebase:', error);
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
      // Aplicar actividad actual
      if (data.actividad_actual) {
        const actividadRadio = document.querySelector(`input[name="actividad_actual"][value="${data.actividad_actual}"]`);
        if (actividadRadio) {
          actividadRadio.checked = true;
          
          // Actualizar UI para la opción seleccionada
          const parentLabel = actividadRadio.closest('.activity-option');
          if (parentLabel) {
            parentLabel.classList.add('selected');
          }
          
          // Mostrar secciones condicionales
          toggleConditionalSections(data.actividad_actual);
        }
      }
      
      // Aplicar tipo de estudio (si estudia)
      if (data.estudia && data.tipo_estudio) {
        const tipoEstudioRadio = document.querySelector(`input[name="tipo_estudio"][value="${data.tipo_estudio}"]`);
        if (tipoEstudioRadio) {
          tipoEstudioRadio.checked = true;
          
          // Actualizar UI para la opción seleccionada
          const parentLabel = tipoEstudioRadio.closest('.activity-option');
          if (parentLabel) {
            parentLabel.classList.add('selected');
          }
          
          // Mostrar campo "otro" si aplica
          if (data.tipo_estudio === 'Otra') {
            otroEstudioBlock.style.display = 'block';
            const otroInput = document.querySelector('input[name="otro_estudio"]');
            if (otroInput && data.otro_estudio) {
              otroInput.value = data.otro_estudio;
            }
          }
        }
        
        // Aplicar especialidad e institución
        const especialidadInput = document.querySelector('input[name="especialidad_institucion"]');
        if (especialidadInput && data.especialidad_institucion) {
          especialidadInput.value = data.especialidad_institucion;
        }
      }
      
      // Actualizar contador
      updateCompletedCounter();
      
      console.log('[Módulo 3] Datos aplicados al formulario');
      return true;
    } catch (error) {
      console.error('[Módulo 3] Error al aplicar datos:', error);
      return false;
    }
  }
  
  // Cargar datos guardados (primero intenta desde Firebase, luego localStorage)
  async function cargarDatosModulo3() {
    try {
      // 1. Intentar cargar desde Firebase primero
      const datosFirebase = await cargarDatosDesdeFirebase();
      if (datosFirebase) {
        console.log('[Módulo 3] Usando datos de Firebase');
        return aplicarDatosAlFormulario(datosFirebase);
      }
      
      // 2. Si no hay datos en Firebase, intentar desde localStorage
      const dataStr = localStorage.getItem('modulo3_data');
      if (!dataStr) {
        console.log('[Módulo 3] No hay datos guardados en localStorage');
        return false;
      }
      
      const datosLocal = JSON.parse(dataStr);
      console.log('[Módulo 3] Usando datos de localStorage');
      return aplicarDatosAlFormulario(datosLocal);
      
    } catch (error) {
      console.error('[Módulo 3] Error al cargar datos:', error);
      return false;
    }
  }
  
  // Función para validar el formulario
  function validarFormulario() {
    // Verificar si se seleccionó actividad
    const actividadSelected = document.querySelector('input[name="actividad_actual"]:checked');
    if (!actividadSelected) {
      alert('Por favor, selecciona tu situación actual');
      return false;
    }
    
    // Si seleccionó "Estudia" o "Estudia y Trabaja", verificar tipo de estudio
    if (actividadSelected.value.includes('Estudia')) {
      const tipoEstudioSelected = document.querySelector('input[name="tipo_estudio"]:checked');
      if (!tipoEstudioSelected) {
        alert('Por favor, selecciona tu tipo de estudio');
        return false;
      }
      
      // Verificar si se especificó el otro tipo de estudio cuando corresponde
      if (tipoEstudioSelected.value === 'Otra') {
        const otroEstudio = document.querySelector('input[name="otro_estudio"]')?.value;
        if (!otroEstudio || otroEstudio.trim() === '') {
          alert('Por favor, especifica el otro tipo de estudio');
          return false;
        }
      }
    }
    
    return true;
  }

  // Configurar el botón de navegación (previo)
  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      // Guardar datos antes de navegar
      guardarDatosModulo3();
      // Redirigir al módulo anterior
      window.location.href = 'modulo2.html';
    });
  }
  
  // Configurar el botón Siguiente para guardar datos antes de ir al siguiente módulo
  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      // Guardar datos primero
      await guardarDatosModulo3();
      
      // Validar formulario
      if (validarFormulario()) {
        const actividadSelected = document.querySelector('input[name="actividad_actual"]:checked');
        // Solo redirigir al módulo 4 si seleccionó "Trabaja" o "Estudia y Trabaja"
        if (actividadSelected && actividadSelected.value.includes('Trabaja')) {
          window.location.href = 'modulo4.html';
        } else {
          // Si no trabaja, redirigir al módulo 7 de expectativas de desarrollo
          window.location.href = 'modulo7.html';
        }
      }
    });
  }
  
  // Observar cambios en campos de texto
  document.querySelectorAll('input[type="text"]').forEach(input => {
    input.addEventListener('input', function() {
      guardarDatosModulo3();
    });
  });
  
  // Intentar cargar datos guardados al inicializar y luego actualizar estado del botón siguiente
  cargarDatosModulo3().then(() => {
    // Actualizar estado del botón siguiente basado en la actividad seleccionada
    const actividadSelected = document.querySelector('input[name="actividad_actual"]:checked');
    if (nextBtn) {
      nextBtn.disabled = !actividadSelected;
    }
  });
};
