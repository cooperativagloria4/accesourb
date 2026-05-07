// login.js (Versión Compat para máxima compatibilidad)

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyAwniFaftFR1cB0K5wWs49SxD26Ydu9-eg",
    authDomain: "sistema-control-acceso-8fef2.firebaseapp.com",
    projectId: "sistema-control-acceso-8fef2",
    storageBucket: "sistema-control-acceso-8fef2.firebasestorage.app",
    messagingSenderId: "704959504175",
    appId: "1:704959504175:web:1045aa93aa2a186f5d0bda"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const googleLoginBtn = document.getElementById('googleLoginBtn');
const errorMessage = document.getElementById('errorMessage');

console.log("Sistema de login cargado.");

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', function() {
        console.log("Iniciando proceso de login...");
        
        // Feedback visual inmediato
        googleLoginBtn.disabled = true;
        googleLoginBtn.innerText = "Abriendo Google...";
        errorMessage.classList.add('hidden');

        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(function() {
                return auth.signInWithPopup(provider);
            })
            .then(function(result) {
                console.log("Login exitoso para:", result.user.email);
                window.location.href = 'admin.html';
            })
            .catch(function(error) {
                console.error("Error en login:", error);
                googleLoginBtn.disabled = false;
                googleLoginBtn.innerHTML = `
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5 mr-3" alt="Google logo">
                    Iniciar sesión con Google
                `;

                let mensaje = "Error al iniciar sesión.";
                
                if (error.code === 'auth/popup-blocked') {
                    mensaje = "¡Atención! Tu navegador bloqueó la ventana de Google. Por favor, habilita las ventanas emergentes (popups) arriba a la derecha.";
                    alert(mensaje);
                } else if (error.code === 'auth/operation-not-allowed') {
                    mensaje = "El inicio con Google no está habilitado en la consola de Firebase.";
                } else {
                    mensaje = "Error: " + error.message;
                }

                errorMessage.innerText = mensaje;
                errorMessage.classList.remove('hidden');
            });
    });
} else {
    alert("Error crítico: No se encontró el botón de login.");
}
