# Proposal

## Why

El QR conserva IPs de redes anteriores o internas de Docker. El usuario pidió acceso Cloudflare, comprobar que aplicación y URL continúan disponibles y generar una nueva dirección si falla. Eligió enlace temporal automático.

## What Changes

- cloudflared oficial supervisado dentro del contenedor, con certificados TLS oficiales.
- Comprobación periódica y manual del enlace HTTPS contra la misma instancia.
- QR y enlace compartible únicamente cuando la comprobación pasa.
- Generación de otra URL por el administrador desde la dirección local, sin borrar talleres.
- Panel Conexión y QR en menú y sala, y detección de dirección LAN guardada obsoleta.
- HTTPS reenviado y WebSocket con validación de origen y cookies Secure.

## Capabilities

### New Capabilities

- `conexion-publica`: URL temporal comprobada y QR regenerable.

## Impact

Nuevos endpoints administrativos y campo efímero instanceId en health. Sin migración de datos. Nueva dependencia operativa cloudflared fijada a 2026.10.4; sin Docker socket ni privilegios nuevos. Requiere Internet y no garantiza dirección permanente. Cookies no se transfieren a dominios nuevos.
