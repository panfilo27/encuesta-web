/**
 * excel-export-modulo2.js
 * Formateador específico para exportar datos del Módulo 2 (Satisfacción Académica) a Excel
 */

window.ExcelExportModulo2 = (function() {
  /**
   * Formatea los datos del Módulo 2 para exportación a Excel
   * @param {Object} datosModulo2 - Datos del módulo 2 de la encuesta
   * @returns {Object} Objeto con las claves y valores formateados para Excel
   */
  function formatearDatos(datosModulo2) {
    if (!datosModulo2) {
      console.warn('[Excel Export Módulo 2] No hay datos para formatear');
      return {};
    }
    
    console.log('[Excel Export Módulo 2] Formateando datos de satisfacción académica');
    
    // Mapeo de los valores numéricos a texto descriptivo
    const mapeoValoraciones = {
      '4': 'Muy Buena',
      '3': 'Buena',
      '2': 'Regular',
      '1': 'Mala'
    };
    
    // Crear objeto con las claves correspondientes a las preguntas del módulo 2
    const datosFormateados = {
      // Plan de estudios
      'Valoración Plan de Estudios': mapeoValoraciones[datosModulo2.planEstudios] || datosModulo2.planEstudios || '',
      
      // Satisfacción con aspectos específicos
      'Valoración Docentes': mapeoValoraciones[datosModulo2.docentes] || datosModulo2.docentes || '',
      'Valoración Instalaciones': mapeoValoraciones[datosModulo2.instalaciones] || datosModulo2.instalaciones || '',
      'Valoración Actividades Extraescolares': mapeoValoraciones[datosModulo2.actividadesExtraescolares] || datosModulo2.actividadesExtraescolares || '',
      'Valoración Laboratorios': mapeoValoraciones[datosModulo2.laboratorios] || datosModulo2.laboratorios || '',
      'Valoración Investigación': mapeoValoraciones[datosModulo2.investigacion] || datosModulo2.investigacion || ''
    };
    
    // Formatear cualquier campo adicional que pueda existir
    for (const [key, value] of Object.entries(datosModulo2)) {
      // Si no está incluido en los campos anteriores, añadirlo con un prefijo
      if (!Object.keys(datosFormateados).some(k => k.includes(key))) {
        // Excluir campos técnicos o de metadatos
        if (!['userId', 'timestamp'].includes(key)) {
          datosFormateados[`Valoración ${key}`] = typeof value === 'string' ? value : (mapeoValoraciones[value] || value || '');
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

console.log('[Excel Export Módulo 2] Módulo cargado');
