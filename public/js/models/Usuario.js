// models/Usuario.js
// Entidad/factory para asegurar tipos y valores por defecto de usuario

export function crearUsuarioDesdeFormulario(form, user, idiomas = [], paquetes = []) {
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

// Si en el futuro recibes datos "crudos" de Firestore, puedes hacer:
// export function parseUsuarioFirestore(data) {
//   return {
//     uid: data.uid || '',
//     email: data.email || '',
//     ...etc
//   }
// }
