# Spec Delta

## Purpose

Permitir pausar, retomar el segundo día y restaurar la sesión tras reiniciar la aplicación, con persistencia en volumen y copias consistentes durante el uso.

## ADDED Requirements

### Requirement: pausa-y-reanudacion

SHALL Poder pausar, retomar el segundo día y restaurar la sesión tras reiniciar la aplicación.

#### Scenario: sesion-restaurada-despues-de-reinicio
- **WHEN** la aplicación se reinicia durante un taller
- **THEN** la sesión se restaura con su estado, votos, rondas y consenso vigente intactos

### Requirement: persistencia-en-volumen

SHALL Persistencia en volumen con copias consistentes durante el uso, restauración comprobable, migraciones, actualización y recuperación tras fallo.

#### Scenario: respaldo-consistente-de-sesion-abierta
- **WHEN** se genera un respaldo mientras una sesión está en uso
- **THEN** el respaldo es consistente (no asume que copiar un archivo SQLite abierto produce siempre un respaldo consistente) y restaurable en una instalación limpia
