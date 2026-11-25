// ¡Palabrones! · Banco de palabras, frases, mundos y niveles.
// Regla de oro: las palabras SUELTAS son de una sola clase sin dudas (nada de «canto»,
// «juego», «cocina», «río», «frío»…). Las palabras «camaleón» solo salen dentro de una frase.

import { BANCO } from './banco.js?v=1.1.21';

export const CATS = {
  S: { id: 'S', nombre: 'Sustantivo', corto: 'Nombre', lema: 'nombra', color: '#3b82f6', claro: '#93c5fd', oscuro: '#1e40af' },
  A: { id: 'A', nombre: 'Adjetivo', corto: 'Cualidad', lema: 'cómo es', color: '#22c55e', claro: '#86efac', oscuro: '#15803d' },
  V: { id: 'V', nombre: 'Verbo', corto: 'Acción', lema: 'acción', color: '#ef4444', claro: '#fca5a5', oscuro: '#b91c1c' },
};

export const TRUCOS = {
  S: { que: 'Nombra personas, animales, cosas, lugares, sentimientos o ideas.', prueba: 'Puedes poner «el, la, un, una» delante: «la mesa», «un perro».' },
  A: { que: 'Dice cómo es o cómo está un sustantivo (una cualidad).', prueba: 'Acompaña a un sustantivo y puedes decir «muy…»: «un perro muy grande».' },
  V: { que: 'Expresa una acción, un estado o algo que pasa.', prueba: 'Cambia con el tiempo y la persona: «yo corro, ayer corrí, mañana correré».' },
};

const GRUPOS = { g: 'un grupo (es un sustantivo colectivo)', p: 'a una persona', a: 'a un animal', c: 'una cosa', l: 'un lugar', v: 'una planta', s: 'un sentimiento', i: 'una idea' };

// ---------- PALABRAS SUELTAS ----------
// Vienen de banco.js, generado por herramientas/generar-banco.js (quita lo ambiguo con un diccionario).
function desdeBanco(f) {
  if (f[0] === 'S') return { p: f[1], cat: 'S', nivel: f[2], g: f[3], grupo: f[4], pl: !!f[5], pr: !!f[6], el: !!f[7], lema: f[8] };
  if (f[0] === 'A') return { p: f[1], cat: 'A', nivel: f[2], ej: f[3], lema: f[4] };
  return { p: f[1], cat: 'V', nivel: f[2], inf: f[3], quien: f[4], lema: f[3] };
}
export const PALABRAS = BANCO.map(desdeBanco);

// ---------- FRASES ETIQUETADAS ----------
// palabra|S   palabra|A:sustantivo al que acompaña   palabra|V:infinitivo
// Un * delante marca una palabra «camaleón» (en otra frase es de otra clase).
const FRASES_TXT = `
El perro|S grande|A:perro ladra|V:ladrar en el jardín|S.
Los niños|S juegan|V:jugar en el parque|S.
El sol|S brilla|V:brillar en el cielo|S despejado|A:cielo.
Las hojas|S amarillas|A:hojas caen|V:caer en otoño|S.
El gato|S negro|A:gato duerme|V:dormir en el sofá|S.
Mis primos|S viven|V:vivir en un pueblo|S pequeño|A:pueblo.
Los delfines|S saltan|V:saltar sobre las olas|S.
La maestra|S explica|V:explicar el tema|S nuevo|A:tema.
Nosotros estudiamos|V:estudiar en la biblioteca|S.
El tren|S llega|V:llegar a la estación|S.
Los bomberos|S valientes|A:bomberos apagaron|V:apagar el fuego|S.
Lucía|S pinta|V:pintar un cuadro|S enorme|A:cuadro.
Esa nube|S gris|A:nube parece|V:parecer un dragón|S.
La amistad|S es|V:ser muy importante|A:amistad.
Hoy siento|V:sentir una alegría|S enorme|A:alegría.
Las montañas|S nevadas|A:montañas son|V:ser preciosas|A:montañas.
El viento|S helado|A:viento sopla|V:soplar con fuerza|S.
La pintura|S azul|A:pintura mancha|V:manchar la mesa|S.
Mi amiga|S Sara|S tiene|V:tener una bicicleta|S roja|A:bicicleta.
La tortuga|S lenta|A:tortuga ganó|V:ganar la carrera|S.
Un búho|S sabio|A:búho vive|V:vivir en el bosque|S.
Mi hermana|S lee|V:leer cuentos|S divertidos|A:cuentos.
El pirata|S valiente|A:pirata busca|V:buscar un tesoro|S.
La princesa|S simpática|A:princesa monta|V:montar a caballo|S.
Las abejas|S trabajadoras|A:abejas fabrican|V:fabricar miel|S.
El dragón|S verde|A:dragón vigila|V:vigilar el castillo|S.
Mi abuela|S *cocina|V:cocinar una tarta|S deliciosa|A:tarta.
La *cocina|S de mi casa|S es|V:ser muy luminosa|A:cocina.
Mi *juego|S favorito|A:juego es|V:ser el ajedrez|S.
*Juego|V:jugar con mi hermano|S pequeño|A:hermano.
El *canto|S del gallo|S despierta|V:despertar a mi madre|S.
Yo *canto|V:cantar canciones|S alegres|A:canciones.
La *llama|S de la vela|S es|V:ser naranja|A:llama.
Mi madre|S me *llama|V:llamar por teléfono|S.
Un *vuelo|S largo|A:vuelo cansa|V:cansar mucho.
Yo *vuelo|V:volar en mis sueños|S.
La *joven|S lee|V:leer un libro|S.
Tengo|V:tener un gato|S *joven|A:gato y travieso|A:gato.
El *dulce|S de chocolate|S está|V:estar riquísimo|A:dulce.
Este pastel|S es|V:ser muy *dulce|A:pastel.
*Camino|V:caminar al colegio|S cada mañana|S.
El *camino|S al castillo|S es|V:ser estrecho|A:camino.
*Paseo|V:pasear con mi perro|S por la playa|S.
El *paseo|S por el bosque|S fue|V:ser divertido|A:paseo.
El *trabajo|S de mi padre|S es|V:ser interesante|A:trabajo.
*Trabajo|V:trabajar en un hospital|S grande|A:hospital.
El *baile|S de la fiesta|S fue|V:ser increíble|A:baile.
Ese *salto|S fue|V:ser altísimo|A:salto.
*Salto|V:saltar a la comba|S con mis amigas|S.
El *río|S lleva|V:llevar agua|S fría|A:agua.
Me *río|V:reír con los chistes|S de mi tío|S.
Un *abrazo|S fuerte|A:abrazo cura|V:curar la tristeza|S.
*Abrazo|V:abrazar a mi oso|S de peluche|S.
Tuve|V:tener un *sueño|S rarísimo|A:sueño.
*Sueño|V:soñar con dragones|S de colores|S.
Hace|V:hacer mucho *frío|S en invierno|S.
El agua|S del lago|S está|V:estar muy *fría|A:agua.
*Limpio|V:limpiar mi habitación|S los sábados|S.
Mi habitación|S está|V:estar *limpia|A:habitación.
El *rojo|S es|V:ser mi color|S favorito|A:color.
Tengo|V:tener un balón|S *rojo|A:balón.
La *pregunta|S era|V:ser difícil|A:pregunta.
Andrés|S *pregunta|V:preguntar a la maestra|S.
Ese *cuadrado|S es|V:ser verde|A:cuadrado.
Dibujé|V:dibujar un pañuelo|S *cuadrado|A:pañuelo.
*Corto|V:cortar el papel|S con las tijeras|S.
Mi pelo|S es|V:ser *corto|A:pelo.
El ayudante|S del mago|S prepara|V:preparar una poción|S.
Los *sabios|S del reino|S leen|V:leer libros|S antiguos|A:libros.
El elefante|S gris|A:elefante bebe|V:beber agua|S fresca|A:agua.
La jirafa|S alta|A:jirafa come|V:comer hojas|S verdes|A:hojas.
Mi hermana|S pequeña|A:hermana dibuja|V:dibujar un castillo|S enorme|A:castillo.
El cartero|S trae|V:traer una carta|S importante|A:carta.
Los pingüinos|S nadan|V:nadar en el agua|S *helada|A:agua.
La abuela|S teje|V:tejer una bufanda|S azul|A:bufanda.
El tren|S rápido|A:tren cruza|V:cruzar el puente|S.
Mi perro|S persigue|V:perseguir a los gatos|S.
Las estrellas|S brillan|V:brillar en la noche|S oscura|A:noche.
El panadero|S prepara|V:preparar pan|S crujiente|A:pan.
Los alumnos|S atentos|A:alumnos escuchan|V:escuchar la explicación|S.
La bruja|S malvada|A:bruja prepara|V:preparar una poción|S mágica|A:poción.
El astronauta|S viaja|V:viajar a un planeta|S lejano|A:planeta.
Las aves|S construyen|V:construir nidos|S pequeños|A:nidos.
Mi tía|S tiene|V:tener una moto|S nueva|A:moto.
El león|S feroz|A:león ruge|V:rugir en la sabana|S.
La luna|S *llena|A:luna ilumina|V:iluminar el bosque|S.
Los bomberos|S rescatan|V:rescatar a un gatito|S asustado|A:gatito.
El sol|S calienta|V:calentar la arena|S de la playa|S.
Mi abuelo|S *cuenta|V:contar historias|S divertidas|A:historias.
La profesora|S corrige|V:corregir los exámenes|S.
El mono|S travieso|A:mono salta|V:saltar entre los árboles|S.
Las hormigas|S llevan|V:llevar *comida|S al hormiguero|S.
El viento|S fuerte|A:viento mueve|V:mover las ramas|S.
Martina|S escribe|V:escribir un poema|S precioso|A:poema.
El dragón|S *rojo|A:dragón vuela|V:volar sobre la montaña|S.
Los niños|S cansados|A:niños duermen|V:dormir la siesta|S.
La tortuga|S camina|V:caminar muy despacio.
El gato|S travieso|A:gato persigue|V:perseguir a un ratón|S.
Mi madre|S *compra|V:comprar fruta|S fresca|A:fruta.
Hugo|S toca|V:tocar la guitarra|S eléctrica|A:guitarra.
La ballena|S azul|A:ballena es|V:ser un animal|S enorme|A:animal.
Los dinosaurios|S vivieron|V:vivir hace millones|S de años|S.
El pirata|S barbudo|A:pirata busca|V:buscar su tesoro|S.
La araña|S teje|V:tejer una tela|S brillante|A:tela.
Mi primo|S colecciona|V:coleccionar cromos|S antiguos|A:cromos.
El cocinero|S *corta|V:cortar las verduras|S.
Los delfines|S inteligentes|A:delfines juegan|V:jugar con la pelota|S.
Una nube|S negra|A:nube anuncia|V:anunciar la tormenta|S.
El caballo|S blanco|A:caballo galopa|V:galopar por el campo|S.
Los patos|S nadan|V:nadar en el estanque|S tranquilo|A:estanque.
La niña|S valiente|A:niña sube|V:subir a la montaña|S.
El cohete|S despega|V:despegar hacia la luna|S.
Las abejas|S fabrican|V:fabricar miel|S *dulce|A:miel.
Mi abuela|S riega|V:regar las flores|S del jardín|S.
Sara|S lee|V:leer un cómic|S divertido|A:cómic.
El granjero|S ordeña|V:ordeñar las vacas|S.
Las ardillas|S esconden|V:esconder bellotas|S.
Un relámpago|S ilumina|V:iluminar el cielo|S.
La maestra|S simpática|A:maestra reparte|V:repartir los cuadernos|S.
Los exploradores|S encuentran|V:encontrar una cueva|S secreta|A:cueva.
El perro|S ladra|V:ladrar al cartero|S.
Mi padre|S arregla|V:arreglar la bicicleta|S *vieja|A:bicicleta.
La mariposa|S amarilla|A:mariposa vuela|V:volar entre las flores|S.
Los niños|S construyen|V:construir un castillo|S de arena|S.
La doctora|S atiende|V:atender a un *paciente|S.
El búho|S sabio|A:búho observa|V:observar la noche|S.
Las cebras|S tienen|V:tener rayas|S negras|A:rayas.
El volcán|S expulsa|V:expulsar *lava|S ardiente|A:lava.
Pablo|S *marca|V:marcar un gol|S espectacular|A:gol.
El zorro|S astuto|A:zorro engaña|V:engañar al cuervo|S.
La reina|S elegante|A:reina saluda|V:saludar desde el balcón|S.
Los *científicos|S estudian|V:estudiar las estrellas|S.
Mi hermano|S mayor|A:hermano conduce|V:conducir un coche|S nuevo|A:coche.
El agua|S del mar|S es|V:ser salada|A:agua.
La lechuza|S *caza|V:cazar ratones|S por la noche|S.
Los turistas|S visitan|V:visitar el museo|S.
El reloj|S antiguo|A:reloj suena|V:sonar cada hora|S.
Lola|S prepara|V:preparar una tarta|S de fresa|S.
El tiburón|S hambriento|A:tiburón *nada|V:nadar muy deprisa.
Las hojas|S *secas|A:hojas crujen|V:crujir bajo los pies|S.
El conejo|S blanco|A:conejo come|V:comer zanahorias|S.
Mi gata|S duerme|V:dormir sobre la alfombra|S suave|A:alfombra.
El explorador|S cruza|V:cruzar la selva|S peligrosa|A:selva.
El pastel|S de chocolate|S huele|V:oler muy bien.
La cigüeña|S construye|V:construir su nido|S en la torre|S.
Los osos|S pardos|A:osos pescan|V:pescar salmones|S.
Mi amiga|S Noa|S colecciona|V:coleccionar piedras|S bonitas|A:piedras.
El mago|S misterioso|A:mago hace|V:hacer un truco|S increíble|A:truco.
La princesa|S valiente|A:princesa vence|V:vencer al dragón|S.
El invierno|S trae|V:traer días|S *fríos|A:días.
Las vacas|S pastan|V:pastar en el prado|S verde|A:prado.
Las tijeras|S cortan|V:cortar el papel|S.
Nosotros celebramos|V:celebrar el cumpleaños|S de Paula|S.
El autobús|S amarillo|A:autobús llega|V:llegar al colegio|S.
La lluvia|S moja|V:mojar las aceras|S.
Mi *vecino|S amable|A:vecino riega|V:regar su huerto|S.
Las olas|S *gigantes|A:olas golpean|V:golpear las rocas|S.
El jardinero|S *planta|V:plantar rosales|S.
Los astronautas|S flotan|V:flotar en la nave|S espacial|A:nave.
La biblioteca|S tiene|V:tener muchos libros|S interesantes|A:libros.
El caracol|S lento|A:caracol sube|V:subir por la pared|S.
Las niñas|S cantan|V:cantar una canción|S alegre|A:canción.
Mi madre|S *cocina|V:cocinar una paella|S deliciosa|A:paella.
El pez|S *nada|V:nadar en la pecera|S.
Mi abuelo|S me *ayuda|V:ayudar con los *deberes|S.
Necesito|V:necesitar tu *ayuda|S.
La *planta|S del salón|S necesita|V:necesitar agua|S.
Mi tío|S *planta|V:plantar tomates|S en el huerto|S.
La *pesca|S es|V:ser su afición|S favorita|A:afición.
El oso|S *pesca|V:pescar en el *río|S.
El *camino|S del bosque|S es|V:ser *largo|A:camino.
Esta *visita|S fue|V:ser muy divertida|A:visita.
Mi prima|S *visita|V:visitar a sus abuelos|S.
Papá|S *compra|V:comprar el *periódico|S.
La *compra|S del mercado|S *pesa|V:pesar mucho.
El *dibujo|S de Hugo|S es|V:ser precioso|A:dibujo.
Yo *dibujo|V:dibujar animales|S fantásticos|A:animales.
Me encanta|V:encantar este *regalo|S.
*Regalo|V:regalar flores|S a mi madre|S.
La *cena|S está|V:estar *lista|A:cena.
Mi familia|S *cena|V:cenar en la terraza|S.
El *grito|S del niño|S asustó|V:asustar al perro|S.
*Grito|V:gritar de alegría|S en la montaña|S rusa|A:montaña.
Mi madre|S me da|V:dar un *beso|S.
*Beso|V:besar a mi abuela|S.
La *suma|S es|V:ser fácil|A:suma.
Lucía|S *suma|V:sumar dos números|S.
La *resta|S era|V:ser difícil|A:resta.
Mi hermano|S *resta|V:restar con los dedos|S.
La *cuenta|S del restaurante|S es|V:ser cara|A:cuenta.
La *lava|S del volcán|S quema|V:quemar todo.
Mi hermano|S *lava|V:lavar los platos|S.
La *espera|S fue|V:ser muy larga|A:espera.
Mi perro|S me *espera|V:esperar en la puerta|S.
Ayer *vino|V:venir mi tía|S a casa|S.
La niña|S *baja|V:bajar por el tobogán|S.
Una pared|S muy *baja|A:pared rodea|V:rodear el jardín|S.
El árbol|S *seco|A:árbol no tiene|V:tener hojas|S.
Mi abuela|S *seca|V:secar la ropa|S al sol|S.
Mi madre|S *corta|V:cortar el pan|S.
Lleva|V:llevar una falda|S *corta|A:falda.
La *ducha|S está|V:estar *fría|A:ducha.
Lucía|S se *ducha|V:duchar por la mañana|S.
La *charla|S fue|V:ser interesante|A:charla.
Mi abuela|S me *paga|V:pagar un *helado|S.
Un viento|S *helado|A:viento sopla|V:soplar en la montaña|S.
El *helado|S de fresa|S está|V:estar riquísimo|A:helado.
Mezclo|V:mezclar la harina|S con la mantequilla|S.
Esa *mezcla|S de colores|S es|V:ser preciosa|A:mezcla.
El gato|S *caza|V:cazar ratones|S.
El caballero|S lleva|V:llevar una *lanza|S *larga|A:lanza.
Pablo|S *lanza|V:lanzar la pelota|S.
Mi primo|S es|V:ser *bajo|A:primo.
Yo *bajo|V:bajar al patio|S.
Tengo|V:tener un *recuerdo|S bonito|A:recuerdo.
*Recuerdo|V:recordar el día|S de mi cumpleaños|S.
Mi abuela|S lee|V:leer un *cuento|S.
Yo *cuento|V:contar las estrellas|S.
La *prueba|S de matemáticas|S fue|V:ser fácil|A:prueba.
Papá|S *prueba|V:probar la sopa|S.
Mi hermano|S tiene|V:tener mucha *fuerza|S.
La *calle|S principal|A:calle es|V:ser muy *ancha|A:calle.
El pan|S está|V:estar *duro|A:pan.
La película|S *dura|V:durar dos horas|S.
Oí|V:oír un ruido|S *extraño|A:ruido.
*Extraño|V:extrañar a mis abuelos|S.
La mochila|S es|V:ser muy *pesada|A:mochila.
*Odio|V:odiar los mosquitos|S.
El *odio|S no es|V:ser bueno|A:odio.
Mi madre|S *llena|V:llenar la botella|S.
Mi *vecino|S es|V:ser simpático|A:vecino.
El pueblo|S *vecino|A:pueblo tiene|V:tener un castillo|S.
El *gigante|S vive|V:vivir en una nube|S.
Hay|V:haber una ola|S *gigante|A:ola.
El *pequeño|S de la familia|S se llama|V:llamar Leo|S.
El *público|S aplaude|V:aplaudir con ganas|S.
El parque|S *público|A:parque está|V:estar *limpio|A:parque.
La *comida|S está|V:estar sabrosa|A:comida.
Mi tía|S *toma|V:tomar un zumo|S de naranja|S.
El *trabajo|S en equipo|S es|V:ser importante|A:trabajo.
Mi padre|S trabaja|V:trabajar en una fábrica|S.
El *paseo|S por la playa|S fue|V:ser relajante|A:paseo.
Los niños|S juegan|V:jugar en el recreo|S.
El *juego|S de mesa|S es|V:ser divertido|A:juego.
*Sueño|V:soñar con un viaje|S a la luna|S.
`;

const ARTICULOS = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'este', 'esta', 'ese', 'esa', 'del', 'al']);

function parsearFrase(linea) {
  const tokens = [];
  // Separa la puntuación final.
  const crudo = linea.trim();
  const partes = crudo.split(/\s+/);
  partes.forEach((t, i) => {
    let punt = '';
    const m = t.match(/^(.*?)([.,;!?]+)$/);
    if (m) { t = m[1]; punt = m[2]; }
    const [palabraRaw, etiqueta] = t.split('|');
    const camaleon = palabraRaw.startsWith('*');
    const texto = camaleon ? palabraRaw.slice(1) : palabraRaw;
    const tok = { t: texto, punt };
    if (etiqueta) {
      const [cat, extra] = etiqueta.split(':');
      tok.cat = cat;
      if (cat === 'A') tok.ref = extra || '';
      if (cat === 'V') tok.inf = extra || '';
      if (camaleon) tok.camaleon = true;
      const prev = i > 0 ? partes[i - 1].split('|')[0].replace(/^\*/, '').toLowerCase() : '';
      tok.antes = ARTICULOS.has(prev) ? prev : '';
    }
    tokens.push(tok);
  });
  return { tokens, camaleon: tokens.some((k) => k.camaleon) };
}

export const FRASES = FRASES_TXT.trim().split('\n').map(parsearFrase);

// ---------- EXPLICACIONES ----------
const ART = { m: 'el', f: 'la', mpl: 'los', fpl: 'las' };

// Devuelve { porque, truco } para una palabra suelta.
export function explicarSuelta(w) {
  if (w.cat === 'S') {
    if (w.pr) return { porque: `«${w.p}» es un nombre propio: nombra ${w.grupo === 'l' ? 'un lugar concreto' : 'a una persona concreta'} y se escribe con mayúscula.`, truco: 'Los nombres propios también son sustantivos.' };
    const art = w.el ? 'el' : ART[w.g + (w.pl ? 'pl' : '')];
    return { porque: `«${w.p}» nombra ${GRUPOS[w.grupo]}.`, truco: `Puedes decir «${art} ${w.p}». ¡Suena bien!` };
  }
  if (w.cat === 'A') {
    const ej = w.ej || 'un sustantivo';
    return { porque: `«${w.p}» dice cómo es algo: «${ej} ${w.p}».`, truco: `Necesita un sustantivo al lado y admite «muy»: «muy ${w.p}».` };
  }
  if (w.inf === w.p) {
    return { porque: `«${w.p}» es una acción: es un verbo en infinitivo (termina en -ar, -er, -ir).`, truco: `Puedes conjugarlo: «yo ${conjugarYo(w.p)}», «ayer…», «mañana…».` };
  }
  const quien = w.quien ? ` y nos dice quién lo hace: ${w.quien}` : '';
  return { porque: `«${w.p}» es una forma del verbo «${w.inf}»${quien}.`, truco: 'Los verbos cambian según el tiempo (ayer, hoy, mañana) y la persona.' };
}

// Explicación de una palabra dentro de una frase.
export function explicarEnFrase(frase, tok) {
  const p = tok.t.toLowerCase() === tok.t ? tok.t : tok.t;
  if (tok.cat === 'S') {
    const porque = tok.antes ? `Aquí «${p}» nombra algo: va detrás de «${tok.antes}».` : `Aquí «${p}» nombra a alguien o algo.`;
    return { porque, truco: tok.camaleon ? '¡Palabra camaleón! En otra frase podría ser verbo o adjetivo: mira lo que hace en ESTA frase.' : TRUCOS.S.prueba };
  }
  if (tok.cat === 'A') {
    const porque = tok.ref ? `Aquí «${p}» dice cómo es «${tok.ref}».` : `Aquí «${p}» dice cómo es algo.`;
    return { porque, truco: tok.camaleon ? '¡Palabra camaleón! Aquí acompaña a un sustantivo y dice cómo es.' : TRUCOS.A.prueba };
  }
  const porque = tok.inf && tok.inf.toLowerCase() !== p.toLowerCase() ? `Aquí «${p}» es una forma del verbo «${tok.inf}»: dice lo que pasa.` : `Aquí «${p}» dice lo que pasa: es un verbo.`;
  return { porque, truco: tok.camaleon ? '¡Palabra camaleón! Aquí es una acción: podrías decir «ayer…» y cambiarla.' : TRUCOS.V.prueba };
}

function conjugarYo(inf) {
  const irregulares = { dormir: 'duermo', jugar: 'juego', volar: 'vuelo', reír: 'río', pensar: 'pienso', soñar: 'sueño', cerrar: 'cierro', construir: 'construyo', regar: 'riego', leer: 'leo', maullar: 'maúllo' };
  if (irregulares[inf]) return irregulares[inf];
  return inf.slice(0, -2) + 'o';
}

// ---------- MUNDOS Y NIVELES ----------
// tipo: 'sueltas' | 'frases' | 'camaleon' | 'jefe'
// cats: clases que aparecen · niveles: dificultad de las palabras sueltas
// vel: velocidad de avance (m/s) · cada: segundos entre Palabrones · n: cuántos hay que vencer
export const MUNDOS = [
  {
    id: 0, nombre: 'Pradera Pétalo', lema: 'Donde empiezan las palabras', tema: 'pradera',
    jefe: { nombre: 'Rey Champiñón', color: '#7c3aed', estilo: 'gruñon' },
    niveles: [
      { nombre: 'Nombres y acciones', nuevo: 'Solo sustantivos y verbos. ¡Calienta la varita!', tipo: 'sueltas', cats: ['S', 'V'], niveles: [1], n: 14, vel: 1.45, cada: 3.5, maxVivos: 3 },
      { nombre: '¡Llegan los adjetivos!', nuevo: 'Aparece el hechizo verde: el adjetivo dice cómo es algo.', tipo: 'sueltas', cats: ['S', 'A'], niveles: [1], n: 14, vel: 1.55, cada: 3.3, maxVivos: 3 },
      { nombre: 'Los tres hechizos', nuevo: 'Sustantivos, adjetivos y verbos mezclados.', tipo: 'sueltas', cats: ['S', 'A', 'V'], niveles: [1], n: 16, vel: 1.65, cada: 3.1 },
      { nombre: 'Rey Champiñón', nuevo: 'El jefe lanza frases. Clasifica cada palabra marcada antes de que ataque.', tipo: 'jefe', frases: 2, tiempo: 9, filtro: 'simple' },
    ],
  },
  {
    id: 1, nombre: 'Bosque Brumoso', lema: 'Setas que brillan en la niebla', tema: 'bosque',
    jefe: { nombre: 'Bruja Borrona', color: '#65a30d', estilo: 'bruja' },
    niveles: [
      { nombre: 'Niebla mágica', nuevo: 'Más Palabrones y más rápidos. ¡Ojo con los veloces!', tipo: 'sueltas', cats: ['S', 'A', 'V'], niveles: [1], n: 18, vel: 1.9, cada: 2.8 },
      { nombre: 'Verbos disfrazados', nuevo: 'Los verbos se conjugan: «corremos», «saltaste», «comieron»… ¡siguen siendo verbos!', tipo: 'sueltas', cats: ['S', 'A', 'V'], niveles: [1], nivelesV: [2], n: 18, vel: 1.95, cada: 2.8 },
      { nombre: 'Setas saltarinas', nuevo: 'Todo mezclado. ¡Cuidado con los verbos conjugados!', tipo: 'sueltas', cats: ['S', 'A', 'V'], niveles: [1, 2], nivelesS: [1], nivelesA: [1], n: 20, vel: 2.05, cada: 2.6 },
      { nombre: 'Bruja Borrona', nuevo: 'La bruja borra palabras. ¡Clasifícalas antes de que se le acabe la paciencia!', tipo: 'jefe', frases: 3, tiempo: 8, filtro: 'simple' },
    ],
  },
  {
    id: 2, nombre: 'Dunas Doradas', lema: 'Palabras que no se ven', tema: 'desierto',
    jefe: { nombre: 'Cactoro Farfullón', color: '#16a34a', estilo: 'faraon' },
    niveles: [
      { nombre: 'Lo que no se toca', nuevo: 'Sustantivos que nombran sentimientos e ideas: «alegría», «amistad», «verdad».', tipo: 'sueltas', cats: ['S', 'A', 'V'], niveles: [1], nivelesS: [2], n: 20, vel: 2.2, cada: 2.5 },
      { nombre: 'Adjetivos cambiantes', nuevo: 'Adjetivos en femenino y plural: «altas», «divertida», «cansado»…', tipo: 'sueltas', cats: ['S', 'A', 'V'], niveles: [1], nivelesA: [2], n: 20, vel: 2.25, cada: 2.45 },
      { nombre: 'Tormenta de arena', nuevo: 'Las palabras más difíciles, todas juntas.', tipo: 'sueltas', cats: ['S', 'A', 'V'], niveles: [2], n: 24, vel: 2.4, cada: 2.3 },
      { nombre: 'Cactoro Farfullón', nuevo: 'Este cactus gigante farfulla frases sin parar. ¡Clasifica sus palabras!', tipo: 'jefe', frases: 4, tiempo: 7, filtro: 'simple' },
    ],
  },
  {
    id: 3, nombre: 'Picos Helados', lema: 'Cada palabra en su frase', tema: 'nieve',
    jefe: { nombre: 'Yeti Trabalenguas', color: '#eef6ff', estilo: 'yeti' },
    niveles: [
      { nombre: 'Palabras en su frase', nuevo: 'Ahora las palabras vienen dentro de una frase. Mira lo que hace la palabra marcada.', tipo: 'frases', soloSimples: true, n: 18, vel: 1.75, cada: 3.3 },
      { nombre: 'Ventisca', nuevo: 'Frases y palabras sueltas mezcladas.', tipo: 'mixto', n: 20, vel: 2.0, cada: 2.9 },
      { nombre: 'Cumbre nevada', nuevo: 'Todas las palabras de la frase cuentan.', tipo: 'frases', n: 22, vel: 2.1, cada: 2.8 },
      { nombre: 'Yeti Trabalenguas', nuevo: 'El yeti mezcla las palabras. ¡No te lías!', tipo: 'jefe', frases: 4, tiempo: 7, filtro: 'todas' },
    ],
  },
  {
    id: 4, nombre: 'Castillo del Caos', lema: 'Palabras camaleón', tema: 'castillo',
    jefe: { nombre: 'Dragón Revoltijo', color: '#ea580c', estilo: 'rey' },
    niveles: [
      { nombre: 'Palabras camaleón', nuevo: '«canto», «juego», «cocina»… cambian de clase según la frase. ¡Lee la frase entera!', tipo: 'camaleon', n: 18, vel: 1.9, cada: 3.2 },
      { nombre: 'Pasillos del caos', nuevo: 'Camaleones, frases y palabras sueltas difíciles.', tipo: 'mixto', camaleones: true, n: 24, vel: 2.4, cada: 2.5 },
      { nombre: 'La torre más alta', nuevo: 'El último desafío antes del rey.', tipo: 'mixto', camaleones: true, n: 28, vel: 2.6, cada: 2.25 },
      { nombre: 'Dragón Revoltijo', nuevo: 'El jefe final. Sus frases están llenas de camaleones.', tipo: 'jefe', frases: 5, tiempo: 6.5, filtro: 'camaleon' },
    ],
  },
];

export function claveNivel(m, n) { return `${m + 1}-${n + 1}`; }

// ---------- TIENDA ----------
export const TIENDA = {
  sombreros: [
    { id: 'mago', nombre: 'Sombrero de mago', precio: 0 },
    { id: 'gorra', nombre: 'Gorra deportiva', precio: 60 },
    { id: 'vikingo', nombre: 'Casco vikingo', precio: 120 },
    { id: 'corona', nombre: 'Corona real', precio: 200 },
    { id: 'flores', nombre: 'Corona de flores', precio: 90 },
    { id: 'chistera', nombre: 'Chistera', precio: 150 },
  ],
  colores: [
    { id: 'violeta', nombre: 'Aura violeta', hex: '#a78bfa', precio: 0 },
    { id: 'oceano', nombre: 'Aura océano', hex: '#38bdf8', precio: 40 },
    { id: 'fuego', nombre: 'Aura de fuego', hex: '#fb923c', precio: 40 },
    { id: 'bosque', nombre: 'Aura del bosque', hex: '#4ade80', precio: 40 },
    { id: 'rosa', nombre: 'Aura chicle', hex: '#f472b6', precio: 60 },
    { id: 'noche', nombre: 'Aura dorada', hex: '#facc15', precio: 80 },
  ],
  mascotas: [
    { id: 'ninguna', nombre: 'Sin mascota', precio: 0 },
    { id: 'buho', nombre: 'Búho Sabiondo', precio: 150 },
    { id: 'slime', nombre: 'Slime Gelatino', precio: 180 },
    { id: 'dragon', nombre: 'Dragoncito', precio: 260 },
    { id: 'estrella', nombre: 'Estrellita', precio: 220 },
    { id: 'pez', nombre: 'Pez Burbuja', precio: 200 },
  ],
};

export const AVATARES = ['🦊', '🐼', '🐸', '🐯', '🦁', '🐨', '🐵', '🦄', '🐙', '🐲', '🐧', '🐰', '🐻', '🐱', '🐶', '🦉'];
