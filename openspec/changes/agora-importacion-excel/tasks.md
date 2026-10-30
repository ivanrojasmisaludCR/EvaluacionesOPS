# Tasks

Responsable: coordinador/integrador combinando instrumentos, API e interfaz. Plan y propiedad de archivos: docs/superpowers/plans/2026-10-26-importacion-excel.md.

- [x] 1.1 Crear plantilla Excel y contrato. Sin dependencia adicional. Archivos: outputs/, public/templates/, api/importacion-instrumentos.md. Aceptación: formato vacío, legible y compatible con el lector. Pruebas: render de ambas hojas, lectura independiente y plantilla real en tests/excel-import.test.ts. Demostración: descarga desde Ágora.
- [x] 1.2 Implementar lector y guardado atómico. Depende de 1.1. Archivos: server/excel-import.ts, server/catalog.ts, server/store.ts. Aceptación: errores localizados, ZIP/XML acotado, nueva edición e idempotencia. Pruebas: tests/excel-import.test.ts y regresiones de catálogo. Demostración: reintento conserva el mismo borrador.
- [x] 1.3 Integrar rutas y pantalla. Depende de 1.2. Archivos: server/import-routes.ts, server/app.ts, client/InstrumentImport.tsx y biblioteca/editor. Aceptación: vista previa sin escritura y confirmación revisada. Pruebas: HTTP y tercer recorrido Playwright. Demostración: importar edición 2027 y después 2028 conservando códigos.
- [x] 1.4 Revisar, documentar y actualizar instalaciones conservando datos. Depende de 1.3. Pruebas y evidencia: docs/importacion-excel-validacion.md. Aceptación: suite verde, compilación, plantilla descargable y bases conservadas. La validación del usuario permanece pendiente.
