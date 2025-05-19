// models/Usuario.js
// Entidad/factory para asegurar tipos y valores por defecto de usuario

// Función global para crear un usuario desde el formulario
window.crearUsuarioDesdeFormulario = function(form, user, idiomas = [], paquetes = []) {
  return {
    uid: user?.uid || '',
    email: user?.email || '',
    nombre: (form.nombre?.value || '').trim(),
    apellidoPaterno: (form.apellidoPaterno?.value || '').trim(),
    apellidoMaterno: (form.apellidoMaterno?.value || '').trim(),
    noControl: (form.noControl?.value || '').trim(),
    fechaNacimiento: form.fechaNacimiento?.value || '',
    curp: (form.curp?.value || '').trim(),
    sexo: form.sexo?.value || '',
    estadoCivil: form.estadoCivil?.value || '',
    domicilio: (form.domicilio?.value || '').trim(),
    ciudad: (form.ciudad?.value || '').trim(),
    municipio: (form.municipio?.value || '').trim(),
    estado: (form.estado?.value || '').trim(),
    telefono: (form.telefono?.value || '').trim(),
    telCasa: (form.telCasa?.value || '').trim(),
    carrera: form.carrera?.value || '',
    titulado: form.titulado?.value === 'Si',
    trabaja: !!form.trabaja?.checked,
    estudia: !!form.estudia?.checked,
    mesEgreso: form.mesEgreso?.value || '',
    idiomas: Array.isArray(idiomas) ? idiomas : [],
    paquetes: Array.isArray(paquetes) ? paquetes : []
  };
}

// Función para parsear datos de usuario desde Firestore
window.parseUsuarioFirestore = function(data) {
  if (!data) return null;
  
  return {
    // Datos básicos
    uid: data.uid || '',
    email: data.email || '',
    
    // Datos personales
    nombre: data.nombre || '',
    apellidoPaterno: data.apellidoPaterno || '',
    apellidoMaterno: data.apellidoMaterno || '',
    noControl: data.noControl || '',
    fechaNacimiento: data.fechaNacimiento || '',
    curp: data.curp || '',
    sexo: data.sexo || '',
    estadoCivil: data.estadoCivil || '',
    
    // Ubicación
    domicilio: data.domicilio || '',
    ciudad: data.ciudad || '',
    municipio: data.municipio || '',
    estado: data.estado || '',
    
    // Contacto
    telefono: data.telefono || '',
    telCasa: data.telCasa || '',
    
    // Académico
    carrera: data.carrera || '',
    titulado: data.titulado === true,
    trabaja: data.trabaja === true,
    estudia: data.estudia === true,
    mesEgreso: data.mesEgreso || '',
    
    // Arrays
    idiomas: Array.isArray(data.idiomas) ? data.idiomas : [],
    paquetes: Array.isArray(data.paquetes) ? data.paquetes : [],
    
    // Timestamp
    ultimaModificacion: data.ultimaModificacion || null
  };
}
