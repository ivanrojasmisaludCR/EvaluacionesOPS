# 3. Contratos y reglas de validación

## Contratos HTTP (administración y exportación)

### Crear taller
- `POST /api/talleres`
- Body: `{ instrumentId, instrumentVersion, pais, institucion, fecha, alcance, facilitador }`
- Response 201: `{ sessionId, salaCode, qrUrl }`
- Response 400: datos inválidos o instrumento no encontrado

### Obtener estado de sala
- `GET /api/salas/{salaCode}/estado`
- Response 200: `{ questionId, estado, rondaActual, distribucionOculta: true }` (distribución solo para facilitador)

### Enviar voto
- `POST /api/salas/{salaCode}/votos`
- Body: `{ participantId, questionId, ronda, valor }`
- Response 201: `{ voteId, recibido: true }` (solo tras persistencia)
- Response 409: voto duplicado (reintento idempotente) o ronda cerrada
- Response 403: participante no autorizado para esta sala

### Registrar consenso
- `POST /api/salas/{salaCode}/consenso`
- Body: `{ questionId, nivelAcordado, justificacion, autor }`
- Response 201: `{ consensusId, revisiones[] }`
- Response 400: justificación faltante o nivel fuera de escala 1-5

### Exportar resultados
- `GET /api/salas/{salaCode}/exportar/xlsx`
- `GET /api/salas/{salaCode}/exportar/pdf`
- `GET /api/salas/{salaCode}/exportar/docx`
- Response 200: archivo binario con `Content-Disposition`

## Reglas de validación (servidor, además de interfaz)

### VR1: Escala fija de madurez
- Niveles permitidos: exactamente 1, 2, 3, 4, 5 (enteros)
- Rechazar: 0, 6, fraccionarios, texto, identificadores inexistentes
- Aplica por interfaz y por petición directa

### VR2: Descriptores obligatorios
- Publicación de pregunta de madurez requiere exactamente 5 descriptores no vacíos
- Sin coerción de entradas ambiguas

### VR3: Inmutabilidad de sesión publicada
- Instrumento publicado usado por sesión permanece inmutable
- Edición crea borrador de nueva versión

### VR4: Idempotencia de voto
- Mismo `participantId` + `questionId` + `ronda` actualiza, no duplica

### VR5: Confirmación tras persistencia
- `recibido: true` solo después de escribir en base de datos
- Sin conexión: pendiente o error, nunca simular confirmación

### VR6: Distribución oculta
- Datos enviados a participantes no incluyen distribución de respuestas hasta el cierre

### VR7: Consenso con justificación
- `nivelAcordado` + `justificacion` obligatorios
- `nivelAcordado` debe estar en 1-5 para preguntas de madurez

## Eventos WebSocket (tiempo real de sala)

### `estado-pregunta`
- Publicado por servidor cuando el facilitador cambia el estado de la pregunta
- Payload: `{ salaCode, questionId, estado, rondaActual }`

### `voto-recibido`
- Publicado tras persistencia de voto (solo a facilitador y proyector, con distribución oculta para participantes)
- Payload: `{ salaCode, questionId, ronda, participanteCount }`

### `consenso-registrado`
- Publicado cuando el facilitador registra consenso
- Payload: `{ salaCode, questionId, nivelAcordado, justificacion, autor, fecha }`

### `reconexion-estado`
- Enviado al cliente al reconectar con el estado vigente de su sesión
- Payload: `{ sessionId, salaCode, questionId, estado, rondaActual, respuestaVigente }`

## Archivos bajo este documento

- `openspec/changes/agora-primer-incremento/specs/*/spec.md` (requisitos derivados)
- `agora-openspec/docs/03-contratos-validacion.md` (este archivo)
