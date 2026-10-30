# Ágora — Talleres y editor de instrumentos

Plataforma local para probar un taller participativo con tres preguntas originales IS4H del dominio **Fuentes de datos**. Incluye facilitador, participante móvil, proyector, votación y consenso persistidos en SQLite. Incluye editor de instrumentos de madurez con borradores y versiones publicadas. Es un piloto con resultados preliminares.

## Abrir la aplicación

Requisitos para ejecución directa: Node.js 24.15 o superior y npm. Esta entrega se verifica con Node.js 26.10. Las dependencias se descargan durante la preparación; después, la aplicación sirve sus recursos localmente.

```sh
npm ci
npm run prepare:local
npm run build
npm start
```

Abre [Ágora](http://localhost:3000). Para facilitar, abre «Acceso del facilitador» y usa el valor `AGORA_ADMIN_PASSWORD` de `.env`. La preparación genera una contraseña aleatoria y no sustituye una configuración existente. `.env` y los datos no se incluyen en Git.

Puedes cambiar la contraseña en `.env` y reiniciar. Las sesiones del facilitador duran 12 horas; cambiar la clave no revoca automáticamente sesiones ya emitidas. Para una instalación nueva usa otra carpeta de datos. Evita compartir el archivo `.env`.

## Accesos de esta sesión

Docker está actualizado en [puerto 3000](http://localhost:3000). La ejecución local que conserva el taller de prueba anterior está en [puerto 3001](http://localhost:3001), iniciada con `PORT=3001 npm start` para no competir con Docker. Sus bases siguen siendo independientes; el editor está disponible en ambas. No es necesario ejecutar ambos modos para usar Ágora.

## Crear instrumentos y preguntas

Ingresa como facilitador y abre **Instrumentos**. Crea un instrumento, añade preguntas, indica área y dominio y redacta sus cinco descriptores de madurez. Guarda el borrador para continuar después. Para publicar, completa todos los campos y al menos una pregunta. La vista previa permite revisar el contenido del participante.

Una versión publicada se conserva inmutable. Usa **Crear nueva versión** para editarla en otro borrador. Al crear un taller, selecciona el instrumento y la versión publicada. Los talleres anteriores mantienen su versión y resultados. Los borradores y el catálogo quedan guardados en la misma base SQLite.

La escala permanece fija en 1–5; esta entrega del editor admite preguntas de madurez. Texto libre y selección múltiple se completarán junto con sus reglas de votación y consenso. Publicar no certifica el cálculo ni la metodología del instrumento.

## Importar desde Excel

En **Instrumentos → Importar instrumento**, descarga la plantilla. Completa Ficha (Nombre y Edición obligatorios) y Preguntas (Código, Área, Dominio, Pregunta y cinco descriptores). Usa una fila por pregunta desde la fila 6; conserva los encabezados y códigos entre ediciones. La plantilla no contiene preguntas simuladas en la zona de carga.

Carga el archivo, revisa los errores por celda y la vista previa y confirma **Importar como borrador**. Puedes crear un instrumento independiente o elegir una publicación para otra edición. Se conservan los IDs de códigos coincidentes; no se alteran talleres previos. Si ya hay un borrador, debes continuar o publicarlo antes de importar otra edición.

Se admite .xlsx de hasta 2 MiB, 200 preguntas y 3 MiB de contenido, con textos de hasta 10000 caracteres por pregunta/descriptor. No se evalúan fórmulas ni se importa contenido oculto o combinado. El Excel oficial original requiere un mapeo al formato; Word/PDF no se convierten automáticamente. Guía y pruebas: `docs/importacion-excel-validacion.md`. Contrato: `api/importacion-instrumentos.md`.

## Conexión y QR para celulares

Con Docker, abre **Menú → Conexión y QR** en `http://localhost:3000/conexion`. Cloudflare crea un enlace HTTPS temporal automáticamente. Espera «Enlace público disponible»: el QR de las salas utiliza solo la dirección verificada. Los teléfonos pueden usar cualquier red con Internet.

**Comprobar conexión** verifica que el enlace responde desde esta instalación. La comprobación también se repite cada 15 segundos. Si falla, se oculta el QR y cloudflared intenta recuperar el enlace existente. **Generar nuevo enlace** cierra el anterior y crea otro, sin borrar talleres, votos ni consensos. Usa este botón desde la dirección local de la computadora para poder ver la nueva URL cuando la anterior se cierre.

Cada reinicio del túnel temporal cambia su dominio. Comparte el nuevo QR y pide volver a entrar. Las cookies no se transfieren entre dominios: una nueva entrada recibe otra credencial, mientras el historial ya guardado permanece. Estos enlaces no tienen garantía de continuidad ni hostname fijo; para eso se necesita un túnel con dominio propio.

En ejecución local sin cloudflared se mantiene la opción LAN. Los equipos deben compartir red; selecciona la dirección actual en Conexión y QR, guárdala y comprueba acceso desde un teléfono. Una IP guardada que ya no pertenece a las interfaces locales queda marcada como obsoleta y no genera QR. Docker no propone su IP interna como dirección para celulares.

Para desactivar Cloudflare en Docker, configura `AGORA_TUNNEL_ENABLED=false` en `.env` y recrea el contenedor. En ejecución directa se puede habilitar con `AGORA_TUNNEL_ENABLED=true` si cloudflared está instalado (o `AGORA_CLOUDFLARED_PATH`). `AGORA_PUBLIC_URL` se utiliza para fijar dirección en modo manual; el modo Cloudflare administra su propia URL. Contrato y operación: [api/conexion.md](api/conexion.md).

## Docker

```sh
npm run prepare:local
docker compose up --build -d
```

Se usa un volumen persistente `agora-data`; no ejecutes `docker compose down -v` si quieres conservar talleres. Los datos de ejecución directa (`data/`) y Docker son independientes. La instalación inicial y la construcción de la imagen requieren internet. El paquete portátil de imágenes, respaldo/restauración y ensayo físico sin internet se completan en entregas posteriores. La configuración Docker no implica que se haya certificado en todos los sistemas operativos o arquitecturas.

## Verificar

```sh
npm test
npm run build
npm run test:browser
```

Las pruebas HTTP necesitan permiso para abrir conexiones locales. Las pruebas de navegador necesitan Chromium de Playwright: si no está preparado, ejecuta `npx playwright install chromium`. El navegador de prueba usa un puerto y una carpeta temporal propios, sin borrar talleres de la instalación.

## Límites de esta entrega

- Tres preguntas de madurez DMIT!B4:G6, textos y espacios originales, versión piloto 0.1.0. Fuente y hash en `instruments/piloto.json`.
- Una ronda por pregunta. La interfaz permite avanzar después de registrar consenso. Revotaciones, pausa explícita e historial visible se incorporan en E2; el historial de cambios de voto ya se conserva en la base de datos.
- La selección de nivel exige un entero entre 1 y 5. Falta de respuesta se conserva como ausencia. Opciones «no sé», «no aplica» y abstención esperan validación metodológica.
- No incluye certificación del cálculo oficial, importador universal, plantilla oficial completada ni informes Word. La edición e importación de instrumentos de madurez y los informes propios de Ágora en Excel/PDF ya están disponibles. No modifica el Excel original ni sus fórmulas sospechosas.
- Un reintento recupera su acuse original incluso después del cierre. Si se pierde conexión, el teléfono conserva el envío pendiente y ofrece reintento. La confirmación depende del servidor.
- Acceso LAN o enlace temporal Cloudflare para validación del piloto. Se conservan autenticación administrativa y validación de origen HTTPS/WebSocket. No registrar datos clínicos personales.

Contratos detallados: `api/entrega-1.md` y `api/editor-instrumentos.md`. Validación del editor: `docs/editor-instrumentos-validacion.md`. Evidencia y estado: `docs/entrega-1-validacion.md`. Las especificaciones de todo el primer incremento siguen incluyendo trabajo futuro.

### Agrupar preguntas y obtener su promedio

En el editor o en las columnas del Excel, repite exactamente la misma **Área** y el mismo **Dominio** en todas las preguntas del agrupamiento. El editor permite consultar los agrupamientos y la cantidad de preguntas en cada uno. Pueden estar en posiciones distintas del instrumento; dominios iguales de áreas diferentes permanecen separados.

La sala muestra el avance por grupo. Al registrar el consenso de todas sus preguntas, aparece el promedio de esos niveles y el nivel redondeado a entero (.5 hacia arriba). Por ejemplo, 2, 3 y 5 dan promedio 3,33 y nivel 3. Las preguntas pendientes no cuentan como cero. Estos resultados se recuperan al reiniciar porque se calculan sobre las preguntas y consensos guardados. El alcance actual no incluye promedios globales ni de áreas.

### Navegación y direcciones

El encabezado incluye un menú con Inicio, Talleres, Instrumentos, Importar Excel, Conexión y QR y Participar. La importación puede abrirse directamente con `/instrumentos#importar`. Consulta [las rutas y sus permisos](docs/urls-y-menu.md) para editor, salas, proyección y descarga de plantilla.

### QR visible en proyección

Desde la sala del facilitador, abre **Abrir proyector**. La pantalla compartida muestra el QR de participación, código y dirección junto a la pregunta y resultados. Ese QR entra a la votación de la sala; no contiene la credencial del proyector. Se actualiza con el enlace vigente y se oculta si pierde disponibilidad o conexión con la aplicación. La proyección conserva acceso de solo lectura.

### Resultados durante el taller

Abre **Menú → Resultados** y elige el taller, o usa **Ver resultados generales** dentro de la sala o proyección. Los participantes tienen **Ver resultados del taller** en su sala. La dirección de una evaluación es `/resultados/CODIGO` y mantiene los permisos de esa sala.

El resumen muestra progreso, perfil por áreas, radar por dominios y tabla de sumas, promedios y niveles actuales. Se actualiza con consensos guardados; no utiliza votos individuales. Cada dominio redondea su media a entero y cada área promedia los niveles de sus dominios con igual peso y un decimal. Pendientes sin consenso quedan vacíos, sin contarse como cero. El resultado se indica parcial hasta completar todas las preguntas. No se inventa un puntaje único que mezcle las cuatro áreas. Contrato y metodología: [api/resultados.md](api/resultados.md).

### Exportar resultados a Excel y PDF

Como facilitador, abre un taller en Resultados y pulsa **Exportar resultados**. Elige **Descargar Excel** o **Descargar PDF**. Ambos incluyen ficha, todas las áreas y dominios, gráficos, preguntas y descriptores, valoraciones de rondas cerradas, consenso y observaciones (la justificación registrada). Se puede exportar durante el taller: los pendientes se identifican y no cuentan como cero. Los gráficos de Excel son imágenes estáticas del momento de la descarga. No modifica el instrumento original ni reemplaza su plantilla oficial. Consulta [el alcance y las verificaciones](docs/exportacion-resultados-validacion.md).
