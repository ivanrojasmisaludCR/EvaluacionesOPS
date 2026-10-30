# Primera entrega: estado y validación

Fecha: 26 de octubre de 2026. Estado: **implementada y verificada localmente, pendiente de validación del usuario y prueba con teléfono físico**.

## Alcance disponible

- Catálogo piloto de tres preguntas originales DMIT!B4:G6, con procedencia y hash del Excel, escala fija 1–5 e instantánea por taller.
- Creación y recuperación de talleres; acceso protegido de facilitador; participante por código o QR y proyector solo lectura.
- Preparación → votación → cierre → discusión → consenso justificado; paso a otra pregunta después del acuerdo.
- Una respuesta vigente por participante y ronda; cambios con historial, reintentos sin duplicación y confirmación después del COMMIT.
- Distribución ausente durante votación. Estado y avisos autorizados separados por rol, incluso si se comparte navegador.
- SQLite WAL con transacciones, sesiones y credenciales persistentes; recuperación al reconectar.
- Pantallas adaptables, recursos propios, navegación mediante controles semánticos y etiquetas. Dirección LAN configurable y QR real.

## Evidencia ejecutada

| Verificación | Resultado y alcance |
| --- | --- |
| `npm test` | 13 pruebas aprobadas, 0 fallidas: 7 de dominio/persistencia y 6 de HTTP/WebSocket con SQLite real |
| Postman contra `http://localhost:3000/api/health` | Verificación del servidor iniciado: HTTP 200 y `delivery=E1`, una aserción aprobada, salida 0 |
| `npm run build` | TypeScript sin errores y compilación Vite aprobada |
| `npm run test:browser` | 1 recorrido completo aprobado en Chromium, con computadora y dos contextos móviles independientes de 360 y 390 píxeles |
| Recorrido de navegador | Crear taller, dos ingresos, dos votos, cambio de uno sin duplicar conteo, ocultamiento antes del cierre, resultados, discusión, consenso, recarga del participante, cambio a otra pregunta y reconexión después de cortar conectividad |
| Recuperación | Prueba con archivo SQLite: cerrar y abrir Store recupera identidad, voto vigente, acuse idempotente, pregunta y consenso |
| Revisión visual | Capturas de facilitador y participante inspeccionadas; móvil sin desbordamiento horizontal |
| Revisión independiente | Detectó conflicto de rol en navegador con sesión administrativa; reproducido con prueba fallida, corregido y revisión de la corrección sin hallazgos adicionales |
| `openspec validate --all` | 1 cambio válido, 0 fallos |
| `docker compose config --quiet` | Configuración Compose válida; no se ha construido ni ejecutado el contenedor |
| `git diff --check` | Sin errores en diferencias de archivos registrados |

Las pruebas de servidor se ejecutaron con permiso de conexiones locales. El intento restringido anterior falló por `listen EPERM`; no era un fallo de comportamiento de la aplicación. El navegador de pruebas utilizó Chromium ya disponible en esta computadora mediante `AGORA_BROWSER_EXECUTABLE`; en otra instalación Playwright puede requerir preparar su navegador. Hubo avisos de entorno NO_COLOR/FORCE_COLOR sin efecto en las pruebas.

Capturas de datos sintéticos: `docs/evidencia-e1/facilitador-consenso.png` y `docs/evidencia-e1/participante-consenso.png`. Los talleres de prueba se crean en carpetas temporales, separados de los datos del usuario.

## Demostración para el usuario

1. Abrir `http://localhost:3000` y entrar como facilitador. La contraseña está en `.env`, campo `AGORA_ADMIN_PASSWORD`.
2. Crear un taller. Elegir y guardar la dirección de red de la computadora; comprobarla desde un teléfono conectado a la misma Wi-Fi.
3. Entrar con dos teléfonos o dos navegadores independientes y abrir la votación desde el facilitador.
4. Responder, cambiar una respuesta y comprobar que siguen siendo dos votantes.
5. Cerrar, mostrar resultados, abrir discusión y guardar consenso con justificación.
6. Recargar la sala y comprobar que conserva los datos. Elegir otra pregunta para continuar.

Validar especialmente: claridad de la lectura móvil, comodidad al comparar los cinco descriptores, orden de los pasos y correspondencia con la discusión real del taller. La validación metodológica no se sustituye por las pruebas de software.

## Límites y pendientes

- No se verificó todavía el acceso desde un teléfono físico ni el escaneo del QR por cámara. Sí se comprobó por HTTP el PNG QR y la URL LAN.
- No se hizo ensayo de 100 participantes, prueba de carga, funcionamiento de Docker, certificación Windows/Linux/ARM ni prueba de LAN real sin salida a internet.
- No hay importador universal, edición/versionado administrativo, revotación, pausa explícita, historial visible, exportación Excel/Word/PDF ni respaldo/restauración. Permanecen en E2–E5.
- No se calculan puntajes agregados ni se han aprobado correcciones del instrumento completo. El consenso no se presenta como validación oficial OPS.
- La clave se configura localmente; sesiones de facilitador vigentes no se revocan al cambiar la contraseña. Acceso por internet requiere revisión operativa previa.
- La prevención de duplicación se limita a la credencial del navegador; no prueba identidad personal única.

## Correspondencia con OpenSpec

E1 implementa partes del catálogo, sala, votación y consenso, más persistencia básica. No se marcan completas tareas amplias como importación total, equivalencia Excel, respaldo ni exportaciones. El contrato de E1 está en `api/entrega-1.md`; se aclararon en OpenSpec la idempotencia posterior al cierre y la revisión explícita del consenso.

La siguiente entrega espera la devolución del usuario sobre este recorrido.
