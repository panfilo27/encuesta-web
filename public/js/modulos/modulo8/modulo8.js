// public/js/auth/modulo8.js
// Lógica para el Módulo 8 - Participación Social de los Egresados

// Inicializar la aplicación
window.initModulo8UI = function() {
  console.log('[Módulo 8] initModulo8UI llamada');
  
  // Referencias a elementos DOM
  const form = document.querySelector('form');
  const questionsCompletedElement = document.getElementById('questions-completed');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  
  // Referencias a campos específicos
  const orgSocialesOptions = document.querySelectorAll('input[name="pertenece_org_sociales"]');
  const orgProfesionalesOptions = document.querySelectorAll('input[name="pertenece_org_profesionales"]');
  const asocEgresadosOptions = document.querySelectorAll('input[name="pertenece_asoc_egresados"]');
  
  // Referencias a contenedores condicionales
  const organizacionesContainer = document.getElementById('organizaciones-container');
  const organismoProfesionalContainer = document.getElementById('organismo-profesional-container');
  const cualOrganismoProfesionalInput = document.getElementById('cual_organismo_profesional');
  
  // Referencias a indicadores de validación
  const orgSocialesValidation = document.getElementById('org-sociales-validation');
  const orgProfesionalesValidation = document.getElementById('org-profesionales-validation');
  const asocEgresadosValidation = document.getElementById('asoc-egresados-validation');
  
  // Estado de organizaciones sociales
  window.organizacionesSociales = [];
  
  // Importar la función para crear objeto del modelo
  let crearObjetoParticipacionSocial;
  let parseParticipacionSocialFirestore;
  
  try {
    const modulePromise = import('../../models/ParticipacionSocial.js');
    modulePromise.then(module => {
      window.crearObjetoParticipacionSocial = module.crearObjetoParticipacionSocial;
      window.parseParticipacionSocialFirestore = module.parseParticipacionSocialFirestore;
      crearObjetoParticipacionSocial = module.crearObjetoParticipacionSocial;
      parseParticipacionSocialFirestore = module.parseParticipacionSocialFirestore;
    }).catch(e => {
      console.error('[Módulo 8] Error al importar modelo de ParticipacionSocial:', e);
    });
  } catch (e) {
    console.error('[Módulo 8] Error al importar dinámicamente:', e);
  }
  
  // Variables de estado
  let totalCompleted = 0;
  
  // Función para actualizar el contador de preguntas completadas
  function updateCompletedCounter() {
    const total = 3; // Número total de preguntas en este módulo
    totalCompleted = 0;
    
    // Verificar si se respondió sobre organizaciones sociales
    if (document.querySelector('input[name="pertenece_org_sociales"]:checked')) {
      totalCompleted++;
    }
    
    // Verificar si se respondió sobre organismos profesionales
    if (document.querySelector('input[name="pertenece_org_profesionales"]:checked')) {
      totalCompleted++;
    }
    
    // Verificar si se respondió sobre asociación de egresados
    if (document.querySelector('input[name="pertenece_asoc_egresados"]:checked')) {
      totalCompleted++;
    }
    
    // Actualizar contador en la interfaz
    if (questionsCompletedElement) {
      questionsCompletedElement.textContent = `${totalCompleted}`;
    }
  }
  
  // Función para mostrar/ocultar campos condicionales
  function toggleConditionalFields() {
    // Campos para organizaciones sociales
    const orgSocialesSi = document.getElementById('org_sociales_si');
    if (orgSocialesSi && organizacionesContainer) {
      organizacionesContainer.style.display = orgSocialesSi.checked ? 'block' : 'none';
      
      // Actualizar estado de mensaje de lista vacía
      updateEmptyStateMessage();
    }
    
    // Campos para organismos profesionales
    const orgProfesionalesSi = document.getElementById('org_profesionales_si');
    if (orgProfesionalesSi && organismoProfesionalContainer) {
      organismoProfesionalContainer.style.display = orgProfesionalesSi.checked ? 'block' : 'none';
      
      // Si se cambia a "No", limpiar campo de texto
      if (!orgProfesionalesSi.checked) {
        if (cualOrganismoProfesionalInput) cualOrganismoProfesionalInput.value = '';
      }
    }
  }
  
  // Función para actualizar el mensaje de estado vacío
  function updateEmptyStateMessage() {
    const emptyMessage = document.querySelector('.empty-state-message');
    const orgList = document.querySelector('.organizaciones-list');
    
    if (emptyMessage && orgList) {
      if (window.organizacionesSociales.length === 0) {
        orgList.innerHTML = '';
        emptyMessage.style.display = 'block';
      } else {
        emptyMessage.style.display = 'none';
      }
    }
  }
  
  // Función para mostrar error en un campo
  function showValidationError(validationElement, mensaje) {
    if (validationElement) {
      validationElement.textContent = mensaje;
      validationElement.style.display = 'block';
      validationElement.classList.remove('valid');
      
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
  
  // Función para mostrar validación exitosa
  function showValidSuccess(validationElement, mensaje) {
    if (validationElement) {
      validationElement.textContent = mensaje;
      validationElement.style.display = 'block';
      validationElement.classList.add('valid');
      
      // Ocultar después de un tiempo
      setTimeout(() => {
        validationElement.style.display = 'none';
      }, 3000);
    }
  }
  
  // Mostrar mensaje de error en la interfaz
  function mostrarMensajeError(mensaje) {
    // Buscar contenedor para mensaje de error
    const errorContainer = document.getElementById('error-container');
    const estadoContainer = document.getElementById('estado-container');
    
    if (errorContainer && estadoContainer) {
      errorContainer.textContent = mensaje;
      errorContainer.style.display = 'block';
      estadoContainer.style.display = 'block';
      
      // Ocultar mensaje después de 7 segundos
      setTimeout(() => {
        errorContainer.style.display = 'none';
      }, 7000);
    }
  }
  
  // Mostrar mensaje de éxito en la interfaz
  function mostrarMensajeExito(mensaje) {
    // Buscar contenedor para mensaje de éxito
    const successContainer = document.getElementById('success-container');
    const estadoContainer = document.getElementById('estado-container');
    
    if (successContainer && estadoContainer) {
      successContainer.textContent = mensaje;
      successContainer.style.display = 'block';
      estadoContainer.style.display = 'block';
      
      // Ocultar mensaje después de 5 segundos
      setTimeout(() => {
        successContainer.style.display = 'none';
      }, 5000);
    }
  }
  
  // Configurar eventos para los radio buttons
  if (orgSocialesOptions) {
    orgSocialesOptions.forEach(option => {
      option.addEventListener('change', function() {
        toggleConditionalFields();
        updateCompletedCounter();
        
        // Ocultar errores de validación
        hideValidationError(orgSocialesValidation);
      });
    });
  }
  
  if (orgProfesionalesOptions) {
    orgProfesionalesOptions.forEach(option => {
      option.addEventListener('change', function() {
        toggleConditionalFields();
        updateCompletedCounter();
        
        // Ocultar errores de validación
        hideValidationError(orgProfesionalesValidation);
      });
    });
  }
  
  if (asocEgresadosOptions) {
    asocEgresadosOptions.forEach(option => {
      option.addEventListener('change', function() {
        updateCompletedCounter();
        
        // Ocultar errores de validación
        hideValidationError(asocEgresadosValidation);
      });
    });
  }
  
  // Función para validar el formulario
  function validarFormulario() {
    let isValid = true;
    
    // Validar selección de organizaciones sociales
    const orgSocialesSelected = document.querySelector('input[name="pertenece_org_sociales"]:checked');
    if (!orgSocialesSelected) {
      showValidationError(orgSocialesValidation, 'Por favor, seleccione una opción');
      isValid = false;
    } else if (orgSocialesSelected.value === 'Sí' && window.organizacionesSociales.length === 0) {
      showValidationError(orgSocialesValidation, 'Por favor, agregue al menos una organización social');
      isValid = false;
    }
    
    // Validar selección de organismos profesionales
    const orgProfesionalesSelected = document.querySelector('input[name="pertenece_org_profesionales"]:checked');
    if (!orgProfesionalesSelected) {
      showValidationError(orgProfesionalesValidation, 'Por favor, seleccione una opción');
      isValid = false;
    } else if (orgProfesionalesSelected.value === 'Sí' && (!cualOrganismoProfesionalInput || !cualOrganismoProfesionalInput.value.trim())) {
      showValidationError(orgProfesionalesValidation, 'Por favor, especifique a qué organismo profesional pertenece');
      isValid = false;
    }
    
    // Validar selección de asociación de egresados
    const asocEgresadosSelected = document.querySelector('input[name="pertenece_asoc_egresados"]:checked');
    if (!asocEgresadosSelected) {
      showValidationError(asocEgresadosValidation, 'Por favor, seleccione una opción');
      isValid = false;
    }
    
    return isValid;
  }
  
  // Guardar datos del módulo 8
  async function guardarDatosModulo8() {
    console.log('[Módulo 8] Guardando datos del formulario');
    
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
        console.error('[Módulo 8] No hay usuario autenticado');
        mostrarMensajeError('No se detectó una sesión activa. Tus datos no podrán ser guardados permanentemente.');
        return false;
      }
      
      console.log('[Módulo 8] Usuario autenticado al guardar:', user.email);
      
      // Crear objeto usando el modelo si está disponible
      let datosParticipacion;
      
      if (window.crearObjetoParticipacionSocial) {
        // Pasar el formulario y las organizaciones como espera la función
        datosParticipacion = window.crearObjetoParticipacionSocial(
          document.querySelector('form'),  // Primer parámetro: elemento formulario
          window.organizacionesSociales || [] // Segundo parámetro: array de organizaciones
        );
      } else {
        // Fallback: crear objeto manualmente
        datosParticipacion = {
          pertenece_org_sociales: document.querySelector('input[name="pertenece_org_sociales"]:checked')?.value || null,
          organizaciones_sociales: window.organizacionesSociales || [],
          pertenece_org_profesionales: document.querySelector('input[name="pertenece_org_profesionales"]:checked')?.value || null,
          cual_organismo_profesional: document.getElementById('cual_organismo_profesional')?.value || null,
          pertenece_asoc_egresados: document.querySelector('input[name="pertenece_asoc_egresados"]:checked')?.value || null,
          userId: user.uid,
          timestamp: new Date().toISOString()
        };
      }
      
      // Guardar en localStorage (respaldo local)
      localStorage.setItem('modulo8_data', JSON.stringify({
        ...datosParticipacion,
        userId: user.uid,
        timestamp: new Date().toISOString()
      }));
      
      console.log('[Módulo 8] Datos guardados en localStorage');
      
      // La lógica de guardado en Firebase se ha movido al Módulo 9 (o el módulo final de la encuesta).
      // Módulo 8 solo guardará en localStorage.
      console.log('[Módulo 8] Guardado en Firebase omitido. Se realizará en el módulo final.');
      
      return true; // Indicar que el guardado local fue exitoso.
    } catch (error) {
      console.error('[Módulo 8] Error al guardar datos:', error);
      mostrarMensajeError('Ocurrió un error al guardar tus datos. Por favor, intenta nuevamente.');
      return false;
    }
  }
  
  // Función para cargar datos desde Firebase
  async function cargarDatosDesdeFirebase() {
    try {
      console.log('[Módulo 8] Intentando cargar datos desde Firebase');
      
      // Esperar a que la autenticación se inicialice completamente
      const user = await new Promise(authResolve => {
        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
          unsubscribe(); // Dejar de escuchar cambios de autenticación
          authResolve(user);
        });
      });
      
      // Verificar si hay un usuario autenticado
      if (!user) {
        console.log('[Módulo 8] Usuario no autenticado, no se cargó de Firebase');
        return null;
      }
      
      console.log('[Módulo 8] Usuario autenticado:', user.email);
      
      // Referencia a la base de datos donde se almacena el historial de encuestas
      const db = firebase.firestore();
      const historialEncuestasRef = db.collection('usuarios').doc(user.uid).collection('historialEncuestas');
      
      // Consultar la última encuesta completada
      const querySnapshot = await historialEncuestasRef.orderBy('fechaCompletado', 'desc').limit(1).get();
      
      if (!querySnapshot.empty) {
        const docMasReciente = querySnapshot.docs[0];
        if (docMasReciente.data() && docMasReciente.data().retroalimentacionItch) {
          const data = docMasReciente.data().retroalimentacionItch;
          console.log('[Módulo 8] Datos de la última encuesta encontrados en Firebase:', data);
          
          // Aplicar parseador si está disponible
          let participacionParsed;
          if (window.parseParticipacionSocialFirestore) {
            // Si ya está disponible como función
            participacionParsed = window.parseParticipacionSocialFirestore(data);
          } else {
            // Fallback: usar datos crudos
            participacionParsed = data;
            console.log('[Módulo 8] Usando datos crudos sin parsear');
          }
          
          console.log('[Módulo 8] Datos procesados de Firebase:', participacionParsed);
          return participacionParsed;
        } else {
          console.log('[Módulo 8] La última encuesta no contiene datos de participación social.');
          return null;
        }
      } else {
        console.log('[Módulo 8] No se encontraron encuestas previas en el historial de Firebase');
        return null;
      }
    } catch (error) {
      console.error('[Módulo 8] Error al cargar desde Firebase:', error);
      return null;
    }
  }
  
  // Aplicar datos al formulario
  function aplicarDatosAlFormulario(datos) {
    if (!datos) {
      console.warn('[Módulo 8] No hay datos para aplicar al formulario');
      return false;
    }
    
    try {
      console.log('[Módulo 8] Aplicando datos al formulario:', datos);
      
      // Aplicar selección de organizaciones sociales
      if (datos.pertenece_org_sociales) {
        const orgSocialesRadio = document.querySelector(`input[name="pertenece_org_sociales"][value="${datos.pertenece_org_sociales}"]`);
        if (orgSocialesRadio) {
          orgSocialesRadio.checked = true;
          
          // Mostrar campo condicional y cargar organizaciones si es "Sí"
          if (datos.pertenece_org_sociales === 'Sí' && organizacionesContainer) {
            organizacionesContainer.style.display = 'block';
            
            // Cargar organizaciones si existen
            if (Array.isArray(datos.organizaciones_sociales) && datos.organizaciones_sociales.length > 0) {
              window.organizacionesSociales = [...datos.organizaciones_sociales];
              window.renderOrganizacionesSociales();
            }
          }
        }
      }
      
      // Aplicar selección de organismos profesionales
      if (datos.pertenece_org_profesionales) {
        const orgProfesionalesRadio = document.querySelector(`input[name="pertenece_org_profesionales"][value="${datos.pertenece_org_profesionales}"]`);
        if (orgProfesionalesRadio) {
          orgProfesionalesRadio.checked = true;
          
          // Mostrar campo condicional y cargar valor si es "Sí"
          if (datos.pertenece_org_profesionales === 'Sí' && organismoProfesionalContainer && cualOrganismoProfesionalInput) {
            organismoProfesionalContainer.style.display = 'block';
            if (datos.cual_organismo_profesional) {
              cualOrganismoProfesionalInput.value = datos.cual_organismo_profesional;
            }
          }
        }
      }
      
      // Aplicar selección de asociación de egresados
      if (datos.pertenece_asoc_egresados) {
        const asocEgresadosRadio = document.querySelector(`input[name="pertenece_asoc_egresados"][value="${datos.pertenece_asoc_egresados}"]`);
        if (asocEgresadosRadio) {
          asocEgresadosRadio.checked = true;
        }
      }
      
      // Actualizar contador y validación
      updateCompletedCounter();
      toggleConditionalFields();
      
      return true;
    } catch (error) {
      console.error('[Módulo 8] Error al aplicar datos al formulario:', error);
      mostrarMensajeError('Ocurrió un error al cargar tus datos. Puedes continuar con el formulario vacío.');
      return false;
    }
  }
  
  // Cargar datos guardados
  async function cargarDatosModulo8() {
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
        console.log('[Módulo 8] Usuario no autenticado');
        return false;
      }
      
      console.log('[Módulo 8] Usuario autenticado al cargar datos:', user.email);
      
      // 1. Intentar cargar desde Firebase primero
      const datosFirebase = await cargarDatosDesdeFirebase();
      if (datosFirebase) {
        console.log('[Módulo 8] Usando datos de Firebase');
        return aplicarDatosAlFormulario(datosFirebase);
      }
      
      // 2. Si no hay datos en Firebase, intentar desde localStorage
      const dataStr = localStorage.getItem('modulo8_data');
      if (!dataStr) {
        console.log('[Módulo 8] No hay datos guardados en localStorage');
        return false;
      }
      
      const datosLocal = JSON.parse(dataStr);
      
      // Verificar que los datos pertenecen al usuario actual
      if (datosLocal.userId && datosLocal.userId !== user.uid) {
        console.log('[Módulo 8] Los datos en localStorage no pertenecen al usuario actual');
        // Limpiar datos que no corresponden al usuario actual
        localStorage.removeItem('modulo8_data');
        return false;
      }
      
      console.log('[Módulo 8] Usando datos de localStorage');
      return aplicarDatosAlFormulario(datosLocal);
      
    } catch (error) {
      console.error('[Módulo 8] Error al cargar datos:', error);
      mostrarMensajeError('Ocurrió un error al cargar tus datos. Puedes continuar con el formulario vacío.');
      return false;
    }
  }
  
  // Configurar el botón de navegación (previo)
  if (prevBtn) {
    console.log('[Módulo 8] Configurando evento click para botón Anterior');
    
    // Eliminamos eventos anteriores que pudieran existir
    prevBtn.replaceWith(prevBtn.cloneNode(true));
    // Obtener la nueva referencia después de clonar
    const prevBtnNew = document.getElementById('prevBtn');
    
    prevBtnNew.addEventListener('click', function() {
      console.log('[Módulo 8] Botón Anterior clickeado');
      
      // Guardar datos antes de navegar
      guardarDatosModulo8();
      
      // Redireccionar al módulo anterior
      window.location.href = 'modulo7.html';
      
      return false;
    });
  }
  
  // Configurar botón Finalizar
  if (nextBtn) {
    nextBtn.addEventListener('click', async (event) => {
      // Validar formulario
      if (!validarFormulario()) {
        return;
      }
      
      // Guardar datos antes de continuar
      const guardadoExitoso = await guardarDatosModulo8();
      
      if (guardadoExitoso) {
        // Esperar un momento para permitir que el usuario vea el mensaje de éxito
        setTimeout(() => {
          console.log('[Módulo 8] Datos guardados correctamente, navegando al módulo 9');
          
          // Redireccionar al módulo 9 de comentarios y sugerencias
          window.location.href = 'modulo9.html';
        }, 1500);
      } else {
        mostrarMensajeError('Hubo un problema al guardar tus datos. Por favor, intenta nuevamente.');
      }
    });
  }
  
  // Cargar datos y configurar interfaz
  cargarDatosModulo8();
  
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
      initModulo8UI();
    } else {
      // No hay sesión, redireccionar al login
      window.location.href = "auth.html";
    }
  });
});
