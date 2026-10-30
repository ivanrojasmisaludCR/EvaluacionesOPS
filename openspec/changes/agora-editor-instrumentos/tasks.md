# Tasks

Responsable de integración: coordinador, combinando instrumentos, interfaz y sesiones. Alcance exacto y archivos en docs/superpowers/plans/2026-10-26-editor-instrumentos.md.

- [x] 1.1 Implementar catálogo persistente y migración v2: server/catalog.ts y server/store.ts. Depende de E1. Aceptación: borradores persistentes y datos E1 conservados. Prueba: tests/catalog.test.ts, incluida migración real sin tabla de catálogo. Demostración: reinicio conserva versiones y talleres.
- [x] 1.2 Implementar rutas protegidas y selección en taller: server/app.ts y api/editor-instrumentos.md. Depende de 1.1. Aceptación: publicación validada, edición concurrente rechazada e instantáneas intactas. Prueba: tests/http.test.ts. Demostración: taller conserva pregunta anterior tras publicar otra versión.
- [x] 1.3 Implementar biblioteca/editor y actualización visual: client/, public/branding/, Dockerfile. Depende de 1.2. Aceptación: crear, guardar, ordenar, previsualizar, publicar y elegir contenido con logo local y escala fija. Prueba: tests/browser.spec.ts y revisión visual. Demostración: recorrido de instrumento personalizado con voto móvil.
- [x] 1.4 Revisar y actualizar instalaciones activas. Depende de 1.3. Aceptación: pruebas aprobadas, copias consistentes previas, Docker y local accesibles sin pérdida de sus datos. Demostración y límites: docs/editor-instrumentos-validacion.md. Validación del usuario pendiente.
