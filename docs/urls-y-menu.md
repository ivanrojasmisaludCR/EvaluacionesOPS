# Direcciones y menú de Ágora

En esta computadora, la instalación Docker usa http://localhost:3000 y la instalación local http://localhost:3001. Cada instalación conserva su propia base de datos. Con Docker, los participantes utilizan el enlace HTTPS temporal verificado de Cloudflare, disponible en Conexión y QR. localhost apunta a la computadora donde se abre el navegador.

| Función | Ruta | Acceso |
| --- | --- | --- |
| Inicio | / | Público |
| Talleres y acceso del facilitador | /facilitador | Contraseña para administrar |
| Biblioteca de instrumentos | /instrumentos | Facilitador |
| Importar Excel | /instrumentos#importar | Facilitador |
| Conexión y QR | /conexion | Facilitador; regenerar desde la dirección local |
| Editor / consulta de una versión | /instrumentos/ID_VERSION | Facilitador; abrir desde la biblioteca |
| Participar ingresando un código | /participar | Público; código para entrar |
| Participar en una sala concreta | /participar/CODIGO | Código y acceso de esa sala |
| Facilitar una sala | /sala/CODIGO | Facilitador |
| Proyección | /proyectar/CODIGO#CREDENCIAL | Abrir desde «Abrir proyector» de la sala |
| Descargar plantilla de importación | /api/instrumentos/plantilla.xlsx | Facilitador; enlace dentro de importación |

CODIGO e ID_VERSION representan valores reales generados por la aplicación. La credencial de proyección se incorpora desde el botón de la sala y no debe inventarse. El navegador la guarda para recargar y la elimina del enlace visible.

El menú del encabezado ofrece Inicio, Talleres, Instrumentos, Importar Excel, Conexión y QR y Participar. Abre con clic o teclado y cierra con Escape o al elegir destino. Los permisos siguen siendo comprobados por el servidor.

Crear un taller se hace desde Talleres. Crear un instrumento se hace desde Instrumentos. Publicar y crear nuevas versiones se hacen dentro del editor. La conexión y el QR se administran desde /conexion y también desde la sala. Votación, consenso, agrupamientos y resultados están dentro de cada sala. Estas acciones no tienen una página independiente.

La importación tiene enlace directo mediante #importar y se recupera al recargar. El hash identifica la pantalla; no contiene el archivo ni la revisión pendiente de importación.

No se incluyen accesos a exportación de resultados Excel/PDF/informe porque esas exportaciones todavía no están implementadas. El enlace temporal público se administra desde Conexión y QR.
