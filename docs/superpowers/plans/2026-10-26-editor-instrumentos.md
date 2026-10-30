# Editor de instrumentos y actualización visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Administrar instrumentos de madurez desde el navegador, publicar versiones, usarlas en talleres y actualizar colores e identidad OPS.

**Architecture:** Extender el monolito existente con catálogo versionado SQLite. Los talleres conservan su instantánea original. Editor React protegido por la misma credencial administrativa de la instalación, con control de edición concurrente.

**Tech Stack:** Node.js, SQLite, TypeScript, React y Vite existentes. No nuevas dependencias.

**Spec:** Alcance de administración de SOLICITUD.md y autorización del usuario «avancemos con el editor de instrumentos», con colores más vivos y logos OPS.

## Global Constraints

- Exactamente niveles enteros 1, 2, 3, 4 y 5, con cinco descriptores obligatorios al publicar.
- Borradores editables y versiones publicadas inmutables. Ediciones posteriores generan nuevo borrador.
- Los talleres existentes y sus preguntas, votos y consensos no se modifican por cambios del catálogo.
- Persistencia local y recursos sin CDN. No cambiar ni redibujar el logo oficial.
- En esta entrega el editor y el recorrido de taller soportan preguntas de madurez. Texto libre y selección múltiple se incorporarán con sus reglas de voto y consenso, sin publicar tipos que el taller aún no puede procesar.

## Review Focus

- Base de datos anterior: migración a versión 2 conserva talleres, credenciales y votos.
- Dos pestañas editando: conflicto 409 conserva cambios locales, no sobrescribe silenciosamente.
- Publicación incompleta: rechaza campos vacíos, IDs repetidos y escalas alteradas en servidor.
- Taller tras editar/publicar: conserva el texto y versión anteriores, mientras otro taller usa la nueva versión.
- Formulario con cambios sin guardar: previene navegación/pérdida accidental; publicación guarda primero la edición vigente.

## Diseño decidido dentro del alcance autorizado

Una biblioteca de instrumentos muestra borradores y versiones publicadas. Nuevo instrumento abre un borrador con pregunta de madurez y escala fija. El editor permite añadir, quitar, reordenar y redactar preguntas, área, dominio y cinco descriptores; vista previa presenta exactamente el contenido del participante. Publicar valida y congela. Para editar una publicación se crea un borrador nuevo con los mismos IDs de preguntas existentes. Al crear un taller se elige una versión publicada. Se permite guardar preguntas incompletas en borrador para continuar después, pero no publicarlas.

Paleta: azul OPS como base, azul más profundo para texto y botones, acentos turquesa, violeta, naranja y verde para niveles/estados. El logo oficial español OPS/OMS se almacena localmente y conserva proporciones y colores. Se mantiene la identificación del producto como piloto y no se atribuye validación oficial a los acuerdos.

## Tarea 2.1 — Catálogo persistente y publicación

Responsable: integrador. Dependencias: E1. Archivos: server/catalog.ts, server/store.ts, tests/catalog.test.ts.

- [x] Escribir pruebas de guardado incompleto, publicación validada, inmutabilidad, control de versión de edición, selección publicada y recuperación/migración.
- [x] Ejecutar pruebas y observar fallo por capacidad ausente.
- [x] Implementar Catalog(db, seed), list(), get(versionId), create(name), save(versionId,{name,questions,editRevision}), publish(versionId,editRevision), draft(versionId). Versiones independientes y una sola edición borrador por instrumento. Crear IDs internos de preguntas en cliente, validar unicidad en servidor.
- [x] Integrar Store.catalog y creación de taller por instrumentVersionId opcional, preservando compatibilidad con E1 y sus instantáneas.
- [x] Ejecutar suite de catálogo y de E1.

## Tarea 2.2 — Contratos protegidos y selección de instrumento

Responsable: integrador. Dependencias: 2.1. Archivos: server/app.ts, api/editor-instrumentos.md, tests/http.test.ts.

- [x] Escribir pruebas de endpoints, denegación a participante, estados 400/409 y taller ligado a publicación.
- [x] Implementar GET/POST /api/instrumentos, GET/PUT /api/instrumentos/:id y POST /:id/publicar, /:id/borrador, todos protegidos; estado de sala usa nombre, versión y conteo reales.
- [x] Ejecutar pruebas HTTP completas.

## Tarea 2.3 — Editor e identidad visual

Responsable: integrador. Dependencias: 2.2. Archivos: client/InstrumentEditor.tsx, client/InstrumentLibrary.tsx, client/App.tsx, client/Facilitator.tsx, client/Participant.tsx, client/style.css, public/branding/, Dockerfile.

- [x] Escribir recorrido Playwright: crear instrumento/pregunta, publicar, crear taller con publicación, editar nueva versión y comprobar inmutabilidad anterior.
- [x] Ejecutar recorrido y observar ausencia del editor.
- [x] Implementar biblioteca, editor, validación visible, reordenamiento, guardado, publicación, vista previa y protección de cambios locales. Integrar selector en taller y navegación.
- [x] Incorporar logo oficial local verificado desde web OPS, paleta viva y cinco colores de niveles con texto. Mantener accesibilidad y diseño móvil.
- [x] Compilar y ejecutar recorrido previo más nuevo; inspeccionar capturas de biblioteca, editor y móvil.

## Tarea 2.4 — Revisión y demostración

Responsable: integrador y revisión independiente según guía de ejecución. Dependencias: 2.1–2.3.

- [x] Revisar cambios de API y persistencia de forma independiente, corregir hallazgos importantes con prueba.
- [x] Registrar pruebas, fuentes del logo y límites en docs/editor-instrumentos-validacion.md; actualizar README y estado del proyecto.
- [x] Reiniciar aplicación sin borrar base existente y abrir editor para validación del usuario.

## Decisiones de ejecución

- Se conserva esta carpeta de trabajo y el servidor local de E1. No se altera el despliegue a internet en esta entrega.
- La autorización actual permite implementar y probar el editor descrito; no se solicita otra aprobación del mismo alcance.
- El administrador corresponde por ahora al acceso de facilitador de esta instalación; cuentas personales y permisos separados quedan fuera de esta entrega.

## Resultado

21 pruebas de servidor/dominio y dos recorridos Chromium aprobados. Compilación, revisión independiente, migración real y revisión visual aprobadas. Docker reconstruido conservando su volumen; acceso local con taller existente conservado en puerto 3001 y Docker en 3000. Fuentes del logo, pruebas y límites en `docs/editor-instrumentos-validacion.md`.
