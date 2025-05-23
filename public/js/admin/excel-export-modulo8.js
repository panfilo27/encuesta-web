/**
 * excel-export-modulo8.js
 * Formateador específico para exportar datos del Módulo 8 (Retroalimentación ITCH) a Excel
 */

window.ExcelExportModulo8 = (function() {
  /**
   * Formatea los datos del Módulo 8 para exportación a Excel
   * @param {Object} datosModulo8 - Datos del módulo 8 de la encuesta
   * @returns {Object} Objeto con las claves y valores formateados para Excel
   */
  function formatearDatos(datosModulo8) {
    if (!datosModulo8) {
      console.warn('[Excel Export Módulo 8] No hay datos para formatear');
      return {};
    }
    
    console.log('[Excel Export Módulo 8] Formateando datos de retroalimentación ITCH');
    
    // Mapeo para valores numéricos a texto descriptivo si es necesario
    const mapeoSatisfaccion = {
      '5': 'Muy satisfecho',
      '4': 'Satisfecho',
      '3': 'Neutral',
      '2': 'Insatisfecho',
      '1': 'Muy insatisfecho'
    };
    
    // Crear objeto con las claves correspondientes a las preguntas del módulo 8
    const datosFormateados = {
      // Satisfacción con la institución
      'Satisfacción General': mapeoSatisfaccion[datosModulo8.satisfaccionGeneral] || datosModulo8.satisfaccionGeneral || '',
      'Recomendaría ITCH': datosModulo8.recomendaria ? 'Sí' : 'No',
      
      // Calificación de aspectos específicos
      'Calidad Docente': mapeoSatisfaccion[datosModulo8.calidadDocente] || datosModulo8.calidadDocente || '',
      'Instalaciones': mapeoSatisfaccion[datosModulo8.instalaciones] || datosModulo8.instalaciones || '',
      'Plan de Estudios': mapeoSatisfaccion[datosModulo8.planEstudios] || datosModulo8.planEstudios || '',
      'Preparación para Trabajo': mapeoSatisfaccion[datosModulo8.preparacionTrabajo] || datosModulo8.preparacionTrabajo || '',
      
      // Retroalimentación cualitativa
      'Fortalezas': datosModulo8.fortalezas || '',
      'Áreas de Mejora': datosModulo8.areasMejora || '',
      'Sugerencias': datosModulo8.sugerencias || ''
    };
    
    // Formatear cualquier campo adicional que pueda existir
    for (const [key, value] of Object.entries(datosModulo8)) {
      // Si no está incluido en los campos anteriores, añadirlo
      if (!Object.keys(datosFormateados).some(k => k.includes(key))) {
        // Excluir campos técnicos o de metadatos
        if (!['userId', 'timestamp'].includes(key)) {
          // Convertir valores numéricos a texto descriptivo si es posible
          if (typeof value === 'number' || (typeof value === 'string' && !isNaN(value))) {
            datosFormateados[key] = mapeoSatisfaccion[value] || value;
          } else if (typeof value === 'boolean') {
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

console.log('[Excel Export Módulo 8] Módulo cargado');
