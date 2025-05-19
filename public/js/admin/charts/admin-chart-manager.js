/**
 * admin-chart-manager.js
 * Gestor centralizado para las gráficas del panel de administración
 */

// Namespace principal para gráficas de administrador
const AdminCharts = (function() {
  // Variables privadas
  let db;
  let careerFilter = 'all';
  let chartModules = {};
  let allCareersData = null;
  
  // DOM Elements - Definidos como funciones para asegurar que se accede al DOM actualizado
  const domElements = {
    get filterCareerSelect() { return document.getElementById('filter-career'); },
    get refreshDataBtn() { return document.getElementById('refresh-data'); },
    get refreshChartsBtn() { return document.getElementById('refresh-charts'); },
    get exportChartsBtn() { return document.getElementById('export-charts'); },
    get applyFiltersBtn() { return document.getElementById('apply-filters'); }
  };

  /**
   * Inicializa el módulo de gráficas
   */
  function init() {
    console.log('[AdminCharts] Initializing charts module');
    
    // Verificar si los elementos necesarios existen en el DOM
    const chartsContainer = document.querySelector('.charts-container');
    if (!chartsContainer) {
      console.error('[AdminCharts] Charts container not found in DOM. Initialization aborted.');
      console.log('[AdminCharts] DOM Structure:', document.body.innerHTML.substring(0, 500) + '...');
      return;
    }
    
    // Verificar si los canvas para las gráficas existen
    const canvasElements = [
      document.getElementById('chartGraduatesByCareer'),
      document.getElementById('chartGraduationRate'),
      document.getElementById('chartEmploymentStatus')
    ];
    
    if (canvasElements.some(canvas => !canvas)) {
      console.error('[AdminCharts] Some chart canvas elements are missing in DOM:', {
        chartGraduatesByCareer: !!canvasElements[0],
        chartGraduationRate: !!canvasElements[1],
        chartEmploymentStatus: !!canvasElements[2]
      });
      // Continuar a pesar de que falten algunos canvas
    }
    
    // Inicializar Firebase
    if (window.firebase) {
      db = firebase.firestore();
    } else {
      console.error('[AdminCharts] Firebase not available');
      return;
    }
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar datos de carreras
    loadCareerOptions().then(() => {
      // Cargar todos los módulos de gráficas
      loadAllChartModules();
    });
  }
  
  /**
   * Configura los escuchadores de eventos
   */
  function setupEventListeners() {
    // Botón para refrescar datos
    if (domElements.refreshDataBtn) {
      domElements.refreshDataBtn.addEventListener('click', refreshAllData);
    }
    
    // Botón para refrescar gráficas
    if (domElements.refreshChartsBtn) {
      domElements.refreshChartsBtn.addEventListener('click', refreshCharts);
    }
    
    // Botón para aplicar filtros
    if (domElements.applyFiltersBtn) {
      domElements.applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    // Botón para exportar gráficas
    if (domElements.exportChartsBtn) {
      domElements.exportChartsBtn.addEventListener('click', exportCharts);
    }
    
    // Cambio en el filtro de carrera
    if (domElements.filterCareerSelect) {
      domElements.filterCareerSelect.addEventListener('change', function(e) {
        careerFilter = e.target.value;
      });
    }
  }
  
  /**
   * Carga todas las opciones de carrera en el selector
   */
  async function loadCareerOptions() {
    try {
      console.log('[AdminCharts] Loading career options');
      
      const select = domElements.filterCareerSelect;
      if (!select) return;
      
      // Limpiar opciones existentes excepto "Todas"
      const allOption = select.querySelector('option[value="all"]');
      select.innerHTML = '';
      select.appendChild(allOption);
      
      // Obtener carreras de Firestore
      const careersSnapshot = await db.collection('carreras').get();
      
      if (careersSnapshot.empty) {
        console.warn('[AdminCharts] No careers found in database');
        return;
      }
      
      // Array para almacenar todas las carreras
      allCareersData = [];
      
      // Agregar cada carrera como una opción
      careersSnapshot.forEach(doc => {
        const career = {
          id: doc.id,
          ...doc.data()
        };
        
        allCareersData.push(career);
        
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = career.nombre || 'Carrera sin nombre';
        select.appendChild(option);
      });
      
      console.log(`[AdminCharts] ${allCareersData.length} careers loaded`);
      
    } catch (error) {
      console.error('[AdminCharts] Error loading career options:', error);
    }
  }
  
  /**
   * Carga todos los módulos de gráficas
   */
  function loadAllChartModules() {
    try {
      console.log('[AdminCharts] Loading chart modules');
      
      // Verificar disponibilidad de Chart.js
      ensureChartJsLoaded().then(() => {
        // Cargar módulos individuales
        Promise.all([
          loadModule('GraduatesByCareer'),
          loadModule('GraduationRate'),
          loadModule('EmploymentStatus')
        ]).then(() => {
          // Una vez cargados todos los módulos, inicializar gráficas
          initializeCharts();
        }).catch(error => {
          console.error('[AdminCharts] Error loading chart modules:', error);
        });
      });
      
    } catch (error) {
      console.error('[AdminCharts] Error in loadAllChartModules:', error);
    }
  }
  
  /**
   * Asegura que Chart.js esté cargado antes de continuar
   */
  function ensureChartJsLoaded() {
    return new Promise((resolve, reject) => {
      if (window.Chart) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Chart.js'));
      document.head.appendChild(script);
    });
  }
  
  /**
   * Carga un módulo de gráfica individual
   */
  function loadModule(moduleName) {
    return new Promise((resolve, reject) => {
      // Verificar si el módulo ya está registrado
      if (window[`AdminChart${moduleName}`]) {
        chartModules[moduleName] = window[`AdminChart${moduleName}`];
        resolve();
        return;
      }
      
      // Cargar el script del módulo
      const script = document.createElement('script');
      script.src = `js/admin/charts/admin-chart-${moduleName.toLowerCase()}.js`;
      
      script.onload = () => {
        if (window[`AdminChart${moduleName}`]) {
          chartModules[moduleName] = window[`AdminChart${moduleName}`];
          resolve();
        } else {
          reject(new Error(`Module ${moduleName} did not register correctly`));
        }
      };
      
      script.onerror = () => reject(new Error(`Failed to load module ${moduleName}`));
      document.body.appendChild(script);
    });
  }
  
  /**
   * Inicializa todas las gráficas
   */
  function initializeCharts() {
    console.log('[AdminCharts] Initializing charts with modules:', Object.keys(chartModules));
    
    // Inicializar cada módulo con los datos necesarios
    Object.values(chartModules).forEach(module => {
      if (typeof module.init === 'function') {
        module.init({
          db: db,
          careerFilter: careerFilter,
          careersData: allCareersData
        });
      }
    });
    
    // Cargar datos iniciales para cada gráfica
    loadAllChartsData();
  }
  
  /**
   * Carga datos para todas las gráficas
   */
  async function loadAllChartsData() {
    console.log('[AdminCharts] Loading data for all charts');
    
    try {
      // Consultar los datos necesarios para todas las gráficas
      const encuestas = await getAllSurveyData();
      
      // Distribuir los datos a cada módulo
      Object.values(chartModules).forEach(module => {
        if (typeof module.updateChart === 'function') {
          module.updateChart(encuestas, careerFilter);
        }
      });
      
    } catch (error) {
      console.error('[AdminCharts] Error loading chart data:', error);
    }
  }
  
  /**
   * Obtiene todos los datos de encuestas
   */
  async function getAllSurveyData() {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('[AdminCharts] Fetching all survey data');
        
        const encuestas = [];
        
        // Obtener usuarios
        const usuariosSnapshot = await db.collection('usuarios').get();
        let processedCount = 0;
        const totalUsers = usuariosSnapshot.size;
        
        // Si no hay usuarios, resolver con array vacío
        if (totalUsers === 0) {
          console.log('[AdminCharts] No users found');
          resolve([]);
          return;
        }
        
        // Para cada usuario, obtener su encuesta más reciente
        for (const userDoc of usuariosSnapshot.docs) {
          try {
            const historialSnapshot = await db.collection('usuarios')
              .doc(userDoc.id)
              .collection('historialEncuestas')
              .orderBy('fechaCompletado', 'desc')
              .limit(1)
              .get();
              
            processedCount++;
            
            if (!historialSnapshot.empty) {
              const encuesta = historialSnapshot.docs[0].data();
              
              // Verificar que tenga datos personales
              if (encuesta && encuesta.datosPersonales) {
                encuestas.push({
                  userId: userDoc.id,
                  userData: userDoc.data(),
                  datosPersonales: encuesta.datosPersonales,
                  fechaCompletado: encuesta.fechaCompletado,
                  encuestaId: historialSnapshot.docs[0].id
                });
              }
            }
            
            // Si ya procesamos todos los usuarios, resolver
            if (processedCount >= totalUsers) {
              console.log(`[AdminCharts] Processed ${encuestas.length} surveys from ${totalUsers} users`);
              resolve(encuestas);
            }
            
          } catch (error) {
            console.error(`[AdminCharts] Error processing survey for user ${userDoc.id}:`, error);
            
            // Incrementar contador para no bloquear la promesa
            processedCount++;
            
            // Si ya procesamos todos los usuarios, resolver
            if (processedCount >= totalUsers) {
              console.log(`[AdminCharts] Processed ${encuestas.length} surveys from ${totalUsers} users`);
              resolve(encuestas);
            }
          }
        }
        
      } catch (error) {
        console.error('[AdminCharts] Error in getAllSurveyData:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Refresca todos los datos y actualiza las gráficas
   */
  function refreshAllData() {
    console.log('[AdminCharts] Refreshing all data');
    
    // Cargar opciones de carrera de nuevo
    loadCareerOptions().then(() => {
      // Cargar datos para todas las gráficas
      loadAllChartsData();
    });
  }
  
  /**
   * Refresca todas las gráficas con los datos actuales
   */
  function refreshCharts() {
    console.log('[AdminCharts] Refreshing charts');
    
    // Recargar solo los datos de las gráficas, no las opciones de carrera
    loadAllChartsData();
  }
  
  /**
   * Aplica los filtros actuales a todas las gráficas
   */
  function applyFilters() {
    console.log('[AdminCharts] Applying filters:', { career: careerFilter });
    
    // Actualizar gráficas con los filtros actuales
    loadAllChartsData();
  }
  
  /**
   * Exporta todas las gráficas a PDF
   */
  async function exportCharts() {
    console.log('[AdminCharts] Exporting charts');
    
    try {
      // Cargar librerías necesarias si no están disponibles
      await loadExportLibraries();
      
      // Mostrar indicador de carga
      showExportLoader(true, 'Generando PDF...');
      
      // Crear documento PDF
      const pdf = new jspdf.jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Título y fecha
      pdf.setFontSize(18);
      pdf.setTextColor(33, 33, 33);
      pdf.text(`Dashboard de Administración - Estadísticas`, 14, 22);
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      const fechaActual = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      pdf.text(`Generado el ${fechaActual}`, 14, 30);
      
      // Filtro aplicado
      let filterText = 'Filtro: Todas las carreras';
      if (careerFilter !== 'all' && allCareersData) {
        const carreraSeleccionada = allCareersData.find(c => c.id === careerFilter);
        if (carreraSeleccionada) {
          filterText = `Filtro: ${carreraSeleccionada.nombre}`;
        }
      }
      pdf.text(filterText, 14, 38);
      
      // Línea separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(14, 42, 280, 42);
      
      // Capturar las gráficas como imágenes
      const chartElements = [
        document.getElementById('chartGraduatesByCareer'),
        document.getElementById('chartGraduationRate'),
        document.getElementById('chartEmploymentStatus')
      ];
      
      const chartTitles = [
        'Egresados por Carrera',
        'Tasa de Titulación por Carrera',
        'Situación Laboral General'
      ];
      
      // Posiciones para las gráficas
      const positions = [
        { x: 14, y: 55 },
        { x: 14, y: 130 },
        { x: 150, y: 55 }
      ];
      
      // Añadir cada gráfica al PDF
      for (let i = 0; i < chartElements.length; i++) {
        if (!chartElements[i]) continue;
        
        try {
          const chartImg = await html2canvas(chartElements[i]);
          const chartImgData = chartImg.toDataURL('image/png');
          
          // Añadir título de la gráfica
          pdf.setFontSize(12);
          pdf.setTextColor(33, 33, 33);
          pdf.text(chartTitles[i], positions[i].x, positions[i].y - 5);
          
          // Añadir imagen de la gráfica
          pdf.addImage(chartImgData, 'PNG', positions[i].x, positions[i].y, 130, 70);
          
        } catch (error) {
          console.error(`[AdminCharts] Error capturing chart ${i}:`, error);
        }
      }
      
      // Añadir pie de página
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Sistema de Seguimiento de Egresados | Panel de Administración', 14, 190);
      
      // Guardar el PDF
      const filename = `Dashboard_Admin_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      console.log('[AdminCharts] PDF export completed');
      
    } catch (error) {
      console.error('[AdminCharts] Error exporting charts:', error);
      alert('Error al exportar gráficas. Consulta la consola para más detalles.');
    } finally {
      // Ocultar indicador de carga
      showExportLoader(false);
    }
  }
  
  /**
   * Carga las librerías necesarias para la exportación
   */
  function loadExportLibraries() {
    return new Promise((resolve, reject) => {
      try {
        // Verificar si ya están cargadas
        if (window.jspdf && window.html2canvas) {
          resolve();
          return;
        }
        
        let librariesLoaded = 0;
        const totalLibraries = 2;
        
        const checkComplete = () => {
          librariesLoaded++;
          if (librariesLoaded === totalLibraries) {
            resolve();
          }
        };
        
        // Cargar jsPDF si no está disponible
        if (!window.jspdf) {
          const jsPdfScript = document.createElement('script');
          jsPdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          jsPdfScript.onload = checkComplete;
          jsPdfScript.onerror = () => reject(new Error('Failed to load jsPDF'));
          document.head.appendChild(jsPdfScript);
        } else {
          checkComplete();
        }
        
        // Cargar html2canvas si no está disponible
        if (!window.html2canvas) {
          const html2canvasScript = document.createElement('script');
          html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          html2canvasScript.onload = checkComplete;
          html2canvasScript.onerror = () => reject(new Error('Failed to load html2canvas'));
          document.head.appendChild(html2canvasScript);
        } else {
          checkComplete();
        }
        
      } catch (error) {
        console.error('[AdminCharts] Error loading export libraries:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Muestra u oculta el indicador de carga durante la exportación
   */
  function showExportLoader(show, message = 'Generando PDF...') {
    let loader = document.getElementById('chart-export-loader');
    
    // Crear loader si no existe
    if (!loader && show) {
      loader = document.createElement('div');
      loader.id = 'chart-export-loader';
      loader.style.position = 'fixed';
      loader.style.top = '0';
      loader.style.left = '0';
      loader.style.width = '100%';
      loader.style.height = '100%';
      loader.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      loader.style.display = 'flex';
      loader.style.flexDirection = 'column';
      loader.style.alignItems = 'center';
      loader.style.justifyContent = 'center';
      loader.style.zIndex = '9999';
      
      const spinner = document.createElement('div');
      spinner.className = 'spinner';
      spinner.style.width = '50px';
      spinner.style.height = '50px';
      spinner.style.border = '5px solid #f3f3f3';
      spinner.style.borderTop = '5px solid #3498db';
      spinner.style.borderRadius = '50%';
      spinner.style.animation = 'spin 1s linear infinite';
      
      const messageEl = document.createElement('p');
      messageEl.id = 'chart-export-message';
      messageEl.style.marginTop = '15px';
      messageEl.style.fontSize = '16px';
      messageEl.style.color = '#333';
      messageEl.textContent = message;
      
      loader.appendChild(spinner);
      loader.appendChild(messageEl);
      document.body.appendChild(loader);
    } else if (loader) {
      if (show) {
        loader.style.display = 'flex';
        const messageEl = document.getElementById('chart-export-message');
        if (messageEl) {
          messageEl.textContent = message;
        }
      } else {
        loader.style.display = 'none';
      }
    }
  }

  // API pública
  return {
    init: init,
    refreshAllData: refreshAllData,
    refreshCharts: refreshCharts,
    exportCharts: exportCharts
  };
})();

// No inicializamos automáticamente, lo haremos cuando la vista esté cargada
// La función initCharts será llamada desde admin-core.js cuando la vista esté lista
window.initAdminCharts = function() {
  console.log('[AdminCharts] Initializing from external call');
  AdminCharts.init();
};
