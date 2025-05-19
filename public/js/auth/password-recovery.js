/**
 * password-recovery.js
 * Funcionalidad para recuperación de contraseñas mediante Firebase Auth
 */

// No inicializar auth ahora, lo haremos al momento de usar las funciones
// para evitar problemas de orden de carga

/**
 * Envía un correo de recuperación de contraseña al email especificado
 * @param {string} email - Correo electrónico del usuario
 * @returns {Promise} Promise que se resolverá cuando el correo sea enviado
 */
async function enviarCorreoRecuperacion(email) {
  // Validar que el email sea válido
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('Por favor ingresa un correo electrónico válido.');
  }

  try {
    // Verificar que firebase esté inicializado
    if (!window.firebase || !window.firebase.auth) {
      throw new Error('Firebase no está inicializado correctamente');
    }
    
    // Usar window.firebase.auth() directamente para evitar conflictos
    await window.firebase.auth().sendPasswordResetEmail(email);
    
    return {
      success: true,
      message: 'Se ha enviado un correo de recuperación. Por favor revisa tu bandeja de entrada.'
    };
  } catch (error) {
    console.error('Error al enviar correo de recuperación:', error);
    
    // Mensajes de error específicos según el código de error de Firebase
    let mensajeError = 'No se pudo enviar el correo de recuperación.';
    
    if (error.code === 'auth/user-not-found') {
      mensajeError = 'No existe ninguna cuenta asociada a este correo electrónico.';
    } else if (error.code === 'auth/invalid-email') {
      mensajeError = 'El formato del correo electrónico no es válido.';
    } else if (error.code === 'auth/too-many-requests') {
      mensajeError = 'Demasiadas solicitudes. Intenta nuevamente más tarde.';
    } else if (error.code === 'auth/network-request-failed') {
      mensajeError = 'Error de conexión. Verifica tu conexión a internet.';
    }
    
    throw new Error(mensajeError);
  }
}

/**
 * Muestra el modal de recuperación de contraseña
 * @param {Function} callbackExito - Función a ejecutar después de enviar el correo exitosamente
 */
function mostrarModalRecuperacion(callbackExito) {
  // Verificar si ya existe el modal para no duplicarlo
  let modalExistente = document.getElementById('modal-recuperacion');
  if (modalExistente) {
    modalExistente.remove();
  }
  
  // Crear el modal de recuperación
  const modalHTML = `
    <div id="modal-recuperacion" class="modal-recuperacion">
      <div class="modal-contenido">
        <div class="modal-header">
          <h3>Recuperar Contraseña</h3>
          <button type="button" class="cerrar-modal">&times;</button>
        </div>
        <div class="modal-body">
          <p>Ingresa tu correo electrónico para recibir un link de recuperación de contraseña.</p>
          <div class="form-group">
            <label for="email-recuperacion">Correo electrónico:</label>
            <input type="email" id="email-recuperacion" placeholder="Tu correo electrónico" required>
          </div>
          <div id="mensaje-recuperacion" class="mensaje-modal"></div>
        </div>
        <div class="modal-footer">
          <button type="button" id="btn-cancelar-recuperacion" class="btn-secundario">Cancelar</button>
          <button type="button" id="btn-enviar-recuperacion" class="btn-primario">Enviar correo</button>
        </div>
        <div id="loader-recuperacion" class="form-loader" style="display: none;">
          <div class="loader-spinner"></div>
          <p>Enviando correo...</p>
        </div>
      </div>
    </div>
  `;
  
  // Agregar el modal al DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Mostrar el modal
  setTimeout(() => {
    const modal = document.getElementById('modal-recuperacion');
    modal.style.display = 'flex';
    document.getElementById('email-recuperacion').focus();
  }, 100);
  
  // Configurar eventos
  const modal = document.getElementById('modal-recuperacion');
  
  // Cerrar modal con botón X o botón cancelar
  document.querySelector('.cerrar-modal').addEventListener('click', () => {
    cerrarModalRecuperacion();
  });
  
  document.getElementById('btn-cancelar-recuperacion').addEventListener('click', () => {
    cerrarModalRecuperacion();
  });
  
  // Cerrar modal al hacer click fuera del contenido
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      cerrarModalRecuperacion();
    }
  });
  
  // Enviar correo al hacer click en el botón
  document.getElementById('btn-enviar-recuperacion').addEventListener('click', async () => {
    procesarSolicitudRecuperacion(callbackExito);
  });
  
  // Enviar correo al presionar Enter en el campo de email
  document.getElementById('email-recuperacion').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      procesarSolicitudRecuperacion(callbackExito);
    }
  });
}

/**
 * Cierra el modal de recuperación de contraseña
 */
function cerrarModalRecuperacion() {
  const modal = document.getElementById('modal-recuperacion');
  if (modal) {
    modal.classList.add('cerrando');
    setTimeout(() => {
      modal.remove();
    }, 300); // Tiempo para la animación de cierre
  }
}

/**
 * Procesa la solicitud de recuperación de contraseña
 * @param {Function} callbackExito - Función a ejecutar después de enviar el correo exitosamente
 */
async function procesarSolicitudRecuperacion(callbackExito) {
  const emailInput = document.getElementById('email-recuperacion');
  const mensajeEl = document.getElementById('mensaje-recuperacion');
  const loaderEl = document.getElementById('loader-recuperacion');
  const modalBody = document.querySelector('.modal-body');
  const modalFooter = document.querySelector('.modal-footer');
  
  // Limpiar mensajes previos
  mensajeEl.textContent = '';
  mensajeEl.classList.remove('error', 'success');
  
  const email = emailInput.value.trim();
  if (!email) {
    mensajeEl.textContent = 'Por favor ingresa tu correo electrónico.';
    mensajeEl.classList.add('error');
    return;
  }
  
  // Mostrar loader
  loaderEl.style.display = 'flex';
  modalBody.style.display = 'none';
  modalFooter.style.display = 'none';
  
  try {
    const resultado = await enviarCorreoRecuperacion(email);
    
    // Ocultar loader
    loaderEl.style.display = 'none';
    modalBody.style.display = 'block';
    
    // Mostrar mensaje de éxito
    mensajeEl.textContent = resultado.message;
    mensajeEl.classList.add('success');
    
    // Ocultar formulario y mostrar solo mensaje de éxito
    emailInput.style.display = 'none';
    document.querySelector('.form-group label').style.display = 'none';
    document.querySelector('.modal-body p').textContent = '¡Correo enviado con éxito!';
    
    // Cambiar el footer para tener solo botón de Cerrar
    modalFooter.innerHTML = '<button type="button" id="btn-cerrar-exito" class="btn-primario">Cerrar</button>';
    modalFooter.style.display = 'flex';
    
    // Configurar evento del nuevo botón
    document.getElementById('btn-cerrar-exito').addEventListener('click', () => {
      cerrarModalRecuperacion();
      // Ejecutar callback si existe
      if (typeof callbackExito === 'function') {
        callbackExito();
      }
    });
    
  } catch (error) {
    // Ocultar loader y mostrar formulario nuevamente
    loaderEl.style.display = 'none';
    modalBody.style.display = 'block';
    modalFooter.style.display = 'flex';
    
    // Mostrar mensaje de error
    mensajeEl.textContent = error.message;
    mensajeEl.classList.add('error');
  }
}

// Exportar funciones
window.passwordRecovery = {
  enviarCorreoRecuperacion,
  mostrarModalRecuperacion,
  cerrarModalRecuperacion
};
