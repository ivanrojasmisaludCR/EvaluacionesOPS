# 4. Plan de pruebas

## Estrategia de pruebas

Combinación de pruebas unitarias, integración, contratos, E2E, concurrencia, recuperación y ensayo de taller. No se convierte cada detalle visual en prueba frágil ni se usa porcentaje de cobertura como única definición de calidad.

## Entornos

| Entorno | Propósito | Datos | Conexión internet |
|---------|-----------|-------|-------------------|
| Desarrollo | Pruebas unitarias y de integración | Fixtures locales | Opcional |
| Pruebas de contrato | Validación de APIs y eventos | Fixtures locales | No requerida |
| E2E LAN | Recorrido completo QR → consenso → exportación | Datos de taller simulado | No (simulado) |
| Ensayo de taller | 100 participantes, 1 voto cada uno | Datos sintéticos | No (LAN) |

## Herramientas

- Pruebas unitarias/integración: Vitest o Jest (Node.js)
- Pruebas de contrato: Supertest (HTTP) + ws (WebSocket)
- Pruebas E2E: Playwright (Chrome, Safari, Firefox)
- Pruebas de concurrencia: artillery o k6 (carga), scripts personalizados (carrera envío-cierre)
- Pruebas de recuperación: reinicio controlado del servidor + verificación de estado
- Exportación: validación de XLSX con librería independiente (no la misma función del producto)

## Fixtures y datos

### Instrumento
- Fixture: IS4H_MMC-ES-V4-julio-26.xlsx importado al modelo interno
- Fixture: instrumento mínimo sintético (5 preguntas, 2 áreas, 2 dominios)
- Fixture: pregunta de selección múltiple y texto (sin puntaje)

### Taller
- Fixture: taller con instrumento/versión, país, institución, fecha, alcance, facilitador
- Fixture: código de sala y QR generado

### Participantes
- Fixture: 100 participantes con credenciales únicas por sesión
- Fixture: respuestas por ronda (niveles 1-5, no-aplica, no-sé, abstención)

## Casos de prueba

### Dominio y cálculos (VR1-VR2)

| ID | Caso | Dado | Cuando | Entonces |
|----|------|------|--------|----------|
| D1 | Rechazo nivel 0 | Pregunta de madurez | Enviar nivel 0 | Rechazado (interfaz y directo) |
| D2 | Rechazo nivel 6 | Pregunta de madurez | Enviar nivel 6 | Rechazado (interfaz y directo) |
| D3 | Rechazo fraccionario | Pregunta de madurez | Enviar 3.5 | Rechazado |
| D4 | Rechazo texto | Pregunta de madurez | Enviar "alto" | Rechazado |
| D5 | Publicación con 5 descriptores | Pregunta de madurez | Publicar con 5 descriptores no vacíos | Aceptado |
| D6 | Publicación sin 5 descriptores | Pregunta de madurez | Publicar con 4 descriptores | Rechazado |
| D7 | Todos los niveles 1 | 5 preguntas | Todas respondidas con nivel 1 | Cálculo correcto |
| D8 | Todos los niveles 5 | 5 preguntas | Todas respondidas con nivel 5 | Cálculo correcto |
| D9 | Niveles mixtos | 5 preguntas | Niveles 1,2,3,4,5 | Cálculo correcto |
| D10 | Blancos y N/A | Preguntas | Sin respuesta y no-aplica | No se convierten en cero |
| D11 | Dominio sin respuestas válidas | Dominio | Todas las preguntas sin respuesta puntuable | Dominio marcado sin resultado |
| D12 | Referencia Excel | Cálculo del producto | Comparar con cálculo independiente | Coincidencia dentro de tolerancia registrada |

### Sesiones y concurrencia (VR3-VR7)

| ID | Caso | Dado | Cuando | Entonces |
|----|------|------|--------|----------|
| S1 | Voto correcto | Sesión activa, votación abierta | Participante envía nivel 3 | Voto registrado, confirmación tras persistir |
| S2 | Reintento idempotente | Voto existente | Mismo participante reenvía mismo valor | No se duplica; respuesta vigente actualizada |
| S3 | Cambio antes del cierre | Votación abierta | Participante cambia de nivel 3 a 4 | Respuesta vigente es 4; historial conserva ambos |
| S4 | Envío tras cierre | Ronda cerrada | Participante intenta enviar | Rechazado (409) |
| S5 | Envío concurrente con cierre | Cierre y envío al mismo tiempo | Regla determinista del servidor | Uno se acepta, otro se rechaza de forma determinista |
| S6 | Segunda ronda | Ronda 1 completada | Se abre ronda 2 | Ronda 1 conservada íntegramente |
| S7 | Desconexión y reconexión | Participante conectado | Se desconecta y reconecta | Recupera credencial y respuesta vigente |
| S8 | Reinicio del servidor | Sesión activa | Servidor se reinicia | Sesión restaurada con estado, votos, rondas, consenso |
| S9 | Cambio de consenso | Consenso vigente | Facilitador registra nuevo consenso | Historial intacto; nueva revisión con autor y fecha |
| S10 | Suspensión día 1 / reanudación día 2 | Sesión pausada | Se reanuda al día siguiente | Datos completos sin pérdida |

### Interfaz y acceso

| ID | Caso | Dado | Cuando | Entonces |
|----|------|------|--------|----------|
| I1 | Recorrido QR → consenso | QR generado | Escanear QR, votar, cerrar, registrar consenso | Recorrido completo exitoso |
| I2 | Móvil 320px | Dispositivo 320px de ancho | Cargar interfaz de participante | Elementos táctiles ≥ 44px, texto legible |
| I3 | Móvil 360px | Dispositivo 360px de ancho | Cargar interfaz de participante | Sin desbordamiento horizontal |
| I4 | Móvil 390px | Dispositivo 390px de ancho | Cargar interfaz de participante | Controles accesibles |
| I5 | Computadora y proyector | Pantalla de escritorio | Vista de proyector | Sin controles administrativos ni identidades individuales |
| I6 | Descriptores largos | Texto de descriptor > 200 chars | Mostrar en móvil | Texto se envuelve, no se trunca |
| I7 | Teclado y foco | Navegador con teclado | Navegar con Tab | Foco visible en todos los elementos interactivos |
| I8 | Contraste | Modo claro y oscuro | Verificar contraste | Relaje de contraste WCAG AA mínimo |
| I9 | Controles táctiles | Dispositivo táctil | Tocar botones | Respuesta táctil sin zoom accidental |
| I10 | Safari iOS | iOS Safari versión matriz | Cargar y usar aplicación | Funcional en versiones soportadas |
| I11 | Chrome Android | Chrome Android versión matriz | Cargar y usar aplicación | Funcional en versiones soportadas |
| I12 | Participante sin acceso admin | Sesión de participante | Intentar acceder a /admin | Rechazado (403) |
| I13 | Votos no publicados | Votación abierta | Intentar ver distribución | Datos no incluyen distribución |
| I14 | Código incorrecto | Código de sala inválido | Intentar unirse | Rechazado |
| I15 | Sesión finalizada | Sesión cerrada | Intentar participar | Rechazado |

### Infraestructura y entregables

| ID | Caso | Dado | Cuando | Entonces |
|----|------|------|--------|----------|
| X1 | Arranque LAN sin internet | Instalación preparada | Iniciar Docker Compose sin internet | Aplicación funcional en LAN |
| X2 | Dirección LAN en interfaces múltiples | Servidor con múltiples IPs | Generar QR | Dirección accesible desde celular en misma red |
| X3 | Fallo del túnel | Cloudflare túnel caído | QR regenerado con URL LAN | Sesión conservada, acceso LAN disponible |
| X4 | Respaldo consistente | Sesión activa | Generar respaldo | Respaldo restaurable en instalación limpia |
| X5 | Restauración en instalación limpia | Respaldo generado | Restaurar en entorno nuevo | Sesión recuperada con todos los datos |
| X6 | Exportación XLSX verificada | Taller completado | Exportar a Excel | Celdas, cálculos, gráficos y formato verificados |
| X7 | PDF/Word con textos extensos | Informe con pendientes | Generar PDF y Word | Textos largos y pendientes visibles |
| X8 | Carga 100 participantes | 100 dispositivos en LAN | 1 voto por participante | p95 ≤ 2s (objetivo por validar), cero duplicados, cero pérdidas |

## Matriz de entornos de prueba

| Navegador | Versiones | Dispositivo real | Emulación |
|-----------|-----------|-------------------|-----------|
| Safari iOS | iOS 16, 17, 18 | iPhone (real) | Simulador Xcode |
| Chrome Android | Chrome 120, 125, 130 | Android (real) | DevTools |
| Chrome Desktop | Última estable | Computadora | N/A |
| Firefox Desktop | Última estable | Computadora | N/A |

**Nota:** Distinguir emulación de comprobación en dispositivo real. Las pruebas en dispositivo real son obligatorias para Safari iOS y Chrome Android.

## Criterios de aprobación

- Cada requisito validado (VR1-VR7) tiene al menos un caso de prueba que pasa.
- Cero duplicados y cero pérdidas de votos confirmados en pruebas de concurrencia.
- Respaldo consistente y restaurable en instalación limpia.
- Exportación XLSX verificada contra expectativas conocidas.
- Recorrido E2E completo exitoso en dispositivo real (Safari iOS y Chrome Android).
- Objetivo de carga p95 ≤ 2s propuesto como objetivo por validar, no capacidad demostrada.

## Archivos bajo este documento

- `agora-openspec/docs/04-plan-de-pruebas.md` (este archivo)
- Pruebas implementadas en `tests/` (por crear en implementación)
