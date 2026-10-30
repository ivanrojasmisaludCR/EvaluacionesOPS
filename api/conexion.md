# Conexión y dirección del QR

El modo Docker usa Cloudflare temporal. El modo local sin supervisor conserva LAN. Las operaciones requieren cookie administrativa y mantienen validación de Origin.

- GET /api/config conserva publicUrl y suggestions; añade manualUrl, urlLocked y connection. publicUrl es la URL efectiva o cadena vacía si no está comprobada. Docker no propone IPs internas.
- connection: mode (cloudflare/manual), status (starting/checking/online/offline/error/disabled/stale/configured), enabled, url, lastUrl, checkedAt, error, application (online), runtime (docker/local). La aplicación online indica que respondió el backend, no una inspección independiente del motor Docker.
- POST /api/conexion/comprobar con {}: ejecuta comprobación acotada y devuelve configuración actual. Una respuesta HTTP correcta de otra instalación no valida la URL.
- POST /api/conexion/generar con {requestId}: 202 inicia/reinicia cloudflared sin esperar publicación DNS. requestId ASCII 8–80, reintento no genera otro proceso. 409 si Cloudflare no está habilitado o URL fijada por configuración. Solo administrador.
- PATCH /api/config sigue disponible en LAN, bloqueada en modo Cloudflare. No acepta localhost como dirección compartible.
- GET /api/health público añade instanceId opaco y efímero, sin datos de talleres. La sonda espera status ok e instanceId de esta instancia, sin redirecciones y con timeout.

El estado del taller añade connection solo al facilitador. joinUrl y qr son nulos si el enlace Cloudflare no está verificado. Cambios de estado avisan por WebSocket y la lectura HTTP recupera datos. El proyector y participantes no reciben controles ni dirección anterior.

El cambio de dominio no transporta cookies. El estado anterior de talleres persiste en SQLite y la última URL verificada se conserva únicamente como referencia. Un reinicio crea otra URL temporal; una pérdida breve de red intenta recuperar el mismo proceso/enlace. El botón permite reemplazarlo sin borrar talleres.

La regeneración se realiza desde la dirección local de la instalación. Desde un hostname trycloudflare.com devuelve 409 REGENERACION_LOCAL: al cerrar el túnel anterior esa misma pestaña perdería acceso antes de conocer la nueva dirección. La interfaz lo explica y conserva Comprobar conexión disponible por Internet.

Docker utiliza los resolvedores públicos 1.1.1.1 y 1.0.0.1 para las direcciones de Internet del túnel. Esto evita depender de un DNS LAN que conserve respuestas negativas después de cambiar de red. No se modifica el DNS de la computadora ni de los teléfonos; deben poder resolver la dirección compartida.

## QR en proyección

El estado de sala incluye joinUrl y qr también para el proyector autenticado, con la misma regla de disponibilidad que el facilitador. La URL siempre lleva a /participar/CODIGO. No incluye la credencial de proyección ni controles de conexión. Participantes no reciben esos campos. La vista de proyección oculta el QR y enlace si pierde contacto con la aplicación, aunque conserve resultados previos para consulta.
