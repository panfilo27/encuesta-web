/**
 * excel-export-modulo4.js
 * Formateador específico para exportar datos del Módulo 4 (Empleo Actual) a Excel
 */

window.ExcelExportModulo4 = (function() {
  /**
   * Formatea los datos del Módulo 4 para exportación a Excel
   * @param {Object} datosModulo4 - Datos del módulo 4 de la encuesta
   * @returns {Object} Objeto con las claves y valores formateados para Excel
   */
  function formatearDatos(datosModulo4) {
    if (!datosModulo4) {
      console.warn('[Excel Export Módulo 4] No hay datos para formatear');
      return {};
    }
    
    console.log('[Excel Export Módulo 4] Formateando datos de empleo actual');
    
    // Crear objeto con las claves correspondientes a las preguntas del módulo 4
    const datosFormateados = {
      // Información del primer empleo
      'Puesto Actual': datosModulo4.puestoActual || '',
      'Empresa': datosModulo4.empresa || '',
      'Fecha Inicio': datosModulo4.fechaInicio || '',
      'Salario': datosModulo4.salario || '',
      
      // Habilidades (si existen)
      'Habilidad Hablar': datosModulo4.habilidadHablar || '',
      'Habilidad Escribir': datosModulo4.habilidadEscribir || '',
      'Habilidad Leer': datosModulo4.habilidadLeer || '',
      'Habilidad Escuchar': datosModulo4.habilidadEscuchar || '',
      
      // Requisitos de contratación
      'Requisito Título': datosModulo4.requisitoTitulo ? 'Sí' : 'No',
      'Requisito Experiencia': datosModulo4.requisitoExperiencia ? 'Sí' : 'No',
      'Requisito Competencias': datosModulo4.requisitoCompetencias ? 'Sí' : 'No',
      'Requisito Idiomas': datosModulo4.requisitoIdiomas ? 'Sí' : 'No'
    };
    
    // Requisitos personalizados (si existen)
    if (datosModulo4.requisitosPersonalizados && Array.isArray(datosModulo4.requisitosPersonalizados)) {
      datosModulo4.requisitosPersonalizados.forEach((req, index) => {
        datosFormateados[`Requisito Personalizado ${index + 1}`] = req;
      });
    }
    
    // Formatear cualquier campo adicional que pueda existir
    for (const [key, value] of Object.entries(datosModulo4)) {
      // Si no está incluido en los campos anteriores, añadirlo
      if (!Object.keys(datosFormateados).some(k => k.includes(key))) {
        // Excluir campos técnicos o de metadatos y arrays ya procesados
        if (!['userId', 'timestamp', 'requisitosPersonalizados'].includes(key)) {
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

console.log('[Excel Export Módulo 4] Módulo cargado');
