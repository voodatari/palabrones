// ¡Palabrones! · Lógica de partida: niveles normales, jefes, desafío infinito y entrenamiento.
// El estado vive aquí (objetos planos); escena.js solo lo dibuja.

import * as E from './escena.js?v=1.1.16';
import { PALABRAS, FRASES, CATS, MUNDOS, explicarSuelta, explicarEnFrase } from './datos.js?v=1.1.16';
import * as Pr from './progreso.js?v=1.1.16';
import { sfx, musica, intensidad } from './audio.js?v=1.1.16';

const CARRILES = [-2.3, 0, 2.3];
const Z_SALIDA = -27, Z_LLEGADA = -2.2;
const DISTANCIA_DISENO = Z_LLEGADA - Z_SALIDA; // los tiempos de cada nivel se pensaron para esta distancia
const PASO = 1.0;  // velocidad de los monstruos respecto al camino (m/s)
const SEPARACION = 2.2; // metros mínimos entre un Palabrón y el que va delante (no se adelantan)
const CORAZONES = 3;

export const J = { activo: false, pausado: false };
let ui = null;
let sigId = 1;

function azar(a) { return a[Math.floor(Math.random() * a.length)]; }

// ---------- memoria entre partidas ----------
// Para no ver siempre lo mismo: se recuerdan las últimas palabras (por lema: «simpático», «simpática» y
// «simpáticos» cuentan como una) y las frases que han salido, y se prefiere lo que no se ha visto nunca o
// lleva más tiempo sin salir.
const CLAVE_VISTAS = 'palabrones.vistas', MAX_VISTAS = 2500;
let vistas = [];
try { const a = JSON.parse(localStorage.getItem(CLAVE_VISTAS) || '[]'); if (Array.isArray(a)) vistas = a; } catch (e) { /* sin memoria */ }
let guardarVistas = 0;
function recordar(k) {
  const i = vistas.indexOf(k);
  if (i >= 0) vistas.splice(i, 1);
  vistas.push(k);
  if (vistas.length > MAX_VISTAS) vistas.splice(0, vistas.length - MAX_VISTAS);
  clearTimeout(guardarVistas);
  guardarVistas = setTimeout(() => { try { localStorage.setItem(CLAVE_VISTAS, JSON.stringify(vistas)); } catch (e) { /* sin memoria */ } }, 1500);
}
// Elige al azar entre lo que nunca ha salido; si todo ha salido ya, entre lo que lleva más tiempo sin salir.
function elegirNuevo(items, claveDe) {
  if (!items.length) return null;
  const orden = new Map(); vistas.forEach((k, i) => orden.set(k, i));
  const nuevos = items.filter((x) => !orden.has(claveDe(x)));
  if (nuevos.length) return azar(nuevos);
  const ord = items.slice().sort((a, b) => orden.get(claveDe(a)) - orden.get(claveDe(b)));
  return azar(ord.slice(0, Math.max(1, Math.ceil(ord.length / 4))));
}
function mezclar(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------- creación de «elementos» (lo que lleva cada Palabrón) ----------
function itemSuelta(w) { return { clave: 's:' + w.p, texto: w.p, cat: w.cat, w }; }
function itemFrase(fi, ti) {
  const f = FRASES[fi], tok = f.tokens[ti];
  return { clave: `f:${fi}:${ti}`, texto: tok.t, cat: tok.cat, fi, ti, camaleon: !!tok.camaleon };
}

function nivelesDe(st, cat) { return st['niveles' + cat] || st.niveles || [1, 2]; }

function elegirCat(cats) {
  // Más peso a la clase que el alumno domina menos, sin repetir 3 veces seguidas.
  const floja = Pr.claseMasFloja();
  const pesos = cats.map((c) => (c === floja ? 1.6 : 1) * (J.ultimas.slice(-2).every((x) => x === c) ? 0.15 : 1));
  let r = Math.random() * pesos.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cats.length; i++) { r -= pesos[i]; if (r <= 0) return cats[i]; }
  return cats[cats.length - 1];
}

function nuevaSuelta(st, cats = st.cats || ['S', 'A', 'V']) {
  const cat = elegirCat(cats);
  const nv = nivelesDe(st, cat);
  const todas = PALABRAS.filter((w) => w.cat === cat && nv.includes(w.nivel));
  // Nunca dos veces la misma palabra en una partida (ni la misma familia: «salta», «saltamos»…).
  let lista = todas.filter((w) => !J.lemas.has(w.lema) && !J.usadas.has('s:' + w.p));
  if (!lista.length) lista = todas.filter((w) => !J.usadas.has('s:' + w.p));
  if (!lista.length) lista = todas;
  return itemSuelta(elegirNuevo(lista, (w) => w.lema));
}

function nuevaFrase(soloSimples, soloCamaleon) {
  let idx = FRASES.map((f, i) => i).filter((i) => (soloSimples ? !FRASES[i].camaleon : true) && (soloCamaleon ? FRASES[i].camaleon : true));
  const libres = idx.filter((i) => !J.frasesUsadas.has(i));
  if (libres.length) idx = libres;
  const fi = elegirNuevo(idx, (i) => 'f' + i); J.frasesUsadas.add(fi); recordar('f' + fi);
  const f = FRASES[fi];
  let opciones = f.tokens.map((t, i) => i).filter((i) => f.tokens[i].cat);
  if (soloCamaleon) opciones = opciones.filter((i) => f.tokens[i].camaleon);
  const cat = elegirCat([...new Set(opciones.map((i) => f.tokens[i].cat))]);
  const ti = azar(opciones.filter((i) => f.tokens[i].cat === cat));
  return itemFrase(fi, ti);
}

// Palabras falladas que vuelven (aprender de los errores).
function itemDeRepaso(cats, soloFrases) {
  const lista = Pr.palabrasRepaso().filter((f) => cats.includes(f.cat) && (!soloFrases || f.ref) && !J.usadas.has(f.ref ? `f:${f.ref.fi}:${f.ref.ti}` : 's:' + f.palabra));
  if (!lista.length) return null;
  const f = azar(lista.slice(0, 6));
  if (f.ref && FRASES[f.ref.fi]) return itemFrase(f.ref.fi, f.ref.ti);
  const w = PALABRAS.find((x) => x.p === f.palabra);
  return w ? itemSuelta(w) : null;
}

function siguienteItem() {
  if (J.cola.length) return J.cola.shift();
  const st = J.st;
  let it = null;
  // Las falladas vuelven (aprender de los errores), pero como mucho dos por partida: si no, siempre salen las mismas.
  if (J.modo !== 'repaso' && J.repasos < 2 && Math.random() < 0.15) { it = itemDeRepaso(st.cats || ['S', 'A', 'V'], st.tipo === 'frases' || st.tipo === 'camaleon'); if (it) J.repasos++; }
  if (!it) {
    if (st.tipo === 'sueltas') it = nuevaSuelta(st);
    else if (st.tipo === 'frases') it = nuevaFrase(!!st.soloSimples, false);
    else if (st.tipo === 'camaleon') it = nuevaFrase(false, true);
    else if (st.tipo === 'mixto') it = Math.random() < 0.5 ? nuevaSuelta({ niveles: [1, 2] }) : nuevaFrase(!st.camaleones, st.camaleones && Math.random() < 0.5);
  }
  J.usadas.add(it.clave);
  if (it.w) { J.lemas.add(it.w.lema); recordar(it.w.lema); }
  J.ultimas.push(it.cat);
  return it;
}

// ---------- empezar ----------
export function empezar(cfg, interfaz) {
  ui = interfaz;
  const aj = Pr.ajustes();
  const lento = aj.velocidad || 1; // velocidad general elegida en Opciones (0,6 a 1,6)
  let st;
  if (cfg.modo === 'campana') st = Object.assign({}, MUNDOS[cfg.mundo].niveles[cfg.nivel]);
  else if (cfg.modo === 'desafio') st = { tipo: 'sueltas', cats: ['S', 'A', 'V'], niveles: [1], n: Infinity, vel: 1.6, cada: 3.2 };
  else st = { tipo: 'sueltas', cats: ['S', 'A', 'V'], niveles: [1, 2], n: 14, vel: 1.25, cada: 3.8 };
  Object.assign(J, {
    activo: true, pausado: false, terminado: false, modo: cfg.modo, mundo: cfg.mundo ?? 0, nivel: cfg.nivel ?? 0, st, lento,
    monstruos: [], cola: [], usadas: new Set(), lemas: new Set(), repasos: 0, frasesUsadas: new Set(), ultimas: [],
    vidas: CORAZONES, combo: 0, mejorCombo: 0, puntos: 0, vencidos: 0, aciertos: 0, fallos: 0, rapidos: 0,
    porCat: { S: { ok: 0, total: 0 }, A: { ok: 0, total: 0 }, V: { ok: 0, total: 0 } },
    superCarga: 0, congeladoHasta: 0, reloj: 0, segundos: 0, siguienteSalida: 1.2, carril: 1, cuenta: 3.2,
    objetivoId: null, objetivoDesde: 0, jefe: null, monedasNivel: 0,
    oleada: 1, perdidas: 0, frenesiHasta: 0, latido: 0, peligro: 0,
  });
  E.quitarTodos(); E.quitarJefe();
  const mundo = MUNDOS[J.mundo];
  E.tema(cfg.modo === 'campana' ? mundo.tema : cfg.modo === 'desafio' ? 'castillo' : 'pradera');
  if (cfg.modo === 'repaso') {
    // Entrenamiento: primero las palabras falladas, luego la clase que peor va.
    const deck = Pr.palabrasRepaso().slice(0, 10);
    for (const f of deck) {
      if (f.ref && FRASES[f.ref.fi]) J.cola.push(itemFrase(f.ref.fi, f.ref.ti));
      else { const w = PALABRAS.find((x) => x.p === f.palabra); if (w) J.cola.push(itemSuelta(w)); }
    }
    mezclar(J.cola);
    const floja = Pr.claseMasFloja();
    while (J.cola.length < 12) { const it = nuevaSuelta(st, Math.random() < 0.6 ? [floja] : ['S', 'A', 'V']); if (!J.cola.some((x) => x.clave === it.clave)) J.cola.push(it); }
    J.vidas = Infinity;
  }
  const esJefe = st.tipo === 'jefe';
  E.vista(esJefe ? 'jefe' : 'juego');
  musica(esJefe ? 'jefe' : cfg.modo === 'campana' ? mundo.tema : cfg.modo === 'desafio' ? 'castillo' : 'pradera');
  intensidad(0);
  if (esJefe) prepararJefe(mundo);
  ui.botones(esJefe ? ['S', 'A', 'V'] : st.cats || ['S', 'A', 'V']);
  ui.hud(estadoHud());
  ui.objetivo(null);
  E.default.alActualizar = actualizar;
}

function prepararJefe(mundo) {
  const st = J.st;
  const filtro = (f) => (st.filtro === 'simple' ? !f.camaleon : st.filtro === 'camaleon' ? f.camaleon : true);
  // Frases con al menos 3 palabras etiquetadas, para que el jefe tenga «armadura».
  const idx = mezclar(FRASES.map((f, i) => i).filter((i) => filtro(FRASES[i]) && FRASES[i].tokens.filter((t) => t.cat).length >= 3)).slice(0, st.frases);
  const objetivos = [];
  for (const fi of idx) FRASES[fi].tokens.forEach((t, ti) => { if (t.cat) objetivos.push({ fi, ti }); });
  J.jefe = { nombre: mundo.jefe.nombre, color: mundo.jefe.color, objetivos, vida: objetivos.length, max: objetivos.length, actual: null, tiempo: st.tiempo / J.lento, resto: 0, hechos: new Set(), presentado: false };
}

// ---------- estado para el HUD ----------
function multiplicador() { return J.combo >= 20 ? 4 : J.combo >= 10 ? 3 : J.combo >= 5 ? 2 : 1; }
function estadoHud() {
  return {
    vidas: J.vidas, max: CORAZONES, puntos: J.puntos, combo: J.combo, mult: multiplicador(), superCarga: J.superCarga,
    congelado: J.reloj < J.congeladoHasta, vencidos: J.vencidos, n: J.jefe ? null : J.st.n, modo: J.modo, oleada: J.oleada,
    jefe: J.jefe ? { nombre: J.jefe.nombre, vida: J.jefe.vida, max: J.jefe.max, resto: J.jefe.resto, tiempo: J.jefe.tiempo } : null,
  };
}

// ---------- bucle ----------
function actualizar(dt, real) {
  E.default.avance = 0;
  if (!J.activo || J.pausado || J.terminado) return;
  J.reloj += dt; J.segundos += real;
  if (J.cuenta > 0) {
    const antes = Math.ceil(J.cuenta);
    J.cuenta -= real;
    const ahora = Math.ceil(J.cuenta);
    if (ahora !== antes || J.cuentaMostrada === undefined) { J.cuentaMostrada = ahora; ui.cuenta(ahora > 0 ? ahora : '¡Ya!'); sfx.cuenta(ahora); }
    if (J.cuenta <= 0) { J.cuentaMostrada = undefined; if (J.jefe) presentarJefe(); }
    return;
  }
  if (J.jefe) return actualizarJefe(dt);
  const congelado = J.reloj < J.congeladoHasta;
  if (!congelado && J.congelAvisado) { J.congelAvisado = false; E.congelar(false); ui.hud(estadoHud()); }
  if (J.frenesiHasta && J.reloj > J.frenesiHasta) acabarFrenesi();
  // Oleadas: cada una más rápida y con más Palabrones especiales.
  const oleada = calcularOleada();
  if (oleada !== J.oleada) {
    J.oleada = oleada;
    J.siguienteSalida = Math.max(J.siguienteSalida, 2.2);
    sfx.oleada();
    ui.aviso(J.modo === 'desafio' ? `¡Oleada ${oleada}!` : oleada === 3 ? '¡Última oleada!' : `¡Oleada ${oleada}!`, 'racha');
    ui.hud(estadoHud());
  }
  const extra = 1 + (J.oleada - 1) * (J.modo === 'desafio' ? 0.08 : 0.13);
  // Salida de Palabrones.
  if (!congelado) J.siguienteSalida -= dt;
  const vivos = J.monstruos.filter((m) => m.vivo).length;
  const faltan = J.st.n - J.vencidos - vivos;
  const maxVivos = J.st.maxVivos || (J.mundo >= 2 || J.modo === 'desafio' ? 5 : 4);
  if (J.siguienteSalida <= 0 && faltan > 0 && vivos < maxVivos) {
    salir();
    const ritmo = J.st.cada / extra;
    J.siguienteSalida = Math.max(1.1, ritmo / J.lento) * (vivos === 0 ? 0.45 : 1) * (0.85 + Math.random() * 0.3);
  }
  // Movimiento: el camino corre hacia Lumi (suelo) y cada Palabrón anda sobre él a su paso.
  const suelo = sueloAhora();
  E.default.avance = congelado ? 0 : suelo;
  let peligro = 0;
  // Nadie adelanta a nadie: el orden de llegada no cambia, así que la palabra a acertar nunca cambia de golpe porque un
  // Palabrón veloz pase a otro. Se mueven de más cerca a más lejos de Lumi; el de detrás nunca pasa de (el de delante - SEPARACION)
  // y, mientras lo alcanza, avanza a su mismo paso.
  let delante = null;
  for (const m of J.monstruos.filter((x) => x.vivo).sort((a, b) => b.z - a.z)) {
    // Al entrar en la zona de peligro cargan corriendo.
    let paso = m.paso * (m.z > -9 ? 1.7 : 1);
    if (!congelado) {
      const sigue = m.z + (suelo + paso) * dt;
      const tope = delante ? delante.z - SEPARACION : Infinity;
      if (sigue > tope) { m.z = Math.max(m.z, tope); paso = Math.min(paso, delante.pasoVisto ?? paso); } else m.z = sigue;
    }
    m.pasoVisto = paso; delante = m;
    E.moverMonstruo(m.id, m.x, m.z, congelado ? 0 : paso);
    // Zona de peligro: a menos de 9 m de Lumi abren la boca, rugen y la pantalla se tiñe de rojo.
    const pel = Math.max(0, Math.min(1, (m.z + 11) / (Z_LLEGADA + 11)));
    E.peligroMonstruo(m.id, pel);
    if (!m.pendiente) peligro = Math.max(peligro, pel);
    if (pel > 0.35 && !m.rugio) { m.rugio = true; sfx.grunido(); }
    if (m.z >= Z_LLEGADA && !m.pendiente) { llega(m); return; }
  }
  if (Math.abs(peligro - J.peligro) > 0.02) { J.peligro = peligro; ui.peligro(peligro); }
  J.latido -= real;
  if (peligro > 0.45 && J.latido <= 0 && !congelado) { sfx.latido(); J.latido = 0.85 - peligro * 0.35; }
  elegirObjetivo();
}

function sueloAhora() {
  const base = J.modo === 'desafio' ? 3.0 : J.modo === 'repaso' ? 2.0 : 2.2 + Math.min(J.mundo, 4) * 0.3;
  return base * J.lento;
}

function calcularOleada() {
  if (J.modo === 'desafio') return 1 + Math.floor(J.vencidos / 10);
  if (J.modo !== 'campana') return 1;
  const n = J.st.n;
  return J.vencidos >= Math.ceil(n * 0.66) ? 3 : J.vencidos >= Math.ceil(n * 0.33) ? 2 : 1;
}

function elegirVariante() {
  if (J.modo === 'repaso') return 'normal';
  const ola = J.oleada - 1, mundo = J.modo === 'desafio' ? 2 : J.mundo;
  const pVeloz = Math.min(0.4, ola * 0.12 + mundo * 0.04);
  const pGigante = Math.min(0.25, 0.05 + ola * 0.05 + mundo * 0.02);
  const r = Math.random();
  return r < pVeloz ? 'veloz' : r < pVeloz + pGigante ? 'gigante' : 'normal';
}

function empezarFrenesi() {
  J.frenesiHasta = J.reloj + 8;
  E.frenesi(true); intensidad(2); sfx.frenesi();
  ui.frenesi(true); ui.aviso('¡FRENESÍ! Puntos x2', 'frenesi');
}
function acabarFrenesi() {
  if (!J.frenesiHasta) return;
  J.frenesiHasta = 0;
  E.frenesi(false); ui.frenesi(false);
  intensidad(J.combo >= 5 ? 1 : 0);
}

function salir() {
  const it = siguienteItem();
  let carril = Math.floor(Math.random() * 3);
  if (carril === J.carril) carril = (carril + 1 + Math.floor(Math.random() * 2)) % 3;
  J.carril = carril;
  const variante = elegirVariante();
  const mult = variante === 'veloz' ? 1.5 : variante === 'gigante' ? 0.72 : 1;
  const paso = PASO * J.lento * (variante === 'veloz' ? 2.1 : variante === 'gigante' ? 0.55 : 1);
  // Sale tan lejos como haga falta para que tarde en llegar lo mismo que se diseñó para el nivel.
  const extra = 1 + (J.oleada - 1) * (J.modo === 'desafio' ? 0.08 : 0.13);
  const tiempo = DISTANCIA_DISENO / (J.st.vel * extra * J.lento * mult);
  const distancia = Math.min(46, Math.max(18, (sueloAhora() + paso) * tiempo));
  const m = { id: sigId++, it, x: CARRILES[carril], z: Z_LLEGADA - distancia, vivo: true, pendiente: false, variante, mult, paso, rugio: false };
  J.monstruos.push(m);
  E.nuevoMonstruo(m.id, it.texto, m.x, m.z, m.id * 7 + J.mundo * 101, variante);
}

function elegirObjetivo() {
  let mejor = null;
  for (const m of J.monstruos) if (m.vivo && !m.pendiente && (!mejor || m.z > mejor.z)) mejor = m;
  const id = mejor ? mejor.id : null;
  if (id !== J.objetivoId) {
    J.objetivoId = id; J.objetivoDesde = J.reloj;
    E.objetivo(id);
    ui.objetivo(mejor ? descripcion(mejor.it) : null);
  }
}

function descripcion(it) {
  if (it.fi === undefined) return { texto: it.texto };
  return { texto: it.texto, frase: FRASES[it.fi].tokens, indice: it.ti };
}

// ---------- lanzar un hechizo ----------
export function lanzar(cat) {
  if (!J.activo || J.pausado || J.terminado || J.cuenta > 0) return;
  if (J.jefe) return lanzarJefe(cat);
  const m = J.monstruos.find((x) => x.id === J.objetivoId);
  if (!m) { ui.sinObjetivo(); return; }
  m.pendiente = true;
  const rapido = J.reloj - J.objetivoDesde < 2;
  sfx.disparo(cat);
  E.colorVarita(CATS[cat].color);
  E.disparo(CATS[cat].color, m.id, () => resolver(m, cat, rapido));
  elegirObjetivo();
}

function registrar(it, ok) {
  J.porCat[it.cat].total++;
  if (ok) J.porCat[it.cat].ok++;
  const ev = Pr.responder({ palabra: it.texto, cat: it.cat, ok, camaleon: it.camaleon, combo: J.combo, ref: it.fi !== undefined ? { fi: it.fi, ti: it.ti } : null });
  if (ev.length) ui.eventos(ev);
}

function resolver(m, cat, rapido) {
  if (J.terminado) return;
  const ok = cat === m.it.cat;
  if (ok) {
    m.vivo = false;
    J.combo++; J.mejorCombo = Math.max(J.mejorCombo, J.combo); J.aciertos++; J.vencidos++;
    if (rapido) J.rapidos++;
    const base = m.variante === 'gigante' ? 200 : m.variante === 'veloz' ? 150 : 100;
    const ganados = base * multiplicador() * (J.reloj < J.congeladoHasta ? 2 : 1) * (J.frenesiHasta ? 2 : 1) + (rapido ? 50 : 0);
    J.puntos += ganados;
    const pos = E.posPantalla(m.id, 0.6);
    E.matarMonstruo(m.id, CATS[cat].color);
    E.pausaGolpe(0.05); E.temblor(0.18);
    sfx.acierto(J.combo); setTimeout(() => sfx.moneda(), 160);
    if (pos) ui.popup(pos.x, pos.y, `+${ganados}`, cat, rapido ? '¡Rápido!' : null);
    if (J.reloj >= J.congeladoHasta) J.superCarga = Math.min(1, J.superCarga + 1 / 8);
    if (J.combo > 0 && J.combo % 15 === 0 && J.vidas < CORAZONES) { J.vidas++; sfx.corazon(); setTimeout(() => ui.aviso('+1 ❤', 'vida'), 900); }
    if (J.combo > 0 && J.combo % 10 === 0) empezarFrenesi();
    else if (J.combo === 5 || J.combo === 20) ui.aviso(`¡Racha x${multiplicador()}!`, 'racha');
    if (!J.frenesiHasta) intensidad(J.combo >= 5 ? 1 : 0);
    registrar(m.it, true);
    ui.hud(estadoHud());
    if (J.vencidos >= J.st.n) ganar();
  } else {
    fallar(m, cat, false);
  }
}

// Fallo o Palabrón que llega: explicación (con pausa), el Palabrón volverá más tarde.
function fallar(m, cat, llego) {
  m.vivo = false;
  J.fallos++; J.combo = 0; J.perdidas++;
  acabarFrenesi(); intensidad(0);
  J.peligro = 0; ui.peligro(0);
  if (llego) E.alcanza(m.id); else { E.burla(m.id); sfx.burla(); setTimeout(() => E.alcanza(m.id), 350); }
  sfx.fallo();
  E.heroeHerido();
  if (J.vidas !== Infinity) J.vidas--;
  registrar(m.it, false);
  J.cola.splice(Math.min(J.cola.length, 2 + Math.floor(Math.random() * 2)), 0, m.it); // vuelve pronto
  ui.hud(estadoHud());
  explicar(m.it, llego ? null : cat, () => { if (J.vidas <= 0) perder(); });
}

function llega(m) { fallar(m, null, true); }

function explicar(it, elegida, despues) {
  J.pausado = true;
  const ex = it.fi !== undefined ? explicarEnFrase(FRASES[it.fi], FRASES[it.fi].tokens[it.ti]) : explicarSuelta(it.w);
  ui.explicar({ palabra: it.texto, correcta: it.cat, elegida, porque: ex.porque, truco: ex.truco, frase: it.fi !== undefined ? FRASES[it.fi].tokens : null, indice: it.ti, camaleon: it.camaleon }, () => {
    J.pausado = false;
    if (despues) despues();
  });
}

// ---------- súper: congelar ----------
export function congelar() {
  if (!J.activo || J.pausado || J.terminado || J.jefe || J.cuenta > 0 || J.superCarga < 1) return;
  J.superCarga = 0;
  J.congeladoHasta = J.reloj + 7;
  J.congelAvisado = true;
  E.congelar(true); sfx.congelar();
  ui.aviso('¡CONGELADOS! Puntos x2', 'hielo');
  ui.hud(estadoHud());
}

// ---------- jefe ----------
function presentarJefe() {
  const j = J.jefe;
  E.crearJefe(j.color, J.mundo * 13 + 5, MUNDOS[J.mundo].jefe.estilo);
  sfx.rugido();
  ui.aviso(j.nombre, 'jefe');
  setTimeout(() => siguienteObjetivoJefe(), 1300);
}

function siguienteObjetivoJefe() {
  const j = J.jefe;
  if (!j || J.terminado) return;
  if (!j.objetivos.length) return;
  j.actual = j.objetivos.shift();
  if (j.preguntas) E.siguienteVistaJefe(); // en ordenador, cada pregunta del jefe se ve desde otra cámara
  j.preguntas = (j.preguntas || 0) + 1;
  j.resto = j.tiempo;
  const f = FRASES[j.actual.fi], tok = f.tokens[j.actual.ti];
  E.cartelJefe(tok.t);
  ui.objetivo({ texto: tok.t, frase: f.tokens, indice: j.actual.ti, hechos: [...j.hechos].filter((k) => k.startsWith(j.actual.fi + ':')).map((k) => +k.split(':')[1]) });
  J.objetivoDesde = J.reloj;
  ui.hud(estadoHud());
}

function actualizarJefe(dt) {
  const j = J.jefe;
  if (!j.actual || j.esperando) return;
  j.resto -= dt;
  if (Math.floor(j.resto * 4) !== j.ultimoTic) { j.ultimoTic = Math.floor(j.resto * 4); ui.hud(estadoHud()); }
  if (j.resto <= 0) {
    j.esperando = true;
    sfx.ataqueJefe();
    E.ataqueJefe(() => { j.esperando = false; fallarJefe(null); });
  }
}

function lanzarJefe(cat) {
  const j = J.jefe;
  if (!j.actual || j.esperando) return;
  j.esperando = true;
  const rapido = J.reloj - J.objetivoDesde < 2;
  sfx.disparo(cat);
  E.colorVarita(CATS[cat].color);
  E.disparo(CATS[cat].color, 'jefe', () => {
    j.esperando = false;
    const tok = FRASES[j.actual.fi].tokens[j.actual.ti];
    const it = itemFrase(j.actual.fi, j.actual.ti);
    if (cat === tok.cat) {
      J.combo++; J.mejorCombo = Math.max(J.mejorCombo, J.combo); J.aciertos++; J.vencidos++;
      if (rapido) J.rapidos++;
      const ganados = 150 * multiplicador() + (rapido ? 50 : 0);
      J.puntos += ganados;
      j.vida--; j.hechos.add(j.actual.fi + ':' + j.actual.ti);
      E.golpeJefe(CATS[cat].color);
      sfx.acierto(J.combo); sfx.golpe();
      const pos = E.posPantalla('jefe', 0.55);
      if (pos) ui.popup(pos.x, pos.y, `+${ganados}`, cat, rapido ? '¡Rápido!' : null);
      if (J.combo > 0 && J.combo % 8 === 0 && J.vidas < CORAZONES) { J.vidas++; sfx.corazon(); ui.aviso('+1 ❤', 'vida'); }
      intensidad(J.combo >= 5 ? 1 : 0);
      registrar(it, true);
      ui.hud(estadoHud());
      if (j.vida <= 0) { j.actual = null; E.vencerJefe(); sfx.rugido(); setTimeout(() => ganar(), 1400); return; }
      j.actual = null;
      setTimeout(siguienteObjetivoJefe, 450);
    } else {
      sfx.burla();
      j.esperando = true;
      setTimeout(() => { sfx.ataqueJefe(); E.ataqueJefe(() => { j.esperando = false; fallarJefe(cat); }); }, 250);
    }
  });
}

function fallarJefe(elegida) {
  const j = J.jefe;
  const it = itemFrase(j.actual.fi, j.actual.ti);
  J.fallos++; J.combo = 0; J.perdidas++; intensidad(0);
  sfx.fallo(); E.heroeHerido();
  J.vidas--;
  registrar(it, false);
  j.objetivos.push(j.actual); // vuelve al final
  j.actual = null;
  ui.hud(estadoHud());
  explicar(it, elegida, () => { if (J.vidas <= 0) perder(); else siguienteObjetivoJefe(); });
}

// ---------- final ----------
function ganar() {
  if (J.terminado) return;
  J.terminado = true;
  acabarFrenesi(); ui.peligro(0);
  intensidad(0);
  E.objetivo(null);
  ui.objetivo(null);
  E.celebrar(); sfx.victoria();
  setTimeout(() => terminar(true), 2100);
}

function perder() {
  if (J.terminado) return;
  J.terminado = true;
  acabarFrenesi(); ui.peligro(0);
  E.objetivo(null); ui.objetivo(null);
  E.entristecer(); sfx.derrota();
  setTimeout(() => terminar(J.modo !== 'campana'), 1800);
}

function terminar(superado) {
  const total = J.aciertos + J.fallos;
  const acierto = total ? J.aciertos / total : 0;
  // 3 estrellas: 90 % de acierto y como mucho un corazón perdido. 2: 75 %. 1: superarlo.
  const estrellas = !superado || J.modo !== 'campana' ? 0 : acierto >= 0.9 && J.perdidas <= 1 ? 3 : acierto >= 0.75 ? 2 : 1;
  const r = {
    modo: J.modo, mundo: J.mundo, nivel: J.nivel, ok: J.aciertos, total, porCat: J.porCat, estrellas, superado: superado && J.modo === 'campana' ? true : superado,
    perfecto: J.fallos === 0 && superado, rapidos: J.rapidos, segundos: Math.round(J.segundos), vencidos: J.vencidos, puntos: J.puntos, mejorCombo: J.mejorCombo,
  };
  if (J.modo !== 'campana') r.superado = true;
  if (J.modo === 'campana' && !superado) r.superado = false;
  const res = Pr.terminarPartida(r);
  E.quitarTodos();
  J.activo = false;
  ui.fin(Object.assign(r, res));
}

export function pausar(si) {
  if (!J.activo || J.terminado) return;
  J.pausado = si;
}

export function abandonar() {
  if (J.activo) { acabarFrenesi(); ui.peligro(0); }
  J.activo = false; J.terminado = true;
  E.quitarTodos(); E.quitarJefe(); E.objetivo(null);
  intensidad(0);
}
