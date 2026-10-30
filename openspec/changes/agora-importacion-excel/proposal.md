# Proposal

## Why

El usuario necesita precargar instrumentos y sus ediciones anuales sin redactar cada pregunta en la interfaz. Solicitó una plantilla Excel y adaptar Ágora para importarla.

## What Changes

- Plantilla descargable .xlsx con Ficha y Preguntas, códigos estables y cinco descriptores.
- Validación del archivo con errores por celda y vista previa sin escritura.
- Confirmación como borrador, tanto de un instrumento nuevo como de otra edición de una publicación existente.
- Códigos externos separados de IDs internos; conservación de IDs coincidentes y de talleres anteriores.
- Guardado atómico e idempotente, procedencia y metadatos de edición. Migración SQLite v3.
- Lectura acotada de ZIP/XML antes de cargar el modelo de Excel.

## Capabilities

### New Capabilities

- `importacion-instrumentos`: Preparar, revisar e importar instrumentos de madurez con plantilla Excel.

## Impact

Se agregan ExcelJS, yauzl y saxes, módulo de lectura, rutas binarias autenticadas, recibos de importación y pantalla de revisión. No incluye conversión arbitraria del Excel oficial, Word/PDF, preguntas de texto o selección múltiple ni cálculo metodológico.
