# Validación de agrupamientos — 26 de octubre de 2026

## Resultado

El editor permite consultar los pares Área + Dominio y su cantidad de preguntas. La sala de facilitación, el participante y la proyección muestran avance por agrupamiento, promedio y nivel redondeado únicamente cuando todas sus preguntas tienen consenso. Se usan valores de consenso, no votos individuales. Igual peso por pregunta, sin ceros por pendientes. La coincidencia de Área y Dominio es exacta y respeta mayúsculas y acentos.

Ejemplo verificado: consensos 2, 3 y 5 generan media 10/3, presentación 3,33 y nivel 3. Media 2,5 redondea a nivel 3. Dominios de áreas distintas quedan separados. No se requiere que las preguntas sean consecutivas.

## Evidencia

- 39 pruebas Node aprobadas, incluyendo integración HTTP previa, cálculo, SQLite real y recuperación después de reiniciar.
- 3 recorridos Playwright aprobados, ampliando el taller con avance 1/3 pendiente y resultado 3/3; el participante recupera el resultado al recargar.
- Compilación TypeScript/Vite aprobada; Docker reconstruido correctamente.
- OpenSpec: cuatro cambios válidos.
- Revisión independiente: sin hallazgos importantes; 11 pruebas de cálculo/almacenamiento ejecutadas por el revisor.
- Inspección visual de [captura de grupo completo](evidencia-agrupamientos/agrupamientos-completos.png).

## Instalaciones y conservación

Se respaldó SQLite antes de actualizar cada instalación. Docker conserva su volumen: 1 taller, 0 envíos, 0 consensos; integridad ok. La instalación local conserva 1 taller, 2 envíos y 1 consenso. El estado autenticado en puertos 3000 y 3001 devuelve sus agrupamientos: 0/3 y 1/3, respectivamente, ambos con resultado pendiente. Las bases permanecen independientes.

No hay migración nueva: el cálculo deriva de las preguntas de la instantánea inmutable del taller y los consensos persistidos. No incluye agregados por área, resultado global ni equivalencia metodológica de todas las fórmulas del archivo oficial. Validación funcional del usuario pendiente.
