# Importación Excel: uso y validación

26 de octubre de 2026. Se entrega la plantilla y la funcionalidad para instrumentos de madurez. La importación queda siempre en borrador y requiere revisión humana para publicar.

## Formato

La plantilla contiene solo **Ficha** y **Preguntas**. Los valores editables están resaltados; no incluye preguntas de ejemplo que puedan terminar importadas por accidente.

**Ficha:** completa Nombre y Edición en B6 y B7. Descripción y Documento de referencia en B8/B9 son opcionales. Conserva Idioma es y Formato AGORA-INSTRUMENTO-1. La edición puede indicar un año o una etiqueta del documento, independiente de la versión técnica generada por Ágora.

**Preguntas:** desde fila 6, una pregunta por fila. Encabezados de fila 5: Código, Área, Dominio, Pregunta, Nivel 1, Nivel 2, Nivel 3, Nivel 4 y Nivel 5. Código es texto, admite letras/números/punto/guion/guion bajo y debe ser único sin distinguir mayúsculas. Mantén códigos entre ediciones cuando la pregunta siga evaluando lo mismo. Si cambia sustancialmente su significado, usa otro código.

Hasta 200 preguntas, archivo 2 MiB y contenido serializado 3 MiB. No uses fórmulas, celdas combinadas ni preguntas ocultas. Los enlaces pegados en referencia se conservan como texto y no se consultan por red. Esta plantilla no es el Excel oficial del instrumento ni una certificación de cálculo.

## Uso

1. Entra como facilitador y abre **Instrumentos → Importar instrumento**.
2. Descarga la plantilla y complétala.
3. Elige **Nuevo instrumento**, o una publicación existente para crear otra edición.
4. Selecciona el .xlsx y pulsa **Revisar archivo**. Revisa metadatos, preguntas y cinco descriptores. Corrige los errores señalados en el Excel y vuelve a cargarlo.
5. Pulsa **Importar como borrador**. El editor abre el contenido guardado.
6. Verifica y publica cuando corresponda. Al crear talleres, selecciona la versión/edición deseada.

La vista previa no escribe en catálogo. Cambiar archivo o destino invalida la vista previa. Si se pierde la respuesta al guardar, reintentar conserva el mismo borrador. Una importación nueva no sobrescribe un borrador existente del instrumento. No se infieren correspondencias por nombre, texto o fila; publicaciones sin códigos generan IDs nuevos con advertencia.

## Verificación ejecutada

- **35 pruebas de servidor y dominio aprobadas**, incluidas lectura de la plantilla entregada, validaciones por celda, escala, códigos, fórmulas con caché, filas ocultas, archivos inválidos, límites ZIP/XML, importación atómica, reintentos persistentes, nueva edición y regresiones E1/editor.
- **3 recorridos Chromium aprobados:** taller móvil, editor manual y nueva importación. La importación verifica descarga real, plantilla vacía con errores, vista previa, confirmación como borrador, publicación y nueva edición con códigos conservados.
- TypeScript y compilación Vite aprobados en host y construcción Docker.
- Plantilla creada con artifact-tool; recálculo, inspección y render de ambas hojas. Se normalizó el prefijo de namespace OOXML en el paquete exportado para compatibilidad con lectores, sin cambiar datos ni formato. Lectura independiente con openpyxl confirma hojas, encabezados, código como texto, panel fijo B6 y grilla oculta. Archivo entregado idéntico al recurso descargable.
- Capturas de vista previa y borrador inspeccionadas: docs/evidencia-importacion/.
- Revisión independiente encontró un rango combinado capaz de agotar memoria y un contenido importable que superaba el límite posterior del editor. Ambos se reprodujeron con pruebas fallidas y se corrigieron. Un proceso de prueba de memoria acotada confirma que el rango patológico se rechaza sin terminar el proceso.
- Dependencias instaladas/construidas con cero vulnerabilidades reportadas en la verificación npm. Se fijó la dependencia uuid de ExcelJS a una versión corregida compatible con su uso de v4.

## Datos y operación

SQLite versión 3 agrega recibos de importación y conserva versiones, talleres, votos y credenciales anteriores. Se guardan metadatos de edición, Código, nombre/hash del archivo y fila; no se conserva el binario cargado. Publicar no modifica resultados de talleres previos.

Se generaron copias consistentes antes de actualizar: data/pre-import-local-2026-10-26.sqlite y data/pre-import-docker-2026-10-26.sqlite. Docker conserva su volumen; la base local sigue independiente en data/agora.sqlite. Accesos: Docker en puerto 3000 y local en 3001.

## Límites pendientes

No importa directamente la estructura arbitraria del Excel original IS4H, Word o PDF. El usuario prepara la plantilla mediante transcripción o mapeo revisado. Solo se importan preguntas de madurez, sin asignar cálculo oficial, pesos ni celdas del instrumento original. Los documentos de referencia se registran como texto; la carga de adjuntos y otros tipos de pregunta siguen pendientes.

## Comprobación en las instalaciones actualizadas

La descarga autenticada en puertos 3000 (Docker) y 3001 (local) devolvió exactamente los bytes de la plantilla entregada. En ambos se revisó un archivo de prueba válido y se confirmó que la vista previa no cambió la cantidad de instrumentos. Se conservó un taller en cada instalación. La base local mantiene sus dos envíos de voto, catálogo, esquema 3 e integridad SQLite `ok`. No se crearon instrumentos de demostración en las bases del usuario.

OpenSpec: los tres cambios registrados pasan validación, sin fallos. La validación funcional por parte del usuario permanece pendiente.
