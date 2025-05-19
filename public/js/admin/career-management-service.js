/**
 * CareerManagementService.js - Servicio para gestión de carreras
 * Maneja todas las operaciones de datos relacionadas con carreras y su asignación a jefes de departamento
 */

class CareerManagementService {
  constructor() {
    this.db = firebase.firestore();
    this.careersCache = null;
    this.careerAdminsCache = {}; // Cache de administradores por carrera
  }

  /**
   * Obtiene todas las carreras disponibles
   * @returns {Promise<Array>} Lista de carreras
   */
  async getAllCareers() {
    try {
      
      
      // Si ya tenemos las carreras en cache, las devolvemos
      if (this.careersCache) {
        
        return [...this.careersCache]; // Devuelve una copia para evitar modificaciones accidentales
      }
      
      // Obtener carreras de Firestore
      const careersSnapshot = await this.db.collection('carreras').get();
      
      if (careersSnapshot.empty) {
        
        this.careersCache = [];
        return [];
      }
      
      // Convertir documentos a objetos
      const careers = [];
      for (const doc of careersSnapshot.docs) {
        const careerData = doc.data();
        careers.push({
          id: doc.id,
          nombre: careerData.nombre || '',
          codigo: careerData.codigo || '',
          facultad: careerData.facultad || '',
          jefeDepartamentoId: careerData.jefeDepartamentoId || null,
          // Otros campos que pueda tener
        });
      }
      
      
      this.careersCache = careers;
      return careers;
    } catch (error) {
      console.error('[Career Management Service] Error al obtener carreras:', error);
      throw error;
    }
  }

  /**
   * Obtiene información de una carrera específica
   * @param {string} careerId - ID de la carrera
   * @returns {Promise<Object>} Datos de la carrera
   */
  async getCareerById(careerId) {
    try {
      
      
      // Intentar obtener de cache primero
      if (this.careersCache) {
        const cachedCareer = this.careersCache.find(c => c.id === careerId);
        if (cachedCareer) {
          return { ...cachedCareer };
        }
      }
      
      // Si no está en cache, obtener de Firestore
      const careerDoc = await this.db.collection('carreras').doc(careerId).get();
      
      if (!careerDoc.exists) {
        
        return null;
      }
      
      const careerData = careerDoc.data();
      return {
        id: careerDoc.id,
        nombre: careerData.nombre || '',
        codigo: careerData.codigo || '',
        facultad: careerData.facultad || '',
        jefeDepartamentoId: careerData.jefeDepartamentoId || null,
      };
    } catch (error) {
      console.error(`[Career Management Service] Error al obtener carrera ${careerId}:`, error);
      throw error;
    }
  }

  /**
   * Crea una nueva carrera
   * @param {Object} careerData - Datos de la carrera
   * @returns {Promise<string>} ID de la carrera creada
   */
  async createCareer(careerData) {
    try {      
      // Validar datos mínimos
      if (!careerData.nombre || !careerData.codigo) {
        throw new Error('El nombre y código de la carrera son obligatorios');
      }
      
      // Crear documento en Firestore
      const newCareerRef = await this.db.collection('carreras').add({
        nombre: careerData.nombre,
        codigo: careerData.codigo,
        facultad: careerData.facultad || '',
        jefeDepartamentoId: careerData.jefeDepartamentoId || null,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`[Career Management Service] Carrera creada con ID: ${newCareerRef.id}`);
      
      // Invalidar cache
      this.careersCache = null;
      
      return newCareerRef.id;
    } catch (error) {
      console.error('[Career Management Service] Error al crear carrera:', error);
      throw error;
    }
  }

  /**
   * Actualiza una carrera existente
   * @param {string} careerId - ID de la carrera
   * @param {Object} careerData - Datos actualizados de la carrera
   * @returns {Promise<void>}
   */
  async updateCareer(careerId, careerData) {
    try {
      console.log(`[Career Management Service] Actualizando carrera ${careerId}:`, careerData);
      
      // Validar datos mínimos
      if (!careerData.nombre || !careerData.codigo) {
        throw new Error('El nombre y código de la carrera son obligatorios');
      }
      
      // Actualizar documento en Firestore
      await this.db.collection('carreras').doc(careerId).update({
        nombre: careerData.nombre,
        codigo: careerData.codigo,
        facultad: careerData.facultad || '',
        jefeDepartamentoId: careerData.jefeDepartamentoId || null,
        fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`[Career Management Service] Carrera ${careerId} actualizada con éxito`);
      
      // Invalidar cache
      this.careersCache = null;
      
      return true;
    } catch (error) {
      console.error(`[Career Management Service] Error al actualizar carrera ${careerId}:`, error);
      throw error;
    }
  }

  /**
   * Elimina una carrera
   * @param {string} careerId - ID de la carrera
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async deleteCareer(careerId) {
    try {
      console.log(`[Career Management Service] Eliminando carrera ${careerId}`);
      
      // Verificar si hay jefe de departamento asignado
      const career = await this.getCareerById(careerId);
      
      // Si hay un jefe de departamento, quitar su rol
      if (career && career.jefeDepartamentoId) {
        // Actualizar usuario para quitar su rol de jefe de departamento
        await this.db.collection('usuarios').doc(career.jefeDepartamentoId).update({
          rol: 'usuario', // Vuelve a ser un usuario regular
          carreraAsignada: firebase.firestore.FieldValue.delete() // Elimina el campo
        });
      }
      
      // Eliminar carrera
      await this.db.collection('carreras').doc(careerId).delete();
      console.log(`[Career Management Service] Carrera ${careerId} eliminada con éxito`);
      
      // Invalidar cache
      this.careersCache = null;
      
      return true;
    } catch (error) {
      console.error(`[Career Management Service] Error al eliminar carrera ${careerId}:`, error);
      throw error;
    }
  }

  /**
   * Asigna un jefe de departamento a una carrera
   * @param {string} careerId - ID de la carrera
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async assignDepartmentHead(careerId, userId) {
    try {
      console.log(`[Career Management Service] Asignando jefe de departamento ${userId} a carrera ${careerId}`);
      
      // Verificar carrera
      const career = await this.getCareerById(careerId);
      if (!career) {
        throw new Error(`No existe la carrera con ID ${careerId}`);
      }
      
      // Verificar si la carrera ya tiene un jefe asignado
      if (
  career.jefeDepartamentoId &&
  career.jefeDepartamentoId !== userId &&
  career.jefeDepartamentoId !== 'undefined'
) {
        // Hay que quitar el rol al jefe anterior
        await this.db.collection('usuarios').doc(career.jefeDepartamentoId).update({
          rol: 'usuario',
          carreraAsignada: firebase.firestore.FieldValue.delete()
        });
        
        console.log(`[Career Management Service] Removido jefe anterior ${career.jefeDepartamentoId} de carrera ${careerId}`);
      }
      
      // Actualizar la carrera con el nuevo jefe
      await this.db.collection('carreras').doc(careerId).update({
        jefeDepartamentoId: userId,
        fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Actualizar el usuario con su nuevo rol
      await this.db.collection('usuarios').doc(userId).update({
        rol: 'jefeDepartamento',
        carreraAsignada: careerId
      });
      
      console.log(`[Career Management Service] Usuario ${userId} asignado como jefe de departamento para carrera ${careerId}`);
      
      // Invalidar cache
      this.careersCache = null;
      delete this.careerAdminsCache[careerId];
      
      return true;
    } catch (error) {
      console.error(`[Career Management Service] Error al asignar jefe de departamento:`, error);
      throw error;
    }
  }

  /**
   * Remueve un jefe de departamento de una carrera
   * @param {string} careerId - ID de la carrera
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async removeDepartmentHead(careerId) {
    try {
      console.log(`[Career Management Service] Removiendo jefe de departamento de carrera ${careerId}`);
      
      // Verificar carrera
      const career = await this.getCareerById(careerId);
      if (!career) {
        throw new Error(`No existe la carrera con ID ${careerId}`);
      }
      
      // Si no hay jefe asignado, no hay nada que hacer
      if (!career.jefeDepartamentoId) {
        console.log(`[Career Management Service] La carrera ${careerId} no tiene jefe asignado`);
        return true;
      }
      
      // Actualizar el usuario para quitar su rol
      await this.db.collection('usuarios').doc(career.jefeDepartamentoId).update({
        rol: 'usuario',
        carreraAsignada: firebase.firestore.FieldValue.delete()
      });
      
      // Actualizar la carrera para quitar el jefe
      await this.db.collection('carreras').doc(careerId).update({
        jefeDepartamentoId: null,
        fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`[Career Management Service] Jefe de departamento removido de carrera ${careerId}`);
      
      // Invalidar cache
      this.careersCache = null;
      delete this.careerAdminsCache[careerId];
      
      return true;
    } catch (error) {
      console.error(`[Career Management Service] Error al remover jefe de departamento:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el jefe de departamento de una carrera
   * @param {string} careerId - ID de la carrera
   * @returns {Promise<Object|null>} Datos del jefe de departamento o null si no hay
   */
  async getDepartmentHead(careerId) {
    try {
      console.log(`[Career Management Service] Obteniendo jefe de departamento para carrera ${careerId}`);
      
      // Verificar si ya tenemos este admin en cache
      if (this.careerAdminsCache[careerId]) {
        return this.careerAdminsCache[careerId];
      }
      
      // Obtener la carrera
      const career = await this.getCareerById(careerId);
      if (!career || !career.jefeDepartamentoId) {
        console.log(`[Career Management Service] La carrera ${careerId} no tiene jefe asignado`);
        return null;
      }
      
      // Obtener datos del usuario
      const userDoc = await this.db.collection('usuarios').doc(career.jefeDepartamentoId).get();
      
      if (!userDoc.exists) {
        console.log(`[Career Management Service] No se encontró el usuario ${career.jefeDepartamentoId}`);
        return null;
      }
      
      const userData = userDoc.data();
      const admin = {
        id: userDoc.id,
        nombre: userData.nombre || '',
        apellidoPaterno: userData.apellidoPaterno || '',
        apellidoMaterno: userData.apellidoMaterno || '',
        email: userData.email || '',
        rol: userData.rol || 'usuario'
      };
      
      // Guardar en cache
      this.careerAdminsCache[careerId] = admin;
      
      return admin;
    } catch (error) {
      console.error(`[Career Management Service] Error al obtener jefe de departamento:`, error);
      throw error;
    }
  }

  /**
   * Limpia la caché del servicio
   */
  clearCache() {
    this.careersCache = null;
    this.careerAdminsCache = {};
    console.log('[Career Management Service] Cache limpiada');
  }
}

// Exportar el servicio
window.CareerManagementService = CareerManagementService;
