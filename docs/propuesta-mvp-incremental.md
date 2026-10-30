# Ágora: propuesta de MVP con validación por entregas

Fecha: 26 de octubre de 2026.
Estado: alcance E1 aprobado por el usuario («procede con la primera entrega»). El estado de implementación y las pruebas se registra en docs/entrega-1-validacion.md.

## Objetivo

Construir Ágora mediante entregas ejecutables que permitan al usuario comprobar el recorrido del taller y corregir el producto con evidencia de uso. La solicitud actual autoriza avanzar hacia la implementación y sustituye la restricción histórica de limitarse a planificación.

## Situación comprobada

- Existen propuesta, diseño, tareas y seis especificaciones de capacidades en `openspec/changes/agora-primer-incremento/`.
- Existen ocho documentos complementarios, el Excel original, una guía de taller y dos prototipos HTML de referencia.
- No existe aplicación, manifiesto de dependencias ni configuración Docker de la aplicación.
- Los prototipos son referencias de interacción; no acreditan transmisión ni persistencia de votos.
- La auditoría escrita enumera hallazgos, pero no contiene un inventario detallado por fila, pregunta y fórmula. No debe interpretarse como auditoría metodológica terminada.
- Esta revisión cubre los documentos de especificación; la inspección detallada del contenido del Excel y de la guía del taller queda como actividad previa a seleccionar las preguntas reales de la primera entrega.

## Enfoques considerados

1. **Recorridos funcionales pequeños, recomendación:** construir primero una sala con pocas preguntas y completar su recorrido entre dispositivos. Permite validar facilitación, comprensión y persistencia pronto; requiere limitar explícitamente cada entrega.
2. **Implementación por módulos completos:** terminar catálogo, luego servidor, luego interfaz y exportaciones. Facilita especialización, pero retrasa la validación de un taller real.
3. **Completar de una vez el primer incremento de OpenSpec:** incluye importador, sala, votos, consenso, recuperación y tres exportaciones. Conserva el agrupamiento actual, pero reúne demasiados riesgos antes de la primera demostración.

El usuario aprobó el enfoque 1 y autorizó comenzar E1. Se conserva el diseño existente de React, TypeScript, Node.js, WebSockets y SQLite; no se propone una plataforma de alojamiento externa.

## Entregas propuestas

| Entrega | Resultado que puede probar el usuario | Validación observable |
| --- | --- | --- |
| E1. Un taller pequeño completo | Crear taller, ingresar por QR o código, responder desde móvil, cerrar, mostrar resultados y guardar consenso justificado | Computadora y dos participantes independientes completan el recorrido; al reiniciar se conservan votos y consenso |
| E2. Facilitar un taller de varias preguntas | Avanzar preguntas, pausar y retomar, repetir rondas, consultar historial y registrar pendientes de evidencia | Repetir votación conserva las rondas y el consenso anterior; retomar recupera el taller |
| E3. Instrumento y resultados trazables | Ampliar catálogo con mapeo auditado y exportar una copia del Excel con consensos | Revisar celdas escritas, pendientes, conservación de fórmulas y recálculo; documentar las diferencias metodológicas |
| E4. Informes y paquete portátil | Word, PDF, respaldo y restauración, operación Docker preparada sin internet | Abrir informes, restaurar en instalación limpia y ensayar desde teléfonos en LAN sin internet |
| E5. Administración de instrumentos | Editar borradores y publicar versiones, incluir preguntas de texto y selección múltiple | Editar el catálogo no altera talleres existentes; preguntas no puntuables no reciben puntajes implícitos |

La persistencia SQLite, la protección del facilitador, los recursos locales y la separación entre vistas se incluyen desde E1. E4 completa y verifica la distribución portátil; no introduce estas garantías tardíamente. Las entregas son puntos de validación, no declaraciones de que el MVP completo esté terminado.

## Alcance concreto de E1

**Objetivo:** validar el recorrido de participación y consenso con contenido real acotado.

- Catálogo inicial de tres preguntas de madurez con sus cinco descriptores originales, seleccionadas después de inspeccionar el Excel. Si alguna presenta ambigüedad metodológica, elegir otra documentando el motivo. Identificar el conjunto como piloto parcial.
- Taller vinculado a una versión inmutable del conjunto piloto; ficha con país/institución, fecha, alcance y facilitador.
- Vista de facilitador protegida, vista móvil y vista de proyección sin controles ni identidades individuales.
- Código de sala y QR con una dirección LAN configurable y visible para comprobarla desde el teléfono.
- Credencial de participante emitida por el servidor y limitada a la sala. La recuperación en el mismo navegador no se presenta como prueba de identidad personal única.
- Secuencia de preparación, apertura, cierre, discusión y consenso; selección explícita de la pregunta activa.
- Cambios de respuesta antes del cierre, historial y una respuesta vigente por participante y ronda.
- Confirmación solo después de persistir. Desconexión visible y recuperación del estado al reconectar.
- Distribución ausente de los datos del participante durante votación; visible al cierre.
- Consenso registrado por el facilitador con nivel y justificación, separado de los votos.
- Persistencia tras reinicio y guía breve de demostración.

E1 no incluye resultados agregados oficiales, correcciones de fórmulas, importador universal, informes Word/PDF ni exportación Excel. No atribuye validación institucional al piloto. Los estados «no aplica», «no sé» y abstención requieren revisar su uso en el instrumento antes de habilitarlos; falta de respuesta se representa como ausencia, nunca como cero.

## Decisiones de contrato propuestas antes de programar

1. **Reintentos:** el contrato actual indica 409 para un voto duplicado, mientras VR4 permite actualizar. Propuesta: usar un identificador de envío; un reintento idéntico devuelve el acuse persistido, sin nueva escritura ni historial duplicado. Reutilizar el identificador con otro contenido produce conflicto. Un cambio deliberado usa otro identificador y conserva la respuesta anterior.
2. **Cierre concurrente:** serializar la aceptación del voto y el cierre en transacciones. Si el cierre ya se confirmó, rechazar un envío nuevo. Un reintento de un voto aceptado antes del cierre recupera su acuse. No decidir por la hora del teléfono.
3. **Autorización:** deducir el participante de su credencial y el autor del consenso de la sesión del facilitador; no confiar en identificadores de identidad enviados libremente en el cuerpo.
4. **Revotación:** crear otra ronda conservando el consenso vigente. Solo una acción explícita del facilitador crea una revisión del consenso; abrir la ronda no fabrica un nuevo acuerdo.
5. **Metodología:** conservar el original sin modificar y registrar decisiones sobre filas ocultas, numeración repetida y MAGO!H3. No asumir que un rango sospechoso deba corregirse sin validación.

Estas propuestas deben trasladarse a los contratos y escenarios OpenSpec al preparar la implementación, con trazabilidad a las tareas existentes.

## Preparación y comprobación de E1

**Dependencias:** inspección del Excel original, elección de las tres preguntas, definición de credenciales y ajuste del contrato de votos. **Responsable:** coordinador/integrador, combinando los roles de instrumento, sala e interfaz según AGENTS.md.

**Archivos previstos:** código cliente y servidor, esquema y migraciones SQLite, catálogo piloto con procedencia, contratos, pruebas de integración y guía de demostración. Las rutas definitivas y las tareas pequeñas se concretarán en el plan de implementación.

**Pruebas necesarias:** validación de niveles y descriptores, accesos entre roles y salas, ausencia de distribución antes del cierre, reintentos y cambios, carrera voto/cierre, justificación obligatoria, recuperación tras reinicio y reconexión. Comprobar interfaz móvil y navegación con teclado. La prueba con un teléfono físico queda diferenciada de una prueba de navegador automatizada.

**Demostración:** crear taller → conectar dos participantes → abrir pregunta → recibir dos votos → modificar uno sin aumentar el número de votantes → cerrar → comprobar distribución → registrar consenso → reiniciar → verificar los mismos datos. El usuario valida comprensión de las pantallas y correspondencia con su dinámica de taller.

## Regla de avance

Cada entrega presenta una dirección ejecutable, pasos breves de prueba, evidencia de las verificaciones y limitaciones conocidas. Se registra la devolución del usuario antes de ampliar al siguiente bloque funcional. Las tareas OpenSpec se marcan completas únicamente cuando exista implementación y evidencia de sus criterios, conservando como pendientes las capacidades aún no construidas.
