# Conexión pública y QR

El usuario solicitó sustituir IPs obsoletas por una URL Cloudflare, verificar su disponibilidad y permitir generar otra si deja de funcionar. Eligió explícitamente enlace temporal automático.

La dirección guardada actualmente no se revalida y la detección dentro del contenedor devuelve interfaces Docker. Se incorporará cloudflared como proceso administrado del mismo contenedor, con origen loopback. No se dará acceso al socket Docker. El inicio del contenedor crea un enlace temporal; durante cambios de red se mantiene el proceso y el mismo enlace si se recupera. El administrador puede comprobar y regenerar explícitamente. Reiniciar el proceso temporal implica otra URL, no una dirección permanente.

Solo una comprobación HTTPS de /api/health con identificador de la instancia actual habilita QR y enlace compartible. Se comprueba periódicamente y con botón. No se considera válido solo por aparecer en el registro de cloudflared. Comprobaciones atrasadas no pueden rehabilitar enlaces reemplazados. Si la aplicación no responde, el navegador pide comprobar Docker y la red; no se afirma controlar el motor Docker.

La generación está protegida por sesión administrativa y reintentos con requestId. Se conservan talleres, preguntas, votos y consensos; la anterior URL queda como referencia, nunca como QR verificado. Cada dominio nuevo requiere entrar otra vez y no transfiere cookies entre dominios.

El panel Conexión y QR, accesible en menú y sala, muestra aplicación disponible, estado público, última comprobación y acciones. En modo local sin cloudflared se mantiene configuración LAN, identificando direcciones guardadas que ya no están en las interfaces actuales. Docker no propone sus IP internas como direcciones para teléfonos.

TLS termina en Cloudflare: solo se confían cabeceras reenviadas por loopback y se verifica Origin HTTP y WebSocket. No se desactiva comprobación de origen para permitir Internet. Las credenciales de facilitador existentes se conservan.

Alternativas: un túnel con dominio fijo exige cuenta/dominio y no corresponde a la elección del usuario. Un contenedor auxiliar con socket Docker permitiría reinicios desde UI pero añade privilegios innecesarios. Se utiliza proceso supervisado sin shell y binario oficial con versión fijada.
