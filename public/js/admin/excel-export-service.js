/**
 * excel-export-service.js
 * Servicio para exportar datos de encuestas a Excel
 */

window.ExcelExportService = (function() {
  // Dependencias
  // Usamos SheetJS (xlsx) para la exportación a Excel
  // Asumimos que xlsx.full.min.js ya está incluido en la página
  
  // Variables privadas
  let initialized = false;
  
  /**
   * Inicializa el servicio de exportación
   */
  function init() {
    if (initialized) return;
    
    console.log('[Excel Export Service] Inicializando...');
    
    // Verificar que la librería xlsx esté cargada
    if (typeof XLSX === 'undefined') {
      console.error('[Excel Export Service] Error: La librería SheetJS (xlsx) no está cargada.');
      alert('Error: No se puede inicializar el servicio de exportación. Falta la librería SheetJS.');
      return;
    }
    
    initialized = true;
    console.log('[Excel Export Service] Inicializado correctamente');
  }
  
  /**
   * Exporta datos a un archivo Excel
   * @param {Object[]} data - Array de objetos con los datos a exportar
   * @param {string} filename - Nombre del archivo sin extensión
   * @param {string} sheetName - Nombre de la hoja de cálculo
   */
  function exportToExcel(data, filename, sheetName = 'Datos') {
    if (!initialized) {
      init();
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('[Excel Export Service] Error: No hay datos para exportar');
      alert('No hay datos para exportar a Excel.');
      return;
    }
    
    try {
      // Crear un nuevo libro de trabajo
      const workbook = XLSX.utils.book_new();
      
      // Convertir los datos a una hoja de cálculo
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Generar el archivo y descargarlo
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      
      console.log(`[Excel Export Service] Archivo ${filename}.xlsx exportado correctamente`);
    } catch (error) {
      console.error('[Excel Export Service] Error al exportar a Excel:', error);
      alert(`Error al exportar a Excel: ${error.message}`);
    }
  }
  
  /**
   * Exporta los datos de una encuesta específica
   * @param {string} encuestaId - ID de la encuesta a exportar
   * @param {string} periodoNombre - Nombre del período para el nombre del archivo
   */
  async function exportarEncuesta(encuestaId, periodoNombre) {
    try {
      console.log(`[Excel Export Service] Exportando encuesta ${encuestaId}...`);
      
      // Obtener el documento de la encuesta
      const db = firebase.firestore();
      const user = firebase.auth().currentUser;
      
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }
      
      // Obtenemos todos los módulos para esta encuesta
      const encuestaDoc = await db.collection('usuarios')
        .doc(user.uid)
        .collection('historialEncuestas')
        .doc(encuestaId)
        .get();
      
      if (!encuestaDoc.exists) {
        throw new Error('La encuesta no existe');
      }
      
      const encuestaData = encuestaDoc.data();
      
      // Verificar si hay módulos específicos registrados
      const formatedData = await formatearDatosEncuesta(encuestaData);
      
      // Generar nombre de archivo basado en período y fecha
      const fechaStr = new Date().toISOString().slice(0, 10);
      const fileName = `Encuesta_${periodoNombre.replace(/\s+/g, '_')}_${fechaStr}`;
      
      // Exportar datos formateados
      exportToExcel(formatedData, fileName, 'Datos de encuesta');
      
      return true;
    } catch (error) {
      console.error('[Excel Export Service] Error al exportar encuesta:', error);
      alert(`Error al exportar encuesta: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Exporta todas las encuestas de un periodo específico para los egresados filtrados
   * @param {string} periodoId - ID del periodo
   * @param {string[]} [graduateIds] - Array con IDs de egresados filtrados (opcional)
   */
  async function exportarEncuestasPorPeriodo(periodoId, graduateIds = null) {
    try {
      console.log(`[Excel Export Service] Exportando encuestas del periodo ${periodoId}...`);
      
      // Obtener referencia a Firestore
      const db = firebase.firestore();
      
      // Primero obtenemos información del periodo
      const periodoDoc = await db.collection('surveyPeriods').doc(periodoId).get();
      
      if (!periodoDoc.exists) {
        throw new Error('El periodo seleccionado no existe');
      }
      
      const periodoData = periodoDoc.data();
      const periodoNombre = periodoData.name || 'Periodo_Sin_Nombre';
      
      // Obtener las encuestas de los usuarios egresados
      let usuariosQuery = db.collection('usuarios').where('rol', '==', 'egresado');
      
      // Si se proporcionaron IDs de egresados filtrados, restringir la consulta a esos IDs
      if (graduateIds && Array.isArray(graduateIds) && graduateIds.length > 0) {
        console.log(`[Excel Export Service] Aplicando filtro para ${graduateIds.length} egresados específicos`);
        
        // Firestore tiene límite de 10 elementos en las consultas 'in'
        // Si hay más de 10 IDs, necesitamos dividir la consulta
        if (graduateIds.length <= 10) {
          usuariosQuery = usuariosQuery.where(firebase.firestore.FieldPath.documentId(), 'in', graduateIds);
        } else {
          // Para más de 10 IDs, hacemos la consulta completa y filtramos después
          console.log('[Excel Export Service] Más de 10 egresados filtrados, aplicando filtro post-consulta');
        }
      }
      
      const usuarios = await usuariosQuery.get();
      
      if (usuarios.empty) {
        throw new Error('No hay egresados que coincidan con los criterios de búsqueda');
      }
      
      // Si había más de 10 IDs y no pudimos usar la cláusula 'in', filtramos los resultados manualmente
      let usuariosFiltrados = usuarios.docs;
      if (graduateIds && graduateIds.length > 10) {
        usuariosFiltrados = usuarios.docs.filter(doc => graduateIds.includes(doc.id));
        if (usuariosFiltrados.length === 0) {
          throw new Error('No hay egresados que coincidan con los criterios de búsqueda');
        }
      }
      
      // Vamos a recolectar todas las encuestas de este periodo
      let encuestasData = [];
      
      // Crear una promesa para cada usuario
      const promesasUsuarios = usuariosFiltrados.map(async (usuarioDoc) => {
        const userId = usuarioDoc.id;
        const userData = usuarioDoc.data();
        
        // MODIFICACIÓN: Consultar encuestas que tengan el periodoId específico O que tengan "default"
        const historialEncuestasRef = db.collection('usuarios').doc(userId).collection('historialEncuestas');
        
        // Hacer dos consultas: una para el periodoId específico y otra para 'default'
        const [encuestasPeriodoSnapshot, encuestasDefaultSnapshot] = await Promise.all([
          historialEncuestasRef.where('periodoId', '==', periodoId).get(),
          historialEncuestasRef.where('periodoId', '==', 'default').get()
        ]);
        
        // Procesar encuestas del periodo específico
        if (!encuestasPeriodoSnapshot.empty) {
          for (const encuestaDoc of encuestasPeriodoSnapshot.docs) {
            const encuestaData = encuestaDoc.data();
            encuestaData.userId = userId;
            encuestaData.nombreUsuario = userData.nombre || '';
            encuestaData.apellidoPaterno = userData.apellidoPaterno || '';
            encuestaData.apellidoMaterno = userData.apellidoMaterno || '';
            encuestaData.email = userData.email || '';
            encuestaData.carrera = userData.carrera || '';
            encuestasData.push(encuestaData);
          }
        }
        
        // Procesar encuestas con periodoId = 'default'
        if (!encuestasDefaultSnapshot.empty) {
          for (const encuestaDoc of encuestasDefaultSnapshot.docs) {
            const encuestaData = encuestaDoc.data();
            // Solo incluir si no hay una encuesta con el periodoId específico para este usuario
            if (encuestasPeriodoSnapshot.empty) {
              encuestaData.userId = userId;
              encuestaData.nombreUsuario = userData.nombre || '';
              encuestaData.apellidoPaterno = userData.apellidoPaterno || '';
              encuestaData.apellidoMaterno = userData.apellidoMaterno || '';
              encuestaData.email = userData.email || '';
              encuestaData.carrera = userData.carrera || '';
              // Asignar el periodoId actual para que se muestre en el mismo grupo
              encuestaData.periodoId = periodoId;
              encuestaData.periodoNombre = periodoNombre;
              encuestasData.push(encuestaData);
            }
          }
        }
      });
      
      // Esperar a que se completen todas las promesas
      await Promise.all(promesasUsuarios);
      
      if (encuestasData.length === 0) {
        throw new Error(`No se encontraron encuestas para el periodo ${periodoNombre}. Intente exportar las últimas encuestas completadas.`);
      }
      
      console.log(`[Excel Export Service] Se encontraron ${encuestasData.length} encuestas para el periodo ${periodoNombre}`);
      
      // Formatear todos los datos para exportación
      const datosFormateados = await formatearMultiplesEncuestas(encuestasData);
      
      // Generar nombre de archivo basado en período y fecha
      const fechaStr = new Date().toISOString().slice(0, 10);
      const fileName = `Encuestas_${periodoNombre.replace(/\s+/g, '_')}_${fechaStr}`;
      
      // Exportar datos
      exportToExcel(datosFormateados, fileName, periodoNombre);
      
      return true;
    } catch (error) {
      console.error('[Excel Export Service] Error al exportar encuestas por periodo:', error);
      alert(`Error al exportar encuestas: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Formatea los datos de una encuesta para exportación
   * @param {Object} encuestaData - Datos de la encuesta
   * @returns {Promise<Object[]>} Datos formateados listos para exportar
   */
  async function formatearDatosEncuesta(encuestaData) {
    console.log('[Excel Export Service] Formateando datos de encuesta para exportación');
    
    // Objeto que contendrá los datos formateados como una fila
    let formattedRow = {};
    
    // Estructura de mapeo entre nombre de campo en Firestore y objeto exportador
    const modulosMapping = [
      { campo: 'datosPersonales', exportador: 'ExcelExportModulo1' },
      { campo: 'ubicacionResidencia', exportador: 'ExcelExportModulo2' },
      { campo: 'datosAcademicos', exportador: 'ExcelExportModulo3' },
      { campo: 'empleoActual', exportador: 'ExcelExportModulo4' },
      { campo: 'desempeñoProfesional', exportador: 'ExcelExportModulo5' },
      { campo: 'expectativasDesarrollo', exportador: 'ExcelExportModulo6' },
      { campo: 'participacionSocial', exportador: 'ExcelExportModulo7' },
      { campo: 'retroalimentacionItch', exportador: 'ExcelExportModulo8' },
      { campo: 'comentariosSugerencias', exportador: 'ExcelExportModulo9' }
    ];
    
    try {
      // Procesar cada módulo si está disponible en los datos
      for (const modulo of modulosMapping) {
        const exportadorNombre = modulo.exportador;
        const datosCampo = encuestaData[modulo.campo];
        
        // Verificar si existe el exportador y los datos para este módulo
        if (window[exportadorNombre] && datosCampo) {
          console.log(`[Excel Export Service] Procesando ${modulo.campo} con ${exportadorNombre}`);
          try {
            const datosFormateados = window[exportadorNombre].formatearDatos(datosCampo);
            Object.assign(formattedRow, datosFormateados);
          } catch (moduloError) {
            console.warn(`[Excel Export Service] Error al formatear ${modulo.campo}:`, moduloError);
            // Continuamos con el siguiente módulo aunque este falle
          }
        }
      }
      
      // Añadir metadatos generales
      if (encuestaData.fechaCompletado) {
        try {
          const fecha = encuestaData.fechaCompletado.toDate ? 
            encuestaData.fechaCompletado.toDate() : 
            new Date(encuestaData.fechaCompletado.seconds * 1000);
            
          formattedRow['Fecha de completado'] = fecha.toLocaleDateString('es-MX', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          });
        } catch (fechaError) {
          console.warn('[Excel Export Service] Error al formatear fecha:', fechaError);
          formattedRow['Fecha de completado'] = 'No disponible';
        }
      }
      
      // Añadir información del periodo
      formattedRow['Periodo'] = encuestaData.periodoNombre || 'No especificado';
      formattedRow['ID Periodo'] = encuestaData.periodoId || '';
      
      // Añadir ID de la encuesta si está disponible
      if (encuestaData.id) {
        formattedRow['ID Encuesta'] = encuestaData.id;
      }
      
      return [formattedRow]; // Retornamos array con una sola fila para esta encuesta
    } catch (error) {
      console.error('[Excel Export Service] Error al formatear datos:', error);
      throw error;
    }
  }
  
  /**
   * Formatea múltiples encuestas para exportación
   * @param {Object[]} encuestasData - Array de datos de encuestas
   * @returns {Promise<Object[]>} Datos formateados listos para exportar
   */
  async function formatearMultiplesEncuestas(encuestasData) {
    console.log(`[Excel Export Service] Formateando ${encuestasData.length} encuestas`);
    
    // Array para almacenar todas las filas de datos
    const allRows = [];
    
    // Procesar cada encuesta
    for (const encuestaData of encuestasData) {
      try {
        // Formatear esta encuesta
        const encuestaFormateada = await formatearDatosEncuesta(encuestaData);
        
        // Añadir datos de identificación del usuario si están disponibles
        if (encuestaFormateada.length > 0) {
          encuestaFormateada[0]['ID Usuario'] = encuestaData.userId || '';
          encuestaFormateada[0]['Nombre'] = encuestaData.nombreUsuario || '';
          encuestaFormateada[0]['Apellido Paterno'] = encuestaData.apellidoPaterno || '';
          encuestaFormateada[0]['Apellido Materno'] = encuestaData.apellidoMaterno || '';
          encuestaFormateada[0]['Email'] = encuestaData.email || '';
          
          // Añadir la fila al conjunto total
          allRows.push(encuestaFormateada[0]);
        }
      } catch (error) {
        console.error(`[Excel Export Service] Error al formatear encuesta de usuario ${encuestaData.userId}:`, error);
        // Continuamos con la siguiente encuesta
      }
    }
    
    console.log(`[Excel Export Service] Se formatearon ${allRows.length} encuestas correctamente`);
    return allRows;
  }
  
  /**
   * Exporta la última encuesta completada por cada egresado
   * @param {string[]} [graduateIds] - Array con IDs de egresados filtrados (opcional)
   */
  async function exportarUltimasEncuestas(graduateIds = null) {
    try {
      console.log('[Excel Export Service] Exportando últimas encuestas completadas...');
      
      // Obtener referencia a Firestore
      const db = firebase.firestore();
      
      // Obtener los egresados filtrados o todos los egresados
      let usuariosSnapshot;
      if (graduateIds && Array.isArray(graduateIds) && graduateIds.length > 0) {
        console.log(`[Excel Export Service] Filtrando por ${graduateIds.length} egresados específicos`);
        
        // Si hay pocos IDs, podemos obtenerlos directamente
        if (graduateIds.length <= 10) {
          // Crear array de promesas para obtener cada documento
          const promesasUsuarios = graduateIds.map(id => db.collection('usuarios').doc(id).get());
          const usuariosDocs = await Promise.all(promesasUsuarios);
          
          // Filtrar solo los que existen
          usuariosSnapshot = {
            docs: usuariosDocs.filter(doc => doc.exists),
            empty: usuariosDocs.every(doc => !doc.exists)
          };
        } else {
          // Para muchos IDs, hacemos la consulta completa y filtramos
          usuariosSnapshot = await db.collection('usuarios')
            .where('rol', '==', 'egresado')
            .get();
            
          // Filtrar manualmente
          usuariosSnapshot.docs = usuariosSnapshot.docs.filter(doc => graduateIds.includes(doc.id));
          usuariosSnapshot.empty = usuariosSnapshot.docs.length === 0;
        }
      } else {
        // Sin filtro, obtener todos los egresados
        usuariosSnapshot = await db.collection('usuarios')
          .where('rol', '==', 'egresado')
          .get();
      }
      
      if (usuariosSnapshot.empty) {
        throw new Error('No hay egresados que coincidan con los criterios de búsqueda');
      }
      
      let encuestasData = [];
      
      // Para cada usuario, buscar su historial de encuestas
      for (const usuarioDoc of usuariosSnapshot.docs) {
        const userId = usuarioDoc.id;
        const userData = usuarioDoc.data();
        
        // Buscar encuestas completadas, ordenadas por fecha (la más reciente primero)
        const historialSnapshot = await db.collection('usuarios')
          .doc(userId)
          .collection('historialEncuestas')
          .orderBy('fechaCompletado', 'desc')
          .limit(1)
          .get();
        
        if (!historialSnapshot.empty) {
          // Obtener la encuesta más reciente
          const encuestaDoc = historialSnapshot.docs[0];
          const encuestaData = encuestaDoc.data();
          
          // Añadir datos del usuario a la encuesta para identificación
          encuestaData.userId = userId;
          encuestaData.nombreUsuario = userData.nombre || '';
          encuestaData.apellidoPaterno = userData.apellidoPaterno || '';
          encuestaData.apellidoMaterno = userData.apellidoMaterno || '';
          encuestaData.email = userData.email || '';
          encuestaData.carrera = userData.carrera || '';
          
          // Si no tiene periodoId o es 'default', asignar un identificador genérico
          if (!encuestaData.periodoId || encuestaData.periodoId === 'default') {
            encuestaData.periodoId = 'ultima_encuesta';
            encuestaData.periodoNombre = 'Última Encuesta Completada';
          }
          
          // Incluir la fecha de completado en un formato legible
          if (encuestaData.fechaCompletado) {
            try {
              // Convertir timestamp de Firestore a fecha legible
              const fecha = encuestaData.fechaCompletado.toDate ? 
                encuestaData.fechaCompletado.toDate() : 
                new Date(encuestaData.fechaCompletado);
              
              encuestaData.fechaCompletadoStr = fecha.toLocaleDateString('es-MX', {
                year: 'numeric', month: 'long', day: 'numeric'
              });
            } catch (e) {
              console.warn('Error al formatear fecha:', e);
              encuestaData.fechaCompletadoStr = 'Fecha no disponible';
            }
          }
          
          // Guardar para procesar después
          encuestasData.push(encuestaData);
        }
      }
      
      if (encuestasData.length === 0) {
        throw new Error('No hay encuestas completadas por ningún egresado');
      }
      
      console.log(`[Excel Export Service] Se encontraron ${encuestasData.length} encuestas para exportar`);
      
      // Formatear todos los datos para exportación
      const datosFormateados = await formatearMultiplesEncuestas(encuestasData);
      
      // Generar nombre de archivo
      const fechaStr = new Date().toISOString().slice(0, 10);
      const fileName = `Ultimas_Encuestas_${fechaStr}`;
      
      // Exportar datos
      exportToExcel(datosFormateados, fileName, 'Últimas Encuestas Completadas');
      
      return true;
    } catch (error) {
      console.error('[Excel Export Service] Error al exportar últimas encuestas:', error);
      alert(`Error al exportar encuestas: ${error.message}`);
      return false;
    }
  }

  // Exponer funciones públicas
  return {
    init,
    exportToExcel,
    exportarEncuesta,
    exportarEncuestasPorPeriodo,
    exportarUltimasEncuestas
  };
})();

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  if (window.ExcelExportService) {
    window.ExcelExportService.init();
  }
});
