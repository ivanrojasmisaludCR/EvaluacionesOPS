# 6. Plan de agentes

## Roles y responsabilidades

| Rol | Responsabilidades | Archivos bajo propiedad | Dependencias |
|-----|-------------------|------------------------|--------------|
| Coordinador/Integrador | Consolidar estado global, revisar entregas, aprobar integración, marcar tareas completas | `openspec/changes/agora-primer-incremento/` (todos, solo lectura para consolidación) | Todas las tareas |
| Instrumentos y Cálculo | Auditoría del instrumento, catálogo de mapeo, modelo de dominio, servicio de importación, validación de escala fija | `agora-openspec/docs/01-auditoria-instrumento-mapeo.md`, `agora-openspec/docs/02-modelo-dominio-estados-arquitectura.md` (instrumento), código de importación | Ninguna (inicio) |
| Sesiones y Votación | Modelo de sala, API REST, WebSocket, estados de pregunta, voto idempotente, confirmación de recepción | Código de sesiones/votación, contratos WebSocket | Instrumentos y Cálculo (modelo de dominio) |
| Interfaz y Accesibilidad | Vistas participante/facilitador/proyector, QR, móvil (320/360/390px), teclado, foco, contraste, controles táctiles | Frontend React, componentes de sala | Sesiones y Votación (API y WebSocket) |
| Exportaciones | Exportación XLSX, PDF, Word; identificación preliminar/validado | Código de exportación, plantillas de informe | Cierre-consenso (datos de consenso), Recuperación (persistencia) |
| Operación Docker | Docker Compose, persistencia en volumen, respaldo, restauración, red LAN, firewall, túnel opcional | `docker-compose.yml`, scripts de respaldo/restauración, documentación de red | Todas (despliegue) |
| QA Independiente | Pruebas de referencia, concurrencia, E2E, recuperación, validación de exportación | `tests/`, suites de pruebas | Todas las capacidades (para probar) |

## Combinación de roles

Cuando reduzca el costo de coordinación, se pueden combinar:
- Instrumentos y Cálculo + QA Independiente (para pruebas de dominio y cálculos)
- Sesiones y Votación + Interfaz y Accesibilidad (para API y frontend de sala)

## Orden de integración

1. Instrumentos y Cálculo entrega: modelo de dominio, catálogo de mapeo, servicio de importación (tareas 1.1-1.5)
2. Sesiones y Votación entrega: modelo de sala, API REST, WebSocket, estados de pregunta (tareas 2.1-2.5, 3.1-3.7)
3. Interfaz y Accesibilidad entrega: vistas de sala, QR, móvil (tareas 2.5, 3.2, I1-I15) — depende de 2
4. Cierre-consenso entrega: registro de consenso, justificación, conservación de estados (tareas 4.1-4.4) — depende de 3
5. Recuperación entrega: persistencia, respaldo, restauración (tareas 5.1-5.4) — depende de 3
6. Exportaciones entrega: XLSX, PDF, Word, identificación preliminar (tareas 6.1-6.5) — depende de 4 y 5
7. Operación Docker entrega: Docker Compose, red LAN, respaldo consistente (tareas 2.6, 5.1-5.4) — depende de 5
8. QA Independiente valida todo el incremento (todas las pruebas)

## Protocolo de entrega

1. Cada agente lee los documentos de dependencia antes de empezar (listados en `02-modelo-dominio-estados-arquitectura.md` y `03-contratos-validacion.md`).
2. Cada agente define: objetivo, entradas, límites de escritura, entregables, dependencias, manejo de bloqueos, comandos de prueba, resultados esperados.
3. No edición simultánea de los mismos archivos. Contratos, esquemas, migraciones, dependencias y archivos compartidos tienen un propietario y una secuencia de integración.
4. El coordinador consolida el estado global. Solo el coordinador marca tareas como completas.
5. Una tarea se marca completa después de revisar su entrega y sus pruebas, no por la afirmación del agente que la implementó.
6. Evidencia de pruebas y decisiones se mantiene en el repositorio (`tests/`, `docs/`).

## Bloqueos y escalamiento

- Si un agente está bloqueado por un contrato no definido, registra el bloqueo con la pregunta, propuesta provisional y trabajo que puede continuar sin ella (SOLICITUD.md §9).
- El coordinador resuelve bloqueos en sesión de integración semanal.
- Los contratos, esquemas, migraciones, dependencias y archivos compartidos tienen un propietario definido y una secuencia de integración.

## Archivos bajo este documento

- `agora-openspec/docs/06-plan-de-agentes.md` (este archivo)
- `AGENTS.md` (en la raíz del repositorio)
- `.opencode/agents/` (definiciones de agentes OpenCode)
