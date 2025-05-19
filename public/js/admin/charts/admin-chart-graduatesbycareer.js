/**
 * admin-chart-graduatesbycareer.js
 * Módulo para la gráfica de egresados por carrera
 */

// Módulo para la gráfica de egresados por carrera
const AdminChartGraduatesByCareer = (function() {
  // Variables privadas
  let chart = null;
  let db = null;
  let careersData = null;
  
  // Elementos del DOM
  const chartCanvas = document.getElementById('chartGraduatesByCareer');
  const chartLoader = document.getElementById('chartGraduatesByCareerLoader');
  const chartNoData = document.getElementById('chartGraduatesByCareerNoData');
  
  /**
   * Inicializa el módulo
   */
  function init(config) {
    console.log('[GraduatesByCareer] Initializing chart module');
    
    if (!chartCanvas) {
      console.error('[GraduatesByCareer] Canvas element not found');
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
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Egresados',
          data: [],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: false,
            text: 'Egresados por Carrera'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y + ' egresados';
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Número de Egresados'
            },
            ticks: {
              precision: 0
            }
          },
          x: {
            title: {
              display: true,
              text: 'Carreras'
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
    console.log('[GraduatesByCareer] Updating chart with filter:', careerFilter);
    
    try {
      // Mostrar loader mientras se procesan los datos
      toggleLoader(true);
      
      // Procesar datos para la gráfica
      const chartData = await processChartData(encuestas, careerFilter);
      
      // Si no hay datos, mostrar mensaje
      if (chartData.labels.length === 0) {
        console.log('[GraduatesByCareer] No data available for chart');
        toggleNoData(true);
        return;
      }
      
      // Actualizar la gráfica con los nuevos datos
      if (chart) {
        chart.data.labels = chartData.labels;
        chart.data.datasets[0].data = chartData.data;
        chart.update();
        
        // Ocultar mensajes de error y loader
        toggleNoData(false);
        toggleLoader(false);
      }
      
    } catch (error) {
      console.error('[GraduatesByCareer] Error updating chart:', error);
      toggleNoData(true);
    }
  }
  
  /**
   * Procesa los datos para la gráfica
   */
  async function processChartData(encuestas, careerFilter) {
    // Si no hay carreras o encuestas, devolver datos vacíos
    if (!careersData || careersData.length === 0 || !encuestas || encuestas.length === 0) {
      return {
        labels: [],
        data: []
      };
    }
    
    // Contar egresados por carrera
    const graduatesByCareer = {};
    
    // Si hay un filtro específico de carrera, solo mostrar esa carrera
    if (careerFilter !== 'all') {
      const career = careersData.find(c => c.id === careerFilter);
      if (!career) {
        return { labels: [], data: [] };
      }
      
      // Inicializar contador para esta carrera
      graduatesByCareer[career.id] = 0;
      
      // Contar egresados que pertenecen a esta carrera
      encuestas.forEach(encuesta => {
        if (encuesta.datosPersonales && encuesta.datosPersonales.carrera) {
          const carreraEncuesta = encuesta.datosPersonales.carrera.toLowerCase().trim();
          const carreraNombre = career.nombre.toLowerCase().trim();
          
          if (carreraEncuesta === carreraNombre || 
              carreraEncuesta.includes(carreraNombre) || 
              carreraNombre.includes(carreraEncuesta)) {
            graduatesByCareer[career.id]++;
          }
        }
      });
      
      return {
        labels: [career.nombre],
        data: [graduatesByCareer[career.id]]
      };
    }
    
    // Si no hay filtro, mostrar todas las carreras
    careersData.forEach(career => {
      graduatesByCareer[career.id] = 0;
    });
    
    // Contar egresados por carrera
    encuestas.forEach(encuesta => {
      if (encuesta.datosPersonales && encuesta.datosPersonales.carrera) {
        // Buscar a qué carrera pertenece este egresado
        for (const career of careersData) {
          const carreraEncuesta = encuesta.datosPersonales.carrera.toLowerCase().trim();
          const carreraNombre = career.nombre.toLowerCase().trim();
          
          if (carreraEncuesta === carreraNombre || 
              carreraEncuesta.includes(carreraNombre) || 
              carreraNombre.includes(carreraEncuesta)) {
            graduatesByCareer[career.id]++;
            break;
          }
        }
      }
    });
    
    // Preparar datos para la gráfica
    const labels = [];
    const data = [];
    
    // Ordenar carreras por número de egresados (descendente)
    const sortedCareers = [...careersData].sort((a, b) => {
      return graduatesByCareer[b.id] - graduatesByCareer[a.id];
    });
    
    // Agregar solo las 10 carreras con más egresados
    const topCareers = sortedCareers.slice(0, 10);
    
    topCareers.forEach(career => {
      labels.push(career.nombre);
      data.push(graduatesByCareer[career.id]);
    });
    
    return {
      labels,
      data
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
window.AdminChartGraduatesByCareer = AdminChartGraduatesByCareer;
