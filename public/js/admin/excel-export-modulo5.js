/**
 * excel-export-modulo5.js
 * Formateador específico para exportar datos del Módulo 5 (Desempeño Profesional) a Excel
 */

window.ExcelExportModulo5 = (function() {
  /**
   * Formatea los datos del Módulo 5 para exportación a Excel
   * @param {Object} datosModulo5 - Datos del módulo 5 de la encuesta
   * @returns {Object} Objeto con las claves y valores formateados para Excel
   */
  function formatearDatos(datosModulo5) {
    if (!datosModulo5) {
      console.warn('[Excel Export Módulo 5] No hay datos para formatear');
      return {};
    }
    
    console.log('[Excel Export Módulo 5] Formateando datos de desempeño profesional');
    
    // Crear objeto con las claves correspondientes a las preguntas del módulo 5
    const datosFormateados = {
      // Datos de la empresa
      'Nombre Empresa': datosModulo5.nombreEmpresa || '',
      'Sector Económico': datosModulo5.sectorEconomico || '',
      'Tamaño Empresa': datosModulo5.tamañoEmpresa || '',
      'Relación con Formación': datosModulo5.relacionFormacion || '',
      
      // Información adicional
      'Área de Trabajo': datosModulo5.areaTrabajo || '',
      'Nivel Jerárquico': datosModulo5.nivelJerarquico || '',
      'Antigüedad': datosModulo5.antiguedad || ''
    };
    
    // Formatear cualquier campo adicional que pueda existir
    for (const [key, value] of Object.entries(datosModulo5)) {
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

console.log('[Excel Export Módulo 5] Módulo cargado');
