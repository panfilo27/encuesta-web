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
  // Usar onAuthStateChanged para garantizar que Firebase ha restaurado completamente el estado de sesión
  firebase.auth().onAuthStateChanged(async (user) => {
    // Esta función se ejecutará una vez que Firebase haya determinado el estado de autenticación
    if (user) {
      console.log('[Auth] Usuario autenticado:', user.email);
      
      try {
        // Primero verificar el rol del usuario
        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        
        // Verificar si es administrador
        if (userDoc.exists && userDoc.data().rol === 'admin') {
          console.log('[Auth] Rol de usuario: admin - Redirigiendo al panel de administración');
          localStorage.setItem('user_role', 'admin');
          window.location.href = 'admin.html';
          return;
        }
        
        // Verificar si es jefe de departamento
        if (userDoc.exists && userDoc.data().rol === 'jefeDepartamento') {
          console.log('[Auth] Rol de usuario: jefeDepartamento - Redirigiendo al panel de jefe de departamento');
          localStorage.setItem('user_role', 'jefeDepartamento');
          window.location.href = 'department-head.html';
          return;
        }
        
        // Si no es admin, continuar con la lógica normal de usuario
        // Verificar si el usuario está en medio de completar una encuesta
        const currentModule = localStorage.getItem('current_module');
        
        if (currentModule) {
          // Si está en medio de una encuesta, enviarlo al módulo en el que estaba
          console.log(`[Auth] Usuario estaba en el módulo ${currentModule}, redirigiendo...`);
          window.location.href = `modulo${currentModule}.html`;
          return;
        }
        
        // Si no está en medio de una encuesta, verificar en Firestore si ya la completó
        if (userDoc.exists && userDoc.data().encuestaCompletada === true) {
          // Si ya completó una encuesta, redirigir al dashboard
          console.log('[Auth] Usuario ya completó encuesta, redirigiendo a dashboard');
          window.location.href = 'dashboard.html';
        } else {
          // Si no ha completado una encuesta, redirigir al módulo 1
          console.log('[Auth] Usuario no ha completado encuesta, redirigiendo a módulo 1');
          // Establecer que estamos en el módulo 1
          localStorage.setItem('current_module', '1');
          window.location.href = 'modulo1.html';
        }
      } catch (error) {
        console.error('[Auth] Error al verificar estado de encuesta:', error);
        // En caso de error, redirigir al módulo 1 por defecto
        window.location.href = 'modulo1.html';
      }
    } else {
      // Si no hay usuario autenticado, no hacer nada (permanece en la página de login)
      console.log('[Auth] No hay usuario autenticado, permaneciendo en la página de login');
    }
  });
}

// Función para mostrar diálogo de error
function mostrarDialogoError(mensaje) {
  // Verificar si ya existe un diálogo abierto y eliminarlo
  let dialogoExistente = document.getElementById('error-dialog');
  if (dialogoExistente) {
    dialogoExistente.remove();
  }
  
  // Crear el diálogo
  const dialogo = document.createElement('div');
  dialogo.id = 'error-dialog';
  dialogo.className = 'error-dialog';
  
  // Contenido del diálogo
  dialogo.innerHTML = `
    <div class="error-dialog-content">
      <div class="error-icon">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <div class="error-message">${mensaje}</div>
      <button class="error-dialog-button">Aceptar</button>
    </div>
  `;
  
  // Estilos del diálogo
  const style = document.createElement('style');
  style.textContent = `
    .error-dialog {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .error-dialog-content {
      background-color: white;
      border-radius: 10px;
      padding: 25px;
      max-width: 400px;
      width: 80%;
      text-align: center;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    .error-icon {
      font-size: 48px;
      color: #e74c3c;
      margin-bottom: 15px;
    }
    
    .error-message {
      margin-bottom: 20px;
      font-size: 16px;
      color: #333;
    }
    
    .error-dialog-button {
      background-color: #3a7bd5;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .error-dialog-button:hover {
      background-color: #2980b9;
    }
  `;
  
  // Añadir al DOM
  document.body.appendChild(style);
  document.body.appendChild(dialogo);
  
  // Añadir evento al botón
  dialogo.querySelector('.error-dialog-button').addEventListener('click', () => {
    dialogo.remove();
  });
  
  // Cerrar al hacer clic fuera del diálogo también
  dialogo.addEventListener('click', (e) => {
    if (e.target === dialogo) {
      dialogo.remove();
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
    
    // Verificar si ya completó la encuesta y redirigir según corresponda
    setTimeout(async () => {
      try {
        const user = firebase.auth().currentUser;
        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        
        if (userDoc.exists && userDoc.data().encuestaCompletada === true) {
          // Si ya completó una encuesta, redirigir al dashboard
          window.location.href = 'dashboard.html';
        } else {
          // Si no ha completado una encuesta, redirigir al módulo 1
          window.location.href = 'modulo1.html';
        }
      } catch (error) {
        console.error('[Auth] Error al verificar estado de encuesta:', error);
        // En caso de error, redirigir al módulo 1 por defecto
        window.location.href = 'modulo1.html';
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
    
    // Para usuarios nuevos, siempre redirigir al módulo 1 (no necesitan verificación)
    setTimeout(() => window.location.href = "modulo1.html", 800);
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
