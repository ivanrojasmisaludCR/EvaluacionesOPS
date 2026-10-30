## ADDED Requirements

### Requirement: Menú común accesible

El sistema SHALL ofrecer enlaces a Inicio, Talleres, Instrumentos, Importar Excel y Participar desde el encabezado, conservando los permisos existentes.

#### Scenario: Participación desde móvil
- **WHEN** una persona abre el menú y elige Participar
- **THEN** se muestra la entrada por código de sala

#### Scenario: Teclado
- **WHEN** se pulsa Escape con foco dentro del menú
- **THEN** el menú se cierra y el foco vuelve a su control

### Requirement: Importación con enlace directo

El sistema SHALL abrir la pantalla de importación al visitar /instrumentos#importar con acceso autorizado.

#### Scenario: Recargar importación
- **WHEN** el facilitador recarga /instrumentos#importar
- **THEN** se muestra la pantalla de importación

#### Scenario: Cerrar importación
- **WHEN** el facilitador pulsa Cerrar importación
- **THEN** se oculta el formulario y se elimina el indicador de importación del enlace
