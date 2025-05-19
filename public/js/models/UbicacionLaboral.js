/* =====================================================
   Modelo de Ubicación Laboral: Manejo de datos del módulo 3
   ===================================================== */

/**
 * Función para crear un objeto de ubicación laboral a partir de un formulario
 * @param {HTMLFormElement} form - El formulario con los datos
 * @returns {Object} - Objeto con los datos de ubicación laboral
 */
window.crearObjetoUbicacionLaboral = function(form) {
  if (!form) return null;
  
  // Datos base
  const datos = {
    // Actividad actual
    actividad_actual: form.actividad_actual?.value || '',
    
    // Datos de estudios (si aplica)
    estudia: form.actividad_actual?.value?.includes('Estudia') || false,
    tipo_estudio: form.tipo_estudio?.value || '',
    otro_estudio: form.otro_estudio?.value || '',
    especialidad_institucion: form.especialidad_institucion?.value || '',
    
    // Datos de trabajo (se completarán en módulos subsecuentes)
    trabaja: form.actividad_actual?.value?.includes('Trabaja') || false,
    
    // Metadata
    timestamp: new Date().toISOString()
  };
  
  return datos;
}

/**
 * Función para parsear datos de ubicación laboral desde Firestore
 * @param {Object} data - Datos crudos desde Firestore
 * @returns {Object} - Objeto de ubicación laboral estructurado
 */
window.parseUbicacionLaboralFirestore = function(data) {
  if (!data) return null;
  
  return {
    // Actividad actual
    actividad_actual: data.actividad_actual || '',
    
    // Datos de estudios
    estudia: data.estudia === true,
    tipo_estudio: data.tipo_estudio || '',
    otro_estudio: data.otro_estudio || '',
    especialidad_institucion: data.especialidad_institucion || '',
    
    // Datos de trabajo
    trabaja: data.trabaja === true,
    
    // Metadata
    timestamp: data.timestamp || null,
    ultimaModificacion: data.ultimaModificacion || null
  };
}
