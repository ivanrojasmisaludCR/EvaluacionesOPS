# 5. Matriz de trazabilidad

## Requisito → Escenario → Tarea → Prueba → Evidencia esperada

### Capacidad: instrumento-minimo

| Requisito | Escenario | Tarea | Prueba | Evidencia esperada |
|-----------|-----------|-------|--------|-------------------|
| identificador-interno-estable | identificador-persiste-desde-el-catalogo | 1.1, 1.2 | D1 | IDs estables generados para cada pregunta del Excel |
| escala-fija-cinco-niveles | rechazo-de-niveles-fuera-de-escala | 1.4 | D1-D4 | Niveles 0, 6, 3.5, texto rechazados por servidor |
| escala-fija-cinco-niveles | niveles-obligatorios-antes-de-publicar | 1.4 | D5, D6 | Publicación requiere 5 descriptores no vacíos |
| seleccion-multiple-y-texto-sin-puntaje | pregunta-seleccion-multiple-sin-puntaje-numerico | 1.3 | D12 | Preguntas de selección múltiple sin puntaje numérico |
| estados-no-aplica-no-se-abstencion-falta-respuesta | estados-distinguidos-y-sin-cero-implicito | 1.3 | D10 | Estados N/A, no-sé, abstención no son cero |
| borrador-y-version-publicada-inmutable | instrumento-publicado-inmutable-durante-sesion | 1.5 | S8 | Sesión conserva resultados tras cambio de catálogo |
| sesion-vinculada-a-version | sesion-conserva-resultados-despues-de-cambio-de-catalogo | 1.5 | S8 | Sesión vinculada a versión del instrumento |

### Capacidad: sala-lan

| Requisito | Escenario | Tarea | Prueba | Evidencia esperada |
|-----------|-----------|-------|--------|-------------------|
| creacion-de-taller | taller-con-datos-completos | 2.1, 2.2 | I1 | Taller creado con código de sala y QR |
| qr-y-codigo-de-sala | qr-contiene-direccion-lan-accesible | 2.3 | X2 | QR con dirección LAN accesible desde celular |
| ingreso-participante-sin-cuenta | participante-ingresa-con-codigo-de-sala | 2.4 | I1, I12 | Participante accede sin cuenta ni aplicación |
| ingreso-participante-sin-cuenta | recuperacion-de-credencial-al-reconectar | 2.4 | S7 | Credencial recuperada tras reconexión |
| acceso-solo-participacion | participante-no-puede-acceder-a-admin | 2.5 | I12-I15 | Acceso admin denegado (403) |

### Capacidad: voto-movil

| Requisito | Escenario | Tarea | Prueba | Evidencia esperada |
|-----------|-----------|-------|--------|-------------------|
| una-pregunta-activa-por-sala | estados-explicitos-de-pregunta | 3.1 | S1 | Estados de pregunta transitan correctamente |
| una-respuesta-vigente-por-participante-y-ronda | respuesta-vigente-por-ronda | 3.3 | S3 | Respuesta vigente actualizada; historial conservado |
| reintento-idempotente | reintento-no-duplica-voto | 3.4 | S2 | Mismo envío no duplica voto |
| confirmacion-despues-de-persistir | confirmacion-solo-despues-de-persistir | 3.5 | S1 | Confirmación solo tras persistencia |
| distribucion-oculta-hasta-el-cierre | distribucion-oculta-durante-votacion | 3.2 | I13 | Distribución no enviada a participantes durante votación |
| carrera-envio-cierre-determinista | envio-concurrente-con-cierre-regla-determinista | 3.6 | S5 | Carrera resuelta determinista |
| nueva-ronda-conserva-anteriores | nueva-ronda-conserva-rondas-previas | 3.7 | S6 | Rondas previas conservadas íntegramente |

### Capacidad: cierre-consenso

| Requisito | Escenario | Tarea | Prueba | Evidencia esperada |
|-----------|-----------|-------|--------|-------------------|
| facilitador-registra-nivel-acordado | nivel-acordado-con-justificacion | 4.1 | S9 | Consenso con nivel y justificación obligatoria |
| conservacion-separada-de-estados | votos-no-se-reescriben | 4.2 | S9 | Votos originales inalterados tras revisión |
| re-votacion-no-invalida-consenso | re-votacion-con-consenso-vigente | 4.3 | S9 | Consenso no reemplazado implícitamente |

### Capacidad: recuperacion

| Requisito | Escenario | Tarea | Prueba | Evidencia esperada |
|-----------|-----------|-------|--------|-------------------|
| pausa-y-reanudacion | sesion-restaurada-despues-de-reinicio | 5.2 | S8, S10 | Sesión restaurada tras reinicio |
| persistencia-en-volumen | respaldo-consistente-de-sesion-abierta | 5.1 | X4, X5 | Respaldo consistente y restaurable |

### Capacidad: exportacion-resultado

| Requisito | Escenario | Tarea | Prueba | Evidencia esperada |
|-----------|-----------|-------|--------|-------------------|
| exportacion-excel-con-estructura | exportacion-excel-con-formulas-y-graficos | 6.1 | X6 | XLSX con fórmulas, gráficos, valores recalculados |
| reporte-pdf-y-word | reporte-completo-con-pendientes-visibles | 6.2 | X7 | PDF y Word con todos los campos |
| informe-identificado-como-preliminar | informe-marcado-como-preliminar | 6.3 | X7 | Informe marcado como preliminar |

## Archivos bajo este documento

- `agora-openspec/docs/05-matriz-de-trazabilidad.md` (este archivo)
