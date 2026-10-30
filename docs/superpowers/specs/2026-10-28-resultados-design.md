# Página de resultados durante el taller

Solicitud: reproducir el resumen de Resultados del Excel y sus gráficos de radar, consultables en cualquier momento con el avance actual.

## Cálculo y fuente

Se inspeccionó IS4H_MMC-ES-V4-julio-26.xlsx sin modificarlo: hay un radar general de cuatro áreas y cuatro radares de dominios. Resultados!K5, K16, K29 y K40 promedian los niveles de los dominios y redondean a un decimal. Los dominios redondean la media de preguntas a entero. No existe un puntaje único que promedie las cuatro áreas: no se inventará uno.

La página deriva datos de los consensos persistidos de la instantánea del taller. Por dominio: cantidad respondida, total, suma de consensos, media actual y nivel actual redondeado a entero. Sin consensos: media/nivel null. Por área: media con igual peso de los niveles actuales de dominios con datos, redondeada a un decimal. No se cuentan pendientes como cero. Se marca parcial hasta completar todas las preguntas. Los grupos actuales conservan su regla de resultado definitivo solo cuando se completan; el avance provisional se incorpora en results separado.

Alternativas consideradas: esperar a todos los dominios impide la consulta del avance pedida; promediar todas las preguntas da pesos distintos a los dominios y no sigue el resumen fuente. Se propone media de niveles de dominios con datos y etiqueta parcial explícita, consistente con las sumatorias actuales solicitadas.

La migración ya documentó preguntas de lista sin escala, rótulos antiguos en Resultados y rangos originales que omiten preguntas visibles. Se usarán nombres y grupos del instrumento cargado. No se afirma equivalencia completa con todas las fórmulas del archivo oficial.

## Consulta

/resultados: selector de talleres para facilitador. /resultados/CODIGO: resumen del taller mediante la misma autorización que su sala y actualizado con WebSocket/lecturas de recuperación. Accesos desde menú, facilitación, participación y proyección. Participantes requieren su credencial de sala y query view=participant; proyector usa su credencial existente en fragmento con view=projector, sin controles administrativos.

La página muestra progreso, comparación general de áreas y tablas/gráficos de dominios por área. Sin datos no hay polígono ni punto en cero. Polígono completo únicamente con datos en todos los ejes; se permiten puntos y segmentos parciales. Para menos de tres ejes se usa comparación por barras, sin ejes inventados. Tablas con nombres completos respaldan gráficos y accesibilidad. Se indica desconexión y que lo visible es el último estado recibido.

## Alcance

Sin migraciones, nuevas dependencias ni exportación de informes. Consultar resultados no cambia fases, votos o consensos. Las reglas se muestran en pantalla y quedan probadas con dominios de distintos tamaños, redondeo y pendientes.
