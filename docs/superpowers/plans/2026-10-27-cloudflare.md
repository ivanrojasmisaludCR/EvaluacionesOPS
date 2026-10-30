# Conexión Cloudflare Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Ejecución por coordinador/integrador, con revisión independiente al final.

**Goal:** QR con enlace público temporal comprobado y regenerable, independiente de cambios de IP LAN.
**Architecture:** cloudflared supervisado en el mismo contenedor, verificación del origen por identificador de instancia y estado protegido de conexión. Mantener datos SQLite e interfaz LAN local.
**Tech Stack:** Node/Express/React/SQLite, cloudflared oficial 2026.10.4 y Docker Compose.
**Spec:** docs/superpowers/specs/2026-10-27-cloudflare-design.md

## C1 — Supervisor y verificación
Responsable Instrumentos/Operación (coordinador). Archivos server/tunnel.ts y tests/tunnel.test.ts. Sin dependencias previas.
- [x] Prueba que reproduzca URL recibida pero aún no comprobada, fallo HTTP, instancia equivocada y recuperación.
- [x] Implementar proceso sin shell, salida acotada, comprobación con timeout, idempotencia y descarte de resultados obsoletos.
- [x] Verificar salida, regeneración y cierre sin dejar procesos.

## C2 — Integración HTTP y QR
Responsable API (coordinador). Archivos server/app.ts, server/main.ts, api/conexion.md, tests/http.test.ts. Depende C1.
- [x] Definir contrato de estado/comprobación/generación, health con instancia y permisos.
- [x] Pruebas HTTP de HTTPS reenviado y WebSocket, no origen cruzado, QR retirado ante fallo y no uso de IP antigua.
- [x] Incorporar estado y notificaciones, proteger config durante modo Cloudflare y detectar LAN guardada obsoleta.

## C3 — Interfaz, Docker y evidencia
Responsable Interfaz/Operación (coordinador). Archivos client/ConnectionSettings.tsx, Facilitator, App, Navigation, CSS, Dockerfile, compose.yaml, docs y tests/browser.spec.ts. Depende C2.
- [x] Panel global y en sala con estado, comprobar y generar nuevo enlace.
- [x] Incorporar binario oficial fijado y arranque administrado en Docker sin borrar volumen.
- [x] Compilar y ejecutar suite, navegador, revisión independiente y prueba real por HTTPS con Cloudflare.
- [x] Verificar conservación de datos y documentación de URL temporal y límites.

## Review Focus
- Resultado tardío de enlace anterior; caída de proceso y doble generación.
- Publicación de QR solo después de verificación de la misma instancia.
- Origin HTTP/WS y cookies Secure detrás de HTTPS; autorización de generación.
- Salida y recursos acotados, sin socket Docker ni privilegios adicionales.
- Túnel real sin red/Cloudflare: mostrar fallo y no afirmar disponibilidad.
