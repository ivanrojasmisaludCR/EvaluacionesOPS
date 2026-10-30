# Resultados en vivo — validación del 28 de octubre de 2026

## Entrega

Página /resultados para elegir taller y /resultados/CODIGO para consultar en cualquier momento. Accesos desde menú y sala, participante y proyector. Resumen de progreso, áreas, radar general, detalle seleccionable por área, radar de dominios y tabla con consensos, suma, media, nivel y estado.

Datos exclusivamente de consensos persistidos de la instantánea del taller. El nivel actual de dominio redondea su media a entero; el puntaje de área promedia con igual peso los niveles de dominios con datos y redondea a un decimal. Los pendientes no cuentan como cero. Se muestra parcial hasta completar todas las preguntas. Los resultados definitivos previos de groups permanecen null hasta completar su dominio; los parciales viven en results.

## Fuente y límites

Se inspeccionó, sin modificar, la hoja Resultados de IS4H_MMC-ES-V4-julio-26.xlsx. Sus cinco gráficos son RadarChart: uno general de áreas y cuatro de dominios. K5/K16/K29/K40 promedian niveles de dominios a un decimal. No se define una media única de las cuatro áreas y no se inventa una.

Se respetan nombres y agrupamientos del instrumento cargado, no rótulos desactualizados del resumen Excel. Las diferencias de migración ya documentadas (listas sin escala, preguntas ocultas, rangos que omiten preguntas visibles y enunciados contextuales) siguen aplicando. El resultado actual parcial es una extensión para seguimiento y no certifica reproducción íntegra de todas las fórmulas del archivo oficial.

Los gráficos no dibujan puntos en cero por datos ausentes ni polígonos cerrados usando ausencias. Entre tres y doce ejes se muestra radar; otros tamaños usan barras para no inventar ejes ni superponer gran cantidad de rótulos. Las tablas conservan nombres completos.

## Evidencia

- 52 pruebas Node aprobadas, incluyendo seis casos puros de cálculo y recuperación persistente del resultado parcial.
- Casos de dominio con distinto número de preguntas demuestran igual peso por dominio; redondeo de .5 y de área a un decimal probado.
- 7 recorridos de navegador aprobados. El nuevo caso cubre 4 áreas, 3 dominios en DMIT, avance 5/7 parcial, cambio a 7/7 completo, actualización sin recargar, selección de área y acceso por participante y proyector (con recuperación de credencial al recargar).
- No se exponen votos de una ronda abierta. Lectura no cambia pregunta, fase ni historial.
- Compilación TypeScript/Vite y Docker correctas. Siete cambios OpenSpec válidos.
- Revisión independiente sin hallazgos importantes. Capturas desktop y móvil verificadas.
- Comprobación de instalación con el IS4H real de 78 preguntas, 26 dominios y 4 áreas, incluyendo MAGO de 8 dominios con nombres extensos. Página móvil sin desbordamiento y recarga sin cambiar fase/pregunta.

## Operación

Se respaldó SQLite antes de actualizar en /app/data/pre-results-2026-10-28.sqlite. Después: 3 talleres, 2 envíos y 2 consensos, con integridad ok, iguales a las cantidades previas. No se crearon participantes ni votos al verificar la instalación. Sin migraciones ni dependencias nuevas.

No incluye exportación de resultados Excel ni informes. Validación funcional del usuario pendiente.

La revisión con rótulos reales detectó falta de margen lateral para nombres extensos. Se amplió dinámicamente el lienzo de radar al detectar etiquetas largas y se añadió una comprobación geométrica en el recorrido de navegador para asegurar que todos los rótulos queden dentro del lienzo. El recorrido completo de 7 casos volvió a pasar con el ajuste.

Verificación final instalada del margen de rótulos: los getBBox de todas las etiquetas quedan dentro del ancho del lienzo, incluyendo MAGO de ocho dominios. Se repitieron captura, móvil y recarga en modo solo lectura. Cloudflare estaba online al terminar.
