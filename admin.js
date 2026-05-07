// admin.js (Versión Compat)

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
const db = firebase.firestore();
const auth = firebase.auth();

// --- PROTECCIÓN DE RUTA ---
auth.onAuthStateChanged(function(user) {
    if (!user) {
        window.location.href = 'login.html';
    }
});

// Función de Cerrar Sesión
window.cerrarSesion = function() {
    auth.signOut().then(function() {
        window.location.href = 'login.html';
    }).catch(function(error) {
        console.error("Error al cerrar sesión:", error);
    });
};

// Referencias
const logsCol = db.collection("registros_acceso");
const insideCol = db.collection("personas_adentro");

// Elementos DOM
const adminInsideList = document.getElementById('adminInsideList');
const adminFullLogs = document.getElementById('adminFullLogs');
const statInside = document.getElementById('statInside');
const statTodayEntries = document.getElementById('statTodayEntries');
const statTodayExits = document.getElementById('statTodayExits');
const currentMonthDisplay = document.getElementById('currentMonthDisplay');

// --- CÁLCULO DE FECHAS ---
const hoy = new Date();
const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

if (currentMonthDisplay) {
    const nombreMes = hoy.toLocaleString('es', { month: 'long' });
    currentMonthDisplay.innerText = `${nombreMes} ${hoy.getFullYear()}`;
}

// --- ACTUALIZACIONES EN TIEMPO REAL ---

// 1. Personas Adentro
insideCol.onSnapshot(function(snapshot) {
    adminInsideList.innerHTML = '';
    statInside.innerText = snapshot.size;

    if (snapshot.empty) {
        adminInsideList.innerHTML = '<tr><td colspan="4" class="p-10 text-center text-gray-400">No hay personas en el recinto</td></tr>';
        return;
    }

    snapshot.forEach(function(docSnap) {
        const data = docSnap.data();
        const row = document.createElement('tr');
        const hora = data.hora_entrada ? data.hora_entrada.toDate().toLocaleTimeString() : '...';
        
        row.innerHTML = `
            <td class="p-4 font-medium text-gray-900">${data.nombre || 'S/N'}</td>
            <td class="p-4 text-gray-500">${data.dni}</td>
            <td class="p-4 text-gray-500">${hora}</td>
            <td class="p-4 text-center">
                <button onclick="borrarPersonaAdentro('${docSnap.id}')" class="text-red-500 hover:text-red-700 p-2">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        adminInsideList.appendChild(row);
    });
});

// 2. Historial Mensual
logsCol.where("fecha", ">=", primerDiaMes)
       .where("fecha", "<=", ultimoDiaMes)
       .orderBy("fecha", "desc")
       .onSnapshot(function(snapshot) {
    adminFullLogs.innerHTML = '';
    let entriesToday = 0;
    let exitsToday = 0;
    const fechaHoy = new Date();
    fechaHoy.setHours(0,0,0,0);

    if (snapshot.empty) {
        adminFullLogs.innerHTML = '<tr><td colspan="4" class="p-10 text-center text-gray-400">No hay registros este mes</td></tr>';
        return;
    }

    snapshot.forEach(function(docSnap) {
        const data = docSnap.data();
        const fecha = data.fecha ? data.fecha.toDate() : null;
        
        if (fecha && fecha >= fechaHoy) {
            if (data.tipo === 'ENTRADA') entriesToday++;
            else exitsToday++;
        }

        const row = document.createElement('tr');
        const fechaHora = fecha ? fecha.toLocaleString([], {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'}) : '...';
        const badgeColor = data.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';

        row.innerHTML = `
            <td class="p-4 text-gray-400 text-xs">${fechaHora}</td>
            <td class="p-4">
                <span class="px-2 py-1 rounded-full text-xs font-bold ${badgeColor}">${data.tipo}</span>
            </td>
            <td class="p-4 font-medium">
                ${data.nombre || 'S/N'}
                <div class="text-[10px] text-gray-400 font-normal">DNI: ${data.dni}</div>
            </td>
            <td class="p-4 text-center">
                <button onclick="borrarLog('${docSnap.id}')" class="text-gray-300 hover:text-red-500 p-2">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        adminFullLogs.appendChild(row);
    });

    statTodayEntries.innerText = entriesToday;
    statTodayExits.innerText = exitsToday;
});

// --- FUNCIONES DE GESTIÓN ---

window.mantenimientoBorrarMes = function() {
    const nombreMes = hoy.toLocaleString('es', { month: 'long' });
    if (confirm(`⚠️ MANTENIMIENTO: ¿Desea eliminar TODOS los registros de ${nombreMes.toUpperCase()}?`)) {
        logsCol.where("fecha", ">=", primerDiaMes)
               .where("fecha", "<=", ultimoDiaMes)
               .get()
               .then(function(snapshot) {
            if (snapshot.empty) {
                alert("No hay registros para borrar.");
                return;
            }
            const batch = db.batch();
            snapshot.forEach(function(doc) {
                batch.delete(doc.ref);
            });
            return batch.commit();
        }).then(function() {
            alert("Mantenimiento completado.");
        }).catch(function(error) {
            console.error(error);
            alert("Error al realizar mantenimiento.");
        });
    }
};

window.borrarPersonaAdentro = function(docId) {
    if (confirm('¿Desea eliminar a esta persona de la lista de presentes?')) {
        insideCol.doc(docId).delete().catch(function(error) {
            console.error(error);
            alert("Error al borrar.");
        });
    }
};

window.borrarLog = function(docId) {
    if (confirm('¿Desea eliminar este registro permanentemente?')) {
        logsCol.doc(docId).delete().catch(function(error) {
            console.error(error);
            alert("Error al borrar log.");
        });
    }
};
