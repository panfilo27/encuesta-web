/**
 * excel-export-modulo1.js
 * Formateador específico para exportar datos del Módulo 1 (Datos Personales) a Excel
 */

window.ExcelExportModulo1 = (function() {
  /**
   * Formatea los datos del Módulo 1 para exportación a Excel
   * @param {Object} datosModulo1 - Datos del módulo 1 de la encuesta
   * @returns {Object} Objeto con las claves y valores formateados para Excel
   */
  function formatearDatos(datosModulo1) {
    if (!datosModulo1) {
      console.warn('[Excel Export Módulo 1] No hay datos para formatear');
      return {};
    }
    
    console.log('[Excel Export Módulo 1] Formateando datos personales');
    
    // Crear objeto con las claves correspondientes a las preguntas del módulo 1
    const datosFormateados = {
      // Datos personales básicos
      'Nombre': datosModulo1.nombre || '',
      'Apellido Paterno': datosModulo1.apellidoPaterno || '',
      'Apellido Materno': datosModulo1.apellidoMaterno || '',
      'No. Control': datosModulo1.noControl || '',
      'Fecha Nacimiento': datosModulo1.fechaNacimiento || '',
      'CURP': datosModulo1.curp || '',
      'Sexo': datosModulo1.sexo || '',
      'Estado Civil': datosModulo1.estadoCivil || '',
      
      // Dirección
      'Domicilio': datosModulo1.domicilio || '',
      'Ciudad': datosModulo1.ciudad || '',
      'Municipio': datosModulo1.municipio || '',
      'Estado': datosModulo1.estado || '',
      
      // Contacto
      'Teléfono': datosModulo1.telefono || '',
      'Email': datosModulo1.email || '',
      'Tel. Casa Paterna': datosModulo1.telCasa || '',
      
      // Datos académicos
      'Carrera': datosModulo1.carrera || '',
      'Carrera Nombre': datosModulo1.carreraNombre || '',
      'Fecha Egreso': datosModulo1.fechaEgreso || '',
      'Titulado': datosModulo1.titulado || ''
    };
    
    // Formatear idiomas (pueden ser múltiples)
    if (datosModulo1.idiomas && Array.isArray(datosModulo1.idiomas)) {
      datosModulo1.idiomas.forEach((idioma, index) => {
        const num = index + 1;
        datosFormateados[`Idioma ${num}`] = idioma.idioma || '';
        datosFormateados[`Idioma ${num} Porcentaje`] = idioma.porcentaje || '';
        if (idioma.idioma === 'Otro') {
          datosFormateados[`Idioma ${num} Otro`] = idioma.otro || '';
        }
      });
    }
    
    // Formatear paquetes de software (pueden ser múltiples)
    if (datosModulo1.paquetes && Array.isArray(datosModulo1.paquetes)) {
      datosModulo1.paquetes.forEach((paquete, index) => {
        const num = index + 1;
        datosFormateados[`Software ${num}`] = paquete.paquete || '';
        if (paquete.paquete === 'Otro') {
          datosFormateados[`Software ${num} Otro`] = paquete.otro || '';
        }
      });
    }
    
    return datosFormateados;
  }
  
  // Exponer funciones públicas
  return {
    formatearDatos
  };
})();

console.log('[Excel Export Módulo 1] Módulo cargado');
