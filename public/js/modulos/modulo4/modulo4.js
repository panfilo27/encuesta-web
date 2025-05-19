// public/js/auth/modulo4.js
// Lógica para el Módulo 4 - Empleo: Datos Generales

// Inicializar la aplicación
window.initModulo4UI = function() {
  console.log('[Módulo 4] initModulo4UI llamada');
  
  // Referencias a elementos DOM
  const form = document.querySelector('form');
  const questionsCompletedElement = document.getElementById('questions-completed');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  
  // Controladores para campos "Otros"
  const medioOtroRadio = document.getElementById('medio_otro');
  const medioOtroContainer = document.getElementById('medio-otro-container');
  // Nota: requisitoOtroCheck y requisitoOtroContainer han sido eliminados del HTML
  const idiomaOtroRadio = document.getElementById('idioma_otro');
  const idiomaOtroContainer = document.getElementById('idioma-otro-container');
  const condicionOtroRadio = document.getElementById('condicion_otro');
  const condicionOtroContainer = document.getElementById('condicion-otro-container');
  
  // Referencias a sliders de habilidades
  const hablarSlider = document.getElementById('habilidad_hablar');
  const escribirSlider = document.getElementById('habilidad_escribir');
  const leerSlider = document.getElementById('habilidad_leer');
  const escucharSlider = document.getElementById('habilidad_escuchar');
  const hablarValue = document.getElementById('hablar-value');
  const escribirValue = document.getElementById('escribir-value');
  const leerValue = document.getElementById('leer-value');
  const escucharValue = document.getElementById('escuchar-value');
  
  // Elementos para requisitos (checkboxes)
  const requisitosChecks = document.querySelectorAll('input[name="requisitos_contratacion"]');
  
  // Variables de estado
  let totalCompleted = 0;
  
  // Verificar elegibilidad para este módulo (solo si trabaja o estudia y trabaja)
  async function verificarElegibilidad() {
    try {
      // Comprobar localStorage primero
      const dataStr = localStorage.getItem('modulo3_data');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.actividad_actual && data.actividad_actual.includes('Trabaja')) {
          return true;
        }
      }
      
      // Si no está en localStorage, intentar cargar desde Firebase
      const user = firebase.auth().currentUser;
      if (!user) {
        console.log('[Módulo 4] Usuario no autenticado');
        return false;
      }
      
      const db = firebase.firestore();
      const ubicacionRef = db.collection('usuarios').doc(user.uid).collection('encuesta').doc('ubicacion');
      const doc = await ubicacionRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        return data && data.actividad_actual && data.actividad_actual.includes('Trabaja');
      }
      
      return false;
    } catch (error) {
      console.error('[Módulo 4] Error al verificar elegibilidad:', error);
      return false;
    }
  }
  
  // Redirigir si no es elegible
  async function redirigirSiNoElegible() {
    const esElegible = await verificarElegibilidad();
    if (!esElegible) {
      console.log('[Módulo 4] Usuario no elegible para este módulo, redirigiendo...');
      // Mostrar mensaje
      alert('Esta sección solo está disponible para quienes trabajan. Redirigiendo al módulo anterior.');
      window.location.href = 'modulo3.html';
    } else {
      console.log('[Módulo 4] Usuario elegible para este módulo');
      // Mostrar el formulario
      hidePreloader();
    }
  }
  
  // Función para mostrar error en una tarjeta
  function mostrarErrorCard(card, mensaje) {
    const validationElement = card.querySelector('.validation-indicator');
    if (validationElement) {
      validationElement.textContent = mensaje;
      validationElement.style.display = 'block';
    }
    
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
  
  // Función para ocultar el error en una tarjeta
  function ocultarErrorCard(card) {
    const validationElement = card.querySelector('.validation-indicator');
    if (validationElement) {
      validationElement.style.display = 'none';
    }
    
    // Restaurar estilos
    card.style.borderColor = '';
    card.style.boxShadow = '';
  }
  
  // Función para actualizar el contador de preguntas completadas
  function updateCompletedCounter() {
    const total = 10; // Número total de preguntas en este módulo
    totalCompleted = 0;
    
    // Verificar campos completados
    if (form.querySelector('input[name="tiempo_primer_empleo"]:checked')) totalCompleted++;
    if (form.querySelector('input[name="medio_obtener_empleo"]:checked')) totalCompleted++;
    
    // Verificar requisitos (cualquier checkbox seleccionado)
    const hayRequisitosSeleccionados = document.querySelectorAll('.options-grid input[type="checkbox"]:checked').length > 0;
    if (hayRequisitosSeleccionados) totalCompleted++;
    
    if (form.querySelector('input[name="idioma"]:checked')) totalCompleted++;
    
    // Verificar habilidades de idioma (al menos una mayor a 0)
    const habilidadesCompletadas = 
      parseInt(hablarSlider.value) > 0 || 
      parseInt(escribirSlider.value) > 0 || 
      parseInt(leerSlider.value) > 0 || 
      parseInt(escucharSlider.value) > 0;
    if (habilidadesCompletadas) totalCompleted++;
    
    if (form.querySelector('input[name="antiguedad"]:checked')) totalCompleted++;
    if (document.getElementById('anio_ingreso').value.trim()) totalCompleted++;
    if (form.querySelector('input[name="ingreso"]:checked')) totalCompleted++;
    if (form.querySelector('input[name="nivel_jerarquico"]:checked')) totalCompleted++;
    if (form.querySelector('input[name="condicion_trabajo"]:checked')) totalCompleted++;
    
    // Actualizar contador
    questionsCompletedElement.textContent = `${totalCompleted}/${total}`;
  }
  
  // Inicializar sliders de habilidades
  function inicializarSliders() {
    // Referencias a los elementos de progreso
    const hablarProgress = document.getElementById('hablar-progress');
    const escribirProgress = document.getElementById('escribir-progress');
    const leerProgress = document.getElementById('leer-progress');
    const escucharProgress = document.getElementById('escuchar-progress');
    
    // Función para actualizar el progreso del slider
    function updateSliderProgress(value, progressElement) {
      if (progressElement) {
        progressElement.style.width = `${value}%`;
      }
    }
    
    // Hablar
    if (hablarSlider) {
      hablarSlider.addEventListener('input', function() {
        const newValue = this.value;
        if (hablarValue) hablarValue.textContent = newValue;
        
        // Actualizar barra de progreso
        updateSliderProgress(newValue, hablarProgress);
        
        // Añadir efecto visual de cambio
        if (hablarValue) {
          hablarValue.classList.add('changed');
          setTimeout(() => {
            hablarValue.classList.remove('changed');
          }, 500);
        }
        
        updateCompletedCounter();
      });
    }
    
    // Escribir
    if (escribirSlider) {
      escribirSlider.addEventListener('input', function() {
        const newValue = this.value;
        if (escribirValue) escribirValue.textContent = newValue;
        
        // Actualizar barra de progreso
        updateSliderProgress(newValue, escribirProgress);
        
        // Añadir efecto visual de cambio
        if (escribirValue) {
          escribirValue.classList.add('changed');
          setTimeout(() => {
            escribirValue.classList.remove('changed');
          }, 500);
        }
        
        updateCompletedCounter();
      });
    }
    
    // Leer
    if (leerSlider) {
      leerSlider.addEventListener('input', function() {
        const newValue = this.value;
        if (leerValue) leerValue.textContent = newValue;
        
        // Actualizar barra de progreso
        updateSliderProgress(newValue, leerProgress);
        
        // Añadir efecto visual de cambio
        if (leerValue) {
          leerValue.classList.add('changed');
          setTimeout(() => {
            leerValue.classList.remove('changed');
          }, 500);
        }
        
        updateCompletedCounter();
      });
    }
    
    // Escuchar
    if (escucharSlider) {
      escucharSlider.addEventListener('input', function() {
        const newValue = this.value;
        if (escucharValue) escucharValue.textContent = newValue;
        
        // Actualizar barra de progreso
        updateSliderProgress(newValue, escucharProgress);
        
        // Añadir efecto visual de cambio
        if (escucharValue) {
          escucharValue.classList.add('changed');
          setTimeout(() => {
            escucharValue.classList.remove('changed');
          }, 500);
        }
        
        updateCompletedCounter();
      });
    }
    
    // Inicializar los valores al cargar
    document.querySelectorAll('.slider-container input[type="range"]').forEach(slider => {
      if (slider && slider.parentElement) {
        const valueElement = slider.parentElement.querySelector('.slider-value');
        const progressElement = slider.parentElement.querySelector('.slider-progress');
        const currentValue = slider.value || '0';
        
        if (valueElement) valueElement.textContent = currentValue;
        if (progressElement) progressElement.style.width = `${currentValue}%`;
      }
    });
    
    console.log('[Módulo 4] Sliders inicializados correctamente');
  }
  
  // Inicializar las opciones "otros"
  function inicializarOpcionesOtros() {
    // Medio para obtener empleo
    document.querySelectorAll('input[name="medio_obtener_empleo"]').forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.id === 'medio_otro' && this.checked) {
          medioOtroContainer.style.display = 'flex';
        } else {
          medioOtroContainer.style.display = 'none';
        }
        ocultarErrorCard(document.getElementById('medio-empleo-card'));
        updateCompletedCounter();
      });
    });
    
    // Requisitos de contratación - Nota: La opción "Otros" ha sido reemplazada por un campo directo para añadir requisitos personalizados
    
    // Idioma
    document.querySelectorAll('input[name="idioma"]').forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.id === 'idioma_otro' && this.checked) {
          idiomaOtroContainer.style.display = 'flex';
        } else {
          idiomaOtroContainer.style.display = 'none';
        }
        ocultarErrorCard(document.getElementById('idioma-card'));
        updateCompletedCounter();
      });
    });
    
    // Condición de trabajo
    document.querySelectorAll('input[name="condicion_trabajo"]').forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.id === 'condicion_otro' && this.checked) {
          condicionOtroContainer.style.display = 'flex';
        } else {
          condicionOtroContainer.style.display = 'none';
        }
        ocultarErrorCard(document.getElementById('condicion-trabajo-card'));
        updateCompletedCounter();
      });
    });
  }
  
  // Inicializar requisitos de contratación
  function inicializarRequisitos() {
    console.log('[Debug] Inicializando requisitos de contratación');
    
    // Referencias a elementos DOM - Seleccionar específicamente la cuadrícula de la sección de requisitos
    const requisitosSectionCard = document.getElementById('requisitos-card');
    const optionsGrid = requisitosSectionCard ? requisitosSectionCard.querySelector('.options-grid') : null;
    const añadirRequisitoBtn = document.getElementById('añadir_requisito');
    const nuevoRequisitoInput = document.getElementById('nuevo_requisito_input');
    const requisitosChecksInitial = document.querySelectorAll('input[name="requisitos_contratacion"]');
    const feedbackElement = document.getElementById('requisito-feedback');
    let contadorRequisitosPersonalizados = 0;
    
    console.log('[Debug] Referencias a elementos:', {
      optionsGrid: optionsGrid ? 'Encontrado' : 'No encontrado',
      añadirRequisitoBtn: añadirRequisitoBtn ? 'Encontrado' : 'No encontrado',
      nuevoRequisitoInput: nuevoRequisitoInput ? 'Encontrado' : 'No encontrado',
      'requisitosChecksInitial.length': requisitosChecksInitial ? requisitosChecksInitial.length : 'No encontrado'
    });
    
    // Configurar eventos para los checkboxes predefinidos
    if (requisitosChecksInitial && requisitosChecksInitial.length > 0) {
      requisitosChecksInitial.forEach((check, index) => {
        check.addEventListener('change', function() {
          console.log(`[Debug] Cambio en checkbox #${index}: ${this.checked}`);
          updateCompletedCounter();
          actualizarMensajeValidacion();
        });
      });
    }
    
    // Verificar si hay checkboxes seleccionados
    function checkSeleccionados() {
      const todosLosCheckboxes = document.querySelectorAll('.options-grid input[type="checkbox"]');
      const haySeleccionados = Array.from(todosLosCheckboxes).some(cb => cb.checked);
      console.log('[Debug] Check seleccionados:', {total: todosLosCheckboxes.length, seleccionados: haySeleccionados});
      return haySeleccionados;
    }
    
    // Actualizar mensaje de validación
    function actualizarMensajeValidacion() {
      const validationElement = document.getElementById('requisitos-validation');
      if (validationElement) {
        validationElement.style.display = checkSeleccionados() ? 'none' : 'block';
      }
    }
    
    // Función auxiliar para mostrar mensajes de feedback
    function mostrarFeedback(elemento, tipo, mensaje) {
      if (!elemento) return;
      
      elemento.textContent = mensaje;
      elemento.className = `feedback-message ${tipo}`;
      elemento.style.display = 'block';
      
      // Ocultar el mensaje después de un tiempo
      setTimeout(() => {
        elemento.style.display = 'none';
      }, 3000);
    }
    
    // Función principal para añadir un nuevo requisito
    function añadirNuevoRequisito() {
      // Verificar si los elementos necesarios existen
      if (!optionsGrid) {
        console.error('[Error] Cuadrícula de opciones de requisitos no encontrada');
        mostrarFeedback(feedbackElement, 'error', 'Error: No se pudo encontrar la sección de requisitos');
        return;
      }
      
      if (!nuevoRequisitoInput) {
        console.error('[Error] Campo de entrada para requisito no encontrado');
        mostrarFeedback(feedbackElement, 'error', 'Error: Campo de entrada no encontrado');
        return;
      }
      
      // Obtener el texto del requisito y validar
      const textoRequisito = nuevoRequisitoInput.value.trim();
      
      if (!textoRequisito) {
        console.log('[Debug] No se ingresó ningún texto de requisito');
        mostrarFeedback(feedbackElement, 'error', 'Por favor, ingresa el texto del requisito');
        return;
      }
      
      try {
        // Verificar si ya existe un requisito con el mismo texto (evitar duplicados)
        const requisitosExistentes = Array.from(document.querySelectorAll('input[name="requisitos_contratacion"]'));
        for (const requisito of requisitosExistentes) {
          if (requisito.value.trim().toLowerCase() === textoRequisito.toLowerCase()) {
            console.log('[Debug] Requisito duplicado:', textoRequisito);
            mostrarFeedback(feedbackElement, 'error', `El requisito "${textoRequisito}" ya existe en la lista`);
            return;
          }
        }
        
        // Generar un ID único para este requisito
        contadorRequisitosPersonalizados++;
        const requisitoId = `requisito_custom_${contadorRequisitosPersonalizados}`;
        console.log('[Debug] ID generado:', requisitoId);
        
        // Crear contenedor para el nuevo requisito con el mismo estilo que los botones existentes
        const nuevoElemento = document.createElement('div');
        
        // Asignar id al elemento para poder depurarlo fácilmente
        nuevoElemento.id = `custom_item_${contadorRequisitosPersonalizados}`;
        
        // Aplicar las mismas clases que tienen los items existentes
        nuevoElemento.className = 'option-item';
        
        // Crear el HTML interno con la estructura correcta (checkbox + label)
        nuevoElemento.innerHTML = `
          <input type="checkbox" id="${requisitoId}" name="requisitos_contratacion" value="${textoRequisito}">
          <label for="${requisitoId}" class="option-label">${textoRequisito}</label>
        `;
        
        // Agregar a la cuadrícula de opciones
        optionsGrid.appendChild(nuevoElemento);
        
        // Añadir evento change al nuevo checkbox para actualizar validación y contador
        const nuevoCheckbox = document.getElementById(requisitoId);
        if (nuevoCheckbox) {
          nuevoCheckbox.checked = true; // Marcar como seleccionado automáticamente
          
          nuevoCheckbox.addEventListener('change', function() {
            console.log('[Debug] Cambio en checkbox personalizado:', this.checked);
            updateCompletedCounter();
            actualizarMensajeValidacion();
          });
        }
        
        // Limpiar y enfocar el campo de entrada
        nuevoRequisitoInput.value = '';
        nuevoRequisitoInput.focus();
        
        // Actualizar contador y validación
        updateCompletedCounter();
        actualizarMensajeValidacion();
        
        // Mostrar feedback de éxito
        mostrarFeedback(feedbackElement, 'success', `¡Requisito "${textoRequisito}" añadido!`);
        
        console.log('[Debug] Requisito añadido con éxito');
      } catch (error) {
        console.error('[Error] Error al añadir requisito:', error);
        mostrarFeedback(feedbackElement, 'error', `Error al añadir requisito: ${error.message || 'Error desconocido'}`);
      }
    }
    
    // Añadir eventos
    if (añadirRequisitoBtn) {
      añadirRequisitoBtn.addEventListener('click', añadirNuevoRequisito);
      console.log('[Debug] Evento click añadido al botón');
    }
    
    if (nuevoRequisitoInput) {
      nuevoRequisitoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          añadirNuevoRequisito();
        }
      });
      console.log('[Debug] Evento keypress añadido al input');
    }
    
    // Asegurar que se oculta el mensaje de error al iniciar
    actualizarMensajeValidacion();
  }
  
  // Función para obtener todos los requisitos seleccionados
  function obtenerRequisitosSeleccionados() {
    const requisitosChecks = document.querySelectorAll('input[name="requisitos_contratacion"]:checked');
    
    // Convertir a array y extraer información completa
    return Array.from(requisitosChecks).map(check => {
      // Verificar si es un requisito personalizado basado en el ID
      const esPersonalizado = check.id.startsWith('requisito_custom_');
      
      return {
        valor: check.value,
        esPersonalizado: esPersonalizado
      };
    });
  }
  
  // Inicializar campos de antigüedad
  function inicializarAntiguedad() {
    document.querySelectorAll('input[name="antiguedad"]').forEach(radio => {
      radio.addEventListener('change', function() {
        ocultarErrorCard(document.getElementById('antiguedad-card'));
        updateCompletedCounter();
      });
    });
    
    document.getElementById('anio_ingreso').addEventListener('input', function() {
      ocultarErrorCard(document.getElementById('antiguedad-card'));
      updateCompletedCounter();
    });
  }
  
  // Inicializar otros campos restantes
  function inicializarCamposRestantes() {
    // Tiempo primer empleo
    document.querySelectorAll('input[name="tiempo_primer_empleo"]').forEach(radio => {
      radio.addEventListener('change', function() {
        ocultarErrorCard(document.getElementById('tiempo-empleo-card'));
        updateCompletedCounter();
      });
    });
    
    // Ingreso
    document.querySelectorAll('input[name="ingreso"]').forEach(radio => {
      radio.addEventListener('change', function() {
        ocultarErrorCard(document.getElementById('ingreso-card'));
        updateCompletedCounter();
      });
    });
    
    // Nivel jerárquico
    document.querySelectorAll('input[name="nivel_jerarquico"]').forEach(radio => {
      radio.addEventListener('change', function() {
        ocultarErrorCard(document.getElementById('jerarquia-card'));
        updateCompletedCounter();
      });
    });
  }
  
  // Validar que el formulario esté completo
  function validarFormulario() {
    let isValid = true;
    
    // Limpiar errores anteriores
    document.querySelectorAll('.empleo-card').forEach(card => {
      ocultarErrorCard(card);
    });
    
    // Validar tiempo primer empleo
    if (!form.querySelector('input[name="tiempo_primer_empleo"]:checked')) {
      mostrarErrorCard(
        document.getElementById('tiempo-empleo-card'),
        'Por favor, selecciona una opción'
      );
      isValid = false;
    }
    
    // Validar medio para obtener empleo
    if (!form.querySelector('input[name="medio_obtener_empleo"]:checked')) {
      mostrarErrorCard(
        document.getElementById('medio-empleo-card'),
        'Por favor, selecciona una opción'
      );
      isValid = false;
    } else if (medioOtroRadio.checked && !document.getElementById('medio_otro_input').value.trim()) {
      mostrarErrorCard(
        document.getElementById('medio-empleo-card'),
        'Por favor, especifica el otro medio'
      );
      isValid = false;
    }
    
    // Validar requisitos de contratación
    // Verificar si hay al menos un requisito seleccionado
    const hayRequisitosSeleccionados = document.querySelectorAll('.options-grid input[type="checkbox"]:checked').length > 0;
    
    if (!hayRequisitosSeleccionados) {
      mostrarErrorCard(
        document.getElementById('requisitos-card'),
        'Por favor, selecciona al menos una opción'
      );
      isValid = false;
    }
    
    // Validar idioma
    if (!form.querySelector('input[name="idioma"]:checked')) {
      mostrarErrorCard(
        document.getElementById('idioma-card'),
        'Por favor, selecciona una opción'
      );
      isValid = false;
    } else if (idiomaOtroRadio.checked && !document.getElementById('idioma_otro_input').value.trim()) {
      mostrarErrorCard(
        document.getElementById('idioma-card'),
        'Por favor, especifica el otro idioma'
      );
      isValid = false;
    }
    
    // Validar antigüedad
    if (!form.querySelector('input[name="antiguedad"]:checked')) {
      mostrarErrorCard(
        document.getElementById('antiguedad-card'),
        'Por favor, selecciona una opción'
      );
      isValid = false;
    }
    
    if (!document.getElementById('anio_ingreso').value.trim()) {
      mostrarErrorCard(
        document.getElementById('antiguedad-card'),
        'Por favor, ingresa el año de ingreso'
      );
      isValid = false;
    }
    
    // Validar ingreso
    if (!form.querySelector('input[name="ingreso"]:checked')) {
      mostrarErrorCard(
        document.getElementById('ingreso-card'),
        'Por favor, selecciona una opción'
      );
      isValid = false;
    }
    
    // Validar nivel jerárquico
    if (!form.querySelector('input[name="nivel_jerarquico"]:checked')) {
      mostrarErrorCard(
        document.getElementById('jerarquia-card'),
        'Por favor, selecciona una opción'
      );
      isValid = false;
    }
    
    // Validar condición de trabajo
    if (!form.querySelector('input[name="condicion_trabajo"]:checked')) {
      mostrarErrorCard(
        document.getElementById('condicion-trabajo-card'),
        'Por favor, selecciona una opción'
      );
      isValid = false;
    } else if (condicionOtroRadio.checked && !document.getElementById('condicion_otro_input').value.trim()) {
      mostrarErrorCard(
        document.getElementById('condicion-trabajo-card'),
        'Por favor, especifica la otra condición'
      );
      isValid = false;
    }
    
    return isValid;
  }
  
  // Recopilar datos de requisitos de contratación (checkboxes)
  function obtenerRequisitosSeleccionados() {
    console.log('[Debug] Obteniendo todos los requisitos seleccionados en tiempo real');
    const seleccionados = [];
    
    // Obtener TODOS los checkboxes en tiempo real, no solo los iniciales
    const todosLosCheckboxes = document.querySelectorAll('input[name="requisitos_contratacion"]');
    console.log(`[Debug] Total de checkboxes encontrados: ${todosLosCheckboxes.length}`);
    
    todosLosCheckboxes.forEach(check => {
      if (check.checked) {
        // Determinar si es un requisito personalizado (tiene ID que comienza con requisito_custom_)
        const esPersonalizado = check.id.startsWith('requisito_custom_');
        console.log(`[Debug] Checkbox seleccionado: ${check.value}, personalizado: ${esPersonalizado}`);
        
        // Guardar como objeto con información adicional
        seleccionados.push({
          valor: check.value,
          esPersonalizado: esPersonalizado
        });
      }
    });
    
    console.log('[Debug] Requisitos seleccionados:', seleccionados);
    return seleccionados;
  }
  
  // Guardar datos solo en localStorage (no en Firebase)
  async function guardarDatosModulo4() {
    console.log('[Módulo 4] Guardando datos del formulario en localStorage');
    
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
        console.error('[Módulo 4] No hay usuario autenticado');
        return false;
      }
      
      console.log('[Módulo 4] Usuario autenticado al guardar:', user.email);
      
      const formData = {};
      
      // Recopilar datos del formulario
      formData.tiempo_primer_empleo = form.querySelector('input[name="tiempo_primer_empleo"]:checked')?.value || '';
      
      // Medio para obtener empleo
      formData.medio_obtener_empleo = form.querySelector('input[name="medio_obtener_empleo"]:checked')?.value || '';
      if (formData.medio_obtener_empleo === 'Otros') {
        formData.medio_otro = document.getElementById('medio_otro_input').value.trim();
        if (!formData.medio_otro) {
          return false;
        }
      }

      // Recopilar datos del formulario - Asegurarse que no haya valores undefined
      const datosModulo4 = {
        // Habilidades en idioma inglés
        habilidades: {
          hablar: parseInt(hablarSlider.value || 0),
          escribir: parseInt(escribirSlider.value || 0),
          leer: parseInt(leerSlider.value || 0),
          escuchar: parseInt(escucharSlider.value || 0)
        },
        
        // Datos del primer empleo
        primerEmpleo: {
          // Campos con los nombres corregidos según el HTML
          tiempo_transcurrido: form.querySelector('input[name="tiempo_primer_empleo"]:checked')?.value || null,
          medio_obtuvo: form.querySelector('input[name="medio_obtener_empleo"]:checked')?.value || null,
          medio_otro: (medioOtroRadio?.checked && medioOtroContainer.querySelector('input')) ? medioOtroContainer.querySelector('input').value : null,
          requisitos_contratacion: obtenerRequisitosSeleccionados() || [],
          // Nota: requisito_otro ya no se usa, ahora los requisitos personalizados se añaden directamente a la lista
          idioma_principal: form.querySelector('input[name="idioma"]:checked')?.value || null,
          idioma_otro: (idiomaOtroRadio?.checked && idiomaOtroContainer.querySelector('input')) ? idiomaOtroContainer.querySelector('input').value : null,
          antiguedad: form.querySelector('input[name="antiguedad"]:checked')?.value || null,
          anio_ingreso: document.getElementById('anio_ingreso')?.value || null,
          ingreso_mensual: form.querySelector('input[name="ingreso"]:checked')?.value || null,
          nivel_jerarquico: form.querySelector('input[name="nivel_jerarquico"]:checked')?.value || null,
          condicion_trabajo: form.querySelector('input[name="condicion_trabajo"]:checked')?.value || null,
          condicion_otro: (condicionOtroRadio?.checked && condicionOtroContainer.querySelector('input')) ? condicionOtroContainer.querySelector('input').value : null,
          jornada_laboral: form.querySelector('input[name="jornada_laboral"]:checked')?.value || null,
        },
        // Añadir ID de usuario para validación
        userId: user.uid
      };
      
      // Guardar solo en localStorage
      localStorage.setItem('modulo4_data', JSON.stringify(datosModulo4));
      console.log('[Módulo 4] Datos guardados en localStorage');
      
      // Ya no guardamos en Firebase en cada paso, solo cuando se complete toda la encuesta
      
      return true;
    } catch (error) {
      console.error('[Módulo 4] Error al guardar datos:', error);
      return false;
    }
  }
  
  // Aplicar datos al formulario
  function aplicarDatosAlFormulario(datos) {
    try {
      console.log('[Módulo 4] Aplicando datos al formulario:', datos);
      
      // Habilidades en idioma inglés
      if (datos.habilidades) {
        console.log('[Debug] Aplicando habilidades:', datos.habilidades);
        // Sliders de habilidades
        if (hablarSlider && hablarValue && datos.habilidades.hablar !== undefined) {
          hablarSlider.value = datos.habilidades.hablar;
          hablarValue.textContent = datos.habilidades.hablar;
          // Usar una función local para actualizar el progreso visual de los sliders
          const hablarProgress = hablarSlider.nextElementSibling?.querySelector('.slider-progress');
          if (hablarProgress) {
            const valorPorcentaje = (datos.habilidades.hablar / 10) * 100;
            hablarProgress.style.width = `${valorPorcentaje}%`;
          }
        }
        
        if (escribirSlider && escribirValue && datos.habilidades.escribir !== undefined) {
          escribirSlider.value = datos.habilidades.escribir;
          escribirValue.textContent = datos.habilidades.escribir;
          const escribirProgress = escribirSlider.nextElementSibling?.querySelector('.slider-progress');
          if (escribirProgress) {
            const valorPorcentaje = (datos.habilidades.escribir / 10) * 100;
            escribirProgress.style.width = `${valorPorcentaje}%`;
          }
        }
        
        if (leerSlider && leerValue && datos.habilidades.leer !== undefined) {
          leerSlider.value = datos.habilidades.leer;
          leerValue.textContent = datos.habilidades.leer;
          const leerProgress = leerSlider.nextElementSibling?.querySelector('.slider-progress');
          if (leerProgress) {
            const valorPorcentaje = (datos.habilidades.leer / 10) * 100;
            leerProgress.style.width = `${valorPorcentaje}%`;
          }
        }
        
        if (escucharSlider && escucharValue && datos.habilidades.escuchar !== undefined) {
          escucharSlider.value = datos.habilidades.escuchar;
          escucharValue.textContent = datos.habilidades.escuchar;
          const escucharProgress = escucharSlider.nextElementSibling?.querySelector('.slider-progress');
          if (escucharProgress) {
            const valorPorcentaje = (datos.habilidades.escuchar / 10) * 100;
            escucharProgress.style.width = `${valorPorcentaje}%`;
          }
        }
      }
      
      // Datos del primer empleo
      if (datos.primerEmpleo) {
        console.log('[Debug] Aplicando datos de primer empleo');
        
        // Tiempo transcurrido para obtener empleo
        if (datos.primerEmpleo.tiempo_transcurrido) {
          console.log(`[Debug] Intentando marcar tiempo transcurrido: ${datos.primerEmpleo.tiempo_transcurrido}`);
          
          // Nombre corregido del campo en HTML
          const tiempoRadio = document.querySelector(`input[name="tiempo_primer_empleo"][value="${datos.primerEmpleo.tiempo_transcurrido}"]`);
          
          if (tiempoRadio) {
            tiempoRadio.checked = true;
            console.log(`[Debug] Radio de tiempo marcado: ${datos.primerEmpleo.tiempo_transcurrido}`);
          } else {
            console.log(`[Debug] ERROR: No se encontró radio button para tiempo_primer_empleo con valor: ${datos.primerEmpleo.tiempo_transcurrido}`);
            // Mostrar todos los radio buttons disponibles para diagnóstico
            document.querySelectorAll('input[name="tiempo_primer_empleo"]').forEach(radio => {
              console.log(`[Debug] Radio de tiempo disponible: value="${radio.value}"`);
            });
          }
        }
        
        // Medio para obtener empleo
        if (datos.primerEmpleo.medio_obtuvo) {
          console.log(`[Debug] Intentando marcar medio para obtener empleo: ${datos.primerEmpleo.medio_obtuvo}`);
          
          // Nombre corregido del campo en el HTML
          const medioRadio = document.querySelector(`input[name="medio_obtener_empleo"][value="${datos.primerEmpleo.medio_obtuvo}"]`);
          
          if (medioRadio) {
            medioRadio.checked = true;
            console.log(`[Debug] Radio de medio marcado: ${datos.primerEmpleo.medio_obtuvo}`);
            if (datos.primerEmpleo.medio_obtuvo === 'Otros' && medioOtroContainer) {
              medioOtroContainer.style.display = 'flex';
              const medioOtroInput = medioOtroContainer.querySelector('input');
              if (medioOtroInput && datos.primerEmpleo.medio_otro) {
                medioOtroInput.value = datos.primerEmpleo.medio_otro;
              }
            }
          } else {
            console.log(`[Debug] ERROR: No se encontró radio button para medio_obtener_empleo con valor: ${datos.primerEmpleo.medio_obtuvo}`);
            // Mostrar todos los radio buttons disponibles para diagnóstico
            document.querySelectorAll('input[name="medio_obtener_empleo"]').forEach(radio => {
              console.log(`[Debug] Radio de medio disponible: value="${radio.value}"`);
            });
          }
        }
        
        // Requisitos de contratación
        if (datos.primerEmpleo.requisitos_contratacion && Array.isArray(datos.primerEmpleo.requisitos_contratacion)) {
          console.log('[Debug] Procesando requisitos guardados:', datos.primerEmpleo.requisitos_contratacion);
          
          datos.primerEmpleo.requisitos_contratacion.forEach(req => {
            // Determinar si estamos usando el nuevo formato (objeto con valor y esPersonalizado) o el antiguo (string)
            let valorRequisito, esPersonalizado;
            
            if (typeof req === 'object' && req !== null) {
              // Nuevo formato
              valorRequisito = req.valor;
              esPersonalizado = req.esPersonalizado;
            } else {
              // Formato antiguo (cadena simple)
              valorRequisito = req;
              esPersonalizado = false;
            }
            
            console.log(`[Debug] Procesando requisito: ${valorRequisito}, personalizado: ${esPersonalizado}`);
            
            // Intentar encontrar un checkbox existente para este requisito
            // Importante: solo escapa los caracteres especiales en el selector de CSS
            const valorEscapado = valorRequisito.replace(/"/g, '\\"').replace(/'/g, "\\'")
            const checkBox = document.querySelector(`input[name="requisitos_contratacion"][value="${valorEscapado}"]`);
            
            if (checkBox) {
              // Si existe un checkbox para este requisito, marcarlo
              checkBox.checked = true;
              console.log(`[Debug] Checkbox existente marcado: ${valorRequisito}`);
            } else if (esPersonalizado || !checkBox) { // Si es personalizado o no se encontró el checkbox
              // Si no existe un checkbox para este requisito, crearlo (probablemente es personalizado)
              const requisitosSectionCard = document.getElementById('requisitos-card');
              const requisitosGrid = requisitosSectionCard ? requisitosSectionCard.querySelector('.options-grid') : null;
              
              if (requisitosGrid) {
                console.log(`[Debug] Reconstruyendo requisito personalizado: ${valorRequisito}`);
                
                // Generar ID único para este requisito personalizado - usar un patrón más estable
                // En lugar de usar Math.random(), usaremos una codificación del texto para hacer más predecible el ID
                let hashedValue = 0;
                for (let i = 0; i < valorRequisito.length; i++) {
                  hashedValue += valorRequisito.charCodeAt(i);
                }
                const requisitoId = `requisito_custom_${hashedValue}`;
                
                // Comprobar si ya existe un elemento con ese ID (para evitar duplicados)
                if (!document.getElementById(requisitoId)) {
                  // Crear nuevo elemento con el mismo estilo que los botones existentes
                  const nuevoElemento = document.createElement('div');
                  nuevoElemento.className = 'option-item';
                  nuevoElemento.innerHTML = `
                    <input type="checkbox" id="${requisitoId}" name="requisitos_contratacion" value="${valorRequisito}" checked>
                    <label for="${requisitoId}" class="option-label">${valorRequisito}</label>
                  `;
                  
                  // Añadir el elemento a la cuadrícula de requisitos
                  requisitosGrid.appendChild(nuevoElemento);
                  console.log(`[Debug] Requisito personalizado añadido a la cuadrícula: ${valorRequisito} con ID: ${requisitoId}`);
                  
                  // Agregar evento de cambio al checkbox
                  const checkbox = nuevoElemento.querySelector('input[type="checkbox"]');
                  if (checkbox) {
                    checkbox.addEventListener('change', function() {
                      console.log(`[Debug] Cambio en requisito personalizado: ${this.checked}`);
                      updateCompletedCounter();
                    });
                  }
                } else {
                  // Si ya existe, simplemente marcarlo
                  document.getElementById(requisitoId).checked = true;
                  console.log(`[Debug] Requisito personalizado encontrado y marcado: ${valorRequisito}`);
                }
              }
            }
          });
          
          // Actualizar el mensaje de validación después de cargar los requisitos
          const validationElement = document.getElementById('requisitos-validation');
          if (validationElement) {
            const haySeleccionados = document.querySelectorAll('input[name="requisitos_contratacion"]:checked').length > 0;
            validationElement.style.display = haySeleccionados ? 'none' : 'block';
          }
        }
        
        // Idioma principal 
        if (datos.primerEmpleo.idioma_principal) {
          console.log(`[Debug] Intentando marcar idioma principal: ${datos.primerEmpleo.idioma_principal}`);
          
          // Nombre corregido del campo en el HTML
          const idiomaRadio = document.querySelector(`input[name="idioma"][value="${datos.primerEmpleo.idioma_principal}"]`);
          
          if (idiomaRadio) {
            idiomaRadio.checked = true;
            console.log(`[Debug] Radio de idioma marcado: ${datos.primerEmpleo.idioma_principal}`);
            
            if (datos.primerEmpleo.idioma_principal === 'Otros' && idiomaOtroContainer) {
              idiomaOtroContainer.style.display = 'flex';
              const idiomaOtroInput = idiomaOtroContainer.querySelector('input');
              if (idiomaOtroInput && datos.primerEmpleo.idioma_otro) {
                idiomaOtroInput.value = datos.primerEmpleo.idioma_otro;
              }
            }
          } else {
            console.log(`[Debug] ERROR: No se encontró radio button para idioma con valor: ${datos.primerEmpleo.idioma_principal}`);
            // Mostrar todos los radio buttons disponibles para diagnóstico
            document.querySelectorAll('input[name="idioma"]').forEach(radio => {
              console.log(`[Debug] Radio de idioma disponible: value="${radio.value}"`);
            });
          }
        }
        
        // Antigüedad (radio buttons)
        if (datos.primerEmpleo.antiguedad) {
          console.log(`[Debug] Intentando marcar antigüedad: ${datos.primerEmpleo.antiguedad}`);
          
          // Usar el nombre correcto según el HTML
          const antiguedadRadio = document.querySelector(`input[name="antiguedad"][value="${datos.primerEmpleo.antiguedad}"]`);
          
          if (antiguedadRadio) {
            antiguedadRadio.checked = true;
            console.log(`[Debug] Radio de antigüedad marcado: ${datos.primerEmpleo.antiguedad}`);
          } else {
            console.log(`[Debug] ERROR: No se encontró radio button para antigüedad con valor: ${datos.primerEmpleo.antiguedad}`);
            // Mostrar todas las opciones de antigüedad disponibles
            document.querySelectorAll('input[name="antiguedad"]').forEach(radio => {
              console.log(`[Debug] Radio de antigüedad disponible: value="${radio.value}"`);
            });
          }
        }
        
        // Año de ingreso (campo de texto)
        if (datos.primerEmpleo.anio_ingreso) {
          console.log(`[Debug] Intentando establecer año de ingreso: ${datos.primerEmpleo.anio_ingreso}`);
          
          const anioInput = document.getElementById('anio_ingreso');
          
          if (anioInput) {
            anioInput.value = datos.primerEmpleo.anio_ingreso;
            console.log(`[Debug] Año de ingreso establecido: ${datos.primerEmpleo.anio_ingreso}`);
          } else {
            console.log('[Debug] ERROR: No se encontró el input para año de ingreso');
          }
        }
        
        // Ingreso mensual
        if (datos.primerEmpleo.ingreso_mensual) {
          console.log(`[Debug] Intentando marcar ingreso mensual: ${datos.primerEmpleo.ingreso_mensual}`);
          
          // Nombre corregido del campo según el HTML
          const ingresoRadio = document.querySelector(`input[name="ingreso"][value="${datos.primerEmpleo.ingreso_mensual}"]`);
          
          if (ingresoRadio) {
            ingresoRadio.checked = true;
            console.log(`[Debug] Radio de ingreso mensual marcado: ${datos.primerEmpleo.ingreso_mensual}`);
          } else {
            console.log(`[Debug] ERROR: No se encontró radio button para ingreso con valor: ${datos.primerEmpleo.ingreso_mensual}`);
            // Mostrar todos los radio buttons disponibles para diagnóstico
            document.querySelectorAll('input[name="ingreso"]').forEach(radio => {
              console.log(`[Debug] Radio de ingreso disponible: value="${radio.value}"`);
            });
          }
        }
        
        // Nivel jerárquico
        if (datos.primerEmpleo.nivel_jerarquico) {
          const nivelRadio = document.querySelector(`input[name="nivel_jerarquico"][value="${datos.primerEmpleo.nivel_jerarquico}"]`);
          if (nivelRadio) {
            nivelRadio.checked = true;
            console.log(`[Debug] Radio de nivel jerárquico marcado: ${datos.primerEmpleo.nivel_jerarquico}`);
          }
        }
        
        // Condición de trabajo
        if (datos.primerEmpleo.condicion_trabajo) {
          const condicionRadio = document.querySelector(`input[name="condicion_trabajo"][value="${datos.primerEmpleo.condicion_trabajo}"]`);
          if (condicionRadio) {
            condicionRadio.checked = true;
            console.log(`[Debug] Radio de condición de trabajo marcado: ${datos.primerEmpleo.condicion_trabajo}`);
            
            if (datos.primerEmpleo.condicion_trabajo === 'Otros' && condicionOtroContainer) {
              condicionOtroContainer.style.display = 'flex';
              const condicionOtroInput = condicionOtroContainer.querySelector('input');
              if (condicionOtroInput && datos.primerEmpleo.condicion_otro) {
                condicionOtroInput.value = datos.primerEmpleo.condicion_otro;
              }
            }
          }
        }
        
        // Jornada laboral
        if (datos.primerEmpleo.jornada_laboral) {
          const jornadaRadio = document.querySelector(`input[name="jornada_laboral"][value="${datos.primerEmpleo.jornada_laboral}"]`);
          if (jornadaRadio) {
            jornadaRadio.checked = true;
            console.log(`[Debug] Radio de jornada laboral marcado: ${datos.primerEmpleo.jornada_laboral}`);
          }
        }
      }
      
      // Actualizar el contador de preguntas completadas
      updateCompletedCounter();
      console.log('[Módulo 4] Datos aplicados al formulario');
      return true;
    } catch (error) {
      console.error('[Módulo 4] Error al aplicar datos al formulario:', error);
      return false;
    }
  }
  
  // Cargar datos desde Firebase
  async function cargarDatosDesdeFirebase() {
    try {
      console.log('[Módulo 4] Intentando cargar datos desde Firebase');
      
      // Esperar a que la autenticación se inicialice completamente
      const user = await new Promise(authResolve => {
        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
          unsubscribe(); // Dejar de escuchar cambios de autenticación
          authResolve(user);
        });
      });
      
      // Verificar si hay un usuario autenticado
      if (!user) {
        console.log('[Módulo 4] Usuario no autenticado, no se cargó de Firebase');
        return null;
      }
      
      console.log('[Módulo 4] Usuario autenticado:', user.email);
      
      // Referencia a la base de datos donde se almacena el historial de encuestas
      const db = firebase.firestore();
      const historialEncuestasRef = db.collection('usuarios').doc(user.uid).collection('historialEncuestas');
      
      // Consultar la última encuesta completada
      const querySnapshot = await historialEncuestasRef.orderBy('fechaCompletado', 'desc').limit(1).get();
      
      if (!querySnapshot.empty) {
        const docMasReciente = querySnapshot.docs[0];
        if (docMasReciente.data() && docMasReciente.data().primerEmpleo) {
          const data = docMasReciente.data().primerEmpleo;
          console.log('[Módulo 4] Datos de la última encuesta encontrados en Firebase:', data);
          return data;
        } else {
          console.log('[Módulo 4] La última encuesta no contiene datos de primer empleo.');
          return null;
        }
      } else {
        console.log('[Módulo 4] No se encontraron encuestas previas en el historial de Firebase');
        return null;
      }
    } catch (error) {
      console.error('[Módulo 4] Error al cargar desde Firebase:', error);
      return null;
    }
  }
  
  // Cargar datos guardados (primero intenta desde Firebase, luego localStorage)
  async function cargarDatosModulo4() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        console.log('[Módulo 4] Usuario no autenticado');
        return false;
      }

      // 1. Intentar cargar desde Firebase primero
      const datosFirebase = await cargarDatosDesdeFirebase();
      if (datosFirebase) {
        console.log('[Módulo 4] Usando datos de Firebase');
        return aplicarDatosAlFormulario(datosFirebase);
      }
      
      // 2. Si no hay datos en Firebase, intentar desde localStorage
      const dataStr = localStorage.getItem('modulo4_data');
      if (!dataStr) {
        console.log('[Módulo 4] No hay datos guardados en localStorage');
        return false;
      }
      
      const datosLocal = JSON.parse(dataStr);
      
      // Verificar que los datos pertenecen al usuario actual
      if (datosLocal.userId && datosLocal.userId !== user.uid) {
        console.log('[Módulo 4] Los datos en localStorage no pertenecen al usuario actual');
        // Limpiar datos que no corresponden al usuario actual
        localStorage.removeItem('modulo4_data');
        return false;
      }
      
      console.log('[Módulo 4] Usando datos de localStorage');
      return aplicarDatosAlFormulario(datosLocal);
      
    } catch (error) {
      console.error('[Módulo 4] Error al cargar datos:', error);
      return false;
    }
  }
  
  // Configurar el botón de navegación (previo)
  if (prevBtn) {
    console.log('[Módulo 4] Configurando evento click para botón Anterior');
    
    // Eliminamos eventos anteriores que pudieran existir
    prevBtn.replaceWith(prevBtn.cloneNode(true));
    // Obtener la nueva referencia después de clonar
    const prevBtnNew = document.getElementById('prevBtn');
    
    prevBtnNew.addEventListener('click', function() {
      console.log('[Módulo 4] Botón Anterior clickeado');
      
      // Guardar datos antes de navegar
      guardarDatosModulo4();
      
      // Redireccionar al módulo anterior
      window.location.href = 'modulo3.html';
      
      return false;
    });
  }
  
  // Configurar botón Siguiente para ir al módulo 5
  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      // Validar formulario
      if (!validarFormulario()) {
        return;
      }
      
      // Guardar datos antes de continuar
      const guardadoExitoso = await guardarDatosModulo4();
      
      if (guardadoExitoso) {
        console.log('[Módulo 4] Datos guardados correctamente, navegando al módulo 5');
        
        // Redireccionar al módulo 5 (datos de la empresa)
        window.location.href = 'modulo5.html';
      } else {
        alert('Hubo un problema al guardar tus datos. Por favor, intenta nuevamente.');
      }
    });
  }
  
  // Inicializar componentes
  inicializarSliders();
  inicializarOpcionesOtros();
  inicializarRequisitos();
  inicializarAntiguedad();
  inicializarCamposRestantes();
  
  // Verificar elegibilidad y cargar datos
  redirigirSiNoElegible();
  cargarDatosModulo4();
};

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Proteger la ruta (redireccionar si no hay sesión)
  const auth = firebase.auth();
  auth.onAuthStateChanged(user => {
    if (user) {
      // Usuario autenticado, inicializar la UI
      initModulo4UI();
    } else {
      // No hay sesión, redireccionar al login
      window.location.href = "auth.html";
    }
  });
  
  // No implementamos el cierre de sesión aquí porque se maneja de forma centralizada en navbar-loader.js
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
