# Tasks

## 1. Instrumento mínimo y catálogo de mapeo

- [ ] 1.1 Auditoría del instrumento IS4H_MMC-ES-V4-julio-26.xlsx: hallazgos, ubicación, impacto y decisión pendiente (filas ocultas, IDs repetidos, MAGO!H3, preguntas de selección múltiple mezcladas con puntuación, fórmulas desactualizadas). Responsable: revisor metodológico. Criterios de aceptación: documento de auditoría con cada diferencia registrada.
- [ ] 1.2 Catálogo de mapeo pregunta → celda → regla → dominio → área, incluyendo entradas que no puntúan. Responsable: instrumentos y cálculo. Criterios de aceptación: archivo de mapeo JSON válido y revisado.
- [ ] 1.3 Modelo de dominio de instrumento: pregunta, área, dominio, identificador interno estable, nivel 1-5, descriptor, tipo de pregunta (madurez/selección múltiple/texto), estados no-aplica/no-sé/abstención/falta-respuesta. Responsable: instrumentos y cálculo. Criterios de aceptación: esquema JSON y ejemplos de instrumentos.
- [ ] 1.4 Servicio de importación del instrumento Excel al modelo interno, con validación de escala fija (solo niveles 1-5) y descriptores obligatorios. Responsable: instrumentos y cálculo. Criterios de aceptación: importación exitosa del Excel adjunto y rechazo de niveles fuera de escala.
- [ ] 1.5 Separación borrador/versión publicada: un instrumento publicado usado por sesión permanece inmutable; editarlo crea borrador de nueva versión. Responsable: instrumentos y cálculo. Criterios de aceptación: prueba de inmutabilidad durante sesión vigente.
- [ ] 1.6 Pruebas de referencia independientes para contrastar cálculo con Excel (no usar la misma función del producto como resultado esperado). Responsable: QA independiente. Criterios de aceptación: suite de pruebas de referencia ejecutada y documentada.

Depende de: nada (inicio del incremento).
Paralelizable: 1.1 y 1.2 pueden ejecutarse en paralelo; 1.3 depende de 1.2; 1.4 depende de 1.3; 1.5 depende de 1.4; 1.6 depende de 1.4.

## 2. Sala LAN, QR e ingreso de participantes

- [ ] 2.1 Modelo de dominio de sala: taller, instrumento/versión, país/institución, fecha, alcance, facilitador, código de sala, QR con dirección LAN. Responsable: sesiones/votación. Criterios de aceptación: esquema JSON de sala y taller.
- [ ] 2.2 API REST de creación de taller y generación de código de sala. Responsable: sesiones/votación. Criterios de aceptación: endpoint POST /talleres responde con código de sala.
- [ ] 2.3 Generación de QR con dirección LAN accesible desde celular (no localhost, no IP interna de contenedor). Responsable: sesiones/votación. Criterios de aceptación: QR generado contiene dirección LAN resoluble; prueba desde teléfono en misma red.
- [ ] 2.4 Credencial de participante por sesión y recuperación al reconectar. Responsable: sesiones/votación. Criterios de aceptación: participante recupera credencial y respuesta vigente tras reconexión.
- [ ] 2.5 Middleware de control de acceso: participante no accede a rutas de administración, reportes o sesiones ajenas. Responsable: interfaz y accesibilidad. Criterios de aceptación: intentos de acceso denegados con código 403.
- [ ] 2.6 Prueba de arranque en LAN sin salida a internet, con instalación preparada previamente. Responsable: operación Docker. Criterios de aceptación: taller funcional en LAN sin internet; dirección LAN correcta en interfaces múltiples.

Depende de: 1.3 (modelo de dominio de instrumento para referencia en taller).
Paralelizable: 2.1 y 2.2 en paralelo; 2.3 depende de 2.2; 2.4 depende de 2.2; 2.5 depende de 2.2; 2.6 depende de 2.3 y 2.4.

## 3. Votación móvil con confirmación de recepción

- [ ] 3.1 Estados de pregunta: preparación, votación abierta, cierre, discusión, consenso. Transiciones explícitas. Responsable: sesiones/votación. Criterios de aceptación: máquina de estados válida; transiciones inválidas rechazadas.
- [ ] 3.2 WebSocket para tiempo real de sala: estado de pregunta, distribución oculta hasta cierre, envío de voto. Responsable: sesiones/votación. Criterios de aceptación: clientes reciben estado de pregunta; distribución no enviada a participantes durante votación.
- [ ] 3.3 Una respuesta vigente por participante y ronda; cambio permitido antes del cierre; historial conservado. Responsable: sesiones/votación. Criterios de aceptación: respuesta vigente actualizada; historial de cambios accesible.
- [ ] 3.4 Reintento idempotente: reenvío no duplica voto. Responsable: sesiones/votación. Criterios de aceptación: mismo envío repetido no crea voto duplicado.
- [ ] 3.5 Confirmación de voto recibido solo tras persistir; sin conexión muestra pendiente o error. Responsable: sesiones/votación. Criterios de aceptación: confirmación solo después de persistencia; modo offline muestra pendiente.
- [ ] 3.6 Regla determinista para carrera envío-cierre de ronda. Responsable: sesiones/votación. Criterios de aceptación: envío concurrente con cierre resuelto de forma determinista y probada.
- [ ] 3.7 Nueva ronda crea registro independiente y conserva rondas anteriores. Responsable: sesiones/votación. Criterios de aceptación: rondas previas accesibles e íntegras tras nueva ronda.
- [ ] 3.8 Pruebas de concurrencia: voto correcto, cambio permitido, envío tras cierre, envío concurrente con cierre. Responsable: QA independiente. Criterios de aceptación: suite de pruebas de concurrencia ejecutada; cero duplicados, cero pérdidas de votos confirmados.

Depende de: 2.4 (credencial de participante).
Paralelizable: 3.1 y 3.2 en paralelo; 3.3 depende de 3.1; 3.4 depende de 3.2; 3.5 depende de 3.2; 3.6 depende de 3.1 y 3.2; 3.7 depende de 3.1; 3.8 depende de 3.1-3.7.

## 4. Cierre de ronda y consenso

- [ ] 4.1 Facilitador registra nivel final acordado y justificación obligatoria. Responsable: cierre-consenso. Criterios de aceptación: sin justificación no se registra consenso; pregunta puede marcarse pendiente de evidencia.
- [ ] 4.2 Conservación separada de votos, rondas, consenso vigente y revisiones con autor y fecha. Responsable: cierre-consenso. Criterios de aceptación: votos originales inalterados tras revisión de consenso.
- [ ] 4.3 Re-votación no invalida ni reemplaza consenso implícitamente; genera nueva revisión. Responsable: cierre-consenso. Criterios de aceptación: consenso vigente preservado; nueva revisión registrada con autor y fecha.
- [ ] 4.4 Prueba de cambio de consenso con historial intacto y justificación obligatoria. Responsable: QA independiente. Criterios de aceptación: historial de consenso accesible; cambio sin justificación rechazado.

Depende de: 3.7 (rondas conservadas).
Paralelizable: 4.1, 4.2, 4.3 pueden ejecutarse en paralelo tras 3.7; 4.4 depende de 4.1-4.3.

## 5. Recuperación de sesión y persistencia

- [ ] 5.1 Persistencia en volumen con copias consistentes durante uso (no copiar archivo SQLite abierto directamente). Responsable: operación Docker. Criterios de aceptación: respaldo consistente generado mientras sesión activa.
- [ ] 5.2 Restauración de sesión tras reinicio de la aplicación: estado, votos, rondas, consenso intactos. Responsable: operación Docker. Criterios de aceptación: sesión restaurada correctamente tras reinicio.
- [ ] 5.3 Pausa y retomada del segundo día. Responsable: operación Docker. Criterios de aceptación: taller suspendido al día 1 y reanudado al día 2 sin pérdida de datos.
- [ ] 5.4 Migraciones versionadas y recuperación tras fallo. Responsable: operación Docker. Criterios de aceptación: migración aplicada sin pérdida de datos; restauración en instalación limpia verificada.

Depende de: 3.8 (votos confirmados sin pérdidas).
Paralelizable: 5.1 y 5.2 en paralelo; 5.3 depende de 5.2; 5.4 depende de 5.1.

## 6. Exportación de resultados (Excel, PDF, Word)

- [ ] 6.1 Exportación de copia del Excel conservando estructura, formato, fórmulas y gráficos. Responsable: exportaciones. Criterios de aceptación: archivo XLSX generado con fórmulas y gráficos relevantes; valores recalculados.
- [ ] 6.2 Generación de PDF y Word editable con ficha del taller, resultados por área/dominio, participación, acuerdos, justificaciones, evidencias, pendientes, próximos pasos. Responsable: exportaciones. Criterios de aceptación: PDF y DOCX generados con todos los campos requeridos.
- [ ] 6.3 Identificación del informe como preliminar o validado; flujo humano de revisión y cierre. Responsable: exportaciones. Criterios de aceptación: informe marcado como preliminar antes de revisión humana.
- [ ] 6.4 Prueba de exportación XLSX: verificación de celdas, cálculos, gráficos y formato. Responsable: QA independiente. Criterios de aceptación: exportación verificada contra expectativas conocidas.
- [ ] 6.5 Prueba de PDF/Word con textos extensos y pendientes visibles. Responsable: QA independiente. Criterios de aceptación: documentos generados con textos largos y pendientes visibles.

Depende de: 4.4 (consenso persistido) y 5.4 (persistencia verificada).
Paralelizable: 6.1 y 6.2 en paralelo; 6.3 depende de 6.1 y 6.2; 6.4 depende de 6.1; 6.5 depende de 6.2.
