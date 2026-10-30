# Exportación de resultados

`GET /api/salas/:code/exportar/:format` requiere cookie administrativa vigente. `format`: `xlsx` o `pdf`. Participante/proyección/sin sesión: 401; sala inexistente: 404; formato inválido: 400; generador ocupado: 503 reintentable. Respuesta 200 binaria con Content-Disposition attachment, nombre `agora-CODIGO-FECHA.ext`, Content-Type correspondiente y Cache-Control no-store.

Instantánea al iniciar cada descarga: todas las preguntas de la versión congelada, ficha, edición, hora UTC, resúmenes actuales y perfiles gráficos de todas las áreas. Incluye distribución de votos vigentes de rondas cerradas, descriptores de niveles, consenso vigente, justificación (observaciones), autor y fecha. Oculta distribución de rondas abiertas/preparación incluso en exportación administrativa. No incluye nombres/IDs de participantes, tokens, cookies ni historial de cambios de voto. Cada archivo es preliminar; los pendientes se distinguen de cero. Exportar no cambia fase, pregunta activa, votos ni consensos.

Excel: hojas Resumen, Dominios, Preguntas y Gráficos; valores numéricos y textos literales, gráficos como imágenes estáticas. PDF: mismo contenido, detalle paginado y gráficos. No es el archivo oficial de IS4H completado. No incorpora observaciones individuales que la aplicación no recoge.
