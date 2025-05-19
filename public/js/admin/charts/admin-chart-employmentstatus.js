/**
 * admin-chart-employmentstatus.js
 * Módulo para la gráfica de situación laboral de los egresados
 */

// Módulo para la gráfica de situación laboral
const AdminChartEmploymentStatus = (function() {
  // Variables privadas
  let chart = null;
  let db = null;
  let careersData = null;
  
  // Elementos del DOM
  const chartCanvas = document.getElementById('chartEmploymentStatus');
  const chartLoader = document.getElementById('chartEmploymentStatusLoader');
  const chartNoData = document.getElementById('chartEmploymentStatusNoData');
  
  /**
   * Inicializa el módulo
   */
  function init(config) {
    console.log('[EmploymentStatus] Initializing chart module');
    
    if (!chartCanvas) {
      console.error('[EmploymentStatus] Canvas element not found');
      return;
    }
    
    // Guardar referencias
    db = config.db;
    careersData = config.careersData;
    
    // Inicializar gráfica vacía
    initializeChart();
  }
  
  /**
   * Inicializa la gráfica con una configuración básica
   */
  function initializeChart() {
    if (!chartCanvas) return;
    
    const ctx = chartCanvas.getContext('2d');
    
    // Destruir gráfica existente si hay una
    if (chart) {
      chart.destroy();
    }
    
    // Configuración inicial de la gráfica
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Trabajando', 'Sin trabajo', 'Sin información'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: [
            'rgba(46, 204, 113, 0.7)',
            'rgba(231, 76, 60, 0.7)',
            'rgba(189, 195, 199, 0.7)'
          ],
          borderColor: [
            'rgba(46, 204, 113, 1)',
            'rgba(231, 76, 60, 1)',
            'rgba(189, 195, 199, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
    });
    
    // Mostrar loader
    toggleLoader(true);
  }
  
  /**
   * Actualiza los datos de la gráfica
   */
  async function updateChart(encuestas, careerFilter) {
    console.log('[EmploymentStatus] Updating chart with filter:', careerFilter);
    
    try {
      // Mostrar loader mientras se procesan los datos
      toggleLoader(true);
      
      // Procesar datos para la gráfica
      const chartData = await processChartData(encuestas, careerFilter);
      
      // Si no hay datos, mostrar mensaje
      if (chartData.data.every(val => val === 0)) {
        console.log('[EmploymentStatus] No data available for chart');
        toggleNoData(true);
        return;
      }
      
      // Actualizar la gráfica con los nuevos datos
      if (chart) {
        chart.data.datasets[0].data = chartData.data;
        chart.data.labels = chartData.labels;
        chart.update();
        
        // Ocultar mensajes de error y loader
        toggleNoData(false);
        toggleLoader(false);
      }
      
    } catch (error) {
      console.error('[EmploymentStatus] Error updating chart:', error);
      toggleNoData(true);
    }
  }
  
  /**
   * Procesa los datos para la gráfica
   */
  async function processChartData(encuestas, careerFilter) {
    // Si no hay encuestas, devolver datos vacíos
    if (!encuestas || encuestas.length === 0) {
      return {
        labels: ['Trabajando', 'Sin trabajo', 'Sin información'],
        data: [0, 0, 0]
      };
    }
    
    // Filtrar encuestas por carrera si es necesario
    let filteredSurveys = encuestas;
    
    if (careerFilter !== 'all') {
      const careerData = careersData.find(c => c.id === careerFilter);
      if (careerData) {
        const carreraNombre = careerData.nombre.toLowerCase().trim();
        
        filteredSurveys = encuestas.filter(encuesta => {
          if (encuesta.datosPersonales && encuesta.datosPersonales.carrera) {
            const carreraEncuesta = encuesta.datosPersonales.carrera.toLowerCase().trim();
            return carreraEncuesta === carreraNombre || 
                   carreraEncuesta.includes(carreraNombre) || 
                   carreraNombre.includes(carreraEncuesta);
          }
          return false;
        });
      }
    }
    
    // Contar situación laboral
    let trabajando = 0;
    let sinTrabajo = 0;
    let sinInfo = 0;
    
    filteredSurveys.forEach(encuesta => {
      if (encuesta.datosPersonales) {
        if (encuesta.datosPersonales.trabaja === true) {
          trabajando++;
        } else if (encuesta.datosPersonales.trabaja === false) {
          sinTrabajo++;
        } else {
          sinInfo++;
        }
      } else {
        sinInfo++;
      }
    });
    
    // Preparar datos para la gráfica
    return {
      labels: ['Trabajando', 'Sin trabajo', 'Sin información'],
      data: [trabajando, sinTrabajo, sinInfo]
    };
  }
  
  /**
   * Muestra u oculta el loader
   */
  function toggleLoader(show) {
    if (chartLoader) {
      chartLoader.style.display = show ? 'flex' : 'none';
    }
  }
  
  /**
   * Muestra u oculta el mensaje de no hay datos
   */
  function toggleNoData(show) {
    if (chartNoData) {
      chartNoData.style.display = show ? 'flex' : 'none';
    }
  }
  
  // API pública
  return {
    init: init,
    updateChart: updateChart
  };
})();

// Registrar el módulo globalmente
window.AdminChartEmploymentStatus = AdminChartEmploymentStatus;
