/* =====================================================
   Módulo 1: Validaciones de Campos
   ===================================================== */

console.log('[Módulo 1 - Validaciones] JS cargado');

// Función para mostrar errores inline
function mostrarError(input, mensaje) {
  let errorElement = input.parentNode.querySelector('.error-message');
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.color = '#ff3b30';
    errorElement.style.fontSize = '0.8rem';
    errorElement.style.marginTop = '5px';
    errorElement.style.display = 'block';
    input.parentNode.appendChild(errorElement);
  }
  errorElement.textContent = mensaje;
  input.style.borderColor = '#ff3b30';
  input.setAttribute('aria-invalid', 'true');
}

// Función para ocultar errores inline
function ocultarError(input) {
  let errorElement = input.parentNode.querySelector('.error-message');
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
  input.style.borderColor = '';
  input.removeAttribute('aria-invalid');
}

// Función para inicializar todas las validaciones de campos del Módulo 1
function inicializarValidacionesCamposModulo1() {
  console.log('[Módulo 1 - Validaciones] Inicializando validaciones de campos...');

  // 1. CURP: Convertir a mayúsculas y validar formato
  const curpInput = document.getElementById('curp');
  if (curpInput) {
    curpInput.addEventListener('input', function() {
      this.value = this.value.toUpperCase();
      if (this.value) {
        const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
        if (curpRegex.test(this.value)) {
          ocultarError(this);
        }
      }
    });
    curpInput.addEventListener('blur', function() {
      const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
      if (this.value && !curpRegex.test(this.value)) {
        mostrarError(this, 'El formato de la CURP no es válido. Debe tener 18 caracteres con el formato correcto.');
        // No se hace focus aquí para permitir la navegación si el usuario decide ignorar temporalmente.
      }
    });
  }

  // 2. Teléfono: Solo números y longitud mínima
  const telInput = document.getElementById('tel');
  if (telInput) {
    telInput.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
      if (this.value && this.value.length >= 10) {
        ocultarError(this);
      }
    });
    telInput.addEventListener('blur', function() {
      if (this.value && this.value.length < 10) {
        mostrarError(this, 'El teléfono debe tener al menos 10 dígitos.');
      }
    });
  }

  // 3. Teléfono de casa: Solo números (no requerido)
  const telCasaInput = document.getElementById('tel-casa');
  if (telCasaInput) {
    telCasaInput.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
      if (!this.value || this.value.length >= 10) {
        ocultarError(this);
      }
    });
    telCasaInput.addEventListener('blur', function() {
      if (this.value && this.value.length < 10) {
        mostrarError(this, 'El teléfono debe tener al menos 10 dígitos.');
      }
    });
  }

  // 4. Número de control: Exactamente 8 dígitos numéricos
  const noControlInput = document.getElementById('no-control');
  if (noControlInput) {
    noControlInput.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
      if (this.value && this.value.length === 8) {
        ocultarError(this);
      }
    });
    noControlInput.addEventListener('blur', function() {
      if (this.value && this.value.length !== 8) {
        mostrarError(this, 'El número de control debe tener exactamente 8 dígitos numéricos.');
      }
    });
  }
  console.log('[Módulo 1 - Validaciones] Validaciones de campos inicializadas.');
}

// Función para validar todo el formulario del Módulo 1
function esFormularioModulo1Valido() {
  console.log('[Módulo 1 - Validaciones] Validando formulario completo...');
  let primerCampoConError = null;

  // Validar campos con lógica específica (CURP, Teléfono, No. Control)
  const curpInput = document.getElementById('curp');
  if (curpInput && curpInput.value) {
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
    if (!curpRegex.test(curpInput.value)) {
      mostrarError(curpInput, 'El formato de la CURP no es válido. Debe tener 18 caracteres con el formato correcto.');
      if (!primerCampoConError) primerCampoConError = curpInput;
    } else {
      ocultarError(curpInput);
    }
  } else if (curpInput && curpInput.hasAttribute('required')) {
    mostrarError(curpInput, 'La CURP es obligatoria.');
    if (!primerCampoConError) primerCampoConError = curpInput;
  }

  const telInput = document.getElementById('tel');
  if (telInput && telInput.value) {
    if (telInput.value.length < 10) {
      mostrarError(telInput, 'El teléfono debe tener al menos 10 dígitos.');
      if (!primerCampoConError) primerCampoConError = telInput;
    } else {
      ocultarError(telInput);
    }
  } else if (telInput && telInput.hasAttribute('required')) {
    mostrarError(telInput, 'El teléfono es obligatorio.');
    if (!primerCampoConError) primerCampoConError = telInput;
  }

  const noControlInput = document.getElementById('no-control');
  if (noControlInput && noControlInput.value) {
    if (noControlInput.value.length !== 8) {
      mostrarError(noControlInput, 'El número de control debe tener exactamente 8 dígitos numéricos.');
      if (!primerCampoConError) primerCampoConError = noControlInput;
    } else {
      ocultarError(noControlInput);
    }
  } else if (noControlInput && noControlInput.hasAttribute('required')) {
    mostrarError(noControlInput, 'El número de control es obligatorio.');
    if (!primerCampoConError) primerCampoConError = noControlInput;
  }
  
  // Validar otros campos requeridos genéricos (inputs y selects)
  const form = document.getElementById('registro-form'); // Asegúrate de que este es el ID de tu formulario
  if (form) {
    form.querySelectorAll('input[required], select[required]').forEach(input => {
      if (!input.value || (input.type === 'radio' && !form.querySelector(`input[name="${input.name}"]:checked`))) {
        // Si es un campo específico ya validado arriba, no mostrar doble error.
        if (input.id === 'curp' || input.id === 'tel' || input.id === 'no-control') return;

        const label = form.querySelector(`label[for="${input.id}"]`);
        const fieldName = label ? label.textContent.replace('*', '').trim() : input.name;
        mostrarError(input, `El campo "${fieldName}" es obligatorio.`);
        if (!primerCampoConError) primerCampoConError = input;
      } else {
         // Si es un campo específico ya validado arriba, no ocultar su error específico.
        if (input.id === 'curp' || input.id === 'tel' || input.id === 'no-control') return;
        ocultarError(input);
      }
    });
  }

  if (primerCampoConError) {
    console.log('[Módulo 1 - Validaciones] Formulario inválido. Primer error en:', primerCampoConError.id);
    primerCampoConError.focus();
    // Desplazar la vista al campo con error si está fuera de la vista
    primerCampoConError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  console.log('[Módulo 1 - Validaciones] Formulario válido.');
  return true;
}
