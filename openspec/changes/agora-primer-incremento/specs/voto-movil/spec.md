# Spec Delta

## Purpose

Gestionar una pregunta activa por sala con estados explícitos de preparación, votación abierta, cierre, discusión y consenso, y una respuesta vigente por participante y ronda con confirmación de recepción tras persistencia.

## ADDED Requirements

### Requirement: una-pregunta-activa-por-sala

SHALL Una pregunta activa por sala, con estados explícitos: preparación, votación abierta, cierre, discusión y consenso.

#### Scenario: estados-explicitos-de-pregunta
- **WHEN** el facilitador avanza una pregunta por sus estados
- **THEN** la pregunta transita por preparación → votación abierta → cierre → discusión → consenso, y los participantes ven el estado vigente

### Requirement: una-respuesta-vigente-por-participante-y-ronda

SHALL Una respuesta vigente por participante y ronda. Especificar si se permite cambiarla antes del cierre y cómo se conserva su historial.

#### Scenario: respuesta-vigente-por-ronda
- **WHEN** un participante envía una respuesta en una ronda
- **THEN** se registra como respuesta vigente para ese participante y ronda; se permite cambiar antes del cierre y se conserva el historial de cambios

### Requirement: reintento-idempotente

SHALL Reintentar el mismo envío no debe duplicar votos.

#### Scenario: reintento-no-duplica-voto
- **WHEN** un participante reenvía la misma respuesta antes del cierre
- **THEN** no se duplica el voto; se actualiza la respuesta vigente existente

### Requirement: confirmacion-despues-de-persistir

SHALL Confirmar «voto recibido» únicamente después de persistirlo. Si no hay conexión, mostrar pendiente o error, nunca simular confirmación.

#### Scenario: confirmacion-solo-despues-de-persistir
- **WHEN** el servidor persiste un voto
- **THEN** envía confirmación de «voto recibido»; si no hay conexión, muestra pendiente o error, nunca simula confirmación

### Requirement: distribucion-oculta-hasta-el-cierre

SHALL Mantener la distribución oculta para los participantes hasta el cierre, también en los datos que se les envían.

#### Scenario: distribucion-oculta-durante-votacion
- **WHEN** una votación está abierta
- **THEN** los datos enviados a participantes no incluyen la distribución de respuestas; solo se revela tras el cierre

### Requirement: carrera-envio-cierre-determinista

SHALL Resolver y probar la carrera entre envío y cierre de ronda con una regla del servidor determinista.

#### Scenario: envio-concurrente-con-cierre-regla-determinista
- **WHEN** un envío y el cierre de ronda ocurren concurrentemente
- **THEN** el servidor aplica una regla determinista para decidir si el envío es válido o se rechaza por cierre ya ocurrido

### Requirement: nueva-ronda-conserva-anteriores

SHALL Abrir una nueva ronda crea otro registro y conserva las rondas anteriores.

#### Scenario: nueva-ronda-conserva-rondas-previas
- **WHEN** se abre una nueva ronda
- **THEN** se crea un registro independiente y se conservan íntegramente las rondas anteriores sin reinicio destructivo de conteos
