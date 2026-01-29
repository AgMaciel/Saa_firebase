/**
 * Arquivo de Configuração do Firebase
 * Substitua os valores abaixo com as credenciais do seu projeto Firebase.
 * O console do Firebase: https://console.firebase.google.com/
 */

const firebaseConfig = {
  apiKey: "AIzaSyB1SHbPt_Amend9bi2h77-JDjRNjAPaCzs",
  authDomain: "sistema-integrado-af804.firebaseapp.com",
  projectId: "sistema-integrado-af804",
  storageBucket: "sistema-integrado-af804.firebasestorage.app",
  messagingSenderId: "339667952000",
  appId: "1:339667952000:web:9739c6c2edce36a6c1e165"
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
