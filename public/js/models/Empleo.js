/**
 * Modelo para gestionar los datos de empleo de un graduado
 */

/**
 * Crea un objeto de datos de empleo a partir de los datos del formulario
 * @param {Object} formData - Datos del formulario
 * @returns {Object} - Objeto de datos de empleo estructurado
 */
window.createEmpleoData = function(formData = {}) {
  const datos = {
    // Tiempo para obtener empleo
    tiempo_primer_empleo: formData.tiempo_primer_empleo || '',
    
    // Medio para obtener empleo
    medio_obtener_empleo: formData.medio_obtener_empleo || '',
    medio_otro: formData.medio_otro || '',
    
    // Requisitos de contratación
    requisitos_contratacion: formData.requisitos_contratacion || [],
    requisito_otro: formData.requisito_otro || '',
    
    // Idioma
    idioma: formData.idioma || '',
    idioma_otro: formData.idioma_otro || '',
    
    // Habilidades del idioma
    habilidad_hablar: formData.habilidad_hablar || 0,
    habilidad_escribir: formData.habilidad_escribir || 0,
    habilidad_leer: formData.habilidad_leer || 0,
    habilidad_escuchar: formData.habilidad_escuchar || 0,
    
    // Antigüedad
    antiguedad: formData.antiguedad || '',
    anio_ingreso: formData.anio_ingreso || '',
    
    // Datos económicos y jerárquicos
    ingreso: formData.ingreso || '',
    nivel_jerarquico: formData.nivel_jerarquico || '',
    
    // Condición de trabajo
    condicion_trabajo: formData.condicion_trabajo || '',
    condicion_otro: formData.condicion_otro || '',
    
    // Metadata
    timestamp: formData.timestamp || new Date().toISOString(),
    ultimaModificacion: new Date().toISOString()
  };
  
  return datos;
}

/**
 * Función para parsear datos de empleo desde Firestore
 * @param {Object} data - Datos crudos desde Firestore
 * @returns {Object} - Objeto de empleo estructurado
 */
window.parseEmpleoFirestore = function(data) {
  if (!data) return null;
  
  return {
    // Tiempo para obtener empleo
    tiempo_primer_empleo: data.tiempo_primer_empleo || '',
    
    // Medio para obtener empleo
    medio_obtener_empleo: data.medio_obtener_empleo || '',
    medio_otro: data.medio_otro || '',
    
    // Requisitos de contratación
    requisitos_contratacion: data.requisitos_contratacion || [],
    requisito_otro: data.requisito_otro || '',
    
    // Idioma
    idioma: data.idioma || '',
    idioma_otro: data.idioma_otro || '',
    
    // Habilidades del idioma
    habilidad_hablar: data.habilidad_hablar || 0,
    habilidad_escribir: data.habilidad_escribir || 0,
    habilidad_leer: data.habilidad_leer || 0,
    habilidad_escuchar: data.habilidad_escuchar || 0,
    
    // Antigüedad
    antiguedad: data.antiguedad || '',
    anio_ingreso: data.anio_ingreso || '',
    
    // Datos económicos y jerárquicos
    ingreso: data.ingreso || '',
    nivel_jerarquico: data.nivel_jerarquico || '',
    
    // Condición de trabajo
    condicion_trabajo: data.condicion_trabajo || '',
    condicion_otro: data.condicion_otro || '',
    
    // Metadata
    timestamp: data.timestamp || null,
    ultimaModificacion: data.ultimaModificacion || null
  };
}
