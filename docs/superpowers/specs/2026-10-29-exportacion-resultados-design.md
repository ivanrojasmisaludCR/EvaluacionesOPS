# Exportación de resultados a Excel y PDF

El facilitador descarga desde Resultados una instantánea del taller mediante «Exportar resultados», con opciones Excel y PDF. Ambos formatos incluyen ficha e instrumento/version/edición, fecha de generación, avance parcial o completo, resumen de todas las áreas y dominios, gráficos y cada pregunta con sus respuestas/descriptores, distribución anónima de valoraciones vigentes, consenso y justificación/observaciones, autor y fecha. No hay comentarios individuales almacenados; no se inventan observaciones nuevas.

Se exportan las valoraciones solo de rondas cerradas/discusión/consenso; las abiertas se indican como ocultas. Se cuentan votos vigentes y no reintentos ni cambios históricos. Los puntajes proceden del mismo summarizeResults de la página. Los pendientes siguen vacíos y no equivalen a cero. Todos los documentos son preliminares para revisión humana, incluso con todas las preguntas completadas.

## Enfoque

Se elige generación en el servidor: snapshot SQLite coherente y sin escrituras, descarga autenticada como facilitador, gráficos compartidos en PNG incrustados en Excel y PDF. Se descarta exportar el DOM porque solo contiene el área seleccionada y la pregunta activa. El Excel nuevo tiene Resumen, Dominios, Preguntas y Gráficos; es un informe de Ágora, no una copia completada de la plantilla oficial IS4H. Los gráficos son imágenes estáticas. El PDF contiene ficha, resumen, perfiles por área y detalle paginado sin recortar textos extensos.

Se reutiliza ExcelJS de la aplicación para la funcionalidad permanente en Docker. PDFKit y resvg generan PDF e imágenes sin navegador ni dependencias en internet. Se incluyen fuentes redistribuibles para reproducir gráficos en Docker sin fuentes de sistema. La habilidad de hojas de cálculo se usa para verificación; el generador de aplicación no depende del entorno de autoría de Codex.

## Acceso y límites

GET /api/salas/:code/exportar/:format admite xlsx o pdf. Solo sesión administrativa, nunca token de proyección ni credencial de participante. Una exportación simultánea por proceso; 503 reintentable si está ocupado. No hay archivos persistidos por el servidor ni modificaciones en el taller. Se valida el formato antes de generar. Nombre seguro con código y fecha; texto del instrumento se trata como texto, sin fórmulas ni enlaces ejecutables.

## Validación

Pruebas con pendientes, cambio de voto, votación abierta, consensos, agrupamientos, autorización y reinicio; XLSX reabierto para verificar tipos/valores/imágenes; PDF extraído y renderizado con textos largos; descargas reales desde navegador y Docker preservando datos. Revisión independiente al finalizar.
