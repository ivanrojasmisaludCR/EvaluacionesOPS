# Proposal

## Why

El usuario necesita consultar el resumen de dominios y los radares de áreas del instrumento en cualquier momento, con el avance actual del taller.

## What Changes

- Resumen derivado de consensos actuales por dominio y área, con etiquetas parciales y pendientes.
- Gráficos de radar general por áreas y detalle de dominios; tablas de suma, promedio y nivel.
- Página de selección /resultados y consulta /resultados/CODIGO.
- Accesos desde menú, facilitación, participante y proyección, respetando permisos de la sala.

## Capabilities

### New Capabilities

- `resultados-en-vivo`: Consulta del avance actual y comparación de áreas/dominios.

## Impact

Propiedad results adicional en el estado HTTP. Cálculo puro, SVG sin dependencias nuevas y sin migraciones. No incluye exportación ni puntaje único de todas las áreas. No certifica todas las fórmulas del Excel original.
