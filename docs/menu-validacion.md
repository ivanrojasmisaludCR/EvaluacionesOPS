# Validación del menú — 27 de octubre de 2026

Menú incorporado en el encabezado, con Inicio, Talleres, Instrumentos, Importar Excel y Participar. Importación accesible mediante /instrumentos#importar, recuperable al recargar y sincronizada con cambios del hash. La lista de rutas y funciones está en docs/urls-y-menu.md.

## Comprobaciones

- Compilación TypeScript y Vite aprobada.
- 39 pruebas Node aprobadas.
- 4 recorridos de navegador aprobados: menú, taller con dos participantes y agrupamientos, editor e importación Excel.
- Prueba nueva: navegar desde móvil a participación, autenticarse, abrir importación desde menú, recargar, cerrar quitando hash y cerrar menú con Escape.
- Menú dentro del viewport de 320 píxeles; capturas de 390 y 1280 píxeles inspeccionadas visualmente.
- Revisión independiente: sin hallazgos importantes pendientes. El selector del test se ajustó al nombre accesible completo de los enlaces (incluye su descripción).
- Cinco cambios OpenSpec válidos.

## Operación

Docker reconstruido conservando el volumen existente y la instalación local iniciada en 3001. Sin migración, cambios de permisos ni modificación de instrumentos o talleres. Las bases permanecen independientes: Docker 1 taller, 0 envíos y 0 consensos; local 1 taller, 2 envíos y 1 consenso.

La implementación no agrega exportación de resultados ni acceso público a Internet. Validación del usuario pendiente.
