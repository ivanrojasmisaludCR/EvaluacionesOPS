# AGENTS.md — Ágora (OpenSpec + OpenCode)

Este documento contiene instrucciones para los agentes de OpenCode que trabajen en el proyecto Ágora. No sobrescribe instrucciones ajenas ni fija modelos o proveedores que el usuario no tenga configurados.

## Propósito del proyecto

Ágora es una plataforma portátil para talleres participativos inspirados en Kahoot. Los asistentes entran con QR desde el navegador del celular, responden, ven resultados cuando el facilitador lo decide y discuten hasta acordar un consenso. El facilitador controla la sesión desde una computadora con Docker. El producto debe mantener trazabilidad de la votación, del consenso y de las evidencias, y producir al finalizar un instrumento Excel completado y un informe editable y en PDF.

## Estado actual

El usuario autorizó implementar E1 y después el editor de instrumentos de madurez con nueva identidad visual el 26 de octubre de 2026. El editor y su contrato están en `client/InstrumentEditor.tsx`, `server/catalog.ts` y `api/editor-instrumentos.md`; su validación está en `docs/editor-instrumentos-validacion.md`. La importación con plantilla Excel ya se incorpora en `server/excel-import.ts`, `server/import-routes.ts` y `client/InstrumentImport.tsx`; contrato y evidencia en `api/importacion-instrumentos.md` y `docs/importacion-excel-validacion.md`. El código está en `client/` y `server/`; el alcance aprobado está en `docs/propuesta-mvp-incremental.md`. Consulte `docs/entrega-1-validacion.md` para las verificaciones y límites reales. Los artefactos de planificación del incremento completo están en:

- `openspec/changes/agora-primer-incremento/` — propuesta, especificaciones por capacidad, diseño y tareas del primer incremento
- `agora-openspec/docs/` — documentos complementarios (auditoría, dominio, contratos, pruebas, trazabilidad, agentes, instalación, criterios)

## Cómo trabajar con este repositorio

### 1. Leer antes de empezar

Cada agente debe leer los siguientes documentos antes de comenzar su trabajo:

- `SOLICITUD.md` (en `agora-openspec/`) — solicitud original y alcance funcional
- `agora-openspec/docs/02-modelo-dominio-estados-arquitectura.md` — modelo de dominio y decisiones de arquitectura
- `agora-openspec/docs/03-contratos-validacion.md` — contratos HTTP y reglas de validación
- `agora-openspec/docs/06-plan-de-agentes.md` — plan de agentes, dependencias y archivos bajo propiedad
- `openspec/changes/agora-primer-incremento/tasks.md` — tareas del primer incremento

### 2. Formato de las tareas

Cada tarea debe incluir:
- Identificador (ej. `1.1`, `2.3`)
- Objetivo
- Alcance y archivos bajo propiedad
- Dependencias
- Rol responsable
- Criterios de aceptación
- Pruebas
- Forma de demostrar finalización

Las tareas deben ser lo suficientemente pequeñas para que un agente las termine y entregue un resultado verificable en una sesión. Evitar tareas monolíticas como «hacer todo el backend».

### 3. Límites de escritura y propiedad

- No editar simultáneamente los mismos archivos.
- Contratos, esquemas, migraciones, dependencias y archivos compartidos tienen un propietario definido y una secuencia de integración.
- Los archivos bajo propiedad de cada rol (ver `06-plan-de-agentes.md`) solo son editables por ese rol o por el coordinador/integrador.
- El revisor/QA independiente tiene acceso de lectura suficiente para revisar y un mecanismo definido para ejecutar o solicitar las pruebas.

### 4. Protocolo de entrega

1. Leer los documentos de dependencia antes de empezar.
2. Implementar la tarea con los archivos bajo su propiedad.
3. Ejecutar las pruebas asociadas.
4. Entregar al coordinador/integrador para revisión.
5. El coordinador consolida el estado global y marca la tarea como completa solo después de revisar la entrega y sus pruebas.
6. No marcar una tarea como completa solo por la afirmación del agente que la implementó.

### 5. Bloqueos

Si un agente está bloqueado por un contrato o decisión no definida:
- Registrar el bloqueo con: la pregunta, una propuesta provisional y qué trabajo puede continuar sin ella.
- Informar al coordinador/integrador.
- No asumir decisiones silenciosamente.

### 6. Comandos disponibles

- `openspec validate --all` — validar todos los cambios y especificaciones OpenSpec
- `openspec status --change agora-primer-incremento` — estado del primer incremento
- `openspec doctor` — salud del repositorio OpenSpec
- `openspec context` — contexto de trabajo OpenSpec
- `npm install` — instalar dependencias (en `~/.config/opencode/` para el entorno de desarrollo local)
- `npm run backup` / `npm run restore` — respaldo y restauración (por definir en implementación)
- `docker compose up -d` — iniciar la aplicación (por definir en implementación)

### 7. Idioma

Todos los documentos del proyecto se escriben en español. Los encabezados estructurales de OpenSpec y las palabras clave SHALL/MUST se mantienen en inglés.

## Roles sugeridos

- Coordinador/Integrador
- Instrumentos y Cálculo
- Sesiones y Votación
- Interfaz y Accesibilidad
- Exportaciones
- Operación Docker
- Revisión/QA Independiente

Los roles pueden combinarse cuando reduzca el costo de coordinación.

## No anunciar como implementado

No anunciar el MVP completo ni preparación para un evento a partir de E1. Distinguir la entrega funcional limitada de las capacidades futuras y comprobar `docs/entrega-1-validacion.md` antes de afirmar resultados. No marcar tareas amplias del incremento como completas por haber implementado una parte.
