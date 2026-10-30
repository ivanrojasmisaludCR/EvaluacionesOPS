# Design

## Context

El editor de madurez ya conserva borradores, publicaciones y talleres. Se agrega importación explícita con plantilla revisada por el usuario.

## Goals / Non-Goals

Goals: plantilla clara y vacía, errores localizados, vista previa, nuevas ediciones con códigos estables, no duplicación y preservación de talleres.

Non-Goals: inferir estructura de archivos ajenos, evaluar fórmulas, importar adjuntos documentales, publicar automáticamente o certificar metodología.

## Decisions

- Ficha tiene metadatos y formato fijo AGORA-INSTRUMENTO-1; Preguntas tiene nueve columnas desde fila 5. Plantilla sin datos de ejemplo en la zona importable.
- Archivo de hasta 2 MiB, 200 preguntas y 3 MiB de contenido serializado, para conservar margen de edición dentro del límite de 4 MiB del editor.
- Validación ZIP de 256 entradas, 16 MiB por entrada y 32 MiB total. SAX previo al modelo rechaza rangos combinados, XML inválido, índices excesivos y hojas de más de 20000 celdas. No se evalúan fórmulas ni se abren referencias web.
- Vista previa autenticada sin cambios en catálogo. Guardado vuelve a validar bytes y hash. Transacción de catálogo crea borrador y recibo juntos.
- Nueva edición se selecciona explícitamente por versión publicada. Un borrador existente bloquea otra importación, salvo reintento de la misma solicitud ya aceptada.
- Códigos sin distinción de mayúsculas conservan IDs. No se empareja por nombre o texto. Edición anual y versión técnica se muestran por separado.
- No se conserva el binario subido: se guardan metadatos, nombre, hash y fila de procedencia.

## Risks / Trade-offs

La plantilla exige transcribir o preparar el contenido y revisión humana. El archivo original de un instrumento puede requerir un mapeo específico. Las ediciones sin códigos anteriores reciben IDs nuevos con advertencia. Las bases local y Docker siguen independientes.
