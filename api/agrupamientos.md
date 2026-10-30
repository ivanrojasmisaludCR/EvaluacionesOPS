# Resultados por agrupamiento

`GET /api/salas/:code/estado` añade `groups` para los tres perfiles autorizados. Cada grupo corresponde al par exacto Área + Dominio de la instantánea del taller; el editor y la plantilla Excel usan esos mismos campos. No se unen dominios de áreas distintas ni se exige que las preguntas sean consecutivas.

Cada elemento contiene `id` (par serializado), `area`, `domain`, `questionIds`, `total`, `completed`, `complete`, `average` y `score`. Solo cuentan consensos registrados, uno por pregunta. Antes de completarse todos, `average` y `score` son `null`. Después, `average` es la media aritmética sin redondear y `score` es esa media redondeada a entero, con .5 hacia arriba. No se usan votos individuales ni ceros para preguntas pendientes. No incluye promedio global ni de áreas.

Los grupos se reconstruyen de las preguntas y consensos persistidos; no requieren migración. Cambiar una versión del catálogo no modifica la instantánea de talleres existentes.
