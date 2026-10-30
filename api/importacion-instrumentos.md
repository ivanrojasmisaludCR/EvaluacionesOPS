# Importar instrumentos desde la plantilla Excel

## Archivo

Formato .xlsx, hasta 2 MiB, hojas visibles **Ficha** y **Preguntas**. Hasta 200 preguntas de madurez y 3 MiB de contenido textual serializado, para conservar margen de edición dentro del límite JSON de 4 MiB. Las filas completamente vacías se omiten. No se admiten fórmulas, celdas de error, preguntas ocultas, macros ni vínculos externos de Excel. Se valida el ZIP y se inspecciona el XML de las hojas antes de crear el modelo Excel (sin celdas combinadas, índices de fila mayores de 2005 ni más de 20000 celdas por hoja), con máximo 256 entradas ZIP, 16 MiB por entrada y 32 MiB de expansión total.

Ficha: etiquetas de A6:A11: Nombre, Edición, Descripción, Documento de referencia, Idioma, Formato. Sus valores están en B6:B11. Nombre y Edición son obligatorios; descripción y referencia opcionales. Idioma es, Formato AGORA-INSTRUMENTO-1. El año de edición puede ser texto o número; se conserva como etiqueta. La referencia es texto, no una carga adicional de documentos. Si Excel la guarda como hipervínculo, se conserva su etiqueta y dirección como texto sin abrir conexiones.

Preguntas: encabezados A5:I5 Código, Área, Dominio, Pregunta, Nivel 1, Nivel 2, Nivel 3, Nivel 4, Nivel 5. Una pregunta desde fila 6. Código textual de hasta 80 caracteres alfanuméricos, punto, guion o guion bajo. Unicidad y correspondencia entre ediciones sin distinción de mayúsculas. Área y dominio hasta 200 caracteres; pregunta y cada descriptor hasta 10000. No se infieren reglas de cálculo ni mapeos al Excel oficial.

## Rutas protegidas

Todas requieren cookie administrativa y mantienen verificación de Origin. Las rutas binarias se registran antes del analizador JSON general.

- `GET /api/instrumentos/plantilla.xlsx`: descarga la misma plantilla entregada al usuario, MIME application/vnd.openxmlformats-officedocument.spreadsheetml.sheet y nombre de archivo.
- `POST /api/instrumentos/importacion/validar`: cuerpo binario del archivo, Content-Type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet o application/octet-stream. Header X-File-Name con nombre de archivo codificado por encodeURIComponent. X-Base-Version-Id opcional selecciona una publicación existente para una nueva edición.
- `POST /api/instrumentos/importacion/guardar`: mismo archivo y encabezados, más X-Preview-Hash con SHA-256 de la vista previa y X-Import-Request-Id (8–80 caracteres ASCII, letras/números/guion/guion bajo).

Validar responde 200 con `{fileName,fileHash,name,metadata,questions,errors,warnings,canImport,changes}`. Cada error contiene `{sheet,cell,message}`. La vista previa no escribe en catálogo. Los errores de estructura/contenido de un libro legible se devuelven en errors; archivo ilegible 400, formato ajeno 415, exceso de carga 413. El cliente invalida la vista previa si cambia archivo o destino.

Guardar vuelve a leer y validar el archivo en servidor. Hash diferente: 409. Errores del libro: 422. Guardado válido: 201 con InstrumentVersion en estado draft, en una sola transacción. Reintentar el mismo requestId/archivo/destino devuelve el mismo borrador, conservando incluso ediciones manuales hechas después. Reutilizar requestId para otro archivo o destino produce 409. No se confía en los datos de vista previa enviados por el navegador.

## Nueva edición

El administrador elige explícitamente publicación de origen. No se emparejan instrumentos por nombre. Se conserva el ID interno de cada pregunta cuyo Código coincide; preguntas nuevas reciben ID nuevo. Preguntas retiradas solo se omiten del nuevo borrador. El instrumento conserva su ID y recibe siguiente versión técnica de parche; Edición identifica el contenido anual. Publicaciones y talleres anteriores permanecen inmutables.

Si ya hay un borrador de ese instrumento, la importación nueva se rechaza con 409 para evitar sobrescribirlo. Un reintento de la misma importación aceptada recupera su resultado antes de esa comprobación. Si la publicación anterior no tiene códigos, se avisa que las preguntas importadas recibirán IDs nuevos.

## Persistencia

SQLite versión 3 agrega import_receipts; no elimina tablas ni datos existentes. Metadata de edición, descripción, referencia e idioma se conserva dentro de la instantánea del instrumento. Cada pregunta conserva Código y procedencia del archivo, su hash y fila. Guardar/publicar en el editor mantiene esa información; el taller muestra la edición y conserva su instantánea original.
