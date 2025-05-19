/**
 * career-management.js - Controlador para la vista de gestión de carreras
 * Maneja la interacción del usuario con la interfaz para administrar carreras y jefes de departamento
 */

// Crear un namespace para esta vista para evitar colisiones de variables
window.CareerManagement = (function() {
  // Variables privadas del módulo
  let careerService;
  let userService;
  let allCareers = [];
  let allUsers = [];
  let selectedCareer = null;
  let selectedUser = null;
  let domElements = {};

  /**
   * Inicializa el controlador
   */
  async function init(params = {}) {
    try {
      // Inicializar referencia a los elementos del DOM
      initDomElements();
      
      // Crear instancias de servicios
      careerService = new CareerManagementService();
      userService = new AdminDataService();
      
      // Configurar listeners para la UI
      setupEventListeners();
      
      // Cargar datos iniciales
      await Promise.all([
        loadCareers(),
        loadUsers()
      ]);
      // Inicializar sistema de noticias si está disponible
    if (window.NewsManagement && typeof window.NewsManagement.init === 'function') {
      try {
        window.NewsManagement.init();
        console.log('[CareerManagement] NewsManagement.init() ejecutado');
      } catch (e) {
        console.error('[CareerManagement] Error al inicializar NewsManagement:', e);
      }
    }
  } catch (error) {
    console.error("Error al inicializar módulo de gestión de carreras:", error);
    showErrorMessage('Hubo un problema al cargar el módulo de gestión de carreras. Por favor, recarga la página.');
  }
}

  /**
   * Inicializa las referencias a elementos del DOM
   */
  function initDomElements() {
    domElements = {
      // Tablas y contenedores
      careersTableBody: document.getElementById('careers-table-body'),
      adminsTableBody: document.getElementById('admins-table-body'),
      careersTable: document.getElementById('careers-table'),
      adminsTable: document.getElementById('admins-table'),
      
      // Indicadores de carga
      careersLoading: document.getElementById('careers-loading'),
      adminsLoading: document.getElementById('admins-loading'),
      
      // Mensajes de no datos
      noCareersMessage: document.getElementById('no-careers-message'),
      noAdminsMessage: document.getElementById('no-admins-message'),
      
      // Botones principales
      btnAddCareer: document.getElementById('btn-add-career'),
      btnSearchAdmin: document.getElementById('btn-search-admin'),
      adminSearchInput: document.getElementById('admin-search'),
      
      // Modal de carrera
      careerModal: document.getElementById('career-modal'),
      careerForm: document.getElementById('career-form'),
      careerModalTitle: document.getElementById('career-modal-title'),
      careerIdInput: document.getElementById('career-id'),
      careerNameInput: document.getElementById('career-name'),
      careerCodeInput: document.getElementById('career-code'),
      careerFacultyInput: document.getElementById('career-faculty'),
      careerAdminSelect: document.getElementById('career-admin'),
      btnSaveCareer: document.getElementById('btn-save-career'),
      btnCancelCareer: document.getElementById('btn-cancel-career'),
      
      // Modal de rol
      roleModal: document.getElementById('role-modal'),
      roleForm: document.getElementById('role-form'),
      roleModalTitle: document.getElementById('role-modal-title'),
      userIdInput: document.getElementById('user-id'),
      userNameDisplay: document.getElementById('user-name-display'),
      userEmailDisplay: document.getElementById('user-email-display'),
      userRoleSelect: document.getElementById('user-role'),
      assignedCareerSelect: document.getElementById('assigned-career'),
      careerAssignmentGroup: document.querySelector('.career-assignment'),
      btnSaveRole: document.getElementById('btn-save-role'),
      btnCancelRole: document.getElementById('btn-cancel-role'),
    };
  }

  /**
   * Configura los listeners de eventos para la interfaz
   */
  function setupEventListeners() {
    // Botón para agregar carrera
    domElements.btnAddCareer.addEventListener('click', () => {
      openCareerModal();
    });
    
    // Botón de búsqueda de administradores
    domElements.btnSearchAdmin.addEventListener('click', () => {
      const searchTerm = domElements.adminSearchInput.value.trim().toLowerCase();
      filterUsers(searchTerm);
    });
    
    // Búsqueda en tiempo real
    domElements.adminSearchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const searchTerm = domElements.adminSearchInput.value.trim().toLowerCase();
        filterUsers(searchTerm);
      }
    });
    
    // Formulario de carrera
    domElements.careerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveCareer();
    });
    
    // Botón cancelar carrera
    domElements.btnCancelCareer.addEventListener('click', () => {
      closeCareerModal();
    });
    
    // Modal de carrera (cerrar al hacer clic en X)
    const careerCloseButtons = domElements.careerModal.querySelectorAll('.modal-close');
    careerCloseButtons.forEach(btn => {
      btn.addEventListener('click', () => closeCareerModal());
    });
    
    // Formulario de rol
    domElements.roleForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveUserRole();
    });
    
    // Botón cancelar rol
    domElements.btnCancelRole.addEventListener('click', () => {
      closeRoleModal();
    });
    
    // Modal de rol (cerrar al hacer clic en X)
    const roleCloseButtons = domElements.roleModal.querySelectorAll('.modal-close');
    roleCloseButtons.forEach(btn => {
      btn.addEventListener('click', () => closeRoleModal());
    });
    
    // Mostrar/ocultar selección de carrera según el rol
    domElements.userRoleSelect.addEventListener('change', () => {
      const selectedRole = domElements.userRoleSelect.value;
      if (selectedRole === 'jefeDepartamento') {
        domElements.careerAssignmentGroup.style.display = 'block';
      } else {
        domElements.careerAssignmentGroup.style.display = 'none';
      }
    });
  }

  /**
   * Carga todas las carreras desde el servicio
   */
  async function loadCareers() {
    try {
      showCareersLoading(true);
      
      // Obtener carreras del servicio
      allCareers = await careerService.getAllCareers();
      
      // Renderizar la tabla
      renderCareersTable();
      
      // Actualizar selectores de carreras en los modales
      updateCareerSelects();
      
      showCareersLoading(false);
    } catch (error) {
      console.error("Error al cargar carreras:", error);
      showCareersLoading(false);
      showErrorMessage('Error al cargar carreras. Por favor, intenta de nuevo.');
    }
  }

  /**
   * Carga todos los usuarios desde el servicio
   */
  async function loadUsers() {
    try {
      showAdminsLoading(true);
      
      // Obtener usuarios del servicio
      allUsers = await userService.getAllUsers();
      
      // Renderizar la tabla
      renderUsersTable();
      
      // Actualizar selectores de administradores en los modales
      updateAdminSelects();
      
      showAdminsLoading(false);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      showAdminsLoading(false);
      showErrorMessage('Error al cargar usuarios. Por favor, intenta de nuevo.');
    }
  }

  /**
   * Renderiza la tabla de carreras
   */
  function renderCareersTable() {
    // Verificar si hay carreras
    if (!allCareers || allCareers.length === 0) {
      domElements.noCareersMessage.style.display = 'block';
      domElements.careersTable.style.display = 'none';
      return;
    }
    
    // Mostrar tabla y ocultar mensaje
    domElements.noCareersMessage.style.display = 'none';
    domElements.careersTable.style.display = 'table';
    
    // Limpiar tabla
    domElements.careersTableBody.innerHTML = '';
    
    // Renderizar cada carrera
    allCareers.forEach(career => {
      const row = document.createElement('tr');
      
      // Crear celdas
      row.innerHTML = `
        <td>${career.codigo || '-'}</td>
        <td>${career.nombre || '-'}</td>
        <td id="admin-name-${career.id}">
          <i class="fas fa-spinner fa-spin"></i> Cargando...
        </td>
        <td class="actions-cell">
          <button class="btn-icon edit-career" data-id="${career.id}" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon delete-career" data-id="${career.id}" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      
      // Agregar a la tabla
      domElements.careersTableBody.appendChild(row);
      
      // Cargar nombre del jefe de departamento (asíncrono)
      loadDepartmentHeadName(career.id);
      
      // Agregar event listeners a los botones
      row.querySelector('.edit-career').addEventListener('click', () => {
        openCareerModal(career.id);
      });
      
      row.querySelector('.delete-career').addEventListener('click', () => {
        confirmDeleteCareer(career.id);
      });
    });
  }

  /**
   * Carga el nombre del jefe de departamento para una carrera
   */
  async function loadDepartmentHeadName(careerId) {
    try {
      const adminCell = document.getElementById(`admin-name-${careerId}`);
      if (!adminCell) return;
      
      const admin = await careerService.getDepartmentHead(careerId);
      
      if (admin) {
        adminCell.innerHTML = `
          ${admin.nombre} ${admin.apellidoPaterno || ''} <br>
          <small>${admin.email || ''}</small>
        `;
      } else {
        adminCell.innerHTML = `<span class="no-admin-assigned">No asignado</span>`;
      }
    } catch (error) {
      console.error(`Error al cargar jefe para carrera ${careerId}:`, error);
      const adminCell = document.getElementById(`admin-name-${careerId}`);
      if (adminCell) {
        adminCell.innerHTML = '<span class="text-error">Error al cargar</span>';
      }
    }
  }

  /**
   * Renderiza la tabla de usuarios
   */
  function renderUsersTable(users = null) {
    const usersToRender = users || allUsers;
    
    // Verificar si hay usuarios
    if (!usersToRender || usersToRender.length === 0) {
      domElements.noAdminsMessage.style.display = 'block';
      domElements.adminsTable.style.display = 'none';
      return;
    }
    
    // Mostrar tabla y ocultar mensaje
    domElements.noAdminsMessage.style.display = 'none';
    domElements.adminsTable.style.display = 'table';
    
    // Limpiar tabla
    domElements.adminsTableBody.innerHTML = '';
    
    // Renderizar cada usuario
    usersToRender.forEach(user => {
      const row = document.createElement('tr');
      
      // Formatear nombre completo
      const fullName = `${user.nombre || ''} ${user.apellidoPaterno || ''} ${user.apellidoMaterno || ''}`.trim();
      
      // Determinar etiqueta de rol
      let rolLabel = 'Usuario';
      let rolClass = 'role-user';
      
      if (user.rol === 'admin') {
        rolLabel = 'Administrador';
        rolClass = 'role-admin';
      } else if (user.rol === 'jefeDepartamento') {
        rolLabel = 'Jefe de Departamento';
        rolClass = 'role-dept-head';
      }
      
      // Crear celdas
      row.innerHTML = `
        <td>${fullName || user.email}</td>
        <td>${user.email || '-'}</td>
        <td><span class="role-badge ${rolClass}">${rolLabel}</span></td>
        <td class="actions-cell">
          <button class="btn-icon edit-role" data-id="${user.id}" title="Cambiar Rol">
            <i class="fas fa-user-cog"></i>
          </button>
        </td>
      `;
      
      // Agregar a la tabla
      domElements.adminsTableBody.appendChild(row);
      
      // Agregar event listener al botón
      row.querySelector('.edit-role').addEventListener('click', () => {
        openRoleModal(user.id);
      });
    });
  }

  /**
   * Filtra los usuarios por término de búsqueda
   */
  function filterUsers(searchTerm) {
    if (!searchTerm) {
      renderUsersTable(); // Mostrar todos
      return;
    }
    
    const filteredUsers = allUsers.filter(user => {
      const fullName = `${user.nombre || ''} ${user.apellidoPaterno || ''} ${user.apellidoMaterno || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      
      return fullName.includes(searchTerm) || email.includes(searchTerm);
    });
    
    renderUsersTable(filteredUsers);
  }

  /**
   * Abre el modal para agregar o editar una carrera
   */
  async function openCareerModal(careerId = null) {
    try {
      resetCareerForm();
      
      if (careerId) {
        // Modo edición
        domElements.careerModalTitle.textContent = 'Editar Carrera';
        
        // Obtener datos de la carrera
        selectedCareer = await careerService.getCareerById(careerId);
        
        if (!selectedCareer) {
          throw new Error(`No se encontró la carrera con ID ${careerId}`);
        }
        
        // Llenar el formulario
        domElements.careerIdInput.value = selectedCareer.id;
        domElements.careerNameInput.value = selectedCareer.nombre || '';
        domElements.careerCodeInput.value = selectedCareer.codigo || '';
        domElements.careerFacultyInput.value = selectedCareer.facultad || '';
        
        // Seleccionar jefe si existe
        if (selectedCareer.jefeDepartamentoId) {
          domElements.careerAdminSelect.value = selectedCareer.jefeDepartamentoId;
        }
      } else {
        // Modo creación
        domElements.careerModalTitle.textContent = 'Agregar Nueva Carrera';
        selectedCareer = null;
      }
      
      // Mostrar modal
      domElements.careerModal.style.display = 'block';
    } catch (error) {
      console.error("Error al abrir modal de carrera:", error);
      showErrorMessage('Error al cargar datos de la carrera. Por favor, intenta de nuevo.');
    }
  }

  /**
   * Cierra el modal de carrera
   */
  function closeCareerModal() {
    domElements.careerModal.style.display = 'none';
    resetCareerForm();
  }

  /**
   * Resetea el formulario de carrera
   */
  function resetCareerForm() {
    domElements.careerForm.reset();
    domElements.careerIdInput.value = '';
    selectedCareer = null;
  }

  /**
   * Guarda los datos de la carrera (crea o actualiza)
   */
  async function saveCareer() {
    try {
      // Obtener datos del formulario
      const careerData = {
        nombre: domElements.careerNameInput.value.trim(),
        codigo: domElements.careerCodeInput.value.trim(),
        facultad: domElements.careerFacultyInput.value.trim(),
        jefeDepartamentoId: domElements.careerAdminSelect.value || null
      };
      
      // Validar datos mínimos
      if (!careerData.nombre || !careerData.codigo) {
        showErrorMessage('El nombre y el código de la carrera son obligatorios.');
        return;
      }
      
      // Deshabilitar botón mientras se guarda
      domElements.btnSaveCareer.disabled = true;
      domElements.btnSaveCareer.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      
      const careerId = domElements.careerIdInput.value;
      
      if (careerId) {
        // Actualizar carrera existente
        await careerService.updateCareer(careerId, careerData);
        
        // Si se cambió el jefe, asignarlo
        if (careerData.jefeDepartamentoId !== (selectedCareer?.jefeDepartamentoId || null)) {
          if (careerData.jefeDepartamentoId) {
            await careerService.assignDepartmentHead(careerId, careerData.jefeDepartamentoId);
          } else if (selectedCareer?.jefeDepartamentoId) {
            await careerService.removeDepartmentHead(careerId);
          }
        }
        
        showSuccessMessage('Carrera actualizada correctamente.');
      } else {
        // Crear nueva carrera
        const newCareerId = await careerService.createCareer(careerData);
        
        // Si se especificó un jefe, asignarlo
        if (careerData.jefeDepartamentoId) {
          await careerService.assignDepartmentHead(newCareerId, careerData.jefeDepartamentoId);
        }
        
        showSuccessMessage('Carrera creada correctamente.');
      }
      
      // Cerrar modal y recargar datos
      closeCareerModal();
      await loadCareers();
      
    } catch (error) {
      console.error("Error al guardar carrera:", error);
      showErrorMessage('Error al guardar la carrera. Por favor, intenta de nuevo.');
    } finally {
      // Re-habilitar botón
      domElements.btnSaveCareer.disabled = false;
      domElements.btnSaveCareer.innerHTML = 'Guardar';
    }
  }

  /**
   * Confirma la eliminación de una carrera
   */
  function confirmDeleteCareer(careerId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta carrera? Esta acción no se puede deshacer.')) {
      deleteCareer(careerId);
    }
  }

  /**
   * Elimina una carrera
   */
  async function deleteCareer(careerId) {
    try {
      await careerService.deleteCareer(careerId);
      showSuccessMessage('Carrera eliminada correctamente.');
      await loadCareers();
    } catch (error) {
      console.error("Error al eliminar carrera:", error);
      showErrorMessage('Error al eliminar la carrera. Por favor, intenta de nuevo.');
    }
  }

  /**
   * Abre el modal para cambiar el rol de un usuario
   */
  async function openRoleModal(userId) {
    try {
      resetRoleForm();
      
      // Obtener datos del usuario
      const user = allUsers.find(u => u.id === userId);
      
      if (!user) {
        throw new Error(`No se encontró el usuario con ID ${userId}`);
      }
      
      selectedUser = user;
      
      // Llenar el formulario
      domElements.userIdInput.value = user.id;
      domElements.userNameDisplay.textContent = `${user.nombre || ''} ${user.apellidoPaterno || ''}`.trim() || 'Sin nombre';
      domElements.userEmailDisplay.textContent = user.email || 'Sin email';
      
      // Seleccionar rol actual
      domElements.userRoleSelect.value = user.rol || 'usuario';
      
      // Mostrar/ocultar selección de carrera según el rol
      if (user.rol === 'jefeDepartamento') {
        domElements.careerAssignmentGroup.style.display = 'block';
        if (user.carreraAsignada) {
          domElements.assignedCareerSelect.value = user.carreraAsignada;
        }
      } else {
        domElements.careerAssignmentGroup.style.display = 'none';
      }
      
      // Mostrar modal
      domElements.roleModal.style.display = 'block';
    } catch (error) {
      console.error("Error al abrir modal de rol:", error);
      showErrorMessage('Error al cargar datos del usuario. Por favor, intenta de nuevo.');
    }
  }

  /**
   * Cierra el modal de rol
   */
  function closeRoleModal() {
    domElements.roleModal.style.display = 'none';
    resetRoleForm();
  }

  /**
   * Resetea el formulario de rol
   */
  function resetRoleForm() {
    domElements.roleForm.reset();
    domElements.userIdInput.value = '';
    domElements.careerAssignmentGroup.style.display = 'none';
    selectedUser = null;
  }

  /**
   * Guarda los cambios de rol del usuario
   */
  async function saveUserRole() {
    try {
      // Obtener datos del formulario
      const userId = domElements.userIdInput.value;
      const newRole = domElements.userRoleSelect.value;
      const careerId = domElements.assignedCareerSelect.value;
      
      if (!userId) {
        showErrorMessage('Usuario no válido.');
        return;
      }
      
      // Validar que si el rol es jefe de departamento, se seleccione una carrera
      if (newRole === 'jefeDepartamento' && !careerId) {
        showErrorMessage('Debe seleccionar una carrera para el jefe de departamento.');
        return;
      }
      
      // Deshabilitar botón mientras se guarda
      domElements.btnSaveRole.disabled = true;
      domElements.btnSaveRole.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      
      // Actualizar rol en Firestore
      const userRef = firebase.firestore().collection('usuarios').doc(userId);
      
      // Si el usuario era jefe de departamento, liberar esa carrera
      if (selectedUser && selectedUser.rol === 'jefeDepartamento' && selectedUser.carreraAsignada) {
        // Solo si el rol cambió o la carrera cambió
        if (newRole !== 'jefeDepartamento' || careerId !== selectedUser.carreraAsignada) {
          await careerService.removeDepartmentHead(selectedUser.carreraAsignada);
        }
      }
      
      // Actualizar datos según el nuevo rol
      if (newRole === 'jefeDepartamento') {
        // Si el nuevo rol es jefe, asignar a la carrera
        await careerService.assignDepartmentHead(careerId, userId);
      } else {
        // Actualizar solo el rol
        await userRef.update({ rol: newRole });
      }
      
      showSuccessMessage(`Rol de usuario actualizado a ${newRole}.`);
      
      // Cerrar modal y recargar datos
      closeRoleModal();
      await Promise.all([loadUsers(), loadCareers()]);
      
    } catch (error) {
      console.error("Error al guardar rol de usuario:", error);
      showErrorMessage('Error al actualizar el rol del usuario. Por favor, intenta de nuevo.');
    } finally {
      // Re-habilitar botón
      domElements.btnSaveRole.disabled = false;
      domElements.btnSaveRole.innerHTML = 'Guardar';
    }
  }

  /**
   * Actualiza todos los selectores de carreras en los modales
   */
  function updateCareerSelects() {
    // Limpiar opciones anteriores (excepto la primera)
    const selects = [domElements.assignedCareerSelect];
    
    selects.forEach(select => {
      // Mantener la primera opción y eliminar el resto
      const firstOption = select.querySelector('option:first-child');
      select.innerHTML = '';
      if (firstOption) {
        select.appendChild(firstOption);
      }
      
      // Agregar opciones de carreras
      allCareers.forEach(career => {
        const option = document.createElement('option');
        option.value = career.id;
        option.textContent = career.nombre;
        select.appendChild(option);
      });
    });
  }

  /**
   * Actualiza todos los selectores de administradores en los modales
   */
  function updateAdminSelects() {
    // Selector de jefe de departamento en el modal de carrera
    const select = domElements.careerAdminSelect;
    
    // Mantener la primera opción y eliminar el resto
    const firstOption = select.querySelector('option:first-child');
    select.innerHTML = '';
    if (firstOption) {
      select.appendChild(firstOption);
    }
    
    // Agregar opciones de usuarios
    const potentialAdmins = allUsers.filter(user => 
      // Incluir usuarios con rol de admin o jefeDepartamento, más usuarios regulares
      user.rol === 'admin' || user.rol === 'jefeDepartamento' || user.rol === 'usuario'
    );
    
    potentialAdmins.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      const fullName = `${user.nombre || ''} ${user.apellidoPaterno || ''}`.trim();
      option.textContent = `${fullName} (${user.email})`;
      select.appendChild(option);
    });
  }

  /**
   * Muestra u oculta el indicador de carga para las carreras
   */
  function showCareersLoading(show) {
    domElements.careersLoading.style.display = show ? 'flex' : 'none';
    if (show) {
      domElements.careersTable.style.display = 'none';
      domElements.noCareersMessage.style.display = 'none';
    }
  }

  /**
   * Muestra u oculta el indicador de carga para los administradores
   */
  function showAdminsLoading(show) {
    domElements.adminsLoading.style.display = show ? 'flex' : 'none';
    if (show) {
      domElements.adminsTable.style.display = 'none';
      domElements.noAdminsMessage.style.display = 'none';
    }
  }

  /**
   * Muestra un mensaje de error
   */
  function showErrorMessage(message) {
    alert(message);
  }

  /**
   * Muestra un mensaje de éxito
   */
  function showSuccessMessage(message) {
    alert(message);
  }

  // Exponer funciones públicas
  return {
    init,
    loadCareers,
    loadUsers
  };
})();
