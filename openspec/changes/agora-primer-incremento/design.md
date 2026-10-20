# Design

## Context

Primer incremento vertical de Ágora. Repositorio sin código de aplicación previo; solo entradas (SOLICITUD.md, referencias, prototipos HTML, Excel del instrumento). OpenSpec 1.14.0 inicializado con schema spec-driven y herramientas para OpenCode. Stack propuesto: React + TypeScript (frontend), Node.js (servidor), WebSockets con recuperación de estado, SQLite local, Docker Compose. Operación sin internet en LAN; imágenes, fuentes y bibliotecas disponibles localmente sin CDN en tiempo de ejecución.

## Goals / Non-Goals

**Goals:**
- Monolito modular con servicio de aplicación y servicio opcional cloudflared.
- Primer recorrido funcional: instrumento mínimo → sala LAN → voto móvil → cierre → consenso persistido → recuperación → exportación de un resultado.
- Operación portátil en Windows, macOS y Linux mediante Docker Compose.
- Persistencia en volumen con copias consistentes y restauración comprobable.

**Non-Goals:**
- Microservicios o infraestructura externa obligatoria sin necesidad demostrada.
- IA durante la ejecución del taller como requisito del MVP.
- Equivalencia completa con el cálculo del Excel en el primer incremento.
- Almacenamiento de datos clínicos personales.
- Cloudflare como requisito obligatorio (opcional para piloto/túnel).

## Decisions

### D1: Stack React + TypeScript + Node.js + SQLite

**Decisión:** Frontend en React + TypeScript, servidor en Node.js, base de datos SQLite local.

**Rationale:** Stack único de lenguaje (TypeScript/JS) reduce costo de coordinación entre agentes. SQLite sin servidor externo cumple operación portátil y sin internet. React permite vistas diferenciadas (participante, facilitador, proyector).

**Alternativas consideradas:** Python + PostgreSQL (descartado por requerir servidor externo y romper portabilidad sin internet); Go + SQLite (descartado por fragmentar el stack de lenguaje).

**Consequences:** Un solo equipo de agentes puede trabajar frontend y backend con el mismo lenguaje. SQLite requiere cuidado en copias consistentes (no copiar archivo abierto directamente).

### D2: Monolito modular con servicio de aplicación y cloudflared opcional

**Decisión:** Un solo servicio de aplicación que expone HTTP y WebSocket; cloudflared como servicio opcional separado para acceso remoto.

**Rationale:** Evita complejidad de orquestación de microservicios. Cloudflared opcional cumple el requisito de acceso temporal de piloto y túnel para eventos recurrentes sin hacerlo obligatorio.

**Alternativas consideradas:** Microservicios por dominio (descartado por complejidad operativa innecesaria en MVP); cloudflared obligatorio (descartado por requerir cuenta y configuración externa).

**Consequences:** Límites claros entre módulos dentro del monolito. Despliegue simplificado a un solo contenedor principal más uno opcional.

### D3: WebSockets con recuperación de estado

**Decisión:** WebSocket para tiempo real (votación, distribución, consenso) con recuperación de estado tras reconexión.

**Rationale:** El facilitador necesita controlar estados de pregunta en tiempo real y los participantes necesitan ver resultados cuando se decide. La recuperación de estado permite reconexión tras desconexión del teléfono o reinicio del servidor.

**Alternativas consideradas:** Polling HTTP (descartado por latencia y carga innecesaria); SSE (descartado por limitación en Quick Tunnels de Cloudflare).

**Consequences:** Necesidad de manejar reconexión, estado de sesión en servidor y reconciliación de votos tras reinicio.

### D4: SQLite con WAL y respaldo consistente

**Decisión:** SQLite en modo WAL con respaldo consistente mediante copia de archivo bloqueado o exportación lógica, no copia directa de archivo abierto.

**Rationale:** Cumple persistencia en volumen y restauración comprobable. Evita el riesgo de respaldos inconsistentes al copiar archivo SQLite abierto.

**Alternativas consideradas:** Copia directa de archivo SQLite (descartado por riesgo de inconsistencia); PostgreSQL (descartado por requisito de servidor externo).

**Consequences:** Procedimiento de respaldo documentado y probado; migraciones versionadas.

### D5: Formato de instrumento basado en JSON interno + mapeo a celdas Excel

**Decisión:** Modelo interno de instrumento en JSON con identificadores estables; mapeo explícito pregunta → celda → regla → dominio → área para exportación a Excel.

**Rationale:** Permite independencia de celdas Excel y numeración visible. Soporta varios instrumentos versionados. El mapeo a celdas permite exportación fiel al formato original.

**Alternativas consideradas:** Modelo directamente basado en celdas Excel (descartado por acoplar el dominio a la plantilla y violar identificadores estables).

**Consequences:** Necesidad de auditoría del instrumento Excel y catálogo de mapeo como documento separado.

### D6: Contratos HTTP + eventos WebSocket derivados de decisiones

**Decisión:** Contratos HTTP para administración y exportación; eventos WebSocket para tiempo real de sala. Ambos derivados de las decisiones de arquitectura y mantenidos alineados.

**Rationale:** Separa operaciones administrativas (HTTP) de operaciones en tiempo real (WebSocket). Evita inventar servicios externos no necesarios.

**Consequences:** Esquemas de eventos y contratos HTTP deben mantenerse versionados y alineados con los módulos del monolito.

## Risks / Trade-offs

- **SQLite concurrencia:** Escrituras concurrentes en SQLite pueden bloquearse. Mitigación: transacciones cortas, regla determinista para carrera envío-cierre, bloqueo a nivel de servidor.
- **Cálculo Excel equivalente:** El primer incremento no certifica equivalencia completa con el Excel. Riesgo de diferencias en fórmulas, rangos y redondeo. Mitigación: auditoría del instrumento, catálogo de mapeo, pruebas de referencia independientes.
- **Operación sin internet:** Todas las dependencias (imágenes, fuentes, bibliotecas) deben empaquetarse localmente. Riesgo de omisión de algún recurso. Mitigación: inventario de dependencias y prueba de arranque LAN sin salida a internet.
- **Votos duplicados:** Una cookie no demuestra una persona única. Mitigación: credencial de participante por sesión, documento que explica alcance real de prevención de duplicados.
