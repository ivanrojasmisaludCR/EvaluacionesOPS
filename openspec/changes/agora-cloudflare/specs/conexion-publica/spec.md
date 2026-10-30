## ADDED Requirements

### Requirement: URL pública comprobada

El sistema SHALL utilizar el enlace Cloudflare solo cuando /api/health responda correctamente con el identificador de esta instancia, con timeout y sin seguir redirecciones.

#### Scenario: URL aún no comprobada
- **WHEN** cloudflared informa una dirección pero la sonda aún no pasa
- **THEN** no se publica QR ni joinUrl

#### Scenario: Falla o instancia diferente
- **WHEN** el enlace deja de responder o responde otra instancia
- **THEN** se retira el QR y se muestra estado pendiente o sin conexión

#### Scenario: Recuperación de red
- **WHEN** el mismo enlace vuelve a responder desde esta instancia
- **THEN** se habilita el QR sin forzar una dirección nueva

### Requirement: Regeneración administrativa

El sistema SHALL permitir generar otro enlace desde la dirección local con sesión administrativa, conservar datos e ignorar comprobaciones tardías del enlace anterior.

#### Scenario: Reintento
- **WHEN** se repite la generación con el mismo requestId
- **THEN** no se inicia otro proceso

#### Scenario: Regeneración desde URL que será cerrada
- **WHEN** se solicita generar desde un hostname trycloudflare.com
- **THEN** se requiere usar la dirección local para poder recuperar la nueva URL

#### Scenario: Resultado obsoleto
- **WHEN** llega un resultado positivo del enlace anterior después de regenerar
- **THEN** no se habilita el QR con ese resultado

### Requirement: HTTPS y dirección LAN

El sistema SHALL conservar validación de Origin HTTP/WebSocket y cookies Secure al acceder por HTTPS. En Docker no SHALL proponer IPs internas como direcciones para teléfonos.

#### Scenario: Origen ajeno
- **WHEN** una mutación llega con Origin diferente del origen solicitado
- **THEN** se rechaza la operación

#### Scenario: LAN anterior
- **WHEN** una dirección LAN guardada ya no pertenece a las interfaces actuales en modo local
- **THEN** se marca obsoleta y no genera QR

### Requirement: QR de participantes en proyección

El sistema SHALL mostrar en proyección el QR y la URL de ingreso de participantes cuando el enlace esté disponible, junto al código de sala, conservando acceso de solo lectura.

#### Scenario: Participar desde pantalla proyectada
- **WHEN** el proyector autorizado abre una sala con enlace disponible
- **THEN** se muestran QR, código y dirección hacia /participar/CODIGO, sin credenciales ni controles administrativos

#### Scenario: Pérdida de conexión
- **WHEN** el enlace deja de estar verificado o el proyector pierde contacto con la aplicación
- **THEN** se ocultan QR y enlace hasta recuperar disponibilidad
