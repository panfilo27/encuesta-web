// completar-registro.js
// Lógica dinámica para el formulario de completar registro

// Carreras del TecNM Veracruz
const CARRERAS = [
  'Ingeniería en Sistemas Computacionales',
  'Ingeniería Industrial',
  'Ingeniería Electrónica',
  'Ingeniería Eléctrica',
  'Ingeniería Mecánica',
  'Ingeniería Química',
  'Ingeniería en Gestión Empresarial',
  'Licenciatura en Administración',
  'Ingeniería en Energías Renovables'
];

const IDIOMAS = [
  'Inglés',
  'Francés',
  'Alemán',
  'Italiano',
  'Portugués',
  'Chino',
  'Japonés',
  'Ruso',
  'Árabe',
  'Otro'
];

const PAQUETES = [
  'Microsoft Office',
  'AutoCAD',
  'MATLAB',
  'SolidWorks',
  'Visual Studio',
  'Eclipse',
  'Photoshop',
  'Illustrator',
  'CorelDRAW',
  'SPSS',
  'Otro'
];

console.log('[CompletarRegistro] Script cargado');

window.initCompletarRegistroForm = function() {
  console.log('[CompletarRegistro] initCompletarRegistroForm llamada');
  // Log arrays base
  console.log('[CompletarRegistro] CARRERAS:', CARRERAS);
  console.log('[CompletarRegistro] IDIOMAS:', IDIOMAS);
  console.log('[CompletarRegistro] PAQUETES:', PAQUETES);

  // Log existencia de elementos clave
  const carreraSelect = document.getElementById('carrera');
  const idiomasList = document.getElementById('idiomas-list');
  const paquetesList = document.getElementById('paquetes-list');
  console.log('[CompletarRegistro] carreraSelect:', carreraSelect);
  console.log('[CompletarRegistro] idiomasList:', idiomasList);
  console.log('[CompletarRegistro] paquetesList:', paquetesList);
  if (!carreraSelect) console.error('[CompletarRegistro] No se encontró #carrera');
  if (!idiomasList) console.error('[CompletarRegistro] No se encontró #idiomas-list');
  if (!paquetesList) console.error('[CompletarRegistro] No se encontró #paquetes-list');

  if (!window.firebase || !window.firebase.auth) {
    console.log('[CompletarRegistro] Firebase no inicializado');
    return;
  }
  console.log('[CompletarRegistro] Firebase inicializado');
  window.firebase.auth().onAuthStateChanged(user => {
    function setEmailField() {
      const emailInput = document.getElementById('email');
      console.log('[CompletarRegistro] onAuthStateChanged', {user, emailInput});
      if (!user) {
        console.log('[CompletarRegistro] No user, redirigiendo a login');
        window.location.href = 'auth.html';
        return;
      }
      if (emailInput) {
        console.log('[CompletarRegistro] Input encontrado, seteando email', user.email);
        emailInput.value = user.email;
        emailInput.disabled = true;
        emailInput.style.background = '#eee';
        emailInput.style.cursor = 'not-allowed';
        // Para que se envíe el email, crea un input hidden
        let hidden = document.getElementById('email-hidden');
        if (!hidden) {
          hidden = document.createElement('input');
          hidden.type = 'hidden';
          hidden.name = 'email';
          hidden.id = 'email-hidden';
          emailInput.parentNode.appendChild(hidden);
        }
        hidden.value = user.email;
      } else {
        console.log('[CompletarRegistro] Input no encontrado, reintentando...');
        setTimeout(setEmailField, 100);
      }
    }
    setEmailField();
  });
  // Llena el select de carreras
  // carreraSelect ya fue declarado arriba
  CARRERAS.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    carreraSelect.appendChild(opt);
  });

  // Mostrar/ocultar Mes y Año de egreso según titulado
  const tituladoRadios = document.querySelectorAll('input[name="titulado"]');
  const egresoBlock = document.getElementById('egreso-block');
  tituladoRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      egresoBlock.style.display = radio.value === 'Si' && radio.checked ? 'block' : 'none';
    });
  });

  // Idiomas
  let idiomaCount = 0;
  let paqueteCount = 0;
  // Gestión de opciones disponibles para evitar duplicados
  let idiomasDisponibles = [...IDIOMAS];
  let paquetesDisponibles = [...PAQUETES];

  function actualizarBotonAddIdioma() {
    addIdiomaBtn.disabled = idiomasDisponibles.length === 0;
  }
  function actualizarBotonAddPaquete() {
    addPaqueteBtn.disabled = paquetesDisponibles.length === 0;
  }

  function addIdioma(nombre = '', porcentaje = '') {
    // Obtener todos los idiomas seleccionados actualmente
    const selects = idiomasList.querySelectorAll('select');
    const seleccionados = Array.from(selects).map(s => s.value);

    // Si se pasa un nombre explícito (por ejemplo, al cargar desde base de datos), úsalo
    let valorInicial = nombre;

    // Opciones predefinidas no seleccionadas (sin contar 'Otro')
    const predefinidosNoSeleccionados = IDIOMAS.filter(id => id !== 'Otro' && !seleccionados.includes(id));

    // Si no, busca el primer idioma predefinido no seleccionado, si no hay, solo 'Otro'
    if (!valorInicial) {
      if (predefinidosNoSeleccionados.length > 0) {
        valorInicial = predefinidosNoSeleccionados[0];
      } else {
        valorInicial = 'Otro';
      }
    }

    idiomaCount++;
    const div = document.createElement('div');
    div.className = 'input-inline';
    div.style.marginBottom = '0.5rem';
    const select = document.createElement('select');
    select.name = `idioma_${idiomaCount}`;

    // Si ya no hay predefinidos, solo agrega la opción 'Otro'
    if (predefinidosNoSeleccionados.length === 0) {
      const opt = document.createElement('option');
      opt.value = 'Otro';
      opt.textContent = 'Otro';
      select.appendChild(opt);
    } else {
      IDIOMAS.forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = id;
        // Deshabilita si ya está seleccionado en otro select (excepto si es el valor inicial de este select), pero nunca 'Otro'
        if (id !== 'Otro' && seleccionados.includes(id) && id !== valorInicial) {
          opt.disabled = true;
        }
        select.appendChild(opt);
      });
    }

    select.value = valorInicial;

    // Campo para idioma personalizado (solo si selecciona Otro)
    const inputOtro = document.createElement('input');
    inputOtro.type = 'text';
    inputOtro.name = `idioma_otro_${idiomaCount}`;
    inputOtro.placeholder = 'Especificar idioma';
    inputOtro.style.display = select.value === 'Otro' ? 'inline-block' : 'none';
    inputOtro.required = select.value === 'Otro';
    // Porcentaje
    const input = document.createElement('input');
    input.type = 'number';
    input.name = `idioma_pct_${idiomaCount}`;
    input.placeholder = '%';
    input.min = 1;
    input.max = 100;
    input.style.width = '70px';
    if (porcentaje) input.value = porcentaje;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Quitar';
    removeBtn.onclick = () => {
      idiomasDisponibles.push(select.value);
      div.remove();
      actualizarBotonAddIdioma();
      actualizarSelectsIdiomas();
    };
    select.onchange = () => {
      inputOtro.style.display = select.value === 'Otro' ? 'inline-block' : 'none';
      inputOtro.required = select.value === 'Otro';
      actualizarSelectsIdiomas();
    };
    div.append('Idioma:', select, inputOtro, ' %:', input, removeBtn);
    idiomasList.appendChild(div);
    // Al agregar, elimina de disponibles
    if (select.value && idiomasDisponibles.includes(select.value)) {
      idiomasDisponibles = idiomasDisponibles.filter(id => id !== select.value);
    }
    actualizarBotonAddIdioma();
    actualizarSelectsIdiomas();
  }
  function actualizarSelectsIdiomas() {
    // Actualiza los selects para evitar duplicados
    const selects = idiomasList.querySelectorAll('select');
    const seleccionados = Array.from(selects).map(s => s.value);
    selects.forEach(select => {
      const actual = select.value;
      select.querySelectorAll('option').forEach(opt => {
        // Siempre mostrar todas las opciones, pero deshabilitar las ya seleccionadas (excepto la actualmente seleccionada en este select)
        if (opt.value === actual) {
          opt.disabled = false;
        } else {
          opt.disabled = seleccionados.includes(opt.value);
        }
      });
    });
    actualizarBotonAddIdioma();
  }
  const addIdiomaBtn = document.getElementById('add-idioma');
  addIdiomaBtn.onclick = () => addIdioma();
  addIdioma('Inglés', ''); // Uno por defecto

  function addPaquete(nombre = '') {
    // Obtener todos los paquetes seleccionados actualmente
    const selects = paquetesList.querySelectorAll('select');
    const seleccionados = Array.from(selects).map(s => s.value);

    // Si se pasa un nombre explícito (por ejemplo, al cargar desde base de datos), úsalo
    let valorInicial = nombre;

    // Opciones predefinidas no seleccionadas (sin contar 'Otro')
    const predefinidosNoSeleccionados = PAQUETES.filter(pq => pq !== 'Otro' && !seleccionados.includes(pq));

    // Si no, busca el primer paquete predefinido no seleccionado, si no hay, solo 'Otro'
    if (!valorInicial) {
      if (predefinidosNoSeleccionados.length > 0) {
        valorInicial = predefinidosNoSeleccionados[0];
      } else {
        valorInicial = 'Otro';
      }
    }

    paqueteCount++;
    const div = document.createElement('div');
    div.className = 'input-inline';
    div.style.marginBottom = '0.5rem';
    const select = document.createElement('select');
    select.name = `paquete_${paqueteCount}`;

    // Si ya no hay predefinidos, solo agrega la opción 'Otro'
    if (predefinidosNoSeleccionados.length === 0) {
      const opt = document.createElement('option');
      opt.value = 'Otro';
      opt.textContent = 'Otro';
      select.appendChild(opt);
    } else {
      PAQUETES.forEach(pq => {
        const opt = document.createElement('option');
        opt.value = pq;
        opt.textContent = pq;
        // Deshabilita si ya está seleccionado en otro select (excepto si es el valor inicial de este select), pero nunca 'Otro'
        if (pq !== 'Otro' && seleccionados.includes(pq) && pq !== valorInicial) {
          opt.disabled = true;
        }
        select.appendChild(opt);
      });
    }

    select.value = valorInicial;

    // Campo para paquete personalizado (solo si selecciona Otro)
    const inputOtro = document.createElement('input');
    inputOtro.type = 'text';
    inputOtro.name = `paquete_otro_${paqueteCount}`;
    inputOtro.placeholder = 'Especificar paquete';
    inputOtro.style.display = select.value === 'Otro' ? 'inline-block' : 'none';
    inputOtro.required = select.value === 'Otro';
    select.onchange = () => {
      inputOtro.style.display = select.value === 'Otro' ? 'inline-block' : 'none';
      inputOtro.required = select.value === 'Otro';
      actualizarSelectsPaquetes();
    };
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Quitar';
    removeBtn.onclick = () => {
      div.remove();
      actualizarBotonAddPaquete();
      actualizarSelectsPaquetes();
    };
    div.append('Paquete:', select, inputOtro, removeBtn);
    paquetesList.appendChild(div);
    actualizarBotonAddPaquete();
    actualizarSelectsPaquetes();
  }
  function actualizarSelectsPaquetes() {
    const selects = paquetesList.querySelectorAll('select');
    const seleccionados = Array.from(selects).map(s => s.value);
    selects.forEach(select => {
      const actual = select.value;
      select.querySelectorAll('option').forEach(opt => {
        // Siempre mostrar todas las opciones, pero deshabilitar las ya seleccionadas (excepto la actualmente seleccionada en este select)
        if (opt.value === actual) {
          opt.disabled = false;
        } else {
          opt.disabled = seleccionados.includes(opt.value);
        }
      });
    });
    actualizarBotonAddPaquete();
  }
  const addPaqueteBtn = document.getElementById('add-paquete');
  addPaqueteBtn.onclick = () => addPaquete();
  addPaquete('Microsoft Office'); // Uno por defecto


// (Bloque duplicado de paquetes eliminado: ahora solo existe la versión moderna y funcional más arriba)

  // Validación y envío del formulario
  document.getElementById('registro-form').onsubmit = async function(e) {
    e.preventDefault();
    const msg = document.getElementById('registro-message');
    msg.textContent = '';
    msg.classList.remove('success', 'error');

    // Obtener usuario autenticado
    const user = window.firebase.auth().currentUser;
    if (!user) {
      msg.textContent = 'No hay usuario autenticado.';
      msg.classList.add('error');
      return;
    }

    // Validaciones extra
    const form = e.target;
    let errores = [];
    // Teléfonos: 10 dígitos
    if (!/^\d{10}$/.test(form.telefono.value)) {
      errores.push('El teléfono debe tener 10 dígitos.');
    }
    if (form.telCasa.value && !/^\d{10}$/.test(form.telCasa.value)) {
      errores.push('El teléfono de casa debe tener 10 dígitos.');
    }
    // No. de control: 8-10 dígitos
    if (!/^\d{8,10}$/.test(form.noControl.value)) {
      errores.push('El número de control debe tener entre 8 y 10 dígitos.');
    }
    // CURP: 18 caracteres, mayúsculas, formato oficial
    const curp = form.curp.value.trim().toUpperCase();
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/;
    if (!curpRegex.test(curp)) {
      errores.push('El CURP no es válido. Debe tener 18 caracteres en formato oficial.');
    }
    // Idiomas: no repetidos
    const idiomas = [];
    const idiomasSeleccionados = new Set();
    document.querySelectorAll('#idiomas-list .input-inline').forEach(div => {
      const select = div.querySelector('select');
      let idioma = select?.value;
      if (idioma === 'Otro') {
        const inputOtro = div.querySelector('input[type="text"]');
        idioma = inputOtro?.value.trim();
      }
      const pct = div.querySelector('input[type="number"]')?.value;
      if (idioma && pct) {
        if (idiomasSeleccionados.has(idioma)) {
          errores.push('No puedes repetir idiomas.');
        }
        idiomasSeleccionados.add(idioma);
        idiomas.push({ idioma, porcentaje: pct });
      }
    });
    // Paquetes: no repetidos
    const paquetes = [];
    const paquetesSeleccionados = new Set();
    document.querySelectorAll('#paquetes-list .input-inline').forEach(div => {
      const select = div.querySelector('select');
      let paquete = select?.value;
      let otro = '';
      if (paquete === 'Otro') {
        const inputOtro = div.querySelector('input[type="text"]');
        otro = inputOtro?.value.trim() || '';
        paquete = otro;
      }
      if (paquete) {
        if (paquetesSeleccionados.has(paquete)) {
          errores.push('No puedes repetir paquetes.');
        }
        paquetesSeleccionados.add(paquete);
        paquetes.push(paquete);
      }
    });
    if (errores.length) {
      msg.textContent = errores.join(' ');
      msg.classList.add('error');
      return;
    }
    // Importar la función de modelo (soporta import/export moderno en módulos)
    let crearUsuarioDesdeFormulario;
    try {
      ({ crearUsuarioDesdeFormulario } = await import('../models/Usuario.js'));
    } catch (err) {
      msg.textContent = 'Error al importar modelo Usuario: ' + err.message;
      msg.classList.add('error');
      return;
    }
    const data = crearUsuarioDesdeFormulario(form, user, idiomas, paquetes);

    // Guardar en Firestore
    try {
      await window.firebase.firestore().collection('usuarios').doc(user.uid).set(data);
      msg.textContent = '¡Datos guardados correctamente!';
      msg.classList.add('success');
      setTimeout(() => { window.location.href = 'survey.html'; }, 900);
    } catch (err) {
      msg.textContent = 'Error al guardar: ' + err.message;
      msg.classList.add('error');
    }
  };
};
