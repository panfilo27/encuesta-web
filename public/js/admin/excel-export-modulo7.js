/**
 * excel-export-modulo7.js
 * Formateador específico para exportar datos del Módulo 7 (Participación Social) a Excel
 */

window.ExcelExportModulo7 = (function() {
  /**
   * Formatea los datos del Módulo 7 para exportación a Excel
   * @param {Object} datosModulo7 - Datos del módulo 7 de la encuesta
   * @returns {Object} Objeto con las claves y valores formateados para Excel
   */
  function formatearDatos(datosModulo7) {
    if (!datosModulo7) {
      console.warn('[Excel Export Módulo 7] No hay datos para formatear');
      return {};
    }
    
    console.log('[Excel Export Módulo 7] Formateando datos de participación social');
    
    // Crear objeto con las claves correspondientes a las preguntas del módulo 7
    const datosFormateados = {
      // Interés en cursos de actualización
      'Interés en Cursos': datosModulo7.interesEnCursos ? 'Sí' : 'No',
      'Tipo de Curso': datosModulo7.tipoCurso || '',
      'Modalidad Preferida': datosModulo7.modalidadPreferida || '',
      
      // Interés en posgrados
      'Interés en Posgrado': datosModulo7.interesEnPosgrado ? 'Sí' : 'No',
      'Tipo de Posgrado': datosModulo7.tipoPosgrado || '',
      'Área de Interés': datosModulo7.areaInteres || '',
      
      // Participación en actividades
      'Actividades Comunitarias': datosModulo7.actividadesComunitarias ? 'Sí' : 'No',
      'Tipo de Actividad': datosModulo7.tipoActividad || ''
    };
    
    // Formatear cualquier campo adicional que pueda existir
    for (const [key, value] of Object.entries(datosModulo7)) {
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

console.log('[Excel Export Módulo 7] Módulo cargado');
