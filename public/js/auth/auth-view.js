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
    document.addEventListener('DOMContentLoaded', fn);
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

  // Inicializar Firebase
  if (window.initFirebase) window.initFirebase();
});

// Inicializar Firebase
if (window.initFirebase) window.initFirebase();
const auth = window.firebase.auth();
const db = window.firebase.firestore();

// Login
loginForm.onsubmit = async e => {
  e.preventDefault();
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const message = document.getElementById("login-message");
  const loader = document.getElementById("login-loader");
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

  loader.classList.remove("hidden");
  try {
    await auth.signInWithEmailAndPassword(email, password);
    message.classList.add("success");
    message.textContent = "¡Inicio de sesión exitoso!";
    // --- SPA FLOW ---
    // Al iniciar sesión, verificar si el usuario ya completó su registro
    const user = auth.currentUser;
    if (user) {
      const userDoc = await db.collection('usuarios').doc(user.uid).get();
      if (!userDoc.exists) {
        showCompletarRegistroSPA();
      } else {
        showEncuestaSPA();
      }
    }
    // --- END SPA FLOW ---
  } catch (err) {
    message.classList.add("error");
    message.textContent = "Credenciales inválidas o usuario no existe.";
  } finally {
    loader.classList.add("hidden");
  }
};

// Registro
registerForm.onsubmit = async e => {
  e.preventDefault();
  const emailInput = document.getElementById("signup-email");
  const passwordInput = document.getElementById("signup-password");
  const confirmInput = document.getElementById("signup-password-confirm");
  const message = document.getElementById("register-message");
  const loader = document.getElementById("register-loader");
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
  if (!valid) return;

  loader.classList.remove("hidden");
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    message.classList.add("success");
    message.textContent = "¡Registro exitoso! Por favor completa tu información.";
    registerForm.reset();
    await showCompletarRegistroSPA();
  } catch (err) {
    message.classList.add("error");
    message.textContent = "Error al registrar: " + err.message;
  } finally {
    loader.classList.add("hidden");
  }
};
