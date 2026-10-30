## ADDED Requirements

### Requirement: Resumen actual basado en consensos

El sistema SHALL calcular por dominio suma, media y nivel de los consensos disponibles, con nivel redondeado a entero. Cada área SHALL promediar con igual peso los niveles de dominios con datos y redondear a un decimal.

#### Scenario: Ponderación por dominio
- **WHEN** un dominio con tres preguntas tiene nivel 1 y otro con una pregunta tiene nivel 5
- **THEN** el área tiene nivel 3.0

#### Scenario: Dominio parcial
- **WHEN** un dominio tiene consensos 2 y 3 pero otra pregunta pendiente
- **THEN** su resultado actual es suma 5, media 2.5 y nivel 3, marcado parcial
- **AND** su resultado definitivo anterior permanece pendiente

#### Scenario: Sin consensos
- **WHEN** un dominio o área no tiene consensos
- **THEN** su puntaje es null y no se representa como cero

### Requirement: Consulta en cualquier momento

El sistema SHALL permitir consultar la página de resultados durante cualquier fase del taller, con actualización al registrar consensos y conservando autorización de sala.

#### Scenario: Lectura durante votación
- **WHEN** se consulta el resumen durante una votación abierta
- **THEN** solo se incorporan consensos ya guardados, sin exponer votos de esa votación
- **AND** no se modifica la pregunta activa ni la fase

#### Scenario: Recuperación persistente
- **WHEN** se reinicia la aplicación y se consulta el mismo taller
- **THEN** se reconstruye el mismo resumen desde su instantánea y consensos persistidos

### Requirement: Gráficos con pendientes explícitos

El sistema SHALL mostrar radar de áreas y dominios cuando haya entre tres y doce ejes; otros tamaños usarán una comparación por barras. Los ejes sin datos SHALL quedar sin puntos, sin transformarse en cero.

#### Scenario: Eje pendiente
- **WHEN** un dominio del radar no tiene consensos
- **THEN** se identifica como pendiente y no se dibuja un polígono cerrado usando un cero ficticio
