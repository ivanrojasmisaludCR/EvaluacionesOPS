# QR en la proyección

Solicitud explícita: quienes votan deben poder ver y escanear el QR desde la pantalla proyectada.

- P1: ampliar el estado HTTP del proyector con joinUrl y QR del enlace compartible vigente. Mantener la credencial de proyección separada y los controles de conexión exclusivos del facilitador. Archivos server/app.ts, api/conexion.md, tests/http.test.ts. Responsable coordinador/integrador, rol API. Dependencia: verificación de enlace existente. Aceptación: QR apunta a /participar/CODIGO y desaparece si el enlace no está verificado.
- P2: tarjeta visible en la proyección con QR grande, código y dirección alternativa, junto a pregunta/resultados. Archivos client/Participant.tsx y client/style.css. Responsable coordinador/integrador, rol Interfaz. Aceptación: visible durante el taller y sin desbordamiento móvil; oculta QR/enlace al perder conexión con la aplicación.
- P3: pruebas HTTP y recorrido real de navegador con proyector en contexto separado, reconexión, captura y revisión independiente. Actualizar Docker conservando el volumen. Documentar resultado y URL vigente porque recrear el contenedor cambia el enlace temporal.
