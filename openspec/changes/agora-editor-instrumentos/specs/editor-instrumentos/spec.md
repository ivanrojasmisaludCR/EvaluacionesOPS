# Spec Delta

## Purpose

Permitir crear y administrar instrumentos de madurez desde el navegador, manteniendo versiones publicadas y talleres existentes.

## ADDED Requirements

### Requirement: biblioteca-y-borradores

El sistema SHALL permitir al administrador crear instrumentos y guardar borradores de preguntas, área, dominio y descriptores, incluyendo contenido pendiente.

#### Scenario: guardar-y-continuar
- **WHEN** el administrador guarda un borrador con un descriptor pendiente
- **THEN** el borrador se conserva tras reiniciar y no puede publicarse hasta completar el contenido

### Requirement: escala-fija-publicacion-validada

El servidor SHALL aceptar exactamente los niveles enteros 1, 2, 3, 4 y 5 en ese orden y exigir todos sus descriptores antes de publicar.

#### Scenario: escala-invalida
- **WHEN** una petición directa cambia valores, elimina niveles o agrega un nivel 6
- **THEN** el servidor rechaza la petición sin guardar el cambio

#### Scenario: publicacion-incompleta
- **WHEN** se intenta publicar sin preguntas o con texto, área, dominio o descriptor vacío
- **THEN** el servidor rechaza la publicación e identifica el contenido pendiente

### Requirement: publicacion-inmutable

El sistema SHALL conservar las publicaciones inmutables y permitir crear una nueva versión borrador del mismo instrumento.

#### Scenario: editar-publicacion
- **WHEN** el administrador decide cambiar una publicación
- **THEN** se abre un borrador de otra versión con los IDs de las preguntas existentes conservados

### Requirement: taller-ligado-a-publicacion

El sistema SHALL permitir seleccionar una versión publicada al crear taller y conservar su contenido completo como instantánea.

#### Scenario: publicacion-posterior
- **WHEN** se publica una versión con una pregunta modificada después de crear un taller
- **THEN** el taller anterior conserva nombre, versión, preguntas, votos y consensos originales

### Requirement: conflicto-de-edicion

El sistema SHALL rechazar el guardado de una revisión obsoleta en lugar de sobrescribir cambios de otro editor.

#### Scenario: dos-pestanas
- **WHEN** una pestaña guarda después de que otra modificó la misma revisión
- **THEN** recibe conflicto y conserva su contenido local para decidir qué hacer

### Requirement: acceso-administrativo

El servidor SHALL limitar las operaciones del catálogo al acceso administrativo de la instalación.

#### Scenario: participante-intenta-editar
- **WHEN** una credencial de participante o de proyector intenta administrar instrumentos
- **THEN** el servidor rechaza la operación sin exponer contenido administrativo
