/* =====================================================
   Módulo 1: Lógica de Catálogos (Carreras, Idiomas, Paquetes)
   ===================================================== */

console.log('[Modulo 1 Catalogos] JS cargado');

// Ahora obtendremos las carreras desde Firebase en lugar de usar un arreglo estático

const IDIOMAS_CATALOGO  = ['Inglés','Francés','Alemán','Italiano','Portugués',
                  'Chino','Japonés','Ruso','Árabe','Otro'];

const PAQUETES_CATALOGO = ['Microsoft Office','AutoCAD','MATLAB','SolidWorks',
                  'Visual Studio','Eclipse','Photoshop','Illustrator',
                  'CorelDRAW','SPSS','Otro'];

function inicializarCatalogosModulo1(selCarrera, listIdiomas, addIdiomaBtn, listPaquetes, addPaqueteBtn, datosModulo1) {
  console.log('[Modulo 1 Catalogos] inicializarCatalogosModulo1 llamada');

  let countIdioma = 0;
  let countPaquete = 0;
  let idiomasDisponibles = [...IDIOMAS_CATALOGO];
  let paquetesDisponibles = [...PAQUETES_CATALOGO];

  /* Inicializar lista de carreras desde Firebase */
  async function cargarCarrerasDesdeFirebase() {
    try {
      // Verificar que el select existe
      if (!selCarrera) {
        console.error('[Modulo 1 Catalogos] Error: El elemento select no existe');
        return;
      }
      
      // Limpiar opciones existentes
      // Primero verificar si hay opciones
      while (selCarrera.options.length > 0) {
        // Si la primera opción es un placeholder, conservarla
        if (selCarrera.options.length === 1 && 
            selCarrera.options[0] && 
            selCarrera.options[0].value === '') {
          break;
        }
        selCarrera.remove(selCarrera.options.length - 1);
      }
      
      // Obtener referencia a la colección de carreras
      const carrerasRef = firebase.firestore().collection('carreras');
      const snapshot = await carrerasRef.get();
      
      if (snapshot.empty) {
        console.log('[Modulo 1 Catalogos] No se encontraron carreras en Firebase');
        // Agregar una opción por defecto si no hay carreras
        const defaultOption = document.createElement('option');
        defaultOption.value = defaultOption.textContent = 'Otra carrera';
        selCarrera.appendChild(defaultOption);
        return;
      }
      
      // Agregar cada carrera como una opción
      snapshot.forEach(doc => {
        const carrera = doc.data();
        const option = document.createElement('option');
        option.value = doc.id; // Guardamos el ID como valor
        option.textContent = carrera.nombre; // Mostramos el nombre
        selCarrera.appendChild(option);
      });
      
      console.log(`[Modulo 1 Catalogos] ${snapshot.size} carreras cargadas desde Firebase`);
    } catch (error) {
      console.error('[Modulo 1 Catalogos] Error al cargar carreras desde Firebase:', error);
      // En caso de error, cargar opciones estáticas de respaldo
      const defaultCarreras = [
        'Licenciatura en Administración',
        'Ingeniería Bioquímica',
        'Ingeniería Eléctrica',
        'Ingeniería Electrónica',
        'Ingeniería Industrial',
        'Ingeniería Mecánica',
        'Ingeniería Mecatrónica',
        'Ingeniería en Sistemas Computacionales',
        'Ingeniería Química',
        'Ingeniería en Energías Renovables',
        'Ingeniería en Gestión Empresarial'
      ];
      
      defaultCarreras.forEach(c => {
        const o = document.createElement('option');
        o.value = o.textContent = c;
        selCarrera.appendChild(o);
      });
    }
  }
  
  // Cargar carreras desde Firebase
  cargarCarrerasDesdeFirebase();
  console.log('[Modulo 1 Catalogos] Iniciando carga de carreras desde Firebase');

  /* Funciones para idiomas */
  function actualizarOptionsIdiomas() {
    const usados = [...listIdiomas.querySelectorAll('select')].map(s => s.value);
    listIdiomas.querySelectorAll('select').forEach(sel => {
      sel.querySelectorAll('option').forEach(o => {
        o.disabled = (o.value !== 'Otro' && usados.includes(o.value) && o.value !== sel.value);
      });
    });
    idiomasDisponibles = IDIOMAS_CATALOGO.filter(id => id === 'Otro' || !usados.includes(id));
    addIdiomaBtn.disabled = idiomasDisponibles.filter(i => i !== 'Otro').length === 0;
  }

  function addIdioma(nombre='', pct='') {
    if (!nombre) {
      const libre = idiomasDisponibles.find(l => l !== 'Otro');
      nombre = libre || 'Otro';
    }
    countIdioma++;
    const div = document.createElement('div');
    div.className = 'input-inline idioma-item';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '10px';
    div.style.marginBottom = '12px';
    div.style.flexWrap = 'nowrap';

    const sel = document.createElement('select'); 
    sel.name = `idioma_${countIdioma}`;
    sel.style.flex = '1';
    sel.style.minWidth = '120px';
    sel.style.maxWidth = '160px';
    IDIOMAS_CATALOGO.forEach(id => {
      const o = document.createElement('option');
      o.value = o.textContent = id;
      sel.appendChild(o);
    });
    sel.value = nombre;

    const inputOtro = document.createElement('input');
    inputOtro.type = 'text'; 
    inputOtro.name = `idioma_otro_${countIdioma}`; 
    inputOtro.placeholder = 'Especificar idioma';
    inputOtro.style.display = sel.value === 'Otro' ? 'inline-block' : 'none'; 
    inputOtro.required = sel.value === 'Otro';
    inputOtro.style.flex = '1';

    sel.onchange = () => {
      actualizarOptionsIdiomas();
      inputOtro.style.display = sel.value === 'Otro' ? 'inline-block' : 'none';
      inputOtro.required = sel.value === 'Otro';
    };

    const pctWrapper = document.createElement('div');
    pctWrapper.style.display = 'flex';
    pctWrapper.style.alignItems = 'center';
    pctWrapper.style.whiteSpace = 'nowrap';
    
    const pctLabel = document.createElement('span');
    pctLabel.textContent = '%:';
    pctLabel.style.marginRight = '5px';
    
    const pctInput = document.createElement('input');
    pctInput.type = 'number'; 
    pctInput.min = 1; 
    pctInput.max = 100;
    pctInput.name = `idioma_pct_${countIdioma}`; 
    pctInput.placeholder = '1-100'; 
    pctInput.style.width = '60px';
    if(pct) pctInput.value = pct;
    
    pctWrapper.appendChild(pctLabel);
    pctWrapper.appendChild(pctInput);

    const rm = document.createElement('button');
    rm.type = 'button'; 
    rm.className = 'remove-btn'; 
    rm.textContent = 'Quitar';
    rm.style.marginLeft = 'auto';
    rm.onclick = () => {
      div.remove();
      actualizarOptionsIdiomas();
    };

    div.appendChild(sel);
    div.appendChild(inputOtro);
    div.appendChild(pctWrapper);
    div.appendChild(rm);
    
    listIdiomas.appendChild(div);
    actualizarOptionsIdiomas();
  }

  /* Funciones para paquetes */
  function actualizarOptionsPaquetes() {
    const usados = [...listPaquetes.querySelectorAll('select')].map(s => s.value);
    listPaquetes.querySelectorAll('select').forEach(sel => {
      sel.querySelectorAll('option').forEach(o => {
        o.disabled = (o.value !== 'Otro' && usados.includes(o.value) && o.value !== sel.value);
      });
    });
    paquetesDisponibles = PAQUETES_CATALOGO.filter(p => p === 'Otro' || !usados.includes(p));
    addPaqueteBtn.disabled = paquetesDisponibles.filter(p => p !== 'Otro').length === 0;
  }

  function addPaquete(nombre='') {
    if (!nombre) {
      const libre = paquetesDisponibles.find(l => l !== 'Otro'); 
      nombre = libre || 'Otro';
    }
    countPaquete++;
    const div = document.createElement('div');
    div.className = 'input-inline paquete-item';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '10px';
    div.style.marginBottom = '12px';
    div.style.flexWrap = 'nowrap';

    const sel = document.createElement('select');
    sel.name = `paquete_${countPaquete}`;
    sel.style.flex = '1';
    sel.style.maxWidth = '250px';
    PAQUETES_CATALOGO.forEach(p => {
      const o = document.createElement('option');
      o.value = o.textContent = p;
      sel.appendChild(o);
    });
    sel.value = nombre;

    const inputOtro = document.createElement('input');
    inputOtro.type = 'text';
    inputOtro.name = `paquete_otro_${countPaquete}`;
    inputOtro.placeholder = 'Especificar paquete';
    inputOtro.style.display = sel.value === 'Otro' ? 'inline-block' : 'none';
    inputOtro.style.flex = '1';

    sel.onchange = () => {
      actualizarOptionsPaquetes();
      inputOtro.style.display = sel.value === 'Otro' ? 'inline-block' : 'none';
    };

    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'remove-btn';
    rm.textContent = 'Quitar';
    rm.style.marginLeft = 'auto';
    rm.onclick = () => {
      div.remove();
      actualizarOptionsPaquetes();
    };

    div.appendChild(sel);
    div.appendChild(inputOtro);
    div.appendChild(rm);
    listPaquetes.appendChild(div);
    actualizarOptionsPaquetes();
  }

  // Configurar los botones de agregar idioma y paquete
  addIdiomaBtn.onclick = () => addIdioma();
  addPaqueteBtn.onclick = () => addPaquete();

  let datosAplicadosExitosamente = false;
  if (datosModulo1) {
      // Limpiar idiomas y paquetes existentes en el DOM por si acaso
      listIdiomas.innerHTML = ''; 
      listPaquetes.innerHTML = '';
      countIdioma = 0; // Resetear contadores antes de repoblar
      countPaquete = 0;

      // Establecer la carrera seleccionada si existe en los datos
      if (datosModulo1.carrera) {
        // Intentar encontrar la opción por ID primero (nuevo formato)
        let carreraEncontrada = false;
        
        // Buscar la carrera por ID o por nombre
        for (let i = 0; i < selCarrera.options.length; i++) {
          const option = selCarrera.options[i];
          if (option.value === datosModulo1.carreraId || option.textContent === datosModulo1.carrera) {
            selCarrera.selectedIndex = i;
            carreraEncontrada = true;
            break;
          }
        }
        
        // Si no se encuentra, esperar a que se carguen las carreras
        if (!carreraEncontrada) {
          setTimeout(() => {
            for (let i = 0; i < selCarrera.options.length; i++) {
              const option = selCarrera.options[i];
              if (option.value === datosModulo1.carreraId || option.textContent === datosModulo1.carrera) {
                selCarrera.selectedIndex = i;
                break;
              }
            }
          }, 1000); // Esperar 1 segundo para dar tiempo a la carga
        }
      }
      
      if (datosModulo1.idiomas && Array.isArray(datosModulo1.idiomas)) {
        datosModulo1.idiomas.forEach(item => {
          addIdioma(item.idioma, item.porcentaje);
          if (item.idioma === 'Otro' && item.otro) {
            const lastItem = listIdiomas.querySelector('.idioma-item:last-child');
            if (lastItem) { // Verificar que lastItem exista
              const otroInput = lastItem.querySelector('input[name^="idioma_otro_"]');
              if (otroInput) otroInput.value = item.otro;
            }
          }
        });
      }
      
      if (datosModulo1.paquetes && Array.isArray(datosModulo1.paquetes)) {
        datosModulo1.paquetes.forEach(item => {
          addPaquete(item.paquete);
          if (item.paquete === 'Otro' && item.otro) {
            const lastItem = listPaquetes.querySelector('.paquete-item:last-child');
            if (lastItem) { // Verificar que lastItem exista
              const otroInput = lastItem.querySelector('input[name^="paquete_otro_"]');
              if (otroInput) otroInput.value = item.otro;
            }
          }
        });
      }
      datosAplicadosExitosamente = true; // Asumimos éxito si llegamos aquí
  }
  
  // Si no hay datos cargados O si los datos cargados no tenían idiomas/paquetes
  if (!datosAplicadosExitosamente || (datosModulo1 && (!datosModulo1.idiomas || datosModulo1.idiomas.length === 0))) {
    if (listIdiomas.children.length === 0) addIdioma(); // Agregar un idioma por defecto si no hay ninguno
  }
  if (!datosAplicadosExitosamente || (datosModulo1 && (!datosModulo1.paquetes || datosModulo1.paquetes.length === 0))) {
    if (listPaquetes.children.length === 0) addPaquete(); // Agregar un paquete por defecto si no hay ninguno
  }
  
  console.log('[Modulo 1 Catalogos] Catálogos, idiomas y paquetes inicializados y listeners configurados.');
}
