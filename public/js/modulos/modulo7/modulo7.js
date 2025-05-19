// public/js/auth/modulo7.js
// Lógica para el Módulo 7 - Expectativas de desarrollo, superación profesional y actualización

// Importar funciones del modelo (se manejará dinámicamente)
// import { crearObjetoExpectativas, parseExpectativasFirestore } from '../models/Expectativas.js';

// Inicializar la aplicación
window.initModulo7UI = function() {
  console.log('[Módulo 7] initModulo7UI llamada');
  
  // Referencias a elementos DOM
  const form = document.querySelector('form');
  const questionsCompletedElement = document.getElementById('questions-completed');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  
  // Referencias a campos específicos
  const cursosOptions = document.querySelectorAll('input[name="cursos_actualizacion"]');
  const posgradoOptions = document.querySelectorAll('input[name="tomar_posgrado"]');
  const cursosContainer = document.getElementById('cursos-container');
  const posgradoContainer = document.getElementById('posgrado-container');
  const cualesCursosInput = document.getElementById('cuales_cursos');
  const cualPosgradoInput = document.getElementById('cual_posgrado');
  
  // Referencias a indicadores de validación
  const cursosValidation = document.getElementById('cursos-validation');
  const posgradoValidation = document.getElementById('posgrado-validation');
  
  // Variables de estado
  let totalCompleted = 0;
  
  // Función para actualizar el contador de preguntas completadas
  function updateCompletedCounter() {
    const total = 2; // Número total de preguntas en este módulo
    totalCompleted = 0;
    
    // Verificar si se respondió sobre cursos de actualización
    if (document.querySelector('input[name="cursos_actualizacion"]:checked')) {
      totalCompleted++;
    }
    
    // Verificar si se respondió sobre posgrado
    if (document.querySelector('input[name="tomar_posgrado"]:checked')) {
      totalCompleted++;
    }
    
    // Actualizar contador en la interfaz
    if (questionsCompletedElement) {
      questionsCompletedElement.textContent = `${totalCompleted}`;
    }
  }
  
  // Función para mostrar/ocultar campos condicionales
  function toggleConditionalFields() {
    // Campos para cursos
    const cursosSi = document.getElementById('cursos_si');
    if (cursosSi && cursosContainer) {
      cursosContainer.style.display = cursosSi.checked ? 'block' : 'none';
      
      // Si se cambia a "No", limpiar campo de texto
      if (!cursosSi.checked) {
        if (cualesCursosInput) cualesCursosInput.value = '';
      }
    }
    
    // Campos para posgrado
    const posgradoSi = document.getElementById('posgrado_si');
    if (posgradoSi && posgradoContainer) {
      posgradoContainer.style.display = posgradoSi.checked ? 'block' : 'none';
      
      // Si se cambia a "No", limpiar campo de texto
      if (!posgradoSi.checked) {
        if (cualPosgradoInput) cualPosgradoInput.value = '';
      }
    }
  }
  
  // Función para mostrar error en un campo
  function showValidationError(validationElement, mensaje) {
    if (validationElement) {
      validationElement.textContent = mensaje;
      validationElement.style.display = 'block';
      
      // Efecto de resalte
      validationElement.style.animation = 'pulse 0.5s';
      setTimeout(() => {
        validationElement.style.animation = '';
      }, 500);
    }
  }
  
  // Función para ocultar error en un campo
  function hideValidationError(validationElement) {
    if (validationElement) {
      validationElement.style.display = 'none';
    }
  }
  
  // Configurar eventos para opciones de cursos de actualización
  cursosOptions.forEach(option => {
    option.addEventListener('change', function() {
      toggleConditionalFields();
      hideValidationError(cursosValidation);
      updateCompletedCounter();
      
      // Los estilos de selección ahora son manejados directamente por CSS
    });
  });
  
  // Configurar eventos para opciones de posgrado
  posgradoOptions.forEach(option => {
    option.addEventListener('change', function() {
      toggleConditionalFields();
      hideValidationError(posgradoValidation);
      updateCompletedCounter();
      
      // Los estilos de selección ahora son manejados directamente por CSS
    });
  });
  
  // Eventos para inputs condicionales
  if (cualesCursosInput) {
    cualesCursosInput.addEventListener('input', function() {
      hideValidationError(cursosValidation);
    });
  }
  
  if (cualPosgradoInput) {
    cualPosgradoInput.addEventListener('input', function() {
      hideValidationError(posgradoValidation);
    });
  }
  
  // Función para validar el formulario
  function validarFormulario() {
    let isValid = true;
    
    // Validar selección de cursos
    const cursosSelected = document.querySelector('input[name="cursos_actualizacion"]:checked');
    if (!cursosSelected) {
      showValidationError(cursosValidation, 'Por favor, seleccione una opción');
      isValid = false;
    } else if (cursosSelected.value === 'Sí' && (!cualesCursosInput || !cualesCursosInput.value.trim())) {
      showValidationError(cursosValidation, 'Por favor, especifique qué cursos le gustaría tomar');
      isValid = false;
    }
    
    // Validar selección de posgrado
    const posgradoSelected = document.querySelector('input[name="tomar_posgrado"]:checked');
    if (!posgradoSelected) {
      showValidationError(posgradoValidation, 'Por favor, seleccione una opción');
      isValid = false;
    } else if (posgradoSelected.value === 'Sí' && (!cualPosgradoInput || !cualPosgradoInput.value.trim())) {
      showValidationError(posgradoValidation, 'Por favor, especifique qué posgrado le gustaría tomar');
      isValid = false;
    }
    
    return isValid;
  }
  
  // Importar la función para crear objeto del modelo
  let crearObjetoExpectativas;
  try {
    crearObjetoExpectativas = window.crearObjetoExpectativas || import('../../models/Expectativas.js').then(module => {
      window.crearObjetoExpectativas = module.crearObjetoExpectativas;
      return module.crearObjetoExpectativas;
    });
  } catch (e) {
    console.error('[Módulo 7] Error al importar crearObjetoExpectativas:', e);
  }

  // Guardar datos del módulo 7
  async function guardarDatosModulo7() {
    console.log('[Módulo 7] Guardando datos del formulario en localStorage');
    
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
        console.error('[Módulo 7] No hay usuario autenticado');
        return false;
      }
      
      console.log('[Módulo 7] Usuario autenticado al guardar:', user.email);  
      
      // Crear objeto usando el modelo si está disponible
      let datosExpectativas;
      
      if (window.crearObjetoExpectativas) {
        // Si ya está disponible como función
        datosExpectativas = window.crearObjetoExpectativas(form);
      } else if (crearObjetoExpectativas instanceof Promise) {
        // Si es una promesa pendiente
        const crearFuncion = await crearObjetoExpectativas;
        datosExpectativas = crearFuncion(form);
      } else {
        // Fallback: crear objeto manualmente
        datosExpectativas = {
          cursos_actualizacion: form.querySelector('input[name="cursos_actualizacion"]:checked')?.value || '',
          tomar_posgrado: form.querySelector('input[name="tomar_posgrado"]:checked')?.value || '',
          timestamp: new Date().toISOString()
        };
        
        // Agregar datos condicionales si corresponde
        if (datosExpectativas.cursos_actualizacion === 'Sí') {
          datosExpectativas.cuales_cursos = form.querySelector('input[name="cuales_cursos"]')?.value || '';
        }
        
        if (datosExpectativas.tomar_posgrado === 'Sí') {
          datosExpectativas.cual_posgrado = form.querySelector('input[name="cual_posgrado"]')?.value || '';
        }
      }
      
      // Añadir ID de usuario para validación en localStorage
      const datosModulo7 = {
        ...datosExpectativas,
        userId: user.uid
      };
      
      // Guardar en localStorage
      localStorage.setItem('modulo7_data', JSON.stringify(datosModulo7));
      console.log('[Módulo 7] Datos guardados en localStorage');
      
      return true;
    } catch (error) {
      console.error('[Módulo 7] Error al guardar datos:', error);
      return false;
    }
  }
  
  // Importar función para parsear datos de Firestore
  let parseExpectativasFirestore;
  try {
    parseExpectativasFirestore = window.parseExpectativasFirestore || import('../../models/Expectativas.js').then(module => {
      window.parseExpectativasFirestore = module.parseExpectativasFirestore;
      return module.parseExpectativasFirestore;
    });
  } catch (e) {
    console.error('[Módulo 7] Error al importar parseExpectativasFirestore:', e);
  }

  // Función para cargar datos desde Firebase
  async function cargarDatosDesdeFirebase() {
    try {
      console.log('[Módulo 7] Intentando cargar datos desde Firebase');
      
      // Esperar a que la autenticación se inicialice completamente
      const user = await new Promise(authResolve => {
        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
          unsubscribe(); // Dejar de escuchar cambios de autenticación
          authResolve(user);
        });
      });
      
      // Verificar si hay un usuario autenticado
      if (!user) {
        console.log('[Módulo 7] Usuario no autenticado, no se cargó de Firebase');
        return null;
      }
      
      console.log('[Módulo 7] Usuario autenticado:', user.email);  
      
      // Referencia a la base de datos donde se almacena el historial de encuestas
      const db = firebase.firestore();
      const historialEncuestasRef = db.collection('usuarios').doc(user.uid).collection('historialEncuestas');
      
      // Consultar la última encuesta completada
      const querySnapshot = await historialEncuestasRef.orderBy('fechaCompletado', 'desc').limit(1).get();
      
      if (!querySnapshot.empty) {
        const docMasReciente = querySnapshot.docs[0];
        if (docMasReciente.data() && docMasReciente.data().expectativasDesarrollo) {
          const data = docMasReciente.data().expectativasDesarrollo;
          console.log('[Módulo 7] Datos de la última encuesta encontrados en Firebase:', data);
          
          // Aplicar parseador si está disponible
          let expectativasParsed;
          if (window.parseExpectativasFirestore) {
            // Si ya está disponible como función
            expectativasParsed = window.parseExpectativasFirestore(data);
          } else if (typeof parseExpectativasFirestore === 'function') {
            // Si está disponible como variable
            expectativasParsed = parseExpectativasFirestore(data);
          } else if (parseExpectativasFirestore instanceof Promise) {
            // Si es una promesa pendiente
            const parseFuncion = await parseExpectativasFirestore;
            expectativasParsed = parseFuncion(data);
          } else {
            // Fallback: usar datos crudos
            expectativasParsed = data;
            console.log('[Módulo 7] Usando datos crudos sin parsear');
          }
          
          console.log('[Módulo 7] Datos procesados de Firebase:', expectativasParsed);
          return expectativasParsed;
        } else {
          console.log('[Módulo 7] La última encuesta no contiene datos de expectativas de desarrollo.');
          return null;
        }
      } else {
        console.log('[Módulo 7] No se encontraron encuestas previas en el historial de Firebase');
        return null;
      }
    } catch (error) {
      console.error('[Módulo 7] Error al cargar desde Firebase:', error);
      return null;
    }
  }

  // Aplicar datos al formulario
  function aplicarDatosAlFormulario(datos) {
    if (!datos) {
      return false;
    }
    
    try {
      console.log('[Módulo 7] Aplicando datos al formulario:', datos);
      
      // Aplicar selección de cursos de actualización
      if (datos.cursos_actualizacion) {
        const cursoRadio = document.querySelector(`input[name="cursos_actualizacion"][value="${datos.cursos_actualizacion}"]`);
        if (cursoRadio) {
          cursoRadio.checked = true;
          
          // Mostrar campo condicional si es "Sí"
          if (datos.cursos_actualizacion === 'Sí' && cursosContainer && cualesCursosInput) {
            cursosContainer.style.display = 'block';
            cualesCursosInput.value = datos.cuales_cursos || '';
          }
        }
      }
      
      // Aplicar selección de posgrado
      if (datos.tomar_posgrado) {
        const posgradoRadio = document.querySelector(`input[name="tomar_posgrado"][value="${datos.tomar_posgrado}"]`);
        if (posgradoRadio) {
          posgradoRadio.checked = true;
          
          // Mostrar campo condicional si es "Sí"
          if (datos.tomar_posgrado === 'Sí' && posgradoContainer && cualPosgradoInput) {
            posgradoContainer.style.display = 'block';
            cualPosgradoInput.value = datos.cual_posgrado || '';
          }
        }
      }
      
      // Actualizar contador y validación
      updateCompletedCounter();
      toggleConditionalFields();
      
      return true;
    } catch (error) {
      console.error('[Módulo 7] Error al aplicar datos al formulario:', error);
      return false;
    }
  }
  
  // Cargar datos guardados
  async function cargarDatosModulo7() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        console.log('[Módulo 7] Usuario no autenticado');
        return false;
      }

      // 1. Intentar cargar desde Firebase primero
      const datosFirebase = await cargarDatosDesdeFirebase();
      if (datosFirebase) {
        console.log('[Módulo 7] Usando datos de Firebase');
        return aplicarDatosAlFormulario(datosFirebase);
      }
      
      // 2. Si no hay datos en Firebase, intentar desde localStorage
      const dataStr = localStorage.getItem('modulo7_data');
      if (!dataStr) {
        console.log('[Módulo 7] No hay datos guardados en localStorage');
        return false;
      }
      
      const datosLocal = JSON.parse(dataStr);
      
      // Verificar que los datos pertenecen al usuario actual
      if (datosLocal.userId && datosLocal.userId !== user.uid) {
        console.log('[Módulo 7] Los datos en localStorage no pertenecen al usuario actual');
        // Limpiar datos que no corresponden al usuario actual
        localStorage.removeItem('modulo7_data');
        return false;
      }
      
      console.log('[Módulo 7] Usando datos de localStorage');
      return aplicarDatosAlFormulario(datosLocal);
      
    } catch (error) {
      console.error('[Módulo 7] Error al cargar datos:', error);
      return false;
    }
  }
  
  // Configurar el botón de navegación (previo)
  if (prevBtn) {
    console.log('[Módulo 7] Configurando evento click para botón Anterior');
    
    // Eliminamos eventos anteriores que pudieran existir
    prevBtn.replaceWith(prevBtn.cloneNode(true));
    // Obtener la nueva referencia después de clonar
    const prevBtnNew = document.getElementById('prevBtn');
    
    prevBtnNew.addEventListener('click', function() {
      console.log('[Módulo 7] Botón Anterior clickeado');
      
      // Guardar datos antes de navegar
      guardarDatosModulo7();
      
      // Redireccionar al módulo anterior dependiendo de la ruta
      const datosModulo3 = JSON.parse(localStorage.getItem('modulo3_data') || '{}');
      if (datosModulo3.actividad_actual && datosModulo3.actividad_actual.includes('Trabaja')) {
        // Si trabaja, viene del módulo 6
        window.location.href = 'modulo6.html';
      } else {
        // Si no trabaja, viene directo del módulo 3
        window.location.href = 'modulo3.html';
      }
      
      return false;
    });
  }
  
  // Configurar botón Siguiente
  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      // Validar formulario
      if (!validarFormulario()) {
        return;
      }
      
      // Guardar datos antes de continuar
      const guardadoExitoso = await guardarDatosModulo7();
      
      if (guardadoExitoso) {
        console.log('[Módulo 7] Datos guardados correctamente, navegando al módulo 8');
        
        // Redireccionar al módulo 8 - Participación Social
        window.location.href = 'modulo8.html';
      } else {
        // Mostrar mensaje de error al usuario con estilo moderno
        mostrarMensajeError('Hubo un problema al guardar tus datos. Por favor, intenta nuevamente.');
      }
    });
  }
  
  // Función para verificar la ruta de llegada
  async function verificarRutaLlegada() {
    try {
      const datosModulo3 = JSON.parse(localStorage.getItem('modulo3_data') || '{}');
      console.log('[Módulo 7] Verificando ruta de llegada, datos módulo 3:', datosModulo3);
    } catch (error) {
      console.error('[Módulo 7] Error al verificar ruta de llegada:', error);
    }
  }
  
  // Cargar datos y configurar interfaz
  verificarRutaLlegada();
  cargarDatosModulo7();
  
  // Mostrar la interfaz ocultando el preloader
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.display = 'none';
  }
};

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Proteger la ruta (redireccionar si no hay sesión)
  const auth = firebase.auth();
  auth.onAuthStateChanged(user => {
    if (user) {
      // Usuario autenticado, inicializar la UI
      initModulo7UI();
    } else {
      // No hay sesión, redireccionar al login
      window.location.href = "auth.html";
    }
  });
});

// Funciones auxiliares para el preloader
function showPreloader() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.display = 'flex';
  }
}

function hidePreloader() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.display = 'none';
  }
}
