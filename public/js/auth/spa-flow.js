// spa-flow.js
// Helpers para SPA: cargar completar-registro y encuesta dinámicamente
window.showCompletarRegistroSPA = showCompletarRegistroSPA;
window.showEncuestaSPA = showEncuestaSPA;

async function showCompletarRegistroSPA() {
  document.querySelector('.forms-section').style.display = 'none';
  const cont = document.getElementById('completar-registro-spa');
  const encuestaCont = document.getElementById('encuesta-spa');
  if (encuestaCont) encuestaCont.style.display = 'none';
  if (cont) {
    cont.style.display = 'block';
    // Carga el formulario de registro dinámicamente
    const html = await fetch('completar-registro.html').then(r => r.text());
    // Extrae el <section class="registro-form-section"> completo
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const section = temp.querySelector('section.registro-form-section');
    cont.innerHTML = '';
    if (section) cont.appendChild(section);
    // Cargar y ejecutar el script de completar-registro.js
    const oldScript = document.getElementById('spa-completar-registro-script');
    if (oldScript) oldScript.remove();
    const script = document.createElement('script');
    script.src = 'js/auth/completar-registro.js';
    script.id = 'spa-completar-registro-script';
    document.body.appendChild(script);
    // Espera a que el script se cargue y luego inicializa el formulario
    script.onload = () => {
      if (window.initCompletarRegistroForm) {
        window.initCompletarRegistroForm();
      } else {
        console.error('[SPA] No se encontró window.initCompletarRegistroForm después de cargar el script.');
      }
    };
  }
}

async function showEncuestaSPA() {
  document.querySelector('.forms-section').style.display = 'none';
  const cont = document.getElementById('encuesta-spa');
  const registroCont = document.getElementById('completar-registro-spa');
  if (registroCont) registroCont.style.display = 'none';
  if (cont) {
    cont.style.display = 'block';
    // Carga la encuesta dinámicamente
    const html = await fetch('encuesta.html').then(r => r.text());
    // Extrae solo el contenido principal
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const encuestaSection = temp.querySelector('section');
    cont.innerHTML = '';
    if (encuestaSection) cont.appendChild(encuestaSection);
  }
}
