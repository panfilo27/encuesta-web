/**
 * Funciones para manejar los aspectos personalizados en el módulo 6
 */

/**
 * Renderiza los aspectos personalizados en la tabla principal
 */
function renderizarAspectosPersonalizados() {
  console.log('[Módulo 6] Renderizando aspectos personalizados:', aspectosPersonalizados);
  
  // Eliminar aspectos personalizados existentes de la tabla
  document.querySelectorAll('tr.aspecto-personalizado-row').forEach(row => row.remove());
  
  // Si no hay aspectos personalizados, salir
  if (!aspectosPersonalizados || aspectosPersonalizados.length === 0) {
    return;
  }
  
  // Obtener la tabla para insertar los aspectos
  const tablaAspectos = document.querySelector('.valoracion-table tbody');
  if (!tablaAspectos) {
    console.error('[Módulo 6] No se pudo encontrar la tabla de aspectos');
    return;
  }
  
  // Determinar el último número de aspecto usado
  let ultimoNumeroAspecto = 9; // Empezamos desde 9 porque ya hay 9 aspectos predefinidos
  
  // Recorrer todos los aspectos personalizados y añadirlos a la tabla principal
  aspectosPersonalizados.forEach((aspecto, index) => {
    const tr = document.createElement('tr');
    tr.dataset.index = index;
    tr.className = 'aspecto-personalizado-row'; // Clase para identificarlos
    
    // Determinar el número de este aspecto
    ultimoNumeroAspecto++;
    
    // Crear celda para el nombre del aspecto
    const tdNombre = document.createElement('td');
    tdNombre.innerHTML = `${ultimoNumeroAspecto}. ${aspecto.nombre} <button type="button" class="delete-aspecto-btn" title="Eliminar este aspecto"><i class="fas fa-times"></i></button>`;
    tr.appendChild(tdNombre);
    
    // Crear celda para la valoración
    const tdValoracion = document.createElement('td');
    const valoracionDiv = document.createElement('div');
    valoracionDiv.className = 'radio-buttons-row';
    
    // Crear los 5 botones de radio para la valoración
    for (let i = 1; i <= 5; i++) {
      const radioButtonCell = document.createElement('div');
      radioButtonCell.className = 'radio-button-cell';
      
      const input = document.createElement('input');
      input.type = 'radio';
      input.id = `aspecto_custom_${index}_${i}`;
      input.name = `aspecto_custom_${index}`;
      input.value = i.toString();
      input.checked = aspecto.valoracion === i.toString();
      
      // Agregar evento de cambio
      input.addEventListener('change', function() {
        if (this.checked) {
          aspectosPersonalizados[index].valoracion = this.value;
          guardarDatosModulo6();
          actualizarContadorPreguntas();
        }
      });
      
      const label = document.createElement('label');
      label.htmlFor = `aspecto_custom_${index}_${i}`;
      label.textContent = i.toString();
      
      radioButtonCell.appendChild(input);
      radioButtonCell.appendChild(label);
      valoracionDiv.appendChild(radioButtonCell);
    }
    
    tdValoracion.appendChild(valoracionDiv);
    tr.appendChild(tdValoracion);
    
    // Añadir la fila a la tabla
    tablaAspectos.appendChild(tr);
    
    // Configurar el botón de eliminar
    const btnEliminar = tr.querySelector('.delete-aspecto-btn');
    if (btnEliminar) {
      btnEliminar.addEventListener('click', function() {
        eliminarAspectoPersonalizado(index);
      });
    }
  });
  
  // Actualizar el contador de preguntas
  actualizarContadorPreguntas();
}

/**
 * Muestra un mensaje de retroalimentación al usuario
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de mensaje ('error' o 'success')
 * @param {number} duracion - Duración en milisegundos (0 para no ocultar automáticamente)
 */
function mostrarFeedback(mensaje, tipo = 'error', duracion = 3000) {
  const feedbackElement = document.getElementById('aspecto-feedback');
  if (!feedbackElement) return;
  
  // Configurar el mensaje y estilo
  feedbackElement.textContent = mensaje;
  feedbackElement.className = 'feedback-message ' + tipo;
  feedbackElement.style.display = 'block';
  
  // Mostrar con animación
  feedbackElement.style.opacity = '0';
  setTimeout(() => {
    feedbackElement.style.opacity = '1';
  }, 10);
  
  // Si hay un temporizador anterior, limpiarlo
  if (feedbackElement._timeoutId) {
    clearTimeout(feedbackElement._timeoutId);
  }
  
  // Ocultar después de la duración especificada (si no es 0)
  if (duracion > 0) {
    feedbackElement._timeoutId = setTimeout(() => {
      feedbackElement.style.opacity = '0';
      setTimeout(() => {
        feedbackElement.style.display = 'none';
      }, 300);
    }, duracion);
  }
}

/**
 * Agrega un nuevo aspecto personalizado
 */
function agregarAspectoPersonalizado() {
  const nombreAspecto = nuevoAspectoInput.value.trim();
  
  if (!nombreAspecto) {
    mostrarFeedback('Por favor, ingrese un nombre para el aspecto.');
    nuevoAspectoInput.focus();
    return;
  }
  
  // Comprobar si ya existe un aspecto predefinido con el mismo nombre (aspectos estáticos de la tabla)
  const aspectosPredefinidos = Array.from(document.querySelectorAll('.valoracion-table tbody tr:not(.aspecto-personalizado-row) td:first-child'))
    .map(td => td.textContent.replace(/^\d+\.\s+/, '').trim().toLowerCase());
  
  if (aspectosPredefinidos.includes(nombreAspecto.toLowerCase())) {
    mostrarFeedback(`"${nombreAspecto}" ya existe como aspecto predefinido.`);
    nuevoAspectoInput.focus();
    return;
  }
  
  // Comprobar si ya existe un aspecto personalizado con el mismo nombre
  const existeAspecto = aspectosPersonalizados.some(aspecto => 
    aspecto.nombre.toLowerCase() === nombreAspecto.toLowerCase()
  );
  
  if (existeAspecto) {
    mostrarFeedback(`Ya existe un aspecto personalizado con el nombre "${nombreAspecto}".`);
    nuevoAspectoInput.focus();
    return;
  }
  
  // Añadir el nuevo aspecto a la lista
  aspectosPersonalizados.push({
    nombre: nombreAspecto,
    valoracion: '', // Sin valoración inicial
    esPersonalizado: true
  });
  
  // Mostrar mensaje de éxito
  mostrarFeedback(`Aspecto "${nombreAspecto}" agregado correctamente.`, 'success');
  
  // Limpiar el campo de entrada y enfocar para agregar otro rápidamente
  nuevoAspectoInput.value = '';
  nuevoAspectoInput.focus();
  
  // Renderizar la lista actualizada con los aspectos en la tabla principal
  renderizarAspectosPersonalizados();
  
  // Guardar los datos actualizados
  guardarDatosModulo6();
  
  // Actualizar el contador de preguntas totales
  totalPreguntas++;
  actualizarContadorPreguntas();
  
  console.log('[Módulo 6] Aspecto personalizado agregado:', nombreAspecto);
}

/**
 * Elimina un aspecto personalizado por su índice
 * @param {number} index - Índice del aspecto a eliminar
 */
function eliminarAspectoPersonalizado(index) {
  if (index >= 0 && index < aspectosPersonalizados.length) {
    const nombreAspecto = aspectosPersonalizados[index].nombre;
    
    // Eliminar el aspecto del array
    aspectosPersonalizados.splice(index, 1);
    
    // Renderizar la tabla actualizada para reflejar la eliminación y renumerar los aspectos
    renderizarAspectosPersonalizados();
    
    // Guardar los datos actualizados
    guardarDatosModulo6();
    
    // Actualizar el contador de preguntas totales
    totalPreguntas--;
    actualizarContadorPreguntas();
    
    // Mostrar un mensaje de confirmación temporal
    const mensaje = document.createElement('div');
    mensaje.className = 'mensaje-temporal';
    mensaje.textContent = `Aspecto "${nombreAspecto}" eliminado`;
    mensaje.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background-color: #27ae60; color: white; padding: 10px 15px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 9999; animation: fadeIn 0.3s, fadeOut 0.3s 2s forwards;';
    
    // Añadir estilos para la animación
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(20px); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(mensaje);
    
    // Eliminar el mensaje después de 2.5 segundos
    setTimeout(() => {
      document.body.removeChild(mensaje);
    }, 2500);
    
    console.log('[Módulo 6] Aspecto personalizado eliminado:', nombreAspecto);
  }
}

/**
 * Configura los eventos para los aspectos personalizados
 */
function configurarEventosAspectosPersonalizados() {
  if (agregarAspectoBtn) {
    agregarAspectoBtn.addEventListener('click', agregarAspectoPersonalizado);
  }
  
  // Tecla Enter en el campo de texto también agrega el aspecto
  if (nuevoAspectoInput) {
    nuevoAspectoInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault(); // Evitar el envío del formulario
        agregarAspectoPersonalizado();
      }
    });
  }
}
