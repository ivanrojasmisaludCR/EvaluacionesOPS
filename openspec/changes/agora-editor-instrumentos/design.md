# Design

## Context

Extensión sobre la primera entrega React/Node/SQLite ya funcional. Prioridad del usuario: administración y actualización visual. Se mantiene el monolito, el acceso administrativo compartido y la operación local/Docker existente.

## Goals / Non-Goals

Goals: editar contenido desde navegador, conservar publicaciones y talleres, persistir borradores y presentar identidad visual actualizada.

Non-Goals: importador universal, reglas de puntuación oficial, nuevos tipos de respuesta, cuentas personales y túnel público.

## Decisions

- `instrument_versions` conserva contenido, estado, instrumento estable, versión de publicación y revisión de edición. Solo un borrador por instrumento; identificadores de preguntas estables al editar/reordenar.
- Guardado y publicación exigen revisión de edición vigente. Conflicto 409 conserva cambios locales.
- Borrador admite campos incompletos. Publicación exige al menos una pregunta, área, dominio, texto y cinco descriptores. Escala 1–5 validada siempre, sin coerción.
- Publicaciones inmutables; edición crea siguiente versión de parche. El taller recibe una instantánea completa.
- Migración a SQLite versión 2 conserva las tablas E1 y agrega el piloto una sola vez.
- Logo español descargado del sitio oficial OPS, guardado localmente sin modificar proporciones ni colores. Azul con acentos de nivel diferenciados por texto y número.
- Área y dominio son etiquetas por pregunta en esta entrega. Solo preguntas de madurez para no publicar contenido que el taller no sabe procesar.

## Risks / Trade-offs

No hay colaboración en vivo: se detecta el guardado obsoleto y el usuario decide cómo conservar/reconciliar sus cambios. No se fusionan bases locales y Docker. Las publicaciones indican disponibilidad de contenido, no validación metodológica.
