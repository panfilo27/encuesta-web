// Script para manejar la funcionalidad del menú de perfil de usuario
document.addEventListener('DOMContentLoaded', function() {
  // Referencias a elementos del DOM
  const userAvatar = document.querySelector('.user-avatar');
  const userMenu = document.querySelector('.user-menu');
  const overlay = document.querySelector('.overlay');
  const logoutBtn = document.querySelector('.logout-btn');

  // Obtener información del usuario actual
  function updateUserInfo() {
    const user = firebase.auth().currentUser;
    if (user) {
      // Actualizar avatar con inicial
      const userInitial = document.querySelectorAll('.user-initial');
      const initial = user.email.charAt(0).toUpperCase();
      userInitial.forEach(el => {
        el.textContent = initial;
      });
      
      // Actualizar email y nombre en el menú
      document.querySelector('.user-email').textContent = user.email;
      document.querySelector('.user-name').textContent = user.displayName || 'Usuario';
      
      // Mostrar el menú de usuario
      document.querySelector('.user-profile').style.display = 'block';
    } else {
      // Ocultar el menú si no hay usuario
      document.querySelector('.user-profile').style.display = 'none';
    }
  }

  // Mostrar/ocultar menú al hacer clic en avatar
  if (userAvatar) {
    userAvatar.addEventListener('click', function() {
      userMenu.classList.toggle('active');
      overlay.classList.toggle('active');
    });
  }

  // Cerrar menú al hacer clic fuera
  if (overlay) {
    overlay.addEventListener('click', function() {
      userMenu.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  // La función de cierre de sesión se maneja en navbar-loader.js
  // Esto evita problemas de timing con la carga dinámica del navbar

  // Inicializar con la info del usuario actual
  firebase.auth().onAuthStateChanged(function(user) {
    updateUserInfo();
  });
});
