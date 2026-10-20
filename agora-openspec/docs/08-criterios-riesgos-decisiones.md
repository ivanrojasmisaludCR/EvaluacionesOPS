# 8. Criterios de preparación y finalización, riesgos, supuestos y decisiones pendientes

## Criterios de preparación (antes de iniciar desarrollo)

- [ ] OpenSpec 1.14.0 inicializado en el repositorio (`openspec init --tools opencode --language es`)
- [ ] Plan de agentes aprobado (`06-plan-de-agentes.md`)
- [ ] Contratos y reglas de validación acordados (`03-contratos-validacion.md`)
- [ ] Auditoría del instrumento revisada por responsable metodológico (`01-auditoria-instrumento-mapeo.md`)
- [ ] Matriz de trazabilidad revisada (`05-matriz-de-trazabilidad.md`)
- [ ] AGENTS.md creado en la raíz del repositorio
- [ ] Definiciones de agentes OpenCode creadas (`.opencode/agents/`)

## Criterios de finalización del primer incremento

- [ ] Instrumento mínimo importado del Excel con identificadores estables
- [ ] Sala LAN con QR y código de sala funcionando en red local
- [ ] Votación móvil con confirmación de tras persistencia
- [ ] Cierre de ronda con consenso persistido y justificación
- [ ] Recuperación de sesión tras reinicio
- [ ] Exportación de Excel, PDF y Word generados
- [ ] Pruebas de dominio, concurrencia, E2E y exportación ejecutadas y aprobadas por QA Independiente
- [ ] Respaldo consistente y restauración en instalación limpia verificados
- [ ] Todos los documentos de planificación validados con `openspec validate --all`

## Riesgos

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Diferencias de cálculo entre producto y Excel | Alto | Alta | Auditoría del instrumento, catálogo de mapeo, pruebas de referencia independientes |
| SQLite bloqueo por escrituras concurrentes | Medio | Media | Transacciones cortas, regla determinista para carrera envío-cierre |
| Recurso faltante para operación sin internet | Medio | Media | Inventario de dependencias, prueba de arranque LAN sin internet |
| Votos duplicados por cookie (no persona única) | Medio | Alta | Credencial de participante por sesión, documento de alcance real |
| Cambio de dirección LAN o túnel | Bajo | Media | Regeneración de QR sin perder sesión; acceso LAN como fallback |

## Supuestos

1. El facilitador tiene una computadora con Docker para ejecutar la aplicación.
2. Los asistentes tienen navegador móvil con cámara para escanear QR.
3. La red LAN permite comunicación entre la computadora anfitriona y los dispositivos móviles.
4. El instrumento Excel IS4H_MMC-ES-V4-julio-26.xlsx es la fuente de verdad metodológica para el primer incremento.
5. OpenSpec 1.14.0 es la versión oficial y estable para generar artefactos de planificación.
6. OpenCode es el entorno de agentes para la implementación.

## Decisiones pendientes con impacto

| # | Pregunta | Propuesta provisional | Trabajo que puede continuar sin ella | Impacto si no se resuelve |
|---|----------|----------------------|-------------------------------------|--------------------------|
| P1 | ¿Cómo se resuelven identificadores repetidos en el Excel? | Sufijar con versión o área | Modelo de dominio y esquema JSON (usar IDs temporales) | Alto: afecta unicidad de preguntas |
| P2 | ¿Se excluyen filas ocultas del catálogo? | Excluir como inactivas | Importación del instrumento | Medio: afecta conteo de preguntas |
| P3 | ¿Qué rango corregir en MAGO!H3 (H4:H5 vs H4:H6)? | Extender a H4:H6 con decisión registrada | Catálogo de mapeo de celdas | Medio: afecta fórmulas de exportación |
| P4 | ¿Qué preguntas son selección múltiple vs madurez? | Clasificar por evidencia en el Excel | Modelo de tipo de pregunta | Alto: afecta asignación de puntaje |
| P5 | ¿Cloudflare Quick Tunnels o túnel estable para eventos recurrentes? | Quick Tunnels para piloto, cloudflared para recurrentes | Operación Docker y red | Bajo: afecta acceso remoto, no el MVP LAN |
| P6 | ¿Objetivo de carga p95 ≤ 2s se valida antes del primer evento? | Proponer como objetivo por validar | Desarrollo del MVP (no bloquea) | Medio: afecta expectativas de rendimiento |

## Trabajo que no debe iniciarse sin decisión metodológica

- Corrección definitiva de fórmulas del Excel (requiere P3 y P4).
- Clasificación final de preguntas como madurez vs selección múltiple (requiere P4).
- Validación de equivalencia completa con el Excel (deja para incremento posterior).

## Archivos bajo este documento

- `agora-openspec/docs/08-criterios-riesgos-decisiones.md` (este archivo)
