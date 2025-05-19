/* =====================================================
   Modelo de Evaluación: Manejo de datos del módulo 2
   ===================================================== */

/**
 * Función para crear un objeto de evaluación a partir de un formulario
 * @param {HTMLFormElement} form - El formulario con los datos
 * @returns {Object} - Objeto con los datos de evaluación
 */
export function crearObjetoEvaluacion(form) {
  if (!form) return null;
  
  return {
    // Calificaciones de aspectos académicos
    calidad_docentes: form.calidad_docentes?.value || '',
    plan_estudios: form.plan_estudios?.value || '',
    oportunidad_proyectos: form.oportunidad_proyectos?.value || '',
    enfasis_investigacion: form.enfasis_investigacion?.value || '',
    satisfaccion_infraestructura: form.satisfaccion_infraestructura?.value || '',
    experiencia_residencia: form.experiencia_residencia?.value || '',
    
    // Metadata
    timestamp: new Date().toISOString()
  };
}

/**
 * Función para parsear datos de evaluación desde Firestore
 * @param {Object} data - Datos crudos desde Firestore
 * @returns {Object} - Objeto de evaluación estructurado
 */
export function parseEvaluacionFirestore(data) {
  if (!data) return null;
  
  return {
    // Calificaciones de aspectos académicos
    calidad_docentes: data.calidad_docentes || '',
    plan_estudios: data.plan_estudios || '',
    oportunidad_proyectos: data.oportunidad_proyectos || '',
    enfasis_investigacion: data.enfasis_investigacion || '',
    satisfaccion_infraestructura: data.satisfaccion_infraestructura || '',
    experiencia_residencia: data.experiencia_residencia || '',
    
    // Metadata
    timestamp: data.timestamp || null,
    ultimaModificacion: data.ultimaModificacion || null
  };
}
