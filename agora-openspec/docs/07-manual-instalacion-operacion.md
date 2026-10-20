# 7. Manual previsto de instalación, operación de taller, respaldo, restauración y solución de fallos

## Requisitos del sistema

- Docker Desktop o Docker Engine + Docker Compose
- Arquitecturas de CPU soportadas: x86_64 (amd64), ARM64 (aarch64/apple silicon)
- Sistema operativo: Windows 10/11, macOS 12+, Linux (distribuciones con Docker soportado)
- Memoria mínima: 2 GB RAM disponible para contenedores
- Espacio en disco: 5 GB libres para imágenes y volumen de persistencia
- Puerto: 3000 (aplicación), configurable

## Instalación

1. Clonar el repositorio o descomprimir el paquete de entrega.
2. Ejecutar `docker compose up -d` en la raíz del proyecto.
3. Verificar que el contenedor principal esté en estado `healthy`.
4. Abrir `http://localhost:3000` para acceder a la interfaz de administración.
5. Generar QR y código de sala desde la vista de facilitador.

## Operación de taller (LAN sin internet)

1. Conectar la computadora anfitriona a la red Wi-Fi local del evento.
2. Verificar que los dispositivos móviles estén en la misma red LAN.
3. Ejecutar `docker compose up -d` (imágenes y bibliotecas disponibles localmente, sin CDN en tiempo de ejecución).
4. Crear un taller: seleccionar instrumento, versión, país/institución, fecha, alcance y facilitador.
5. Mostrar el QR y el código de sala en la pantalla del facilitador o proyector.
6. Los asistentes escanean el QR o escriben el código de sala desde el navegador móvil.
7. El facilitador avanza las preguntas por sus estados: preparación → votación abierta → cierre → discusión → consenso.
8. Al finalizar, el facilitador registra el consenso y la justificación.
9. Exportar los resultados (Excel, PDF, Word) desde la vista de facilitador.

## Red, firewall y aislación de clientes Wi-Fi

- Abrir el puerto 3000 en el firewall de la computadora anfitriona para tráfico LAN entrante.
- Si los clientes Wi-Fi están aislados (AP con aislamiento de cliente), desactivar el aislamiento o configurar el router para permitir tráfico entre clientes y la IP de la anfitriona.
- Realizar una comprobación previa desde un teléfono: abrir `http://<IP-lan>:3000` antes del taller.
- No utilizar `localhost` ni la IP interna del contenedor en el QR; usar siempre la dirección LAN accesible desde el celular.
- Si cambia la dirección LAN, regenerar el QR sin perder la sesión.

## Cloudflare (opcional)

- Cloudflare Quick Tunnels: acceso temporal de piloto. Verificar límites y compatibilidad del transporte, especialmente la ausencia de SSE en Quick Tunnels.
- Para eventos recurrentes: configurar cloudflared como túnel estable.
- Si cambia la URL del túnel, actualizar el QR sin perder la sesión.
- Si se pierde internet, conservar los datos locales y permitir acceso LAN; no prometer migración automática de navegador entre orígenes.

## Respaldos

1. Ejecutar el script de respaldo: `npm run backup` (o equivalente definido en operación Docker).
2. El respaldo es consistente: no se copia directamente un archivo SQLite abierto; se usa exportación lógica o copia de archivo bloqueado.
3. Verificar integridad del respaldo después de generarlo.
4. Almacenar respaldos en el volumen de Docker o en ubicación externa configurada.

## Restauración

1. Detener los contenedores: `docker compose down`.
2. Copiar el respaldo al volumen de persistencia.
3. Ejecutar el script de restauración: `npm run restore` (o equivalente).
4. Iniciar los contenedores: `docker compose up -d`.
5. Verificar que las sesiones, votos, rondas y consenso estén intactos.

## Solución de fallos

| Síntoma | Posible causa | Acción |
|---------|---------------|--------|
| El contenedor no inicia | Puerto 3000 ocupado | Cambiar puerto en `docker-compose.yml` o liberar el puerto |
| Los móviles no escanean el QR | Dirección LAN incorrecta o firewall | Verificar IP LAN, abrir puerto 3000, desactivar aislamiento de clientes Wi-Fi |
| Votos no se confirman | Sin conexión o servidor no respondió | Mostrar pendiente o error; reintentar tras recuperar conexión |
| Sesión se pierde tras reinicio | Persistencia no configurada | Verificar volumen de Docker montado correctamente |
| Exportación vacía o gráficos sin datos | Valores en caché desactualizados | Recalcular valores antes de exportar |
| Cloudflare túnel caído | Conexión a internet perdida | Cambiar a acceso LAN con QR regenerado; sesión conservada localmente |

## Archivos bajo este documento

- `agora-openspec/docs/07-manual-instalacion-operacion.md` (este archivo)
- `docker-compose.yml` (por crear en implementación)
- Scripts de respaldo/restauración (por crear en implementación)
