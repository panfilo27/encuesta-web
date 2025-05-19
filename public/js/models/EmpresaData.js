/**
 * Clase que representa los datos de la empresa donde trabaja el egresado
 */
function EmpresaData() {
  // Relación del trabajo con el área de formación
  this.relacionFormacion = '';
  
  // Tipo de organismo
  this.tipoOrganismo = '';
  
  // Datos de la empresa
  this.giro = '';
  this.razonSocial = '';
  this.domicilio = '';
  this.ciudad = '';
  this.municipio = '';
  this.estado = '';
  this.telefono = '';
  this.extension = '';
  this.email = '';
  this.paginaWeb = '';
  this.jefeInmediato = '';
  
  // Sector económico
  this.sectorEconomico = '';
  
  // Tamaño de la empresa
  this.tamanoEmpresa = '';
}

/**
 * Crea un objeto EmpresaData a partir de los datos del formulario
 * @param {HTMLFormElement} form - Formulario con los datos
 * @returns {EmpresaData} Objeto con los datos de la empresa
 */
function crearEmpresaDataDesdeFormulario(form) {
  const empresaData = new EmpresaData();
  
  // Obtener relación con formación
  const relacionRadio = form.querySelector('input[name="relacion_trabajo"]:checked');
  if (relacionRadio) {
    empresaData.relacionFormacion = relacionRadio.value;
  }
  
  // Obtener tipo de organismo
  const organismoRadio = form.querySelector('input[name="tipo_organismo"]:checked');
  if (organismoRadio) {
    empresaData.tipoOrganismo = organismoRadio.value;
  }
  
  // Obtener datos de la empresa
  empresaData.giro = form.querySelector('#giro').value.trim();
  empresaData.razonSocial = form.querySelector('#razon_social').value.trim();
  empresaData.domicilio = form.querySelector('#domicilio').value.trim();
  empresaData.ciudad = form.querySelector('#ciudad').value.trim();
  empresaData.municipio = form.querySelector('#municipio').value.trim();
  empresaData.estado = form.querySelector('#estado').value.trim();
  empresaData.telefono = form.querySelector('#telefono').value.trim();
  empresaData.extension = form.querySelector('#extension').value.trim();
  empresaData.email = form.querySelector('#email_empresa').value.trim();
  empresaData.paginaWeb = form.querySelector('#web').value.trim();
  empresaData.jefeInmediato = form.querySelector('#jefe').value.trim();
  
  // Obtener sector económico
  const sectorRadio = form.querySelector('input[name="sector_economico"]:checked');
  if (sectorRadio) {
    empresaData.sectorEconomico = sectorRadio.value;
  }
  
  // Obtener tamaño de la empresa
  const tamanoRadio = form.querySelector('input[name="tamano_empresa"]:checked');
  if (tamanoRadio) {
    empresaData.tamanoEmpresa = tamanoRadio.value;
  }
  
  return empresaData;
}

/**
 * Convierte un objeto EmpresaData para su almacenamiento en Firestore
 * @param {EmpresaData} empresaData - Objeto con los datos de la empresa
 * @returns {Object} Objeto listo para guardar en Firestore
 */
function convertirEmpresaDataParaFirestore(empresaData) {
  // Crear un objeto plano para Firestore
  return {
    relacionFormacion: empresaData.relacionFormacion,
    tipoOrganismo: empresaData.tipoOrganismo,
    giro: empresaData.giro,
    razonSocial: empresaData.razonSocial,
    domicilio: empresaData.domicilio,
    ciudad: empresaData.ciudad,
    municipio: empresaData.municipio,
    estado: empresaData.estado,
    telefono: empresaData.telefono,
    extension: empresaData.extension,
    email: empresaData.email,
    paginaWeb: empresaData.paginaWeb,
    jefeInmediato: empresaData.jefeInmediato,
    sectorEconomico: empresaData.sectorEconomico,
    tamanoEmpresa: empresaData.tamanoEmpresa
  };
}

/**
 * Parsea los datos de Firestore a un objeto EmpresaData
 * @param {Object} data - Datos obtenidos de Firestore
 * @returns {EmpresaData} Objeto con los datos de la empresa
 */
function parseEmpresaDataFirestore(data) {
  const empresaData = new EmpresaData();
  
  // Asignar propiedades si existen en el objeto data
  if (data) {
    empresaData.relacionFormacion = data.relacionFormacion || '';
    empresaData.tipoOrganismo = data.tipoOrganismo || '';
    empresaData.giro = data.giro || '';
    empresaData.razonSocial = data.razonSocial || '';
    empresaData.domicilio = data.domicilio || '';
    empresaData.ciudad = data.ciudad || '';
    empresaData.municipio = data.municipio || '';
    empresaData.estado = data.estado || '';
    empresaData.telefono = data.telefono || '';
    empresaData.extension = data.extension || '';
    empresaData.email = data.email || '';
    empresaData.paginaWeb = data.paginaWeb || '';
    empresaData.jefeInmediato = data.jefeInmediato || '';
    empresaData.sectorEconomico = data.sectorEconomico || '';
    empresaData.tamanoEmpresa = data.tamanoEmpresa || '';
  }
  
  return empresaData;
}
