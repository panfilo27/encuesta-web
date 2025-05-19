/**
 * admin-data-service.js
 * Servicio centralizado para obtener y procesar datos de Firestore para el panel administrativo
 */

// Acceso directo a Firestore con manejo de errores


let dbService;
try {
  
  if (!firebase) {
    console.error('[Admin Data Service] ERROR: El objeto firebase no existe');
    alert('Error crítico: Firebase no está inicializado correctamente');
  } else if (!firebase.firestore) {
    console.error('[Admin Data Service] ERROR: firebase.firestore no existe');
    alert('Error crítico: El módulo Firestore de Firebase no está disponible');
  } else {
    dbService = firebase.firestore();
    
  }
} catch (error) {
  console.error('[Admin Data Service] Error al inicializar Firestore:', error);
  console.error('[Admin Data Service] Stack trace:', error.stack);
  alert('Error al inicializar Firestore: ' + error.message);
}

// Clase de servicio de datos para el panel administrativo
class AdminDataService {
  /**
   * Constructor del servicio
   */
  constructor() {
    // Cache para almacenar datos que se usan frecuentemente
    this.cache = {
      // Cache para datos de usuarios
      users: null,
      // Cache para encuestas completadas
      surveys: null,
      // Cache para datos agregados por carrera
      careerStats: null,
      // Timestamp de la última actualización del cache
      lastUpdate: null
    };
    
    // Filtros activos
    this.activeFilters = {
      carrera: 'all'
    };
    
    // Tiempo de expiración del cache en minutos
    this.cacheExpirationTime = 5;
  }
  
  /**
   * Verifica si el cache ha expirado
   * @returns {boolean} - true si el cache ha expirado
   */
  isCacheExpired() {
    if (!this.cache.lastUpdate) return true;
    
    const now = new Date();
    const elapsedMinutes = (now - this.cache.lastUpdate) / (1000 * 60);
    
    return elapsedMinutes > this.cacheExpirationTime;
  }
  
  /**
   * Limpia el cache para forzar la recarga de datos
   */
  clearCache() {
    
    this.cache.users = null;
    this.cache.surveys = null;
    this.cache.careerStats = null;
    this.cache.lastUpdate = null;
  }
  
  /**
   * Establece el filtro por carrera
   * @param {string} carreraId - ID de la carrera a filtrar, 'all' para todas
   */
  setCareerFilter(carreraId) {
    
    this.activeFilters.carrera = carreraId;
    // Limpiar cache para forzar recarga con el nuevo filtro
    this.clearCache();
  }
  
  /**
   * Obtiene todos los usuarios registrados en el sistema
   * @param {boolean} forceRefresh - Si es true, ignora el cache y obtiene datos frescos
   * @returns {Promise<Array>} - Arreglo con los datos de todos los usuarios
   */
  async getAllUsers(forceRefresh = false) {
    // Usar cache si está disponible y no ha expirado
    if (this.cache.users && !this.isCacheExpired() && !forceRefresh) {
      
      return this.cache.users;
    }
    
    try {
      console.log('[Admin Data Service] Obteniendo usuarios de Firestore');
      const snapshot = await dbService.collection('usuarios').get();
      
      const users = [];
      snapshot.forEach(doc => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Actualizar cache
      this.cache.users = users;
      this.cache.lastUpdate = new Date();
      
      return users;
    } catch (error) {
      console.error('[Admin Data Service] Error al obtener usuarios:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene todas las encuestas completadas con filtros aplicados
   * @param {boolean} forceRefresh - Si es true, ignora el cache y obtiene datos frescos
   * @param {Object} dateFilter - Filtro de fecha opcional: {startDate, endDate}
   * @returns {Promise<Array>} - Arreglo con los datos de todas las encuestas filtradas
   */
  async getAllSurveys(forceRefresh = false, dateFilter = null) {
    const carreraFilter = this.activeFilters.carrera;
    
    console.log('[Admin Data Service] Solicitud de encuestas con parametros:', {
      forceRefresh,
      dateFilter: dateFilter ? `${dateFilter.startDate} a ${dateFilter.endDate}` : 'ninguno',
      carrera: carreraFilter
    });
    
    // Crear clave de caché única con filtros combinados
    let cacheKey = 'surveys';
    if (dateFilter) {
      cacheKey += `_date_${dateFilter.startDate}_${dateFilter.endDate}`;
    }
    if (carreraFilter && carreraFilter !== 'all') {
      cacheKey += `_carrera_${carreraFilter}`;
    }
    
    // Usar cache si está disponible y no ha expirado
    if (this.cache[cacheKey] && !this.isCacheExpired() && !forceRefresh) {
      console.log(`[Admin Data Service] Usando cache para encuestas (clave: ${cacheKey})`);
      return this.cache[cacheKey];
    }
    
    try {
      console.log('[Admin Data Service] Obteniendo encuestas de Firestore con filtros:', dateFilter);
      console.time('getAllSurveys');
      
      // Convertir fechas de string a Date si se proporcionaron
      let startDate = null;
      let endDate = null;
      
      if (dateFilter && dateFilter.startDate) {
        startDate = new Date(dateFilter.startDate);
        console.log(`[Admin Data Service] Aplicando filtro de fecha inicio: ${startDate}`);
      }
      
      if (dateFilter && dateFilter.endDate) {
        endDate = new Date(dateFilter.endDate);
        // Ajustar al final del día
        endDate.setHours(23, 59, 59, 999);
        console.log(`[Admin Data Service] Aplicando filtro de fecha fin: ${endDate}`);
      }
      
      // Obtener todos los usuarios que han completado una encuesta
      console.log('[Admin Data Service] Consultando usuarios con encuestas completadas...');
      const usersSnapshot = await dbService.collection('usuarios')
        .where('encuestaCompletada', '==', true)
        .get();
      
      console.log(`[Admin Data Service] Encontrados ${usersSnapshot.size} usuarios con encuestas`);
      
      const surveys = [];
      let userCount = 0;
      
      // Para cada usuario, obtener su historial de encuestas
      for (const userDoc of usersSnapshot.docs) {
        userCount++;
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        // Log cada 10 usuarios para no saturar la consola
        if (userCount % 10 === 0 || userCount === 1) {
          console.log(`[Admin Data Service] Procesando usuario ${userCount}/${usersSnapshot.size} (${userData.email})`);
        }
        
        // Construir consulta base
        let query = dbService.collection('usuarios')
          .doc(userId)
          .collection('historialEncuestas')
          .orderBy('fechaCompletado', 'desc');
        
        // Limitar a la encuesta más reciente por usuario
        query = query.limit(1);
          
        // Ejecutar consulta
        const historySnapshot = await query.get();
        
        if (historySnapshot.empty) {
          console.log(`[Admin Data Service] Usuario ${userData.email} no tiene encuestas a pesar de tener encuestaCompletada=true`);
          continue;
        }
        
        // Añadir cada encuesta al arreglo (solo si cumple con el filtro de fecha)
        historySnapshot.forEach(surveyDoc => {
          const surveyData = surveyDoc.data();
          const fechaCompletado = surveyData.fechaCompletado?.toDate() || null;
          
          // Log detallado sobre la encuesta
          console.log(`[Admin Data Service] Procesando encuesta ${surveyDoc.id} del usuario ${userData.email}, fecha: ${fechaCompletado}`);
          
          // Aplicar filtro de fechas si existe
          if ((startDate && fechaCompletado < startDate) || 
              (endDate && fechaCompletado > endDate)) {
            console.log(`[Admin Data Service] Encuesta ${surveyDoc.id} OMITIDA - fuera del rango de fechas`);
            return; // Omitir esta encuesta si está fuera del rango de fechas
          }
          
          // Aplicar filtro de carrera si está activo
          if (carreraFilter && carreraFilter !== 'all') {
            // Verificar la carrera del usuario
            const userCarrera = userData.carrera || 'No especificada';
            if (userCarrera !== carreraFilter) {
              console.log(`[Admin Data Service] Encuesta ${surveyDoc.id} OMITIDA - no coincide con la carrera seleccionada`);
              return; // Omitir esta encuesta si la carrera no coincide
            }
          }
          
          try {
            // Parsear usuario usando el modelo
            const userParsed = window.parseUsuarioFirestore ? 
              window.parseUsuarioFirestore(userData) : 
              userData;
            
            // Parsear datos específicos según la estructura real de las encuestas
            // Las encuestas tienen módulos específicos según lo definido en encuesta.js
            
            // Parsear datos personales (módulo 1) - ya tenemos estos datos desde el usuario
            let datosPersonales = null;
            
            // Procesar datos de ubicación laboral y primer empleo
            let ubicacionLaboral = null;
            let primerEmpleo = null;
            let datosEmpresa = null;
            let desempenoProfesional = null;
            
            // Verificar la estructura correcta según los nombres de módulos
            
            // Datos de ubicación laboral (módulo 3) - desempenoProfesional en encuesta.js
            if (surveyData.desempenoProfesional) {
              ubicacionLaboral = surveyData.desempenoProfesional;
              console.log(`[Admin Data Service] Datos de desempeño profesional (ubicación laboral) procesados para encuesta ${surveyDoc.id}`);
            }
            
            // Datos de empleo (módulo 4) - primerEmpleo en encuesta.js
            if (surveyData.primerEmpleo) {
              primerEmpleo = surveyData.primerEmpleo;
              console.log(`[Admin Data Service] Datos de primer empleo procesados para encuesta ${surveyDoc.id}`);
            }
            
            // Datos de empresa (módulo 5) - datosEmpresa en encuesta.js
            if (surveyData.datosEmpresa) {
              datosEmpresa = surveyData.datosEmpresa;
              console.log(`[Admin Data Service] Datos de empresa procesados para encuesta ${surveyDoc.id}`);
            }
            
            // Datos de desarrollo continuo (módulo 6) - desarrolloContinuo en encuesta.js
            if (surveyData.desarrolloContinuo) {
              desempenoProfesional = surveyData.desarrolloContinuo;
              console.log(`[Admin Data Service] Datos de desarrollo continuo procesados para encuesta ${surveyDoc.id}`);
            }
            
            // Verificar también comentarios y sugerencias (módulo 9)
            let comentarios = null;
            if (surveyData.comentariosSugerencias) {
              comentarios = surveyData.comentariosSugerencias;
              console.log(`[Admin Data Service] Datos de comentarios procesados para encuesta ${surveyDoc.id}`);
            }
            
            // Encuesta completa con modelos validados - estructura según encuesta.js
            surveys.push({
              // Metadatos
              id: surveyDoc.id,
              userId: userId,
              fechaCompletado: fechaCompletado,
              fechaFiltrada: true, // Marca para indicar que pasó el filtro de fecha
              
              // Datos de usuario
              usuario: userParsed,
              email: userData.email,
              nombre: userData.nombre || '',
              apellidoPaterno: userData.apellidoPaterno || '',
              apellidoMaterno: userData.apellidoMaterno || '',
              carrera: userData.carrera || 'No especificada',
              titulado: userData.titulado === true,
              
              // Módulos de la encuesta con nombres alineados a encuesta.js
              desempenoProfesional: ubicacionLaboral, // Módulo 3
              primerEmpleo: primerEmpleo,             // Módulo 4
              datosEmpresa: datosEmpresa,             // Módulo 5
              desarrolloContinuo: desempenoProfesional, // Módulo 6
              comentariosSugerencias: comentarios,      // Módulo 9
              
              // Datos derivados para gráficas (alineados con la estructura real)
              actividad_actual: ubicacionLaboral?.actividad_actual || 
                               surveyData?.desempenoProfesional?.actividad_actual || 
                               'No especificada',
              
              tiempo_primer_empleo: primerEmpleo?.tiempo_primer_empleo || 
                                   surveyData?.primerEmpleo?.tiempo_primer_empleo || 
                                   'No especificado',
              
              ingreso: datosEmpresa?.ingreso || 
                       primerEmpleo?.ingreso ||
                       surveyData?.datosEmpresa?.ingreso || 
                       surveyData?.primerEmpleo?.ingreso ||
                       'No especificado',
              
              relacion_formacion: datosEmpresa?.relacion_formacion || 
                                 surveyData?.datosEmpresa?.relacion_formacion || 
                                 'No especificada',
              
              // Datos originales completos
              rawData: surveyData
            });
            
            console.log(`[Admin Data Service] Encuesta ${surveyDoc.id} procesada correctamente`);
          } catch (err) {
            console.error(`[Admin Data Service] Error al procesar encuesta ${surveyDoc.id}:`, err);
          }
        });
      }
      
      console.timeEnd('getAllSurveys');
      console.log(`[Admin Data Service] Procesamiento de encuestas completado: ${surveys.length} encuestas filtradas`);
      
      // Si hay muy pocas encuestas y debería haber más, es posible que haya un problema con los filtros
      if (surveys.length === 0 && usersSnapshot.size > 0) {
        console.warn('[Admin Data Service] Advertencia: No se encontraron encuestas que coincidan con los criterios de filtrado');
      }
      
      // Actualizar cache con la clave específica según filtro
      this.cache[cacheKey] = surveys;
      this.cache.lastUpdate = new Date();
      
      return surveys;
    } catch (error) {
      console.error('[Admin Data Service] Error al obtener encuestas:', error);
      console.error('[Admin Data Service] Stack trace:', error.stack);
      throw error;
    }
  }
  
  /**
   * Obtiene estadísticas por carrera
   * @param {boolean} forceRefresh - Si es true, ignora el cache y obtiene datos frescos
   * @returns {Promise<Object>} - Objeto con estadísticas agrupadas por carrera
   */
  async getStatsByCareer(forceRefresh = false) {
    // Usar cache si está disponible y no ha expirado
    if (this.cache.careerStats && !this.isCacheExpired() && !forceRefresh) {
      console.log('[Admin Data Service] Usando cache para estadísticas por carrera');
      return this.cache.careerStats;
    }
    
    try {
      // Obtener todos los usuarios
      const users = await this.getAllUsers(forceRefresh);
      
      // Inicializar objeto para estadísticas por carrera
      const statsByCareer = {};
      
      // Agrupar usuarios por carrera
      users.forEach(user => {
        const carrera = user.carrera || 'No especificada';
        
        // Inicializar objeto para la carrera si no existe
        if (!statsByCareer[carrera]) {
          statsByCareer[carrera] = {
            totalUsuarios: 0,
            encuestasCompletadas: 0,
            titulados: 0,
            trabajan: 0,
            estudian: 0,
            trabajanYEstudian: 0,
            niTrabajanNiEstudian: 0
          };
        }
        
        // Incrementar contadores
        statsByCareer[carrera].totalUsuarios++;
        
        if (user.encuestaCompletada) {
          statsByCareer[carrera].encuestasCompletadas++;
        }
        
        if (user.titulado) {
          statsByCareer[carrera].titulados++;
        }
        
        if (user.trabaja && user.estudia) {
          statsByCareer[carrera].trabajanYEstudian++;
        } else if (user.trabaja) {
          statsByCareer[carrera].trabajan++;
        } else if (user.estudia) {
          statsByCareer[carrera].estudian++;
        } else {
          statsByCareer[carrera].niTrabajanNiEstudian++;
        }
      });
      
      // Actualizar cache
      this.cache.careerStats = statsByCareer;
      
      return statsByCareer;
    } catch (error) {
      console.error('Error getting career stats:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene estadísticas de titulación
   * @param {Array} filteredSurveys - Encuestas ya filtradas (opcional)
   * @returns {Promise<Object>} - Objeto con estadísticas
   */
  async getGraduationStats(filteredSurveys = null) {
    try {
      console.time('getGraduationStats');
      
      // Usar encuestas filtradas o obtener todas
      // IMPORTANTE: Usamos las encuestas filtradas para mantener coherencia con los filtros aplicados
      const surveys = filteredSurveys || await this.getAllSurveys();
      
      // Inicializar contadores
      let titulados = 0;
      let noTitulados = 0;
      
      // Contar titulados y no titulados en las encuestas procesadas
      surveys.forEach(survey => {
        let esTitulado = false;
        
        // Buscar el dato de titulación en diferentes lugares posibles
        if (survey.titulado === true) {
          // Del campo procesado directo
          esTitulado = true;
        } else if (survey.usuario && survey.usuario.titulado === true) {
          // Del objeto usuario procesado
          esTitulado = true;
        } else if (survey.rawData && survey.rawData.datosPersonales && survey.rawData.datosPersonales.titulado === true) {
          // Del módulo 1 en datos originales
          esTitulado = true;
        }
        
        // Incrementar contador apropiado
        if (esTitulado) {
          titulados++;
        } else {
          noTitulados++;
        }
      });
      
      const total = titulados + noTitulados;
      const porcentajeTitulados = total > 0 ? (titulados / total) * 100 : 0;
      
      console.timeEnd('getGraduationStats');
      
      return {
        total,
        titulados,
        noTitulados,
        porcentajeTitulados: porcentajeTitulados.toFixed(1)
      };
    } catch (error) {
      console.error('[Admin Data Service] Error al obtener estadísticas de titulación:', error);
      throw error;
    }
  }
  
}

// Instancia global del servicio
window.adminDataService = new AdminDataService();
