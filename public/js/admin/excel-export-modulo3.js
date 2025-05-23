/**
 * excel-export-modulo3.js
 * Formateador específico para exportar datos del Módulo 3 (Datos Académicos) a Excel
 */

window.ExcelExportModulo3 = (function() {
  /**
   * Formatea los datos del Módulo 3 para exportación a Excel
   * @param {Object} datosModulo3 - Datos del módulo 3 de la encuesta
   * @returns {Object} Objeto con las claves y valores formateados para Excel
   */
  function formatearDatos(datosModulo3) {
    if (!datosModulo3) {
      console.warn('[Excel Export Módulo 3] No hay datos para formatear');
      return {};
    }
    
    console.log('[Excel Export Módulo 3] Formateando datos académicos');
    
    // Crear objeto con las claves correspondientes a las preguntas del módulo 3
    const datosFormateados = {
      // Datos académicos
      'Institución': datosModulo3.institucion || '',
      'Carrera': datosModulo3.carrera || '',
      'Año de Graduación': datosModulo3.añoGraduacion || '',
      'Promedio': datosModulo3.promedio || '',
      
      // Estatus laboral
      'Trabaja Actualmente': datosModulo3.trabajaActualmente ? 'Sí' : 'No',
      'Razón No Trabaja': datosModulo3.razonNoTrabaja || '',
      'Busca Empleo': datosModulo3.buscaEmpleo ? 'Sí' : 'No'
    };
    
    // Formatear cualquier campo adicional que pueda existir
    for (const [key, value] of Object.entries(datosModulo3)) {
      // Si no está incluido en los campos anteriores, añadirlo
      if (!Object.keys(datosFormateados).some(k => k.includes(key))) {
        // Excluir campos técnicos o de metadatos
        if (!['userId', 'timestamp'].includes(key)) {
          datosFormateados[key] = value;
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

console.log('[Excel Export Módulo 3] Módulo cargado');
