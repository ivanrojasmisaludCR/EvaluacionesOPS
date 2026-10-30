# Exportación Excel y PDF — validación del 29 de octubre de 2026

## Entrega

En Resultados del taller, el facilitador dispone de «Exportar resultados» → «Descargar Excel» o «Descargar PDF». El archivo representa el momento de la descarga; no requiere terminar el taller. Contiene ficha, instrumento/versión/edición, avance, todas las áreas y dominios, perfiles gráficos y todas las preguntas con sus cinco descriptores, valoraciones anónimas vigentes, consenso, justificación/observaciones, autor y fecha.

Las observaciones corresponden a la justificación que ya registra el facilitador. No se inventan comentarios individuales. Las distribuciones permanecen ocultas para preguntas abiertas/en preparación. El resultado numérico usa consensos, con las mismas reglas de la página; pendientes y resultados parciales siguen identificados. Se requiere acceso administrativo; participantes y proyectores conservan su consulta en pantalla.

Excel tiene cuatro hojas: Resumen, Dominios, Preguntas y Gráficos. Textos extensos continúan en filas con el mismo número de pregunta. Los gráficos son imágenes estáticas. PDF incorpora los mismos contenidos y pagina las observaciones y descriptores extensos. Es un informe de Ágora preliminar para revisión humana, no el instrumento oficial IS4H completado ni un informe Word.

## Evidencia

- `npm test`: 57/57, incluidas instantánea, cambio de voto, pendientes, literalidad de fórmulas, imágenes en Excel, extracción de PDF y estilo de continuaciones, observaciones multilínea, permisos HTTP, formatos, descargas simultáneas y recuperación.
- `npm run build`: correcto. `npm run test:browser`: 7/7 recorridos; el recorrido de Resultados descarga ambos archivos, comprueba nombre y restringe el botón por rol.
- `openspec validate --all`: ocho cambios válidos.
- Revisión independiente de lectura: identificó recorte visual de observaciones multilínea en Excel. Se reprodujo con una prueba fallida y se corrigió dividiendo por altura y longitud. La revisión visual propia identificó herencia de estilo de encabezado en continuaciones PDF; prueba de extracción/fuentes falló antes de mover encabezados/pies al cierre del documento. Suite completa posterior verde.
- QA con instrumento sintético de siete preguntas y textos extensos: PDF de 16 páginas, marcadores finales de pregunta, descriptor y observación presentes. Se renderizaron las páginas; se revisaron portada, perfiles y continuación. El XLSX se reabrió con ExcelJS y se renderizó con Artifact Tool para revisar dominios, preguntas y gráficos. No se guardó ningún cambio mediante el lector de QA.
- Docker construido y actualizado correctamente, con fuentes locales redistribuibles; sin dependencias en internet para generar archivos. Auditoría de instalación: cero vulnerabilidades informadas.
- Descarga real con navegador desde Docker para un taller IS4H: 78 preguntas, 26 dominios, cuatro áreas y cinco imágenes de gráficos. Excel conserva el texto completo de las 78 preguntas, cotejado con el estado; PDF de 67 páginas también contiene cada texto completo. Recuento independiente del PDF: cinco imágenes. Consulta móvil a 390 px sin desbordamiento. Los estados de los cuatro talleres antes/después de descargar son iguales.
- Cloudflare permaneció `online` tras actualizar. No se comprobó descarga desde un teléfono remoto físico ni apertura en Microsoft Excel de escritorio; se verificaron descarga local en Docker, estructura XLSX y renderización independiente.

## Persistencia

Antes de desplegar se creó respaldo SQLite consistente en `/app/data/pre-exportacion-2026-10-29.sqlite`. Antes y después: cuatro talleres, siete envíos históricos y cuatro consensos. Integridad SQLite `ok`. Se conservó el volumen `agora-data`; no hubo migraciones ni escrituras en los talleres durante la exportación. Los datos de la ejecución nativa no se mezclaron con Docker.

## Archivos

Contrato: `api/exportacion-resultados.md`. Diseño/plan: `docs/superpowers/specs/2026-10-29-exportacion-resultados-design.md` y `docs/superpowers/plans/2026-10-29-exportacion-resultados.md`. Capturas con datos sintéticos: `docs/evidencia-exportacion/`. Los informes reales de QA permanecen fuera del repositorio para evitar conservar copias innecesarias de datos de taller.

Queda por validar con el usuario la presentación del informe con su propio taller y el flujo metodológico de revisión; esta entrega no certifica el MVP completo.
