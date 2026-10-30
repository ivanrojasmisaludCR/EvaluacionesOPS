# QR en proyección — 28 de octubre de 2026

La pantalla proyectada muestra una tarjeta con QR grande, código de sala y URL de participación, junto a la pregunta y resultados. En móvil la tarjeta aparece primero. La tarjeta permanece visible al recorrer resultados; el QR y enlace se ocultan si deja de estar disponible la URL compartible o se pierde conexión con la aplicación.

El QR dirige a /participar/CODIGO y nunca contiene el token del proyector. La credencial de proyección y los controles de conexión siguen siendo exclusivos del facilitador; el proyector solo recibe la imagen y dirección de entrada públicas. No se agregan permisos de escritura.

## Verificación

- Compilación TypeScript/Vite y reconstrucción Docker aprobadas.
- 45 pruebas Node aprobadas, incluyendo QR del proyector, ausencia de controles/credencial administrativa y retirada al fallar Cloudflare.
- 6 recorridos de navegador aprobados; nuevo caso con proyector en contexto separado, QR, código, URL, ocultamiento al desconectar y recuperación al reconectar.
- Capturas desktop (1440 píxeles) y móvil (390) revisadas sin desbordamientos.
- Revisión independiente sin hallazgos importantes. Se corrigió una frase antigua del contrato E1 que no contemplaba QR para proyector.
- Seis cambios OpenSpec válidos.
- Verificación real tras actualizar Docker: QR visible con URL Cloudflare actual, entrada de participantes accesible por HTTPS y sin controles de votación en proyección. No se crearon participantes ni votos en esa prueba externa.

## Operación y datos

Se respaldó SQLite antes de actualizar: /app/data/pre-projector-qr-2026-10-28.sqlite. Se conservaron 3 talleres, 1 envío y 1 consenso, con integridad ok. No hay migración ni nuevas dependencias de aplicación.

Al recrear Docker cambió la dirección temporal de Cloudflare. El enlace inicial no se recuperó al arrancar; se comprobó conectividad del proveedor y se regeneró mediante el endpoint ya implementado. El nuevo enlace quedó verificado y el QR de proyección se comprobó con él. La vista no muestra QR mientras la dirección permanece fuera de servicio.

Para ver la actualización en una ventana de proyección ya abierta, recargarla o abrirla de nuevo desde «Abrir proyector». Validación del usuario pendiente.
