/* =====================================================
    Módulo 1: Lógica Principal de la Encuesta
    ===================================================== */

console.log('[Módulo 1] JS cargado');

// La funcionalidad del wizard ahora se encuentra en /js/wizard.js
// La lógica de validaciones de campos se encuentra en modulo1-validaciones.js
// La lógica de catálogos (carreras, idiomas, paquetes) se encuentra en modulo1-catalogos.js

/* ---------- Init dinámica ------------------------ */
window.initEncuestaUI = function() {
  console.log('[Módulo 1] initEncuestaUI llamada');
  
  // Inicializar elementos DOM principales necesarios para este módulo
  const selCarrera = document.getElementById('carrera');
  const listIdiomas = document.getElementById('idiomas-list');
  const addIdiomaBtn = document.getElementById('add-idioma');
  const listPaquetes = document.getElementById('paquetes-list');
  const addPaqueteBtn = document.getElementById('add-paquete');
  const nextBtn = document.getElementById('nextBtn');
  
  /* Inicializar validaciones de campos (definidas en modulo1-validaciones.js) */
  if (typeof inicializarValidacionesCamposModulo1 === 'function') {
    inicializarValidacionesCamposModulo1();
  } else {
    console.error('[Módulo 1] La función inicializarValidacionesCamposModulo1 no está definida. Asegúrate de que modulo1-validaciones.js se carga antes que modulo1.js');
  }
  
  /* Inicializar catálogos, idiomas y paquetes (definidos en modulo1-catalogos.js) */
  // Se pasa 'null' inicialmente para datosModulo1, ya que la carga se hace después.
  // La función de inicialización de catálogos manejará la adición de elementos por defecto si datosModulo1 es null.
  if (typeof inicializarCatalogosModulo1 === 'function') {
    // Los datos para repoblar catálogos se pasarán después de cargarlos.
  } else {
    console.error('[Módulo 1] La función inicializarCatalogosModulo1 no está definida. Asegúrate de que modulo1-catalogos.js se carga antes que modulo1.js');
  }

  /* Funciones para guardar y cargar datos */
  // Convertida a async para manejar el guardado en Firestore
  async function guardarDatosModulo1() {
    console.log('[Módulo 1] Iniciando guardado de datos para Módulo 1...');

    // Validar el formulario antes de intentar guardar
    if (typeof esFormularioModulo1Valido === 'function') {
      if (!esFormularioModulo1Valido()) {
        console.log('[Módulo 1] Validación fallida. No se guardan datos ni se navega.');
        return false; // Detener la ejecución y la navegación
      }
    } else {
      console.warn('[Módulo 1] La función esFormularioModulo1Valido no está definida. Continuando sin validación exhaustiva previa al guardado.');
      // Considera si quieres retornar false aquí también o permitir continuar bajo advertencia.
      // Por ahora, permitiremos continuar para no romper el flujo si algo sale mal con la carga del script de validaciones.
    }

    const form = document.querySelector('form');
    const formData = {};

    // Recopilar inputs de texto, email, date, etc.
    form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="month"], input[type="number"]').forEach(input => {
      if (input.name && !input.name.startsWith('idioma_') && !input.name.startsWith('paquete_')) {
        formData[input.name] = input.value;
      }
    });

    // Recopilar inputs de tipo radio (seleccionados)
    form.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
      if (radio.name) {
        formData[radio.name] = radio.value;
      }
    });

    // Recopilar inputs de tipo checkbox (marcados y no marcados)
    const checkboxGroups = {};
    form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      if (checkbox.name) {
        if (checkbox.name.includes('[]')) {
          // Grupo de checkboxes (array)
          const baseName = checkbox.name.replace('[]', '');
          if (!checkboxGroups[baseName]) {
            checkboxGroups[baseName] = [];
          }
          if (checkbox.checked) {
            checkboxGroups[baseName].push(checkbox.value);
          }
        } else {
          // Checkbox individual
          formData[checkbox.name] = checkbox.checked;
        }
      }
    });

    // Añadir grupos de checkboxes al formData
    Object.assign(formData, checkboxGroups);

    // Recopilar selects básicos
    form.querySelectorAll('select').forEach(select => {
      if (select.name && !select.name.startsWith('idioma_') && !select.name.startsWith('paquete_')) {
          formData[select.name] = select.value;
        }
    });

    // Recopilar idiomas
    const idiomas = [];
    form.querySelectorAll('.idioma-item').forEach(item => {
      const select = item.querySelector('select');
      const pctInput = item.querySelector('input[name^="idioma_pct_"]');
      const otroInput = item.querySelector('input[name^="idioma_otro_"]');
      
      if (select && pctInput) {
        idiomas.push({
          idioma: select.value,
          porcentaje: pctInput.value,
          otro: select.value === 'Otro' && otroInput ? otroInput.value : ''
        });
      }
    });

    // Recopilar paquetes
    const paquetes = [];
    form.querySelectorAll('.paquete-item').forEach(item => {
      const select = item.querySelector('select');
      const otroInput = item.querySelector('input[name^="paquete_otro_"]');
      
      if (select) {
        paquetes.push({
          paquete: select.value,
          otro: select.value === 'Otro' && otroInput ? otroInput.value : ''
        });
      }
    });

    formData.idiomas = idiomas;
    formData.paquetes = paquetes;

    try {
      // Añadir el ID de usuario para validación si está autenticado
      const user = firebase.auth().currentUser;
      if (user) {
        formData.userId = user.uid; // Para asociar los datos de localStorage al usuario si es necesario después
      }

      // Guardar en localStorage
      localStorage.setItem('modulo1_data', JSON.stringify(formData));
      console.log('[Módulo 1] Datos del formulario guardados en localStorage:', formData);

      // Intentar guardar UserRol en Firestore
      if (user) {
        // Asegurarse de que la clase UserRol está disponible
        if (typeof UserRol === 'undefined' || typeof UserRol.fromModulo1Data === 'undefined') {
          console.error('[Módulo 1] La clase UserRol o el método fromModulo1Data no están definidos. Asegúrate de que UserRol.js se carga correctamente.');
          // mostrarMensajeError('Error interno: No se pudo procesar la información del perfil.');
          return false; // Fallo crítico
        }

        const userRolInstance = UserRol.fromModulo1Data(formData, user.uid, user.email);

        if (!userRolInstance) {
          console.error('[Módulo 1] No se pudo crear la instancia de UserRol a partir de los datos del formulario.');
          // mostrarMensajeError('Error al procesar datos del perfil. Verifica la información ingresada.');
          return false; // Fallo crítico
        }

        const userRolFirestoreData = userRolInstance.toFirestore();
        const userDocRef = firebase.firestore().collection('usuarios').doc(user.uid);

        await userDocRef.set(userRolFirestoreData, { merge: true });
        console.log('[Módulo 1] UserRol guardado/actualizado en Firestore:', userRolFirestoreData);

        return true; // Todo exitoso: localStorage y Firestore

      } else {
        console.error('[Módulo 1] Usuario no autenticado. No se puede guardar UserRol en Firestore.');
        // Considerar si mostrarMensajeError es apropiado aquí o si el flujo general lo manejará.
        // Por ahora, nos aseguramos de que la navegación no proceda si el guardado de UserRol es crítico.
        return false; // Fallo crítico si el guardado en Firestore es esencial para Módulo 1
      }

    } catch (error) {
      console.error('[Módulo 1] Error al guardar UserRol en Firestore:', error);
      // Dependiendo de la criticidad, podrías querer mostrar un mensaje al usuario.
      // mostrarMensajeError('Hubo un problema al guardar tu información de perfil en la nube. Tus datos locales se guardaron.');
      // Si el guardado en Firestore es CRÍTICO para la navegación, retornar false.
      // Si solo es un plus y el localStorage es suficiente para continuar, podrías retornar true.
      // Para este caso, si se intenta guardar el UserRol, se asume que es importante.
      return false; // Indicar fallo en el guardado de Firestore
      // Este catch ahora solo cubriría errores catastróficos al intentar leer del form o escribir en localStorage.
      console.error('[Módulo 1] Error catastrófico durante guardarDatosModulo1 (localStorage o DOM):', error);
      alert('Se produjo un error inesperado al intentar guardar los datos localmente. Por favor, recarga la página e inténtalo de nuevo.');
      return false; // Indicar fallo para que wizard.js no navegue
    }
  }
  
  // Asegurarnos de que Usuario.js está cargado (contiene window.parseUsuarioFirestore)
  // Verificar si el script se cargó correctamente
  try {
    if (typeof window.parseUsuarioFirestore !== 'function') {
      console.warn('[Módulo 1] Advertencia: window.parseUsuarioFirestore no está disponible como una función.');
    } else {
      console.log('[Módulo 1] parseUsuarioFirestore cargada correctamente.');
    }
  } catch (e) {
    console.error('[Módulo 1] Error al verificar parseUsuarioFirestore:', e);
  }
  

  // Función para aplicar los datos del formulario
  function aplicarDatosAlFormulario(data) {
    if (!data) {
      return false;
    }
    
    try {
      const form = document.querySelector('form');
      
      // Restaurar valores para inputs de texto, email, tel, date
      for (const [name, value] of Object.entries(data)) {
        if (name !== 'idiomas' && name !== 'paquetes') {
          // Manejar inputs de texto, email, tel, date, month, etc.
          const textInputs = form.querySelectorAll(`input[name="${name}"]:not([type="radio"]):not([type="checkbox"])`);
          textInputs.forEach(input => {
            input.value = value;
          });
          
          // Manejar selects
          const selects = form.querySelectorAll(`select[name="${name}"]`);
          selects.forEach(select => {
            select.value = value;
          });
          
          // Manejar radio buttons
          const radioInputs = form.querySelectorAll(`input[type="radio"][name="${name}"]`);
          radioInputs.forEach(radio => {
            if (radio.value === value) {
              radio.checked = true;
            }
          });
          
          // Manejar checkboxes individuales
          const checkboxes = form.querySelectorAll(`input[type="checkbox"][name="${name}"]:not([name$="[]"])`);
          checkboxes.forEach(checkbox => {
            // Si el valor es booleano, lo usamos directamente
            if (typeof value === 'boolean') {
              checkbox.checked = value;
            }
            // Si el valor es el mismo que el del checkbox
            else if (checkbox.value === value) {
              checkbox.checked = true;
            }
          });
          
          // Manejar grupos de checkboxes
          if (Array.isArray(value)) {
            const checkboxGroup = form.querySelectorAll(`input[type="checkbox"][name="${name}[]"]`);
            checkboxGroup.forEach(checkbox => {
              checkbox.checked = value.includes(checkbox.value);
            });
          }
        }
      }
      
      // La recreación de idiomas y paquetes desde 'data' ahora la maneja inicializarCatalogosModulo1
      console.log('[Módulo 1] Datos generales aplicados al formulario. Idiomas/Paquetes se manejan por inicializarCatalogosModulo1.');
      return true;
    } catch (error) {
      console.error('[Módulo 1] Error al aplicar datos:', error);
      return false;
    }
  }
  
  // Cargar datos guardados del módulo 1 (primero intenta desde Firebase, luego localStorage)
  async function cargarDatosModulo1() {
    let datosParaCatalogos = null;
    try {
      // 1. Intentar cargar desde Firebase primero
      const datosFirebase = await cargarDatosDesdeFirebase();
      if (datosFirebase) {
        console.log('[Módulo 1] Usando datos de Firebase');
        aplicarDatosAlFormulario(datosFirebase); // Aplica campos generales
        datosParaCatalogos = datosFirebase; // Guarda para catálogos
      } else {
        // 2. Si no hay datos en Firebase, intentar desde localStorage
        const dataStr = localStorage.getItem('modulo1_data');
        if (dataStr) {
          const datosLocal = JSON.parse(dataStr);
          console.log('[Módulo 1] Usando datos de localStorage');
          aplicarDatosAlFormulario(datosLocal); // Aplica campos generales
          datosParaCatalogos = datosLocal; // Guarda para catálogos
        } else {
          console.log('[Módulo 1] No hay datos guardados en localStorage ni Firebase.');
        }
      }
    } catch (error) {
      console.error('[Módulo 1] Error al cargar datos:', error);
    }
    return datosParaCatalogos; // Devuelve los datos completos (o null) para inicializarCatalogosModulo1
  }
  
  // Los event listeners para addIdiomaBtn y addPaqueteBtn se configuran en inicializarCatalogosModulo1.
  
  // Configurar el botón Siguiente para que wizard.js llame a nuestra función de guardado
  if (nextBtn) {
    console.log('[Módulo 1] Asignando guardarDatosModulo1 a nextBtn._onBeforeNavigate.');
    // Hacemos que guardarDatosModulo1 sea la función que wizard.js debe 'await'
    // guardarDatosModulo1 ya es async y devuelve true/false.
    nextBtn._onBeforeNavigate = guardarDatosModulo1;
  }
  
  // Intentar cargar datos guardados y aplicarlos
  cargarDatosModulo1().then(datosCargados => {
    // Ahora que los datos (si existen) han sido aplicados a los campos generales,
    // inicializamos los catálogos, pasándoles estos datos para que puedan repoblarse correctamente.
    if (typeof inicializarCatalogosModulo1 === 'function') {
      inicializarCatalogosModulo1(selCarrera, listIdiomas, addIdiomaBtn, listPaquetes, addPaqueteBtn, datosCargados);
    } else {
      console.error('[Módulo 1] La función inicializarCatalogosModulo1 no está definida en este punto.');
    }
    // Actualizar contador después de que todo se haya cargado e inicializado
    actualizarContadorCamposCompletados(); 
  }).catch(error => {
    console.error("[Módulo 1] Error final durante la carga y aplicación de datos o inicialización de catálogos:", error);
    // Incluso si hay un error, intentar inicializar catálogos sin datos previos
    if (typeof inicializarCatalogosModulo1 === 'function') {
      inicializarCatalogosModulo1(selCarrera, listIdiomas, addIdiomaBtn, listPaquetes, addPaqueteBtn, null);
    }
    actualizarContadorCamposCompletados();
  });


  // Función para contar campos completados y actualizar el contador
  function actualizarContadorCamposCompletados() {
    const form = document.querySelector('form');
    let camposCompletados = 0;
    const totalCampos = 15; // Total de campos principales en el formulario
    
    // Contar campos de texto, email, tel completados
    form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="month"]').forEach(input => {
      if (input.value && input.value.trim() !== '') {
        camposCompletados++;
      }
    });
    
    // Contar radio buttons completados (por grupo)
    const radioGrupos = {};
    form.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
      if (radio.name && !radioGrupos[radio.name]) {
        radioGrupos[radio.name] = true;
        camposCompletados++;
      }
    });
    
    // Contar selects completados
    form.querySelectorAll('select').forEach(select => {
      if (select.value && select.value !== '' && !select.name.startsWith('idioma_') && !select.name.startsWith('paquete_')) {
        camposCompletados++;
      }
    });
    
    // Verificar si hay al menos un idioma agregado
    if (listIdiomas.querySelectorAll('.idioma-item').length > 0) {
      camposCompletados++;
    }
    
    // Verificar si hay al menos un paquete agregado
    if (listPaquetes.querySelectorAll('.paquete-item').length > 0) {
      camposCompletados++;
    }
    
    // Limitar el contador al máximo de campos
    camposCompletados = Math.min(camposCompletados, totalCampos);
    
    // Actualizar el contador en la interfaz
    const contadorElemento = document.getElementById('questions-completed');
    if (contadorElemento) {
      contadorElemento.textContent = camposCompletados;
    }
  }
  
  // Configurar listeners para actualizar el contador cuando haya cambios
  function configurarEventosParaContador() {
    const form = document.querySelector('form');
    
    // Para inputs (text, email, tel, date, month)
    form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="month"]').forEach(input => {
      input.addEventListener('change', actualizarContadorCamposCompletados);
      input.addEventListener('input', actualizarContadorCamposCompletados);
    });
    
    // Para radio buttons
    form.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', actualizarContadorCamposCompletados);
    });
    
    // Para selects
    form.querySelectorAll('select').forEach(select => {
      select.addEventListener('change', actualizarContadorCamposCompletados);
    });
    
    // Para cuando se agregan o quitan idiomas/paquetes
    addIdiomaBtn.addEventListener('click', actualizarContadorCamposCompletados);
    addPaqueteBtn.addEventListener('click', actualizarContadorCamposCompletados);
    
    // Observador de mutaciones para detectar cuando se eliminan elementos
    const observer = new MutationObserver(actualizarContadorCamposCompletados);
    observer.observe(listIdiomas, { childList: true });
    observer.observe(listPaquetes, { childList: true });
  }
  
  // Inicializar el contador
  actualizarContadorCamposCompletados();
  
  // Configurar eventos para actualizar el contador
  configurarEventosParaContador();
};

