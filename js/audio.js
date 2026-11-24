// ¡Palabrones! · Audio: buses (Música → Atenuación → Maestro, Efectos), música sintetizada
// por pasos (o archivos de music/ si existen) y efectos generados en el navegador.

const A = {
  ctx: null, maestro: null, musica: null, atenuacion: null, efectos: null, ruido: null,
  volMusica: 0.7, volEfectos: 0.8, cancion: null, intensidad: 0, archivos: {}, pistaArchivo: null,
};

// Pistas opcionales en music/ (por ejemplo descargadas de Pixabay). Si no están, se sintetiza.
const ARCHIVOS = { menu: 'music/menu.mp3', pradera: 'music/pradera.mp3', bosque: 'music/bosque.mp3', desierto: 'music/desierto.mp3', nieve: 'music/nieve.mp3', castillo: 'music/castillo.mp3', jefe: 'music/jefe.mp3' };

function ganancia(v) { return Math.max(0, Math.min(1, v)) ** 2; } // deslizador 0..1 → amplitud (curva cuadrática)

export function iniciarAudio() {
  if (A.ctx) { if (A.ctx.state !== 'running') A.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return;
  const ctx = new C();
  A.ctx = ctx;
  A.maestro = ctx.createGain(); A.maestro.gain.value = 0.9;
  const limitador = ctx.createDynamicsCompressor();
  limitador.threshold.value = -6; limitador.knee.value = 4; limitador.ratio.value = 12; limitador.attack.value = 0.003; limitador.release.value = 0.2;
  A.maestro.connect(limitador).connect(ctx.destination);
  A.atenuacion = ctx.createGain(); A.atenuacion.gain.value = 1; A.atenuacion.connect(A.maestro);
  A.musica = ctx.createGain(); A.musica.gain.value = ganancia(A.volMusica) * 0.55; A.musica.connect(A.atenuacion);
  A.efectos = ctx.createGain(); A.efectos.gain.value = ganancia(A.volEfectos); A.efectos.connect(A.maestro);
  const len = ctx.sampleRate * 1.0;
  A.ruido = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = A.ruido.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  document.addEventListener('visibilitychange', () => {
    if (!A.ctx) return;
    if (document.hidden) A.ctx.suspend(); else A.ctx.resume();
  });
  // Mira qué pistas de archivo existen (sin bloquear el juego).
  for (const [k, url] of Object.entries(ARCHIVOS)) {
    fetch(url).then((r) => (r.ok ? r.arrayBuffer() : null)).then((b) => b && ctx.decodeAudioData(b)).then((buf) => {
      if (buf) { A.archivos[k] = buf; if (A.cancion && A.cancion.nombre === k) reiniciarCancion(); }
    }).catch(() => {});
  }
  if (A.pendiente) { const p = A.pendiente; A.pendiente = null; musica(p); }
}

export function audioListo() { return !!(A.ctx && A.ctx.state === 'running'); }

export function volumenes(musicaV, efectosV) {
  A.volMusica = musicaV; A.volEfectos = efectosV;
  if (!A.ctx) return;
  const t = A.ctx.currentTime;
  A.musica.gain.setTargetAtTime(ganancia(musicaV) * 0.55, t, 0.05);
  A.efectos.gain.setTargetAtTime(ganancia(efectosV), t, 0.05);
}

// Baja la música mientras habla la voz o hay una explicación (bus aparte: no pisa el deslizador).
export function atenuar(si) {
  if (!A.ctx) return;
  A.atenuacion.gain.setTargetAtTime(si ? 0.28 : 1, A.ctx.currentTime, si ? 0.08 : 0.35);
}

// ---------- utilidades de síntesis ----------
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

function nota(t, midi, dur, o = {}) {
  const ctx = A.ctx;
  const osc = ctx.createOscillator();
  osc.type = o.tipo || 'square';
  osc.frequency.setValueAtTime(mtof(midi), t);
  if (o.desafinar) osc.detune.value = o.desafinar;
  if (o.deslizar) osc.frequency.exponentialRampToValueAtTime(mtof(midi + o.deslizar), t + dur);
  const g = ctx.createGain();
  const vol = o.vol ?? 0.2, at = o.ataque ?? 0.005, rel = o.suelta ?? 0.08;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + at);
  g.gain.setTargetAtTime(vol * (o.sostener ?? 0.6), t + at, dur * 0.4);
  g.gain.setTargetAtTime(0.0001, t + dur, rel / 3);
  let n = osc;
  if (o.filtro) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.filtro; f.Q.value = o.q ?? 1;
    n.connect(f); n = f;
  }
  n.connect(g).connect(o.destino || A.efectos);
  osc.start(t); osc.stop(t + dur + rel + 0.05);
}

function ruido(t, dur, o = {}) {
  const ctx = A.ctx;
  const s = ctx.createBufferSource(); s.buffer = A.ruido;
  const f = ctx.createBiquadFilter(); f.type = o.tipoFiltro || 'highpass'; f.frequency.value = o.frec || 5000; f.Q.value = o.q ?? 0.7;
  const g = ctx.createGain(); const vol = o.vol ?? 0.2;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  if (o.barrido) f.frequency.exponentialRampToValueAtTime(o.barrido, t + dur);
  s.connect(f).connect(g).connect(o.destino || A.efectos);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

function bombo(t, dest, vol = 0.9) {
  const ctx = A.ctx;
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(dest); o.start(t); o.stop(t + 0.32);
}
function caja(t, dest, vol = 0.35) {
  ruido(t, 0.16, { frec: 1500, vol, destino: dest });
  nota(t, 50, 0.06, { tipo: 'triangle', vol: vol * 0.5, destino: dest, suelta: 0.05 });
}
function charles(t, dest, vol = 0.09, largo = 0.04) { ruido(t, largo, { frec: 8000, vol, destino: dest }); }

// ---------- música por pasos ----------
function rng(semilla) { let s = semilla >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const ESCALAS = { mayor: [0, 2, 4, 5, 7, 9, 11], menor: [0, 2, 3, 5, 7, 8, 10], dorica: [0, 2, 3, 5, 7, 9, 10], pentatonica: [0, 2, 4, 7, 9], arabe: [0, 1, 4, 5, 7, 8, 10] };

// Cada canción: tempo, tónica, escala, progresión (grados), patrones de batería y timbres.
const CANCIONES = {
  menu: { bpm: 100, raiz: 60, escala: 'mayor', prog: [0, 5, 3, 4], semilla: 11, bat: 'suave', lead: 'triangle', bajo: 'triangle', arpegio: 'square', densidad: 0.45 },
  pradera: { bpm: 118, raiz: 62, escala: 'mayor', prog: [0, 3, 4, 0, 5, 3, 1, 4], semilla: 21, bat: 'pop', lead: 'square', bajo: 'triangle', arpegio: 'triangle', densidad: 0.55 },
  bosque: { bpm: 108, raiz: 57, escala: 'dorica', prog: [0, 3, 0, 6, 0, 3, 4, 6], semilla: 37, bat: 'trote', lead: 'triangle', bajo: 'sawtooth', arpegio: 'triangle', densidad: 0.5 },
  desierto: { bpm: 112, raiz: 64, escala: 'arabe', prog: [0, 1, 0, 6, 0, 1, 3, 0], semilla: 53, bat: 'trote', lead: 'sawtooth', bajo: 'triangle', arpegio: 'triangle', densidad: 0.5 },
  nieve: { bpm: 124, raiz: 65, escala: 'mayor', prog: [5, 3, 0, 4, 5, 3, 1, 4], semilla: 71, bat: 'pop', lead: 'triangle', bajo: 'square', arpegio: 'square', densidad: 0.55 },
  castillo: { bpm: 132, raiz: 55, escala: 'menor', prog: [0, 5, 2, 6, 0, 5, 3, 4], semilla: 89, bat: 'fuerte', lead: 'square', bajo: 'sawtooth', arpegio: 'square', densidad: 0.6 },
  jefe: { bpm: 150, raiz: 52, escala: 'menor', prog: [0, 0, 5, 6, 0, 0, 3, 4], semilla: 101, bat: 'fuerte', lead: 'sawtooth', bajo: 'sawtooth', arpegio: 'square', densidad: 0.65 },
};

const BATERIAS = {
  suave: { k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.' },
  pop: { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  trote: { k: 'x..x..x.x..x..x.', s: '....x.......x..x', h: '.xx.xx.x.xx.xx.x' },
  fuerte: { k: 'x.x...x.x.x...x.', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' },
};

function grado(c, g, oct = 0) {
  const e = ESCALAS[c.escala];
  const n = e.length;
  const o = Math.floor(g / n);
  return c.raiz + e[((g % n) + n) % n] + 12 * (o + oct);
}

// Melodía determinista: notas del acorde en tiempos fuertes, pasos por la escala en los débiles.
function componer(c) {
  const r = rng(c.semilla);
  const barras = c.prog.length;
  const motivo = [];
  for (let i = 0; i < 16; i++) motivo.push(r() < (i % 4 === 0 ? 0.9 : i % 2 === 0 ? c.densidad : c.densidad * 0.5));
  const mel = [];
  let g = 4;
  for (let b = 0; b < barras; b++) {
    const acorde = c.prog[b];
    for (let i = 0; i < 16; i++) {
      const hay = b % 2 === 1 && i >= 12 ? i === 12 : motivo[i];
      if (!hay) { mel.push(null); continue; }
      if (i % 4 === 0) { const ts = [0, 2, 4]; g = acorde + ts[Math.floor(r() * 3)]; } else { g += r() < 0.5 ? 1 : -1; if (r() < 0.2) g += r() < 0.5 ? 2 : -2; }
      g = Math.max(-1, Math.min(9, g));
      let largo = 1; while (i + largo < 16 && !motivo[i + largo] && largo < 4) largo++;
      mel.push({ g, largo });
    }
  }
  return mel;
}

function reiniciarCancion() { const n = A.cancion && A.cancion.nombre; if (n) { pararMusica(true); musica(n); } }

export function musica(nombre) {
  if (!A.ctx) { A.pendiente = nombre; return; }
  if (A.cancion && A.cancion.nombre === nombre) return;
  pararMusica();
  if (A.archivos[nombre]) {
    const s = A.ctx.createBufferSource(); s.buffer = A.archivos[nombre]; s.loop = true;
    const g = A.ctx.createGain(); g.gain.setValueAtTime(0.0001, A.ctx.currentTime); g.gain.exponentialRampToValueAtTime(1.3, A.ctx.currentTime + 0.8);
    s.connect(g).connect(A.musica); s.start();
    A.cancion = { nombre, archivo: true, s, g };
    return;
  }
  const c = CANCIONES[nombre] || CANCIONES.menu;
  const bus = A.ctx.createGain(); bus.gain.setValueAtTime(0.0001, A.ctx.currentTime); bus.gain.exponentialRampToValueAtTime(1, A.ctx.currentTime + 0.6);
  bus.connect(A.musica);
  const capa = A.ctx.createGain(); capa.gain.value = A.intensidad > 0 ? 1 : 0; capa.connect(bus);
  const capa2 = A.ctx.createGain(); capa2.gain.value = A.intensidad > 1 ? 1 : 0; capa2.connect(bus);
  const est = { nombre, c, bus, capa, capa2, mel: componer(c), paso: 0, t: A.ctx.currentTime + 0.08, temporizador: null };
  const dur = 60 / c.bpm / 4;
  const total = c.prog.length * 16;
  const bat = BATERIAS[c.bat];
  est.temporizador = setInterval(() => {
    const ahora = A.ctx.currentTime;
    if (est.t < ahora - 0.5) est.t = ahora + 0.05; // tras una pausa larga, no recuperes notas viejas
    while (est.t < ahora + 0.15) {
      const p = est.paso % total, i = p % 16, b = Math.floor(p / 16), t = est.t;
      const acorde = c.prog[b];
      if (bat.k[i] === 'x') bombo(t, bus, 0.55);
      if (bat.s[i] === 'x') caja(t, bus, 0.18);
      if (bat.h[i] === 'x') charles(t, bus, 0.045);
      if (i % 4 === 0 || (c.bat === 'trote' && i % 4 === 3)) nota(t, grado(c, acorde, -2), dur * 1.6, { tipo: c.bajo, vol: 0.2, filtro: 900, destino: bus, sostener: 0.7 });
      if (i === 0) for (const k of [0, 2, 4]) nota(t, grado(c, acorde + k, -1), dur * 15, { tipo: 'sawtooth', vol: 0.025, filtro: 1400, ataque: 0.25, suelta: 0.4, desafinar: k * 3 - 3, destino: bus, sostener: 0.8 });
      const arp = [0, 2, 4, 7][i % 4];
      if (i % 2 === 0) nota(t, grado(c, acorde + arp, 0), dur * 0.9, { tipo: c.arpegio, vol: 0.035, filtro: 2600, destino: capa });
      if (i % 2 === 1) nota(t, grado(c, acorde + [4, 7, 9, 11][(i >> 1) % 4], 1), dur * 0.8, { tipo: 'square', vol: 0.025, filtro: 4200, destino: capa2 });
      charles(t, capa2, 0.03);
      if (i % 8 === 4) bombo(t, capa2, 0.35);
      const m = est.mel[p];
      if (m) nota(t, grado(c, m.g, 1), dur * m.largo * 0.92, { tipo: c.lead, vol: 0.07, filtro: 3200, destino: bus, sostener: 0.55 });
      est.paso++; est.t += dur;
    }
  }, 25);
  A.cancion = est;
}

export function pararMusica(inmediato) {
  const c = A.cancion; A.cancion = null;
  if (!c || !A.ctx) return;
  const t = A.ctx.currentTime;
  if (c.archivo) { c.g.gain.setTargetAtTime(0.0001, t, inmediato ? 0.01 : 0.25); c.s.stop(t + (inmediato ? 0.05 : 1.2)); return; }
  clearInterval(c.temporizador);
  c.bus.gain.setTargetAtTime(0.0001, t, inmediato ? 0.01 : 0.2);
  setTimeout(() => c.bus.disconnect(), 1500);
}

// Capa extra de la música (arpegio) cuando la racha es buena: música adaptativa.
export function intensidad(n) {
  A.intensidad = n;
  if (A.cancion && A.cancion.capa) A.cancion.capa.gain.setTargetAtTime(n > 0 ? 1 : 0, A.ctx.currentTime, 0.3);
  if (A.cancion && A.cancion.capa2) A.cancion.capa2.gain.setTargetAtTime(n > 1 ? 1 : 0, A.ctx.currentTime, 0.2);
}

// ---------- efectos ----------
const varia = (x, p = 0.04) => x * (1 + (Math.random() * 2 - 1) * p);

export const sfx = {
  click() { if (!audioListo()) return; const t = A.ctx.currentTime; nota(t, 84, 0.04, { tipo: 'square', vol: 0.06, filtro: 4000 }); },
  hover() { if (!audioListo()) return; nota(A.ctx.currentTime, 91, 0.025, { tipo: 'sine', vol: 0.03 }); },
  disparo(cat) {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    const base = { S: 72, A: 76, V: 79 }[cat] || 74;
    nota(t, base, 0.22, { tipo: cat === 'V' ? 'sawtooth' : cat === 'A' ? 'triangle' : 'square', vol: 0.09, deslizar: 12, filtro: 3500 });
    ruido(t, 0.25, { tipoFiltro: 'bandpass', frec: 900, barrido: 5000, vol: 0.12 });
  },
  acierto(combo) {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    const sube = Math.min(combo, 12);
    bombo(t, A.efectos, 0.5);
    ruido(t, 0.3, { tipoFiltro: 'lowpass', frec: 3000, barrido: 300, vol: 0.25 });
    [0, 4, 7, 12].forEach((s, i) => nota(t + 0.05 + i * 0.045, 72 + sube + s, 0.12, { tipo: 'square', vol: 0.06, filtro: 5000 }));
  },
  fallo() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    nota(t, 52, 0.18, { tipo: 'sawtooth', vol: 0.12, deslizar: -5, filtro: 1200 });
    nota(t + 0.17, 47, 0.3, { tipo: 'sawtooth', vol: 0.12, deslizar: -6, filtro: 1000 });
  },
  burla() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    [67, 64, 67, 64].forEach((m, i) => nota(t + i * 0.09, varia(m, 0.01), 0.08, { tipo: 'triangle', vol: 0.07 }));
  },
  moneda() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    nota(t, 88, 0.06, { tipo: 'square', vol: 0.05 }); nota(t + 0.06, 95, 0.12, { tipo: 'square', vol: 0.05 });
  },
  golpe() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    bombo(t, A.efectos, 0.9); ruido(t, 0.35, { tipoFiltro: 'lowpass', frec: 1200, barrido: 100, vol: 0.4 });
    nota(t, 40, 0.3, { tipo: 'square', vol: 0.12, deslizar: -12, filtro: 600 });
  },
  corazon() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    [72, 76, 79, 84].forEach((m, i) => nota(t + i * 0.07, m, 0.14, { tipo: 'triangle', vol: 0.08 }));
  },
  congelar() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    for (let i = 0; i < 10; i++) nota(t + i * 0.04, 84 + (i % 5) * 3, 0.3, { tipo: 'sine', vol: 0.05 });
    ruido(t, 1.0, { tipoFiltro: 'bandpass', frec: 6000, barrido: 1500, vol: 0.12 });
  },
  rugido() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    nota(t, 36, 0.9, { tipo: 'sawtooth', vol: 0.18, deslizar: -5, filtro: 500, q: 6 });
    ruido(t, 0.9, { tipoFiltro: 'lowpass', frec: 800, barrido: 150, vol: 0.3 });
  },
  ataqueJefe() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    ruido(t, 0.6, { tipoFiltro: 'bandpass', frec: 400, barrido: 2500, vol: 0.3 });
    nota(t, 45, 0.5, { tipo: 'sawtooth', vol: 0.12, deslizar: 7, filtro: 900 });
  },
  estrella(i) {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    [0, 7, 12].forEach((s, k) => nota(t + k * 0.06, 76 + i * 4 + s, 0.25, { tipo: 'square', vol: 0.06, filtro: 6000 }));
  },
  nivel() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    const m = [72, 76, 79, 84, 79, 84, 88];
    m.forEach((n, i) => nota(t + i * 0.09, n, i === m.length - 1 ? 0.6 : 0.12, { tipo: 'square', vol: 0.07, filtro: 5000 }));
    m.forEach((n, i) => nota(t + i * 0.09, n - 12, 0.12, { tipo: 'triangle', vol: 0.06 }));
  },
  victoria() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    const m = [[67, 0.12], [72, 0.12], [76, 0.12], [79, 0.24], [76, 0.12], [79, 0.6]];
    let k = 0; for (const [n, d] of m) { nota(t + k, n, d, { tipo: 'square', vol: 0.08, filtro: 5000 }); nota(t + k, n - 24, d, { tipo: 'triangle', vol: 0.12 }); k += d; }
    bombo(t, A.efectos, 0.5); bombo(t + k - 0.6, A.efectos, 0.6);
  },
  derrota() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    [[67, 0.25], [66, 0.25], [65, 0.25], [64, 0.8]].reduce((k, [n, d]) => { nota(t + k, n, d, { tipo: 'triangle', vol: 0.1, deslizar: d > 0.5 ? -2 : 0 }); return k + d; }, 0);
  },
  logro() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    [79, 83, 86, 91].forEach((n, i) => nota(t + i * 0.06, n, 0.18, { tipo: 'triangle', vol: 0.07 }));
    charles(t, A.efectos, 0.1, 0.5);
  },
  compra() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    [84, 88, 91, 96].forEach((n, i) => nota(t + i * 0.05, n, 0.1, { tipo: 'square', vol: 0.05 }));
  },
  grunido() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    nota(t, varia(40, 0.05), 0.45, { tipo: 'sawtooth', vol: 0.09, deslizar: -4, filtro: 420, q: 8, ataque: 0.04 });
    ruido(t, 0.4, { tipoFiltro: 'bandpass', frec: 380, barrido: 180, vol: 0.12, q: 3 });
  },
  latido() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    bombo(t, A.efectos, 0.45); bombo(t + 0.16, A.efectos, 0.3);
  },
  oleada() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    [55, 62, 67].forEach((n, i) => nota(t + i * 0.12, n, 0.3, { tipo: 'sawtooth', vol: 0.09, filtro: 1800 }));
    ruido(t, 0.6, { tipoFiltro: 'bandpass', frec: 600, barrido: 3000, vol: 0.12 });
  },
  frenesi() {
    if (!audioListo()) return; const t = A.ctx.currentTime;
    [72, 76, 79, 84, 88, 91].forEach((n, i) => nota(t + i * 0.05, n, 0.2, { tipo: 'square', vol: 0.06, filtro: 6000 }));
    bombo(t, A.efectos, 0.6);
  },
  cuenta(n) { if (!audioListo()) return; nota(A.ctx.currentTime, n > 0 ? 72 : 84, n > 0 ? 0.12 : 0.35, { tipo: 'square', vol: 0.07, filtro: 4000 }); },
};
