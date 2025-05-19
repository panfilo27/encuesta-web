/**
 * graduate-stats.js
 * Funcionalidad para las estadísticas de egresados del jefe de departamento
 */

// Objeto principal para las estadísticas de egresados
const GraduateStats = (function() {
  // Referencia a Firebase
  let db;
  let currentCareerData = null;
  
  // Charts
  let empleoChart = null;
  let titulacionChart = null;
  let sexoChart = null;
  
  // DOM Elements
  const domElements = {
    // Loaders
    empleoChartLoader: document.getElementById('empleoChartLoader'),
    titulacionChartLoader: document.getElementById('titulacionChartLoader'),
    sexoChartLoader: document.getElementById('sexoChartLoader'),
    
    // No data messages
    empleoChartNoData: document.getElementById('empleoChartNoData'),
    titulacionChartNoData: document.getElementById('titulacionChartNoData'),
    sexoChartNoData: document.getElementById('sexoChartNoData'),
    
    // Buttons
    refreshStatsBtn: document.getElementById('refreshStatsBtn'),
    exportStatsBtn: document.getElementById('exportStatsBtn')
  };
  
  /**
   * Inicializa el módulo de estadísticas
   */
  function init(careerData) {
    console.log('[Graduate Stats] Initializing with career data:', careerData);
    
    // Guardar referencia a Firestore
    if (window.firebase) {
      db = window.firebase.firestore();
    } else {
      console.error('[Graduate Stats] Firebase no está disponible');
      return;
    }
    
    // Guardar datos de la carrera
    currentCareerData = careerData;
    
    // Configurar eventos de botones
    if (domElements.refreshStatsBtn) {
      domElements.refreshStatsBtn.addEventListener('click', loadAllStats);
    }
    
    if (domElements.exportStatsBtn) {
      domElements.exportStatsBtn.addEventListener('click', exportStats);
    }
    
    // Cargar estadísticas
    loadAllStats();
  }
  
  /**
   * Carga todas las estadísticas
   */
  async function loadAllStats() {
    console.log('[Graduate Stats] Loading all statistics');
    
    // Mostrar loaders
    toggleLoaders(true);
    
    try {
      // Obtener datos de encuestas
      const encuestas = await getEncuestasData();
      
      if (!encuestas || encuestas.length === 0) {
        console.log('[Graduate Stats] No hay datos de encuestas disponibles');
        toggleNoDataMessages(true);
        return;
      }
      
      // Filtrar encuestas por carrera
      const encuestasFiltradas = filtrarEncuestasPorCarrera(encuestas);
      
      if (encuestasFiltradas.length === 0) {
        console.log('[Graduate Stats] No hay encuestas para esta carrera');
        toggleNoDataMessages(true);
        return;
      } else {
        toggleNoDataMessages(false);
      }
      
      console.log(`[Graduate Stats] Se encontraron ${encuestasFiltradas.length} encuestas para esta carrera`);
      
      // Crear gráficas
      createEmpleoChart(encuestasFiltradas);
      createTitulacionChart(encuestasFiltradas);
      createSexoChart(encuestasFiltradas);
      
    } catch (error) {
      console.error('[Graduate Stats] Error al cargar estadísticas:', error);
      alert('Error al cargar las estadísticas. Por favor, intenta nuevamente.');
    } finally {
      // Ocultar loaders
      toggleLoaders(false);
    }
  }
  
  /**
   * Obtiene los datos de todas las encuestas
   */
  async function getEncuestasData() {
    const encuestas = [];
    
    try {
      // Obtener todos los usuarios
      const usuariosSnapshot = await db.collection('usuarios').get();
      
      // Para cada usuario, obtener su encuesta más reciente
      for (const userDoc of usuariosSnapshot.docs) {
        try {
          const historialSnapshot = await db.collection('usuarios')
            .doc(userDoc.id)
            .collection('historialEncuestas')
            .orderBy('fechaCompletado', 'desc')
            .limit(1)
            .get();
          
          if (!historialSnapshot.empty) {
            const encuesta = historialSnapshot.docs[0].data();
            
            // Verificar que tenga datos personales
            if (encuesta && encuesta.datosPersonales) {
              encuestas.push({
                userId: userDoc.id,
                datosPersonales: encuesta.datosPersonales,
                fechaCompletado: encuesta.fechaCompletado,
                encuestaId: historialSnapshot.docs[0].id
              });
            }
          }
        } catch (error) {
          console.error(`[Graduate Stats] Error al procesar encuesta del usuario ${userDoc.id}:`, error);
        }
      }
      
      return encuestas;
      
    } catch (error) {
      console.error('[Graduate Stats] Error al obtener datos de encuestas:', error);
      throw error;
    }
  }
  
  /**
   * Filtra las encuestas por la carrera asignada
   */
  function filtrarEncuestasPorCarrera(encuestas) {
    if (!currentCareerData || !currentCareerData.nombre) {
      console.warn('[Graduate Stats] No hay datos de carrera para filtrar');
      return [];
    }
    
    const nombreCarrera = currentCareerData.nombre.toLowerCase().trim();
    
    return encuestas.filter(encuesta => {
      if (!encuesta.datosPersonales || !encuesta.datosPersonales.carrera) {
        return false;
      }
      
      const carreraEncuesta = encuesta.datosPersonales.carrera.toLowerCase().trim();
      
      return nombreCarrera === carreraEncuesta || 
             carreraEncuesta.includes(nombreCarrera) || 
             nombreCarrera.includes(carreraEncuesta);
    });
  }
  
  /**
   * Crea la gráfica de situación laboral
   */
  function createEmpleoChart(encuestas) {
    // Procesar datos
    let trabajando = 0;
    let noTrabajando = 0;
    
    encuestas.forEach(encuesta => {
      if (encuesta.datosPersonales.trabaja === true) {
        trabajando++;
      } else {
        noTrabajando++;
      }
    });
    
    // Configurar datos para la gráfica
    const data = {
      labels: ['Trabajando', 'No Trabajando'],
      datasets: [{
        label: 'Situación Laboral',
        data: [trabajando, noTrabajando],
        backgroundColor: [
          'rgba(52, 152, 219, 0.7)',
          'rgba(231, 76, 60, 0.7)'
        ],
        borderColor: [
          'rgba(52, 152, 219, 1)',
          'rgba(231, 76, 60, 1)'
        ],
        borderWidth: 1
      }]
    };
    
    // Configuración de la gráfica
    const config = {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
    
    // Crear o actualizar la gráfica
    const ctx = document.getElementById('empleoChart').getContext('2d');
    
    if (empleoChart) {
      empleoChart.destroy();
    }
    
    empleoChart = new Chart(ctx, config);
    
    // Mostrar mensaje si no hay datos
    if (trabajando === 0 && noTrabajando === 0) {
      if (domElements.empleoChartNoData) {
        domElements.empleoChartNoData.style.display = 'flex';
      }
    } else {
      if (domElements.empleoChartNoData) {
        domElements.empleoChartNoData.style.display = 'none';
      }
    }
  }
  
  /**
   * Crea la gráfica de estado de titulación
   */
  function createTitulacionChart(encuestas) {
    // Procesar datos
    let titulados = 0;
    let noTitulados = 0;
    
    encuestas.forEach(encuesta => {
      if (encuesta.datosPersonales.titulado === true) {
        titulados++;
      } else {
        noTitulados++;
      }
    });
    
    // Configurar datos para la gráfica
    const data = {
      labels: ['Titulados', 'No Titulados'],
      datasets: [{
        label: 'Estado de Titulación',
        data: [titulados, noTitulados],
        backgroundColor: [
          'rgba(46, 204, 113, 0.7)',
          'rgba(241, 196, 15, 0.7)'
        ],
        borderColor: [
          'rgba(46, 204, 113, 1)',
          'rgba(241, 196, 15, 1)'
        ],
        borderWidth: 1
      }]
    };
    
    // Configuración de la gráfica
    const config = {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
    
    // Crear o actualizar la gráfica
    const ctx = document.getElementById('titulacionChart').getContext('2d');
    
    if (titulacionChart) {
      titulacionChart.destroy();
    }
    
    titulacionChart = new Chart(ctx, config);
    
    // Mostrar mensaje si no hay datos
    if (titulados === 0 && noTitulados === 0) {
      if (domElements.titulacionChartNoData) {
        domElements.titulacionChartNoData.style.display = 'flex';
      }
    } else {
      if (domElements.titulacionChartNoData) {
        domElements.titulacionChartNoData.style.display = 'none';
      }
    }
  }
  
  /**
   * Crea la gráfica de distribución por sexo
   */
  function createSexoChart(encuestas) {
    // Procesar datos
    const distribucionSexo = {};
    
    encuestas.forEach(encuesta => {
      const sexo = encuesta.datosPersonales.sexo || 'No especificado';
      if (!distribucionSexo[sexo]) {
        distribucionSexo[sexo] = 0;
      }
      distribucionSexo[sexo]++;
    });
    
    // Convertir objeto a arrays para Chart.js
    const labels = Object.keys(distribucionSexo);
    const data = Object.values(distribucionSexo);
    
    // Generar colores
    const backgroundColors = [
      'rgba(142, 68, 173, 0.7)',
      'rgba(41, 128, 185, 0.7)',
      'rgba(243, 156, 18, 0.7)',
      'rgba(39, 174, 96, 0.7)',
      'rgba(192, 57, 43, 0.7)'
    ];
    
    const borderColors = [
      'rgba(142, 68, 173, 1)',
      'rgba(41, 128, 185, 1)',
      'rgba(243, 156, 18, 1)',
      'rgba(39, 174, 96, 1)',
      'rgba(192, 57, 43, 1)'
    ];
    
    // Configurar datos para la gráfica
    const chartData = {
      labels: labels,
      datasets: [{
        label: 'Distribución por Sexo',
        data: data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderColor: borderColors.slice(0, labels.length),
        borderWidth: 1
      }]
    };
    
    // Configuración de la gráfica
    const config = {
      type: 'pie',
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
    
    // Crear o actualizar la gráfica
    const ctx = document.getElementById('sexoChart').getContext('2d');
    
    if (sexoChart) {
      sexoChart.destroy();
    }
    
    sexoChart = new Chart(ctx, config);
    
    // Mostrar mensaje si no hay datos
    if (data.length === 0 || data.every(val => val === 0)) {
      if (domElements.sexoChartNoData) {
        domElements.sexoChartNoData.style.display = 'flex';
      }
    } else {
      if (domElements.sexoChartNoData) {
        domElements.sexoChartNoData.style.display = 'none';
      }
    }
  }
  
  /**
   * Muestra u oculta los loaders de las gráficas
   */
  function toggleLoaders(show) {
    const loaders = [
      domElements.empleoChartLoader,
      domElements.titulacionChartLoader,
      domElements.sexoChartLoader
    ];
    
    loaders.forEach(loader => {
      if (loader) {
        loader.style.display = show ? 'flex' : 'none';
      }
    });
  }
  
  /**
   * Muestra u oculta los mensajes de "no hay datos"
   */
  function toggleNoDataMessages(show) {
    const messages = [
      domElements.empleoChartNoData,
      domElements.titulacionChartNoData,
      domElements.sexoChartNoData
    ];
    
    messages.forEach(message => {
      if (message) {
        message.style.display = show ? 'flex' : 'none';
      }
    });
  }
  
  /**
   * Exporta las estadísticas actuales como PDF
   */
  async function exportStats() {
    console.log('[Graduate Stats] Exportando estadísticas');
    
    try {
      // Verificar si hay gráficas para exportar
      if (!empleoChart && !titulacionChart && !sexoChart) {
        alert('No hay estadísticas para exportar. Por favor, carga las estadísticas primero.');
        return;
      }
      
      // Mostrar mensaje de proceso
      mostrarPreloader('Generando PDF...');
      
      // Cargar jsPDF y html2canvas si no están ya cargados
      await cargarLibreriasExportacion();
      
      // Obtener los canvas de las gráficas
      const canvasEmpleoChart = document.getElementById('empleoChart');
      const canvasTitulacionChart = document.getElementById('titulacionChart');
      const canvasSexoChart = document.getElementById('sexoChart');
      
      // Crear un nuevo documento PDF (orientación horizontal)
      const pdf = new jspdf.jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Obtener el nombre de la carrera
      const nombreCarrera = currentCareerData?.nombre || 'Sin nombre';
      
      // Añadir título y fecha al PDF
      pdf.setFontSize(18);
      pdf.setTextColor(33, 33, 33);
      pdf.text(`Estadísticas de Egresados - ${nombreCarrera}`, 14, 22);
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      const fechaActual = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      pdf.text(`Generado el ${fechaActual}`, 14, 30);
      
      // Dibujar línea separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(14, 35, 280, 35);
      
      try {
        // Convertir canvas a imágenes para PDF
        if (canvasEmpleoChart) {
          const empleoImg = await html2canvas(canvasEmpleoChart);
          const empleoImgData = empleoImg.toDataURL('image/png');
          pdf.text('Situación Laboral de Egresados', 14, 45);
          pdf.addImage(empleoImgData, 'PNG', 14, 50, 85, 70);
          
          // Añadir datos estadísticos
          const empleoData = empleoChart.data.datasets[0].data;
          const empleoLabels = empleoChart.data.labels;
          const empleoTotal = empleoData.reduce((a, b) => a + b, 0);
          
          pdf.setFontSize(10);
          pdf.text('Datos Estadísticos:', 14, 125);
          pdf.text(`Total de egresados analizados: ${empleoTotal}`, 14, 132);
          
          empleoLabels.forEach((label, i) => {
            const valor = empleoData[i] || 0;
            const porcentaje = empleoTotal > 0 ? Math.round((valor / empleoTotal) * 100) : 0;
            pdf.text(`${label}: ${valor} (${porcentaje}%)`, 14, 139 + (i * 7));
          });
        }
        
        if (canvasTitulacionChart) {
          const titulacionImg = await html2canvas(canvasTitulacionChart);
          const titulacionImgData = titulacionImg.toDataURL('image/png');
          pdf.text('Estado de Titulación', 110, 45);
          pdf.addImage(titulacionImgData, 'PNG', 110, 50, 85, 70);
          
          // Añadir datos estadísticos
          const titulacionData = titulacionChart.data.datasets[0].data;
          const titulacionLabels = titulacionChart.data.labels;
          const titulacionTotal = titulacionData.reduce((a, b) => a + b, 0);
          
          pdf.setFontSize(10);
          pdf.text('Datos Estadísticos:', 110, 125);
          pdf.text(`Total de egresados analizados: ${titulacionTotal}`, 110, 132);
          
          titulacionLabels.forEach((label, i) => {
            const valor = titulacionData[i] || 0;
            const porcentaje = titulacionTotal > 0 ? Math.round((valor / titulacionTotal) * 100) : 0;
            pdf.text(`${label}: ${valor} (${porcentaje}%)`, 110, 139 + (i * 7));
          });
        }
        
        if (canvasSexoChart) {
          const sexoImg = await html2canvas(canvasSexoChart);
          const sexoImgData = sexoImg.toDataURL('image/png');
          pdf.text('Distribución por Sexo', 205, 45);
          pdf.addImage(sexoImgData, 'PNG', 205, 50, 85, 70);
          
          // Añadir datos estadísticos
          const sexoData = sexoChart.data.datasets[0].data;
          const sexoLabels = sexoChart.data.labels;
          const sexoTotal = sexoData.reduce((a, b) => a + b, 0);
          
          pdf.setFontSize(10);
          pdf.text('Datos Estadísticos:', 205, 125);
          pdf.text(`Total de egresados analizados: ${sexoTotal}`, 205, 132);
          
          sexoLabels.forEach((label, i) => {
            const valor = sexoData[i] || 0;
            const porcentaje = sexoTotal > 0 ? Math.round((valor / sexoTotal) * 100) : 0;
            pdf.text(`${label}: ${valor} (${porcentaje}%)`, 205, 139 + (i * 7));
          });
        }
        
        // Añadir pie de página
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Sistema de Seguimiento de Egresados | Panel de Jefe de Departamento', 14, 190);
        
        // Guardar el PDF
        const filename = `Estadisticas_Egresados_${nombreCarrera.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(filename);
        
        console.log('[Graduate Stats] PDF generado exitosamente');
        
      } catch (error) {
        console.error('[Graduate Stats] Error al generar imágenes de las gráficas:', error);
        throw new Error('No se pudieron generar las imágenes de las gráficas.');
      }
      
    } catch (error) {
      console.error('[Graduate Stats] Error al exportar estadísticas:', error);
      alert(`Error al exportar estadísticas: ${error.message}`);
    } finally {
      ocultarPreloader();
    }
  }
  
  /**
   * Muestra un preloader durante la exportación
   */
  function mostrarPreloader(mensaje = 'Cargando...') {
    // Crear preloader si no existe
    let preloader = document.getElementById('stats-export-preloader');
    
    if (!preloader) {
      preloader = document.createElement('div');
      preloader.id = 'stats-export-preloader';
      preloader.style.position = 'fixed';
      preloader.style.top = '0';
      preloader.style.left = '0';
      preloader.style.width = '100%';
      preloader.style.height = '100%';
      preloader.style.backgroundColor = 'rgba(255,255,255,0.8)';
      preloader.style.display = 'flex';
      preloader.style.flexDirection = 'column';
      preloader.style.justifyContent = 'center';
      preloader.style.alignItems = 'center';
      preloader.style.zIndex = '9999';
      
      const spinner = document.createElement('div');
      spinner.className = 'spinner';
      spinner.style.width = '50px';
      spinner.style.height = '50px';
      spinner.style.border = '5px solid #f3f3f3';
      spinner.style.borderTop = '5px solid #3498db';
      spinner.style.borderRadius = '50%';
      spinner.style.animation = 'spin 1s linear infinite';
      
      const mensajeElement = document.createElement('p');
      mensajeElement.id = 'stats-export-message';
      mensajeElement.style.marginTop = '15px';
      mensajeElement.style.fontSize = '16px';
      mensajeElement.style.color = '#333';
      
      preloader.appendChild(spinner);
      preloader.appendChild(mensajeElement);
      document.body.appendChild(preloader);
    }
    
    // Actualizar mensaje
    const mensajeElement = document.getElementById('stats-export-message');
    if (mensajeElement) {
      mensajeElement.textContent = mensaje;
    }
    
    preloader.style.display = 'flex';
  }
  
  /**
   * Oculta el preloader
   */
  function ocultarPreloader() {
    const preloader = document.getElementById('stats-export-preloader');
    if (preloader) {
      preloader.style.display = 'none';
    }
  }
  
  /**
   * Carga las librerías necesarias para la exportación
   */
  async function cargarLibreriasExportacion() {
    return new Promise((resolve, reject) => {
      try {
        // Verificar si ya están cargadas las librerías
        if (window.jspdf && window.html2canvas) {
          console.log('[Graduate Stats] Librerías de exportación ya cargadas');
          resolve();
          return;
        }
        
        // Contador para saber cuándo ambas librerías están cargadas
        let libreriasListas = 0;
        const checkLibrerias = () => {
          libreriasListas++;
          if (libreriasListas === 2) { // Ambas librerías cargadas
            resolve();
          }
        };
        
        // Cargar jsPDF
        if (!window.jspdf) {
          const jsPdfScript = document.createElement('script');
          jsPdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          jsPdfScript.onload = checkLibrerias;
          jsPdfScript.onerror = (e) => reject(new Error('No se pudo cargar jsPDF'));
          document.head.appendChild(jsPdfScript);
        } else {
          checkLibrerias();
        }
        
        // Cargar html2canvas
        if (!window.html2canvas) {
          const html2canvasScript = document.createElement('script');
          html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          html2canvasScript.onload = checkLibrerias;
          html2canvasScript.onerror = (e) => reject(new Error('No se pudo cargar html2canvas'));
          document.head.appendChild(html2canvasScript);
        } else {
          checkLibrerias();
        }
        
      } catch (error) {
        console.error('[Graduate Stats] Error al cargar librerías de exportación:', error);
        reject(error);
      }
    });
  }
  
  // API pública
  return {
    init: init,
    loadAllStats: loadAllStats
  };
})();

// Export para uso global
window.GraduateStats = GraduateStats;
