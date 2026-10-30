# Importación de instrumentos Excel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Entregar una plantilla .xlsx y un recorrido de validación, vista previa e importación como borrador de un instrumento nuevo o una nueva edición.

**Architecture:** Plantilla estática generada con artifact-tool. Lector ExcelJS en servidor, prevalidación ZIP acotada con yauzl, carga binaria autenticada y guardado transaccional en catálogo SQLite. El servidor vuelve a validar el archivo al confirmar; un recibo idempotente evita duplicados si se pierde la respuesta.

**Tech Stack:** React/Express/SQLite existentes; ExcelJS y yauzl para lectura. Artifact-tool del runtime para autoría y verificación de la plantilla.

**Spec:** Solicitud del usuario: «darme el formato del excel y adecuar la funcionalidad para su importacion»; formato Ficha + Preguntas propuesto y aceptado en esta conversación.

## Global Constraints

- Formato .xlsx, dos hojas Ficha y Preguntas; madurez con exactamente cinco descriptores.
- Importación siempre crea borrador. Publicaciones y talleres existentes inmutables.
- Hasta 200 preguntas; archivo comprimido 2 MiB, descompresión total 32 MiB y entrada 16 MiB, máximo 256 entradas ZIP.
- Rechazar fórmulas, celdas de error, contenido oculto importable y estructura distinta; nunca tomar un valor en caché de fórmula como descriptor.
- Código externo estable por pregunta, separado del ID interno; coincidencia sin distinción de mayúsculas en nuevas ediciones. No inferir coincidencias por texto o número de fila.
- Nombre y edición obligatorios; descripción y documento de referencia opcionales; idioma es. Fecha/año de edición es una etiqueta de contenido, diferente de la versión técnica de Ágora.

## Review Focus

- Archivo inválido no deja instrumentos parciales; vista previa no escribe catálogo.
- Fórmula con valor en caché o fila oculta no se importa silenciosamente.
- Nueva edición conserva IDs de códigos coincidentes y talleres anteriores intactos.
- Cambio de archivo/destino invalida vista previa; confirmación repite validación y vincula hash.
- Reintento tras pérdida de respuesta devuelve el mismo borrador, sin sobrescribir ediciones posteriores del borrador.

## Formato decidido

Ficha: cabecera A5:C5 (Campo, Valor, Cómo completar). A6:A11 contienen Nombre, Edición, Descripción, Documento de referencia, Idioma y Formato. B6:B11 son los valores; Idioma inicial es y Formato fijo AGORA-INSTRUMENTO-1. Guías y pasos visibles en la misma hoja.

Preguntas: fila 5 con Código, Área, Dominio, Pregunta, Nivel 1, Nivel 2, Nivel 3, Nivel 4, Nivel 5. Desde fila 6 una pregunta por fila; filas totalmente vacías se omiten; orden de filas determina orden de preguntas. Código textual de hasta 80 caracteres, letras/números/punto/guion/guion bajo; columnas de contenido textual. Ninguna fila de ejemplo se importa por accidente: la plantilla está vacía con guías de ejemplo fuera del área de datos.

## Tarea 3.1 — Plantilla y contrato

Responsable: integrador. Archivos: outputs/importacion-instrumentos/plantilla-instrumentos-agora.xlsx, public/templates/ misma plantilla, scripts de autoría fuera de dependencias, api/importacion-instrumentos.md.

- [x] Crear plantilla con artifact-tool, dos hojas, instrucciones, campos editables, códigos como texto, cinco encabezados de nivel fijos y filas vacías preparadas.
- [x] Recalcular, inspeccionar y renderizar ambas hojas; verificar archivo exportado con lectura independiente. Copiar el mismo archivo al recurso descargable de la aplicación.
- [x] Registrar formato de rutas y validación antes de implementar.

## Tarea 3.2 — Lector y guardado atómico

Responsable: integrador. Dependencias: 3.1. Archivos: server/excel-import.ts, server/catalog.ts, server/store.ts, tests/excel-import.test.ts.

- [x] Escribir pruebas de estructura, errores localizados, códigos duplicados, fórmulas, límites ZIP, filas ocultas, archivo incorrecto y recorrido plantilla real.
- [x] Ejecutar y observar capacidades ausentes.
- [x] Implementar parseInstrumentXlsx(bytes,fileName), validación ZIP y metadatos. Catalog.importDraft conserva códigos, ediciones, procedencia y recibo idempotente. Migración v3 agrega import_receipts sin perder datos previos.
- [x] Ejecutar pruebas de importación, catálogo y Store.

## Tarea 3.3 — HTTP y vista previa

Responsable: integrador. Dependencias: 3.2. Archivos: server/import-routes.ts, server/app.ts, client/InstrumentImport.tsx, client/InstrumentLibrary.tsx, client/InstrumentEditor.tsx, tests/http.test.ts, tests/browser.spec.ts.

- [x] Escribir pruebas de descarga, autorización, vista previa sin mutaciones, confirmación válida, reintento y nueva edición.
- [x] Ejecutar y observar rutas/pantallas ausentes.
- [x] Implementar GET /api/instrumentos/plantilla.xlsx, POST /api/instrumentos/importacion/validar y /guardar con cuerpo binario, hash y solicitud idempotente.
- [x] Implementar opción Importar instrumento, descarga, selección de archivo/destino, errores por celda, vista previa, confirmación y apertura del borrador. Mostrar edición y procedencia en editor y selector de taller.
- [x] Ejecutar suite completa y navegador, revisar capturas.

## Tarea 3.4 — Revisión y entrega

Responsable: integrador y revisión independiente según guía de ejecución. Dependencias: 3.1–3.3.

- [x] Revisar importación, límites, inmutabilidad y reintentos de forma independiente; corregir problemas importantes con prueba.
- [x] Documentar formato, pruebas y límites; actualizar OpenSpec.
- [x] Respaldar las bases activas, actualizar Docker/local y comprobar descarga/importación sin perder sus datos.
- [x] Entregar Excel descargable y acceso a la funcionalidad.

## Decisiones de ejecución

La autorización permite construir y verificar esta funcionalidad sin otra aprobación del mismo alcance. No se implementa importación arbitraria de Excel oficiales ni lectura automática Word/PDF; se carga la plantilla definida. Los documentos fuente se registran como referencia textual, no se suben automáticamente. Los instrumentos existentes sin códigos de importación no reciben correspondencias inferidas.

## Resultado y decisiones verificadas

35 pruebas de servidor/dominio y 3 recorridos de navegador aprobados. Revisión independiente corregida mediante pruebas RED→GREEN: prevalidación SAX bloquea combinaciones antes de materializar Excel; contenido importado limitado a 3 MiB para admitir edición posterior. Se preservan metadatos y enlaces como texto sin conexiones. Plantilla final en outputs/01a1784c-9e21-7dc1-9296-043a1d523472/. Actualización de Docker y acceso local con copias consistentes previas.
