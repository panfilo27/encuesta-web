// Función para cargar datos desde Firebase
async function cargarDatosDesdeFirebase() {
  try {
    const user = firebase.auth().currentUser;
    
    if (!user) {
      console.log('[Módulo 8] Usuario no autenticado, no se cargó de Firebase');
      return null;
    }
    
    // Referencia a la base de datos donde se almacena el historial de encuestas
    const db = firebase.firestore();
    const historialEncuestasRef = db.collection('usuarios').doc(user.uid).collection('historialEncuestas');
    
    // Consultar la última encuesta completada
    const querySnapshot = await historialEncuestasRef.orderBy('fechaCompletado', 'desc').limit(1).get();
    
    if (!querySnapshot.empty) {
      const docMasReciente = querySnapshot.docs[0];
      if (docMasReciente.data() && docMasReciente.data().participacionSocial) {
        const data = docMasReciente.data().participacionSocial;
        console.log('[Módulo 8] Datos de la última encuesta encontrados en Firebase:', data);
        
        // Aplicar parseador si está disponible
        let participacionParsed;
        if (window.parseParticipacionSocialFirestore) {
          // Si ya está disponible como función
          participacionParsed = window.parseParticipacionSocialFirestore(data);
        } else {
          // Fallback: usar datos crudos
          participacionParsed = data;
          console.log('[Módulo 8] Usando datos crudos sin parsear');
        }
        
        console.log('[Módulo 8] Datos procesados de Firebase:', participacionParsed);
        return participacionParsed;
      } else {
        console.log('[Módulo 8] La última encuesta no contiene datos de participación social.');
        return null;
      }
    } else {
      console.log('[Módulo 8] No se encontraron encuestas previas en el historial de Firebase');
      return null;
    }
  } catch (error) {
    console.error('[Módulo 8] Error al cargar desde Firebase:', error);
    return null;
  }
}
