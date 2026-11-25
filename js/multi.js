// ¡Palabrones! · Modo multijugador EXPERIMENTAL: 4 jugadores a lo ancho de una pizarra digital.
// Solo existe si la dirección lleva «?multi» (main.js carga este módulo únicamente en ese caso).
// Reglas: los cuatro magos tienen su carril y reciben LOS MISMOS Palabrones a la vez. Cada uno responde con sus 3 botones (los de su
// columna). Acertar da puntos (más cuanto antes, +50 al primero en acertar cada palabra, +10 por racha). No hay corazones: fallar,
// dejar que el Palabrón llegue o recibir un ataque QUITA PUNTOS, y el mago que se queda sin puntos muere (su cuerpo se queda atrás,
// el camino sigue sin él). La partida dura 1, 2 o 3 minutos (gana quien más puntos tiene) o es infinita (gana el último en pie).
// Competencia: cada acierto carga el ATAQUE (⚡). Con 3 cargas se lanza un obstáculo a un rival: niebla (no deja leer las palabras),
// pegajoso (bloquea sus botones un momento), Palabrón extra en su carril o aceleración de sus Palabrones.
import * as E from './escena.js?v=1.1.22';
import { sfx, musica } from './audio.js?v=1.1.22';
import { CATS, MUNDOS } from './datos.js?v=1.1.22';
import { generadorMulti } from './juego.js?v=1.1.22';
import { decir, callar } from './voz.js?v=1.1.22';

const Z_LLEGADA = -2.2, Z_SALIDA = -32;
const PUNTOS_INICIO = 300;   // los puntos hacen de «vida»: a 0 el mago muere
const PENAL = { fallo: 100, llega: 150, ataque: 100 }; // puntos que se pierden
const VELOCIDADES = { suave: { vel: 2.0, cada: 7.0 }, normal: { vel: 2.7, cada: 5.4 }, rapida: { vel: 3.5, cada: 4.2 } };
const NOMBRES = ['Rojo', 'Azul', 'Verde', 'Amarillo'];
const AVATARES = ['🦊', '🐙', '🐸', '🐯'];
// Teclado (para probar sin pantalla táctil): Sustantivo / Adjetivo / Verbo de cada jugador.
const TECLAS = [['a', 's', 'd'], ['f', 'g', 'h'], ['j', 'k', 'l'], ['arrowleft', 'arrowdown', 'arrowright']];
const TECLA_ATAQUE = ['w', 't', 'i', 'arrowup']; // ataque (y 1, 2, 3, 4 para elegir rival en pruebas)
const CATEGORIAS = ['S', 'A', 'V'];
const CARGA_MAX = 3;
const OBSTACULOS = {
  niebla: { icono: '🌫️', nombre: 'NIEBLA', seg: 4 },
  pegajoso: { icono: '🍯', nombre: 'PEGAJOSO', seg: 2.5 },
  extra: { icono: '👹', nombre: 'PALABRÓN EXTRA', seg: 0 },
  rapido: { icono: '💨', nombre: 'ACELERÓN', seg: 6 },
};

const M = { activo: false, fase: '', cfg: { mundo: 0, min: 2, vel: 'normal' }, jugadores: [], monstruos: [], t: 0, sig: 0, lanzados: 0, gen: null, id: 1000, cuenta: 0, ctx: null, ult: -1 };
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- pantallas (se crean aquí para no cargar el HTML normal) ----------
function crearPantallas() {
  const columnas = [0, 1, 2, 3].map((i) => `
    <div class="mj-col" data-p="${i}" style="--c:${E.MULTI_COLORES[i]}">
      <div class="mj-cab"><span class="mj-av">${AVATARES[i]}</span><b class="mj-nombre"></b><span class="mj-puntos">0</span></div>
      <div class="mj-msg"></div>
      <div class="mj-ataque"><div class="mj-rivales"></div><button class="mj-atk" data-p="${i}"><b>⚡ ¡ATAQUE!</b><span class="mj-pips"></span></button></div>
      <div class="mj-botones">${CATEGORIAS.map((c) => `<button class="mj-b" data-p="${i}" data-cat="${c}" style="--k:${CATS[c].color};--ko:${CATS[c].oscuro}"><b>${CATS[c].nombre}</b><small>${CATS[c].lema}</small></button>`).join('')}</div>
    </div>`).join('');
  const html = `
  <section id="p-multi-config" class="pantalla">
    <div class="panel panel-mj ajustar">
      <h1 class="h-panel">Multijugador <small class="mj-exp">experimental</small></h1>
      <p id="mj-aviso" class="mj-aviso oculto"></p>
      <div class="mj-nombres">${[0, 1, 2, 3].map((i) => `<label style="--c:${E.MULTI_COLORES[i]}"><i>${AVATARES[i]}</i><input class="entrada" maxlength="12" value="${NOMBRES[i]}" data-p="${i}" aria-label="Nombre del jugador ${i + 1}"></label>`).join('')}</div>
      <div class="mj-fila"><b>Mundo</b><div class="segmentos" id="mj-mundos">${MUNDOS.map((m, i) => `<button data-v="${i}">${esc(m.nombre.split(' ')[0])}</button>`).join('')}</div></div>
      <div class="mj-fila"><b>Duración</b><div class="segmentos" id="mj-min"><button data-v="1">1 min</button><button data-v="2">2 min</button><button data-v="3">3 min</button><button data-v="0">Infinito ∞</button></div></div>
      <div class="mj-fila"><b>Velocidad</b><div class="segmentos" id="mj-vel"><button data-v="suave">Suave</button><button data-v="normal">Normal</button><button data-v="rapida">Rápida</button></div></div>
      <p class="nota">Cada jugador toca los 3 botones de su columna. Aparecen las mismas palabras a la vez para los cuatro: ¡gana quien más puntos consiga!<br>Fallar, dejar pasar a un Palabrón o recibir un ataque <b>resta puntos</b>; con tiempo nadie muere: gana quien tenga más puntos al acabar. En «Infinito» el mago que llega a 0 puntos cae y se queda atrás; gana el último en pie.<br>Cada acierto carga el ⚡ ATAQUE: con 3 cargas lanzas un obstáculo a un rival (¡toca su avatar para elegirlo!).<br>Teclado (pruebas): A S D (ataque W) · F G H (T) · J K L (I) · ← ↓ → (↑)</p>
      <div class="fila-botones"><button id="mj-volver" class="btn btn-gris">Volver</button><button id="mj-jugar" class="btn btn-oro btn-grande">¡A jugar!</button></div>
    </div>
  </section>
  <section id="p-multi" class="pantalla">
    <div class="mj-cols">${columnas}</div>
    <button id="mj-salir" class="mj-salir" aria-label="Salir">✕</button>
    <div id="mj-tiempo" class="mj-tiempo"></div>
    <div id="mj-banner" class="mj-banner"></div>
    <div id="mj-cuenta" class="mj-cuenta"></div>
  </section>
  <section id="p-multi-fin" class="pantalla">
    <div class="panel panel-mj-fin ajustar">
      <h1 id="mj-fin-titulo" class="h-panel">¡Fin!</h1>
      <ol id="mj-podio" class="mj-podio"></ol>
      <div class="fila-botones"><button id="mj-fin-salir" class="btn btn-gris">Salir</button><button id="mj-revancha" class="btn btn-oro btn-grande">¡Revancha!</button></div>
    </div>
  </section>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

const reloj = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function pizarraValida() { return innerWidth >= 1000 && innerWidth / innerHeight >= 1.3; }

// ---------- configuración ----------
function marcar(grupo, valor) { for (const b of $$(grupo + ' button')) b.classList.toggle('activo', b.dataset.v === String(valor)); }
function abrirConfig() {
  const ok = pizarraValida(), av = $('#mj-aviso');
  av.classList.toggle('oculto', ok);
  av.textContent = ok ? '' : 'El modo multijugador está pensado para pizarras digitales (pantalla grande y en horizontal). Aquí no está disponible.';
  $('#mj-jugar').disabled = !ok;
  marcar('#mj-mundos', M.cfg.mundo); marcar('#mj-min', M.cfg.min); marcar('#mj-vel', M.cfg.vel);
  M.ctx.mostrar('p-multi-config');
}
function montarConfig() {
  for (const [id, campo, num] of [['#mj-mundos', 'mundo', true], ['#mj-min', 'min', true], ['#mj-vel', 'vel', false]]) {
    $(id).addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      sfx.click(); M.cfg[campo] = num ? +b.dataset.v : b.dataset.v; marcar(id, M.cfg[campo]);
    });
  }
  $('#mj-volver').addEventListener('click', () => { sfx.click(); M.ctx.irA('p-inicio'); });
  $('#mj-jugar').addEventListener('click', () => { sfx.click(); empezar(); });
  $('#mj-revancha').addEventListener('click', () => { sfx.click(); empezar(); });
  $('#mj-fin-salir').addEventListener('click', () => { sfx.click(); salir(); });
  $('#mj-salir').addEventListener('click', () => { sfx.click(); salir(); });
}

// ---------- partida ----------
async function empezar() {
  if (!pizarraValida()) return;
  callar();
  const tema = MUNDOS[M.cfg.mundo].tema;
  await M.ctx.asegurarTema(tema);
  E.default.alActualizar = null;
  E.quitarTodos();
  E.multiIniciar();
  const nombres = $$('.mj-nombres input').map((inp, i) => (inp.value.trim() || NOMBRES[i]).slice(0, 12));
  M.jugadores = nombres.map((nombre, i) => ({ i, nombre, puntos: PUNTOS_INICIO, aciertos: 0, fallos: 0, combo: 0, vivo: true, murio: 0, msgT: 0, carga: 0, niebla: 0, bloq: 0, acel: 0, elegir: 0 }));
  Object.assign(M, { activo: true, fase: 'cuenta', monstruos: [], t: 0, sig: 1.2, lanzados: 0, gen: generadorMulti([1, 2]), cuenta: 3.4, ult: -1, duracion: M.cfg.min > 0 ? M.cfg.min * 60 : Infinity, bannerT: 0 });
  $('#mj-tiempo').textContent = M.cfg.min > 0 ? reloj(M.duracion) : '∞';
  const v = VELOCIDADES[M.cfg.vel];
  E.default.avance = Math.max(0.5, v.vel - 1);
  for (const col of $$('.mj-col')) { const i = +col.dataset.p; col.classList.remove('fuera', 'niebla', 'pegado', 'listo'); col.querySelector('.mj-nombre').textContent = nombres[i]; col.querySelector('.mj-rivales').textContent = ''; }
  $('#mj-banner').classList.remove('visible');
  $$('.mj-pop').forEach((p) => p.remove());
  pintarHud();
  const etq = $('#etiquetas'); if (etq && etq.parentElement !== $('#p-multi')) $('#p-multi').prepend(etq); // las palabras sobre los Palabrones
  M.ctx.mostrar('p-multi');
  E.vista('multi', true);
  musica(tema);
  E.default.alActualizar = actualizar;
  requestAnimationFrame(M.ctx.ajustarTodo);
}

function devolverEtiquetas() { const etq = $('#etiquetas'); if (etq && etq.parentElement.id !== 'p-juego') $('#p-juego').prepend(etq); }
function salir() {
  M.activo = false; M.fase = ''; devolverEtiquetas();
  E.default.alActualizar = null; E.default.avance = 0;
  E.quitarTodos(); E.multiTerminar();
  callar(); musica('menu');
  M.ctx.restaurarAspecto();
  M.ctx.irA('p-inicio');
}

function vivosEnCarril(p) { return M.monstruos.filter((m) => m.p === p && m.vivo); }
function objetivoDe(p) {
  let mejor = null;
  for (const m of vivosEnCarril(p)) if (!m.pendiente && (!mejor || m.z > mejor.z)) mejor = m;
  return mejor;
}

function salida() {
  const it = M.gen(); M.lanzados++;
  const item = { it, rugio: false, primero: false };
  const semilla = M.lanzados * 7 + M.cfg.mundo * 101;
  for (const j of M.jugadores) {
    if (!j.vivo) continue;
    const id = M.id++, x = E.MULTI_X[j.i];
    const mon = E.nuevoMonstruo(id, it.texto, x, Z_SALIDA, semilla, 'normal');
    if (mon) mon.hx = x;
    M.monstruos.push({ id, item, p: j.i, x, z: Z_SALIDA, vivo: true, pendiente: false });
  }
}

function actualizar(dt, real) {
  if (!M.activo) return;
  if (M.fase === 'cuenta') {
    M.cuenta -= real;
    const n = Math.ceil(M.cuenta - 0.4), el = $('#mj-cuenta');
    if (M.cuenta <= 0.4) {
      if (M.cuenta <= 0) { M.fase = 'juego'; el.textContent = ''; sfx.cuenta(0); }
      else if (el.textContent !== '¡YA!') { el.textContent = '¡YA!'; sfx.cuenta(0); }
    } else if (el.textContent !== String(n)) { el.textContent = String(n); sfx.cuenta(n); }
    return;
  }
  if (M.fase !== 'juego') return;
  const v = VELOCIDADES[M.cfg.vel];
  M.t += dt;
  M.sig -= dt;
  // Salen Palabrones sin parar, algo más seguidos según avanza la partida.
  if (M.sig <= 0) { salida(); M.sig = v.cada * Math.max(0.55, 1 - M.t / 300) * (0.9 + Math.random() * 0.2); }
  if (M.duracion !== Infinity) { const resto = M.duracion - M.t; const txt = reloj(resto); const el = $('#mj-tiempo'); if (el.textContent !== txt) el.textContent = txt; el.classList.toggle('poco', resto <= 10); }
  for (const m of M.monstruos) {
    if (!m.vivo) continue;
    m.z += v.vel * dt * (M.jugadores[m.p].acel > 0 ? 1.8 : 1);
    E.moverMonstruo(m.id, m.x, m.z, 1);
    const pel = clamp01((m.z + 11) / (Z_LLEGADA + 11));
    E.peligroMonstruo(m.id, pel);
    if (pel > 0.35 && !m.item.rugio) { m.item.rugio = true; sfx.grunido(); }
    if (m.z >= Z_LLEGADA && !m.pendiente) llega(m);
  }
  M.monstruos = M.monstruos.filter((m) => m.vivo || m.pendiente);
  for (const j of M.jugadores) { const o = j.vivo ? objetivoDe(j.i) : null; E.multiObjetivo(j.i, o ? o.id : null); }
  for (const j of M.jugadores) {
    if (j.msgT > 0) { j.msgT -= real; if (j.msgT <= 0) mensaje(j.i, ''); }
    for (const k of ['niebla', 'bloq', 'acel']) if (j[k] > 0) { j[k] -= real; if (j[k] <= 0) { j[k] = 0; efectoCols(j); } }
    if (j.elegir > 0) { j.elegir -= real; if (j.elegir <= 0) { j.elegir = 0; if (j.vivo) lanzarAtaque(j.i, lider(j.i)); } }
  }
  if (M.bannerT > 0) { M.bannerT -= real; if (M.bannerT <= 0) $('#mj-banner').classList.remove('visible'); }
  const vivos = M.jugadores.filter((j) => j.vivo);
  if (M.t >= M.duracion) terminar('tiempo');
  else if (vivos.length <= 1) terminar('ultimo');
}

// ---------- respuestas ----------
function responder(p, cat) {
  const j = M.jugadores[p];
  if (!M.activo || M.fase !== 'juego' || !j || !j.vivo || j.bloq > 0) return;
  const m = objetivoDe(p);
  if (!m) return;
  m.pendiente = true;
  sfx.disparo(cat);
  const h = E.multiHeroe(p);
  E.colorVarita(CATS[cat].color, h);
  E.disparo(CATS[cat].color, m.id, () => resolver(m, cat), h);
}

function resolver(m, cat) {
  m.pendiente = false;
  if (!M.activo || M.fase === 'fin') { E.quitarMonstruoId(m.id); return; }
  const j = M.jugadores[m.p];
  if (!j.vivo) { m.vivo = false; E.quitarMonstruoId(m.id); return; }
  const ok = cat === m.item.it.cat;
  if (ok) {
    m.vivo = false;
    j.aciertos++; j.combo++;
    const prog = clamp01((m.z - Z_SALIDA) / (Z_LLEGADA - Z_SALIDA));
    let pts = 100 + Math.round(60 * (1 - prog)) + Math.min(j.combo - 1, 5) * 10, extra = '';
    if (!m.item.primero) { m.item.primero = true; pts += 50; extra = '¡Primero!'; }
    j.puntos += pts;
    j.carga = Math.min(CARGA_MAX, j.carga + 1 + (extra ? 1 : 0)); // el primero en acertar carga el ataque más rápido
    const pos = E.posPantalla(m.id, 0.6);
    E.matarMonstruo(m.id, CATS[cat].color);
    E.temblor(0.08);
    sfx.acierto(j.combo);
    if (pos) popup(pos.x, pos.y, `+${pts}`, extra, CATS[cat].color);
    pintarHud();
  } else {
    m.vivo = false;
    j.fallos++; j.combo = 0;
    E.burla(m.id); sfx.burla(); setTimeout(() => E.alcanza(m.id), 350);
    penalizar(j, PENAL.fallo, `Era un ${CATS[m.item.it.cat].nombre.toLowerCase()}`);
  }
}

function llega(m) {
  m.vivo = false;
  const j = M.jugadores[m.p];
  E.alcanza(m.id);
  if (j.vivo) { j.combo = 0; j.fallos++; penalizar(j, PENAL.llega, '¡Te alcanzó!'); }
}

// Quita puntos (no vidas). Con 0 puntos el mago muere.
function penalizar(j, pts, msg) {
  j.puntos = Math.max(0, j.puntos - pts);
  E.heroeHerido(E.multiHeroe(j.i));
  sfx.fallo();
  mensaje(j.i, msg + ' −' + pts, 1.6);
  const r = $('.mj-col[data-p="' + j.i + '"]').getBoundingClientRect();
  popup(r.left + r.width / 2, innerHeight * 0.5, '−' + pts, '', '#ef4444');
  if (j.puntos <= 0 && M.cfg.min === 0) eliminar(j); // solo en «Infinito» se muere; con tiempo gana quien más puntos tenga al final
  pintarHud();
}

function eliminar(j) {
  j.vivo = false; j.murio = M.t;
  E.entristecer(E.multiHeroe(j.i));
  for (const m of M.monstruos) if (m.p === j.i && m.vivo) { m.vivo = false; E.quitarMonstruoId(m.id); }
  E.multiObjetivo(j.i, null);
  j.niebla = j.bloq = j.acel = j.elegir = 0; efectoCols(j);
  $(`.mj-col[data-p="${j.i}"] .mj-rivales`).textContent = '';
  mensaje(j.i, '💀 ¡Sin puntos!', 99);
  $(`.mj-col[data-p="${j.i}"]`).classList.add('fuera');
}

// ---------- ataques entre jugadores ----------
const rivalesDe = (p) => M.jugadores.filter((j) => j.vivo && j.i !== p);
const lider = (p) => { const r = rivalesDe(p).sort((a, b) => b.puntos - a.puntos)[0]; return r ? r.i : -1; };
function pedirAtaque(p) {
  const j = M.jugadores[p];
  if (!M.activo || M.fase !== 'juego' || !j || !j.vivo || j.carga < CARGA_MAX) return;
  const riv = rivalesDe(p);
  if (!riv.length) return;
  if (riv.length === 1) return lanzarAtaque(p, riv[0].i);
  // Se elige rival tocando su avatar; si no se elige, el ataque va al que va ganando.
  const caja = $('.mj-col[data-p="' + p + '"] .mj-rivales');
  caja.innerHTML = riv.map((r) => '<button class="mj-riv" data-p="' + p + '" data-t="' + r.i + '" style="--c:' + E.MULTI_COLORES[r.i] + '">' + AVATARES[r.i] + '<small>' + esc(r.nombre) + '</small></button>').join('');
  j.elegir = 3;
}
function lanzarAtaque(p, t) {
  const j = M.jugadores[p];
  $('.mj-col[data-p="' + p + '"] .mj-rivales').textContent = ''; j.elegir = 0;
  if (!j.vivo || j.carga < CARGA_MAX || t < 0 || !M.jugadores[t] || !M.jugadores[t].vivo) return;
  j.carga = 0; pintarHud();
  const tipo = Object.keys(OBSTACULOS)[Math.floor(Math.random() * 4)];
  sfx.disparo('V');
  E.colorVarita(E.MULTI_COLORES[p], E.multiHeroe(p));
  E.disparo(E.MULTI_COLORES[p], E.multiHeroe(t), () => aplicarObstaculo(t, tipo, p), E.multiHeroe(p), 0.8);
}
function aplicarObstaculo(t, tipo, de) {
  if (!M.activo || M.fase !== 'juego') return;
  const j = M.jugadores[t], o = OBSTACULOS[tipo];
  if (!j.vivo) return;
  E.temblor(0.2);
  M.jugadores[de].aciertos += 0;
  penalizar(j, PENAL.ataque, o.icono + ' ' + o.nombre);
  if (!j.vivo) return;
  if (tipo === 'extra') { salidaExtra(j); sfx.rugido(); }
  else {
    j[{ niebla: 'niebla', pegajoso: 'bloq', rapido: 'acel' }[tipo]] = o.seg; efectoCols(j);
    if (tipo === 'niebla') sfx.congelar(); else if (tipo === 'rapido') sfx.oleada(); else sfx.fallo();
  }
  banner(o.icono + ' ¡' + M.jugadores[de].nombre + ' lanza ' + o.nombre + ' a ' + j.nombre + '!', E.MULTI_COLORES[de]);
}
// Palabrón extra solo en el carril del rival.
function salidaExtra(j) {
  const it = M.gen(), x = E.MULTI_X[j.i], id = M.id++;
  const mon = E.nuevoMonstruo(id, it.texto, x, Z_SALIDA + 8, id * 3 + 11, 'normal');
  if (mon) mon.hx = x;
  M.monstruos.push({ id, item: { it, rugio: true, primero: true }, p: j.i, x, z: Z_SALIDA + 8, vivo: true, pendiente: false });
}
function efectoCols(j) {
  const col = $('.mj-col[data-p="' + j.i + '"]');
  col.classList.toggle('niebla', j.niebla > 0);
  col.classList.toggle('pegado', j.bloq > 0);
}
function banner(texto, color) {
  const el = $('#mj-banner');
  el.textContent = texto; el.style.setProperty('--c', color); el.classList.add('visible'); M.bannerT = 2.4;
}

// ---------- pantalla ----------
function mensaje(p, texto, seg = 0) {
  const el = $(`.mj-col[data-p="${p}"] .mj-msg`);
  el.textContent = texto;
  el.classList.toggle('visible', !!texto);
  M.jugadores[p].msgT = texto ? seg : 0;
}
function pintarHud() {
  for (const j of M.jugadores) {
    const col = $(`.mj-col[data-p="${j.i}"]`);
    col.querySelector('.mj-puntos').textContent = j.puntos.toLocaleString('es-ES');
    col.querySelector('.mj-pips').textContent = '●'.repeat(j.carga) + '○'.repeat(CARGA_MAX - j.carga);
    col.classList.toggle('listo', j.vivo && j.carga >= CARGA_MAX);
  }
}
function popup(x, y, texto, extra, color) {
  const el = document.createElement('div');
  el.className = 'mj-pop';
  el.style.cssText = `left:${x}px;top:${y}px;--c:${color}`;
  el.innerHTML = `${esc(texto)}${extra ? `<small>${esc(extra)}</small>` : ''}`;
  $('#p-multi').appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// ---------- final ----------
function terminar(motivo) {
  if (M.fase === 'fin') return;
  M.fase = 'fin';
  if (motivo === 'tiempo') { banner('⏱ ¡Se acabó el tiempo!', '#7c3aed'); sfx.cuenta(0); }
  E.quitarTodos();
  E.multiObjetivo(0, null); E.multiObjetivo(1, null); E.multiObjetivo(2, null); E.multiObjetivo(3, null);
  pintarHud();
  // Primero los que siguen vivos (por puntos); después los que han muerto, el que aguantó más delante.
  const orden = M.jugadores.slice().sort((a, b) => (b.vivo - a.vivo) || (a.vivo ? b.puntos - a.puntos || b.aciertos - a.aciertos : b.murio - a.murio));
  const ganador = orden[0];
  const empate = ganador.vivo && orden.filter((j) => j.vivo && j.puntos === ganador.puntos).length > 1;
  setTimeout(() => {
    if (!M.activo || M.fase !== 'fin') return;
    const medallas = ['🥇', '🥈', '🥉', '4.º'];
    $('#mj-fin-titulo').textContent = empate ? '¡Empate!' : `¡Gana ${ganador.nombre}!`;
    $('#mj-podio').innerHTML = orden.map((j, k) => `<li style="--c:${E.MULTI_COLORES[j.i]}"><span class="mj-med">${medallas[k]}</span><i>${AVATARES[j.i]}</i><b>${esc(j.nombre)}</b><span class="mj-pts">${j.puntos.toLocaleString('es-ES')}</span><small>${j.aciertos} ✔ · ${j.fallos} ✘${j.vivo ? '' : ' · cayó en el segundo ' + Math.round(j.murio)}</small></li>`).join('');
    M.ctx.mostrar('p-multi-fin');
    E.vista('multi', true);
    E.fiesta(true, E.multiHeroe(ganador.i));
    E.default.alFuego = () => sfx.fuego();
    sfx.fanfarria();
    decir(empate ? '¡Empate! Muy bien hecho, equipo.' : `¡Ha ganado ${ganador.nombre}! ¡Enhorabuena!`);
    requestAnimationFrame(M.ctx.ajustarTodo);
  }, 1200);
}

// ---------- entrada (táctil y teclado) ----------
function montarEntrada() {
  const pulsar = (b) => { b.classList.add('pulsado'); setTimeout(() => b.classList.remove('pulsado'), 140); };
  document.addEventListener('pointerdown', (e) => {
    const atk = e.target.closest && e.target.closest('.mj-atk'), riv = e.target.closest && e.target.closest('.mj-riv');
    if (atk) { e.preventDefault(); pedirAtaque(+atk.dataset.p); return; }
    if (riv) { e.preventDefault(); lanzarAtaque(+riv.dataset.p, +riv.dataset.t); return; }
    const b = e.target.closest && e.target.closest('.mj-b');
    if (!b) return;
    e.preventDefault(); pulsar(b);
    responder(+b.dataset.p, b.dataset.cat);
  }, { passive: false });
  document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('#p-multi')) e.preventDefault(); });
  document.addEventListener('keydown', (e) => {
    if (!M.activo || M.fase !== 'juego' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    for (let p = 0; p < 4; p++) if (k === TECLA_ATAQUE[p]) { pedirAtaque(p); e.preventDefault(); return; }
    if (k.length === 1 && '1234'.includes(k)) { const t = +k - 1; for (const jj of M.jugadores) if (jj.elegir > 0) { lanzarAtaque(jj.i, t); break; } return; }
    for (let p = 0; p < 4; p++) {
      const c = TECLAS[p].indexOf(k);
      if (c >= 0) { const b = $(`.mj-b[data-p="${p}"][data-cat="${CATEGORIAS[c]}"]`); if (b) pulsar(b); responder(p, CATEGORIAS[c]); e.preventDefault(); return; }
    }
  });
}

// Punto de entrada: main.js lo llama una sola vez (si la dirección lleva ?multi).
export function montarMulti(ctx) {
  M.ctx = ctx;
  window.__multi = M; // para depurar y probar
  crearPantallas(); montarConfig(); montarEntrada();
  return { abrir: abrirConfig };
}
