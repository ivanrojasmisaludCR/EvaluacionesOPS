# Spec Delta

## Purpose

Permitir al facilitador registrar el nivel final acordado y justificación por pregunta, conservar por separado votos, rondas, consenso vigente y revisiones del consenso con autor y fecha, y permitir dejar preguntas pendientes que requieran evidencia.

## ADDED Requirements

### Requirement: facilitador-registra-nivel-acordado

SHALL El facilitador registra el nivel final acordado y una justificación. Permitir dejar pendiente una pregunta que requiera evidencia.

#### Scenario: nivel-acordado-con-justificacion
- **WHEN** el facilitador registra el consenso para una pregunta
- **THEN** debe incluir el nivel final acordado y una justificación obligatoria; puede marcar la pregunta como pendiente de evidencia

### Requirement: conservacion-separada-de-estados

SHALL Conservar por separado votos, rondas, consenso vigente y revisiones del consenso, con autor y fecha. No reescribir los votos originales.

#### Scenario: votos-no-se-reescriben
- **WHEN** se actualiza el consenso de una pregunta
- **THEN** los votos originales permanecen inalterados; se crea un registro de revisión del consenso con autor y fecha

### Requirement: re-votacion-no-invalida-consenso

SHALL Especificar qué ocurre cuando se vuelve a votar una pregunta que ya tiene consenso; no invalidarlo ni reemplazarlo implícitamente.

#### Scenario: re-votacion-con-consenso-vigente
- **WHEN** se vuelve a votar una pregunta que ya tiene consenso registrado
- **THEN** el consenso vigente no se invalida ni se reemplaza implícitamente; una nueva revisión del consenso con autor y fecha solo se crea cuando el facilitador registra explícitamente otro acuerdo
