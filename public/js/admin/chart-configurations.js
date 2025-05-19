/**
 * chart-configurations.js
 * Configuraciones globales y templates para Chart.js
 */

// Registrar el plugin de datalabels con Chart.js
Chart.register(ChartDataLabels);

// Objeto global para configuraciones de gráficas
const ChartConfigs = {
  /**
   * Paleta de colores para gráficas
   */
  colors: {
    // Colores primarios para gráficas
    primary: [
      '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', 
      '#F44336', '#00BCD4', '#FFC107', '#3F51B5',
      '#795548', '#009688', '#E91E63', '#673AB7'
    ],
    
    // Gradientes para fondos de gráficas
    gradients: {
      green: {
        start: 'rgba(76, 175, 80, 0.8)',
        end: 'rgba(76, 175, 80, 0.2)'
      },
      blue: {
        start: 'rgba(33, 150, 243, 0.8)',
        end: 'rgba(33, 150, 243, 0.2)'
      },
      orange: {
        start: 'rgba(255, 152, 0, 0.8)',
        end: 'rgba(255, 152, 0, 0.2)'
      }
    }
  },
  
  /**
   * Configuración global para todas las gráficas
   */
  global: {
    responsive: true,
    maintainAspectRatio: false,
    font: {
      family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        padding: 10,
        cornerRadius: 4
      },
      datalabels: {
        // Ocultar data labels por defecto
        display: false
      }
    }
  },
  
  /**
   * Configuración para gráficas de pastel
   */
  pie: {
    cutout: '0%',
    plugins: {
      legend: {
        position: 'right'
      },
      datalabels: {
        display: true,
        color: '#fff',
        font: {
          weight: 'bold',
          size: 12
        },
        formatter: (value, ctx) => {
          const dataset = ctx.chart.data.datasets[0];
          const total = dataset.data.reduce((sum, data) => sum + data, 0);
          const percentage = ((value / total) * 100).toFixed(1) + '%';
          return percentage;
        }
      }
    }
  },
  
  /**
   * Configuración para gráficas de dona
   */
  doughnut: {
    cutout: '50%',
    plugins: {
      legend: {
        position: 'right'
      },
      datalabels: {
        display: true,
        color: '#fff',
        font: {
          weight: 'bold',
          size: 12
        },
        formatter: (value, ctx) => {
          const dataset = ctx.chart.data.datasets[0];
          const total = dataset.data.reduce((sum, data) => sum + data, 0);
          const percentage = ((value / total) * 100).toFixed(1) + '%';
          return percentage;
        }
      }
    }
  },
  
  /**
   * Configuración para gráficas de barras
   */
  bar: {
    indexAxis: 'x',
    plugins: {
      legend: {
        display: false
      },
      datalabels: {
        display: true,
        anchor: 'end',
        align: 'top',
        offset: 0,
        color: '#333',
        font: {
          size: 12
        },
        formatter: (value) => value > 0 ? value : ''
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  },
  
  /**
   * Configuración para gráficas de barras horizontales
   */
  horizontalBar: {
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      datalabels: {
        display: true,
        anchor: 'end',
        align: 'right',
        offset: 0,
        color: '#333',
        font: {
          size: 12
        },
        formatter: (value) => value > 0 ? value : ''
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    }
  },
  
  /**
   * Configuración para gráficas de línea
   */
  line: {
    tension: 0.4,
    fill: true,
    plugins: {
      datalabels: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  },
  
  /**
   * Crea una configuración de gráfica combinando la configuración global con un tipo específico
   * @param {string} type - Tipo de gráfica (pie, doughnut, bar, etc.)
   * @param {Object} customOptions - Opciones personalizadas para sobreescribir defaults
   * @returns {Object} - Configuración combinada
   */
  createConfig: function(type, customOptions = {}) {
    // Configuración base (global)
    let config = JSON.parse(JSON.stringify(this.global));
    
    // Aplicar configuración específica del tipo si existe
    if (this[type]) {
      config = this.mergeConfigs(config, this[type]);
    }
    
    // Aplicar opciones personalizadas
    if (Object.keys(customOptions).length > 0) {
      config = this.mergeConfigs(config, customOptions);
    }
    
    return config;
  },
  
  /**
   * Combina dos objetos de configuración de manera recursiva
   * @param {Object} target - Objeto base
   * @param {Object} source - Objeto a combinar (prevalece sobre el base)
   * @returns {Object} - Objeto combinado
   */
  mergeConfigs: function(target, source) {
    const merged = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] === null) {
          merged[key] = null;
        } else if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
          merged[key] = this.mergeConfigs(merged[key] || {}, source[key]);
        } else {
          merged[key] = source[key];
        }
      }
    }
    
    return merged;
  },
  
  /**
   * Crea un gradiente para el fondo de una gráfica
   * @param {CanvasRenderingContext2D} ctx - Contexto del canvas de la gráfica
   * @param {string} colorName - Nombre del color en el objeto de gradientes
   * @returns {CanvasGradient} - Gradiente para usar como backgroundColor
   */
  createGradient: function(ctx, colorName = 'green') {
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    
    const colors = this.colors.gradients[colorName] || this.colors.gradients.green;
    
    gradient.addColorStop(0, colors.start);
    gradient.addColorStop(1, colors.end);
    
    return gradient;
  }
};

// Aplicar configuración global a Chart.js
Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
Chart.defaults.color = '#666';
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.75)';
Chart.defaults.plugins.tooltip.titleColor = '#fff';
Chart.defaults.plugins.tooltip.bodyColor = '#fff';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 4;
