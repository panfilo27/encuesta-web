/**
 * Modelo UserRol
 * Gestiona la información básica del perfil del usuario para roles y datos generales.
 */
class UserRol {
  constructor(userId, email, nombre, apellidoPaterno, apellidoMaterno, rol = 'egresado') {
    this.userId = userId;
    this.email = email;
    this.nombre = nombre.trim();
    this.apellidoPaterno = apellidoPaterno.trim();
    this.apellidoMaterno = apellidoMaterno.trim();
    this.rol = rol;
    this.fechaRegistro = firebase.firestore.FieldValue.serverTimestamp(); // Opcional: registrar cuándo se creó este perfil
  }

  /**
   * Crea un objeto UserRol a partir de los datos del Módulo 1 y la información de autenticación.
   * @param {Object} modulo1Data - Datos del formulario del Módulo 1 (debe incluir nombre, apellidoPaterno, apellidoMaterno).
   * @param {string} userId - ID del usuario autenticado.
   * @param {string} email - Email del usuario autenticado.
   * @returns {UserRol} - Instancia de UserRol.
   */
  static fromModulo1Data(modulo1Data, userId, email) {
    if (!modulo1Data || !userId || !email) {
      console.error('[UserRol] Faltan datos para crear UserRol desde Módulo 1.');
      return null;
    }
    // Asegúrate que modulo1Data tenga las propiedades esperadas. Ej: modulo1Data.nombre_completo.nombre
    // Esto dependerá de la estructura exacta de tu objeto IdentificacionEgresado o similar de modulo1_data.
    // Por ahora, asumiré que modulo1Data tiene directamente nombre, apellidoPaterno, apellidoMaterno.
    // Acceder a las propiedades usando los nombres exactos presentes en formData (que vienen de los 'name' de los inputs HTML)
    const nombre = modulo1Data.nombre || '';
    const apellidoPaterno = modulo1Data.apellidoPaterno || '';
    const apellidoMaterno = modulo1Data.apellidoMaterno || '';

    if (!nombre || !apellidoPaterno) {
        console.warn('[UserRol] Nombre o Apellido Paterno no encontrados en modulo1Data para UserRol. Se usarán valores vacíos.');
    }

    return new UserRol(userId, email, nombre, apellidoPaterno, apellidoMaterno);
  }

  /**
   * Devuelve un objeto simple para ser guardado en Firestore.
   * @returns {Object}
   */
  toFirestore() {
    return {
      userId: this.userId,
      email: this.email,
      nombre: this.nombre,
      apellidoPaterno: this.apellidoPaterno,
      apellidoMaterno: this.apellidoMaterno,
      rol: this.rol,
      // Solo incluir fechaRegistro si se va a crear, no en cada actualización
      // Para este caso, lo guardaremos en el documento principal del usuario, así que `merge:true` se encargará.
      // Si fechaRegistro ya existe, no se sobreescribirá si se usa merge y no está en este objeto.
      // Si queremos que se establezca solo una vez, la lógica de guardado debería manejarlo.
      // Por simplicidad, si se actualiza, también se actualizaría la fecha si la incluimos aquí siempre.
      // Vamos a añadirlo, y si es la primera vez se establece, si ya existe, se sobreescribe.
      // Si se quiere que solo se guarde una vez, se debe manejar en la lógica de guardado.
      fechaUltimaActualizacionPerfil: firebase.firestore.FieldValue.serverTimestamp() 
    };
  }

  /**
   * Convierte datos de Firestore a un objeto UserRol.
   * @param {Object} firestoreData - Datos recuperados de Firestore.
   * @returns {UserRol | null}
   */
  static fromFirestore(firestoreData) {
    if (!firestoreData) return null;
    const user = new UserRol(
      firestoreData.userId,
      firestoreData.email,
      firestoreData.nombre,
      firestoreData.apellidoPaterno,
      firestoreData.apellidoMaterno,
      firestoreData.rol
    );
    // Podemos añadir más propiedades si es necesario, como fechaRegistro.
    if (firestoreData.fechaRegistro) {
      user.fechaRegistro = firestoreData.fechaRegistro;
    }
    if (firestoreData.fechaUltimaActualizacionPerfil) {
        user.fechaUltimaActualizacionPerfil = firestoreData.fechaUltimaActualizacionPerfil;
    }
    return user;
  }
}

// Para asegurar que se pueda importar en otros archivos si es necesario
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = UserRol;
}
