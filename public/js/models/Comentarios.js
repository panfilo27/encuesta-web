/**
 * Modelo para el Módulo 9 - Comentarios y Sugerencias
 * 
 * Gestiona la estructura de datos para los comentarios y sugerencias
 * que el egresado proporciona al final de la encuesta.
 */

class Comentarios {
  constructor() {
    this.academico = '';
    this.docentes = '';
    this.instalaciones = '';
    this.servicios = '';
    this.otros = '';
  }
  
  /**
   * Crea un objeto de Comentarios a partir de los datos del formulario
   * @param {Object} formData - Datos recopilados del formulario
   * @returns {Comentarios} - Objeto con los datos de comentarios
   */
  static crearObjetoComentarios(formData) {
    const comentarios = new Comentarios();
    comentarios.academico = formData.academico || '';
    comentarios.docentes = formData.docentes || '';
    comentarios.instalaciones = formData.instalaciones || '';
    comentarios.servicios = formData.servicios || '';
    comentarios.otros = formData.otros || '';
    return comentarios;
  }
  
  /**
   * Convierte los datos de Firestore en un objeto Comentarios
   * @param {Object} data - Datos recuperados de Firestore
   * @returns {Comentarios} - Objeto con los datos de comentarios
   */
  static parseComentariosFirestore(data) {
    if (!data) return new Comentarios();
    
    const comentarios = new Comentarios();
    comentarios.academico = data.academico || '';
    comentarios.docentes = data.docentes || '';
    comentarios.instalaciones = data.instalaciones || '';
    comentarios.servicios = data.servicios || '';
    comentarios.otros = data.otros || '';
    return comentarios;
  }
}
