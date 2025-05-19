/**
 * Clase que representa los datos de desempeño profesional del egresado
 */
function DesempenoProfesional() {
  // Eficiencia para realizar actividades laborales
  this.eficiencia = '';
  
  // Calificación de la formación académica
  this.formacionAcademica = '';
  
  // Utilidad de las residencias profesionales
  this.utilidadResidencias = '';
  
  // Valoración de aspectos para contratación
  this.aspectos = {
    areaEstudio: '',
    titulacion: '',
    experienciaPrevia: '',
    competenciaLaboral: '',
    posicionamientoInstitucion: '',
    conocimientoIdiomas: '',
    recomendaciones: '',
    personalidad: '',
    capacidadLiderazgo: '',
    otrosFactor: '',
    otrosValoracion: ''
  };
}

/**
 * Crea un objeto DesempenoProfesional a partir de los datos del formulario
 * @param {HTMLFormElement} form - Formulario con los datos
 * @returns {DesempenoProfesional} Objeto con los datos de desempeño profesional
 */
function crearDesempenoProfesionalDesdeFormulario(form) {
  const desempeno = new DesempenoProfesional();
  
  // Obtener eficiencia
  const eficienciaRadio = form.querySelector('input[name="eficiencia"]:checked');
  if (eficienciaRadio) {
    desempeno.eficiencia = eficienciaRadio.value;
  }
  
  // Obtener formación académica
  const formacionRadio = form.querySelector('input[name="formacion"]:checked');
  if (formacionRadio) {
    desempeno.formacionAcademica = formacionRadio.value;
  }
  
  // Obtener utilidad de residencias
  const residenciasRadio = form.querySelector('input[name="residencias"]:checked');
  if (residenciasRadio) {
    desempeno.utilidadResidencias = residenciasRadio.value;
  }
  
  // Obtener valoración de aspectos para contratación
  const areaEstudioRadio = form.querySelector('input[name="area_estudio"]:checked');
  if (areaEstudioRadio) {
    desempeno.aspectos.areaEstudio = areaEstudioRadio.value;
  }
  
  const titulacionRadio = form.querySelector('input[name="titulacion"]:checked');
  if (titulacionRadio) {
    desempeno.aspectos.titulacion = titulacionRadio.value;
  }
  
  const experienciaRadio = form.querySelector('input[name="experiencia"]:checked');
  if (experienciaRadio) {
    desempeno.aspectos.experienciaPrevia = experienciaRadio.value;
  }
  
  const competenciaRadio = form.querySelector('input[name="competencia"]:checked');
  if (competenciaRadio) {
    desempeno.aspectos.competenciaLaboral = competenciaRadio.value;
  }
  
  const posicionamientoRadio = form.querySelector('input[name="posicionamiento"]:checked');
  if (posicionamientoRadio) {
    desempeno.aspectos.posicionamientoInstitucion = posicionamientoRadio.value;
  }
  
  const idiomasRadio = form.querySelector('input[name="idiomas"]:checked');
  if (idiomasRadio) {
    desempeno.aspectos.conocimientoIdiomas = idiomasRadio.value;
  }
  
  const recomendacionesRadio = form.querySelector('input[name="recomendaciones"]:checked');
  if (recomendacionesRadio) {
    desempeno.aspectos.recomendaciones = recomendacionesRadio.value;
  }
  
  const personalidadRadio = form.querySelector('input[name="personalidad"]:checked');
  if (personalidadRadio) {
    desempeno.aspectos.personalidad = personalidadRadio.value;
  }
  
  const liderazgoRadio = form.querySelector('input[name="liderazgo"]:checked');
  if (liderazgoRadio) {
    desempeno.aspectos.capacidadLiderazgo = liderazgoRadio.value;
  }
  
  // Obtener otros factores (opcional)
  desempeno.aspectos.otrosFactor = form.querySelector('#otros_factores').value.trim();
  
  const otrosRadio = form.querySelector('input[name="otros"]:checked');
  if (otrosRadio) {
    desempeno.aspectos.otrosValoracion = otrosRadio.value;
  }
  
  return desempeno;
}

/**
 * Convierte un objeto DesempenoProfesional para su almacenamiento en Firestore
 * @param {DesempenoProfesional} desempeno - Objeto con los datos de desempeño profesional
 * @returns {Object} Objeto listo para guardar en Firestore
 */
function convertirDesempenoProfesionalParaFirestore(desempeno) {
  // Crear un objeto plano para Firestore
  return {
    eficiencia: desempeno.eficiencia,
    formacionAcademica: desempeno.formacionAcademica,
    utilidadResidencias: desempeno.utilidadResidencias,
    aspectos: {
      areaEstudio: desempeno.aspectos.areaEstudio,
      titulacion: desempeno.aspectos.titulacion,
      experienciaPrevia: desempeno.aspectos.experienciaPrevia,
      competenciaLaboral: desempeno.aspectos.competenciaLaboral,
      posicionamientoInstitucion: desempeno.aspectos.posicionamientoInstitucion,
      conocimientoIdiomas: desempeno.aspectos.conocimientoIdiomas,
      recomendaciones: desempeno.aspectos.recomendaciones,
      personalidad: desempeno.aspectos.personalidad,
      capacidadLiderazgo: desempeno.aspectos.capacidadLiderazgo,
      otrosFactor: desempeno.aspectos.otrosFactor,
      otrosValoracion: desempeno.aspectos.otrosValoracion
    }
  };
}

/**
 * Parsea los datos de Firestore a un objeto DesempenoProfesional
 * @param {Object} data - Datos obtenidos de Firestore
 * @returns {DesempenoProfesional} Objeto con los datos de desempeño profesional
 */
function parseDesempenoProfesionalFirestore(data) {
  const desempeno = new DesempenoProfesional();
  
  // Asignar propiedades si existen en el objeto data
  if (data) {
    desempeno.eficiencia = data.eficiencia || '';
    desempeno.formacionAcademica = data.formacionAcademica || '';
    desempeno.utilidadResidencias = data.utilidadResidencias || '';
    
    // Asignar aspectos si existen
    if (data.aspectos) {
      desempeno.aspectos.areaEstudio = data.aspectos.areaEstudio || '';
      desempeno.aspectos.titulacion = data.aspectos.titulacion || '';
      desempeno.aspectos.experienciaPrevia = data.aspectos.experienciaPrevia || '';
      desempeno.aspectos.competenciaLaboral = data.aspectos.competenciaLaboral || '';
      desempeno.aspectos.posicionamientoInstitucion = data.aspectos.posicionamientoInstitucion || '';
      desempeno.aspectos.conocimientoIdiomas = data.aspectos.conocimientoIdiomas || '';
      desempeno.aspectos.recomendaciones = data.aspectos.recomendaciones || '';
      desempeno.aspectos.personalidad = data.aspectos.personalidad || '';
      desempeno.aspectos.capacidadLiderazgo = data.aspectos.capacidadLiderazgo || '';
      desempeno.aspectos.otrosFactor = data.aspectos.otrosFactor || '';
      desempeno.aspectos.otrosValoracion = data.aspectos.otrosValoracion || '';
    }
  }
  
  return desempeno;
}
