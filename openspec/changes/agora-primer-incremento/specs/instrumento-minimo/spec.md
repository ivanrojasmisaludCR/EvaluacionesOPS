# Spec Delta

## Purpose

Definir el catálogo mínimo de instrumento de evaluación de madurez: preguntas, áreas, dominios, identificadores internos estables independientes de celdas Excel, escala fija de 5 niveles enteros y descriptores obligatorios por nivel, con separación entre borrador y versión publicada.

## ADDED Requirements

### Requirement: identificador-interno-estable

SHALL Cada pregunta debe tener un identificador interno estable, independiente de su numeración visible y de las celdas del Excel de origen.

#### Scenario: identificador-persiste-desde-el-catalogo
- **WHEN** se importa el instrumento IS4H_MMC-ES-V4-julio-26.xlsx
- **THEN** cada pregunta recibe un identificador interno estable que no cambia si la numeración visible o las celdas de origen se modifican

### Requirement: escala-fija-cinco-niveles

SHALL Para preguntas de madurez, la escala numérica es fija: exactamente los niveles enteros 1, 2, 3, 4 y 5.

#### Scenario: rechazo-de-niveles-fuera-de-escala
- **WHEN** se intenta registrar un nivel 0, 6, fraccionario o de texto para una pregunta de madurez
- **THEN** el servidor rechaza la entrada, tanto por interfaz como por petición directa

#### Scenario: niveles-obligatorios-antes-de-publicar
- **WHEN** un administrador publica una pregunta de madurez
- **THEN** debe existir exactamente un descriptor no vacío para cada uno de los cinco niveles; sin ellos no se permite publicar

### Requirement: seleccion-multiple-y-texto-sin-puntaje

SHALL Incluir selección múltiple y texto cuando el instrumento lo requiera, sin asignarles puntaje numérico por defecto ni tratarlos como niveles de madurez.

#### Scenario: pregunta-seleccion-multiple-sin-puntaje-numerico
- **WHEN** el instrumento incluye una pregunta de selección múltiple
- **THEN** no se asigna puntaje numérico por defecto ni se trata como nivel de madurez

### Requirement: estados-no-aplica-no-se-abstencion-falta-respuesta

SHALL Distinguir «no aplica», «no sé», abstención y falta de respuesta. Ninguno equivale automáticamente a cero.

#### Scenario: estados-distinguidos-y-sin-cero-implicito
- **WHEN** un participante selecciona «no aplica», «no sé» o se abstiene
- **THEN** se registra el estado correspondiente y ninguno se convierte automáticamente en cero

### Requirement: borrador-y-version-publicada-inmutable

SHALL Separar borrador y versión publicada. Un instrumento publicado y usado por una sesión permanece inmutable; editarlo crea un borrador de otra versión.

#### Scenario: instrumento-publicado-inmutable-durante-sesion
- **WHEN** una sesión está vinculada a una versión publicada del instrumento
- **THEN** el instrumento permanece inmutable; editarlo crea un borrador de nueva versión y no altera los resultados de la sesión vigente

### Requirement: sesion-vinculada-a-version

SHALL Una sesión queda vinculada a una versión del instrumento y conserva sus resultados aunque después cambien las preguntas del catálogo.

#### Scenario: sesion-conserva-resultados-despues-de-cambio-de-catalogo
- **WHEN** se cierra una sesión y después se modifican preguntas del catálogo
- **THEN** los resultados de la sesión conservan la versión del instrumento en vigor al momento de la votación
