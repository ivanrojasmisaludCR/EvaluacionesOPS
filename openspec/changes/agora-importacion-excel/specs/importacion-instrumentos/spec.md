# Spec Delta

## Purpose

Importar instrumentos de madurez desde una plantilla definida, con revisión previa y preservación de versiones y talleres.

## ADDED Requirements

### Requirement: plantilla-excel

El sistema SHALL ofrecer una plantilla .xlsx con hojas Ficha y Preguntas, metadatos de edición y exactamente cinco columnas de descriptores.

#### Scenario: descargar-plantilla
- **WHEN** un administrador solicita la plantilla
- **THEN** recibe el mismo formato que procesa el importador, con instrucciones y campos vacíos para completar

### Requirement: revision-sin-escritura

El sistema SHALL validar el archivo y presentar errores por hoja y celda sin crear instrumentos durante la vista previa.

#### Scenario: descriptor-faltante
- **WHEN** un Excel contiene una pregunta sin descriptor del nivel 3
- **THEN** se señala su celda y se bloquea guardar la importación hasta corregirlo

### Requirement: lectura-acotada

El sistema SHALL rechazar archivos o estructuras que excedan los límites y rangos combinados antes de materializar el modelo Excel.

#### Scenario: rango-excesivo
- **WHEN** un archivo pequeño declara un rango combinado que abarca toda la hoja
- **THEN** se rechaza con error de formato o límites sin agotar la memoria del proceso

#### Scenario: formula-con-cache
- **WHEN** una celda importable contiene una fórmula con un valor en caché aparentemente válido
- **THEN** se rechaza la fórmula y se pide texto, sin evaluar ni usar el resultado en caché

### Requirement: borrador-atomico-idempotente

El sistema SHALL guardar la importación válida como borrador en una transacción y recuperar el resultado al reintentar la misma solicitud.

#### Scenario: respuesta-perdida
- **WHEN** se reenvía la misma solicitud aceptada, incluso después de editar el borrador
- **THEN** se devuelve ese borrador sin crear otro ni sobrescribir sus cambios posteriores

### Requirement: edicion-con-identidad-estable

El sistema SHALL permitir importar otra edición de una publicación seleccionada conservando los IDs de códigos coincidentes y los talleres anteriores.

#### Scenario: cambio-anual
- **WHEN** una nueva edición modifica el texto de un código existente y agrega otro código
- **THEN** se conserva el ID de la pregunta existente, se asigna otro ID a la nueva y no se altera ningún taller previo

### Requirement: acceso-administrativo-importacion

El servidor SHALL proteger descarga, revisión y confirmación mediante acceso administrativo y conservar validación de origen.

#### Scenario: participante-intenta-importar
- **WHEN** un participante intenta cargar un instrumento
- **THEN** el servidor rechaza la operación antes de procesar el archivo
