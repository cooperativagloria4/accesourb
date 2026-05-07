# Sistema de Control de Acceso - Urbanización

Sistema web para el registro de entrada y salida de personas mediante escaneo de DNI (lector de código de barras Bluetooth) o registro manual.

## 🚀 Características
- **Optimizado para Móviles**: Interfaz responsiva diseñada para vigilantes.
- **Escaneo de DNI**: Soporta lectores Bluetooth (teclado virtual bloqueado para fluidez).
- **Registro Manual**: Formulario para personas sin DNI o visitas especiales.
- **Panel Administrativo**: Acceso con Google Auth, estadísticas mensuales y mantenimiento.
- **Base de Datos en Tiempo Real**: Sincronización inmediata con Firebase Firestore.

## 🛠️ Instalación
1. Clona el repositorio.
2. Crea un proyecto en [Firebase](https://console.firebase.google.com/).
3. Habilita **Firestore** y **Google Auth**.
4. Copia tu `firebaseConfig` en los archivos `app.js`, `admin.js` y `login.js`.
5. Abre `index.html` en un navegador (se recomienda usar un servidor local).

## 🔒 Seguridad
- Los vigilantes solo pueden registrar movimientos.
- Solo el administrador puede borrar o modificar registros desde el panel protegido.
