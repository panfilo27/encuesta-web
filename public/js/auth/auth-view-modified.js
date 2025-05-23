// public/js/auth/auth-view.js
// Lógica de autenticación y UI para auth.html

// Tab switching
const loginTab = document.getElementById('tab-login');
const registerTab = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

loginTab.querySelector('.switcher').onclick = () => {
  loginTab.classList.add('is-active');
  registerTab.classList.remove('is-active');
};
registerTab.querySelector('.switcher').onclick = () => {
  registerTab.classList.add('is-active');
  loginTab.classList.remove('is-active');
};

// Utilidad: animación de ojo
// Delegación de eventos: funciona aunque cambien los tabs
const formsContainer = document.querySelector('.forms');
if (formsContainer) {
  formsContainer.addEventListener('click', function(e) {
    const toggle = e.target.closest('.toggle-password');
    console.log('toggle-password click', {toggle, eTarget: e.target});
    if (!toggle) return;
    // Busca el icono dentro del toggle, puede ser <i> o <svg>
    let icon = toggle.querySelector('i,svg');
    const input = document.getElementById(toggle.dataset.target);
    console.log('icon:', icon, 'input:', input, 'input.type:', input ? input.type : null);
    if (!input || !icon) return;
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
  });
}


function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Inicializar componentes
      fn();
    });
  } else {
    fn();
  }
}

onReady(() => {
  // Tab switching (solo cambia clases, no reinicializa toggles)
  loginTab.querySelector('.switcher').onclick = () => {
    loginTab.classList.add('is-active');
    registerTab.classList.remove('is-active');
  };
  registerTab.querySelector('.switcher').onclick = () => {
    registerTab.classList.add('is-active');
    loginTab.classList.remove('is-active');
  };

  // Configurar enlace de recuperación de contraseña
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Verificar que la función existe antes de llamarla
      if (window.passwordRecovery && window.passwordRecovery.mostrarModalRecuperacion) {
        window.passwordRecovery.mostrarModalRecuperacion(() => {
          // Callback opcional después de enviar el correo exitosamente
          console.log('Correo de recuperación enviado con éxito');
        });
      } else {
        console.error('La función de recuperación de contraseña no está disponible');
        alert('La función de recuperación de contraseña no está disponible en este momento');
      }
    });
  }

  // Inicializar Firebase
  if (window.initFirebase) window.initFirebase();
  
  // Verificar si hay sesión activa y redirigir según corresponda
  verificarSesionYRedirigir();
});

// Inicializar Firebase
if (window.initFirebase) window.initFirebase();
const auth = window.firebase.auth();
const db = window.firebase.firestore();

// Función para mostrar/ocultar el loader local en un formulario
function toggleFormLoader(form, show) {
  const loader = form.querySelector('.form-loader');
  const fieldset = form.querySelector('fieldset');
  const submitBtn = form.querySelector('button[type="submit"]');
  if (show) {
    if (fieldset) fieldset.style.display = 'none';
    if (submitBtn) submitBtn.style.display = 'none';
    if (loader) loader.style.display = 'flex';
  } else {
    if (fieldset) fieldset.style.display = '';
    if (submitBtn) submitBtn.style.display = '';
    if (loader) loader.style.display = 'none';
  }
}

// Función para mostrar/ocultar el overlay global (mantener por compatibilidad)
function toggleLoadingOverlay(show) {
  const overlay = document.getElementById('auth-loading-overlay');
  if (overlay) {
    if (show) {
      overlay.classList.add('active');
    } else {
      overlay.classList.remove('active');
    }
  }
}

// Función para verificar si el usuario ya completó una encuesta y redirigir según corresponda
function verificarSesionYRedirigir() {
  console.log('[Auth] Verificando sesión...');
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // Usuario está autenticado
      // Verificar si intentamos redirigir por #/verify-email
      const hash = window.location.hash;
      if (hash && hash.startsWith('#/verify-email')) {
        // No redirigir automáticamente, dejar que se maneje la verificación de email primero
        console.log('[Auth] Se detectó un intento de verificación de email, no redirigiendo');
        return;
      }
      
      // Verificar si el correo electrónico necesita verificación
      if (user.emailVerified === false && window.location.pathname.includes('auth.html')) {
        // Mostrar modal de verificación de correo si es necesario
        console.log('[Auth] Correo no verificado, mostrando modal de verificación');
        showEmailVerificationReminder(user);
        // No redirigir, dejar que el usuario interactúe con el modal primero
        return;
      }
      
      // Solo realizar redirección si estamos en la página de autenticación
      if (window.location.pathname.includes('auth.html')) {
        console.log('[Auth] Usuario autenticado, verificando rol y estado de encuesta...');
        // Verificar rol del usuario y redirigir según corresponda
        redirigirSegunRol(user);
      }
    } else {
      // Usuario no autenticado
      // Si estamos en una página protegida, redirigir a login
      if (!window.location.pathname.includes('auth.html') && !window.location.pathname.includes('index.html')) {
        console.log('[Auth] Usuario no autenticado, redirigiendo a login');
        window.location.href = 'auth.html';
      }
    }
  });
}

// Función para mostrar diálogo de error
function mostrarDialogoError(mensaje) {
  // Verificar si ya existe un diálogo anterior y eliminarlo
  const existingDialog = document.querySelector('.custom-error-dialog');
  if (existingDialog) {
    existingDialog.remove();
  }
  
  // Crear elementos del diálogo
  const dialogOverlay = document.createElement('div');
  dialogOverlay.className = 'custom-error-dialog-overlay';
  
  const dialogBox = document.createElement('div');
  dialogBox.className = 'custom-error-dialog';
  
  const dialogHeader = document.createElement('div');
  dialogHeader.className = 'dialog-header';
  
  const dialogTitle = document.createElement('h3');
  dialogTitle.textContent = 'Error';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'dialog-close-btn';
  closeButton.innerHTML = '&times;';
  closeButton.title = 'Cerrar';
  
  dialogHeader.appendChild(dialogTitle);
  dialogHeader.appendChild(closeButton);
  
  const dialogContent = document.createElement('div');
  dialogContent.className = 'dialog-content';
  
  const errorIcon = document.createElement('div');
  errorIcon.className = 'error-icon';
  errorIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
  
  const errorMessage = document.createElement('p');
  errorMessage.className = 'error-message';
  errorMessage.textContent = mensaje;
  
  dialogContent.appendChild(errorIcon);
  dialogContent.appendChild(errorMessage);
  
  const dialogFooter = document.createElement('div');
  dialogFooter.className = 'dialog-footer';
  
  const okButton = document.createElement('button');
  okButton.className = 'dialog-btn dialog-btn-primary';
  okButton.textContent = 'Aceptar';
  
  dialogFooter.appendChild(okButton);
  
  // Ensamblar diálogo
  dialogBox.appendChild(dialogHeader);
  dialogBox.appendChild(dialogContent);
  dialogBox.appendChild(dialogFooter);
  
  dialogOverlay.appendChild(dialogBox);
  
  // Añadir al DOM
  document.body.appendChild(dialogOverlay);
  
  // Añadir estilos si no existen
  if (!document.getElementById('error-dialog-styles')) {
    const style = document.createElement('style');
    style.id = 'error-dialog-styles';
    style.textContent = `
      .custom-error-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      
      .custom-error-dialog {
        background-color: white;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        animation: dialog-appear 0.3s ease-out;
      }
      
      @keyframes dialog-appear {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background-color: #f44336;
        color: white;
      }
      
      .dialog-header h3 {
        margin: 0;
        font-size: 18px;
      }
      
      .dialog-close-btn {
        background: none;
        border: none;
        font-size: 22px;
        color: white;
        cursor: pointer;
      }
      
      .dialog-content {
        padding: 20px;
        display: flex;
        align-items: center;
      }
      
      .error-icon {
        color: #f44336;
        font-size: 24px;
        margin-right: 15px;
      }
      
      .error-message {
        margin: 0;
        font-size: 16px;
        color: #333;
        flex: 1;
      }
      
      .dialog-footer {
        padding: 15px 20px;
        text-align: right;
        border-top: 1px solid #eee;
      }
      
      .dialog-btn {
        padding: 8px 16px;
        border-radius: 4px;
        border: none;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .dialog-btn-primary {
        background-color: #f44336;
        color: white;
      }
      
      .dialog-btn-primary:hover {
        background-color: #e53935;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Configurar eventos
  closeButton.addEventListener('click', () => {
    dialogOverlay.remove();
  });
  
  okButton.addEventListener('click', () => {
    dialogOverlay.remove();
  });
  
  // Cerrar al hacer clic fuera
  dialogOverlay.addEventListener('click', (e) => {
    if (e.target === dialogOverlay) {
      dialogOverlay.remove();
    }
  });
}

// Login
loginForm.onsubmit = async e => {
  e.preventDefault();
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const message = document.getElementById("login-message");
  message.textContent = "";
  message.classList.remove("error", "success");
  
  // Validaciones extra
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  let valid = true;
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    message.classList.add("error");
    message.textContent = "Por favor ingresa un correo válido.";
    valid = false;
  } else if (password.length < 6) {
    message.classList.add("error");
    message.textContent = "La contraseña debe tener al menos 6 caracteres.";
    valid = false;
  }
  if (!valid) return;

  // Mostrar solo loader local (no overlay global)
  toggleFormLoader(loginForm, true);
  
  try {
    await auth.signInWithEmailAndPassword(email, password);
    message.classList.add("success");
    message.textContent = "¡Inicio de sesión exitoso!";
    
    // Verificar el rol del usuario y redirigir según corresponda
    setTimeout(async () => {
      try {
        const user = firebase.auth().currentUser;
        console.log('[Auth DEBUG] Verificando rol de usuario:', user.email);
        
        try {
          const userDoc = await db.collection('usuarios').doc(user.uid).get();
          
          // Mostrar información de debug
          if (userDoc.exists) {
            console.log('[Auth DEBUG] Datos del usuario:', userDoc.data());
          } else {
            console.log('[Auth DEBUG] No se encontró el documento del usuario');
          }
          
          // Verificar si es administrador
          if (userDoc.exists && userDoc.data().rol === 'admin') {
            console.log('[Auth] Rol de usuario: admin - Redirigiendo al panel de administración');
            localStorage.setItem('user_role', 'admin');
            // Retrasar la redirección un poco para poder ver los logs
            setTimeout(() => { window.location.href = 'admin.html'; }, 500);
            return;
          }
          
          // Verificar si es jefe de departamento - DENTRO del mismo bloque try que el admin
          if (userDoc.exists && userDoc.data().rol === 'jefeDepartamento') {
            console.log('[Auth] Rol de usuario: jefeDepartamento - Redirigiendo al panel de jefe de departamento');
            localStorage.setItem('user_role', 'jefeDepartamento');
            // Retrasar la redirección un poco para poder ver los logs
            setTimeout(() => { window.location.href = 'department-head.html'; }, 500);
            return;
          }
        } catch (e) {
          console.error('[Auth DEBUG] Error al verificar rol:', e);
        }
        
        // Verificar si el usuario está en medio de completar una encuesta
        const currentModule = localStorage.getItem('current_module');
        
        if (currentModule) {
          // Si está en medio de una encuesta, enviarlo al módulo en el que estaba
          console.log(`[Auth] Usuario estaba en el módulo ${currentModule}, redirigiendo...`);
          window.location.href = `modulo${currentModule}.html`;
          return;
        }
        
        // Si no está en medio de una encuesta, verificar si ya la completó
        if (userDoc.exists && userDoc.data().encuestaCompletada === true) {
          // Si ya completó una encuesta, redirigir al dashboard
          console.log('[Auth] Usuario ya completó encuesta, redirigiendo a dashboard');
          window.location.href = 'dashboard.html';
        } else {
          // Redirigir al dashboard independientemente de si ha completado la encuesta o no
          console.log('[Auth] Usuario no ha completado encuesta, redirigiendo a dashboard');
          // Ya no necesitamos establecer current_module
          window.location.href = 'dashboard.html';
        }
      } catch (error) {
        console.error('[Auth] Error al verificar estado de encuesta:', error);
        // En caso de error, redirigir al dashboard por defecto
        window.location.href = 'dashboard.html';
      }
    }, 800);
  } catch (err) {
    // Ocultar loader
    toggleFormLoader(loginForm, false);
    
    // Determinar mensaje de error adecuado
    let mensajeError = "Credenciales inválidas o usuario no existe.";
    if (err.code === 'auth/user-not-found') {
      mensajeError = "No existe ninguna cuenta con este correo electrónico.";
    } else if (err.code === 'auth/wrong-password') {
      mensajeError = "La contraseña es incorrecta.";
    } else if (err.code === 'auth/too-many-requests') {
      mensajeError = "Demasiados intentos fallidos. Intente de nuevo más tarde.";
    } else if (err.code === 'auth/network-request-failed') {
      mensajeError = "Error de conexión. Por favor verifica tu conexión a internet.";
    }
    
    // Mostrar diálogo de error en lugar de mensaje inline
    mostrarDialogoError(mensajeError);
  }
};

// Registro
registerForm.onsubmit = async e => {
  e.preventDefault();
  const emailInput = document.getElementById("signup-email");
  const passwordInput = document.getElementById("signup-password");
  const confirmInput = document.getElementById("signup-password-confirm");
  const message = document.getElementById("register-message");
  message.textContent = "";
  message.classList.remove("error", "success");

  // Validaciones extra
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirm = confirmInput.value;
  let valid = true;
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    message.classList.add("error");
    message.textContent = "Por favor ingresa un correo válido.";
    valid = false;
  } else if (password.length < 6) {
    message.classList.add("error");
    message.textContent = "La contraseña debe tener al menos 6 caracteres.";
    valid = false;
  } else if (password !== confirm) {
    message.classList.add("error");
    message.textContent = "Las contraseñas no coinciden.";
    valid = false;
  }
  if (!valid) {
    return;
  }

  // Mostrar solo loader local (no overlay global)
  toggleFormLoader(registerForm, true);
  
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    message.classList.add("success");
    message.textContent = "¡Registro exitoso! Redirigiendo...";
    
    // Para usuarios nuevos, redirigir al dashboard
    setTimeout(() => window.location.href = "dashboard.html", 800);
    registerForm.reset();
  } catch (err) {
    // Ocultar loader
    toggleFormLoader(registerForm, false);
    
    // Determinar mensaje de error adecuado
    let mensajeError = "Error al crear la cuenta.";
    if (err.code === 'auth/email-already-in-use') {
      mensajeError = "Este correo electrónico ya está registrado. Intenta iniciar sesión.";
    } else if (err.code === 'auth/invalid-email') {
      mensajeError = "El formato del correo electrónico no es válido.";
    } else if (err.code === 'auth/weak-password') {
      mensajeError = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
    } else if (err.code === 'auth/network-request-failed') {
      mensajeError = "Error de conexión. Por favor verifica tu conexión a internet.";
    } else if (err.message) {
      mensajeError = `Error: ${err.message}`;
    }
    
    // Mostrar diálogo de error en lugar de mensaje inline
    mostrarDialogoError(mensajeError);
  }
};
