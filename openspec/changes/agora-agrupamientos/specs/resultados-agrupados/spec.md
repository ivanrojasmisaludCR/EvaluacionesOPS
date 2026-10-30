## ADDED Requirements

### Requirement: Agrupar preguntas de la instantánea

El sistema SHALL agrupar por el par exacto Área + Dominio de la instantánea del taller y conservar independencia entre áreas.

#### Scenario: Dominio repetido en áreas diferentes
- **WHEN** dos preguntas tienen igual dominio y áreas diferentes
- **THEN** pertenecen a agrupamientos distintos

### Requirement: Promedio únicamente de grupos completos

El sistema SHALL usar el último consenso de cada pregunta con igual peso y SHALL dejar promedio y nivel nulos hasta completar todos los consensos.

#### Scenario: Grupo incompleto
- **WHEN** dos de tres preguntas tienen consenso
- **THEN** el avance muestra dos de tres y el promedio queda pendiente

#### Scenario: Grupo completo
- **WHEN** los consensos del grupo son 2, 3 y 5
- **THEN** la media es 10/3 y el nivel redondeado es 3

#### Scenario: Redondeo de mitad
- **WHEN** la media es 2.5
- **THEN** el nivel redondeado es 3

#### Scenario: Recuperación
- **WHEN** se reinicia el servidor tras guardar los consensos
- **THEN** se reconstruyen los mismos resultados de los datos persistidos
