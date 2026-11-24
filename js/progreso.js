// ¡Palabrones! · Progreso del alumnado: perfiles, XP, rangos, monedas, estrellas, dominio por
// clase de palabra, logros, misiones del día, racha de días, repaso de fallos e historial.
// Se guarda en el navegador (localStorage) con versión y copia de seguridad.

import { MUNDOS, claveNivel, TIENDA } from './datos.js?v=1.1.0';

const CLAVE = 'palabrones.partida';
const VERSION = 1;
const VENTANA = 40; // respuestas recientes que cuentan para el dominio de cada clase

export const RANGOS = [
  { nivel: 1, nombre: 'Aprendiz de palabras' },
  { nivel: 4, nombre: 'Explorador gramatical' },
  { nivel: 8, nombre: 'Hechicero de nombres' },
  { nivel: 12, nombre: 'Mago de las cualidades' },
  { nivel: 17, nombre: 'Archimago de la acción' },
  { nivel: 23, nombre: 'Sabio de las palabras' },
  { nivel: 30, nombre: 'Leyenda de Palabrópolis' },
];

export function xpParaSubir(nivel) { return 80 + nivel * 45; }
export function rango(nivel) { let r = RANGOS[0]; for (const x of RANGOS) if (nivel >= x.nivel) r = x; return r; }

export const LOGROS = [
  { id: 'primer', icono: '✨', nombre: 'Primer hechizo', desc: 'Vence a tu primer Palabrón.' },
  { id: 'combo10', icono: '🔥', nombre: 'Racha de 10', desc: 'Acierta 10 seguidas.' },
  { id: 'combo25', icono: '☄️', nombre: 'Imparable', desc: 'Acierta 25 seguidas.' },
  { id: 'p100', icono: '💯', nombre: '100 Palabrones', desc: 'Vence a 100 Palabrones.' },
  { id: 'p500', icono: '🏹', nombre: 'Cazapalabras', desc: 'Vence a 500 Palabrones.' },
  { id: 'perfecto', icono: '💎', nombre: 'Sin un rasguño', desc: 'Termina un nivel sin fallar.' },
  { id: 'rapido', icono: '⚡', nombre: 'Rayo veloz', desc: '10 aciertos en menos de 2 s en un nivel.' },
  { id: 'jefe0', icono: '🍄', nombre: 'Rey destronado', desc: 'Vence al Rey Champiñón.' },
  { id: 'jefe1', icono: '🧙', nombre: 'Borrona borrada', desc: 'Vence a la Bruja Borrona.' },
  { id: 'jefe2', icono: '🌵', nombre: 'Cactus callado', desc: 'Vence al Cactoro Farfullón.' },
  { id: 'jefe3', icono: '❄️', nombre: 'Yeti derretido', desc: 'Vence al Yeti Trabalenguas.' },
  { id: 'jefe4', icono: '🐉', nombre: 'Orden en el reino', desc: 'Vence al Dragón Revoltijo.' },
  { id: 'oroS', icono: '🔵', nombre: 'Oro en sustantivos', desc: 'Dominio de oro en sustantivos.' },
  { id: 'oroA', icono: '🟢', nombre: 'Oro en adjetivos', desc: 'Dominio de oro en adjetivos.' },
  { id: 'oroV', icono: '🔴', nombre: 'Oro en verbos', desc: 'Dominio de oro en verbos.' },
  { id: 'mundo3', icono: '🌟', nombre: 'Mundo perfecto', desc: 'Las 12 estrellas de un mundo.' },
  { id: 'dias3', icono: '📅', nombre: 'Constancia', desc: 'Juega 3 días seguidos.' },
  { id: 'dias7', icono: '🗓️', nombre: 'Semana mágica', desc: 'Juega 7 días seguidos.' },
  { id: 'repaso', icono: '📖', nombre: 'Aprendo de mis errores', desc: 'Supera 10 palabras del repaso.' },
  { id: 'desafio40', icono: '🛡️', nombre: 'Superviviente', desc: 'Vence a 40 en el Desafío.' },
  { id: 'coleccion', icono: '🎩', nombre: 'Coleccionista', desc: 'Compra 5 objetos en la tienda.' },
  { id: 'nivel10', icono: '🎓', nombre: 'Gran Hechicero', desc: 'Llega al nivel 10.' },
  { id: 'camaleon', icono: '🦎', nombre: 'Ojo de camaleón', desc: 'Acierta 15 palabras camaleón.' },
  { id: 'misiones', icono: '🎯', nombre: 'Cumplidor', desc: 'Completa 10 misiones del día.' },
];

const MISIONES = [
  { id: 'okS', texto: 'Acierta {n} sustantivos', n: 15, premio: 25 },
  { id: 'okA', texto: 'Acierta {n} adjetivos', n: 15, premio: 25 },
  { id: 'okV', texto: 'Acierta {n} verbos', n: 15, premio: 25 },
  { id: 'combo', texto: 'Consigue una racha de {n}', n: 8, premio: 30 },
  { id: 'niveles', texto: 'Supera {n} niveles', n: 2, premio: 30 },
  { id: 'tres', texto: 'Gana 3 estrellas en un nivel', n: 1, premio: 35 },
  { id: 'repaso', texto: 'Juega un entrenamiento', n: 1, premio: 20 },
  { id: 'total', texto: 'Vence a {n} Palabrones', n: 30, premio: 30 },
];

// ---------- guardado ----------
function hoy() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function diasEntre(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }

function vacio() {
  return { version: VERSION, perfiles: [], activo: null, ajustes: { musica: 0.7, efectos: 0.8, voz: true, calidad: 'auto', velocidad: 1 } };
}

function nuevoPerfil(nombre, avatar, invitado = false) {
  return {
    id: invitado ? 'invitado' : 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    invitado, nombre, avatar, creado: hoy(),
    xp: 0, nivel: 1, monedas: 0, monedasTotal: 0,
    estrellas: {}, desbloqueado: 1, jefes: {},
    stats: { S: { ok: 0, total: 0 }, A: { ok: 0, total: 0 }, V: { ok: 0, total: 0 } },
    ventana: { S: [], A: [], V: [] },
    fallos: {}, superadas: 0, camaleones: 0,
    logros: {}, aspecto: { color: 'violeta', sombrero: 'mago', mascota: 'ninguna' },
    comprado: ['violeta', 'mago', 'ninguna'],
    racha: { ultimo: null, dias: 0, mejor: 0 },
    misiones: { dia: null, lista: [] }, misionesHechas: 0,
    record: { desafio: 0 }, comboMax: 0,
    sesiones: [], tiempo: 0, vencidos: 0,
  };
}

// Migraciones v→v+1 (se guardan para siempre).
const MIGRACIONES = {};

function cargar() {
  for (const k of [CLAVE, CLAVE + '.copia']) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      let d = JSON.parse(raw);
      if (!d || typeof d !== 'object' || !Array.isArray(d.perfiles)) continue;
      let v = parseInt(d.version || 1, 10);
      if (v > VERSION) continue; // de una versión más nueva: no se toca
      while (v < VERSION) { d = MIGRACIONES[v](d); v++; d.version = v; }
      if (d.ajustes && d.ajustes.velocidad === undefined && d.ajustes.lento) d.ajustes.velocidad = 0.7;
      d.ajustes = Object.assign(vacio().ajustes, d.ajustes || {});
      d.perfiles = d.perfiles.map((p) => Object.assign(nuevoPerfil(p.nombre, p.avatar), p));
      return d;
    } catch (e) { /* prueba la copia */ }
  }
  return vacio();
}

export const P = { datos: cargar(), perfil: null };

export function guardar() {
  try {
    const actual = localStorage.getItem(CLAVE);
    if (actual) localStorage.setItem(CLAVE + '.copia', actual);
    const copia = Object.assign({}, P.datos, { perfiles: P.datos.perfiles.filter((p) => !p.invitado) });
    localStorage.setItem(CLAVE, JSON.stringify(copia));
    return true;
  } catch (e) { return false; }
}

export function ajustes() { return P.datos.ajustes; }

export function perfiles() { return P.datos.perfiles.filter((p) => !p.invitado); }

export function crearPerfil(nombre, avatar) {
  const p = nuevoPerfil(nombre.trim().slice(0, 16), avatar);
  P.datos.perfiles.push(p);
  usarPerfil(p.id);
  return p;
}

export function invitado() {
  P.perfil = nuevoPerfil('Invitado', '🎈', true);
  prepararDia();
  return P.perfil;
}

export function usarPerfil(id) {
  P.perfil = P.datos.perfiles.find((p) => p.id === id) || null;
  P.datos.activo = P.perfil ? P.perfil.id : null;
  if (P.perfil) prepararDia();
  guardar();
  return P.perfil;
}

export function borrarPerfil(id) {
  P.datos.perfiles = P.datos.perfiles.filter((p) => p.id !== id);
  if (P.datos.activo === id) { P.datos.activo = null; P.perfil = null; }
  guardar();
}

// ---------- día: racha y misiones ----------
function prepararDia() {
  const p = P.perfil, d = hoy();
  if (p.misiones.dia !== d) {
    // Tres misiones distintas, iguales todo el día para este perfil.
    let s = 0; for (const ch of d + p.id) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    const pool = MISIONES.slice(); const lista = [];
    while (lista.length < 3) { s = (s * 1103515245 + 12345) >>> 0; const m = pool.splice(s % pool.length, 1)[0]; lista.push({ id: m.id, texto: m.texto.replace('{n}', m.n), meta: m.n, prog: 0, premio: m.premio, hecha: false }); }
    p.misiones = { dia: d, lista };
  }
}

function marcarDiaJugado(eventos) {
  const p = P.perfil, d = hoy();
  if (p.racha.ultimo === d) return;
  const dif = p.racha.ultimo ? diasEntre(p.racha.ultimo, d) : 99;
  p.racha.dias = dif === 1 ? p.racha.dias + 1 : 1;
  p.racha.ultimo = d;
  p.racha.mejor = Math.max(p.racha.mejor, p.racha.dias);
  if (p.racha.dias >= 3) logro('dias3', eventos);
  if (p.racha.dias >= 7) logro('dias7', eventos);
}

function avanzarMision(id, cuanto, eventos, absoluto = false) {
  const p = P.perfil;
  for (const m of p.misiones.lista) {
    if (m.id !== id || m.hecha) continue;
    m.prog = absoluto ? Math.max(m.prog, cuanto) : m.prog + cuanto;
    if (m.prog >= m.meta) {
      m.prog = m.meta; m.hecha = true;
      p.monedas += m.premio; p.monedasTotal += m.premio; p.misionesHechas++;
      eventos.push({ tipo: 'mision', texto: m.texto, premio: m.premio });
      if (p.misionesHechas >= 10) logro('misiones', eventos);
    }
  }
}

// ---------- logros ----------
function logro(id, eventos) {
  const p = P.perfil;
  if (p.logros[id]) return;
  p.logros[id] = hoy();
  const l = LOGROS.find((x) => x.id === id);
  if (l) eventos.push({ tipo: 'logro', logro: l });
}

// ---------- dominio ----------
// Dominio = acierto en las últimas respuestas × confianza (llega a 1 con 20 respuestas).
export function dominio(cat, perfil = P.perfil) {
  const v = perfil.ventana[cat];
  if (!v.length) return { pct: 0, n: 0, medalla: null };
  const ok = v.reduce((a, b) => a + b, 0) / v.length;
  const pct = Math.round(ok * Math.min(1, v.length / 20) * 100);
  const medalla = v.length >= 20 && ok >= 0.9 ? 'oro' : v.length >= 15 && ok >= 0.75 ? 'plata' : v.length >= 10 && ok >= 0.5 ? 'bronce' : null;
  return { pct, n: v.length, medalla, acierto: Math.round(ok * 100) };
}

export function claseMasFloja() {
  const ds = ['S', 'A', 'V'].map((c) => ({ c, d: dominio(c).pct }));
  ds.sort((a, b) => a.d - b.d);
  return ds[0].c;
}

// ---------- respuestas ----------
// Registra una respuesta. Devuelve los eventos que hay que celebrar (logros, misiones…).
export function responder({ palabra, cat, ok, camaleon, combo, ref }) {
  const p = P.perfil, eventos = [];
  marcarDiaJugado(eventos);
  p.stats[cat].total++;
  if (ok) p.stats[cat].ok++;
  const v = p.ventana[cat]; v.push(ok ? 1 : 0); if (v.length > VENTANA) v.shift();
  const clave = ref ? `${palabra.toLowerCase()}@${ref.fi}:${ref.ti}` : palabra.toLowerCase();
  const f = p.fallos[clave];
  if (ok) {
    p.vencidos++;
    if (f) {
      f.bien = (f.bien || 0) + 1;
      if (f.bien >= 2) { delete p.fallos[clave]; p.superadas++; if (p.superadas >= 10) logro('repaso', eventos); eventos.push({ tipo: 'superada', palabra }); }
    }
    if (camaleon) { p.camaleones++; if (p.camaleones >= 15) logro('camaleon', eventos); }
    logro('primer', eventos);
    if (p.vencidos >= 100) logro('p100', eventos);
    if (p.vencidos >= 500) logro('p500', eventos);
    avanzarMision('ok' + cat, 1, eventos);
    avanzarMision('total', 1, eventos);
  } else {
    p.fallos[clave] = { palabra, cat, veces: (f ? f.veces : 0) + 1, bien: 0, ultima: hoy(), ref: ref || null };
  }
  if (combo) {
    p.comboMax = Math.max(p.comboMax, combo);
    if (combo >= 10) logro('combo10', eventos);
    if (combo >= 25) logro('combo25', eventos);
    avanzarMision('combo', combo, eventos, true);
  }
  for (const c of ['S', 'A', 'V']) if (dominio(c).medalla === 'oro') logro('oro' + c, eventos);
  return eventos;
}

export function sumarXP(xp, eventos) {
  const p = P.perfil;
  p.xp += xp;
  while (p.xp >= xpParaSubir(p.nivel)) {
    p.xp -= xpParaSubir(p.nivel); p.nivel++;
    const premio = 20 + p.nivel * 5;
    p.monedas += premio; p.monedasTotal += premio;
    const antes = rango(p.nivel - 1).nombre, ahora = rango(p.nivel).nombre;
    eventos.push({ tipo: 'nivel', nivel: p.nivel, premio, rango: antes !== ahora ? ahora : null });
    if (p.nivel >= 10) logro('nivel10', eventos);
  }
}

export function sumarMonedas(n) { P.perfil.monedas += n; P.perfil.monedasTotal += n; }

// Fin de un nivel de la campaña (o de un desafío/entrenamiento).
export function terminarPartida(r) {
  // r: { modo, mundo, nivel, ok, total, porCat, estrellas, superado, perfecto, rapidos, segundos, vencidos }
  const p = P.perfil, eventos = [];
  p.tiempo += r.segundos;
  p.sesiones.push({ f: hoy(), modo: r.modo, clave: r.modo === 'campana' ? claveNivel(r.mundo, r.nivel) : r.modo, ok: r.ok, total: r.total, porCat: r.porCat });
  if (p.sesiones.length > 60) p.sesiones.shift();
  let xp = r.ok * 10, monedas = r.ok;
  let mejora = false;
  if (r.modo === 'campana' && r.superado) {
    const k = claveNivel(r.mundo, r.nivel);
    const antes = p.estrellas[k] || 0;
    if (r.estrellas > antes) { p.estrellas[k] = r.estrellas; mejora = true; }
    xp += 40 + r.estrellas * 20;
    monedas += (r.estrellas - Math.min(antes, r.estrellas)) * 8 + 4;
    const indice = r.mundo * 4 + r.nivel + 1;
    if (indice + 1 > p.desbloqueado) p.desbloqueado = Math.min(indice + 1, MUNDOS.length * 4);
    if (r.nivel === 3) { if (!p.jefes[r.mundo]) monedas += 40; p.jefes[r.mundo] = true; logro('jefe' + r.mundo, eventos); }
    avanzarMision('niveles', 1, eventos);
    if (r.estrellas === 3) avanzarMision('tres', 1, eventos);
    if (r.perfecto) logro('perfecto', eventos);
    if (r.rapidos >= 10) logro('rapido', eventos);
    const m = MUNDOS[r.mundo];
    if (m.niveles.every((_, i) => (p.estrellas[claveNivel(r.mundo, i)] || 0) === 3)) logro('mundo3', eventos);
  }
  if (r.modo === 'desafio') {
    if (r.vencidos > p.record.desafio) { p.record.desafio = r.vencidos; mejora = true; }
    if (r.vencidos >= 40) logro('desafio40', eventos);
    xp += Math.floor(r.vencidos / 5) * 10;
  }
  if (r.modo === 'repaso') avanzarMision('repaso', 1, eventos);
  sumarMonedas(monedas);
  sumarXP(xp, eventos);
  guardar();
  return { xp, monedas, mejora, eventos };
}

// ---------- tienda ----------
export function comprar(tipo, id) {
  const p = P.perfil;
  const item = TIENDA[tipo].find((x) => x.id === id);
  if (!item || p.comprado.includes(id) || p.monedas < item.precio) return { ok: false };
  p.monedas -= item.precio; p.comprado.push(id);
  const eventos = [];
  if (p.comprado.length - 3 >= 5) logro('coleccion', eventos);
  equipar(tipo, id);
  return { ok: true, eventos };
}

export function equipar(tipo, id) {
  const p = P.perfil;
  const campo = { sombreros: 'sombrero', colores: 'color', mascotas: 'mascota' }[tipo];
  if (!p.comprado.includes(id)) return false;
  p.aspecto[campo] = id; guardar(); return true;
}

// ---------- repaso ----------
export function palabrasRepaso() { return Object.values(P.perfil.fallos).sort((a, b) => b.veces - a.veces); }

export function estrellasTotales(perfil = P.perfil) { return Object.values(perfil.estrellas).reduce((a, b) => a + b, 0); }

// Informe de texto para el docente.
export function informeTexto(perfil = P.perfil) {
  const l = [];
  l.push(`¡Palabrones! · Informe de ${perfil.nombre} (${new Date().toLocaleDateString('es-ES')})`);
  l.push(`Nivel ${perfil.nivel} · ${rango(perfil.nivel).nombre} · ${estrellasTotales(perfil)} estrellas · ${perfil.vencidos} Palabrones vencidos · ${Math.round(perfil.tiempo / 60)} min de juego`);
  for (const [c, n] of [['S', 'Sustantivos'], ['A', 'Adjetivos'], ['V', 'Verbos']]) {
    const s = perfil.stats[c], d = dominio(c, perfil);
    l.push(`${n}: ${s.ok}/${s.total} aciertos (${s.total ? Math.round((s.ok / s.total) * 100) : 0} %) · dominio reciente ${d.pct} %${d.medalla ? ' · medalla de ' + d.medalla : ''}`);
  }
  const dif = Object.values(perfil.fallos).sort((a, b) => b.veces - a.veces).slice(0, 12);
  if (dif.length) l.push('Palabras para repasar: ' + dif.map((f) => `${f.palabra} (${({ S: 'sustantivo', A: 'adjetivo', V: 'verbo' })[f.cat]})`).join(', '));
  l.push(`Racha: ${perfil.racha.dias} días (mejor ${perfil.racha.mejor}) · Logros: ${Object.keys(perfil.logros).length}/${LOGROS.length}`);
  return l.join('\n');
}
