/**
 * Arquivo de Configuração do Firebase
 * Substitua os valores abaixo com as credenciais do seu projeto Firebase.
 * O console do Firebase: https://console.firebase.google.com/
 */

const firebaseConfig = {
  apiKey: "",
  authDomain: "]",
  projectId: "]",
  storageBucket: "]",
  messagingSenderId: "",
  appId: ""
};

// Expor globalmente para ser usado pelos serviços
window.firebaseConfig = firebaseConfig;

// Inicializa o Firebase imediatamente se a biblioteca estiver carregada
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log('🔥 Firebase inicializado via firebase-config.js');
} else {
  console.log('🔥 Configuração carregada. Aguardando inicialização do SDK...');
}
