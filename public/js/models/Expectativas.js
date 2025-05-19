/**
 * Modelo para el Módulo 7 - Expectativas de Desarrollo
 * 
 * Este archivo contiene las funciones para convertir datos del formulario
 * a objetos estructurados y viceversa para el módulo de expectativas.
 */

/**
 * Función para crear un objeto de expectativas desde un formulario
 * @param {HTMLFormElement} form - Formulario de expectativas
 * @returns {Object} - Objeto de expectativas estructurado
 */
export function crearObjetoExpectativas(form) {
  if (!form) return null;
  
  // Construir objeto base
  const expectativas = {
    // Datos de cursos de actualización
    cursos_actualizacion: form.querySelector('input[name="cursos_actualizacion"]:checked')?.value || '',
    
    // Datos de posgrado
    tomar_posgrado: form.querySelector('input[name="tomar_posgrado"]:checked')?.value || '',
    
    // Metadata
    timestamp: new Date().toISOString()
  };
  
  // Añadir datos condicionales si corresponde
  if (expectativas.cursos_actualizacion === 'Sí') {
    expectativas.cuales_cursos = form.querySelector('input[name="cuales_cursos"]')?.value || '';
  }
  
  if (expectativas.tomar_posgrado === 'Sí') {
    expectativas.cual_posgrado = form.querySelector('input[name="cual_posgrado"]')?.value || '';
  }
  
  return expectativas;
}

/**
 * Función para parsear datos de expectativas desde Firestore
 * @param {Object} data - Datos crudos desde Firestore
 * @returns {Object} - Objeto de expectativas estructurado
 */
export function parseExpectativasFirestore(data) {
  if (!data) return null;
  
  const expectativas = {
    // Datos de cursos de actualización
    cursos_actualizacion: data.cursos_actualizacion || '',
    cuales_cursos: data.cuales_cursos || '',
    
    // Datos de posgrado
    tomar_posgrado: data.tomar_posgrado || '',
    cual_posgrado: data.cual_posgrado || '',
    
    // Metadata
    timestamp: data.timestamp || null,
    ultimaModificacion: data.ultimaModificacion || null
  };
  
  return expectativas;
}
