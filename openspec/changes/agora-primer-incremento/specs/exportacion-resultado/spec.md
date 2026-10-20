# Spec Delta

## Purpose

Exportar una copia del Excel conservando estructura, formato, fórmulas y gráficos relevantes; producir PDF y Word editable con ficha del taller, resultados por área y dominio, participación, acuerdos, justificaciones, evidencias, pendientes y próximos pasos; identificar el informe como preliminar o validado.

## ADDED Requirements

### Requirement: exportacion-excel-con-estructura

SHALL Exportar una copia del Excel conservando estructura, formato, fórmulas y gráficos relevantes. Definir cómo se recalculan los valores para no entregar gráficos vacíos o valores en caché desactualizados.

#### Scenario: exportacion-excel-con-formulas-y-graficos
- **WHEN** se exporta el resultado de un taller a Excel
- **THEN** se conserva estructura, formato, fórmulas y gráficos relevantes; los valores se recalculan para evitar gráficos vacíos o caché desactualizada

### Requirement: reporte-pdf-y-word

SHALL Producir PDF y Word editable con ficha del taller, versión, resultados por área y dominio, participación, acuerdos, justificaciones, evidencias, pendientes y próximos pasos.

#### Scenario: reporte-completo-con-pendientes-visibles
- **WHEN** se genera el informe de un taller
- **THEN** incluye ficha del taller, versión, resultados por área y dominio, participación, acuerdos, justificaciones, evidencias, pendientes y próximos pasos

### Requirement: informe-identificado-como-preliminar

SHALL Identificar el informe como preliminar o validado, con un flujo humano de revisión y cierre. No inventar recomendaciones ni atribuir validación a la OPS.

#### Scenario: informe-marcado-como-preliminar
- **WHEN** se genera el informe antes de la revisión humana
- **THEN** se identifica explícitamente como preliminar; solo pasa a validado tras el flujo humano de revisión y cierre
