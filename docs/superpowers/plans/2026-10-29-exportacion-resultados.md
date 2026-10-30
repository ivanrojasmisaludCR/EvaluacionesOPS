# Exportación de resultados Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para ejecutar en esta sesión y revisión independiente al finalizar.

**Goal:** Descargar Excel y PDF completos del estado actual desde Resultados.

**Architecture:** Store obtiene una instantánea de todas las preguntas; el generador produce archivos con tablas y gráficos incrustados. Ruta administrativa y botón con elección de formato.

**Tech Stack:** SQLite, TypeScript, ExcelJS, PDFKit, resvg, React.

**Spec:** docs/superpowers/specs/2026-10-29-exportacion-resultados-design.md

## Global Constraints

- Solo facilitador; sin identidades de participantes ni credenciales en archivos.
- No contar históricos duplicados ni divulgar votos antes del cierre.
- Pendientes no equivalen a cero; mismos cálculos que la página.
- Funciona en Docker sin internet; textos completos, sin recortes.
- No reemplaza el Excel oficial ni certifica metodología OPS.

## Review Focus

- Texto largo y caracteres especiales: preservar contenido y paginar.
- Archivo con preguntas pendientes: estado parcial y celdas vacías.
- Distribuciones abiertas: nunca revelar niveles.
- Instrumentos grandes: gráficos legibles y generación acotada.
- Credenciales ajenas o vencidas: no descargar informes.

### Task 1: Instantánea y archivos

Objetivo: informe con todas las preguntas y gráficos. Rol: coordinador/exportaciones. Dependencias: Store, results. Archivos: server/report-data.ts, server/report-charts.ts, server/report-files.ts, tests/report.test.ts; Store añade método report(code). Produce WorkshopReport y exportReport(report,format):Promise<Buffer>.

- [x] Escribir pruebas de instantánea, cambio de voto, pendientes y visibilidad; observar fallo antes de implementar.
- [x] Implementar consulta y comprobar pruebas.
- [x] Escribir pruebas de contenido XLSX/PDF e imágenes; observar fallo.
- [x] Implementar archivos, fuentes y gráficos; verificar contenido, paginación y representación visual.

### Task 2: Descarga e interfaz

Objetivo: descarga protegida con un botón. Rol: coordinador/interfaz/API. Dependencia: Task 1. Archivos: server/app.ts, client/Results.tsx, client/ResultExport.tsx, client/styles.css, tests/http.test.ts, tests/browser.spec.ts, api/resultados.md.

- [x] Escribir y ejecutar prueba HTTP de permisos, formato y descarga; observar fallo.
- [x] Registrar contrato y ruta con exclusión simultánea y archivos adjuntos.
- [x] Añadir botón de exportación, estados de preparación/error y descarga local sin credenciales en URL.
- [x] Ejecutar suite, build y recorridos de navegador; revisar archivos reales y móvil.
- [x] Revisar independientemente, respaldar SQLite y desplegar Docker conservando volumen; comprobar descargas y datos.
- [x] Registrar evidencia y alcance real; validar OpenSpec y presentar entrega.

## Cierre técnico

57 pruebas Node y siete recorridos de navegador correctos; build y ocho cambios OpenSpec válidos. Docker actualizado y comprobado con 78 preguntas, 26 dominios, cuatro áreas y cinco gráficos; todos los textos presentes en ambos formatos. Cuatro talleres, siete envíos y cuatro consensos conservados. Hallazgo de revisión independiente sobre observaciones multilínea corregido con prueba RED→GREEN; continuación PDF corregida de igual forma. Sin hallazgos importantes pendientes. Evidencia y límites: docs/exportacion-resultados-validacion.md. No se crearon commits ni se modificó la integración Git preexistente.
