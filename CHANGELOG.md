# Cambios de ¡Palabrones!

## v1.1.23 · 2026-11-25 · Multijugador siempre disponible y más ligero

- El botón **Multijugador** ya aparece siempre en el menú (no hace falta `?multi`). El módulo se descarga solo al pulsarlo, así que el juego normal no pesa más. Sigue exigiendo pantalla grande en horizontal.
- Mientras dura el multijugador la escena se dibuja a **la mitad de resolución por lado** (la cuarta parte de los píxeles; con el look CRT, píxeles retro el doble de grandes) y se apaga la oclusión ambiental de «Bonitos». Los menús, botones y palabras siguen nítidos porque son HTML. Al salir vuelve la resolución normal.

## v1.1.22 · 2026-11-25 · Multijugador con tiempo: nadie muere

- En las partidas de 1, 2 o 3 minutos del modo multijugador ya no se muere: los puntos nunca bajan de 0 y gana quien más puntos tenga al terminar el reloj. Solo en «Infinito» el mago que llega a 0 puntos cae y se queda atrás (gana el último en pie).

## v1.1.21 · 2026-11-25 · Multijugador por tiempo y con puntos como vida

- Modo multijugador (experimental, con `?multi`): la partida dura **1, 2 o 3 minutos** (gana quien más puntos tiene al terminar) o es **infinita** (gana el último mago en pie). Hay un reloj arriba y los Palabrones salen sin parar, algo más seguidos según avanza la partida.
- Ya no hay corazones: fallar una palabra, dejar que un Palabrón llegue o recibir un ataque **quita puntos** (100, 150 y 100). Todos empiezan con 300 puntos y el mago que llega a 0 muere.
- El cuerpo de un mago caído se queda atrás: se va hacia la cámara con el camino hasta salir de la pantalla. Al final, los que siguen vivos van primero (por puntos) y después los que cayeron, el que aguantó más delante.

## v1.1.20 · 2026-11-25 · Modo multijugador experimental (4 en la pizarra)

- Nuevo modo **multijugador de 4 jugadores para pizarra digital**, experimental y oculto: solo aparece si la dirección lleva `?multi` (por ejemplo `https://voodatari.github.io/palabrones/?multi`). Sin esa variable no existe ni se carga.
- Los cuatro magos (rojo, azul, verde y amarillo) se colocan a lo ancho de la pantalla, cada uno con su carril y sus 3 botones de respuesta (Sustantivo, Adjetivo, Verbo). Todos reciben las mismas palabras a la vez y gana quien más puntos consiga: se puntúa más cuanto antes se acierta, +50 al primero en acertar cada palabra y +10 por racha. Fallar o dejar que el Palabrón llegue quita un corazón; sin corazones, eliminado; el último en pie recibe una bonificación.
- **Competencia:** cada acierto carga el ataque ⚡. Con 3 cargas se lanza un obstáculo a un rival (se elige tocando su avatar; si no, va al que va ganando): niebla (no deja leer las palabras), pegajoso (bloquea sus botones un momento), Palabrón extra en su carril o acelerón de sus Palabrones.
- Se configura el nombre de cada jugador, el mundo, el número de palabras (10, 15 o 20) y la velocidad. Al terminar hay podio, fuegos artificiales para el ganador y botón de revancha. Solo se puede jugar en pantallas grandes en horizontal (pizarras); en el móvil o la tablet pequeña avisa de que no está disponible. Para probar sin pantalla táctil hay teclas (A S D · F G H · J K L · ← ↓ →; ataque W, T, I, ↑).

## v1.1.19 · 2026-11-24 · ¡Gran final del juego!

- Al vencer al último jefe (el Dragón Revoltijo) hay una fiesta antes de los resultados: fuegos artificiales de colores en el cielo, Lumi saltando
  de alegría, confeti y lluvia de emojis, fanfarria y felicitación en voz alta. Aparece un diploma de «Gran Maestro de las Palabras» con el nombre
  del jugador, sus estrellas, Palabrones vencidos y rango.
- La primera vez da un premio de campeón (+300 monedas) y el logro nuevo «Gran Maestro de las Palabras». Las siguientes veces, la fiesta se repite sin premio.

## v1.1.18 · 2026-11-24 · Lumi se queda en el suelo y el objetivo no cambia de golpe

- Al perder todas las vidas, Lumi cae una sola vez y se queda en el suelo mientras se ven los resultados (antes volvía a caer al
  mostrarse el resultado y se levantaba sola). Al pulsar «Repetir» se levanta (la caída al revés) y, cuando ya está de pie, empieza
  la partida; al salir al menú se levanta también.
- La palabra a acertar ya no cambia de golpe sin haberla contestado: cada Palabrón nuevo sale siempre por detrás de los que ya
  están (antes uno veloz podía aparecer más cerca que el objetivo) y el objetivo se mantiene hasta que se contesta o llega a Lumi.

## v1.1.17 · 2026-11-24 · Cámara de los jefes cada 2 preguntas

- La cámara panorámica de los jefes (solo ordenador) cambia de punto de vista cada 2 preguntas en vez de en cada una.

## v1.1.16 · 2026-11-24 · Jefes enormes, cámaras panorámicas y sin adelantamientos

- Jefes finales mucho más grandes (se pueden salir del ancho del camino). La cámara se encuadra sola para que su cabeza
  nunca quede tapada por el panel de la pregunta ni por la barra de vida.
- Ordenador: cámaras panorámicas en los jefes. Cada pregunta se ve desde un punto de vista distinto (de lado, en tres
  cuartos, desde detrás del jefe…), elevadas y con Lumi y el jefe a la vez para apreciar la diferencia de tamaño. Se
  comprueba que ninguno de los dos queda detrás de los botones de respuesta, del panel o fuera de la pantalla (si una
  cámara no lo cumple se salta) y se oculta el decorado que taparía a Lumi o al jefe. Se puede quitar en
  Opciones («Cámara panorámica en los jefes»); en móvil y tablet no existe.
- El camino, la franja de hierba y los bordillos de piedra se prolongan hasta el fondo y por detrás de Lumi, para que se vean
  completos desde esas cámaras.
- En los jefes con la cámara clásica, Lumi ya no queda tapada por los botones de respuesta siempre que quepa.
- Los Palabrones ya no se adelantan unos a otros: el orden de llegada no cambia, así que la palabra a acertar nunca cambia
  de golpe (antes un Palabrón veloz podía pasar a otro más lento y cambiar el objetivo).
- Las palabras de los bocadillos ya no pierden los rabillos de letras como g, j, p, q o y: el rombo de la punta pasa por detrás
  del texto.

## v1.1.15 · 2026-11-24 · Resolución correcta con la página alejada en el iPhone

- Con el zoom de página de Safari reducido (por ejemplo, al 50 %), el iPhone dice que la pantalla mide el doble de
  píxeles web pero mantiene la misma densidad, y el juego dibujaba el doble de píxeles por lado de los que la pantalla
  puede mostrar (4 veces el trabajo): 780×1398 sin look retro y 2340×4194 con él. Ahora se tiene en cuenta ese zoom en
  las pantallas táctiles y se dibuja a la resolución real (390×699 y 1170×2097 en ese caso).

## v1.1.14 · 2026-11-24 · Look retro en iPhone y menos trabajo por fotograma

- Look retro en iPhone y iPad: Safari no respeta el escalado «pixelado» en los lienzos WebGL y emborronaba la imagen,
  así que el efecto no se veía. Ahora la ampliación la hace siempre el propio juego a la resolución real de la pantalla,
  con un lienzo sin suavizado ni profundidad propios (lo que hace barato ese pase). Por eso activar o quitar el look
  retro recarga el juego.
- En móvil y tablet el píxel retro es más grande (unas 240 líneas en el lado corto; 2 px web en un iPhone), con líneas
  de barrido y franjas RGB visibles, como en el ordenador.
- Menos llamadas de dibujo (en el móvil, en la pradera, de ~285 a ~140 por fotograma): las piedras del bordillo,
  árboles, rocas y arbustos se dibujan con mallas instanciadas (una por modelo); las piezas fijas del fondo se funden
  por material y cada nube es una sola malla.
- Los efectos de la partida (proyectiles, halos, ondas y monedas) se preparan al cargar el mundo, para que no den un
  tirón la primera vez que aparecen.
- Medidor de rendimiento opcional: añadiendo `?fps` a la dirección se ven los fotogramas por segundo y el peor
  fotograma de cada segundo.

## v1.1.13 · 2026-11-24 · Look retro mucho más rápido en el móvil

- En el móvil y la tablet el dibujo 3D se hace solo a la resolución retro (unas 9-16 veces menos píxeles que antes) y el
  navegador lo amplía con píxeles nítidos. Las líneas de barrido van en una capa fija que se pinta una sola vez por
  tamaño de pantalla, y el suavizado de bordes es el del propio navegador a baja resolución (casi gratis). Antes el
  lienzo se ponía a la resolución completa de la pantalla con suavizado MSAA, lo que hundía el rendimiento.
- Corregidas las «esferas blancas» que avanzaban hacia la cámara con el look retro: las partículas del ambiente
  (luciérnagas, nieve, arena…) se dibujaban varias veces más grandes de lo debido.
- En el ordenador se mantiene el pase a resolución completa (líneas y franjas RGB exactas); las partículas del ambiente
  también tienen ya su tamaño correcto.

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
