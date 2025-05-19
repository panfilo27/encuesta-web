/**
 * Modelo para el Módulo 8 - Participación Social de los Egresados
 * 
 * Este archivo contiene las funciones para convertir datos del formulario
 * a objetos estructurados y viceversa para el módulo de participación social.
 */

/**
 * Función para crear un objeto de participación social desde un formulario
 * @param {HTMLFormElement} form - Formulario de participación social
 * @param {Array} organizacionesSociales - Lista de organizaciones sociales añadidas
 * @returns {Object} - Objeto de participación social estructurado
 */
export function crearObjetoParticipacionSocial(form, organizacionesSociales = []) {
  if (!form) return null;
  
  // Construir objeto base
  const participacionSocial = {
    // Datos de organizaciones sociales
    pertenece_org_sociales: form.querySelector('input[name="pertenece_org_sociales"]:checked')?.value || '',
    
    // Datos de organismos profesionales
    pertenece_org_profesionales: form.querySelector('input[name="pertenece_org_profesionales"]:checked')?.value || '',
    
    // Datos de asociación de egresados
    pertenece_asoc_egresados: form.querySelector('input[name="pertenece_asoc_egresados"]:checked')?.value || '',
    
    // Metadata
    timestamp: new Date().toISOString()
  };
  
  // Añadir datos condicionales si corresponde
  if (participacionSocial.pertenece_org_sociales === 'Sí') {
    participacionSocial.organizaciones_sociales = Array.isArray(organizacionesSociales) 
      ? organizacionesSociales 
      : [];
  }
  
  if (participacionSocial.pertenece_org_profesionales === 'Sí') {
    participacionSocial.cual_organismo_profesional = form.querySelector('input[name="cual_organismo_profesional"]')?.value || '';
  }
  
  return participacionSocial;
}

/**
 * Función para parsear datos de participación social desde Firestore
 * @param {Object} data - Datos crudos desde Firestore
 * @returns {Object} - Objeto de participación social estructurado
 */
export function parseParticipacionSocialFirestore(data) {
  if (!data) return null;
  
  const participacionSocial = {
    // Datos de organizaciones sociales
    pertenece_org_sociales: data.pertenece_org_sociales || '',
    organizaciones_sociales: Array.isArray(data.organizaciones_sociales) ? data.organizaciones_sociales : [],
    
    // Datos de organismos profesionales
    pertenece_org_profesionales: data.pertenece_org_profesionales || '',
    cual_organismo_profesional: data.cual_organismo_profesional || '',
    
    // Datos de asociación de egresados
    pertenece_asoc_egresados: data.pertenece_asoc_egresados || '',
    
    // Metadata
    timestamp: data.timestamp || null,
    ultimaModificacion: data.ultimaModificacion || null
  };
  
  return participacionSocial;
}
