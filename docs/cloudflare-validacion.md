# Conexión Cloudflare — validación del 27 de octubre de 2026

## Entrega

Panel /conexion en el menú y dentro de cada sala. Muestra disponibilidad de la aplicación, estado del enlace público y última comprobación. Permite comprobar y generar otra dirección desde la instalación local. Docker utiliza cloudflared oficial 2026.10.4 en el mismo contenedor, sin socket Docker ni privilegios adicionales. El origen es loopback.

El QR y joinUrl usan únicamente el enlace cuya sonda HTTPS devuelve la identidad efímera de esta instancia. Comprobaciones cada 15 segundos con timeout de cinco segundos. Fallos, caída del proceso y resultados de una generación anterior no habilitan el QR. Se conserva la última dirección verificada como referencia, sin publicarla como enlace válido tras reinicio. Una dirección LAN guardada de otra red se invalida en la ejecución local. Las interfaces Docker ya no se proponen como direcciones para celulares.

## Evidencia local

- 45 pruebas Node aprobadas: almacenamiento, catálogo, Excel, HTTP/WS, supervisor y sonda real sobre HTTP local.
- 5 recorridos de navegador aprobados. La pantalla de conexión detecta desconexión del navegador y recuperación, sin conservar disponibilidad falsa. La sala oculta su QR si pierde contacto con la aplicación.
- Compilación TypeScript/Vite y construcción Docker correctas. Seis cambios OpenSpec válidos.
- Revisión independiente sin hallazgos importantes pendientes; revisión adicional de certificados y del lector de URL.

## Evidencia externa

Se probó Cloudflare real con la imagen final. La sonda pública y local corresponden a la misma instancia. El navegador completó acceso administrativo por HTTPS, comprobación de cookie HttpOnly/Secure, lectura del QR y WebSocket wss autenticado con notificación real. Se comprobó una regeneración real solicitada dos veces con el mismo requestId: nueva dirección disponible y QR actualizado. Las capturas muestran panel local y panel público.

La generación está deshabilitada desde la propia dirección trycloudflare.com: se debe usar la dirección local para poder conocer la nueva URL después de cerrar la anterior. Comprobar conexión sigue disponible en la dirección pública.

## Problemas encontrados y correcciones

1. node:26-slim no contenía /etc/ssl/certs/ca-certificates.crt. cloudflared falló al validar el certificado de api.trycloudflare.com. Se copia el paquete oficial de certificados desde la misma imagen Cloudflare. No se desactiva TLS.
2. El mensaje de error incluía la URL de la API; se excluyen api/www al detectar/restaurar enlaces. Regresión observada fallar y pasar con proceso hijo real de prueba. Esa URL nunca se publicó como QR porque no pasaba la comprobación de instancia.
3. El DNS de la red devolvía ENOTFOUND mientras el DNS público de Cloudflare ya publicaba las direcciones. Se verificó la diferencia consultando ambos y se configuró DNS 1.1.1.1/1.0.0.1 solo en Compose. No se cambia el DNS de la computadora ni los teléfonos. La posterior comprobación pública y de navegador pasó sin sobrescribir DNS del navegador.

## Datos y límites

Respaldo consistente previo en /app/data/pre-cloudflare-2026-10-27.sqlite y respaldo separado local. Docker conserva los tres talleres y sus dos versiones de catálogo y recibo de importación. Durante la validación se registró avance nuevo de un participante (respuesta y consenso); las pruebas externas solo iniciaron sesión y leyeron estado, sin crear talleres ni votar. La instalación local conserva su taller, dos envíos y consenso. Integridad SQLite ok.

El enlace es temporal y requiere Internet, Cloudflare disponible y Docker ejecutándose. Un reinicio de cloudflared crea otro hostname. Cambiar de dominio requiere entrar de nuevo; las cookies y credenciales de participante no se transfieren entre dominios, mientras el historial persistido permanece. No se afirma continuidad de servicio ni pruebas con una desconexión física de la red del usuario. Validación funcional del usuario pendiente.

Referencia del proveedor: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/

Postman CLI también comprobó la URL pública final con api/check-health.postman.js: HTTP 200, aplicación ok e identificador de instancia, 3/3 aserciones y salida 0. Comparación final contra respaldo: se conservaron las filas anteriores de talleres, rondas, versiones, recibos, participantes, envíos y consensos. Solo las fases/pregunta activa cambiaron por avance del taller y se agregaron la participación, respuesta y consenso nuevos.
