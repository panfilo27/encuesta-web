/**
 * Script para cargar dinámicamente el encabezado en todos los módulos
 */
document.addEventListener('DOMContentLoaded', function() {
  // Buscar el contenedor donde se insertará el navbar
  const navbarPlaceholder = document.getElementById('navbar-placeholder');
  
  if (!navbarPlaceholder) {
    console.error('No se encontró el elemento navbar-placeholder en el DOM');
    return;
  }
  
  // Cargar el navbar usando fetch
  fetch('components/navbar.html')
    .then(response => {
      if (!response.ok) {
        throw new Error('No se pudo cargar el navbar');
      }
      return response.text();
    })
    .then(html => {
      // Insertar el HTML en el placeholder
      navbarPlaceholder.innerHTML = html;
      
      // Inicializar comportamiento del menú de usuario después de cargar el navbar
      setupUserProfile();
      
      // Configurar el botón de cerrar sesión ahora que el navbar ha sido cargado
      setupLogoutButton();
      
      // Intentar actualizar los datos de usuario si están disponibles
      updateUserInfo();
    })
    .catch(error => {
      console.error('Error al cargar el navbar:', error);
    });
});

/**
 * Configura el comportamiento del menú desplegable de usuario
 */
function setupUserProfile() {
  const userAvatar = document.querySelector('.user-avatar');
  const userMenu = document.querySelector('.user-menu');
  const overlay = document.querySelector('.overlay');
  const logoutBtn = document.querySelector('.logout-btn');
  
  if (userAvatar && userMenu && overlay) {
    // Toggle menu al hacer clic en el avatar
    userAvatar.addEventListener('click', function() {
      userMenu.classList.toggle('active');
      overlay.classList.toggle('active');
    });
    
    // Cerrar menú al hacer clic en overlay
    overlay.addEventListener('click', function() {
      userMenu.classList.remove('active');
      overlay.classList.remove('active');
    });
  }
  
  // Solo configuramos eventos de UI aquí, la función de cerrar sesión está en setupLogoutButton
}

/**
 * Actualiza la información del usuario en el menú desplegable
 */
function updateUserInfo() {
  const user = firebase.auth().currentUser;
  if (user) {
    // Actualizar avatar con inicial del usuario
    const userInitial = document.querySelectorAll('.user-initial');
    const initial = user.email.charAt(0).toUpperCase();
    userInitial.forEach(el => {
      el.textContent = initial;
    });
    
    // Actualizar nombre de usuario e email en el menú
    document.getElementById('nombre-usuario').textContent = user.displayName || 'Usuario';
    document.getElementById('correo-usuario').textContent = user.email;
  }
}

/**
 * Configura el botón de cerrar sesión después de que el navbar ha sido cargado
 * Esta función es crucial para garantizar que el botón funcione correctamente
 */
function setupLogoutButton() {
  const logoutBtn = document.querySelector('.logout-btn');
  
  if (logoutBtn) {
    console.log('[Navbar] Configurando botón de cerrar sesión');
    
    logoutBtn.addEventListener('click', function() {
      // Mostrar preloader si existe
      if (typeof showPreloader === 'function') {
        showPreloader();
      } else {
        // Buscar preloader por ID como alternativa
        const preloader = document.getElementById('preloader');
        if (preloader) {
          preloader.style.display = 'flex';
        }
      }

      console.log('[Navbar] Limpiando datos de localStorage al cerrar sesión');
      
      // Lista completa de claves de todos los módulos
      const modulosKeys = [
        'modulo1_data',
        'modulo2_data', 
        'modulo3_data',
        'modulo4_data',
        'modulo5_data',
        'modulo6_data',
        'modulo7_data',
        'modulo8_data',
        'modulo9_data',
        'usuario_data',
        'empresa_data'
      ];
      
      // Remover cada key específicamente antes de limpiar todo
      modulosKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`[Navbar] ${key} ha sido eliminado del localStorage`);
        }
      });
      
      // Limpieza general como último recurso
      localStorage.clear();
      console.log('[Navbar] Todos los datos de localStorage han sido limpiados');
      
      // Cerrar sesión en Firebase
      if (typeof firebase !== 'undefined') {
        firebase.auth().signOut().then(() => {
          console.log('[Navbar] Sesión cerrada correctamente');
          // Redireccionar a página de login
          window.location.href = 'auth.html';
        }).catch((error) => {
          console.error('[Navbar] Error al cerrar sesión:', error);
          
          // Ocultar preloader en caso de error
          if (typeof hidePreloader === 'function') {
            hidePreloader();
          } else {
            const preloader = document.getElementById('preloader');
            if (preloader) {
              preloader.style.display = 'none';
            }
          }
        });
      } else {
        console.error('[Navbar] Firebase no está disponible');
        window.location.href = 'auth.html';
      }
    });
  } else {
    console.error('[Navbar] Botón de cerrar sesión no encontrado');
  }
}
