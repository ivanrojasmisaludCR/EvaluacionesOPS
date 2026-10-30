# Agrupamientos de preguntas y promedio

Alcance autorizado: cada par exacto Área + Dominio define un agrupamiento. Se usan los consensos por pregunta de la instantánea del taller; cada pregunta tiene el mismo peso. Promedio pendiente hasta completar todos los consensos; entonces media aritmética y nivel redondeado a entero (.5 hacia arriba), según el ejemplo DMIT H3. No se incorporan agregados de área ni globales.

## G1 — Cálculo y contrato
- Responsable: coordinador/integrador, rol Instrumentos y Cálculo.
- Archivos: server/groups.ts, server/store.ts, api/agrupamientos.md, tests/groups.test.ts, tests/store.test.ts.
- Dependencias: catálogo y consenso existentes.
- Aceptación: separación de áreas, preguntas no consecutivas, pendientes sin cero, consenso distinto del voto, reinicio conserva resultado.
- Evidencia: pruebas unitarias y SQLite real.

## G2 — Interfaz y validación
- Responsable: coordinador/integrador, rol Interfaz.
- Archivos: client/Room.tsx, Facilitator.tsx, Participant.tsx, InstrumentEditor.tsx, styles.css, tests/browser.spec.ts.
- Dependencia: G1.
- Aceptación: editor explica agrupamiento y muestra sus miembros por cantidad; taller muestra avance y resultados compartidos, móvil sin desbordamiento.
- Evidencia: recorrido de navegador con grupo de tres preguntas y consensos 3, 2, 5; revisión independiente y actualización de instalaciones conservando datos.
