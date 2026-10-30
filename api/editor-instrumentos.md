# Contrato del editor de instrumentos

Extensión de E1 para administrar instrumentos de madurez. Toda ruta siguiente requiere cookie de facilitador/administrador `agora_admin`; participantes y proyectores reciben 401. JSON de catálogo admite hasta 4 MiB. El límite general de las otras rutas sigue siendo 24 KiB.

- `GET /api/instrumentos`: arreglo de resúmenes `{versionId,instrumentId,revision,editRevision,status,createdAt,publishedAt,name,version,questionCount}`.
- `POST /api/instrumentos` con `{name}`: 201, nuevo borrador vacío, versión `1.0.0`.
- `GET /api/instrumentos/{versionId}`: versión completa `{versionId,instrumentId,revision,editRevision,status,createdAt,publishedAt,instrument}`; instrumento contiene `{id,version,name,partial,source,questions}`.
- `PUT /api/instrumentos/{versionId}` con `{name,questions,editRevision}`: 200, versión guardada con `editRevision` incrementado. Solo borradores. Nombre de 1–200 caracteres, hasta 200 preguntas. Cada pregunta tiene ID único estable, texto de hasta 10000 caracteres, área y dominio de hasta 200, `type:"madurez"`, cinco niveles `{value:1..5,text}` de hasta 10000 caracteres cada uno. Texto/área/dominio/descriptores pueden estar vacíos en borrador. El orden del arreglo determina la numeración visible. La procedencia es controlada por el servidor; una pregunta agregada es personalizada y una modificada se marca como tal.
- `POST /api/instrumentos/{versionId}/publicar` con `{editRevision}`: 200, estado `published`. Exige al menos una pregunta, área, dominio, texto y cinco descriptores no vacíos. La publicación congela la versión. Reintentar publicación vigente devuelve esa publicación, sin duplicar.
- `POST /api/instrumentos/{versionId}/borrador` con `{}`: 201, nuevo borrador del mismo instrumento y siguiente versión de parche; mantiene IDs de las preguntas existentes. Si ya hay un borrador de ese instrumento, devuelve ese borrador. Nunca modifica la publicación de origen.

`editRevision` es obligatorio en guardado y publicación. Si otra pestaña guardó cambios, devuelve 409 `EDICION_CONFLICTO`; el cliente conserva su edición local y permite decidir si vuelve a cargar la versión del servidor. 400 para contenido inválido; 404 para versión inexistente; 409 `VERSION_INMUTABLE` al editar una publicación.

## Talleres

`POST /api/talleres` acepta ahora `instrumentVersionId` junto con la ficha existente. Si está presente debe ser una versión publicada: un borrador produce 409 y una versión inexistente 404. Si no se envía, se mantiene compatibilidad con E1 seleccionando la publicación del piloto original. Los talleres guardan una instantánea completa de nombre, versión y preguntas. Crear o publicar versiones posteriores no altera esa instantánea, los votos ni los consensos.

## Persistencia y alcance

Migración SQLite a `user_version=2`, tabla `instrument_versions`. El catálogo inicial se incorpora una sola vez y no se sobrescribe al reiniciar. Los datos de E1 permanecen. Las rutas no publican texto libre ni selección múltiple: esos tipos requieren completar primero su recorrido de votación y consenso. Publicar un instrumento habilita su uso en Ágora, no certifica metodología ni cálculo oficial.
