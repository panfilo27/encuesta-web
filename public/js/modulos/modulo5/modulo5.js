/**
 * Módulo 5 - Datos de la empresa
 * Script para gestionar el formulario de datos de la empresa
 */

// Variables globales y referencias DOM
let form;
let questionsCompletedElement;
let nextBtn;
let prevBtn;

// Referencias a elementos de relación de trabajo
let relacionRadios;

// Referencias a elementos de datos de empresa
let tipoOrganismoRadios;
let giroInput;
let razonSocialInput;
let domicilioInput;
let ciudadInput;
let municipioInput;
let estadoInput;
let telefonoInput;
let extensionInput;
let emailEmpresaInput;
let webInput;
let jefeInput;

// Referencias a elementos de sector económico
let sectorRadios;

// Referencias a elementos de tamaño de empresa
let tamanoRadios;

// Inicializar la interfaz de usuario para el Módulo 5
window.initModulo5UI = function() {
  console.log('[Módulo 5] initModulo5UI llamada');
  
  // Referencias a elementos DOM
  form = document.querySelector('form');
  questionsCompletedElement = document.getElementById('questions-completed');
  nextBtn = document.getElementById('nextBtn');
  prevBtn = document.getElementById('prevBtn');
  
  // Inicializar referencias a elementos de relación de trabajo
  relacionRadios = document.querySelectorAll('input[name="relacion_trabajo"]');
  
  // Inicializar referencias a elementos de datos de empresa
  tipoOrganismoRadios = document.querySelectorAll('input[name="tipo_organismo"]');
  giroInput = document.getElementById('giro');
  razonSocialInput = document.getElementById('razon_social');
  domicilioInput = document.getElementById('domicilio');
  ciudadInput = document.getElementById('ciudad');
  municipioInput = document.getElementById('municipio');
  estadoInput = document.getElementById('estado');
  telefonoInput = document.getElementById('telefono');
  extensionInput = document.getElementById('extension');
  emailEmpresaInput = document.getElementById('email_empresa');
  webInput = document.getElementById('web');
  jefeInput = document.getElementById('jefe');
  
  // Inicializar referencias a elementos de sector económico
  sectorRadios = document.querySelectorAll('input[name="sector_economico"]');
  
  // Inicializar referencias a elementos de tamaño de empresa
  tamanoRadios = document.querySelectorAll('input[name="tamano_empresa"]');
  
  // Configurar eventos para validación en tiempo real
  configurarEventos();
  
  // Configurar botones de navegación
  configurarBotones();
  
  // Actualizar contador de preguntas completadas
  actualizarContadorPreguntas();
  
  // Cargar datos
  cargarDatosModulo5();
};

// Configurar eventos para validación en tiempo real
function configurarEventos() {
  console.log('[Módulo 5] Configurando eventos para validación en tiempo real');
  
  // Eventos para relación de trabajo
  relacionRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      document.getElementById('relacion-card').classList.remove('error');
      document.getElementById('relacion-validation').style.display = 'none';
      actualizarContadorPreguntas();
    });
  });
  
  // Eventos para tipo de organismo
  tipoOrganismoRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      document.getElementById('datos-empresa-card').classList.remove('error');
      document.getElementById('datos-empresa-validation').style.display = 'none';
      actualizarContadorPreguntas();
    });
  });
  
  // Eventos para datos de empresa (inputs de texto)
  const camposRequeridos = [giroInput, razonSocialInput, domicilioInput];
  camposRequeridos.forEach(campo => {
    campo.addEventListener('input', function() {
      if (camposRequeridos.every(c => c.value.trim() !== '')) {
        document.getElementById('datos-empresa-card').classList.remove('error');
        document.getElementById('datos-empresa-validation').style.display = 'none';
      }
      actualizarContadorPreguntas();
    });
  });
  
  // Eventos para sector económico
  sectorRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      document.getElementById('sector-card').classList.remove('error');
      document.getElementById('sector-validation').style.display = 'none';
      actualizarContadorPreguntas();
    });
  });
  
  // Eventos para tamaño de empresa
  tamanoRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      document.getElementById('tamano-card').classList.remove('error');
      document.getElementById('tamano-validation').style.display = 'none';
      actualizarContadorPreguntas();
    });
  });
}

// Configurar botones de navegación
function configurarBotones() {
  console.log('[Módulo 5] Configurando botones de navegación');
  
  // Configurar botón Atrás
  if (prevBtn) {
    prevBtn.addEventListener('click', async function() {
      // Guardar datos antes de regresar
      await guardarDatosModulo5();
      
      // Redirigir al módulo 4
      window.location.href = 'modulo4.html';
    });
  }
  
  // Configurar botón Siguiente
  if (nextBtn) {
    nextBtn.addEventListener('click', async function() {
      // Validar formulario
      if (!validarFormulario()) {
        return;
      }
      
      // Guardar datos antes de continuar
      const guardadoExitoso = await guardarDatosModulo5();
      
      if (guardadoExitoso) {
        console.log('[Módulo 5] Datos guardados correctamente, navegando al módulo 6');
        
        // Redireccionar al módulo 6 (o placeholder)
        window.location.href = 'modulo6.html';
      } else {
        alert('Hubo un problema al guardar tus datos. Por favor, intenta nuevamente.');
      }
    });
  }
}

// Validar el formulario
function validarFormulario() {
  console.log('[Módulo 5] Validando formulario');
  let isValid = true;
  
  // Validar relación de trabajo
  if (!form.querySelector('input[name="relacion_trabajo"]:checked')) {
    document.getElementById('relacion-card').classList.add('error');
    document.getElementById('relacion-validation').style.display = 'block';
    isValid = false;
  }
  
  // Validar tipo de organismo y datos básicos de empresa
  if (!form.querySelector('input[name="tipo_organismo"]:checked') || 
      !giroInput.value.trim() || 
      !razonSocialInput.value.trim() || 
      !domicilioInput.value.trim()) {
    document.getElementById('datos-empresa-card').classList.add('error');
    document.getElementById('datos-empresa-validation').style.display = 'block';
    isValid = false;
  }
  
  // Validar sector económico
  if (!form.querySelector('input[name="sector_economico"]:checked')) {
    document.getElementById('sector-card').classList.add('error');
    document.getElementById('sector-validation').style.display = 'block';
    isValid = false;
  }
  
  // Validar tamaño de empresa
  if (!form.querySelector('input[name="tamano_empresa"]:checked')) {
    document.getElementById('tamano-card').classList.add('error');
    document.getElementById('tamano-validation').style.display = 'block';
    isValid = false;
  }
  
  return isValid;
}

// Actualizar contador de preguntas completadas
function actualizarContadorPreguntas() {
  let completadas = 0;
  const total = 4;
  
  // Verificar relación de trabajo
  if (form.querySelector('input[name="relacion_trabajo"]:checked')) {
    completadas++;
  }
  
  // Verificar datos de empresa (tipo organismo y campos requeridos)
  if (form.querySelector('input[name="tipo_organismo"]:checked') && 
      giroInput.value.trim() && 
      razonSocialInput.value.trim() && 
      domicilioInput.value.trim()) {
    completadas++;
  }
  
  // Verificar sector económico
  if (form.querySelector('input[name="sector_economico"]:checked')) {
    completadas++;
  }
  
  // Verificar tamaño de empresa
  if (form.querySelector('input[name="tamano_empresa"]:checked')) {
    completadas++;
  }
  
  questionsCompletedElement.textContent = `${completadas}/${total}`;
}



// Aplicar datos al formulario
function aplicarDatosAlFormulario(empresaData) {
  console.log('[Módulo 5] Aplicando datos al formulario', empresaData);
  
  try {
    // Aplicar relación de trabajo
    if (empresaData.relacionFormacion) {
      const relacionRadio = form.querySelector(`input[name="relacion_trabajo"][value="${empresaData.relacionFormacion}"]`);
      if (relacionRadio) relacionRadio.checked = true;
    }
    
    // Aplicar tipo organismo
    if (empresaData.tipoOrganismo) {
      const organismoRadio = form.querySelector(`input[name="tipo_organismo"][value="${empresaData.tipoOrganismo}"]`);
      if (organismoRadio) organismoRadio.checked = true;
    }
    
    // Aplicar datos de la empresa
    giroInput.value = empresaData.giro || '';
    razonSocialInput.value = empresaData.razonSocial || '';
    domicilioInput.value = empresaData.domicilio || '';
    ciudadInput.value = empresaData.ciudad || '';
    municipioInput.value = empresaData.municipio || '';
    estadoInput.value = empresaData.estado || '';
    telefonoInput.value = empresaData.telefono || '';
    extensionInput.value = empresaData.extension || '';
    emailEmpresaInput.value = empresaData.email || '';
    webInput.value = empresaData.paginaWeb || '';
    jefeInput.value = empresaData.jefeInmediato || '';
    
    // Aplicar sector económico
    if (empresaData.sectorEconomico) {
      const sectorRadio = form.querySelector(`input[name="sector_economico"][value="${empresaData.sectorEconomico}"]`);
      if (sectorRadio) sectorRadio.checked = true;
    }
    
    // Aplicar tamaño de empresa
    if (empresaData.tamanoEmpresa) {
      const tamanoRadio = form.querySelector(`input[name="tamano_empresa"][value="${empresaData.tamanoEmpresa}"]`);
      if (tamanoRadio) tamanoRadio.checked = true;
    }
    
    // Actualizar contador de preguntas
    actualizarContadorPreguntas();
    
    return true;
  } catch (error) {
    console.error('[Módulo 5] Error al aplicar datos al formulario:', error);
    return false;
  }
}

// Guardar datos solo en localStorage
async function guardarDatosModulo5() {
  console.log('[Módulo 5] Guardando datos del formulario en localStorage');
  
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
      console.error('[Módulo 5] No hay usuario autenticado');
      return false;
    }
    
    console.log('[Módulo 5] Usuario autenticado al guardar:', user.email);
    
    // Recopilar datos del formulario
    const empresaData = crearEmpresaDataDesdeFormulario(form);
    
    // Añadir ID de usuario para validación
    empresaData.userId = user.uid;
    
    // Guardar solo en localStorage
    localStorage.setItem('modulo5_data', JSON.stringify(empresaData));
    console.log('[Módulo 5] Datos guardados en localStorage');
    
    // Ya no guardamos en Firebase en cada paso, solo se hará al finalizar toda la encuesta
    
    return true;
  } catch (error) {
    console.error('[Módulo 5] Error al guardar datos:', error);
    return false;
  }
}

// Cargar datos desde Firebase
async function cargarDatosDesdeFirebase() {
  console.log('[Módulo 5] Intentando cargar datos desde Firebase');
  
  try {
    // Esperar a que la autenticación se inicialice
    await new Promise(resolve => {
      const unsubscribe = firebase.auth().onAuthStateChanged(user => {
        unsubscribe();
        resolve();
      });
    });
    
    const auth = firebase.auth();
    const user = auth.currentUser;
    
    if (!user) {
      console.log('[Módulo 5] Usuario no autenticado, no se cargó de Firebase');
      return null;
    }
    
    // Referencia a la base de datos donde se almacena el historial de encuestas
    const db = firebase.firestore();
    const historialEncuestasRef = db.collection('usuarios').doc(user.uid).collection('historialEncuestas');
    
    // Consultar la última encuesta completada
    const querySnapshot = await historialEncuestasRef.orderBy('fechaCompletado', 'desc').limit(1).get();
    
    if (!querySnapshot.empty) {
      const docMasReciente = querySnapshot.docs[0];
      if (docMasReciente.data() && docMasReciente.data().datosEmpresa) {
        const data = docMasReciente.data().datosEmpresa;
        console.log('[Módulo 5] Datos de la última encuesta encontrados en Firebase:', data);
        return parseEmpresaDataFirestore(data);
      } else {
        console.log('[Módulo 5] La última encuesta no contiene datos de empresa.');
        return null;
      }
    } else {
      console.log('[Módulo 5] No se encontraron encuestas previas en el historial de Firebase');
      return null;
    }
  } catch (error) {
    console.error('[Módulo 5] Error al cargar desde Firebase:', error);
    return null;
  }
}

// Cargar datos guardados (primero intenta desde Firebase, luego localStorage)
async function cargarDatosModulo5() {
  try {
    // Verificar si hay usuario autenticado
    const user = firebase.auth().currentUser;
    if (!user) {
      console.error('[Módulo 5] No hay usuario autenticado');
      return false;
    }
    
    // 1. Intentar cargar desde Firebase primero
    const datosFirebase = await cargarDatosDesdeFirebase();
    if (datosFirebase) {
      console.log('[Módulo 5] Usando datos de Firebase');
      return aplicarDatosAlFormulario(datosFirebase);
    }
    
    // 2. Si no hay datos en Firebase, intentar desde localStorage
    const dataStr = localStorage.getItem('modulo5_data');
    if (!dataStr) {
      console.log('[Módulo 5] No hay datos guardados en localStorage');
      return false;
    }
    
    const datosLocal = JSON.parse(dataStr);
    
    // Verificar que los datos pertenecen al usuario actual
    if (datosLocal.userId && datosLocal.userId !== user.uid) {
      console.log('[Módulo 5] Los datos en localStorage no pertenecen al usuario actual');
      // Limpiar datos que no corresponden al usuario actual
      localStorage.removeItem('modulo5_data');
      return false;
    }
    
    console.log('[Módulo 5] Usando datos de localStorage');
    return aplicarDatosAlFormulario(datosLocal);
    
  } catch (error) {
    console.error('[Módulo 5] Error al cargar datos:', error);
    return false;
  }
}

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Ocultar preloader
  document.getElementById('preloader').style.display = 'none';
  
  // Esperar a que Firebase Auth se inicialice antes de continuar
  firebase.auth().onAuthStateChanged(function(user) {
    // Incluso si el usuario es null (no autenticado), inicializamos la UI
    // ya que la verificación de autenticación ya se hizo en módulos anteriores
    window.initModulo5UI();
  });
});
