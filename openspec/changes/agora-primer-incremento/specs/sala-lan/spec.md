# Spec Delta

## Purpose

Crear una sala de taller LAN con generación de QR y código de sala, permitiendo ingreso de participantes desde navegador móvil sin instalar aplicaciones ni crear cuenta obligatoria.

## ADDED Requirements

### Requirement: creacion-de-taller

SHALL Crear un taller con instrumento/versión, país o institución, fecha, alcance y facilitador.

#### Scenario: taller-con-datos-completos
- **WHEN** el facilitador crea un taller seleccionando instrumento, versión, país/institución, fecha, alcance y facilitador
- **THEN** se genera un código de sala y un QR con la dirección accesible desde el celular

### Requirement: qr-y-codigo-de-sala

SHALL Mostrar QR y código de sala. El QR debe contener la dirección LAN accesible desde el celular, no localhost ni la IP interna del contenedor.

#### Scenario: qr-contiene-direccion-lan-accesible
- **WHEN** se genera el QR para una sala
- **THEN** el QR apunta a la dirección LAN resoluble desde dispositivos en la misma red, nunca a localhost ni a la IP interna del contenedor

### Requirement: ingreso-participante-sin-cuenta

SHALL Ingreso desde navegador móvil sin instalar aplicaciones ni crear una cuenta personal obligatoria. Definir una credencial de participante por sesión y su recuperación al reconectar.

#### Scenario: participante-ingresa-con-codigo-de-sala
- **WHEN** un participante escanea el QR o escribe el código de sala en el navegador móvil
- **THEN** accede a la sala sin instalar aplicación ni crear cuenta obligatoria, y recibe una credencial de participante para la sesión

#### Scenario: recuperacion-de-credencial-al-reconectar
- **WHEN** un participante se desconecta y se reconecta a la misma sala
- **THEN** recupera su credencial de participante y su respuesta vigente de la ronda actual

### Requirement: acceso-solo-participacion

SHALL El QR y código de sala conceden participación, no administración. No confiar solamente en ocultar botones para proteger accesos administrativos.

#### Scenario: participante-no-puede-acceder-a-admin
- **WHEN** un participante intenta acceder a rutas de administración, reportes o sesiones ajenas
- **THEN** el servidor rechaza la solicitud independientemente de lo que la interfaz oculte
