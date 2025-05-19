/**
 * Script para mejorar la funcionalidad de los sliders
 */
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar todos los sliders
  const sliders = document.querySelectorAll('input[type="range"]');
  
  sliders.forEach(slider => {
    const sliderId = slider.id;
    const valueId = sliderId.replace('habilidad_', '') + '-value';
    const progressId = sliderId.replace('habilidad_', '') + '-progress';
    
    const valueElement = document.getElementById(valueId);
    const progressElement = document.getElementById(progressId);
    
    // Inicializar progreso con los valores actuales
    updateSlider(slider, valueElement, progressElement);
    
    // Añadir eventos para mayor responsividad
    slider.addEventListener('input', function() {
      updateSlider(this, valueElement, progressElement);
      
      // Añadir clase temporal para el efecto visual
      if (valueElement) {
        valueElement.classList.add('changed');
        setTimeout(() => {
          valueElement.classList.remove('changed');
        }, 500);
      }
    });
    
    // Asegurar que el progreso se actualice también en estos eventos
    slider.addEventListener('change', function() {
      updateSlider(this, valueElement, progressElement);
    });
    
    slider.addEventListener('mouseup', function() {
      updateSlider(this, valueElement, progressElement);
    });
  });
  
  /**
   * Actualiza un slider, su valor y barra de progreso
   * @param {HTMLElement} slider - Elemento input type range
   * @param {HTMLElement} valueElement - Elemento donde se muestra el valor
   * @param {HTMLElement} progressElement - Elemento de la barra de progreso
   */
  function updateSlider(slider, valueElement, progressElement) {
    // Actualizar valor mostrado
    if (valueElement) {
      valueElement.textContent = slider.value;
      
      // Aplicar estilo especial para el 100%
      if (slider.value == 100) {
        valueElement.classList.add('max-value');
      } else {
        valueElement.classList.remove('max-value');
      }
    }
    
    // Aplicar/quitar clase especial cuando está al 100%
    if (slider.value == 100) {
      slider.classList.add('at-max-value');
    } else {
      slider.classList.remove('at-max-value');
    }
    
    // Actualizar barra de progreso - ajustando para alinear correctamente
    if (progressElement) {
      // Calcular el ancho real disponible para el progreso (teniendo en cuenta el ancho del thumb)
      const thumbWidth = 22; // Ancho del thumb en px (del CSS)
      
      // Calcular la posición relativa del valor actual
      const min = parseInt(slider.min, 10);
      const max = parseInt(slider.max, 10);
      const val = parseInt(slider.value, 10);
      
      // Calcular el porcentaje ajustado
      let percentage = ((val - min) / (max - min)) * 100;
      
      // Limitar el porcentaje para que no sobrepase el límite visual
      if (percentage === 100) {
        // En 100%, usar el ancho completo para que llegue hasta el final
        progressElement.style.width = '100%';
      } else if (percentage === 0) {
        // En 0%, asegurar que no haya barra visible
        progressElement.style.width = '0';
      } else {
        // Aplicar un factor de corrección para que la barra no se adelante al círculo
        // Reducir progresivamente para valores más altos
        let factor = 1;
        if (percentage > 90) {
          // Reducción mayor para valores cercanos al 100%
          factor = 0.90;
        } else if (percentage > 75) {
          factor = 0.92;
        } else if (percentage > 50) {
          factor = 0.94;
        } else {
          factor = 0.96;
        }
        const adjustedPercentage = percentage * factor;
        progressElement.style.width = `${adjustedPercentage}%`;
      }
    }
  }
  
  // Asegurar que todo esté alineado después de que la página se cargue completamente
  window.addEventListener('load', function() {
    sliders.forEach(slider => {
      const progressId = slider.id.replace('habilidad_', '') + '-progress';
      const progressElement = document.getElementById(progressId);
      if (progressElement) {
        // Recalcular el progreso una vez que todos los estilos estén cargados
        const min = parseInt(slider.min, 10);
        const max = parseInt(slider.max, 10);
        const val = parseInt(slider.value, 10);
        const percentage = ((val - min) / (max - min)) * 100;
        
        if (percentage === 100) {
          // En 100%, usar el ancho completo para que llegue hasta el final
          progressElement.style.width = '100%';
        } else if (percentage === 0) {
          // En 0%, asegurar que no haya barra visible
          progressElement.style.width = '0';
        } else {
          // Aplicar un factor de corrección para que la barra no se adelante al círculo
          // Reducir progresivamente para valores más altos
          let factor = 1;
          if (percentage > 90) {
            // Reducción mayor para valores cercanos al 100%
            factor = 0.90;
          } else if (percentage > 75) {
            factor = 0.92;
          } else if (percentage > 50) {
            factor = 0.94;
          } else {
            factor = 0.96;
          }
          const adjustedPercentage = percentage * factor;
          progressElement.style.width = `${adjustedPercentage}%`;
        }
      }
    });
  });
});
