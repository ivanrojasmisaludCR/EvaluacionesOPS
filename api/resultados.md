# Resultados actuales

GET /api/salas/:code/estado añade results, con la misma autorización de sala para facilitador, participante y proyector. Ningún cálculo utiliza votos individuales: solo el último consenso persistido de cada pregunta de la instantánea del taller.

results: totalQuestions, completedQuestions, totalDomains, completedDomains, totalAreas, completedAreas, consensusSum, complete, domains y areas. Store añade lastConsensusAt (ISO o null). No se incluye un puntaje único de todo el instrumento porque la hoja fuente compara las cuatro áreas.

domains conserva id, area, domain, questionIds, total, completed, complete, average y score del agrupamiento definitivo; añade sum, currentAverage y currentScore. average/score siguen null hasta completar el grupo. currentAverage es suma de consensos / cantidad con consenso; currentScore redondea esa media a entero (.5 hacia arriba). Ambos son null si no hay consensos.

areas: id, area, domains (IDs), totalQuestions, completedQuestions, totalDomains, completedDomains, domainsWithResults, consensusSum, currentScore y complete. currentScore promedia los currentScore de dominios con datos, con igual peso y redondeo a un decimal. Un área sin datos tiene currentScore null. complete exige todos los consensos del área. Nunca se incorporan pendientes como cero.

Ejemplo: dominio de tres preguntas con consensos 1,1,1 -> nivel 1. Otro dominio de una pregunta con consenso 5 -> nivel 5. El área obtiene 3.0, no 2.0. Un dominio con media 2.5 produce nivel 3 antes de promediar áreas.

Las rutas de interfaz son /resultados y /resultados/:code. El listado requiere sesión de facilitador para consultar talleres. La ruta concreta reutiliza credencial de sala; ?view=participant exige participante aun con cookie administrativa. ?view=projector se abre con fragmento de la credencial existente, que se elimina de la URL visible y se conserva en sessionStorage. No hay rutas de escritura nuevas.

El facilitador dispone de «Exportar resultados» para descargar Excel y PDF, con todas las áreas, gráficos, preguntas, valoraciones cerradas, consensos y observaciones. Contrato de descarga: [exportacion-resultados.md](exportacion-resultados.md). Participante y proyector conservan la consulta en pantalla, sin permiso de exportación.

Se muestran parciales explícitos. La extensión de cálculo durante incompletitud no certifica todas las reglas del Excel oficial. La página respeta agrupamientos del instrumento importado, incluidas las diferencias de migración previamente documentadas.
