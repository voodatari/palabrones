// ¡Palabrones! · Etiquetas de las palabras sobre los monstruos.
// Son elementos HTML (no sprites 3D): tienen siempre el mismo tamaño en pantalla, se leen nítidos y se
// colocan una vez por fotograma, DESPUÉS de dibujar la escena, con la cámara de ese mismo fotograma.
// Reglas de colocación:
//  1. La etiqueta se apoya justo encima de la cabeza del monstruo y nunca la tapa (solo puede subir).
//  2. El objetivo (el más cercano a Lumi) manda: su etiqueta es la mayor, va delante y señala al monstruo.
//  3. Las demás se apartan hacia arriba para no pisarse; si no caben o se alejarían demasiado, se ocultan.
//  4. Nada se pone sobre el panel de la pregunta (se respeta su borde inferior).
//  5. Los monstruos lejanos no llevan etiqueta hasta que están a una distancia en la que se pueda leer.
import * as THREE from './lib/three.module.js?v=1.1.25';
import E from './escena.js?v=1.1.25';

const Z_VISIBLE = -33;       // a partir de aquí (más cerca de Lumi) los no-objetivo ya enseñan su palabra
const HUECO = 6;             // píxeles entre la cabeza y la etiqueta
const HUECO_OBJETIVO = 14;   // más hueco en el objetivo: ahí va el piquito que señala al monstruo
const SEP = 4;               // separación mínima entre etiquetas
const SUBIDA_MAX = 3;        // alturas de etiqueta que puede subir una etiqueta apartada antes de ocultarse

const cont = document.getElementById('etiquetas');
const mapa = new Map();      // id del monstruo → { el, w, h, x, y, obj, listo, re }
const v = new THREE.Vector3();
let limiteSup = 0, tLimite = 0;

function crear(m) {
  const el = document.createElement('div');
  el.className = 'etq' + (m.variante && m.variante !== 'normal' ? ' ' + m.variante : '');
  el.textContent = m.texto;
  el.style.opacity = '0';
  cont.appendChild(el);
  const o = { el, w: 0, h: 0, x: 0, y: 0, obj: null, listo: false, re: 3 };
  mapa.set(m.id, o);
  return o;
}
function medir(o) { const r = o.el.getBoundingClientRect(); o.w = r.width; o.h = r.height; }

export function dibujar(real) {
  if (!cont || (!E.monstruos.size && !mapa.size)) return;
  const W = innerWidth, H = innerHeight, ahora = performance.now();
  if (ahora - tLimite > 200) {
    tLimite = ahora;
    const panel = document.getElementById('hud-centro');
    limiteSup = panel ? panel.getBoundingClientRect().bottom + 8 : 0;
  }
  // 1) Candidatos: monstruos vivos con su punto de cabeza en pantalla.
  const cand = [];
  for (const m of E.monstruos.values()) {
    if (m.estado !== 'vivo') continue;
    const esObj = E.objetivoId === m.id || E.multiObjetivos.has(m.id); // (varios objetivos a la vez en el modo multijugador)
    if (!esObj && m.g.position.z < Z_VISIBLE) continue;
    v.set(m.g.position.x, m.g.position.y + m.alto * m.g.scale.x + 0.1, m.g.position.z).project(E.camara);
    if (v.z < -1 || v.z > 1) continue;
    cand.push({ m, esObj, sx: (v.x * 0.5 + 0.5) * W, sy: (-v.y * 0.5 + 0.5) * H });
  }
  // 2) Fuera las etiquetas de lo que ya no está.
  const presentes = new Set(cand.map((c) => c.m.id));
  for (const [id, o] of mapa) if (!presentes.has(id)) { o.el.remove(); mapa.delete(id); }
  // 3) Orden de prioridad: el objetivo y luego los más cercanos a Lumi (más abajo en pantalla).
  cand.sort((a, b) => (b.esObj - a.esObj) || (b.sy - a.sy));
  const puestas = [];
  const k = 1 - Math.exp(-real * 16);
  for (const c of cand) {
    const o = mapa.get(c.m.id) || crear(c.m);
    if (o.obj !== c.esObj) { o.obj = c.esObj; o.el.classList.toggle('objetivo', c.esObj); medir(o); }
    else if (o.re > 0) { o.re--; medir(o); } // las primeras veces se vuelve a medir (por si la tipografía tarda)
    if (E.multi) { const x = c.m.g.position.x, borroso = E.multiNiebla[x < -6 ? 0 : x < 0 ? 1 : x < 6 ? 2 : 3]; if (o.borroso !== borroso) { o.borroso = borroso; o.el.classList.toggle('borroso', borroso); } }
    else if (o.borroso) { o.borroso = false; o.el.classList.remove('borroso'); }
    if (!o.w) continue;
    const hueco = c.esObj ? HUECO_OBJETIVO : HUECO;
    const left = Math.min(W - o.w - 6, Math.max(6, c.sx - o.w / 2));
    const base = c.sy - hueco - o.h;
    let top = base;
    // Apartar hacia arriba de las ya colocadas.
    for (let i = 0; i < 8; i++) {
      const choque = puestas.find((p) => left < p.r + SEP && left + o.w > p.l - SEP && top < p.b + SEP && top + o.h > p.t - SEP);
      if (!choque) break;
      top = choque.t - o.h - SEP;
    }
    const oculto = top < limiteSup || (!c.esObj && base - top > o.h * SUBIDA_MAX);
    if (!oculto) puestas.push({ l: left, r: left + o.w, t: top, b: top + o.h });
    if (!o.listo) { o.x = left; o.y = top; o.listo = true; }
    else { o.x += (left - o.x) * k; o.y += (top - o.y) * k; }
    o.el.style.transform = `translate3d(${o.x.toFixed(1)}px, ${o.y.toFixed(1)}px, 0)`;
    o.el.style.opacity = oculto ? '0' : '';
    if (c.esObj) o.el.style.setProperty('--cola', Math.min(o.w - 16, Math.max(16, c.sx - left)).toFixed(0) + 'px');
  }
}

// Al salir de la partida.
export function limpiar() { for (const o of mapa.values()) o.el.remove(); mapa.clear(); }
