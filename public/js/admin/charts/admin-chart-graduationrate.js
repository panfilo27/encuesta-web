/**
 * admin-chart-graduationrate.js
 * Módulo para la gráfica de tasa de titulación por carrera
 */

// Módulo para la gráfica de tasa de titulación
const AdminChartGraduationRate = (function() {
  // Variables privadas
  let chart = null;
  let db = null;
  let careersData = null;
  
  // Elementos del DOM
  const chartCanvas = document.getElementById('chartGraduationRate');
  const chartLoader = document.getElementById('chartGraduationRateLoader');
  const chartNoData = document.getElementById('chartGraduationRateNoData');
  
  /**
   * Inicializa el módulo
   */
  function init(config) {
    console.log('[GraduationRate] Initializing chart module');
    
    if (!chartCanvas) {
      console.error('[GraduationRate] Canvas element not found');
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
          label: 'Porcentaje de Titulados',
          data: [],
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
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
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y + '%';
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Porcentaje de Titulados (%)'
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
    console.log('[GraduationRate] Updating chart with filter:', careerFilter);
    
    try {
      // Mostrar loader mientras se procesan los datos
      toggleLoader(true);
      
      // Procesar datos para la gráfica
      const chartData = await processChartData(encuestas, careerFilter);
      
      // Si no hay datos, mostrar mensaje
      if (chartData.labels.length === 0) {
        console.log('[GraduationRate] No data available for chart');
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
      console.error('[GraduationRate] Error updating chart:', error);
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
    
    // Datos para la gráfica
    const graduationData = {};
    
    // Inicializar estructura de datos para contar titulados y total por carrera
    careersData.forEach(career => {
      graduationData[career.id] = {
        careerName: career.nombre,
        titulados: 0,
        total: 0,
        rate: 0
      };
    });
    
    // Contar egresados titulados por carrera
    encuestas.forEach(encuesta => {
      if (encuesta.datosPersonales && encuesta.datosPersonales.carrera) {
        // Buscar a qué carrera pertenece este egresado
        for (const career of careersData) {
          const carreraEncuesta = encuesta.datosPersonales.carrera.toLowerCase().trim();
          const carreraNombre = career.nombre.toLowerCase().trim();
          
          if (carreraEncuesta === carreraNombre || 
              carreraEncuesta.includes(carreraNombre) || 
              carreraNombre.includes(carreraEncuesta)) {
            
            graduationData[career.id].total++;
            
            // Verificar si está titulado
            if (encuesta.datosPersonales.titulado === true) {
              graduationData[career.id].titulados++;
            }
            
            break;
          }
        }
      }
    });
    
    // Calcular tasa de titulación
    Object.keys(graduationData).forEach(careerKey => {
      const career = graduationData[careerKey];
      if (career.total > 0) {
        career.rate = Math.round((career.titulados / career.total) * 100);
      } else {
        career.rate = 0;
      }
    });
    
    // Preparar datos para la gráfica
    let labels = [];
    let data = [];
    
    // Si hay un filtro específico de carrera, solo mostrar esa carrera
    if (careerFilter !== 'all') {
      const career = careersData.find(c => c.id === careerFilter);
      if (!career || !graduationData[career.id]) {
        return { labels: [], data: [] };
      }
      
      return {
        labels: [career.nombre],
        data: [graduationData[career.id].rate]
      };
    }
    
    // Ordenar carreras por tasa de titulación (descendente)
    const sortedData = Object.values(graduationData)
      .filter(career => career.total >= 5) // Solo incluir carreras con al menos 5 egresados para evitar porcentajes engañosos
      .sort((a, b) => b.rate - a.rate);
    
    // Tomar las 10 primeras carreras
    const topCareers = sortedData.slice(0, 10);
    
    // Extraer datos para la gráfica
    labels = topCareers.map(career => career.careerName);
    data = topCareers.map(career => career.rate);
    
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
window.AdminChartGraduationRate = AdminChartGraduationRate;
