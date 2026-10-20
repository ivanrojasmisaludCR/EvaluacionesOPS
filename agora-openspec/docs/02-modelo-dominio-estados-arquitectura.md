# 2. Modelo de dominio, diagrama de estados y decisiones de arquitectura

## Modelo de dominio (entidades y límites)

### Instrumento
- `instrumentId`: identificador interno estable del instrumento
- `version`: versión semántica del instrumento
- `areas[]`: lista de áreas
- `domains[]`: lista de dominios
- `questions[]`: lista de preguntas con `questionId`, `domainId`, `areaId`, `type` (madurez | seleccion-multiple | texto), `texto`, `ordenVisible`

### Pregunta de madurez
- `levels[1..5]`: exactamente cinco descriptores no vacíos, uno por nivel entero
- `scale`: fija [1, 2, 3, 4, 5]; no permite nivel 6, ni eliminar niveles, ni alterar orden

### Pregunta de selección múltiple / texto
- `options[]`: para selección múltiple, lista de opciones de respuesta
- No se asigna puntaje numérico por defecto

### Taller (sesión)
- `sessionId`: identificador de sesión
- `instrumentId`, `instrumentVersion`: versión del instrumento en vigor
- `pais`, `institucion`, `fecha`, `alcance`, `facilitador`
- `salaCode`: código de sala
- `estado`: borrador | activa | pausada | cerrada | archivada

### Pregunta activa (por sala)
- `questionId`: pregunta en curso
- `estado`: preparacion | votacion-abierta | cerrado | discusion | consenso
- `rondaActual`: número de ronda vigente

### Voto
- `voteId`, `sessionId`, `questionId`, `ronda`, `participantId`, `valor`, `estado` (no-aplica | no-se | abstencion | falta-respuesta | 1-5), `timestamp`, `historial[]`

### Consenso
- `consensusId`, `sessionId`, `questionId`, `nivelAcordado`, `justificacion`, `autor`, `fecha`, `estado` (vigente | pendiente-evidencia | revisado), `revisiones[]`

## Diagrama de estados (pregunta por sala)

```
[preparacion] --[facilitador abre votación]--> [votacion-abierta]
[votacion-abierta] --[facilitador cierra]--> [cerrado]
[cerrado] --[facilitador abre discusión]--> [discusion]
[discusion] --[facilitador registra consenso]--> [consenso]
[consenso] --[nueva ronda]--> [preparacion]
[consenso] --[re-votación]--> [consenso + nueva revisión]
```

Cualquier transición inválida es rechazada por el servidor.

## Decisiones de arquitectura (resumen)

| ID | Decisión | Rationale | Consecuencia |
|----|----------|-----------|--------------|
| D1 | React + TypeScript + Node.js + SQLite | Stack único, portabilidad sin internet | Un solo equipo de agentes frontend/backend |
| D2 | Monolito modular + cloudflared opcional | Evita complejidad de microservicios | Despliegue simplificado; cloudflared no obligatorio |
| D3 | WebSockets con recuperación de estado | Tiempo real para facilitador y participantes | Manejo de reconexión y estado en servidor |
| D4 | SQLite WAL + respaldo consistente | Persistencia portable y consistente | Procedimiento de respaldo documentado; no copiar archivo abierto |
| D5 | Modelo JSON interno + mapeo a celdas Excel | Identificadores estables independientes de Excel | Auditoría y catálogo de mapeo como documentos separados |
| D6 | Contratos HTTP + eventos WebSocket derivados | Separa administración de tiempo real | Esquemas versionados y alineados |

## Archivos bajo este documento

- `openspec/changes/agora-primer-incremento/design.md`
- `agora-openspec/docs/02-modelo-dominio-estados-arquitectura.md` (este archivo)
