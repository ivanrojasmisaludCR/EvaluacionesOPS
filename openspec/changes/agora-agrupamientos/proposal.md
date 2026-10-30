# Proposal

## Why

El usuario requiere agrupar preguntas y obtener su promedio al responderlas, siguiendo el ejemplo DMIT H3.

## What Changes

- Agrupamiento por Área y Dominio del instrumento del taller.
- Promedio de consensos con igual peso, únicamente al completar todas las preguntas del grupo.
- Avance y nivel redondeado visibles en las tres vistas del taller; consulta de grupos en el editor.

## Capabilities

### New Capabilities

- `resultados-agrupados`: Avance y promedio de cada agrupamiento de preguntas.

## Impact

Se amplía el estado HTTP con groups. Se reutilizan consensos e instantáneas persistidos, sin migración ni nuevas dependencias. No incluye promedio global ni de área.
