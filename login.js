// login.js (Versión Compat con Ventana Emergente)

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyClx-W0EMOE5OaPutrlUklwBlIw9B36B5w",
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
provider.setCustomParameters({ prompt: 'select_account' });

const googleLoginBtn = document.getElementById('googleLoginBtn');
const errorMessage = document.getElementById('errorMessage');

console.log("Sistema de login cargado (Modo Ventana Emergente).");

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', function() {
        console.log("Iniciando proceso de login...");
        
        googleLoginBtn.disabled = true;
        googleLoginBtn.innerText = "Verificando cuenta...";
        errorMessage.classList.add('hidden');

        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(function() {
                // Volvemos a usar la ventana emergente original
                return auth.signInWithPopup(provider);
            })
            .then(function(result) {
                const email = result.user.email.toLowerCase();
                console.log("Validando correo:", email);

                if (EMAILS_AUTORIZADOS.includes(email)) {
                    console.log("Acceso concedido.");
                    window.location.href = 'admin.html';
                } else {
                    console.warn("Correo no autorizado.");
                    return auth.signOut().then(() => {
                        throw { code: 'auth/unauthorized-email' };
                    });
                }
            })
            .catch(function(error) {
                console.error("Error en login:", error);
                googleLoginBtn.disabled = false;
                googleLoginBtn.innerHTML = `
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5 mr-3" alt="Google logo">
                    Iniciar sesión con Google
                `;

                let mensaje = "Error al iniciar sesión.";
                
                if (error.code === 'auth/unauthorized-email') {
                    mensaje = "Lo sentimos, este correo no tiene permisos de administrador.";
                } else if (error.code === 'auth/popup-blocked') {
                    mensaje = "¡Atención! Tu navegador bloqueó la ventana de Google.";
                    alert(mensaje);
                } else {
                    mensaje = "Error: " + (error.message || error.code);
                }

                errorMessage.innerText = mensaje;
                errorMessage.classList.remove('hidden');
            });
    });
}
