/**
 * excel-export-modulo6.js
 * Formateador específico para exportar datos del Módulo 6 (Expectativas de Desarrollo) a Excel
 */

window.ExcelExportModulo6 = (function() {
  /**
   * Formatea los datos del Módulo 6 para exportación a Excel
   * @param {Object} datosModulo6 - Datos del módulo 6 de la encuesta
   * @returns {Object} Objeto con las claves y valores formateados para Excel
   */
  function formatearDatos(datosModulo6) {
    if (!datosModulo6) {
      console.warn('[Excel Export Módulo 6] No hay datos para formatear');
      return {};
    }
    
    console.log('[Excel Export Módulo 6] Formateando datos de expectativas de desarrollo');
    
    // Mapeo para valores numéricos a texto descriptivo si es necesario
    const mapeoValoraciones = {
      '5': 'Muy importante',
      '4': 'Importante',
      '3': 'Moderadamente importante',
      '2': 'Poco importante',
      '1': 'No importante'
    };
    
    // Crear objeto con las claves correspondientes a las preguntas del módulo 6
    const datosFormateados = {
      // Aspectos valorados por la empresa (si existen)
      'Conocimientos Técnicos': mapeoValoraciones[datosModulo6.conocimientosTecnicos] || datosModulo6.conocimientosTecnicos || '',
      'Habilidades Comunicación': mapeoValoraciones[datosModulo6.habilidadesComunicacion] || datosModulo6.habilidadesComunicacion || '',
      'Trabajo en Equipo': mapeoValoraciones[datosModulo6.trabajoEquipo] || datosModulo6.trabajoEquipo || '',
      'Liderazgo': mapeoValoraciones[datosModulo6.liderazgo] || datosModulo6.liderazgo || '',
      'Resolución Problemas': mapeoValoraciones[datosModulo6.resolucionProblemas] || datosModulo6.resolucionProblemas || '',
      'Ética Profesional': mapeoValoraciones[datosModulo6.eticaProfesional] || datosModulo6.eticaProfesional || ''
    };
    
    // Aspectos personalizados (si existen)
    if (datosModulo6.aspectosPersonalizados && Array.isArray(datosModulo6.aspectosPersonalizados)) {
      datosModulo6.aspectosPersonalizados.forEach((aspecto, index) => {
        if (typeof aspecto === 'object') {
          datosFormateados[`Aspecto Personalizado ${index+1}: ${aspecto.nombre}`] = 
            mapeoValoraciones[aspecto.valoracion] || aspecto.valoracion || '';
        } else {
          datosFormateados[`Aspecto Personalizado ${index+1}`] = aspecto;
        }
      });
    }
    
    // Formatear cualquier campo adicional que pueda existir
    for (const [key, value] of Object.entries(datosModulo6)) {
      // Si no está incluido en los campos anteriores, añadirlo
      if (!Object.keys(datosFormateados).some(k => k.includes(key))) {
        // Excluir campos técnicos o de metadatos y arrays ya procesados
        if (!['userId', 'timestamp', 'aspectosPersonalizados'].includes(key)) {
          datosFormateados[key] = typeof value === 'string' ? value : 
            (mapeoValoraciones[value] || value || '');
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

console.log('[Excel Export Módulo 6] Módulo cargado');
