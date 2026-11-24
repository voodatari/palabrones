# ¡Palabrones!

### ▶️ [Jugar ahora: voodatari.github.io/palabrones](https://voodatari.github.io/palabrones/)

Videojuego 3D de aula para practicar la diferencia entre **sustantivos**, **adjetivos** y
**verbos** (5.º de primaria). Funciona en el navegador (ordenador, pizarra digital, tablet y
móvil) sin instalar nada y sin cuentas: el progreso se guarda en el propio dispositivo.

> Requiere un navegador actual con WebGL (Chrome, Edge, Firefox, Safari). En la tablet o el móvil,
> mejor en horizontal o vertical sin la barra del navegador. Si va lento, en *Opciones* se puede
> poner los gráficos en «Ligeros».

## Cómo se juega

Los Palabrones avanzan por el camino con una palabra encima. El marcado con la flecha
es el objetivo: elige su hechizo antes de que llegue hasta Lumi, la maga.

| Hechizo | Para… | Teclas |
|---|---|---|
| 🔵 Sustantivo | palabras que **nombran** | `1`, `S`, ← |
| 🟢 Adjetivo | palabras que dicen **cómo es** algo | `2`, `A`, ↓ |
| 🔴 Verbo | palabras de **acción** | `3`, `V`, → |

`Espacio` = Congelar (cuando el súper está cargado) · `Esc` = pausa. En pantalla táctil se pulsan
los tres botones de hechizo.

Si fallas, el juego te muestra la clase de la palabra (y, si la voz está activada, te explica por qué),
y esa palabra volverá a salir más adelante para que la aprendas.

## Modos de juego

- **Aventura:** 5 mundos (Pradera Pétalo, Bosque Brumoso, Dunas Doradas, Picos Helados y Castillo del
  Caos), cada uno con varios niveles de dificultad creciente y un jefe final.
- **Entrenar:** repaso de las palabras falladas y de la clase que peor se te da.
- **Desafío:** oleadas sin fin para batir tu récord.
- **Misiones diarias, logros, tienda** (sombreros, auras y mascotas con las monedas ganadas) y
  **rangos** que suben con la experiencia.

## Lo que mide del alumno

- Dominio de cada clase de palabra (últimas 40 respuestas) con medallas de bronce, plata y oro.
- Evolución del acierto en las últimas partidas.
- Palabras falladas: vuelven a salir hasta acertarlas dos veces (y se practican en «Entrenar»).
- «Copiar informe para el profe» y la tabla «La clase» con todos los jugadores del dispositivo.

No hay cuentas ni servidor: todo se guarda en el navegador de cada dispositivo (varios jugadores
pueden compartir uno, cada uno con su perfil). Borrar los datos del navegador borra el progreso.

## Contenido

- Más de **5.600 palabras sueltas** (sustantivos, adjetivos y verbos, de dos niveles de dificultad) y
  **245 frases** etiquetadas, algunas con «palabras camaleón» que cambian de clase según la frase
  (por ejemplo, *canto*).
- Las palabras sueltas son siempre de una sola clase sin discusión; el juego evita repetirlas en
  una misma partida y entre partidas seguidas.
- Música de fondo distinta en cada mundo, voz del navegador para las explicaciones y velocidad
  general ajustable en *Opciones*.

## Para docentes y desarrolladores

Es una web estática (HTML + CSS + módulos JS, sin compilación). Para probarla en local hace falta un
servidor HTTP (abrir `index.html` con doble clic no funciona porque usa módulos JS):

```
npx serve .
```

| Carpeta | Contenido |
|---|---|
| `js/datos.js` | frases, mundos, niveles y tienda |
| `js/banco.js` | banco de palabras sueltas (generado, no se edita a mano) |
| `js/escena.js` | mundos 3D, personajes, jefes y hechizos (three.js) |
| `js/juego.js` · `js/progreso.js` | reglas de la partida · perfiles, logros y guardado |
| `modelos/` · `music/` | modelos 3D (GLB) y música (MP3) |

El historial de versiones está en [CHANGELOG.md](CHANGELOG.md).

## Créditos y licencias

- Motor 3D: [three.js](https://threejs.org) r187 (licencia MIT, copia en `js/lib`).
- Modelos 3D: [Quaternius](https://quaternius.com) (CC0, vía [Poly Pizza](https://poly.pizza)); el mago es
  «Animated Wizard» de Quaternius (CC BY 3.0). Lista completa en `modelos/creditos.txt`.
- Música: pistas de [Pixabay](https://pixabay.com) (Pixabay Content License). Autores en `music/creditos.txt`.
