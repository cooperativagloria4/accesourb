// app.js (Versión Compat)

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

// Referencias
const logsCol = db.collection("registros_acceso");
const insideCol = db.collection("personas_adentro");

// Elementos del DOM
const dniInput = document.getElementById('dniInput');
const statusMessage = document.getElementById('statusMessage');
const insideList = document.getElementById('insideList');
const insideListMobile = document.getElementById('insideListMobile');
const countInside = document.getElementById('countInside');
const countTotal = document.getElementById('countTotal');
const recentLogs = document.getElementById('recentLogs');
const toggleKeyboard = document.getElementById('toggleKeyboard');
const modalNoDni = document.getElementById('modalNoDni');
const formNoDni = document.getElementById('formNoDni');

// --- LÓGICA DE UI ---

window.abrirModalManual = function(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    modalNoDni.classList.remove('hidden');
    setTimeout(() => {
        const inputNombre = document.getElementById('manualNombre');
        if (inputNombre) inputNombre.focus();
    }, 200);
};

window.cerrarModalManual = function(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    modalNoDni.classList.add('hidden');
    if (dniInput) dniInput.focus();
};

if (toggleKeyboard) {
    toggleKeyboard.onclick = function(e) {
        e.preventDefault(); e.stopPropagation();
        if (dniInput.inputMode === 'none') {
            dniInput.inputMode = 'text';
            dniInput.placeholder = "INGRESE DNI MANUALMENTE";
            toggleKeyboard.innerHTML = '<i class="fas fa-barcode mr-1"></i> Modo Escáner';
            toggleKeyboard.classList.replace('bg-gray-200', 'bg-blue-100');
            toggleKeyboard.classList.replace('text-gray-600', 'text-blue-600');
        } else {
            dniInput.inputMode = 'none';
            dniInput.placeholder = "LISTO PARA ESCANEAR";
            toggleKeyboard.innerHTML = '<i class="fas fa-keyboard mr-1"></i> Activar Teclado Manual';
            toggleKeyboard.classList.replace('bg-blue-100', 'bg-gray-200');
            toggleKeyboard.classList.replace('text-blue-600', 'text-gray-600');
        }
        dniInput.focus();
    };
}

document.addEventListener('click', function() {
    if (modalNoDni && modalNoDni.classList.contains('hidden') && dniInput.inputMode === 'none') {
        dniInput.focus();
    }
});

if (dniInput) {
    dniInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const rawValue = dniInput.value.trim().toUpperCase();
            if (rawValue) {
                dniInput.disabled = true;
                procesarDNI(parsearPDF417(rawValue)).then(() => {
                    dniInput.value = '';
                    dniInput.disabled = false;
                    dniInput.focus();
                });
            }
        }
    });

    dniInput.addEventListener('blur', function() {
        if (dniInput.inputMode === 'none' && modalNoDni.classList.contains('hidden')) {
            setTimeout(() => dniInput.focus(), 150);
        }
    });
}

if (formNoDni) {
    formNoDni.onsubmit = function(e) {
        e.preventDefault();
        const nombre = document.getElementById('manualNombre').value.trim();
        const id = document.getElementById('manualId').value.trim();
        const obs = document.getElementById('manualObs').value.trim();

        if (nombre) {
            procesarDNI({
                dni: id || null,
                nombre: nombre,
                apellido: '',
                observacion: obs
            }).then(() => {
                formNoDni.reset();
                window.cerrarModalManual();
            });
        }
    };
}

// --- ESCUCHA DE DATOS ---

function iniciarEscucha() {
    console.log("Iniciando escucha de datos en tiempo real...");

    // 1. Escuchar personas adentro
    insideCol.onSnapshot(function(snapshot) {
        console.log("Actualización en 'personas_adentro'. Total:", snapshot.size);
        insideList.innerHTML = '';
        insideListMobile.innerHTML = '';
        countInside.innerText = snapshot.size;

        if (snapshot.empty) {
            const emptyMsg = '<div class="py-10 text-center text-gray-400">No hay personas adentro</div>';
            insideList.innerHTML = `<tr><td colspan="4">${emptyMsg}</td></tr>`;
            insideListMobile.innerHTML = emptyMsg;
            return;
        }

        snapshot.forEach(function(doc) {
            const data = doc.data();
            // Manejar timestamp de forma segura (puede ser null un instante mientras se sincroniza)
            let hora = "...";
            if (data.hora_entrada) {
                try {
                    hora = data.hora_entrada.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                } catch(e) { console.log("Esperando sincronización de hora..."); }
            }
            const nombreDisplay = data.nombre || 'S/N';

            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50 transition';
            row.innerHTML = `
                <td class="py-3 px-6 text-left font-medium text-gray-800">${nombreDisplay}</td>
                <td class="py-3 px-6 text-left">${data.dni}</td>
                <td class="py-3 px-6 text-center">${hora}</td>
            `;
            insideList.appendChild(row);

            const esManual = data.es_manual ? '<span class="ml-2 text-[10px] bg-orange-100 text-orange-600 px-1 rounded">MANUAL</span>' : '';
            const card = document.createElement('div');
            card.className = 'bg-gray-50 p-4 rounded-lg border border-gray-200';
            card.innerHTML = `
                <div>
                    <div class="font-bold text-gray-800">${nombreDisplay}${esManual}</div>
                    <div class="text-xs text-gray-500">DNI: ${data.dni} • Entró: ${hora}</div>
                    ${data.observacion ? `<div class="text-[10px] text-gray-400 italic">Obs: ${data.observacion}</div>` : ''}
                </div>
            `;
            insideListMobile.appendChild(card);
        });
    }, function(error) {
        console.error("Error en listener de personas_adentro:", error);
    });

    // 2. Escuchar historial reciente y contar totales de hoy
    const hoyInicio = new Date();
    hoyInicio.setHours(0,0,0,0);

    logsCol.orderBy("fecha", "desc").onSnapshot(function(snapshot) {
        console.log("Actualización en historial.");
        recentLogs.innerHTML = '';
        let totalHoy = 0;

        snapshot.forEach(function(doc) {
            const data = doc.data();
            const fecha = data.fecha ? data.fecha.toDate() : null;

            // Contar si es entrada de hoy
            if (fecha && fecha >= hoyInicio && data.tipo === 'ENTRADA') {
                totalHoy++;
            }

            // Mostrar solo los últimos 5 en la lista visual
            if (recentLogs.children.length < 5) {
                const item = document.createElement('div');
                const horaStr = fecha ? fecha.toLocaleTimeString() : '...';
                const color = data.tipo === 'ENTRADA' ? 'text-green-600' : 'text-orange-600';
                const icon = data.tipo === 'ENTRADA' ? '→' : '←';
                item.className = 'flex justify-between items-center p-2 bg-gray-50 rounded text-sm';
                item.innerHTML = `
                    <div class="flex flex-col">
                        <span><strong class="${color}">${icon} ${data.tipo}</strong>: ${data.nombre || 'S/N'}</span>
                        <span class="text-[10px] text-gray-400">DNI: ${data.dni || 'S/N'}</span>
                    </div>
                    <span class="text-gray-400 text-xs">${horaStr}</span>
                `;
                recentLogs.appendChild(item);
            }
        });

        countTotal.innerText = totalHoy;
    }, function(error) {
        console.error("Error en listener de historial:", error);
        // Si falla por falta de índice, mostrar mensaje útil
        if (error.code === 'failed-precondition') {
            console.warn("Falta crear un índice en Firestore para ordenar por fecha.");
        }
    });
}

// --- FUNCIONES CORE ---

function parsearPDF417(raw) {
    if (raw.includes('@')) {
        const parts = raw.split('@');
        if (parts.length >= 5) return { dni: parts[4].trim(), apellido: parts[1].trim(), nombre: parts[2].trim() };
    }
    if (raw.includes('|')) {
        const parts = raw.split('|');
        if (parts.length >= 3) return { dni: parts[0].trim(), apellido: parts[1].trim(), nombre: parts[2].trim() };
    }
    return { dni: raw, nombre: 'S/N', apellido: '' };
}

async function procesarDNI(persona) {
    const { dni, nombre, apellido, observacion } = persona;
    const nombreCompleto = `${nombre} ${apellido}`.trim();
    const idUnico = dni || `MAN-${Date.now()}`;
    
    showStatus(`Procesando...`, 'blue');
    
    try {
        const q = dni ? insideCol.where("dni", "==", dni) : insideCol.where("nombre", "==", nombreCompleto).where("es_manual", "==", true);
        const querySnapshot = await q.get();

        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0];
            const data = docRef.data();
            
            // Guardar salida con referencia a la hora de entrada original para permitir anulaciones
            await logsCol.add({ 
                dni: data.dni || 'S/N', 
                nombre: data.nombre || nombreCompleto, 
                tipo: 'SALIDA', 
                fecha: firebase.firestore.FieldValue.serverTimestamp(), 
                hora_entrada_original: data.hora_entrada || null,
                duracion_estadia: calcularEstadia(data.hora_entrada), 
                es_manual: data.es_manual || false 
            });
            
            await insideCol.doc(docRef.id).delete();
            showStatus(`SALIDA: ${data.nombre || dni}`, 'orange');
            playBeep(440, 200);
        } else {
            // --- ENTRADA ---
            const entryData = { 
                dni: dni || 'S/N', 
                nombre: nombreCompleto, 
                tipo: 'ENTRADA', 
                fecha: firebase.firestore.FieldValue.serverTimestamp(), 
                es_manual: !dni 
            };
            if (observacion) entryData.observacion = observacion;
            
            console.log("Registrando entrada para:", nombreCompleto);
            
            // Usar una transacción o promesas paralelas para asegurar ambos registros
            await Promise.all([
                logsCol.add(entryData),
                insideCol.doc(idUnico).set({ 
                    dni: dni || 'S/N', 
                    nombre: nombreCompleto, 
                    hora_entrada: firebase.firestore.FieldValue.serverTimestamp(), 
                    es_manual: !dni, 
                    observacion: observacion || '' 
                })
            ]);

            showStatus(`ENTRADA: ${nombreCompleto}`, 'green');
            playBeep(880, 150);
        }
    } catch (error) {
        console.error("Error detallado:", error);
        // Mostrar mensaje más descriptivo
        let msg = "Error de conexión";
        if (error.code === 'permission-denied') msg = "Error: Permisos denegados (Revisa las Reglas de Firestore)";
        if (error.code === 'not-found') msg = "Error: Colección no encontrada";
        
        showStatus(msg, "red");
        playBeep(220, 500);
    }
}

// --- AUXILIARES ---

let audioCtx = null;
function playBeep(frequency, duration) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        setTimeout(() => osc.stop(), duration);
    } catch (e) {}
}

function showStatus(msg, color) {
    if (!statusMessage) return;
    statusMessage.innerText = msg;
    statusMessage.className = `p-3 rounded-lg text-center font-medium block`;
    const colors = { green: ['bg-green-100', 'text-green-700'], orange: ['bg-orange-100', 'text-orange-700'], red: ['bg-red-100', 'text-red-700'], blue: ['bg-blue-100', 'text-blue-700'] };
    statusMessage.classList.add(...colors[color]);
    setTimeout(() => statusMessage.classList.add('hidden'), 4000);
}

function calcularEstadia(entrada) {
    if (!entrada) return "N/A";
    const diff = new Date() - entrada.toDate();
    const mins = Math.floor(diff / 60000);
    const horas = Math.floor(mins / 60);
    return horas > 0 ? `${horas}h ${mins % 60}m` : `${mins}m`;
}

// Iniciar procesos
iniciarEscucha();
