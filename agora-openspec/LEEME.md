# Ágora: paquete de entrada para OpenSpec y OpenCode

Este paquete contiene una solicitud de planificación, los archivos fuente originales y dos prototipos visuales exportados. No contiene todavía las especificaciones generadas por OpenSpec ni una aplicación desarrollada.

## Uso

1. Descomprime esta carpeta y colócala como `agora-openspec/` dentro del repositorio donde desarrollarás el proyecto.
2. Abre OpenCode en la raíz de ese repositorio.
3. Si OpenSpec todavía no está preparado, sigue su instalación oficial y ejecuta `openspec init`, seleccionando OpenCode. Si ya existe configuración, reutilízala.
4. Envía el siguiente mensaje a OpenCode:

> Lee `agora-openspec/SOLICITUD.md` y los archivos de `agora-openspec/referencias/`. Usa OpenSpec para generar la planificación solicitada y preparar el trabajo con agentes de OpenCode. Inspecciona las versiones y la configuración existentes, crea los documentos y valida los artefactos. No implementes aún la aplicación. Entrega el índice, las tareas, la estrategia de pruebas y las decisiones que requieren mi revisión.

Los comandos dependen de la instalación. La documentación consultada usa `opsx-propose` para herramientas como OpenCode cuando se generaron archivos con ese nombre. Utiliza el comando que aparezca realmente en OpenCode; no asumas que las formas con dos puntos y guion son intercambiables. El perfil expandido agrega comandos que no siempre vienen activos.

## Referencias visuales

Puedes abrir los dos HTML en un navegador. Conservan las interacciones de demostración. El estilo y los iconos del contenedor de vista previa pueden depender de recursos externos; este detalle no cumple el requisito de operación sin internet de la aplicación futura. No reutilices sin revisión el contenedor de demostración como base del producto.

Los prototipos no transmiten votos entre dispositivos y su QR es ilustrativo. Sus resúmenes no sustituyen el texto del instrumento original.

## Fuentes técnicas consultadas

- OpenSpec, comandos: https://github.com/Fission-AI/OpenSpec/blob/main/docs/commands.md
- OpenSpec, herramientas e invocación: https://github.com/Fission-AI/OpenSpec/blob/main/docs/supported-tools.md
- OpenCode, agentes: https://opencode.ai/docs/agents/
- Cloudflare, Quick Tunnels: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/

Consulta realizada el 20 de octubre de 2026. Verifica compatibilidad con las versiones realmente instaladas.
