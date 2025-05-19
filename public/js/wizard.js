/* =====================================================
   Wizard - Control de navegación entre pasos del formulario
   y entre módulos de la encuesta
   ===================================================== */

// Inicialización del mini-wizard
window.initWizard = function() {
  console.log('[Wizard] Inicializando control de navegación...');
  
  // Obtener elementos del DOM
  const steps = [...document.querySelectorAll('.wizard-step')];
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  const send = document.getElementById('submitBtn');
  const prog = document.getElementById('progress');
  let idx = 0;

  // Obtener información de la página actual
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const currentModuleMatch = currentPage.match(/modulo(\d+)\.html/);
  const currentModuleNum = currentModuleMatch ? parseInt(currentModuleMatch[1]) : 0;
  
  console.log(`[Wizard] Página actual: ${currentPage}, Módulo: ${currentModuleNum}`);

  // Configurar navegación ENTRE MÓDULOS
  function setupModuleNavigation() {
    if (!currentModuleMatch) return; // No estamos en un módulo, salir
    
    // Actualizar botones de navegación entre módulos
    if (prev) {
      if (currentModuleNum <= 1) {
        prev.disabled = true; // Deshabilitar botón Atrás en el primer módulo
      } else {
        prev.disabled = false;
        prev.onclick = function(e) {
          e.preventDefault();
          const prevModule = currentModuleNum - 1;
          
          // Guardar el número del módulo anterior en localStorage para seguimiento de progreso
          localStorage.setItem('current_module', prevModule.toString());
          console.log(`[Wizard] Actualizando current_module en localStorage a ${prevModule}`);
          
          window.location.href = `modulo${prevModule}.html`;
        };
      }
    }

    if (next) {
      // En el último módulo (actualmente el 3), el botón "Siguiente" no aparece
      const isLastModule = currentModuleNum >= 3; // Temporalmente el módulo 3 es el último
      
      if (isLastModule) {
        next.style.display = 'none';
        if (send) send.style.display = 'inline-block';
      } else {
        next.style.display = 'inline-block';
        if (send) send.style.display = 'none';
        
        next.onclick = async function(e) { // Hacerla async para poder usar await
          e.preventDefault();
          
          // Validar el formulario actual (validación HTML5 básica)
          const form = document.querySelector('form');
          if (form && !form.checkValidity()) {
            form.reportValidity();
            console.log('[Wizard] Validación HTML5 del formulario falló.');
            return false;
          }

          // Verificar si hay una función de pre-navegación personalizada
          if (typeof next._onBeforeNavigate === 'function') {
            console.log('[Wizard] Ejecutando _onBeforeNavigate personalizado...');
            try {
              const canNavigate = await next._onBeforeNavigate(); // Esperar a la función asíncrona
              if (!canNavigate) {
                console.log('[Wizard] _onBeforeNavigate personalizado devolvió false. Navegación cancelada.');
                return false; // No navegar si la función personalizada lo indica
              }
              console.log('[Wizard] _onBeforeNavigate personalizado devolvió true.');
            } catch (error) {
              console.error('[Wizard] Error durante la ejecución de _onBeforeNavigate:', error);
              // Aquí se podría decidir no navegar también, o mostrar un error al usuario
              return false; // Por seguridad, no navegar si hay un error inesperado
            }
          } else {
            console.log('[Wizard] No se encontró _onBeforeNavigate personalizado.');
          }
          
          // Si todo está correcto (validación HTML5 y _onBeforeNavigate personalizado), ir al siguiente módulo
          console.log('[Wizard] Procediendo a la navegación al siguiente módulo.');
          const nextModule = currentModuleNum + 1;
          
          // Guardar el número del siguiente módulo en localStorage para seguimiento de progreso
          localStorage.setItem('current_module', nextModule.toString());
          console.log(`[Wizard] Actualizando current_module en localStorage a ${nextModule}`);
          
          window.location.href = `modulo${nextModule}.html`;
        };
      }
    }
  }

  // Configurar navegación DENTRO DEL MÓDULO (pasos dentro del mismo HTML)
  function setupStepNavigation() {
    // Si no hay múltiples pasos, no hay nada que configurar
    if (steps.length <= 1) return;
    
    // Función para mostrar un paso específico
    function show(i) {
      // Actualizar visibilidad de pasos
      steps.forEach((s, n) => s.style.display = n === i ? 'block' : 'none');
      
      // Configurar botones según el paso actual
      if (prev) prev.disabled = i === 0;
      
      // En el último módulo
      const isLastModule = currentModuleNum >= 3; // Temporalmente el módulo 3 es el último
      
      if (isLastModule && send) {
        // En el último paso del último módulo: mostrar botón de enviar
        const isLastStep = i === steps.length - 1;
        next.style.display = isLastStep ? 'none' : 'inline-block';
        send.style.display = isLastStep ? 'inline-block' : 'none';
      }
      
      // Actualizar barra de progreso interna del módulo
      if (prog) prog.value = i;
    }
    
    // Configurar función del botón Siguiente para navegar entre pasos
    if (next && steps.length > 1) {
      // Sobreescribir el onclick solo si hay múltiples pasos
      next.onclick = function(e) {
        e.preventDefault();
        
        // Validar el paso actual
        const currentStep = steps[idx];
        const invalidField = currentStep.querySelector(':invalid');
        if (invalidField) {
          invalidField.reportValidity();
          return false;
        }
        
        // Si es el último paso y no el último módulo, ir al siguiente módulo
        if (idx === steps.length - 1 && !isLastModule) {
          const nextModule = currentModuleNum + 1;
          window.location.href = `modulo${nextModule}.html`;
          return;
        }
        
        // Si no es el último paso, ir al siguiente paso
        if (idx < steps.length - 1) {
          idx++;
          show(idx);
        }
      };
    }
    
    // Configurar función del botón Atrás para navegar entre pasos
    if (prev && steps.length > 1) {
      prev.onclick = function(e) {
        e.preventDefault();
        
        // Si estamos en el primer paso y no en el primer módulo, ir al módulo anterior
        if (idx === 0 && currentModuleNum > 1) {
          const prevModule = currentModuleNum - 1;
          window.location.href = `modulo${prevModule}.html`;
          return;
        }
        
        // Si no estamos en el primer paso, ir al paso anterior
        if (idx > 0) {
          idx--;
          show(idx);
        }
      };
    }
    
    // Mostrar el paso inicial
    show(idx);
  }

  // Inicializar la navegación adecuada según el contexto
  if (steps.length <= 1) {
    // Si solo hay un paso, configurar navegación entre módulos
    setupModuleNavigation();
  } else {
    // Si hay múltiples pasos, configurar navegación entre pasos
    setupStepNavigation();
  }
  
  console.log('[Wizard] Control de navegación inicializado');
};

// Auto-iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Solo si no hay otra inicialización que lo maneje
  if (!window.wizardInitialized && typeof window.initWizard === 'function') {
    window.initWizard();
    window.wizardInitialized = true;
  }
});
