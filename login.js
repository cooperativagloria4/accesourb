// login.js (Versión Compat con Redirección para evitar bloqueos de Popup)

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyAwniFaftFR1cB0K5wWs49SxD26Ydu9-eg",
    authDomain: "sistema-control-acceso-8fef2.firebaseapp.com",
    projectId: "sistema-control-acceso-8fef2",
    storageBucket: "sistema-control-acceso-8fef2.firebasestorage.app",
    messagingSenderId: "704959504175",
    appId: "1:704959504175:web:1045aa93aa2a186f5d0bda"
};

// --- CONFIGURACIÓN DE SEGURIDAD ---
const EMAILS_AUTORIZADOS = [
    "miguel.sanca@ucsp.edu.pe", 
    "otro-admin@gmail.com"
];

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

const googleLoginBtn = document.getElementById('googleLoginBtn');
const errorMessage = document.getElementById('errorMessage');

// --- MANEJAR RESULTADO DE REDIRECCIÓN ---
// Esta parte se ejecuta cuando Google nos devuelve a la página después de loguearnos
auth.getRedirectResult().then(function(result) {
    if (result.user) {
        const email = result.user.email.toLowerCase();
        console.log("Validando correo tras redirección:", email);

        if (EMAILS_AUTORIZADOS.includes(email)) {
            window.location.href = 'admin.html';
        } else {
            auth.signOut().then(() => {
                alert("Acceso denegado: Este correo no es administrador.");
                window.location.reload();
            });
        }
    }
}).catch(function(error) {
    console.error("Error en redirección:", error);
    errorMessage.innerText = "Error: " + error.message;
    errorMessage.classList.remove('hidden');
});

// --- EVENTO DE CLIC ---
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', function() {
        googleLoginBtn.disabled = true;
        googleLoginBtn.innerText = "Redirigiendo a Google...";
        
        // Usamos Redirección en lugar de Popup para evitar errores de COOP y bloqueadores
        auth.signInWithRedirect(provider);
    });
}
