// Inicializa Firebase usando la API compat de la CDN
window.initFirebase = function() {
  if (!window.firebase.apps.length) {
    window.firebase.initializeApp({
      apiKey: "AIzaSyBxiq4nbHs_0qtKjc5V9-aGEClM7IBweiA",
      authDomain: "encuestaweb-bfc0a.firebaseapp.com",
      projectId: "encuestaweb-bfc0a",
      storageBucket: "encuestaweb-bfc0a.appspot.com",
      messagingSenderId: "493294629103",
      appId: "1:493294629103:web:304a5805d2bf484f07eb1a",
      measurementId: "G-JLQWWN1K0T"
    });
    console.log("Firebase inicializado correctamente");
  }
};

// Ejecutar la inicialización inmediatamente
window.initFirebase();
