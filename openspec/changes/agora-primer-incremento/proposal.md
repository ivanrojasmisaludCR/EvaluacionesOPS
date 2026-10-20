# Proposal

## Why

La OPS realiza talleres participativos proyectando un Excel, leyendo preguntas y recogiendo votos orales. Esto genera cansancio, dificulta registrar percepciones, desacuerdos y justificaciones, y no deja rastro verificable de la votación ni del consenso. Se necesita una plataforma portátil (nombre provisional Ágora) que permita a los asistentes ingresar por QR desde el navegador del celular, responder, ver resultados cuando el facilitador lo decida y discutir hasta acordar un consenso. El facilitador controla la sesión desde una computadora con Docker y registra la respuesta final.

## What Changes

Se crea el primer incremento vertical de Ágora: un instrumento mínimo de evaluación de madurez, una sala LAN con QR e ingreso de participantes, votación móvil con confirmación de recepción, cierre de ronda, consenso persistido, recuperación de sesión tras reinicio y exportación de resultados (Excel, PDF, Word). Este incremento no certifica equivalencia completa con el Excel original; esa validación queda para incrementos posteriores.

## Capabilities

### New Capabilities

- `instrumento-minimo`: Catálogo mínimo de instrumento con preguntas, áreas, dominios, identificadores internos estables, escala fija de 5 niveles y descriptores obligatorios por nivel.
- `sala-lan`: Creación de taller con instrumento/versión, país/institución, fecha, alcance y facilitador; generación de QR y código de sala; ingreso desde navegador móvil sin aplicación ni cuenta obligatoria.
- `voto-movil`: Una pregunta activa por sala, estados de preparación/votación abierta/cierre/discusión/consenso, una respuesta vigente por participante y ronda, reintento idempotente, confirmación de voto recibido solo tras persistir, distribución oculta hasta el cierre.
- `cierre-consenso`: El facilitador registra el nivel final acordado y justificación; conservación separada de votos, rondas, consenso vigente y revisiones con autor y fecha; no reescritura de votos originales.
- `recuperacion`: Pausa y retomada del segundo día, restauración de sesión tras reiniciar la aplicación, persistencia en volumen con copias consistentes.
- `exportacion-resultado`: Exportación de copia del Excel conservando estructura y fórmulas, producción de PDF y Word editable con ficha del taller, resultados por área/dominio, participación, acuerdos, justificaciones, evidencias y pendientes; identificación del informe como preliminar.

### Modified Capabilities

<!-- No existing capabilities in this repository; all capabilities are new. -->

## Impact

- Nuevo código fuente (React + TypeScript frontend, Node.js servidor, SQLite local, Docker Compose).
- Nuevos esquemas de base de datos para instrumentos, sesiones, votos, rondas y consenso.
- Contratos HTTP y eventos WebSocket en tiempo real.
- Archivos de exportación (XLSX, PDF, DOCX) generados en el servidor.
- Volumen de Docker para persistencia local sin internet.
