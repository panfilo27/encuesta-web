/* =====================================================
   Módulo de encuesta: Integración con Firebase
   ===================================================== */

console.log('[Encuesta Firebase] JS cargado');

/* ---------- 1. Inicialización de la encuesta ---------- */
window.initEncuestaForm = function() {
  console.log('[Encuesta Firebase] initEncuestaForm llamada');

  // Inicializar la UI del formulario desde modulo1.js
  if (typeof window.initEncuestaUI === 'function') {
    window.initEncuestaUI();
  } else {
    console.error('[Encuesta Firebase] Error: initEncuestaUI no está disponible. Verifica que modulo1.js esté cargado.');
  }

  /* Autenticación y llenado del campo email con Firebase */
  console.log('[Encuesta Firebase] Obteniendo información del usuario...');
  if(window.firebase?.auth) {
    // Intenta obtener el usuario actual inmediatamente
    let u = firebase.auth().currentUser;
    
    const fillEmailField = function(user) {
      if(!user) {
        console.warn('[Encuesta Firebase] Usuario no disponible');
        return;
      }
      console.log('[Encuesta Firebase] Usuario autenticado:', user.email);
      const eI = document.getElementById('email');
      if(!eI) {
        console.error('[Encuesta Firebase] Campo de email no encontrado');
        return setTimeout(() => fillEmailField(user), 100);
      }
      eI.value = user.email;
      eI.disabled = true;
      eI.style.background = '#eee';
      let h = document.getElementById('email-hidden');
      if(!h) {
        h = document.createElement('input');
        h.type = 'hidden';
        h.name = 'email';
        h.id = 'email-hidden';
        eI.parentNode.appendChild(h);
      }
      h.value = user.email;
    };

    // Si el usuario ya está cargado, úsalo
    if(u) {
      fillEmailField(u);
    } else {
      // Si no, espera a la autenticación
      firebase.auth().onAuthStateChanged(function(user) {
        fillEmailField(user);
      });
    }
  }

  console.log('[Encuesta Firebase] Inicialización completada');
};

/* ---------- 2. Envío del formulario a Firebase --------- */
const registroForm = document.getElementById('registro-form');
if (registroForm) {
  registroForm.onsubmit = async function(e) {
  e.preventDefault();
  const msg = document.getElementById('registro-message'); 
  msg.textContent = ''; 
  msg.className = 'message';

  // Verificar usuario autenticado
  const user = firebase.auth().currentUser;
  if(!user) {
    msg.textContent = 'No hay usuario autenticado.';
    msg.classList.add('error');
    return;
  }

  // Validaciones de formulario
  const f = e.target, errors = [];

  // Validaciones de campos específicos
  if(!/^\d{10}$/.test(f.telefono.value)) 
    errors.push('El teléfono debe tener 10 dígitos.');
  
  if(f.telCasa.value && !/^\d{10}$/.test(f.telCasa.value)) 
    errors.push('El Tel. de casa debe tener 10 dígitos.');
  
  if(!/^\d{8,10}$/.test(f.noControl.value)) 
    errors.push('El número de control debe tener entre 8 y 10 dígitos.');
  
  if(!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/.test(f.curp.value.trim().toUpperCase()))
    errors.push('El CURP no es válido.');

  /* Procesamiento de Idiomas */
  const idiomas = [], setI = new Set();
  document.querySelectorAll('#idiomas-list .input-inline').forEach(div => {
    let id = div.querySelector('select').value;
    if(id === 'Otro') id = div.querySelector('input[type="text"]').value.trim();
    const pct = div.querySelector('input[type="number"]').value;
    if(id && pct) {
      if(setI.has(id)) errors.push('No puedes repetir idiomas.');
      setI.add(id); 
      idiomas.push({idioma: id, porcentaje: pct});
    }
  });

  /* Procesamiento de Paquetes */
  const paquetes = [], setP = new Set();
  document.querySelectorAll('#paquetes-list .input-inline').forEach(div => {
    let p = div.querySelector('select').value;
    if(p === 'Otro') p = div.querySelector('input[type="text"]').value.trim();
    if(p) {
      if(setP.has(p)) errors.push('No puedes repetir paquetes.');
      setP.add(p); 
      paquetes.push(p);
    }
  });

  // Si hay errores, mostrarlos y detener el envío
  if(errors.length) {
    msg.textContent = errors.join(' ');
    msg.classList.add('error');
    return;
  }

  // Preparar datos para enviar a Firebase
  const data = {
    uid: user.uid, 
    email: user.email,
    nombre: f.nombre.value.trim(),
    apellidoPaterno: f.apellidoPaterno.value.trim(),
    apellidoMaterno: f.apellidoMaterno.value.trim(),
    noControl: f.noControl.value.trim(),
    fechaNacimiento: f.fechaNacimiento.value,
    curp: f.curp.value.trim().toUpperCase(),
    sexo: f.sexo.value, 
    estadoCivil: f.estadoCivil.value,
    domicilio: f.domicilio.value.trim(),
    ciudad: f.ciudad.value.trim(), 
    municipio: f.municipio.value.trim(),
    estado: f.estado.value.trim(), 
    telefono: f.telefono.value.trim(),
    telCasa: f.telCasa.value.trim(),
    carrera: f.carrera.value,
    fechaEgreso: f.fechaEgreso.value,
    titulado: f.titulado.value === 'Si',
    idiomas, 
    paquetes,
    fechaRegistro: new Date()
  };

  // Guardar en Firebase
  try {
    console.log('[Encuesta Firebase] Guardando datos en Firestore...');
    await firebase.firestore().collection('usuarios').doc(user.uid).set(data);
    msg.textContent = '¡Datos guardados correctamente!';
    msg.classList.add('success');
    console.log('[Encuesta Firebase] Datos guardados con éxito');
  } catch(err) {
    msg.textContent = `Error: ${err.message}`;
    msg.classList.add('error');
    console.error('[Encuesta Firebase] Error al guardar:', err);
  }
  }; // Cierre de la asignación registroForm.onsubmit
} else {
  console.log('[Encuesta Firebase] El formulario #registro-form no se encontró en esta página.');
}

/* ---------- 3. Finalización Global de la Encuesta --------- */
window.finalizarEncuestaGlobal = async function() {
  console.log('[Encuesta Firebase] Iniciando proceso de finalización global de la encuesta.');
  
  // Autenticación
  const user = firebase.auth().currentUser;
  if (!user) {
    alert('Error: No hay un usuario autenticado. Por favor, recarga la página.');
    return;
  }
  
  // Referencia a Firestore
  const db = firebase.firestore();
  
  try {
    // 1. VERIFICAR PERIODO ACTIVO
    // Verificar si hay un periodo activo actualmente (usa el gestor de períodos si está disponible)
    let isSurveyPeriodOpen = false;
    let currentPeriod = null;
    
    // Intentar usar SurveyPeriodManager
    if (window.SurveyPeriodManager && typeof window.SurveyPeriodManager.isSurveyOpen === 'function') {
      await window.SurveyPeriodManager.loadCurrentPeriod();
      isSurveyPeriodOpen = window.SurveyPeriodManager.isSurveyOpen();
    } else {
      // Consulta directa a Firestore si el gestor no está disponible
      console.log('[Encuesta Firebase] SurveyPeriodManager no disponible, consultando periodos directamente');
      const now = new Date();
      const periodSnapshot = await db.collection('surveyPeriods')
        .where('active', '==', true)
        .get();
      
      if (!periodSnapshot.empty) {
        currentPeriod = periodSnapshot.docs[0].data();
        const startDate = new Date(currentPeriod.startDate.seconds * 1000);
        const endDate = new Date(currentPeriod.endDate.seconds * 1000);
        isSurveyPeriodOpen = now >= startDate && now <= endDate;
      }
    }
    
    if (!isSurveyPeriodOpen) {
      alert('La encuesta no está abierta en este momento. Solo puedes completar la encuesta durante un periodo activo.');
      return;
    }
    
    // 2. VERIFICAR SI YA COMPLETÓ LA ENCUESTA EN ESTE PERIODO
    const userDoc = await db.collection('usuarios').doc(user.uid).get();
    const userData = userDoc.data();
    
    if (userData && userData.encuestaCompletada && userData.ultimaFechaCompletada) {
      // Obtener periodo activo para comparar fechas
      if (!currentPeriod) {
        const periodSnapshot = await db.collection('surveyPeriods')
          .where('active', '==', true)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
          
        if (!periodSnapshot.empty) {
          currentPeriod = periodSnapshot.docs[0].data();
        }
      }
      
      if (currentPeriod) {
        const ultimaFecha = userData.ultimaFechaCompletada.toDate();
        const periodoInicio = currentPeriod.startDate.toDate();
        
        // Si la última encuesta completada fue después del inicio del periodo actual
        if (ultimaFecha >= periodoInicio) {
          alert('Ya has completado la encuesta en este periodo. Solo puedes completar una encuesta por periodo.');
          return;
        }
      }
    }
  
    // 3. CONSOLIDAR DATOS DE TODOS LOS MÓDULOS
    // Lista de módulos a consolidar
    const surveyModules = [
      { localStorageKey: 'modulo1_data', firestoreDocName: 'datosPersonales' },
      { localStorageKey: 'modulo2_data', firestoreDocName: 'ubicacionResidencia' },
      { localStorageKey: 'modulo3_data', firestoreDocName: 'datosAcademicos' },
      { localStorageKey: 'modulo4_data', firestoreDocName: 'empleoActual' },
      { localStorageKey: 'modulo5_data', firestoreDocName: 'desempeñoProfesional' },
      { localStorageKey: 'modulo6_data', firestoreDocName: 'expectativasDesarrollo' },
      { localStorageKey: 'modulo7_data', firestoreDocName: 'participacionSocial' },
      { localStorageKey: 'modulo8_data', firestoreDocName: 'retroalimentacionItch' },
      { localStorageKey: 'modulo9_data', firestoreDocName: 'comentariosSugerencias' }
    ];

    // Mostrar un indicador de carga en la UI (si existe)
    const loader = document.getElementById('preloader');
    if (loader) loader.style.display = 'block';

    const encuestaConsolidadaData = {};
    let tieneDatosParaGuardar = false;

    for (const module of surveyModules) {
      const moduleDataString = localStorage.getItem(module.localStorageKey);
      if (moduleDataString) {
        try {
          const moduleData = JSON.parse(moduleDataString);
          // Asegurarse de que los datos no estén vacíos o sean solo {userId: ...}
          if (Object.keys(moduleData).length > (moduleData.userId ? 1 : 0)) {
            // Eliminar userId si existe, ya que no es parte del modelo de datos del módulo específico
            if (moduleData.userId) {
              delete moduleData.userId;
            }
            encuestaConsolidadaData[module.firestoreDocName] = moduleData;
            tieneDatosParaGuardar = true;
            console.log(`[Encuesta Firebase] Datos del módulo ${module.firestoreDocName} recolectados desde ${module.localStorageKey}.`);
          } else {
            console.log(`[Encuesta Firebase] No hay datos sustanciales para ${module.firestoreDocName} en ${module.localStorageKey}.`);
          }
        } catch (parseError) {
          console.error(`[Encuesta Firebase] Error al parsear datos de ${module.localStorageKey}:`, parseError);
          // Continuar con el siguiente módulo
        }
      }
    }

    if (!tieneDatosParaGuardar) {
      console.log('[Encuesta Firebase] No se encontraron datos de módulos en localStorage para guardar. Finalización abortada.');
      if (loader) loader.style.display = 'none';
      alert('No hay datos para guardar. Completa al menos un módulo de la encuesta.');
      return; // Salir si no hay nada que guardar
    }

    // 4. GUARDAR DATOS EN FIRESTORE
    // Añadir campos de metadata
    encuestaConsolidadaData.fechaCompletado = firebase.firestore.FieldValue.serverTimestamp();
    
    // Verificar si hay un periodo activo
    console.log('[Encuesta Firebase] Verificando periodo activo:', currentPeriod);
    
    // Solo agregar campos de periodo si currentPeriod y sus propiedades existen
    if (currentPeriod && currentPeriod.id && currentPeriod.name) {
      encuestaConsolidadaData.periodoId = currentPeriod.id;
      encuestaConsolidadaData.periodoNombre = currentPeriod.name;
      console.log('[Encuesta Firebase] Usando periodo:', currentPeriod.id, currentPeriod.name);
    } else {
      // Si no hay periodo activo, usar valores por defecto
      console.log('[Encuesta Firebase] No hay periodo activo, usando valores por defecto');
      encuestaConsolidadaData.periodoId = 'default';
      encuestaConsolidadaData.periodoNombre = 'Periodo No Especificado';
    }

    // Guardar la encuesta consolidada como un nuevo documento en el historial
    await db.collection('usuarios').doc(user.uid).collection('historialEncuestas').add(encuestaConsolidadaData);
    console.log('[Encuesta Firebase] Encuesta consolidada guardada en historialEncuestas.');

    // Actualizar el documento principal del usuario para marcar la encuesta como completada y la fecha de la última completada
    await db.collection('usuarios').doc(user.uid).update({
      encuestaCompletada: true, // Indica que al menos una encuesta ha sido completada
      ultimaFechaCompletada: firebase.firestore.FieldValue.serverTimestamp() // Actualiza la fecha de la última encuesta completada
    });
    console.log('[Encuesta Firebase] Usuario marcado con encuestaCompletada y ultimaFechaCompletada.');

    // 5. LIMPIAR DATOS LOCALES
    // Limpiar los datos de localStorage después de un guardado exitoso
    surveyModules.forEach(module => {
      localStorage.removeItem(module.localStorageKey);
    });
    
    // Limpiar el valor de current_module para que al iniciar sesión sea redirigido al dashboard
    localStorage.removeItem('current_module');
    console.log('[Encuesta Firebase] Datos de la encuesta y current_module eliminados de localStorage');

    // Ocultar indicador de carga
    if (loader) loader.style.display = 'none';

    // 6. REDIRIGIR AL DASHBOARD
    // Mostrar mensaje de éxito y redirigir
    alert('¡Encuesta finalizada y guardada con éxito! Gracias por tu participación.');
    window.location.href = 'dashboard.html'; // Redirigir al dashboard

  } catch (error) {
    console.error('[Encuesta Firebase] Error al finalizar la encuesta global:', error);
    // Ocultar indicador de carga
    const loader = document.getElementById('preloader');
    if (loader) loader.style.display = 'none';
    alert('Hubo un error al guardar tu encuesta. Por favor, inténtalo de nuevo más tarde.');
  }
};
