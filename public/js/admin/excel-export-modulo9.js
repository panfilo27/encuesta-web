/**
 * excel-export-modulo9.js
 * Formateador específico para exportar datos del Módulo 9 (Comentarios y Sugerencias) a Excel
 */

window.ExcelExportModulo9 = (function() {
  /**
   * Formatea los datos del Módulo 9 para exportación a Excel
   * @param {Object} datosModulo9 - Datos del módulo 9 de la encuesta
   * @returns {Object} Objeto con las claves y valores formateados para Excel
   */
  function formatearDatos(datosModulo9) {
    if (!datosModulo9) {
      console.warn('[Excel Export Módulo 9] No hay datos para formatear');
      return {};
    }
    
    console.log('[Excel Export Módulo 9] Formateando datos de comentarios y sugerencias');
    
    // Crear objeto con las claves correspondientes a las preguntas del módulo 9
    const datosFormateados = {
      // Comentarios generales
      'Comentarios Generales': datosModulo9.comentariosGenerales || '',
      'Sugerencias Mejora': datosModulo9.sugerenciasMejora || '',
      
      // Experiencia en la encuesta
      'Dificultad Encuesta': datosModulo9.dificultadEncuesta || '',
      'Claridad Preguntas': datosModulo9.claridadPreguntas || '',
      
      // Información de contacto (si dio permiso)
      'Permiso Contacto': datosModulo9.permisoContacto ? 'Sí' : 'No',
      'Teléfono Contacto': datosModulo9.telefonoContacto || '',
      'Email Contacto': datosModulo9.emailContacto || ''
    };
    
    // Formatear cualquier campo adicional que pueda existir
    for (const [key, value] of Object.entries(datosModulo9)) {
      // Si no está incluido en los campos anteriores, añadirlo
      if (!Object.keys(datosFormateados).some(k => k.includes(key))) {
        // Excluir campos técnicos o de metadatos
        if (!['userId', 'timestamp'].includes(key)) {
          // Convertir booleanos a Sí/No para mejor legibilidad en Excel
          if (typeof value === 'boolean') {
            datosFormateados[key] = value ? 'Sí' : 'No';
          } else {
            datosFormateados[key] = value;
          }
        }
      }
    }
    
    return datosFormateados;
  }
  
  // Exponer funciones públicas
  return {
    formatearDatos
  };
})();

console.log('[Excel Export Módulo 9] Módulo cargado');
