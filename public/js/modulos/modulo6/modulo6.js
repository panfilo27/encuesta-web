// Código para el módulo 6: Desempeño Profesional
console.log('[Módulo 6] JS cargado');

// Contador de preguntas respondidas
let preguntasRespondidas = 0;
let totalPreguntas = 13; // Base de preguntas del módulo 6 (se actualizará dinámicamente)

// Referencias a elementos del DOM
const formModulo6 = document.getElementById("modulo6-form");
const questionsCompletedElement = document.getElementById("questions-completed");
const nextBtn = document.getElementById("nextBtn");
const returnBtn = document.getElementById("returnBtn");
const nombreUsuario = document.getElementById("nombre-usuario");
const correoUsuario = document.getElementById("correo-usuario");

// Elementos para aspectos personalizados
const nuevoAspectoInput = document.getElementById("nuevo-aspecto");
const agregarAspectoBtn = document.getElementById("agregar-aspecto-btn");
const aspectosPersonalizadosContainer = document.getElementById("aspectos-personalizados-container");
const aspectosPersonalizadosTable = document.getElementById("aspectos-personalizados-table");
const aspectosPersonalizadosBody = document.getElementById("aspectos-personalizados-body");

// Almacenamiento de aspectos personalizados
let aspectosPersonalizados = [];

// Elementos de validación
const seccionEficiencia = document.getElementById("seccion-eficiencia");
const seccionFormacion = document.getElementById("seccion-formacion");
const seccionAspectos = document.getElementById("seccion-aspectos");

/**
 * Verifica si el usuario está autenticado y redirige si no lo está
 */
function verificarAutenticacion() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // Usuario autenticado
      cargarDatosUsuario(user);
      cargarDatosDesdeFirebase(user.uid);
    } else {
      // Usuario no autenticado, redirigir a login
      window.location.href = "auth.html";
    }
  });
}

/**
 * Carga los datos del usuario en la interfaz
 * @param {Object} user - Objeto de usuario de Firebase
 */
function cargarDatosUsuario(user) {
  // Verificar que los elementos existan antes de modificarlos
  if (!nombreUsuario || !correoUsuario) {
    console.log("Elementos de usuario no encontrados en el DOM");
    return;
  }
  
  if (user.displayName) {
    nombreUsuario.textContent = user.displayName;
  } else {
    // Si no hay displayName, intentar cargar desde localStorage
    const datosUsuario = JSON.parse(localStorage.getItem("datosUsuario") || "{}");
    if (datosUsuario.nombre) {
      nombreUsuario.textContent = datosUsuario.nombre;
    } else {
      nombreUsuario.textContent = "Usuario";
    }
  }
  
  correoUsuario.textContent = user.email || "Sin correo";
}

/**
 * Carga los datos guardados desde Firebase y/o localStorage
 * @param {string} userId - ID del usuario autenticado
 */
async function cargarDatosDesdeFirebase(userId) {
  try {
    console.log('[Módulo 6] Intentando cargar datos desde Firebase');
    
    let desempenoData = null;
    
    // Intentar cargar desde la nueva estructura de historialEncuestas
    const db = firebase.firestore();
    const historialEncuestasRef = db.collection('usuarios').doc(userId).collection('historialEncuestas');
    
    // Consultar la última encuesta completada
    const querySnapshot = await historialEncuestasRef.orderBy('fechaCompletado', 'desc').limit(1).get();
    
    if (!querySnapshot.empty) {
      const docMasReciente = querySnapshot.docs[0];
      if (docMasReciente.data() && docMasReciente.data().desarrolloContinuo) {
        desempenoData = docMasReciente.data().desarrolloContinuo;
        console.log('[Módulo 6] Datos de la última encuesta encontrados en Firebase:', desempenoData);
      } else {
        console.log('[Módulo 6] La última encuesta no contiene datos de desarrollo continuo.');
      }
    } else {
      console.log('[Módulo 6] No se encontraron encuestas previas en el historial de Firebase');
      
      // Si no hay datos en Firebase, intentar desde localStorage
      const storedData = localStorage.getItem("modulo6_data");
      
      if (storedData) {
        try {
          // Intentar parsear los datos almacenados
          desempenoData = JSON.parse(storedData);
          console.log('[Módulo 6] Datos cargados desde localStorage (modulo6_data)');
          
          // Verificar que los datos pertenecen al usuario actual
          if (desempenoData.userId && desempenoData.userId !== userId) {
            console.warn('[Módulo 6] Los datos en localStorage no pertenecen al usuario actual');
            desempenoData = null;
          }
        } catch (error) {
          console.error('[Módulo 6] Error al parsear datos de localStorage:', error);
        }
      } else {
        // Retrocompatibilidad: comprobar la clave antigua
        const oldData = localStorage.getItem("desempenoProfesional");
        if (oldData) {
          try {
            desempenoData = JSON.parse(oldData);
            console.log('[Módulo 6] Datos cargados desde localStorage (clave antigua)');
            // Actualizar y guardar con la nueva clave
            desempenoData.userId = userId;
            localStorage.setItem("modulo6_data", JSON.stringify(desempenoData));
            // Eliminar la clave antigua
            localStorage.removeItem("desempenoProfesional");
          } catch (error) {
            console.error('[Módulo 6] Error al migrar datos antiguos:', error);
          }
        }
      }
    }
    
    // Si se encontraron datos, cargarlos en el formulario
    if (desempenoData) {
      cargarDatosEnFormulario(desempenoData);
    }
    
    // Actualizar contador inicial
    actualizarContadorPreguntas();
    
  } catch (error) {
    console.error("Error al cargar datos:", error);
  }
}

/**
 * Carga los datos en el formulario
 * @param {Object} data - Datos de desempeño profesional
 */
function cargarDatosEnFormulario(data) {
  console.log('[Módulo 6] Cargando datos en formulario:', data);
  
  // Cargar eficiencia
  if (data.eficiencia) {
    const eficienciaRadio = document.querySelector(`input[name="eficiencia"][value="${data.eficiencia}"]`);
    if (eficienciaRadio) {
      eficienciaRadio.checked = true;
    }
  }
  
  // Cargar formación académica (compatibilidad con ambos formatos)
  if (data.formacionAcademica) {
    const formacionRadio = document.querySelector(`input[name="formacion"][value="${data.formacionAcademica}"]`);
    if (formacionRadio) {
      formacionRadio.checked = true;
    }
  } else if (data.formacion_complementaria) {
    const formacionRadio = document.querySelector(`input[name="formacion"][value="${data.formacion_complementaria}"]`);
    if (formacionRadio) {
      formacionRadio.checked = true;
    }
  }
  
  // Cargar utilidad de residencias (compatibilidad con ambos formatos)
  if (data.utilidadResidencias) {
    const residenciasRadio = document.querySelector(`input[name="residencias"][value="${data.utilidadResidencias}"]`);
    if (residenciasRadio) {
      residenciasRadio.checked = true;
    }
  } else if (data.residencias_profesionales) {
    const residenciasRadio = document.querySelector(`input[name="residencias"][value="${data.residencias_profesionales}"]`);
    if (residenciasRadio) {
      residenciasRadio.checked = true;
    }
  }
  
  // Cargar servicio social si existe
  if (data.servicio_social) {
    const servicioSocialRadio = document.querySelector(`input[name="servicio_social"][value="${data.servicio_social}"]`);
    if (servicioSocialRadio) {
      servicioSocialRadio.checked = true;
    }
  }
  
  // Cargar aspectos valorados - comprobar todos los formatos posibles
  if (data.aspectos) {
    cargarMatrizValoracion(data.aspectos);
  } else if (data.aspectosValorados) {
    cargarMatrizValoracion(data.aspectosValorados);
  } else if (data.aspectos_valorados) {
    cargarMatrizValoracion(data.aspectos_valorados);
  }
  
  // Cargar aspectos personalizados si existen
  if (data.aspectos_personalizados && Array.isArray(data.aspectos_personalizados)) {
    console.log('[Módulo 6] Cargando aspectos personalizados:', data.aspectos_personalizados);
    aspectosPersonalizados = data.aspectos_personalizados;
    renderizarAspectosPersonalizados();
  }
  
  // Cargar matriz de aspectos valorados
  cargarMatrizValoracion(data.aspectos_valorados || {});
  
  // Cargar aspectos personalizados si existen
  if (data.aspectos_personalizados && Array.isArray(data.aspectos_personalizados)) {
    console.log('[Módulo 6] Cargando aspectos personalizados:', data.aspectos_personalizados);
    aspectosPersonalizados = data.aspectos_personalizados;
    actualizarContadorPreguntas();
    renderizarAspectosPersonalizados();
  }
}

/**
 * Carga los datos de la matriz de valoración en el formulario
 * @param {Object} aspectos - Datos de aspectos valorados
 */
function cargarMatrizValoracion(aspectos) {
  console.log('[Módulo 6] Cargando matriz de valoración:', aspectos);
  
  // Área de estudio
  if (aspectos.areaEstudio) {
    const areaEstudioRadio = document.querySelector(`input[name="area_estudio"][value="${aspectos.areaEstudio}"]`);
    if (areaEstudioRadio) {
      areaEstudioRadio.checked = true;
    }
  }
  
  // Titulación
  if (aspectos.titulacion) {
    const titulacionRadio = document.querySelector(`input[name="titulacion"][value="${aspectos.titulacion}"]`);
    if (titulacionRadio) {
      titulacionRadio.checked = true;
    }
  }
  
  // Experiencia previa - comprobar ambos nombres posibles
  const experiencia = aspectos.experienciaPrevia || aspectos.experienciaLaboral;
  if (experiencia) {
    const experienciaRadio = document.querySelector(`input[name="experiencia"][value="${experiencia}"]`);
    if (experienciaRadio) {
      experienciaRadio.checked = true;
    }
  }
  
  // Competencia laboral - comprobar ambos nombres posibles
  const competencia = aspectos.competenciaLaboral || aspectos.competencias;
  if (competencia) {
    const competenciaRadio = document.querySelector(`input[name="competencia"][value="${competencia}"]`);
    if (competenciaRadio) {
      competenciaRadio.checked = true;
    }
  }
  
  // Posicionamiento - comprobar ambos nombres posibles
  const posicionamiento = aspectos.posicionamientoInstitucion || aspectos.posicionamiento;
  if (posicionamiento) {
    const posicionamientoRadio = document.querySelector(`input[name="posicionamiento"][value="${posicionamiento}"]`);
    if (posicionamientoRadio) {
      posicionamientoRadio.checked = true;
    }
  }
  
  // Idiomas - comprobar ambos nombres posibles
  const idiomas = aspectos.conocimientoIdiomas || aspectos.idiomas;
  if (idiomas) {
    const idiomasRadio = document.querySelector(`input[name="idiomas"][value="${idiomas}"]`);
    if (idiomasRadio) {
      idiomasRadio.checked = true;
    }
  }
  
  // Recomendaciones
  if (aspectos.recomendaciones) {
    const recomendacionesRadio = document.querySelector(`input[name="recomendaciones"][value="${aspectos.recomendaciones}"]`);
    if (recomendacionesRadio) {
      recomendacionesRadio.checked = true;
    }
  }
  
  // Personalidad
  if (aspectos.personalidad) {
    const personalidadRadio = document.querySelector(`input[name="personalidad"][value="${aspectos.personalidad}"]`);
    if (personalidadRadio) {
      personalidadRadio.checked = true;
    }
  }
  
  // Liderazgo - comprobar ambos nombres posibles
  const liderazgo = aspectos.capacidadLiderazgo || aspectos.liderazgo;
  if (liderazgo) {
    const liderazgoRadio = document.querySelector(`input[name="liderazgo"][value="${liderazgo}"]`);
    if (liderazgoRadio) {
      liderazgoRadio.checked = true;
    }
  }
  
  // Otros factores - comprobar ambos nombres posibles
  const otrosFactores = aspectos.otrosFactor || aspectos.otrosFactores;
  if (otrosFactores) {
    document.getElementById("otros_factores").value = otrosFactores;
  }
  
  // Valoración de otros - comprobar ambos nombres posibles
  const otros = aspectos.otrosValoracion || aspectos.otros;
  if (otros) {
    const otrosRadio = document.querySelector(`input[name="otros"][value="${otros}"]`);
    if (otrosRadio) {
      otrosRadio.checked = true;
    }
  }
}

/**
 * Actualiza el contador de preguntas respondidas
 */
function actualizarContadorPreguntas() {
  // Verificar si existe el elemento del contador
  if (!questionsCompletedElement) {
    console.log("[Módulo 6] Elemento del contador no encontrado");
    return;
  }
  
  let contador = 0;
  
  // 1. Eficiencia laboral
  if (document.querySelector('input[name="eficiencia"]:checked')) {
    contador++;
  }
  
  // 2. Formación complementaria
  if (document.querySelector('input[name="formacion"]:checked')) {
    contador++;
  }
  
  // 3. Servicio social (si existe en el formulario)
  const servicioSocialRadios = document.getElementsByName("servicio_social");
  if (servicioSocialRadios.length > 0) {
    const servicioSocialChecked = document.querySelector('input[name="servicio_social"]:checked');
    if (servicioSocialChecked) {
      contador++;
    }
  }
  
  // 4. Residencias profesionales
  if (document.querySelector('input[name="residencias"]:checked')) {
    contador++;
  }
  
  // 5-13. Aspectos valorados por empleadores (9 aspectos predefinidos)
  const aspectosIds = ["area_estudio", "titulacion", "experiencia", "competencia", "posicionamiento", 
                      "idiomas", "recomendaciones", "personalidad", "liderazgo"];
  
  aspectosIds.forEach(id => {
    if (document.querySelector(`input[name="${id}"]:checked`)) {
      contador++;
    }
  });
  
  // Ya no comprobamos "otros factores" porque ahora usamos aspectos personalizados
  
  // Contar aspectos personalizados con valoración
  if (aspectosPersonalizados && aspectosPersonalizados.length > 0) {
    aspectosPersonalizados.forEach(aspecto => {
      if (aspecto.valoracion) {
        contador++;
      }
    });
  }
  
  // Actualizar valor de preguntas totales dinámicamente
  totalPreguntas = 13 + (aspectosPersonalizados ? aspectosPersonalizados.length : 0);
  
  // Actualizar el texto del contador
  questionsCompletedElement.textContent = contador;
  
  // Actualizar también el texto del total si está visible
  const progressCounterElement = document.querySelector('.progress-counter');
  if (progressCounterElement) {
    progressCounterElement.innerHTML = `<span id="questions-completed">${contador}</span>/${totalPreguntas} preguntas respondidas`;
  }
  
  // Estilo condicional para el indicador de progreso
  if (contador === totalPreguntas) {
    questionsCompletedElement.style.color = "#27ae60"; // Verde para indicar completado
  } else if (contador >= Math.floor(totalPreguntas * 0.7)) {
    questionsCompletedElement.style.color = "#f39c12"; // Amarillo para indicar progreso significativo
  } else {
    questionsCompletedElement.style.color = "#e74c3c"; // Rojo para indicar poco progreso
  }
  
  // Actualizar el botón de siguiente
  if (contador === totalPreguntas) {
    nextBtn.classList.add("complete");
  } else {
    nextBtn.classList.remove("complete");
  }
  
  console.log(`[Módulo 6] Contador actualizado: ${contador}/${totalPreguntas} preguntas completadas`);
  
  // Devolver el contador y total para posible uso en otras funciones
  return { completadas: contador, total: totalPreguntas };
}

/**
 * Guarda los datos del módulo 6 en localStorage (no en Firebase)
 */
async function guardarDatosModulo6() {
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
      console.error("[Módulo 6] No hay usuario autenticado");
      return false;
    }
    
    console.log('[Módulo 6] Usuario autenticado al guardar:', user.email);
    
    // Recopilar datos del formulario - asegurarse que no haya valores undefined
    const datosDesempeno = {
      // Eficiencia laboral
      eficiencia: document.querySelector('input[name="eficiencia"]:checked')?.value || null,
      
      // Formación académica
      formacionAcademica: document.querySelector('input[name="formacion"]:checked')?.value || null,
      utilidadResidencias: document.querySelector('input[name="residencias"]:checked')?.value || null,
      
      // Aspectos valorados por empleadores - importante usar el mismo nombre que en cargarDatosEnFormulario
      aspectos: {
        areaEstudio: document.querySelector('input[name="area_estudio"]:checked')?.value || null,
        titulacion: document.querySelector('input[name="titulacion"]:checked')?.value || null,
        experienciaPrevia: document.querySelector('input[name="experiencia"]:checked')?.value || null,
        competenciaLaboral: document.querySelector('input[name="competencia"]:checked')?.value || null,
        posicionamientoInstitucion: document.querySelector('input[name="posicionamiento"]:checked')?.value || null,
        conocimientoIdiomas: document.querySelector('input[name="idiomas"]:checked')?.value || null,
        recomendaciones: document.querySelector('input[name="recomendaciones"]:checked')?.value || null,
        personalidad: document.querySelector('input[name="personalidad"]:checked')?.value || null,
        capacidadLiderazgo: document.querySelector('input[name="liderazgo"]:checked')?.value || null,
      },
      
      // Guardar aspectos personalizados
      aspectos_personalizados: aspectosPersonalizados.length > 0 ? aspectosPersonalizados : undefined,
      
      // Guardar el ID de usuario para validar la propiedad de los datos
      userId: user.uid
    };
    
    // Guardar en localStorage con una clave consistente con los otros módulos
    localStorage.setItem("modulo6_data", JSON.stringify(datosDesempeno));
    console.log('[Módulo 6] Datos guardados en localStorage:', datosDesempeno);
    
    // Ya no guardamos en Firebase en cada paso, solo se hará al finalizar toda la encuesta
    
    return true;
  } catch (error) {
    console.error("[Módulo 6] Error al guardar datos:", error);
    return false;
  }
}

/**
 * Configura los eventos para mantener actualizado el contador
 */
function configurarEventosContador() {
  // Eventos para opciones de eficiencia
  document.querySelectorAll('input[name="eficiencia"]').forEach(radio => {
    radio.addEventListener('change', actualizarContadorPreguntas);
  });
  
  // Eventos para opciones de formación académica
  document.querySelectorAll('input[name="formacion"]').forEach(radio => {
    radio.addEventListener('change', actualizarContadorPreguntas);
  });
  
  // Eventos para opciones de residencias
  document.querySelectorAll('input[name="residencias"]').forEach(radio => {
    radio.addEventListener('change', actualizarContadorPreguntas);
  });
  
  // Eventos para todos los aspectos valorados
  document.querySelectorAll('input[name="area_estudio"], input[name="titulacion"], input[name="experiencia"], input[name="competencia"], input[name="posicionamiento"], input[name="idiomas"], input[name="recomendaciones"], input[name="personalidad"], input[name="liderazgo"], input[name="otros"]').forEach(radio => {
    radio.addEventListener('change', actualizarContadorPreguntas);
  });
  
  // Evento para el campo de texto "Otros factores"
  document.getElementById("otros_factores").addEventListener('input', actualizarContadorPreguntas);
}

/**
 * Muestra un mensaje de error en una sección específica
 * @param {HTMLElement} seccion - Elemento DOM de la sección
 * @param {boolean} mostrarError - Si se debe mostrar el error
 */
function mostrarErrorSeccion(seccion, mostrarError) {
  if (mostrarError) {
    seccion.classList.add("error");
    seccion.querySelector(".validation-indicator").style.display = "block";
  } else {
    seccion.classList.remove("error");
    seccion.querySelector(".validation-indicator").style.display = "none";
  }
}

/**
 * Valida la sección de eficiencia laboral cuando se realiza el envío del formulario
 */
function validarSeccionEficiencia() {
  const eficienciaSeleccionada = document.querySelector('input[name="eficiencia"]:checked');
  const esValida = !!eficienciaSeleccionada;
  
  mostrarErrorSeccion(seccionEficiencia, !esValida);
  return esValida;
}

/**
 * Valida la sección de formación académica cuando se realiza el envío del formulario
 */
function validarSeccionFormacion() {
  const formacionSeleccionada = document.querySelector('input[name="formacion"]:checked');
  const esValida = !!formacionSeleccionada;
  
  mostrarErrorSeccion(seccionFormacion, !esValida);
  return esValida;
}

/**
 * Valida la sección de aspectos valorados cuando se realiza el envío del formulario
 */
function validarSeccionAspectos() {
  // Lista de aspectos predefinidos a comprobar
  const aspectosSeleccionados = [
    document.querySelector('input[name="area_estudio"]:checked')?.value,
    document.querySelector('input[name="titulacion"]:checked')?.value,
    document.querySelector('input[name="experiencia"]:checked')?.value,
    document.querySelector('input[name="competencia"]:checked')?.value,
    document.querySelector('input[name="posicionamiento"]:checked')?.value,
    document.querySelector('input[name="idiomas"]:checked')?.value,
    document.querySelector('input[name="recomendaciones"]:checked')?.value,
    document.querySelector('input[name="personalidad"]:checked')?.value,
    document.querySelector('input[name="liderazgo"]:checked')?.value,
  ];
  
  // Contar aspectos predefinidos seleccionados
  let aspectosCompletados = aspectosSeleccionados.filter(aspecto => !!aspecto).length;
  
  // Ya no necesitamos verificar "otros factores"
  
  // Contar aspectos personalizados con valoración
  const aspectosPersonalizadosCompletados = aspectosPersonalizados.filter(aspecto => !!aspecto.valoracion).length;
  aspectosCompletados += aspectosPersonalizadosCompletados;
  
  console.log(`[Módulo 6] Validación: ${aspectosCompletados} aspectos completados (${aspectosPersonalizadosCompletados} personalizados)`);
  
  // Se requieren al menos 5 aspectos valorados
  const aspectosRequeridos = 5;
  const esValida = (aspectosCompletados >= aspectosRequeridos);
  
  mostrarErrorSeccion(seccionAspectos, !esValida);
  return esValida;
}

/**
 * Maneja la finalización del módulo y redirección al siguiente
 */
function finalizarModulo() {
  // Guardar datos antes de finalizar
  guardarDatosModulo6();
  
  // Redirigir al siguiente módulo
  window.location.href = "modulo7.html";
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Verificar autenticación al cargar la página
  verificarAutenticacion();
  
  // Evento para finalizar módulo
  nextBtn.addEventListener("click", async () => {
    // Validar formulario antes de continuar
    const eficienciaValida = validarSeccionEficiencia();
    const formacionValida = validarSeccionFormacion();
    const aspectosValidos = validarSeccionAspectos();
    
    if (eficienciaValida && formacionValida && aspectosValidos) {
      await guardarDatosModulo6();
      finalizarModulo();
    } else {
      mostrarMensaje('Por favor, completa todos los campos requeridos', 'error');
    }
  });
  
  // Evento para volver al módulo anterior
  returnBtn.addEventListener("click", () => {
    // Guardar datos antes de retroceder
    guardarDatosModulo6();
    // Redirigir al módulo anterior
    window.location.href = "modulo5.html";
  });

  
  // Configurar eventos para el contador
  configurarEventosContador();
  
  // Configurar eventos para guardar automáticamente los datos
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener("change", guardarDatosModulo6);
  });
  
  // Ya no necesitamos evento para otros_factores
  
  // Configurar eventos para los aspectos personalizados
  if (typeof configurarEventosAspectosPersonalizados === 'function') {
    configurarEventosAspectosPersonalizados();
    console.log('[Módulo 6] Eventos de aspectos personalizados configurados');
  }
  
  // Actualizar contador inicial
  actualizarContadorPreguntas();
});

/**
 * Configura los eventos para actualizar el contador de preguntas respondidas
 * cuando el usuario interactúa con cualquier elemento del formulario
 */
function configurarEventosContador() {
  console.log('[Módulo 6] Configurando eventos para actualizar contador');
  
  // 1. Actualizar contador cuando se seleccione cualquier opción de radio
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener("change", function() {
      actualizarContadorPreguntas();
    });
  });
  
  // 2. Actualizar contador cuando se escriba en el campo de otros factores
  const otrosFactoresInput = document.getElementById("otros_factores");
  if (otrosFactoresInput) {
    otrosFactoresInput.addEventListener("input", function() {
      actualizarContadorPreguntas();
    });
  }
  
  // 3. Crear elemento visual para el contador si no existe
  crearElementoContadorSiNoExiste();
}

/**
 * Crea el elemento visual para el contador de preguntas si no existe
 */
function crearElementoContadorSiNoExiste() {
  // Comprobar si ya existe el contador
  if (!document.getElementById('questions-completed')) {
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
      // Crear el elemento para el contador
      const questionsCompletedElement = document.createElement('div');
      questionsCompletedElement.id = 'questions-completed';
      questionsCompletedElement.className = 'questions-counter';
      questionsCompletedElement.style.cssText = 'margin-top: 10px; font-size: 14px; color: #4a5568; text-align: center;';
      
      // Añadirlo al contenedor de progreso
      progressContainer.appendChild(questionsCompletedElement);
      console.log('[Módulo 6] Elemento contador creado');
    }
  }
}
