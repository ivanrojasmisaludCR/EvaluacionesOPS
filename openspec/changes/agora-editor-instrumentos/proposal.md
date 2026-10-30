# Proposal

## Why

El facilitador necesita crear instrumentos y preguntas sin modificar archivos de la aplicación. La primera entrega solo incluía un catálogo piloto fijo. El usuario pidió avanzar con el editor, colores más vivos y logos OPS.

## What Changes

- Biblioteca de instrumentos con borradores y publicaciones.
- Editor de preguntas de madurez, áreas, dominios y cinco descriptores fijos; agregar, quitar, ordenar y previsualizar.
- Validación de publicación, control de edición concurrente y versiones publicadas inmutables.
- Selección de versión publicada al crear taller; conservación de instantáneas de talleres anteriores.
- Catálogo SQLite persistente con migración desde E1.
- Paleta más viva y recurso oficial OPS/OMS incorporado localmente.

## Capabilities

### New Capabilities

- `editor-instrumentos`: Administración versionada de instrumentos de madurez y selección en talleres.

## Impact

Nuevos módulo de catálogo, tabla SQLite, rutas HTTP protegidas y pantallas de biblioteca/editor. Se conserva el contrato de E1 sin selección explícita de instrumento. No incluye texto libre, selección múltiple, cálculo oficial, exportaciones ni acceso por internet.
