## ADDED Requirements

### Requirement: Descargar informes de resultados actuales

El sistema SHALL permitir al facilitador descargar Excel y PDF mediante un botón en Resultados, con ficha, versión del instrumento, fecha de generación, resumen por área y dominio, gráficos y todas las preguntas.

#### Scenario: Exportar taller incompleto

- **WHEN** el facilitador exporta un taller con preguntas pendientes
- **THEN** el informe contiene todos los agrupamientos y preguntas, indica resultado parcial y mantiene los pendientes sin convertirlos en cero

### Requirement: Conservar respuestas y consensos por separado

El informe SHALL incluir descriptores de los cinco niveles, distribución anónima de votos vigentes de rondas cerradas y consenso con justificación/observaciones, autor y fecha; SHALL conservar los mismos cálculos que la consulta de resultados.

#### Scenario: Cambio de voto y consenso distinto

- **WHEN** un participante cambia de nivel y se registra un consenso diferente
- **THEN** la distribución cuenta solo su respuesta vigente y el nivel de consenso permanece separado de esa distribución

#### Scenario: Votación abierta

- **WHEN** se exporta mientras una pregunta mantiene la votación abierta
- **THEN** las valoraciones de esa pregunta se indican como ocultas hasta el cierre

### Requirement: Exportación protegida y sin efectos sobre el taller

El sistema SHALL exigir sesión administrativa para las descargas y SHALL generar una instantánea sin modificar pregunta activa, fases, votos ni consensos.

#### Scenario: Acceso de participante o proyección

- **WHEN** un participante, proyector o visitante solicita un archivo sin sesión administrativa
- **THEN** la descarga es rechazada sin revelar el informe

### Requirement: Contenido legible y literal

El sistema SHALL mantener las preguntas y observaciones extensas completas, paginadas en PDF o continuadas en Excel; SHALL tratar los textos como literales sin ejecutarlos como fórmulas.

#### Scenario: Observación con muchas líneas

- **WHEN** una observación supera la altura visible de una fila de Excel
- **THEN** se divide en filas de continuación sin perder su contenido
