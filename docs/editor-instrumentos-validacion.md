# Editor de instrumentos y actualización visual

26 de octubre de 2026. Alcance autorizado: editor de instrumentos de madurez, colores más vivos y logos OPS.

## Funciones disponibles

- Biblioteca de instrumentos con búsqueda, borradores, publicaciones e historial de versiones.
- Creación de instrumentos; nombre, preguntas, área y dominio editables.
- Cinco niveles fijos de madurez, con descriptores por pregunta. Agregar, quitar y reordenar preguntas conserva los identificadores de las que permanecen.
- Guardar borradores incompletos, continuar después, vista previa y publicación validada por el servidor.
- Una publicación es inmutable; «Crear nueva versión» abre otro borrador. Los talleres conservan su instantánea de la versión elegida.
- Control de edición entre pestañas: una edición obsoleta recibe conflicto; sus cambios locales no se sobrescriben automáticamente. Aviso al salir con cambios sin guardar.
- Al crear un taller se elige instrumento y versión publicada. La sala y el móvil presentan el contenido, nombre, versión y cantidad de preguntas correctos.
- Nueva paleta azul, turquesa, violeta, naranja y verde; niveles identificados por número y texto además del color. Logo oficial español OPS/OMS incorporado localmente, manteniendo sus proporciones y colores.

El acceso administrativo usa la misma contraseña de facilitador de esta instalación. No se añadieron cuentas personales ni permisos diferenciados.

## Verificaciones

- **21 pruebas de servidor y dominio aprobadas:** guardado incompleto, publicación, escala fija, IDs duplicados, inmutabilidad, control de concurrencia, reordenamiento, selección de publicación, persistencia y regresiones E1.
- **Migración real E1 probada:** una base sin tabla de catálogo y con taller, voto, consenso y credenciales se migra a versión 2; se conservan estado y credenciales. Existe prueba automatizada persistente.
- **2 recorridos de navegador aprobados en Chromium:** taller E1 completo; crear instrumento propio, guardar, vista previa, publicar, crear taller con esa publicación, publicar otra versión y comprobar que el taller anterior conserva sus preguntas. Voto móvil con el instrumento personalizado.
- TypeScript y compilación Vite aprobados.
- Capturas de editor, biblioteca y participante móvil inspeccionadas visualmente. El logo se carga desde el recurso local y es legible sobre fondo blanco.
- Revisión independiente del catálogo, migración, accesos, editor y publicación sin problemas funcionales o de seguridad confirmados en este alcance. Su sugerencia de cubrir la migración sin tabla se incorporó como prueba.

Capturas con datos sintéticos: `docs/evidencia-editor/`. Las pruebas usan bases temporales independientes de los datos del usuario.

## Probar el editor

1. Entra como facilitador con la contraseña habitual y abre **Instrumentos**.
2. Pulsa **Nuevo instrumento**, escribe su nombre y crea el borrador.
3. Añade una pregunta, indica área y dominio y redacta los cinco descriptores.
4. Guarda el borrador. Abre la vista previa para comprobar la lectura del participante.
5. Publica la versión. Si falta contenido, el servidor indicará qué completar.
6. En **Talleres**, crea uno y selecciona tu instrumento publicado.
7. Vuelve al instrumento, crea una nueva versión y modifica una pregunta. El taller previo debe seguir mostrando su contenido original.

## Persistencia y compatibilidad

Se agrega `instrument_versions` y se migra SQLite a `user_version=2`. El piloto original se incorpora una sola vez. No se borran talleres ni se reemplaza su instrumento. Antes de actualizar las instalaciones activas se generaron copias consistentes de sus bases de datos. Los archivos privados están en `data/`, excluido de Git.

La ejecución local y Docker mantienen datos independientes, tal como en E1. No se fusionan sus bases silenciosamente. El detalle de los accesos activos se registra al finalizar la actualización.

## Límites

- Esta entrega crea preguntas de **madurez**. Texto libre y selección múltiple esperan implementar también sus reglas de votación y consenso.
- Área y dominio se editan como etiquetas por pregunta; no hay todavía un catálogo administrativo independiente de áreas y dominios.
- Hasta 200 preguntas y 4 MiB por guardado de instrumento. Descriptores y textos de hasta 10000 caracteres.
- No incluye importador universal de Excel, cálculo oficial, exportaciones ni corrección metodológica del instrumento original. Preguntas nuevas o modificadas se identifican como personalizadas en la procedencia.
- Guardar y publicar indican estado de edición, no aprobación metodológica OPS.
- No se habilitó acceso público a internet en este avance.

## Instalaciones actualizadas

- **Docker:** `http://localhost:3000/instrumentos`. Imagen reconstruida, contenedor recreado con el mismo volumen. Esquema 2 e integridad SQLite `ok`; conserva sus conteos anteriores (no tenía talleres ni votos). Catálogo inicial disponible. Se comprobaron acceso HTTP, biblioteca y recurso PNG.
- **Local con el taller existente:** `http://localhost:3001/instrumentos`. Se conserva `data/agora.sqlite` con el taller y sus dos envíos de voto; ahora usa puerto 3001 para no competir con Docker. Arranque de este acceso: `PORT=3001 npm start`. Se comprobó acceso, catálogo y logo. Cuando correspondía, se actualizó el puerto de la dirección LAN guardada.
- Ambas instalaciones usan la contraseña ya configurada. Sus bases siguen independientes. No se movieron ni fusionaron talleres entre ambas.
- Copias consistentes previas en `data/pre-editor-local-2026-10-26.sqlite` y `data/pre-editor-docker-2026-10-26.sqlite`; la copia Docker también se conserva dentro de su volumen. No sustituye un respaldo externo periódico.

La publicación por internet permanece pendiente. La validación del editor por parte del usuario sigue abierta.
