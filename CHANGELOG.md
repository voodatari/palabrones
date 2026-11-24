# Cambios de ¡Palabrones!

## v1.1.12 · 2026-11-24 · Look retro en el móvil

- El look retro dejaba de funcionar en muchos móviles (solo cambiaba el color del cielo y bajaba mucho el rendimiento):
  usaba un objetivo de dibujo con suavizado MSAA y texturas de coma flotante, que esos móviles no admiten. Ahora el
  MSAA va en un objetivo de 8 bits (que sí admiten) y solo se usa con «Bonitos» si la tarjeta lo permite.
- Comprobación automática: si aun así el dispositivo no puede dibujarlo, primero se prueba sin MSAA y, si tampoco, el
  look retro se desactiva solo (y su interruptor queda apagado) en vez de estropear la imagen.
- En el móvil cada píxel retro mide ≈1,3 px web (4 de pantalla en un x3): más fino que en el ordenador, y las franjas de
  color solo se pintan cuando encajan con el tamaño del píxel.

## v1.1.11 · 2026-11-24 · Lumi siempre a la vista al terminar un nivel

- Al superar (o perder) un nivel, Lumi se ve entera mientras aparecen las ventanas: en horizontal se coloca a la
  izquierda y el resultado, la subida de nivel y demás ventanas van a la derecha, en el espacio libre; en vertical
  (móvil) Lumi queda arriba y las ventanas abajo, sin tapar nada. Los avisos de logros y misiones salen de uno en uno
  (en horizontal, abajo a la izquierda) para no taparla.

## v1.1.10 · 2026-11-24 · Look retro nítido, sin moiré

- Look retro: cada píxel retro mide ahora un número entero de píxeles de pantalla y el dibujo final se hace a la
  resolución real del monitor o del móvil, así que las líneas de barrido y las franjas de color encajan y ya no hay
  moiré. Se quita el emborronado horizontal y el FXAA sobre la imagen pequeña (la desenfocaba): el borde de los
  objetos se suaviza ahora con MSAA al dibujar, y los píxeles quedan nítidos.

## v1.1.9 · 2026-11-24 · Retoques de imagen y vista vertical

- Se quita el bloom (brillo difuso), que restaba contraste a la imagen.
- Look retro: más resolución en el navegador (unas 320 líneas) y en el móvil (cada píxel retro es de 1 px de
  la web, con la imagen final a la resolución real de la pantalla). El antialiasing FXAA también se aplica en
  el look retro, sobre la imagen de baja resolución y antes del filtro CRT.
- Vista vertical del móvil: Lumi se ve más abajo y más grande, justo encima de los botones.

## v1.1.8 · 2026-11-24 · Bordes suaves

- Con gráficos «Bonitos» se añade antialiasing FXAA (muy barato para la tarjeta gráfica): desaparecen los dientes de
  sierra en los bordes. Con «Ligeros» se mantiene el antialiasing de hardware de siempre y con el look retro no se aplica.

## v1.1.7 · 2026-11-24 · Colores sin mapa de tonos

- Se quita el mapa de tonos (ACES) del dibujo 3D: los colores salen más intensos y con más contraste.

## v1.1.6 · 2026-11-24 · Look retro CRT

- Nuevo ajuste en Opciones, «Look retro (pixelado CRT)»: el dibujo 3D se ve con píxeles grandes (unas 240 líneas
  en pantallas grandes; en el móvil el píxel es de 2 px para no perder detalle), líneas de barrido y franjas de
  color, sin curvar la imagen y sin cambiar el brillo medio. Solo afecta al 3D: los menús, botones y textos
  siguen nítidos. Se cambia al momento y se recuerda. Además va más ligero (se dibuja en menos píxeles).
- El círculo y la sombra de Lumi ya no se ven mientras el juego carga: aparecen cuando todo está listo.

## v1.1.5 · 2026-11-24 · Pelo y sombrero de Lumi

- El pelo de Lumi ya no atraviesa el sombrero de mago por detrás ni deja una franja blanca bajo el ala por delante.

## v1.1.4 · 2026-11-24 · Lumi, aprendiz de mago animado

- Lumi vuelve a ser un modelo con animaciones de verdad (esqueleto completo): corre, lanza el hechizo con la
  varita, se tambalea al recibir un golpe, celebra y se desploma al perder. Es un chico aventurero de Quaternius
  (CC0) con cabeza grande, túnica morada, sombrero de mago con estrella y varita con orbe brillante.
- Los sombreros de la tienda se colocan sobre su pelo (corona, chistera, casco vikingo, gorra, flores).

## v1.1.3 · 2026-11-24 · Lumi, una brujita chibi

- Nuevo personaje protagonista: Lumi es ahora una niña brujita «chibi» (cabeza grande, ojos verdes, trenzas y
  varita con estrella) en lugar de un mago adulto. Se mueve con saltitos al correr, se echa hacia atrás al
  lanzar el hechizo, se sacude al recibir un golpe, da piruetas al celebrar y se encoge al estar triste.
  Si compras otro sombrero en la tienda, sustituye al suyo de bruja.
- La velocidad del juego por defecto es la máxima del control de Opciones (x1,6); se puede bajar cuando se quiera.
- La cámara está un poco más baja para que Lumi se vea entera sobre los botones.

## v1.1.2 · 2026-11-24 · Cambios menores

- Cambios menores.
- README con el enlace al juego jugable, modos, contenido y créditos.

## v1.1.1 · 2026-11-24 · Música sin cortes al empezar

- Si existe el archivo de una canción (carpeta music/), ya no suena antes la música generada mientras
  llega: se espera al archivo y, entre tanto, sigue la música anterior. La generada solo suena si el
  archivo no existe o falla.
- El menú se empieza a bajar nada más abrir la página y el resto de pistas, una detrás de otra en
  segundo plano. Solo se mantiene decodificada la canción que suena (antes eran las 7 a la vez: cientos
  de MB de memoria, un problema en móviles).

## v1.1.0 · 2026-11-24 · Textos de la partida rediseñados

- Las palabras sobre los monstruos ya no son carteles 3D (se movían raro, se tapaban entre sí y quedaban
  oscuros): ahora son etiquetas de pantalla de tamaño fijo, siempre nítidas, apoyadas justo encima de la
  cabeza del monstruo (nunca lo tapan). La del objetivo es mayor, va delante y lo señala con un piquito.
  Las demás se apartan para no pisarse y no salen hasta que están lo bastante cerca para leerse.
- Un solo sitio para cada cosa: arriba corazones, progreso, puntos y pausa; debajo, la tarjeta con la
  pregunta; debajo, una franja de avisos (oleada, racha, logros, misiones…) que muestra uno cada vez;
  el campo de juego queda libre; abajo, los hechizos. La racha es una pegatina de la tarjeta.
- Jefes mucho más grandes y sin cartel encima.
- Un solo dibujado por fotograma (antes eran dos): más fluido.

## v1.0.0 · 2026-11-23 · Primera versión

- Videojuego 3D (three.js r187) para distinguir **sustantivos, adjetivos y verbos**.
- Gráficos con modelos 3D animados de Quaternius (CC0; el mago, CC-BY 3.0): Lumi es un mago que corre
  y lanza hechizos; 27 monstruos distintos repartidos por mundos; jefes Rey Champiñón, Bruja Borrona,
  Cactoro Farfullón, Yeti Trabalenguas y Dragón Revoltijo; árboles, rocas, flores, torres y castillos.
- Iluminación realista (luz de entorno, sombras), oclusión ambiental y brillo en calidad alta; suelo y
  camino con textura que se desplaza: el mundo avanza unas 3 veces más rápido que antes.
- Precarga: el primer mundo antes de empezar (con barra) y el resto en segundo plano; sombreadores
  precompilados por mundo para que no haya tirones.
- Música de Pixabay con `descargar-musica.bat` (si no está, se genera en el navegador).
- Tienda: las «túnicas» pasan a ser auras mágicas a los pies del mago.
- Lumi, el mago, vence a los Palabrones lanzando el hechizo correcto (azul, verde, rojo).
- El mundo avanza: Lumi camina hacia los Palabrones y el decorado se desplaza (se para al congelar,
  en pausa y con los jefes). Los Palabrones se menean y su cara se mueve con el cuerpo.
- 5 mundos 3D (Pradera, Bosque, Desierto, Nieve, Castillo) con 3 niveles y un jefe cada uno.
- Reto: cada nivel tiene 3 oleadas cada vez más rápidas; la dificultad sube mucho de mundo a mundo
  (velocidad, número de Palabrones a la vez, más palabras y menos tiempo con los jefes).
- Palabrones especiales: veloces (pequeños y rápidos) y gigantes (lentos, doble de puntos).
- Zona de peligro: borde rojo, latido y rugido cuando un Palabrón se acerca. ¡FRENESÍ! cada 10 aciertos
  seguidos (puntos x2, aura dorada, música más intensa). 3 estrellas = 90 % y como mucho un corazón perdido.
- Monstruos con piel de texturas procedurales con relieve, ojos enfadados, dientes, cuernos y garras;
  cada jefe con el aspecto de su nombre (Gruñón, Bruja, Faraón, Yeti, Rey).
- Opciones: deslizador de velocidad general del juego (x0,6 a x1,6).
- Banco de palabras: 2.411 palabras sueltas (842 sustantivos, 511 adjetivos, 1.058 verbos) filtradas
  con un diccionario para que ninguna sea ambigua, y 245 frases (142 con palabras camaleón).
- Al fallar se muestra solo la palabra y su clase (sin texto largo).
- Dificultad creciente: palabras sueltas, verbos conjugados, sustantivos abstractos, adjetivos
  en femenino/plural, palabras dentro de frases y «palabras camaleón» (canto, juego, cocina…).
- Progresión: XP, niveles y rangos, estrellas, monedas, tienda (sombreros, túnicas y mascotas),
  24 logros, misiones del día, racha de días y súper hechizo «Congelar».
- Seguimiento del alumno: dominio por clase de palabra con medallas, gráfica de evolución,
  palabras para repasar, modo Entrenar con sus fallos, tabla de la clase e informe para el profe.
- Música y efectos generados en el navegador (o pistas MP3 opcionales en `music/`).
