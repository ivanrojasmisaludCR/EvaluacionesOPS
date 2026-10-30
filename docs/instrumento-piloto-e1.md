# Selección del instrumento para E1

La primera entrega utiliza tres preguntas visibles del dominio **Fuentes de datos**, área **Gestión de datos y tecnología de la información**. Se inspeccionó el Excel original en lectura, incluida visibilidad de filas y contenido B:G. La guía metodológica establece discusión, recopilación de evidencia y revisión posterior con el equipo del país; por eso los acuerdos del piloto se identifican como preliminares.

| ID interno estable | Número original | Texto | Descriptores | Celda de respuesta prevista |
| --- | --- | --- | --- | --- |
| dmit-captura-clinica | 1 | DMIT!B4 | DMIT!C4:G4 | DMIT!H4 |
| dmit-vigilancia | 2 | DMIT!B5 | DMIT!C5:G5 | DMIT!H5 |
| dmit-determinantes-sociales | 3 | DMIT!B6 | DMIT!C6:G6 | DMIT!H6 |

Las tres filas están visibles y tienen exactamente cinco descriptores de madurez. El catálogo `instruments/piloto.json` conserva los textos y espacios tal como se extrajeron, la procedencia de cada celda y el hash SHA-256 del archivo fuente. Los IDs se asignaron por significado, no se calculan de la fila ni del número visible. Toda sesión guarda una instantánea del catálogo, de modo que cambiar ese archivo no altera las sesiones existentes.

No se calcula el dominio ni se escribe el Excel en E1. La fórmula original `DMIT!H3` es `ROUND(SUM(H4:H6)/COUNT(H4:H6),0)`; se registra como evidencia, no como regla implementada de agregación. La clasificación de filas ocultas en otros dominios y el problema de `MAGO!H3` siguen pendientes de revisión metodológica. No se ha certificado la equivalencia del instrumento completo.
