# Contrato ejecutable de E1

Este contrato concreta `agora-openspec/docs/03-contratos-validacion.md` para el piloto. La implementación usa las rutas siguientes; los identificadores de identidad enviados por el cliente no se aceptan como autoridad. Todos los cuerpos de escritura son objetos JSON, máximo 24 KiB. Los errores tienen `{ error: { code, message } }`.

## Accesos

- `POST /api/admin/login` con `{password}`: 200 y cookie `agora_admin`, HttpOnly, SameSite Strict, Secure en HTTPS; expiración 12 horas. 401 clave incorrecta; 429 después de diez fallos desde una dirección en 15 minutos.
- `GET /api/admin/session`: `{authenticated}`.
- `POST /api/admin/logout`: invalida la credencial y borra la cookie.
- `POST /api/salas/{code}/ingreso` con `{}`: 200 `{joined:true}` y cookie `agora_p_{code}`. Recupera la identidad si ya existe esa cookie. Duración en navegador: 30 días, limitada a la sala en servidor.
- Proyector: credencial solo lectura de esa sala entregada al facilitador. Enlace `/proyectar/{code}#{token}`. El navegador retira el fragmento de la barra y lo conserva en sessionStorage de esa pestaña. Consultas con `Authorization: Bearer {token}`. No concede administración ni voto.

Las cookies no se devuelven en el JSON ni se guardan en localStorage. La sesión del facilitador y las identidades de participantes sobreviven al reinicio. Usar un código de sala no concede acceso al estado sin ingresar primero. Las escrituras con Origin ajeno se rechazan (403). No hay CORS abierto.

## Talleres y LAN — requieren facilitador

- `GET /api/talleres`: lista de `{code,institucion,pais,fecha,facilitador}`.
- `POST /api/talleres` con `{pais,institucion,fecha,alcance,facilitador}`: 201 `{id,code}`. País, institución y facilitador: 1–200 caracteres; alcance: 1–1000; fecha calendario YYYY-MM-DD válida. El instrumento piloto y su versión se fijan en servidor y se copian dentro del taller.
- `GET /api/config`: `{publicUrl,suggestions}`. Las sugerencias son interfaces IPv4 no internas, no una garantía de accesibilidad desde el teléfono.
- `PATCH /api/config` con `{publicUrl}`: 200 y dirección validada, sin credenciales, rutas ni localhost. Si AGORA_PUBLIC_URL está fijada en entorno, devuelve 409 ante un cambio válido. Los QR se regeneran con la dirección actual.

## Estado

`GET /api/salas/{code}/estado`: facilitador, participante de esa sala o proyector autorizado. Devuelve ficha, instrumento parcial, pregunta activa y cinco descriptores, estado, ronda, conteos, resumen de tres preguntas y consenso. La vista de participante solicita `?view=participant` y exige su credencial aunque el mismo navegador tenga sesión administrativa. Participante: solo su `ownVote` o null. Nunca envía identidades de otros participantes.

`distribution` está **ausente** durante preparación y votación abierta, también para facilitador y proyector. Aparece como arreglo de cinco conteos después del cierre. Solo el facilitador recibe `projectionToken` y los controles de conexión. Facilitador y proyector reciben `joinUrl` y `qr` (data URL PNG o null cuando no hay enlace disponible). El QR lleva a la entrada de participantes y nunca contiene la credencial de proyección. Participantes no reciben estos campos.

## Control — requiere facilitador

`POST /api/salas/{code}/accion`:

- `{action:"open"}`: preparación → votación abierta.
- `{action:"close"}`: abierta → cerrado.
- `{action:"discuss"}`: cerrado → discusión.
- `{action:"select",questionId}`: cambiar pregunta después de registrar consenso. No elimina rondas ni acuerdos.

Respuesta 200 `{ok:true}`; transición inválida 409. E1 tiene una ronda por pregunta, no permite revotación ni edición del consenso.

`POST /api/salas/{code}/consenso` con `{questionId,level,justification}`: nivel entero 1–5, justificación 1–10000 caracteres después de quitar espacios exteriores. Requiere estado discusión. Autor tomado de la ficha del taller, no del cuerpo. 201 `{ok:true}`, 400 validación, 409 estado o pregunta desactualizada. El consenso no modifica votos.

## Votación — requiere cookie de participante de esa sala

`POST /api/salas/{code}/votos` con `{questionId,round,value,requestId}`.

- `value`: número entero 1–5, sin coerción de texto, booleanos o nulos.
- `requestId`: identificador de envío, entre 8 y 80 caracteres alfanuméricos, guion o guion bajo. El navegador genera 128 bits aleatorios usando getRandomValues, disponible en LAN HTTP.
- Primer envío: 201 `{voteId,received:true,value,receivedAt}` únicamente tras COMMIT.
- Mismo participante + requestId + contenido: mismo acuse, sin duplicar ni agregar historial; válido incluso después del cierre.
- Mismo identificador con contenido distinto: 409 IDEMPOTENCIA_CONFLICTO.
- Cambio deliberado antes del cierre usa otro requestId; agrega historial y actualiza la respuesta vigente, sin aumentar conteo de votantes.
- Ronda/pregunta antigua: 409 RONDA_DESACTUALIZADA. Envío nuevo tras cierre: 409 RONDA_CERRADA.
- Voto y cierre usan transacciones SQLite BEGIN IMMEDIATE, sin await dentro de la transacción. El orden confirmado en servidor decide. No se usa el reloj del teléfono.

## WebSocket

`/api/salas/{code}/ws`: exige Origin del servidor. Primer mensaje JSON `{}` para cookie de facilitador, `{view:"participant"}` para cookie de participante, o `{token}` para proyector. Se cierra si no se autentica en 5 segundos o no corresponde a la sala.

Tras autenticación y cambios de sala emite solamente `{type:"actualizar"}`. El cliente lee el estado HTTP autorizado. Así no se envían votos ni distribuciones por el canal. Reconexión automática más lectura de recuperación; comprobación HTTP cada cinco segundos mientras la pestaña está activa o conectada. Las sesiones administrativas se comprueban de nuevo al notificar.

## Comprobación

`tests/http.test.ts` ejecuta servidor, credenciales, WebSocket y SQLite reales. `tests/store.test.ts` verifica dominio, historial e idempotencia. `tests/browser.spec.ts` verifica el recorrido entre contextos de navegador independientes. Estas pruebas locales no acreditan acceso por un teléfono físico ni rendimiento de 100 participantes.

El estado incluye también los [resultados por agrupamiento](agrupamientos.md), calculados exclusivamente con consensos registrados.
