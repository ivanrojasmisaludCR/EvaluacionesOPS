# 1. Auditoría del instrumento y catálogo de mapeo

## Fuente auditada

`agora-openspec/referencias/IS4H_MMC-ES-V4-julio-26.xlsx`

## Hallazgos registrados

| # | Ubicación | Hallazgo | Impacto | Decisión pendiente | Responsable |
|---|-----------|----------|---------|---------------------|-------------|
| A1 | `IS4H_MMC-ES-V4-julio-26.xlsx` | Filas antiguas ocultas detectadas en el instrumento | Pueden afectar el conteo de preguntas y el mapeo a celdas | ¿Se excluyen filas ocultas del catálogo o se incluyen como inactivas? | Revisor metodológico |
| A2 | `IS4H_MMC-ES-V4-julio-26.xlsx` | Identificadores repetidos entre preguntas | Rompe la unicidad de identificadores internos estables | ¿Cómo se resuelven los IDs duplicados: sufijado, versión o nuevo ID? | Revisor metodológico |
| A3 | `MAGO!H3` | Fórmula referencia H4:H5 pero hay una pregunta adicional en fila 6 | El rango de la fórmula puede omitir la última pregunta | ¿Se extiende el rango a H4:H6 o se revisa la fórmula original? | Revisor metodológico |
| A4 | `IS4H_MMC-ES-V4-julio-26.xlsx` | Preguntas de selección múltiple mezcladas con preguntas de puntuación/maduridad | Riesgo de asignar puntaje numérico a preguntas que no deben tenerlo | ¿Qué preguntas son selección múltiple vs madurez? Documentar por pregunta. | Revisor metodológico |
| A5 | `IS4H_MMC-ES-V4-julio-26.xlsx` | Fórmulas con rangos posiblemente desactualizados | Los cálculos exportados pueden no coincidir con el instrumento original | ¿Se reproducen las fórmulas tal cual o se corrigen con decisión registrada? | Revisor metodológico |

## Reglas de mapeo (provisionales)

- Cada pregunta del instrumento recibe un identificador interno estable (UUID o slug versionado), independiente de la numeración visible y de las celdas de Excel.
- El mapeo pregunta → celda → regla → dominio → área se documenta en un archivo JSON separado.
- Las preguntas de selección múltiple y texto no reciben puntaje numérico por defecto ni se tratan como niveles de madurez.
- Las entradas que no puntúan se identifican explícitamente en el catálogo de mapeo.
- Nunca se sobrescriben celdas arbitrarias ni se introducen nuevos pesos implícitos.

## Asuntos que requieren responsable metodológico

1. Confirmar qué filas ocultas son realmente antiguas vs. activas (A1).
2. Resolver identificadores repetidos sin perder trazabilidad al Excel original (A2).
3. Verificar y decidir sobre `MAGO!H3` y rangos de fórmulas desactualizados (A3, A5).
4. Clasificar cada pregunta como madurez / selección múltiple / texto (A4).

## Trabajo que puede continuar sin resolución

- Definición del esquema JSON del instrumento con identificadores internos estables.
- Servicio de importación con validación de escala fija (niveles 1-5).
- Estructura de catálogo de mapeo con campos para marcar hallazgos pendientes.
