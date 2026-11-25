// ¡Palabrones! · Escena 3D (three.js r187): mundos, Lumi, Palabrones, jefes, hechizos y efectos.
// Personajes, monstruos y decorado son modelos GLB de Quaternius (CC0), en web/modelos.
// El estado del juego vive en juego.js; aquí solo se dibuja (las mallas son una «vista»).

import * as THREE from './lib/three.module.js?v=1.1.22';
import { GLTFLoader } from './lib/addons/loaders/GLTFLoader.js';
import { clone as clonarEsqueleto } from './lib/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from './lib/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from './lib/addons/environments/RoomEnvironment.js';
import { EffectComposer } from './lib/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './lib/addons/postprocessing/RenderPass.js';
import { GTAOPass } from './lib/addons/postprocessing/GTAOPass.js';
import { OutputPass } from './lib/addons/postprocessing/OutputPass.js';
import { ShaderPass } from './lib/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from './lib/addons/shaders/FXAAShader.js';

const E = {
  renderer: null, escena: null, camara: null, reloj: 0, pausaGolpeHasta: 0,
  trauma: 0, vista: 'menu', calidad: 'alta', alActualizar: null, congelado: false, frenesi: false,
  avance: 0, velAvance: 0, deslizables: null, suelos: [],
  monstruos: new Map(), objetivoId: null, entorno: null, ambiente: null, tema: null,
  heroe: null, jefe: null, disparos: [], anillos: [], monedas: [], confeti: 0, compositor: null,
};
export default E;

// ---------- materiales ----------
let gradiente; // (se conserva por compatibilidad con piezas antiguas)
const cacheMat = new Map();
// Material con luz realista (PBR): da volumen y sombreado de verdad.
function toon(color, extra = {}) {
  const clave = color + JSON.stringify(extra);
  if (cacheMat.has(clave)) return cacheMat.get(clave);
  const o = Object.assign({ color, roughness: 0.62, metalness: 0 }, extra);
  const m = new THREE.MeshStandardMaterial(o);
  cacheMat.set(clave, m);
  return m;
}
const matContorno = new THREE.MeshBasicMaterial({ color: 0x1a1030, side: THREE.BackSide });
function contorno(malla) { return malla; }
function contornoNormal(malla) { return malla; }
function en(o, x, y, z) { o.position.set(x, y, z); return o; }
function malla(geo, mat, sombra = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = sombra;
  return m;
}


function cuboRedondo(tam, redondez = 0.35, seg = 6) {
  const g = new THREE.BoxGeometry(tam, tam, tam, seg, seg, seg);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const esfera = v.clone().normalize().multiplyScalar(tam * 0.62);
    v.lerp(esfera, redondez);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function estrellaGeo(r1 = 0.5, r2 = 0.22, grosor = 0.18) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2; const r = i % 2 ? r2 : r1; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const g = new THREE.ExtrudeGeometry(s, { depth: grosor, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
  g.center();
  return g;
}

// ---------- texturas ----------
function texturaBrillo() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let texBrillo;

// (Los carteles con las palabras ya no se dibujan en 3D: son etiquetas HTML, ver etiquetas.js.)

// ---------- partículas (un único sistema con reserva) ----------
const MAXP = 900;
const P = { pos: null, col: null, tam: null, alfa: null, vel: [], vida: [], vidaMax: [], grav: [], n: 0, puntos: null, siguiente: 0 };
function crearParticulas() {
  const g = new THREE.BufferGeometry();
  P.pos = new Float32Array(MAXP * 3); P.col = new Float32Array(MAXP * 3); P.tam = new Float32Array(MAXP); P.alfa = new Float32Array(MAXP);
  for (let i = 0; i < MAXP; i++) { P.vel.push(new THREE.Vector3()); P.vida.push(0); P.vidaMax.push(1); P.grav.push(0); P.pos[i * 3 + 1] = -100; }
  g.setAttribute('position', new THREE.BufferAttribute(P.pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('color', new THREE.BufferAttribute(P.col, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('tam', new THREE.BufferAttribute(P.tam, 1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('alfa', new THREE.BufferAttribute(P.alfa, 1).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.ShaderMaterial({
    uniforms: { mapa: { value: texBrillo }, escalaPx: { value: 300 } },
    vertexShader: `attribute float tam; attribute float alfa; varying vec3 vC; varying float vA; uniform float escalaPx;
      void main(){ vC = color; vA = alfa; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = tam * escalaPx / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D mapa; varying vec3 vC; varying float vA;
      void main(){ vec4 t = texture2D(mapa, gl_PointCoord); gl_FragColor = vec4(vC * t.a * vA, t.a * vA); }`,
    vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  P.puntos = new THREE.Points(g, m); P.puntos.frustumCulled = false; P.puntos.renderOrder = 10;
  E.escena.add(P.puntos);
}
const _c = new THREE.Color();
export function emitir(pos, n, color, o = {}) {
  if (E.calidad === 'baja') n = Math.ceil(n * 0.5);
  _c.set(color);
  for (let k = 0; k < n; k++) {
    const i = P.siguiente; P.siguiente = (P.siguiente + 1) % MAXP;
    P.pos[i * 3] = pos.x + (Math.random() - 0.5) * (o.disp || 0.3);
    P.pos[i * 3 + 1] = pos.y + (Math.random() - 0.5) * (o.disp || 0.3);
    P.pos[i * 3 + 2] = pos.z + (Math.random() - 0.5) * (o.disp || 0.3);
    const v = o.vel ?? 4;
    const d = new THREE.Vector3(Math.random() - 0.5, Math.random() * (o.arriba ?? 0.8) + (o.minArriba ?? -0.2), Math.random() - 0.5).normalize().multiplyScalar(v * (0.4 + Math.random() * 0.8));
    if (o.dir) d.add(o.dir);
    P.vel[i].copy(d);
    const c = o.mezcla && Math.random() < 0.35 ? _c.clone().lerp(new THREE.Color(o.mezcla), 1) : _c;
    P.col[i * 3] = c.r; P.col[i * 3 + 1] = c.g; P.col[i * 3 + 2] = c.b;
    P.tam[i] = (o.tam ?? 0.35) * (0.6 + Math.random() * 0.8);
    P.vidaMax[i] = P.vida[i] = (o.vida ?? 0.8) * (0.6 + Math.random() * 0.6);
    P.grav[i] = o.grav ?? 6;
  }
}
function actualizarParticulas(dt) {
  for (let i = 0; i < MAXP; i++) {
    if (P.vida[i] <= 0) { P.alfa[i] = 0; continue; }
    P.vida[i] -= dt;
    const v = P.vel[i];
    v.y -= P.grav[i] * dt; v.multiplyScalar(1 - 1.6 * dt);
    P.pos[i * 3] += v.x * dt; P.pos[i * 3 + 1] += v.y * dt; P.pos[i * 3 + 2] += v.z * dt;
    const f = Math.max(0, P.vida[i] / P.vidaMax[i]);
    P.alfa[i] = Math.min(1, f * 1.6);
  }
  const g = P.puntos.geometry;
  g.attributes.position.needsUpdate = true; g.attributes.alfa.needsUpdate = true; g.attributes.color.needsUpdate = true; g.attributes.tam.needsUpdate = true;
}

const SOMBREROS = {
  mago(col) {
    const g = new THREE.Group();
    // Ala torneada con el borde un poco levantado.
    const perfil = [[0, 0.05], [0.5, 0.04], [0.7, 0.07], [0.8, 0.12], [0.83, 0.09], [0.74, 0.0], [0.5, -0.02], [0, -0.01]].map(([x, y]) => new THREE.Vector2(x, y));
    const ala = contornoNormal(malla(new THREE.LatheGeometry(perfil, 40), toon(col, { side: THREE.DoubleSide })), 0.02); g.add(ala);
    // Cono de una sola pieza que se dobla hacia atrás y cae un poco en la punta.
    const H = 1.2, cono = new THREE.ConeGeometry(0.45, H, 32, 16);
    cono.translate(0, H / 2, 0);
    const p = cono.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), h = Math.max(0, y / H);
      p.setXYZ(i, p.getX(i), y - 0.18 * h ** 3, p.getZ(i) - 0.55 * h ** 2.4);
    }
    cono.computeVertexNormals();
    const c = contornoNormal(malla(cono, toon(col)), 0.022); c.position.y = 0.03; g.add(c);
    const cinta = new THREE.Mesh(new THREE.CylinderGeometry(0.425, 0.445, 0.14, 32, 1, true), toon('#ffd23f')); cinta.position.y = 0.11; g.add(cinta);
    const e = new THREE.Mesh(estrellaGeo(0.12, 0.05, 0.04), toon('#ffe066', { emissive: '#ffcc00', emissiveIntensity: 0.5 })); e.position.set(0, 0.36, 0.31); e.rotation.x = -0.42; g.add(e);
    const punta = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 1), new THREE.MeshBasicMaterial({ color: '#ffe066' })); punta.position.set(0, H - 0.15, -0.53); g.add(punta);
    g.rotation.x = -0.1; return g;
  },
  gorra() {
    const g = new THREE.Group();
    const c = contorno(malla(new THREE.SphereGeometry(0.565, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon('#ef4444')), 0.04); c.position.y = -0.14; g.add(c);
    const v = contorno(malla(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 24, 1, false, -Math.PI / 2, Math.PI), toon('#1e3a8a')), 0.06); v.position.set(0, -0.1, 0.35); v.scale.z = 0.9; g.add(v);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), toon('#ffffff')); b.position.y = 0.38; g.add(b);
    return g;
  },
  vikingo() {
    const g = new THREE.Group();
    const c = contorno(malla(new THREE.SphereGeometry(0.575, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon('#9aa4b5')), 0.04); c.position.y = -0.14; g.add(c);
    const banda = new THREE.Mesh(new THREE.TorusGeometry(0.57, 0.06, 8, 28), toon('#b08d57')); banda.rotation.x = Math.PI / 2; banda.position.y = -0.12; g.add(banda);
    for (const s of [-1, 1]) { const cu = contorno(malla(new THREE.ConeGeometry(0.11, 0.55, 12), toon('#fff4dc')), 0.08); cu.position.set(s * 0.55, 0.12, 0); cu.rotation.z = -s * 0.9; g.add(cu); }
    return g;
  },
  corona() {
    const g = new THREE.Group();
    const base = contorno(malla(new THREE.CylinderGeometry(0.36, 0.38, 0.22, 24, 1, true), toon('#ffcc33', { side: THREE.DoubleSide, emissive: '#aa7700', emissiveIntensity: 0.3 })), 0.05); base.position.y = 0.02; g.add(base);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const p = malla(new THREE.ConeGeometry(0.08, 0.22, 6), toon('#ffcc33', { emissive: '#aa7700', emissiveIntensity: 0.3 })); p.position.set(Math.sin(a) * 0.35, 0.22, Math.cos(a) * 0.35); g.add(p); const j = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), new THREE.MeshBasicMaterial({ color: ['#ef4444', '#3b82f6', '#22c55e'][i % 3] })); j.position.set(Math.sin(a) * 0.38, 0.04, Math.cos(a) * 0.38); g.add(j); }
    return g;
  },
  flores() {
    const g = new THREE.Group();
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 28), toon('#3f9a3a')); aro.rotation.x = Math.PI / 2; aro.position.y = -0.04; g.add(aro);
    const cols = ['#ff6fa8', '#ffd23f', '#ffffff', '#b98cff', '#ff8a3d', '#5ec8ff'];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const f = contorno(malla(new THREE.IcosahedronGeometry(0.1, 0), toon(cols[i % cols.length])), 0.1); f.position.set(Math.sin(a) * 0.42, 0.0, Math.cos(a) * 0.42); g.add(f); }
    return g;
  },
  chistera() {
    const g = new THREE.Group();
    const ala = contorno(malla(new THREE.CylinderGeometry(0.56, 0.56, 0.05, 28), toon('#1f1b2e')), 0.05); ala.position.y = -0.02; g.add(ala);
    const t = contorno(malla(new THREE.CylinderGeometry(0.33, 0.35, 0.62, 24), toon('#1f1b2e')), 0.05); t.position.y = 0.3; g.add(t);
    const cinta = new THREE.Mesh(new THREE.CylinderGeometry(0.355, 0.355, 0.1, 24, 1, true), toon('#ef4444')); cinta.position.y = 0.06; g.add(cinta);
    return g;
  },
};

const MASCOTAS = {
  buho() {
    const g = new THREE.Group();
    const c = contorno(malla(new THREE.SphereGeometry(0.26, 16, 12), toon('#a0703f')), 0.06); c.scale.y = 1.1; g.add(c);
    const panza = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), toon('#f3d9a4')); panza.position.set(0, -0.05, 0.12); panza.scale.z = 0.6; g.add(panza);
    for (const s of [-1, 1]) {
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), toon('#ffffff')); o.position.set(s * 0.1, 0.08, 0.21); g.add(o);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), toon('#111111')); p.position.set(s * 0.1, 0.08, 0.29); g.add(p);
      const or = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 6), toon('#7a5230')); or.position.set(s * 0.15, 0.3, 0); or.rotation.z = -s * 0.3; g.add(or);
    }
    const pico = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 6), toon('#ffb020')); pico.rotation.x = Math.PI / 2 + 0.4; pico.position.set(0, 0, 0.27); g.add(pico);
    return g;
  },
  slime() {
    const g = new THREE.Group();
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 14), new THREE.MeshToonMaterial({ color: '#5cf2a0', gradientMap: gradiente, transparent: true, opacity: 0.85, emissive: '#1ea56a', emissiveIntensity: 0.3 })); c.scale.y = 0.8; g.add(c);
    for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), toon('#0f2a1d')); o.position.set(s * 0.09, 0.04, 0.24); g.add(o); }
    return g;
  },
  dragon() {
    const g = new THREE.Group();
    const c = contorno(malla(new THREE.SphereGeometry(0.24, 16, 12), toon('#f97316')), 0.06); g.add(c);
    const h = contorno(malla(new THREE.SphereGeometry(0.17, 14, 10), toon('#f97316')), 0.07); h.position.set(0, 0.22, 0.12); g.add(h);
    for (const s of [-1, 1]) {
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), toon('#111111')); o.position.set(s * 0.07, 0.27, 0.26); g.add(o);
      const cu = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 6), toon('#ffe9b0')); cu.position.set(s * 0.08, 0.38, 0.08); g.add(cu);
      const ala = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 3), toon('#fdba74', { side: THREE.DoubleSide })); ala.scale.z = 0.15; ala.position.set(s * 0.25, 0.08, -0.05); ala.rotation.z = -s * 1.1; ala.userData.ala = s; g.add(ala);
    }
    return g;
  },
  estrella() {
    const g = new THREE.Group();
    const e = contorno(malla(estrellaGeo(0.3, 0.14, 0.12), toon('#ffe066', { emissive: '#ffb800', emissiveIntensity: 0.55 })), 0.06); g.add(e);
    for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), toon('#3b2a00')); o.position.set(s * 0.07, 0.02, 0.12); g.add(o); }
    return g;
  },
  pez() {
    const g = new THREE.Group();
    const c = contorno(malla(new THREE.SphereGeometry(0.22, 16, 12), toon('#38bdf8')), 0.06); c.scale.set(0.8, 0.9, 1.2); g.add(c);
    const cola = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.25, 3), toon('#0ea5e9', { side: THREE.DoubleSide })); cola.rotation.x = -Math.PI / 2; cola.scale.x = 0.2; cola.position.z = -0.32; g.add(cola);
    for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), toon('#ffffff')); o.position.set(s * 0.12, 0.05, 0.15); g.add(o); const p = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), toon('#111111')); p.position.set(s * 0.15, 0.05, 0.18); g.add(p); }
    const burbuja = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 12), new THREE.MeshBasicMaterial({ color: '#bfeaff', transparent: true, opacity: 0.22, depthWrite: false })); g.add(burbuja);
    return g;
  },
};


// ---------- carga de modelos (con caché) ----------
const cargador = new GLTFLoader();
const MODELOS = new Map();
const ALTURAS = new Map();
export function cargar(nombre) {
  if (!MODELOS.has(nombre)) {
    MODELOS.set(nombre, new Promise((ok, mal) => cargador.load(`modelos/${nombre}.glb?v=1.1.22`, ok, undefined, mal)).catch((e) => { console.warn('modelo', nombre, e); return null; }));
  }
  return MODELOS.get(nombre);
}
function yaCargado(nombre) { const p = MODELOS.get(nombre); return p && p.valor; }
async function cargarVarios(nombres, alProgreso) {
  let hechos = 0;
  await Promise.all(nombres.map((n) => cargar(n).then((g) => { MODELOS.get(n).valor = g; hechos++; if (alProgreso) alProgreso(hechos / nombres.length); })));
}
function alturaDe(nombre, obj) {
  if (!ALTURAS.has(nombre)) {
    obj.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(obj, true);
    ALTURAS.set(nombre, Math.max(0.01, caja.max.y - caja.min.y));
  }
  return ALTURAS.get(nombre);
}
// Copia de un modelo estático (comparte geometría y materiales).
function copiaEstatica(nombre, alto, sombra = true) {
  const g = yaCargado(nombre);
  if (!g) return null;
  const o = g.scene.clone(true);
  const s = alto / alturaDe(nombre, g.scene);
  o.scale.setScalar(s);
  o.traverse((c) => { if (c.isMesh) { c.castShadow = sombra; c.receiveShadow = true; } });
  return o;
}
// Copia de un personaje animado (esqueleto propio) con su mezclador de animaciones.
function copiaAnimada(nombre, alto) {
  const g = yaCargado(nombre);
  if (!g) return null;
  const o = clonarEsqueleto(g.scene);
  const s = alto / alturaDe(nombre, g.scene);
  o.scale.setScalar(s);
  o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = false; c.frustumCulled = false; } });
  const mixer = new THREE.AnimationMixer(o);
  const clips = g.animations;
  const buscar = (...nombres) => { for (const n of nombres) { const c = clips.find((k) => k.name.split('|').pop().toLowerCase() === n.toLowerCase()); if (c) return mixer.clipAction(c); } return null; };
  return { o, mixer, buscar, escala: s };
}
function reproducir(acc, actual, fundido = 0.18, unaVez = false) {
  if (!acc) return actual;
  if (acc === actual && !unaVez) return actual;
  acc.reset();
  if (unaVez) { acc.setLoop(THREE.LoopOnce, 1); acc.clampWhenFinished = true; } else acc.setLoop(THREE.LoopRepeat, Infinity);
  acc.enabled = true; acc.setEffectiveTimeScale(1); acc.setEffectiveWeight(1);
  if (actual && actual !== acc) acc.crossFadeFrom(actual, fundido, false);
  acc.play();
  return acc;
}

// Qué modelos usa cada mundo.
const MONSTRUOS_TEMA = {
  pradera: ['m-pradera-1', 'm-pradera-2', 'm-pradera-3', 'm-pradera-4', 'm-pradera-5'],
  bosque: ['m-bosque-1', 'm-bosque-2', 'm-bosque-3', 'm-bosque-4', 'm-bosque-5', 'm-bosque-6'],
  desierto: ['m-desierto-1', 'm-desierto-2', 'm-desierto-3', 'm-desierto-4', 'm-desierto-5'],
  nieve: ['m-nieve-1', 'm-nieve-2', 'm-nieve-3', 'm-nieve-4', 'm-nieve-5'],
  castillo: ['m-castillo-1', 'm-castillo-2', 'm-castillo-3', 'm-castillo-4', 'm-castillo-5', 'm-castillo-6'],
};

// ---------- texturas procedurales de suelo y camino (se desplazan con el mundo) ----------
function texturaSuelo(base, mancha, tipo, semilla) {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), r = rngSemilla(semilla);
  x.fillStyle = base; x.fillRect(0, 0, N, N);
  const nueve = (f) => { for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) f(dx, dy); };
  if (tipo === 'losas') {
    const filas = 6;
    for (let f = 0; f < filas; f++) {
      const h = N / filas, desf = (f % 2) * 0.5;
      for (let k = -1; k < 4; k++) {
        const w = N / 3.2, px = (k + desf) * w;
        x.fillStyle = r() < 0.5 ? mancha : base;
        x.globalAlpha = 0.55 + r() * 0.35;
        x.beginPath(); x.roundRect(px + 3, f * h + 3, w - 6, h - 6, 8); x.fill();
        x.globalAlpha = 1; x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 3; x.stroke();
      }
    }
  } else {
    for (let i = 0; i < 160; i++) {
      const cx = r() * N, cy = r() * N, rad = 3 + r() * (tipo === 'camino' ? 10 : 22);
      const negro = r() < 0.2; x.globalAlpha = negro ? 0.05 + r() * 0.07 : 0.12 + r() * 0.18; x.fillStyle = negro ? '#000000' : mancha;
      nueve((dx, dy) => { x.beginPath(); x.arc(cx + dx, cy + dy, rad, 0, Math.PI * 2); x.fill(); });
    }
    if (tipo === 'hierba') {
      x.globalAlpha = 0.5; x.strokeStyle = mancha; x.lineWidth = 2;
      for (let i = 0; i < 500; i++) { const px = r() * N, py = r() * N; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 4, py - 4 - r() * 6); x.stroke(); }
    }
    if (tipo === 'camino') {
      x.globalAlpha = 0.6;
      for (let i = 0; i < 90; i++) { const px = r() * N, py = r() * N; x.fillStyle = r() < 0.5 ? '#ffffff' : '#000000'; x.globalAlpha = 0.12 + r() * 0.15; x.beginPath(); x.ellipse(px, py, 2 + r() * 5, 1.5 + r() * 3, r() * 3, 0, Math.PI * 2); x.fill(); }
    }
  }
  x.globalAlpha = 1;
  const img = x.getImageData(0, 0, N, N), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

// ---------- iniciar ----------
export function iniciar(canvas, calidad, conRetro = false) {
  E.calidad = calidad;
  // Con el look retro la escena se dibuja en objetivos propios y el lienzo solo recibe el pase final: sin suavizado ni
  // profundidad propios (a resolución completa costarían mucho, sobre todo en el móvil).
  const r = new THREE.WebGLRenderer({ canvas, antialias: calidad !== 'alta' && !conRetro, depth: !conRetro, powerPreference: 'high-performance' });
  r.localClippingEnabled = true; // el pelo de Lumi se recorta a la altura del ala del sombrero
  E.pixelRatioBase = Math.min(window.devicePixelRatio || 1, calidad === 'alta' ? 1.25 : 1);
  r.setPixelRatio(E.pixelRatioBase);
  r.setSize(innerWidth, innerHeight, false);
  r.toneMapping = THREE.NoToneMapping; r.toneMappingExposure = 1.0; // sin mapa de tonos: colores y contraste tal cual
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
  E.renderer = r;
  texBrillo = texturaBrillo();
  E.escena = new THREE.Scene();
  // Luz de entorno (reflejos y relleno suave en todas las superficies).
  const pmrem = new THREE.PMREMGenerator(r);
  E.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  E.escena.environmentIntensity = 0.45;
  E.camara = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
  E.camPos = new THREE.Vector3(2.2, 2.4, 7); E.camMira = new THREE.Vector3(0, 1.3, 1.6);
  E.camPosObj = E.camPos.clone(); E.camMiraObj = E.camMira.clone();
  E.hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 1.2); E.escena.add(E.hemi);
  const sol = new THREE.DirectionalLight(0xffffff, 2.8);
  sol.position.set(9, 16, 7); sol.castShadow = true;
  sol.shadow.mapSize.set(calidad === 'alta' ? 2048 : 1024, calidad === 'alta' ? 2048 : 1024);
  Object.assign(sol.shadow.camera, { near: 1, far: 70, left: -20, right: 20, top: 26, bottom: -26 });
  sol.target.position.set(0, 0, -12);
  sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.04;
  E.escena.add(sol, sol.target); E.sol = sol;
  crearParticulas();
  E.heroe = crearHeroe();
  E.escena.add(E.heroe.grupo);
  const anillo = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.12, 40), new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.9, depthWrite: false }));
  anillo.rotation.x = -Math.PI / 2; anillo.visible = false; anillo.renderOrder = 2;
  E.marcaAnillo = anillo;
  E.escena.add(anillo);
  // Efectos de imagen en calidad alta: oclusión ambiental (sombras en rincones) y brillo.
  if (calidad === 'alta') {
    const comp = new EffectComposer(r);
    comp.addPass(new RenderPass(E.escena, E.camara));
    const ao = new GTAOPass(E.escena, E.camara, innerWidth, innerHeight);
    ao.updateGtaoMaterial({ radius: 0.5, distanceExponent: 1.5, thickness: 1, scale: 1.2, samples: 12 });
    ao.blendIntensity = 0.85;
    comp.addPass(ao);
    // Sin bloom (brillo difuso): quitaba contraste a la imagen.
    comp.addPass(new OutputPass());
    // Antialiasing FXAA (casi sin coste): se aplica sobre la imagen final, ya con su color definitivo.
    E.fxaa = new ShaderPass(FXAAShader);
    comp.addPass(E.fxaa);
    E.compositor = comp; E.ao = ao;
  }
  window.addEventListener('resize', ajustarTamano);
  ajustarTamano();
  let antes = performance.now();
  r.setAnimationLoop(() => {
    const ahora = performance.now();
    const real = Math.min(Math.max((ahora - antes) / 1000, 0), 0.1); antes = ahora;
    E.reloj += real;
    const dt = ahora < E.pausaGolpeHasta ? real * 0.06 : real;
    if (E.alActualizar) E.alActualizar(dt, real);
    actualizar(dt, real);
    pintar(r);
    if (E.alDibujar) E.alDibujar(real); // etiquetas de las palabras, ya con la cámara de este fotograma
  });
  Object.assign(window, { renderer: r, scene: E.escena });
  return E;
}

// Carga lo necesario para empezar (Lumi y el primer mundo).
export async function precargar(tema, alProgreso) {
  await cargarVarios(['mago', ...modelosTema(tema)], alProgreso);
  montarHeroe();
}
export function modelosTema(tema) {
  const T = TEMAS[tema];
  const props = new Set();
  for (const p of T.props) for (const m of p.m) props.add(m);
  for (const p of T.fijos || []) props.add(p.m);
  return [...props, ...MONSTRUOS_TEMA[tema], 'jefe-' + tema];
}
export async function prepararTema(nombre, alProgreso) {
  await cargarVarios(['mago', ...modelosTema(nombre)], alProgreso);
  montarHeroe();
  const nuevo = E.tema !== nombre || !E.entorno;
  tema(nombre);
  if (nuevo) await precompilar();
}

// ---------- Look retro: pixelado + CRT (solo el dibujo 3D; los menús son HTML y no cambian) ----------
// La escena se dibuja pequeña (un píxel por píxel retro) y un pase final a la resolución REAL de la pantalla pinta cada
// píxel retro con un número ENTERO de píxeles (RETRO.kd), con líneas de barrido y franjas RGB exactas (sin moiré).
// Ese pase lo hace el propio juego y no el navegador: Safari (iPhone/iPad) no respeta «image-rendering: pixelated» en
// los lienzos WebGL y emborrona la imagen. Para que el pase sea barato, con el look retro el lienzo se crea SIN
// suavizado ni profundidad propios (ver iniciar): por eso activarlo o quitarlo recarga la página.
const RETRO_MSAA = 4;   // suavizado de la imagen pequeña (muy barato: es poca resolución)
const RETRO = { activo: false, verificar: 0, sinMsaa: false, comp: null, uni: null, escena: null, cam: null, w: 2, h: 2, kd: 3 };
const CRT_FRAG = `
uniform sampler2D tDiffuse; uniform vec2 baja; uniform float kd;
// Todo está compensado para que el brillo medio no cambie: solo se reparte distinto dentro de cada píxel.
void main() {
  vec2 pos = gl_FragCoord.xy;                                // píxeles reales de pantalla
  vec2 cel = floor(pos / kd);                                // píxel retro al que pertenece
  vec3 c = texture2D(tDiffuse, (cel + 0.5) / baja).rgb;
  float n = fract(52.9829189 * fract(dot(cel, vec2(0.06711056, 0.00583715))));
  c = floor(c * 63.0 + n) / 63.0;                            // 6 bits por canal con tramado
  vec2 f = fract(pos / kd);
  float sl = 1.0 + 0.3 * (sin(f.y * 3.14159265) - 0.63662);  // líneas de barrido suaves (media 1)
  vec3 m = vec3(1.0);
  if (mod(kd, 3.0) < 0.5) { float sub = floor(f.x * 3.0); m += 0.18 * (vec3(float(sub < 0.5), float(sub > 0.5 && sub < 1.5), float(sub > 1.5)) - 0.33333); } // franjas RGB (media 1)
  gl_FragColor = vec4(clamp(c * sl * m, 0.0, 1.0), 1.0);
}`;
function prepararRetro() {
  if (RETRO.uni) return;
  RETRO.uni = { tDiffuse: { value: null }, baja: { value: new THREE.Vector2(2, 2) }, kd: { value: 3 } };
  const mat = new THREE.ShaderMaterial({ uniforms: RETRO.uni, vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: CRT_FRAG, depthTest: false, depthWrite: false, toneMapped: false });
  RETRO.escena = new THREE.Scene(); RETRO.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); q.frustumCulled = false; RETRO.escena.add(q);
  if (!E.compositor) { // sin efectos de imagen: un compositor mínimo (8 bits) que deja la imagen con su color final
    RETRO.comp = new EffectComposer(E.renderer, new THREE.WebGLRenderTarget(2, 2, { type: THREE.UnsignedByteType, samples: RETRO_MSAA }));
    RETRO.comp.addPass(new RenderPass(E.escena, E.camara));
    RETRO.comp.addPass(new OutputPass());
  }
}
// Solo se llama al arrancar (con el lienzo ya creado para el look retro).
export function retro(si) {
  if (!si || RETRO.activo || !E.renderer) return;
  prepararRetro();
  RETRO.activo = true; E.retro = true; RETRO.verificar = 3;
  ajustarTamano();
}
// Comprobación de seguridad: en algunos dispositivos los objetivos de dibujo con MSAA no funcionan y la imagen no se
// dibuja. Si pasa, primero se prueba sin MSAA y, si sigue sin ir, se avisa para apagar el look retro (y recargar).
function verificarRetro(comp) {
  const r = E.renderer, gl = r.getContext();
  r.setRenderTarget(comp.readBuffer);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE && !gl.getError();
  r.setRenderTarget(null);
  if (ok) return;
  if (comp.renderTarget1.samples > 0) {
    for (const rt of [comp.renderTarget1, comp.renderTarget2]) { rt.samples = 0; rt.dispose(); }
    RETRO.verificar = 2; RETRO.sinMsaa = true;
  } else { console.warn('look retro no disponible en este dispositivo'); RETRO.activo = false; if (E.alFalloRetro) E.alFalloRetro(); }
}
function pintar(r) {
  if (!RETRO.activo) { if (E.compositor) E.compositor.render(); else r.render(E.escena, E.camara); return; }
  const comp = E.compositor || RETRO.comp;
  comp.render();
  if (RETRO.verificar > 0 && --RETRO.verificar === 0) verificarRetro(comp);
  RETRO.uni.tDiffuse.value = comp.readBuffer.texture;
  r.setRenderTarget(null); r.render(RETRO.escena, RETRO.cam);
}

// Zoom de la página respecto a la pantalla (1 = normal; 0,5 = alejada al 50 %). Safari en iPhone con el zoom de página
// reducido («Aa» → 50 %) da un ancho de 780 px web en una pantalla de 390 puntos pero mantiene devicePixelRatio = 3: sin
// esta corrección el lienzo tenía el doble de píxeles por lado de los que la pantalla puede mostrar (4 veces el trabajo).
function zoomPagina() {
  // Solo en pantallas táctiles: en el ordenador el zoom del navegador ya cambia devicePixelRatio (y la ventana puede
  // estar en otro monitor o no tener pantalla real, como en las pruebas sin ventana).
  if (!(matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches)) return 1;
  const sMin = Math.min(screen.width || 0, screen.height || 0), iMin = Math.min(innerWidth, innerHeight);
  return sMin > 0 && iMin > sMin * 1.05 ? Math.max(0.25, sMin / iMin) : 1;
}
function ajustarTamano() {
  const w = innerWidth, h = innerHeight, asp = w / h;
  E.camara.aspect = asp;
  const hfov = (asp < 0.9 ? 47 : 58) * Math.PI / 180;
  const vfov = Math.max(50, (2 * Math.atan(Math.tan(hfov / 2) / asp)) * 180 / Math.PI);
  E.camara.fov = Math.min(vfov, 76);
  E.camara.updateProjectionMatrix();
  const r = E.renderer, z = zoomPagina(), dpr = (window.devicePixelRatio || 1) * z;
  // Look retro: la imagen final se pinta a la resolución real de la pantalla (hasta x3). Sin él, el límite de
  // calidad va en puntos de pantalla, así que con la página alejada no se dibujan más píxeles de los necesarios.
  r.setPixelRatio(RETRO.activo ? Math.min(dpr, 3) : E.pixelRatioBase * z);
  r.setSize(w, h, false);
  const pr = r.getPixelRatio(), comp = E.compositor || RETRO.comp;
  let escalaPx;
  if (RETRO.activo) {
    const bw = Math.round(w * pr), bh = Math.round(h * pr);
    const tactil = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
    if (tactil || w < 700 || h < 480) {
      // Móvil y tablet: unas 240 líneas retro en el lado corto (como en un ordenador), para que el efecto se vea en una
      // pantalla tan densa (en un iPhone, 6 píxeles de pantalla = 2 px web por píxel retro). Múltiplo de 3 si es grande,
      // para que quepan las franjas RGB.
      const k = Math.min(bw, bh) / 240;
      RETRO.kd = k >= 4.5 ? Math.round(k / 3) * 3 : Math.max(3, Math.round(k));
    } else RETRO.kd = Math.max(3, Math.round(bh / 1080) * 3); // ordenador: 3 píxeles (6 en pantallas muy grandes)
    RETRO.w = Math.max(2, Math.ceil(bw / RETRO.kd)); RETRO.h = Math.max(2, Math.ceil(bh / RETRO.kd));
    // MSAA a baja resolución; en el compositor de «Bonitos» solo si la tarjeta lo permite con texturas de coma flotante.
    const msaa = RETRO.sinMsaa ? 0 : comp === RETRO.comp || r.extensions.has('EXT_color_buffer_float') ? RETRO_MSAA : 0;
    for (const rt of [comp.renderTarget1, comp.renderTarget2]) if (rt.samples !== msaa) { rt.samples = msaa; rt.dispose(); }
    comp.renderToScreen = false;
    comp.setPixelRatio(1); comp.setSize(RETRO.w, RETRO.h);
    if (E.fxaa) E.fxaa.enabled = false; // el FXAA sobre una imagen pequeña la emborrona
    RETRO.uni.baja.value.set(RETRO.w, RETRO.h); RETRO.uni.kd.value = RETRO.kd;
    escalaPx = RETRO.h * 0.55;
  } else {
    if (E.compositor) {
      comp.setPixelRatio(pr); comp.setSize(w, h);
      if (E.fxaa) { E.fxaa.enabled = true; E.fxaa.material.uniforms.resolution.value.set(1 / (w * pr), 1 / (h * pr)); }
    }
    escalaPx = h * 0.55 * pr;
  }
  if (P.puntos) P.puntos.material.uniforms.escalaPx.value = escalaPx;
  // Las partículas de ambiente (PointsMaterial) se miden con el tamaño del lienzo: se corrigen si se dibujan en otro objetivo.
  E.escalaAmbiente = escalaPx / (pr * h * 0.55);
  if (E.ambiente) E.ambiente.puntos.material.size = E.ambiente.puntos.material.userData.base * E.escalaAmbiente;
  E.vertical = asp < 0.9;
  vista(E.vista, true);
}

// ---------- vistas de cámara ----------
export function vista(v, inmediato = false) {
  E.vista = v;
  const vert = E.vertical;
  if (v === 'menu') { E.camPosObj.set(vert ? 0.6 : 1.4, vert ? 2.3 : 2.2, vert ? 8.4 : 7.8); E.camMiraObj.set(vert ? 0.2 : 2.5, vert ? -0.2 : 1.3, 1.4); }
  else if (v === 'titulo') { E.camPosObj.set(0.4, 2.0, vert ? 8.6 : 7.4); E.camMiraObj.set(0, vert ? -0.4 : -0.1, 1.4); }
  else if (v === 'resultado') { E.camPosObj.set(vert ? 0 : 1.4, 2.2, vert ? 10.5 : 7.8); E.camMiraObj.set(vert ? 0 : 2.5, vert ? -1.6 : 1.3, 1.4); } // Lumi entera arriba (móvil) o a la izquierda, con las ventanas debajo o a la derecha
  else if (v === 'multi') {
    // Cuatro carriles a lo ancho: la cámara se aleja justo lo necesario para que los 4 carriles ocupen el ancho de la pantalla
    // (cada uno, un cuarto), y mira un poco por encima para que los magos queden sobre los botones de cada jugador.
    const zh = Z_HEROE, tanV = Math.tan((E.camara.fov * Math.PI / 180) / 2), d = (MULTI_MEDIO / (tanV * E.camara.aspect));
    E.camPosObj.set(0, 6.2 + d * 0.12, zh + d); E.camMiraObj.set(0, 1.7, zh - 7);
  }
  else if (v === 'final') { E.camPosObj.set(vert ? 0 : 1.2, vert ? 1.8 : 1.4, vert ? 11.5 : 8.2); E.camMiraObj.set(vert ? 0 : 2.4, vert ? -1.4 : 3.2, 1.4); } // fiesta: Lumi abajo y el cielo con los fuegos artificiales
  else if (v === 'jefe') {
    if (jefePanoramico()) colocarVistaJefe();
    else { E.camPosObj.set(0, vert ? 4.4 : 3.8, vert ? 13 : 10.5); E.camMiraObj.set(0, vert ? 4.6 : 5.2, -12); encuadrarJefe(); }
  } // desde abajo: el jefe impone
  else { E.camPosObj.set(0, vert ? 5.6 : 5.6, vert ? 10.4 : 10.2); E.camMiraObj.set(0, vert ? 3.4 : -1.5, -9); } // vertical: Lumi abajo, justo sobre los botones
  if (inmediato) { E.camPos.copy(E.camPosObj); E.camMira.copy(E.camMiraObj); }
  ocultarDecorado(v === 'jefe' && jefePanoramico());
}
// Cámaras panorámicas de los jefes (solo ordenador; se pueden quitar en Opciones). Cada pregunta del jefe usa la siguiente: dan la
// vuelta alrededor de la escena, siempre elevadas y con Lumi y el jefe a la vez para apreciar la diferencia de tamaño.
// p = posición de la cámara, m = punto al que mira. Antes de usar una, se comprueba que Lumi y el jefe se ven enteros
// (ni detrás del panel ni de los botones de respuesta, ni fuera de la pantalla); si no, se salta a la siguiente.
const VISTAS_JEFE = [
  { p: [30, 12, -8], m: [0, 7.5, -8] },     // de lado, derecha
  { p: [22, 13, 12], m: [0, 6, -9] },       // tres cuartos, por delante a la derecha
  { p: [0, 22, 13], m: [0, 4, -8] },        // desde arriba, por detrás de Lumi
  { p: [-22, 13, 12], m: [0, 6, -9] },      // tres cuartos, por delante a la izquierda
  { p: [-30, 12, -8], m: [0, 7.5, -8] },    // de lado, izquierda
  { p: [18, 10, -32], m: [0, 5, -4] },      // por detrás del jefe: él cerca, Lumi pequeña al fondo
];
E.vistaJefe = 0;
export function siguienteVistaJefe() {
  if (E.vista !== 'jefe' || !jefePanoramico()) return;
  E.vistaJefe = (E.vistaJefe + 1) % VISTAS_JEFE.length;
  colocarVistaJefe();
  ocultarDecorado(true);
}
function medidasJefe() {
  const panel = document.getElementById('hud-centro'), rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  // Borde inferior de la barra de vida del jefe (si aún no se ve, el del panel más lo que ocupará la barra).
  const hj = document.getElementById('hud-jefe'), rj = hj ? hj.getBoundingClientRect() : null;
  const limite = rj && rj.height ? rj.bottom + 10 : (panel ? panel.getBoundingClientRect().bottom : 0) + 4 * rem + 10;
  const hb = document.querySelector('.hechizos'), rb = hb ? hb.getBoundingClientRect() : null;
  return { limite, botones: rb && rb.height ? rb.top : innerHeight };
}
function colocarVistaJefe() {
  const j = E.jefe, n = VISTAS_JEFE.length;
  if (!E.camara) return;
  const { limite, botones } = medidasJefe();
  _camJ.fov = E.camara.fov; _camJ.aspect = E.camara.aspect; _camJ.near = 0.1; _camJ.far = 400; _camJ.updateProjectionMatrix();
  const W = innerWidth, zH = E.heroe.grupo.position.z, zB = j ? j.g.position.z : -17;
  const pt = (v, dy, y, z) => { // pantalla (x, y) de un punto del eje del camino con la cámara de la vista v
    _camJ.position.set(v.p[0], v.p[1], v.p[2]); _camJ.lookAt(v.m[0], v.m[1] + dy, v.m[2]); _camJ.updateMatrixWorld();
    _vJ.set(0, y, z).project(_camJ); return [(_vJ.x * 0.5 + 0.5) * W, (-_vJ.y * 0.5 + 0.5) * innerHeight, _vJ.z];
  };
  const evaluar = (v) => {
    if (!j) return { dy: 0, esc: 1 };
    let dy = 0;
    // Los pies de Lumi y del jefe, por encima de los botones (se baja la mirada, y la imagen sube).
    while (Math.max(pt(v, dy, 0, zH)[1], pt(v, dy, 0, zB)[1]) > botones - 8 && dy > -8) dy -= 0.25;
    if (Math.max(pt(v, dy, 0, zH)[1], pt(v, dy, 0, zB)[1]) > botones - 8) return null;
    // La cabeza del jefe, por debajo del panel y la barra de vida: si no cabe, el jefe se reduce un poco (hasta 0,7).
    let esc = 1;
    while (pt(v, dy, j.cima * esc, zB)[1] < limite && esc > 0.7) esc -= 0.02;
    if (pt(v, dy, j.cima * esc, zB)[1] < limite) return null;
    // Lumi y el jefe, dentro de la pantalla y delante de la cámara.
    for (const [y, z, h] of [[2.6, zH, 0], [j.cima * esc, zB, 0], [0, zB, 0]]) { const q = pt(v, dy, y, z); if (q[2] > 1 || q[0] < 40 || q[0] > W - 40) return null; }
    return { dy, esc };
  };
  for (let k = 0; k < n; k++) {
    const idx = (E.vistaJefe + k) % n, v = VISTAS_JEFE[idx], r = evaluar(v);
    if (!r) continue;
    E.vistaJefe = idx;
    E.camPosObj.set(v.p[0], v.p[1], v.p[2]); E.camMiraObj.set(v.m[0], v.m[1] + r.dy, v.m[2]);
    if (j) j.escalaFit = r.esc;
    return;
  }
  const v = VISTAS_JEFE[0]; E.camPosObj.set(...v.p); E.camMiraObj.set(...v.m); if (j) j.escalaFit = 1; // ninguna cumple: la primera tal cual
}
// El decorado que quedaría entre la cámara y Lumi o el jefe (árboles, rocas…) se oculta para no taparlos.
function distSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}
function ocultarDecorado(activo) {
  if (!E.deslizables) return;
  if (E.multi) activo = true;
  const c = E.camPosObj, zH = E.heroe.grupo.position.z, zB = E.jefe ? E.jefe.g.position.z : -17;
  for (const o of E.deslizables) {
    let h = false;
    if (activo && (E.multi || !(o.userData.modelo || '').startsWith('piedra'))) { // el bordillo es bajo: se queda (salvo en multijugador)
      const x = o.position.x, z = o.position.z;
      h = E.multi ? Math.abs(x) < 13.5 : distSeg(x, z, c.x, c.z, 0, zH) < 4.5 || distSeg(x, z, c.x, c.z, 0, zB) < 7;
    }
    o.userData.oculto = h; o.visible = !h;
  }
  actualizarLotes();
}
E.camJefePano = true;
export function camaraJefe(si) { E.camJefePano = !!si; if (E.camara) vista(E.vista); }
function jefePanoramico() {
  const tactil = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
  return E.camJefePano && !E.vertical && !tactil;
}
// Vista clásica del jefe: la cámara ajusta la mirada y, si hace falta, el tamaño del jefe, para que su cabeza no quede tapada por el
// panel de la pregunta ni por la barra de vida, y (en horizontal) para que Lumi no quede detrás de los botones de respuesta.
const _camJ = new THREE.PerspectiveCamera(), _vJ = new THREE.Vector3();
function encuadrarJefe() {
  const j = E.jefe;
  if (!j || E.vista !== 'jefe' || !E.camara) return;
  if (jefePanoramico()) { colocarVistaJefe(); ocultarDecorado(true); return; }
  const { limite, botones } = medidasJefe();
  _camJ.fov = E.camara.fov; _camJ.aspect = E.camara.aspect; _camJ.near = 0.1; _camJ.far = 400; _camJ.updateProjectionMatrix();
  const y2d = (y, z, dy) => {
    _camJ.position.set(E.camPosObj.x, E.camPosObj.y, E.camPosObj.z); _camJ.lookAt(E.camMiraObj.x, E.camMiraObj.y + dy, E.camMiraObj.z); _camJ.updateMatrixWorld();
    _vJ.set(0, y, z).project(_camJ); return (-_vJ.y * 0.5 + 0.5) * innerHeight;
  };
  const zH = E.heroe.grupo.position.z;
  let dy = 0, esc = 1;
  if (E.vertical) { // móvil: hay hueco, se baja el jefe todo lo posible sin tapar a Lumi
    while (y2d(j.cima, j.g.position.z, dy) < limite && dy < 6) dy += 0.25;
  } else { // horizontal clásico: se sube la imagen hasta que los pies de Lumi quedan sobre los botones
    // (sin hacer al jefe más pequeño que ~9 m: si no cabe todo, Lumi se queda un poco tapada y el jefe manda)
    while (y2d(0.5, zH, dy) > botones - 4 && dy > -4 && y2d(j.cima * 0.74, j.g.position.z, dy - 0.25) >= limite) dy -= 0.25;
  }
  while (y2d(j.cima * esc, j.g.position.z, dy) < limite && esc > 0.4) esc -= 0.02;
  E.camMiraObj.y += dy; j.escalaFit = esc;
}
export function temblor(t) { E.trauma = Math.min(1, E.trauma + t); }
export function pausaGolpe(seg) { E.pausaGolpeHasta = Math.max(E.pausaGolpeHasta, performance.now() + seg * 1000); }

// ---------- mundos ----------
// props: grupos de modelos que se reparten a los lados del camino (se deslizan con el mundo).
// fijos: piezas de fondo que no se mueven.
const TEMAS = {
  pradera: {
    cielo: ['#3aa7ff', '#bfeaff', '#e9fbff'], niebla: '#cdeeff', nieblaD: [35, 110], suelo: ['#6fbf48', '#4f9e33'], camino: ['#e4c88d', '#b9925a'], tipoCamino: 'camino',
    hemi: ['#ffffff', '#5a7a3a', 1.0], sol: 3.0, solColor: '#fff4e0', amb: { color: '#ffd6f0', n: 70, modo: 'petalos' },
    props: [
      { m: ['arbol-1', 'arbol-2', 'arbol-3', 'arbol-4', 'arbol-5'], n: 26, alto: [5, 7.5], x: [6.5, 20] },
      { m: ['arbusto-1', 'arbusto-2'], n: 22, alto: [0.9, 1.5], x: [4.6, 12] },
      { m: ['flor-1', 'flor-2', 'flor-3', 'flor-4'], n: 50, alto: [0.45, 0.8], x: [4.4, 11] },
      { m: ['hierba-1', 'hierba-2', 'hierba-3'], n: 40, alto: [0.4, 0.8], x: [4.3, 13] },
      { m: ['seta-1'], n: 8, alto: [0.4, 0.7], x: [4.5, 9] },
      { m: ['roca-1', 'roca-2', 'piedra-1'], n: 10, alto: [0.5, 1.4], x: [4.8, 14] },
    ],
    fijos: [{ m: 'molino', x: -24, z: -48, alto: 10, ry: 0.6 }, { m: 'casa-1', x: 22, z: -40, alto: 5, ry: -0.8 }, { m: 'casa-2', x: 28, z: -58, alto: 5, ry: -1.2 }, { m: 'montanas', x: -10, z: -110, alto: 26, ry: 0 }, { m: 'montana-2', x: 40, z: -95, alto: 24, ry: 2 }],
  },
  bosque: {
    cielo: ['#101d3d', '#2f5a78', '#4c7f8c'], niebla: '#3b6676', nieblaD: [22, 95], suelo: ['#2f6040', '#1d4a2e'], camino: ['#7a6448', '#4a3a28'], tipoCamino: 'camino',
    hemi: ['#9fd8ff', '#1b3326', 0.8], sol: 1.6, solColor: '#cfe6ff', amb: { color: '#d9ff7a', n: 90, modo: 'luciernagas' },
    props: [
      { m: ['pino-1', 'pino-2', 'pino-3', 'pino-4'], n: 30, alto: [7, 11], x: [6, 22] },
      { m: ['retorcido-1', 'retorcido-2', 'retorcido-3'], n: 10, alto: [5, 7], x: [6.5, 16] },
      { m: ['seta-1', 'seta-2'], n: 20, alto: [0.5, 1.1], x: [4.4, 10] },
      { m: ['helecho', 'planta-1', 'planta-2'], n: 34, alto: [0.7, 1.4], x: [4.4, 13] },
      { m: ['roca-1', 'roca-3'], n: 10, alto: [0.7, 1.6], x: [4.8, 14] },
    ],
    fijos: [],
  },
  desierto: {
    cielo: ['#ff9a5a', '#ffd8a0', '#fff1d0'], niebla: '#ffe2b3', nieblaD: [35, 120], suelo: ['#ecc074', '#d9a352'], camino: ['#d6995a', '#a8703a'], tipoCamino: 'losas',
    hemi: ['#fff3e0', '#a86b2e', 1.0], sol: 3.2, solColor: '#ffe2b8', amb: { color: '#ffe0a0', n: 80, modo: 'arena' },
    props: [
      { m: ['palmeras'], n: 9, alto: [6, 8], x: [7, 20] },
      { m: ['muerto-1', 'muerto-2', 'muerto-3'], n: 10, alto: [3.5, 5.5], x: [6, 16] },
      { m: ['rocas-oscuras', 'roca-1', 'roca-2', 'roca-3'], n: 18, alto: [0.8, 2.6], x: [4.8, 16] },
      { m: ['piedra-1', 'piedra-2'], n: 16, alto: [0.25, 0.5], x: [4.3, 9] },
    ],
    fijos: [{ m: 'templo', x: 26, z: -70, alto: 14, ry: -0.6 }, { m: 'montana-3', x: -40, z: -100, alto: 20, ry: 1 }],
  },
  nieve: {
    cielo: ['#5aa6f0', '#cfe8ff', '#f4faff'], niebla: '#e6f2ff', nieblaD: [28, 100], suelo: ['#f2f7ff', '#cfdcee'], camino: ['#c6d7ec', '#8ea8c8'], tipoCamino: 'camino',
    hemi: ['#ffffff', '#8ea8c8', 1.0], sol: 2.4, solColor: '#ffffff', amb: { color: '#ffffff', n: 170, modo: 'nieve' },
    props: [
      { m: ['pino-1', 'pino-2', 'pino-3', 'pino-4'], n: 30, alto: [6, 10], x: [6, 22] },
      { m: ['muerto-4', 'muerto-2'], n: 8, alto: [4, 6], x: [6, 15] },
      { m: ['roca-1', 'roca-2', 'roca-3'], n: 14, alto: [0.8, 2], x: [4.8, 14] },
    ],
    fijos: [{ m: 'montana-1', x: -30, z: -95, alto: 30, ry: 0 }, { m: 'montana-2', x: 25, z: -105, alto: 28, ry: 1 }, { m: 'montanas', x: 0, z: -125, alto: 26, ry: 0 }],
    nevado: true,
  },
  castillo: {
    cielo: ['#1a0b33', '#5b2363', '#b2486b'], niebla: '#5a2a5e', nieblaD: [24, 100], suelo: ['#3c3452', '#2b243d'], camino: ['#6a6182', '#3e3654'], tipoCamino: 'losas',
    hemi: ['#d7b8ff', '#2a1838', 0.8], sol: 1.8, solColor: '#ffc6e0', amb: { color: '#ffae5a', n: 90, modo: 'brasas' },
    props: [
      { m: ['torre-1', 'torre-2'], n: 8, alto: [9, 12], x: [9, 16] },
      { m: ['muerto-1', 'muerto-3', 'muerto-4'], n: 14, alto: [4, 6], x: [5.5, 14] },
      { m: ['retorcido-1', 'retorcido-2'], n: 6, alto: [4, 6], x: [7, 15] },
      { m: ['rocas-oscuras', 'roca-3'], n: 12, alto: [0.8, 2.2], x: [4.8, 14] },
    ],
    fijos: [{ m: 'castillo', x: 0, z: -95, alto: 30, ry: 0 }, { m: 'puerta-castillo', x: -16, z: -55, alto: 9, ry: 0.4 }, { m: 'muralla', x: 18, z: -60, alto: 7, ry: -0.5 }],
  },
};

function rngSemilla(s) { return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const Z_FIN = 12, LARGO = 72; // el decorado móvil vive entre z = 12 y z = -60
const LARGO_FILA = 112;       // el bordillo llega más lejos (hasta z = -100, el final del camino): se ve desde las cámaras de los jefes

function liberarGrupo(g) {
  g.traverse((o) => {
    if (o.userData.propio && o.geometry) o.geometry.dispose();
    if (o.isInstancedMesh) o.dispose();
  });
}

// Decorado agrupado: todas las copias de un mismo modelo (piedras del bordillo, árboles, rocas…) se dibujan con una
// sola malla instanciada por pieza del modelo. Antes cada copia era una llamada de dibujo (y otra para la sombra):
// unas 280 por fotograma, demasiadas para Safari en el iPhone. Las copias siguen existiendo como objetos sueltos (sin
// añadir a la escena) para moverlas igual que antes; actualizarLotes() copia sus posiciones a las instancias.
E.lotes = [];
function instanciarDecorado(g, marcar) {
  const grupos = new Map();
  for (const o of g.children) {
    const k = o.userData.modelo;
    if (!k || o.userData.fijo) continue;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(o);
  }
  E.lotes = [];
  const copias = [];
  for (const [k, lista] of grupos) {
    const plantilla = yaCargado(k.split('|')[0]);
    if (!plantilla || lista.length < 2) continue;
    const tpl = plantilla.scene; tpl.updateMatrixWorld(true);
    const inv = tpl.matrixWorld.clone().invert(), mT = [], mC = [];
    tpl.traverse((c) => { if (c.isMesh) mT.push(c); });
    lista[0].traverse((c) => { if (c.isMesh) mC.push(c); });
    if (mT.length !== mC.length || mT.some((m) => m.isSkinnedMesh)) continue;
    const partes = mT.map((m, i) => {
      const im = new THREE.InstancedMesh(m.geometry, mC[i].material, lista.length);
      im.castShadow = mC[i].castShadow; im.receiveShadow = true;
      im.frustumCulled = false; // el decorado ocupa todo el camino: no compensa recortarlo
      g.add(marcar(im));
      return { im, rel: inv.clone().multiply(m.matrixWorld) };
    });
    for (const o of lista) { g.remove(o); copias.push(o); }
    E.lotes.push({ copias: lista, partes });
  }
  return copias;
}
// Piezas fijas del fondo (molino, casas, montañas, templo, castillo…): no se mueven, así que todas sus mallas se funden
// en una sola por material (cada modelo trae muchas piezas: eran ~70 llamadas de dibujo solo en la pradera).
function fusionarFijos(g, marcar) {
  const porMat = new Map(), originales = [];
  g.updateMatrixWorld(true);
  for (const o of g.children) {
    if (!o.userData.fusionar) continue;
    let valido = true; const mallas = [];
    o.traverse((c) => { if (c.isSkinnedMesh || c.isInstancedMesh || c.isPoints || c.isLine) valido = false; else if (c.isMesh) mallas.push(c); });
    if (!valido) continue;
    originales.push(o);
    for (const m of mallas) {
      const gm = m.geometry, k = m.material.uuid + '|' + Object.keys(gm.attributes).sort().join(',') + '|' + (gm.index ? 'i' : 'n') + '|' + m.castShadow;
      if (!porMat.has(k)) porMat.set(k, { mat: m.material, sombra: m.castShadow, geos: [] });
      porMat.get(k).geos.push(gm.clone().applyMatrix4(m.matrixWorld));
    }
  }
  const nuevas = [];
  for (const { mat, sombra, geos } of porMat.values()) {
    const fusion = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (!fusion) { for (const x of nuevas) x.geometry.dispose(); for (const x of geos) x.dispose(); return; } // no se pudo: se deja como estaba
    if (geos.length > 1) for (const x of geos) x.dispose();
    const m = new THREE.Mesh(fusion, mat); m.castShadow = sombra; m.receiveShadow = true; m.userData.propio = true;
    nuevas.push(m);
  }
  for (const o of originales) g.remove(o);
  for (const m of nuevas) g.add(marcar(m));
}
const _mL = new THREE.Matrix4(), _mCero = new THREE.Matrix4().makeScale(0, 0, 0);
function actualizarLotes() {
  for (const L of E.lotes) {
    for (let i = 0; i < L.copias.length; i++) {
      const o = L.copias[i]; o.updateMatrix();
      const oculto = o.userData.oculto;
      for (const p of L.partes) { if (oculto) p.im.setMatrixAt(i, _mCero); else { _mL.multiplyMatrices(o.matrix, p.rel); p.im.setMatrixAt(i, _mL); } }
    }
    for (const p of L.partes) p.im.instanceMatrix.needsUpdate = true;
  }
}

export function tema(nombre) {
  if (E.tema === nombre && E.entorno) return;
  E.tema = nombre;
  const T = TEMAS[nombre];
  if (E.entorno) { E.escena.remove(E.entorno); liberarGrupo(E.entorno); }
  if (E.ambiente) { E.escena.remove(E.ambiente.puntos); E.ambiente.puntos.geometry.dispose(); }
  const g = new THREE.Group();
  E.entorno = g;
  E.escena.fog = new THREE.Fog(T.niebla, T.nieblaD[0], T.nieblaD[1]);
  E.hemi.color.set(T.hemi[0]); E.hemi.groundColor.set(T.hemi[1]); E.hemi.intensity = T.hemi[2];
  E.sol.intensity = T.sol; E.sol.color.set(T.solColor);
  const r = rngSemilla(nombre.length * 7919 + 13);
  const marcar = (o) => { o.userData.fijo = true; return o; };
  // Cielo con degradado.
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { a: { value: new THREE.Color(T.cielo[0]) }, b: { value: new THREE.Color(T.cielo[1]) }, c: { value: new THREE.Color(T.cielo[2]) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 a; uniform vec3 b; uniform vec3 c; varying vec3 vP; void main(){ float h = vP.y; vec3 col = h > 0.0 ? mix(b, a, pow(clamp(h*1.6,0.0,1.0), 0.8)) : mix(b, c, clamp(-h*4.0,0.0,1.0)); gl_FragColor = vec4(col,1.0); }',
  }));
  cielo.renderOrder = -10; cielo.userData.propio = true;
  g.add(marcar(cielo));
  // Suelo lejano con colinas (fijo) y franja cercana con textura que se desplaza.
  const geoT = new THREE.PlaneGeometry(260, 260, 90, 90); geoT.rotateX(-Math.PI / 2);
  const pt = geoT.attributes.position, colores = [];
  const c1 = new THREE.Color(T.suelo[0]), c2 = new THREE.Color(T.suelo[1]);
  for (let i = 0; i < pt.count; i++) {
    const x = pt.getX(i), z = pt.getZ(i);
    const lejos = Math.min(1, Math.max(0, (Math.abs(x) - 16) / 22));
    const h = (Math.sin(x * 0.07) * Math.cos(z * 0.05) * 5 + Math.sin(x * 0.17 + z * 0.11) * 2.2 + 2.5) * lejos;
    pt.setY(i, h - 0.05);
    const k = 0.5 + 0.5 * Math.sin(x * 0.31) * Math.cos(z * 0.23);
    const c = c1.clone().lerp(c2, k * 0.8);
    if (T.nevado && h > 3) c.lerp(new THREE.Color('#ffffff'), 0.7);
    colores.push(c.r, c.g, c.b);
  }
  geoT.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
  geoT.computeVertexNormals();
  const terreno = new THREE.Mesh(geoT, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  terreno.position.z = -40; terreno.receiveShadow = true; terreno.userData.propio = true;
  g.add(marcar(terreno));
  const texS = texturaSuelo(T.suelo[0], T.suelo[1], nombre === 'nieve' ? 'nieve' : 'hierba', 3);
  // El camino y la franja de hierba llegan hasta 80 m detrás de Lumi (z de -100 a 80), para que se vean enteros desde las cámaras
  // panorámicas de los jefes. La textura mantiene su tamaño (cada repetición = 120/22 m) y se desliza igual que antes.
  const LARGO_SUELO = 180, Z_CENTRO_SUELO = -10;
  texS.repeat.set(6, 22 * LARGO_SUELO / 120);
  const franja = new THREE.Mesh(new THREE.PlaneGeometry(34, LARGO_SUELO), new THREE.MeshStandardMaterial({ map: texS, roughness: 0.95 }));
  franja.rotation.x = -Math.PI / 2; franja.position.set(0, 0.0, Z_CENTRO_SUELO); franja.receiveShadow = true; franja.userData.propio = true;
  g.add(marcar(franja));
  const texC = texturaSuelo(T.camino[0], T.camino[1], T.tipoCamino, 7);
  texC.repeat.set(1.2, 24 * LARGO_SUELO / 120);
  const camino = new THREE.Mesh(new THREE.PlaneGeometry(7.4, LARGO_SUELO), new THREE.MeshStandardMaterial({ map: texC, roughness: 0.9 }));
  E.caminoMesh = camino; camino.rotation.x = -Math.PI / 2; camino.position.set(0, 0.02, Z_CENTRO_SUELO); camino.receiveShadow = true; camino.userData.propio = true;
  g.add(marcar(camino));
  E.suelos = [{ t: texS, largo: 120 / 22 }, { t: texC, largo: 120 / 24 }];
  // Bordillos de piedra a los dos lados (en fila, se desplazan).
  if (yaCargado('piedra-1')) for (let i = 0; i < LARGO_FILA / 1.4; i++) for (const s of [-1, 1]) {
    const p = copiaEstatica(i % 2 ? 'piedra-1' : 'piedra-2', 0.35 + r() * 0.2, false);
    if (!p) continue;
    p.position.set(s * (3.85 + r() * 0.25), 0, Z_FIN - i * 1.4); p.rotation.y = r() * 6; p.userData.fila = true; p.userData.largo = LARGO_FILA;
    p.userData.modelo = i % 2 ? 'piedra-1' : 'piedra-2'; g.add(p);
  }
  // Bordillos fijos detrás de Lumi (no se ven en la partida: quedan detrás de la cámara; sí desde las cámaras de los jefes).
  if (yaCargado('piedra-1')) for (let z = Z_FIN + 1.4, i = 0; z < 60; z += 1.4, i++) for (const s of [-1, 1]) {
    const p = copiaEstatica(i % 2 ? 'piedra-1' : 'piedra-2', 0.35 + r() * 0.2, false);
    if (!p) continue;
    p.position.set(s * (3.85 + r() * 0.25), 0, z); p.rotation.y = r() * 6; g.add(marcar(p));
  }
  // Decorado a los lados.
  const cantidad = E.calidad === 'baja' ? 0.45 : 1;
  const matNieve = new Map(); // un solo material nevado por material original (para poder agruparlos)
  for (const grupo of T.props) {
    const n = Math.round(grupo.n * cantidad);
    for (let i = 0; i < n; i++) {
      const nom = grupo.m[Math.floor(r() * grupo.m.length)];
      const alto = grupo.alto[0] + r() * (grupo.alto[1] - grupo.alto[0]);
      const o = copiaEstatica(nom, alto, alto > 1.2);
      if (!o) continue;
      const lado = r() < 0.5 ? -1 : 1;
      o.position.set(lado * (grupo.x[0] + Math.pow(r(), 1.3) * (grupo.x[1] - grupo.x[0])), 0, Z_FIN - r() * LARGO);
      o.rotation.y = r() * Math.PI * 2;
      const nevar = T.nevado && /pino|muerto/.test(nom);
      if (nevar) o.traverse((c) => {
        if (!c.isMesh || c.userData.nieve) return;
        if (!matNieve.has(c.material)) { const m = c.material.clone(); m.color.lerp(new THREE.Color('#e8f2ff'), 0.45); matNieve.set(c.material, m); }
        c.material = matNieve.get(c.material); c.userData.nieve = true;
      });
      o.userData.modelo = nom + (alto > 1.2 ? '|sombra' : '') + (nevar ? '|nieve' : '');
      g.add(o);
    }
  }
  for (const f of T.fijos || []) {
    const o = copiaEstatica(f.m, f.alto, false);
    if (!o) continue;
    o.position.set(f.x, 0, f.z); o.rotation.y = f.ry; o.userData.fusionar = true; g.add(marcar(o));
  }
  extrasTema[nombre] && extrasTema[nombre](g, r, marcar);
  fusionarFijos(g, marcar);
  const copias = instanciarDecorado(g, marcar);
  E.deslizables = g.children.filter((o) => !o.userData.fijo).concat(copias);
  for (const o of E.deslizables) o.userData.base = o.scale.clone();
  actualizarLotes();
  E.escena.add(g);
  // Partículas de ambiente.
  const n = Math.round(T.amb.n * cantidad);
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), sem = [];
  for (let i = 0; i < n; i++) { pos[i * 3] = (r() - 0.5) * 40; pos[i * 3 + 1] = r() * 12; pos[i * 3 + 2] = -50 + r() * 58; sem.push(r() * 10); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const tamAmb = T.amb.modo === 'nieve' ? 0.22 : 0.3;
  const mat = new THREE.PointsMaterial({ color: T.amb.color, size: tamAmb * (E.escalaAmbiente || 1), map: texBrillo, transparent: true, depthWrite: false, blending: T.amb.modo === 'nieve' || T.amb.modo === 'arena' ? THREE.NormalBlending : THREE.AdditiveBlending, opacity: T.amb.modo === 'arena' ? 0.55 : 0.95 });
  mat.userData.base = tamAmb;
  const puntos = new THREE.Points(geo, mat);
  E.escena.add(puntos);
  E.ambiente = { puntos, sem, modo: T.amb.modo };
}

// Detalles propios de cada mundo que no vienen en los packs.
const extrasTema = {
  pradera(g, r, marcar) {
    const geo = new THREE.IcosahedronGeometry(1, 2);
    E.nubes = [];
    // Cada nube es UNA malla (sus 4 bolas fundidas) y todas comparten material: 12 llamadas de dibujo en vez de 48.
    const matNube = toon('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 1 }), _m4 = new THREE.Matrix4();
    for (let i = 0; i < 12; i++) {
      const bolas = [];
      for (let j = 0; j < 4; j++) { const s = 1.1 + r() * 0.9; _m4.makeScale(s, s, s).setPosition(j * 1.3 - 2, r() * 0.6, r() * 0.8); bolas.push(geo.clone().applyMatrix4(_m4)); }
      const n = new THREE.Mesh(mergeGeometries(bolas, false), matNube); n.userData.propio = true;
      for (const b of bolas) b.dispose();
      n.position.set((r() - 0.5) * 120, 22 + r() * 14, -50 - r() * 70); n.scale.setScalar(1.5 + r() * 1.5);
      g.add(marcar(n)); E.nubes.push(n);
    }
  },
  desierto(g, r, marcar) {
    const piramide = new THREE.ConeGeometry(9, 9, 4);
    for (const [x, z, s] of [[-34, -78, 1.5], [-18, -95, 1.1], [30, -88, 1.8], [50, -66, 1]]) { const p = new THREE.Mesh(piramide, toon('#e3b062', { roughness: 0.9 })); p.position.set(x, 4.5 * s, z); p.scale.setScalar(s); p.rotation.y = 0.8; p.castShadow = false; p.receiveShadow = true; g.add(marcar(p)); }
    const solG = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, color: '#fff2c4', transparent: true, fog: false, depthWrite: false }));
    solG.position.set(24, 30, -150); solG.scale.setScalar(40); g.add(marcar(solG));
  },
  nieve(g, r) {
    const bola = new THREE.SphereGeometry(0.5, 24, 16);
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Group();
      const a = malla(bola, toon('#ffffff', { roughness: 0.8 })); a.position.y = 0.5;
      const b = malla(bola, toon('#ffffff', { roughness: 0.8 })); b.position.y = 1.2; b.scale.setScalar(0.68);
      const n = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 8), toon('#ff8a2a')); n.rotation.x = Math.PI / 2; n.position.set(0, 1.22, 0.42);
      for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), toon('#111111')); o.position.set(s * 0.13, 1.33, 0.3); m.add(o); }
      const bufanda = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.08, 8, 20), toon('#ef4444')); bufanda.rotation.x = Math.PI / 2; bufanda.position.y = 0.92;
      m.add(a, b, n, bufanda); m.position.set((r() < 0.5 ? -1 : 1) * (4.8 + r() * 7), 0, Z_FIN - r() * LARGO); m.rotation.y = r() * 2 - 1; g.add(m);
    }
  },
  castillo(g, r, marcar) {
    const palo = new THREE.CylinderGeometry(0.06, 0.08, 1.6, 6), cuenco = new THREE.CylinderGeometry(0.22, 0.12, 0.25, 8);
    E.antorchas = [];
    for (let z = Z_FIN; z > Z_FIN - LARGO; z -= 6) for (const s of [-1, 1]) {
      const a = new THREE.Group(); a.add(en(new THREE.Mesh(palo, toon('#3a2a20')), 0, 0.8, 0));
      a.add(en(new THREE.Mesh(cuenco, toon('#2b2b33', { metalness: 0.6, roughness: 0.4 })), 0, 1.65, 0));
      const llama = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, color: '#ffb347', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); llama.position.y = 1.95; llama.scale.setScalar(1.1); a.add(llama);
      a.userData.llama = llama; a.userData.fila = true; E.antorchas.push(a);
      a.position.set(s * 4.4, 0, z); g.add(a);
    }
    const luna = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, color: '#ffe9f5', transparent: true, fog: false, depthWrite: false }));
    luna.position.set(-30, 40, -150); luna.scale.setScalar(30); g.add(marcar(luna));
  },
};

// Animación de un héroe en cada fotograma (giro, saltos, gestos, carrera o descanso, pelo recortado, aura y mascota).
function animarHeroe(h, dt, real, t) {
  // En el multijugador, el cuerpo de un mago caído se queda atrás: se va hacia la cámara con el camino hasta salir de la pantalla.
  if (E.multi && h.caido && h.grupo.visible) { h.grupo.position.z += Math.max(E.velAvance, 1.2) * dt; if (h.grupo.position.z > E.camara.position.z - 1) h.grupo.visible = false; }
h.grupo.rotation.y += (h.rotObj - h.grupo.rotation.y) * (1 - Math.exp(-real * 6));
  if (h.salto > 0) h.salto = Math.max(0, h.salto - real);
  h.cuerpo.position.y = h.salto > 0 ? Math.abs(Math.sin(h.salto * Math.PI * 2.5)) * 0.6 : 0;
  if (h.lanzar > 0) h.lanzar = Math.max(0, h.lanzar - real);
  if (h.herido > 0) h.herido = Math.max(0, h.herido - real);
  if (h.triste > 0) h.triste = Math.max(0, h.triste - real);
  if (h.mixer) {
    // Fuera de los gestos de una vez (hechizo, golpe, victoria), corre si el mundo avanza o descansa.
    const enGesto = h.actual && h.actual.loop === THREE.LoopOnce && h.actual.isRunning();
    if (!enGesto && h.triste <= 0 && !h.caido) {
      const base = E.velAvance > 0.4 ? h.acc.correr : h.acc.quieto;
      if (h.actual !== base) h.actual = reproducir(base, h.actual, 0.25);
    }
    h.mixer.timeScale = E.velAvance > 0.4 ? Math.min(1.7, Math.max(0.6, E.velAvance / 3.2)) : 1;
    h.mixer.update(dt);
    if (h.pelo && h.pelo.clippingPlanes) {
      h.sombreroSitio.updateWorldMatrix(true, false);
      // Se ve el pelo que cae por debajo del ala (plano A) y todo el de la mitad delantera (plano B, el flequillo);
      // solo se recorta el que sobresale por encima del ala en la parte de atrás, donde atravesaba el cono.
      const q = h.sombreroSitio.getWorldQuaternion(new THREE.Quaternion());
      const arriba = new THREE.Vector3(0, 1, 0).applyQuaternion(q), delante = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      const o = h.sombreroSitio.getWorldPosition(new THREE.Vector3());
      h.planoPelo.setFromNormalAndCoplanarPoint(arriba.clone().negate(), o.clone().addScaledVector(arriba, ALTURA_PELO));
      h.planoPelo2.setFromNormalAndCoplanarPoint(delante, o.addScaledVector(delante, INCLINA_PELO));
    }
  }
  h.aura.rotation.z += real * 0.8; h.aura.material.opacity = 0.35 + Math.sin(t * 3) * 0.15 + (E.frenesi ? 0.3 : 0);
  h.halo.scale.multiplyScalar(1); h.orbe.rotation.y += real * 2;
  if (h.mascota) {
    h.mascota.position.set(Math.sin(t * 0.9) * 0.3 - 0.85, 2.1 + Math.sin(t * 2.6) * 0.15, 0.3 + Math.cos(t * 0.9) * 0.2);
    h.mascota.rotation.y = Math.sin(t * 0.9) * 0.4;
    h.mascota.traverse((o) => { if (o.userData.ala) o.rotation.z = -o.userData.ala * (0.8 + Math.sin(t * 14) * 0.5); });
  }
}

// ---------- Lumi (modelo animado) ----------
function crearHeroe() {
  const grupo = new THREE.Group();
  const cuerpo = new THREE.Group(); grupo.add(cuerpo);
  const sombra = new THREE.Mesh(new THREE.CircleGeometry(0.7, 24), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22, depthWrite: false })); sombra.rotation.x = -Math.PI / 2; sombra.position.y = 0.03; grupo.add(sombra);
  // Aura (círculo mágico) a los pies: su color se compra en la tienda.
  const aura = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.95, 48), new THREE.MeshBasicMaterial({ color: '#a78bfa', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  aura.rotation.x = -Math.PI / 2; aura.position.y = 0.05; aura.userData.sinAO = true; grupo.add(aura);
  const orbe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), new THREE.MeshBasicMaterial({ color: '#ffe066' }));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, color: '#ffe066', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(0.9);
  const sombreroSitio = new THREE.Group(), vara = new THREE.Group(), planoPelo = new THREE.Plane(), planoPelo2 = new THREE.Plane();
  const mascotaSitio = new THREE.Group(); grupo.add(mascotaSitio);
  grupo.position.set(0, 0, 1.6);
  // El círculo del suelo y la sombra no se enseñan hasta que todo ha cargado (mostrarHeroe).
  aura.visible = false; sombra.visible = false;
  return { grupo, cuerpo, aura, orbe, halo, sombreroSitio, vara, planoPelo, planoPelo2, mascotaSitio, sombra, lanzar: 0, herido: 0, salto: 0, triste: 0, rotObj: 0, aspecto: null, mascota: null, modelo: null, actual: null };
}

let INCLINA_PELO = 0.1, ALTURA_PELO = -0.02; // INCLINA_PELO: hasta dónde (hacia delante) se recorta el pelo
function montarHeroe(h = E.heroe) {
  if (h.modelo) return;
  const a = copiaAnimada('mago', 2.2);
  if (!a) return;
  h.modelo = a.o; h.mixer = a.mixer;
  h.acc = { quieto: a.buscar('Idle'), correr: a.buscar('Run'), hechizo: a.buscar('Dagger_Attack', 'Punch'), golpe: a.buscar('RecieveHit'), victoria: a.buscar('Punch', 'Roll'), triste: a.buscar('Death') };
  h.cuerpo.add(a.o);
  // Túnica de aprendiz de mago (los colores del modelo son de aventurero).
  const ROPA = h.ropa || ROPA_BASE;
  a.o.traverse((c) => {
    if (c.isMesh && c.material && ROPA[c.material.name]) { if (!c.material.userData.teñido) { c.material = c.material.clone(); c.material.userData.teñido = true; } c.material.color.set(ROPA[c.material.name]); }
    if (c.isMesh && c.material && c.material.name === 'Hair') { c.material = c.material.clone(); h.pelo = c.material; }
    if (c.name === 'Head') h.cabeza = c;
    if (c.name === 'FistR') h.mano = c;
  });
  a.o.updateMatrixWorld(true);
  const esc = new THREE.Vector3();
  // Estilo «chibi»: cabeza grande.
  if (h.cabeza) { h.cabeza.scale.setScalar(1.6); h.cabeza.add(h.sombreroSitio); h.cabeza.updateMatrixWorld(true); h.cabeza.getWorldScale(esc); h.escCab = esc.x; }
  // Varita en la mano derecha, con el orbe en la punta.
  if (h.mano) {
    h.mano.getWorldScale(esc);
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.026, 0.7, 8), toon('#7a4b1e'));
    palo.position.y = 0.22; h.vara.add(palo); h.vara.rotation.set(Math.PI / 2, Math.PI / 2, Math.PI / 4);
    h.vara.scale.setScalar(1 / esc.x);
    h.orbe.position.set(0, 0.6, 0); h.halo.position.set(0, 0.6, 0);
    h.vara.add(h.orbe, h.halo); h.mano.add(h.vara); h.punta = h.vara;
  } else { h.orbe.position.set(0.5, 1.6, 0.2); h.cuerpo.add(h.orbe, h.halo); }
  h.actual = reproducir(h.acc.quieto, null);
  ponerSombrero(h);
}
const ROPA_BASE = { Shirt: '#6d4bd1', Pants: '#2b3a8c', Detail: '#ffd23f', UnderShirt: '#f4e7ff', Boots: '#5b2a86' };
// Cambia los colores de la túnica de un héroe ya montado.
function teñirHeroe(h, ropa) {
  if (!h.modelo) return;
  h.modelo.traverse((c) => { if (c.isMesh && c.material && ropa[c.material.name]) c.material.color.set(ropa[c.material.name]); });
}

// Sombrero de mago de serie (con el color del aura) o el que se haya comprado.
function ponerSombrero(h = E.heroe) {
  if (!h.cabeza || !h.escCab) return;
  const id = h.aspecto && h.aspecto.sombrero && SOMBREROS[h.aspecto.sombrero] ? h.aspecto.sombrero : SOMBRERO_NINGUNO;
  const mago = id === SOMBRERO_NINGUNO, e = h.escCab;
  h.sombreroSitio.clear();
  h.sombreroSitio.add(SOMBREROS[id](h.colorAura || '#7c3aed'));
  // Con el sombrero de mago (que baja hasta las cejas) el pelo que queda por encima del ala se recorta: así no atraviesa el cono.
  if (h.pelo) { h.pelo.clippingPlanes = mago ? [h.planoPelo, h.planoPelo2] : null; h.pelo.clipIntersection = true; h.pelo.needsUpdate = true; }
  h.sombreroSitio.position.set(0, (mago ? 0.6 : 0.9) / e, 0.02 / e);
  h.sombreroSitio.scale.setScalar((mago ? 1.3 : 1.0) / e);
}

const SOMBRERO_NINGUNO = 'mago';
export function aspectoHeroe(a, colorHex) {
  const h = E.heroe;
  if (h.aspecto && h.aspecto.color === a.color && h.aspecto.sombrero === a.sombrero && h.aspecto.mascota === a.mascota) return;
  h.aspecto = Object.assign({}, a);
  h.colorAura = colorHex;
  h.aura.material.color.set(colorHex);
  ponerSombrero();
  h.mascotaSitio.clear(); h.mascota = null;
  if (a.mascota && MASCOTAS[a.mascota]) { h.mascota = MASCOTAS[a.mascota](); h.mascotaSitio.add(h.mascota); }
}
export function mostrarHeroe() { const h = E.heroe; if (h) { h.aura.visible = true; h.sombra.visible = true; } }
export function colorVarita(hex, h = E.heroe) { h.orbe.material.color.set(hex); h.halo.material.color.set(hex); }

// ---------- Palabrones ----------
function crearMonstruoModelo(semilla, variante) {
  const lista = MONSTRUOS_TEMA[E.tema] || MONSTRUOS_TEMA.pradera;
  const nombre = lista[Math.abs(semilla) % lista.length];
  const alto = variante === 'veloz' ? 1.25 : variante === 'gigante' ? 2.5 : 1.75;
  const a = copiaAnimada(nombre, alto);
  if (!a) return null;
  const vuela = !!a.buscar('Flying_Idle');
  const acc = {
    andar: a.buscar('Walk', 'Flying_Idle', 'Idle'), correr: a.buscar('Run', 'Fast_Flying', 'Walk'),
    golpe: a.buscar('HitReact', 'HitRecieve'), ataque: a.buscar('Bite_Front', 'Headbutt', 'Punch'), muerte: a.buscar('Death'),
  };
  const g = new THREE.Group();
  const pivote = new THREE.Group(); pivote.add(a.o); g.add(pivote);
  if (vuela) pivote.position.y = 0.6;
  const sombra = new THREE.Mesh(new THREE.CircleGeometry(0.7 * alto / 1.75, 20), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.25, depthWrite: false })); sombra.rotation.x = -Math.PI / 2; sombra.position.y = 0.03; g.add(sombra);
  return { g, cuerpo: pivote, modelo: a.o, mixer: a.mixer, acc, actual: reproducir(acc.andar, null), alto: alto + (vuela ? 0.6 : 0), vuela };
}

export function nuevoMonstruo(id, texto, x, z, semilla, variante = 'normal') {
  const m = crearMonstruoModelo(semilla, variante);
  if (!m) return null;
  m.g.position.set(x, 0, z);
  m.g.scale.setScalar(0.01);
  E.escena.add(m.g);
  m.mixer.timeScale = 1;
  const mon = { id, ...m, texto, x, z, fase: Math.random() * 6, nace: E.reloj, muere: 0, burla: 0, estado: 'vivo', escala: 1, escalaBase: 1, variante, peligro: 0, techo: 0 };
  E.monstruos.set(id, mon);
  emitir(new THREE.Vector3(x, 0.6, z), 18, '#ffffff', { vel: 3, vida: 0.6, tam: 0.5, grav: 2 });
  return mon;
}

export function peligroMonstruo(id, n) { const m = E.monstruos.get(id); if (m) m.peligro = n; }
export function frenesi(si) { E.frenesi = si; if (si) emitir(E.heroe.grupo.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 60, '#ffd23f', { vel: 6, vida: 0.9, tam: 0.55, grav: 2, mezcla: '#ff8a3d' }); }
export function moverMonstruo(id, x, z, paso = 1) { const m = E.monstruos.get(id); if (m) { m.x = x; m.z = z; m.paso = paso; } }
export function objetivo(id) { E.objetivoId = id; }

function quitarMonstruo(m) {
  E.escena.remove(m.g);
  m.mixer.stopAllAction();
  E.monstruos.delete(m.id);
  if (E.objetivoId === m.id) E.objetivoId = null;
}

export function matarMonstruo(id, color) {
  const m = E.monstruos.get(id); if (!m) return;
  m.estado = 'muere'; m.muere = E.reloj;
  m.actual = reproducir(m.acc.muerte, m.actual, 0.08, true);
  m.mixer.timeScale = 1.6;
  const p = m.g.position.clone(); p.y += m.alto * 0.6;
  emitir(p, 46, color, { vel: 7, vida: 0.9, tam: 0.55, grav: 5, mezcla: '#ffffff' });
  emitir(p, 14, '#ffe066', { vel: 3, vida: 1.2, tam: 0.3, grav: -1 });
  onda(m.g.position, color);
  for (let i = 0; i < 3; i++) moneda(p);
}

export function burla(id) {
  const m = E.monstruos.get(id); if (!m) return;
  m.burla = E.reloj;
  m.actual = reproducir(m.acc.golpe, m.actual, 0.08, true);
  emitir(new THREE.Vector3(m.g.position.x, m.alto, m.g.position.z), 16, '#9ca3af', { vel: 2.5, vida: 0.7, tam: 0.45, grav: -0.5 });
}

export function alcanza(id) {
  const m = E.monstruos.get(id); if (!m) return;
  m.estado = 'alcanza'; m.muere = E.reloj;
  m.actual = reproducir(m.acc.ataque, m.actual, 0.08, true);
  emitir(new THREE.Vector3(m.g.position.x, 1, m.g.position.z), 30, '#6b7280', { vel: 4, vida: 0.8, tam: 0.7, grav: -1 });
}

export function quitarTodos() { for (const m of [...E.monstruos.values()]) quitarMonstruo(m); E.objetivoId = null; }

export function posPantalla(id, alto = 1) {
  let v;
  if (id === 'jefe' && E.jefe) { v = E.jefe.g.position.clone(); v.y += E.jefe.alto * alto; }
  else { const m = E.monstruos.get(id); if (!m) return null; v = m.g.position.clone(); v.y += m.alto * alto; }
  v.project(E.camara);
  return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
}

// ---------- efectos ----------
function onda(pos, color) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.62, 36), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.position.set(pos.x, 0.15, pos.z); m.userData.sinAO = true;
  E.escena.add(m); E.anillos.push({ m, t: 0 });
}
const geoMoneda = new THREE.CylinderGeometry(0.17, 0.17, 0.05, 16);
function moneda(p) {
  const m = new THREE.Mesh(geoMoneda, toon('#ffcc33', { metalness: 0.9, roughness: 0.25, emissive: '#aa7700', emissiveIntensity: 0.3 }));
  m.position.copy(p); m.rotation.x = Math.PI / 2;
  E.escena.add(m);
  E.monedas.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 3, 5 + Math.random() * 2, (Math.random() - 0.5) * 2), t: 0 });
}

const geoProyectil = new THREE.IcosahedronGeometry(0.2, 1);
export function disparo(color, destino, alLlegar, h = E.heroe, dur = 0.34) {
  h.lanzar = 0.45;
  if (h.acc) h.actual = reproducir(h.acc.hechizo, h.actual, 0.06, true);
  const desde = new THREE.Vector3(); h.orbe.getWorldPosition(desde);
  const m = new THREE.Mesh(geoProyectil, new THREE.MeshBasicMaterial({ color }));
  m.userData.sinAO = true;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(1.4); m.add(halo);
  m.position.copy(desde); E.escena.add(m);
  emitir(desde, 12, color, { vel: 3, vida: 0.4, tam: 0.4, grav: 0 });
  E.disparos.push({ m, desde, destino, t: 0, dur, color, alLlegar });
}
function destinoPos(destino) {
  if (destino && destino.grupo) return destino.grupo.position.clone().add(new THREE.Vector3(0, 1.2, 0)); // un héroe (ataques entre jugadores)
  if (destino === 'jefe' && E.jefe) return E.jefe.g.position.clone().add(new THREE.Vector3(0, E.jefe.alto * 0.5, 2.2));
  if (destino === 'heroe') return E.heroe.grupo.position.clone().add(new THREE.Vector3(0, 1.2, 0));
  const m = E.monstruos.get(destino);
  if (m) return m.g.position.clone().add(new THREE.Vector3(0, m.alto * 0.55, 0.3));
  return null;
}
export function heroeHerido(h = E.heroe) {
  if (h.caido) return;
  h.herido = 0.5; temblor(0.55);
  if (h.acc) h.actual = reproducir(h.acc.golpe, h.actual, 0.06, true);
  emitir(h.grupo.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 24, '#ff4d6d', { vel: 4, vida: 0.6, tam: 0.45 });
}
export function heroeSalta() { E.heroe.salto = 0.6; }
// ---------- Modo multijugador (experimental, solo con ?multi): 4 magos a lo ancho de la pizarra ----------
// Cada jugador tiene su carril, su mago y sus Palabrones (los mismos para todos). La lógica está en multi.js.
export const MULTI_COLORES = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
export const MULTI_X = [-9, -3, 3, 9];
const Z_HEROE = 1.6; // donde está siempre Lumi (el cuerpo de un mago caído se aleja de ahí)
const MULTI_MEDIO = 12; // semiancho (m) que cubren los 4 carriles a la altura de los magos
E.multi = null; E.multiObjetivos = new Set();
function ropaDe(hex) {
  const c = new THREE.Color(hex), osc = c.clone().multiplyScalar(0.6), claro = c.clone().lerp(new THREE.Color('#ffffff'), 0.85);
  return { Shirt: '#' + c.getHexString(), Pants: '#' + osc.getHexString(), Detail: '#ffd23f', UnderShirt: '#' + claro.getHexString(), Boots: '#' + osc.getHexString() };
}
export function multiIniciar() {
  if (E.multi) multiTerminar();
  const heroes = [E.heroe];
  const zh = Z_HEROE;
  for (let i = 1; i < 4; i++) {
    const h = crearHeroe();
    h.colorAura = MULTI_COLORES[i]; h.ropa = ropaDe(MULTI_COLORES[i]);
    montarHeroe(h);
    h.aura.visible = true; h.sombra.visible = true;
    h.aura.material.color.set(MULTI_COLORES[i]);
    E.escena.add(h.grupo); heroes.push(h);
  }
  // El héroe principal hace de jugador 1: se tiñe de rojo; al salir se restaura su aspecto.
  E.heroe.colorAura = MULTI_COLORES[0]; ponerSombrero(E.heroe); teñirHeroe(E.heroe, ropaDe(MULTI_COLORES[0]));
  E.heroe.aura.material.color.set(MULTI_COLORES[0]);
  heroes.forEach((h, i) => { h.grupo.position.set(MULTI_X[i], 0, zh); h.grupo.visible = true; h.caido = false; h.levantando = false; h.triste = 0; colorVarita(MULTI_COLORES[i], h); });
  // Carriles: una tira de camino por jugador, con el color del jugador en los bordes; la textura se desliza con el mundo.
  const tiras = [], texs = [];
  if (E.caminoMesh) E.caminoMesh.visible = false;
  MULTI_X.forEach((x, i) => {
    const base = E.suelos && E.suelos[1] ? E.suelos[1].t : null;
    let mat;
    if (base) {
      const tx = base.clone(); tx.needsUpdate = true; tx.repeat.set(0.85, 24 * 100 / 120); texs.push(tx); E.suelos.push({ t: tx, largo: 5 });
      mat = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.9, color: new THREE.Color('#ffffff').lerp(new THREE.Color(MULTI_COLORES[i]), 0.3) });
    } else mat = new THREE.MeshStandardMaterial({ color: MULTI_COLORES[i], roughness: 0.9 });
    const tira = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 100), mat);
    tira.rotation.x = -Math.PI / 2; tira.position.set(x, 0.025, -38); tira.receiveShadow = true; tira.userData.sinAO = true;
    const borde = new THREE.MeshBasicMaterial({ color: MULTI_COLORES[i] });
    for (const lado of [-1, 1]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 100), borde); b.position.set(lado * 2.7, 0, 0.004); tira.add(b); }
    E.escena.add(tira); tiras.push(tira);
  });
  // Anillo de objetivo de cada jugador.
  const anillos = MULTI_COLORES.map((c) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.12, 40), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.95, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 2; E.escena.add(m); return m;
  });
  E.multi = { heroes, tiras, texs, anillos, objetivos: [null, null, null, null] };
  E.multiObjetivos = new Set();
  quitarTodos();
  ocultarDecorado(true);
  vista('multi', true);
}
export function multiTerminar() {
  const M = E.multi; if (!M) return;
  E.multi = null; E.multiObjetivos = new Set();
  M.heroes.slice(1).forEach((h) => { E.escena.remove(h.grupo); if (h.mixer) h.mixer.stopAllAction(); });
  for (const t of M.tiras) { E.escena.remove(t); t.material.dispose(); t.geometry.dispose(); t.children.forEach((c) => c.geometry.dispose()); }
  for (const a of M.anillos) { E.escena.remove(a); a.geometry.dispose(); a.material.dispose(); }
  if (E.suelos) E.suelos = E.suelos.filter((x) => !M.texs.includes(x.t));
  for (const t of M.texs) t.dispose();
  if (E.caminoMesh) E.caminoMesh.visible = true;
  // El héroe principal vuelve a ser Lumi.
  const h = E.heroe;
  h.grupo.position.set(0, 0, Z_HEROE); h.grupo.visible = true; h.caido = false; h.levantando = false; h.triste = 0; h.salto = 0;
  if (h.acc) h.actual = reproducir(h.acc.quieto, h.actual, 0.1);
  teñirHeroe(h, ROPA_BASE); h.aspecto = null; // el aspecto (sombrero y aura) se vuelve a aplicar al entrar en el menú
  colorVarita('#ffe066', h);
  fiesta(false);
  ocultarDecorado(false);
}
export function multiHeroe(i) { return E.multi ? E.multi.heroes[i] : E.heroe; }
// Objetivo (Palabrón al que apunta) de cada jugador: se marca con su anillo y su etiqueta destacada.
export function multiObjetivo(i, id) {
  const M = E.multi; if (!M) return;
  M.objetivos[i] = id;
  E.multiObjetivos = new Set(M.objetivos.filter((x) => x != null));
}
export function quitarMonstruoId(id) { const m = E.monstruos.get(id); if (m) quitarMonstruo(m); }
// Mueve los anillos de objetivo (cada fotograma).
function multiAnillos(t) {
  const M = E.multi; if (!M) return;
  M.anillos.forEach((a, i) => {
    const m = M.objetivos[i] != null ? E.monstruos.get(M.objetivos[i]) : null;
    a.visible = !!(m && m.estado === 'vivo');
    if (a.visible) { a.position.set(m.g.position.x, 0.06, m.g.position.z); a.scale.setScalar((1 + Math.sin(t * 6 + i) * 0.08) * m.alto / 1.75); }
  });
}

// Fiesta final (al vencer al último jefe): Lumi salta sin parar y estallan fuegos artificiales en el cielo.
const COLORES_FUEGO = ['#ff4d6d', '#ffd23f', '#4dabf7', '#69db7c', '#da77f2', '#ff922b', '#ffffff', '#38d9a9'];
E.fiesta = null; E.alFuego = null;
export function fiesta(si, h = null) {
  E.fiesta = si ? { t: 0, fuego: 0.2, salto: 0, h } : null;
}
function lanzarFuego() {
  const c = COLORES_FUEGO, a = c[Math.floor(Math.random() * c.length)], b = c[Math.floor(Math.random() * c.length)];
  const vert = E.vertical; // en vertical la pantalla es estrecha y la parte de arriba es corta: fuegos más cerca y más bajos
  const pos = new THREE.Vector3((Math.random() - 0.5) * (vert ? 18 : 34), vert ? 3 + Math.random() * 8 : 7 + Math.random() * 11, vert ? -6 - Math.random() * 10 : -10 - Math.random() * 16);
  emitir(pos, 70, a, { vel: 8.5, vida: 1.6, tam: 0.85, grav: 3, mezcla: b, arriba: 2, minArriba: -1, disp: 0.2 });
  emitir(pos, 16, '#ffffff', { vel: 3, vida: 1.0, tam: 0.55, grav: 1, arriba: 2, minArriba: -1, disp: 0.2 });
  if (E.alFuego) E.alFuego();
}
export function celebrar(h = E.heroe) { h.salto = 2.4; E.confeti = 2.2; if (h.acc) h.actual = reproducir(h.acc.victoria, h.actual, 0.15, true); }
// Sin vidas, Lumi cae UNA vez y se queda en el suelo (aunque se cambie de pantalla) hasta que se la levanta con levantar().
export function entristecer(h = E.heroe) {
  if (h.caido) return;
  h.caido = true; h.triste = 2.5;
  if (h.acc) h.actual = reproducir(h.acc.triste, h.actual, 0.2, true);
}
// Levanta a Lumi (la caída al revés) y, cuando ya está de pie, llama a alTerminar. Con rapido = true se levanta de golpe.
export function levantar(alTerminar, rapido = false) {
  const h = E.heroe, acc = h.acc && h.acc.triste;
  if (h.levantando) return;
  if (!h.caido || !acc || rapido) {
    const estabaCaida = h.caido; h.caido = false; h.triste = 0;
    if (estabaCaida && h.acc) h.actual = reproducir(h.acc.quieto, h.actual, 0.1);
    if (alTerminar) alTerminar();
    return;
  }
  h.levantando = true;
  const dur = acc.getClip().duration;
  acc.reset(); acc.setLoop(THREE.LoopOnce, 1); acc.clampWhenFinished = true; acc.enabled = true; acc.setEffectiveWeight(1);
  acc.time = dur; acc.setEffectiveTimeScale(-1); acc.play();
  h.actual = acc;
  setTimeout(() => {
    h.caido = false; h.levantando = false; h.triste = 0;
    h.actual = reproducir(h.acc.quieto, acc, 0.15);
    if (alTerminar) alTerminar();
  }, dur * 1000 + 150);
}
export function congelar(si) {
  E.congelado = si;
  if (si) for (const m of E.monstruos.values()) emitir(m.g.position.clone().add(new THREE.Vector3(0, 1, 0)), 14, '#a5f3fc', { vel: 2.5, vida: 0.9, tam: 0.45, grav: 0.5 });
}

// ---------- jefes ----------
export function crearJefe(color, semilla, estilo) {
  quitarJefe();
  const alto = E.vertical ? 11.6 : 12.4; // enormes: pueden salirse del ancho del camino (la cámara los encuadra)
  const a = copiaAnimada('jefe-' + E.tema, alto);
  if (!a) return;
  const vuela = !!a.buscar('Flying_Idle');
  const g = new THREE.Group(), pivote = new THREE.Group(); pivote.add(a.o); g.add(pivote);
  if (vuela) pivote.position.y = 2.2;
  a.o.rotation.y = 0;
  g.position.set(0, 0, -17);
  g.scale.setScalar(0.01);
  E.escena.add(g);
  const acc = { quieto: a.buscar('Idle', 'Flying_Idle', 'Walk'), golpe: a.buscar('HitReact', 'HitRecieve'), ataque: a.buscar('Punch', 'Headbutt', 'Bite_Front', 'Weapon'), muerte: a.buscar('Death') };
  E.jefe = { g, cuerpo: pivote, mixer: a.mixer, acc, actual: reproducir(acc.quieto, null), alto: alto + (vuela ? 1.4 : 0), cima: alto + (vuela ? 2.2 : 0), col: color, nace: E.reloj, golpe: 0, ataca: 0, vencido: 0, cartel: null, escalaBase: 1 };
  emitir(new THREE.Vector3(0, 3, -15), 90, color, { vel: 9, vida: 1.3, tam: 0.9, grav: 1 });
  temblor(0.7);
  encuadrarJefe();
}
// El jefe no lleva cartel: la palabra se ve en el panel de arriba (así nunca tapa al monstruo).
export function cartelJefe() {}
export function golpeJefe(color) {
  const j = E.jefe; if (!j) return;
  j.golpe = 0.35; temblor(0.35); pausaGolpe(0.07);
  j.actual = reproducir(j.acc.golpe, j.actual, 0.06, true);
  const p = j.g.position.clone(); p.y += j.alto * 0.5; p.z += 2.5;
  emitir(p, 50, color, { vel: 8, vida: 0.9, tam: 0.6, grav: 4, mezcla: '#ffffff' });
  for (let i = 0; i < 2; i++) moneda(p);
}
export function ataqueJefe(alLlegar) {
  const j = E.jefe; if (!j) return;
  j.ataca = 0.5;
  j.actual = reproducir(j.acc.ataque, j.actual, 0.06, true);
  const desde = j.g.position.clone(); desde.y += j.alto * 0.5; desde.z += 2.6;
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), new THREE.MeshBasicMaterial({ color: '#2a0a3a' }));
  m.userData.sinAO = true;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, color: j.col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(2.4); m.add(halo);
  m.position.copy(desde); E.escena.add(m);
  E.disparos.push({ m, desde, destino: 'heroe', t: 0, dur: 0.6, color: j.col, alLlegar, propio: true });
}
export function vencerJefe() {
  const j = E.jefe; if (!j) return;
  j.vencido = E.reloj;
  j.actual = reproducir(j.acc.muerte, j.actual, 0.1, true);
  cartelJefe(null);
  temblor(1); pausaGolpe(0.15);
}
export function quitarJefe() {
  const j = E.jefe; if (!j) return;
  j.mixer.stopAllAction();
  E.escena.remove(j.g);
  E.jefe = null;
}

// ---------- bucle de animación ----------
const _v = new THREE.Vector3();
function actualizar(dt, real) {
  const t = E.reloj;
  const k = 1 - Math.exp(-real * 3.2);
  E.camPos.lerp(E.camPosObj, k); E.camMira.lerp(E.camMiraObj, k);
  let ox = 0, oy = 0;
  if (E.vista === 'menu' || E.vista === 'titulo') { ox = Math.sin(t * 0.25) * 0.5; oy = Math.sin(t * 0.33) * 0.12; }
  E.trauma = Math.max(0, E.trauma - real * 1.4);
  const s = E.trauma * E.trauma;
  E.camara.position.set(E.camPos.x + ox + s * 0.35 * Math.sin(t * 47), E.camPos.y + oy + s * 0.25 * Math.sin(t * 61), E.camPos.z);
  _v.copy(E.camMira); E.camara.lookAt(_v);
  E.camara.rotation.z += s * 0.03 * Math.sin(t * 37);

  // El mundo avanza hacia Lumi (solo durante la partida).
  E.velAvance += ((E.vista === 'juego' || E.vista === 'multi' ? E.avance : 0) - E.velAvance) * Math.min(1, real * 3);
  const dz = E.velAvance * dt;
  if (dz > 0.00001) {
    for (const sl of E.suelos) sl.t.offset.y += dz / sl.largo;
    if (E.deslizables) for (const o of E.deslizables) {
      o.position.z += dz;
      if (o.position.z > Z_FIN) { o.position.z -= o.userData.largo || LARGO; o.userData.crece = 0; }
      if (o.userData.crece !== undefined) {
        o.userData.crece = Math.min(1, o.userData.crece + real * 1.3);
        o.scale.copy(o.userData.base).multiplyScalar(Math.max(0.01, o.userData.crece));
        if (o.userData.crece >= 1) o.userData.crece = undefined;
      }
    }
    actualizarLotes();
  }

  // Lumi (y, en el modo multijugador, los otros tres magos).
  const h = E.heroe;
  h.rotObj = E.vista === 'menu' || E.vista === 'titulo' || E.vista === 'resultado' || E.vista === 'final' ? 0 : Math.PI;
  animarHeroe(h, dt, real, t);
  if (E.multi) for (const x of E.multi.heroes) if (x !== h) { x.rotObj = Math.PI; animarHeroe(x, dt, real, t); }

  // Palabrones.
  for (const m of [...E.monstruos.values()]) {
    const edad = t - m.nace;
    let esc = Math.min(1, edad * 3) * m.escala;
    // Las patas siguen al paso real del monstruo sobre el camino (que ya se mueve con el mundo).
    if (m.estado === 'vivo') m.mixer.timeScale = E.congelado ? 0 : Math.min(2.6, Math.max(0.45, (m.paso ?? 1) * (m.vuela ? 0.8 : 0.95) * 1.75 / Math.max(1, m.alto)));
    m.mixer.update(dt);
    if (m.estado === 'vivo') {
      m.g.position.x += (m.x - m.g.position.x) * Math.min(1, dt * 8);
      m.g.position.z = m.z;
      // Tras el golpe vuelve a andar; si está cerca de Lumi, corre.
      const enGesto = m.actual && m.actual.loop === THREE.LoopOnce && m.actual.isRunning();
      if (!enGesto) { const base = (m.paso ?? 1) > 1.6 ? m.acc.correr : m.acc.andar; if (m.actual !== base) m.actual = reproducir(base, m.actual, 0.2); }
      if (m.vuela) m.cuerpo.position.y = 0.6 + Math.sin(t * 3 + m.fase) * 0.15;
      if (m.variante === 'veloz' && !E.congelado && Math.random() < 0.5) emitir(m.g.position.clone().add(new THREE.Vector3(0, 0.5, -0.4)), 1, '#7dd3fc', { vel: 0.4, vida: 0.4, tam: 0.45, grav: 0, disp: 0.5 });
      if (m.peligro > 0.4 && Math.random() < 0.15) emitir(m.g.position.clone().add(new THREE.Vector3(0, m.alto, 0)), 1, '#4b0f2a', { vel: 0.8, vida: 0.7, tam: 0.6, grav: -1.5, disp: 0.6 });
    } else if (m.estado === 'muere') {
      const d = t - m.muere;
      if (d > 0.55) esc = m.escala * Math.max(0, 1 - (d - 0.55) * 5);
      if (d > 0.8) { quitarMonstruo(m); continue; }
    } else if (m.estado === 'alcanza') {
      const d = t - m.muere;
      m.g.position.z += real * 5; m.g.position.y = Math.sin(Math.min(1, d * 2.2) * Math.PI) * 1.0;
      esc = m.escala * Math.max(0, 1 - Math.max(0, d - 0.3) * 3);
      if (d > 0.65) { quitarMonstruo(m); continue; }
    }
    m.g.scale.setScalar(Math.max(0.001, esc));
    m.g.rotation.y = Math.atan2((m.hx ?? h.grupo.position.x) - m.g.position.x, h.grupo.position.z - m.g.position.z) * 0.6;
  }
  const obj = E.objetivoId != null ? E.monstruos.get(E.objetivoId) : null;
  multiAnillos(t);
  E.marcaAnillo.visible = !!(obj && obj.estado === 'vivo');
  if (E.marcaAnillo.visible) {
    E.marcaAnillo.position.set(obj.g.position.x, 0.06, obj.g.position.z);
    E.marcaAnillo.scale.setScalar((1 + Math.sin(t * 6) * 0.08) * obj.alto / 1.75);
  }

  // Jefe.
  const j = E.jefe;
  if (j) {
    j.mixer.update(dt);
    const enGesto = j.actual && j.actual.loop === THREE.LoopOnce && j.actual.isRunning();
    if (!enGesto && !j.vencido && j.actual !== j.acc.quieto) j.actual = reproducir(j.acc.quieto, j.actual, 0.25);
    let esc = Math.min(1, (t - j.nace) * 1.5);
    if (j.golpe > 0) { j.golpe = Math.max(0, j.golpe - real); j.g.position.x = Math.sin(j.golpe * 60) * 0.2; } else j.g.position.x = 0;
    if (j.ataca > 0) j.ataca = Math.max(0, j.ataca - real);
    if (j.vencido) {
      const d = t - j.vencido;
      if (d > 1.0) esc *= Math.max(0, 1 - (d - 1.0) * 1.6);
      if (Math.random() < 0.5) emitir(j.g.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 1 + Math.random() * 3, 0)), 8, ['#ffe066', '#ff6b6b', '#ffffff', j.col][Math.floor(Math.random() * 4)], { vel: 6, vida: 0.8, tam: 0.6, grav: 2 });
      if (d > 1.7) quitarJefe();
    }
    if (E.jefe) {
      j.g.scale.setScalar(Math.max(0.001, esc * (j.escalaFit || 1)));
    }
  }

  // Disparos.
  for (let i = E.disparos.length - 1; i >= 0; i--) {
    const d = E.disparos[i];
    d.t += dt;
    const hasta = destinoPos(d.destino) || d.ultimo || d.desde;
    d.ultimo = hasta;
    const u = Math.min(1, d.t / d.dur);
    const medio = d.desde.clone().lerp(hasta, 0.5); medio.y += d.propio ? 2.5 : 1.6;
    const a = d.desde.clone().lerp(medio, u), b = medio.clone().lerp(hasta, u);
    d.m.position.copy(a.lerp(b, u));
    d.m.rotation.x += dt * 10; d.m.rotation.y += dt * 8;
    emitir(d.m.position, 2, d.color, { vel: 0.6, vida: 0.35, tam: d.propio ? 0.7 : 0.4, grav: 0, disp: 0.1 });
    if (u >= 1) {
      E.escena.remove(d.m); d.m.material.dispose(); d.m.children.forEach((c) => c.material && c.material.dispose());
      if (d.propio) d.m.geometry.dispose();
      E.disparos.splice(i, 1);
      if (d.alLlegar) d.alLlegar();
    }
  }
  for (let i = E.anillos.length - 1; i >= 0; i--) {
    const a = E.anillos[i]; a.t += real;
    a.m.scale.setScalar(1 + a.t * 9); a.m.material.opacity = Math.max(0, 0.9 - a.t * 2.2);
    if (a.t > 0.45) { E.escena.remove(a.m); a.m.geometry.dispose(); a.m.material.dispose(); E.anillos.splice(i, 1); }
  }
  for (let i = E.monedas.length - 1; i >= 0; i--) {
    const c = E.monedas[i]; c.t += real;
    c.v.y -= 12 * real; c.m.position.addScaledVector(c.v, real); c.m.rotation.z += real * 12;
    if (c.m.position.y < 0.15) { c.m.position.y = 0.15; c.v.y = Math.abs(c.v.y) * 0.4; c.v.x *= 0.6; }
    if (c.t > 0.9) c.m.scale.setScalar(Math.max(0.01, 1 - (c.t - 0.9) * 4));
    if (c.t > 1.15) { E.escena.remove(c.m); E.monedas.splice(i, 1); }
  }
  if (E.frenesi && Math.random() < 0.6) {
    const a = Math.random() * Math.PI * 2;
    emitir(h.grupo.position.clone().add(new THREE.Vector3(Math.cos(a) * 0.8, 0.2 + Math.random() * 2, Math.sin(a) * 0.8)), 1, Math.random() < 0.5 ? '#ffd23f' : '#ff8a3d', { vel: 1, vida: 0.7, tam: 0.45, grav: -3, disp: 0.1 });
  }
  if (E.fiesta) {
    E.fiesta.t += real; E.fiesta.fuego -= real; E.fiesta.salto -= real;
    if (E.fiesta.fuego <= 0) { lanzarFuego(); E.fiesta.fuego = 0.35 + Math.random() * 0.6; if (Math.random() < 0.25) setTimeout(lanzarFuego, 160); }
    if (E.fiesta.salto <= 0) { celebrar(E.fiesta.h || E.heroe); E.fiesta.salto = 2.5; } // salta y lanza confeti sin parar
  }
  if (E.confeti > 0) {
    E.confeti -= real;
    const cols = ['#ff6b6b', '#ffe066', '#4dabf7', '#69db7c', '#da77f2', '#ffffff'];
    emitir(h.grupo.position.clone().add(new THREE.Vector3(0, 3.5, 0)), 6, cols[Math.floor(Math.random() * cols.length)], { vel: 7, vida: 1.6, tam: 0.35, grav: 5, disp: 3, arriba: 1, minArriba: 0.3 });
  }
  if (E.ambiente) {
    const pos = E.ambiente.puntos.geometry.attributes.position, a = pos.array, sem = E.ambiente.sem, modo = E.ambiente.modo;
    for (let i = 0; i < sem.length; i++) {
      const sm = sem[i];
      a[i * 3 + 2] += dz; if (a[i * 3 + 2] > 8) a[i * 3 + 2] -= 58;
      if (modo === 'nieve') { a[i * 3 + 1] -= real * (0.8 + (sm % 1) * 0.8); a[i * 3] += Math.sin(t + sm) * real * 0.3; if (a[i * 3 + 1] < 0) a[i * 3 + 1] = 12; }
      else if (modo === 'brasas') { a[i * 3 + 1] += real * (0.5 + (sm % 1)); a[i * 3] += Math.sin(t * 2 + sm) * real * 0.4; if (a[i * 3 + 1] > 12) a[i * 3 + 1] = 0; }
      else if (modo === 'arena') { a[i * 3] += real * (2 + (sm % 1) * 2); a[i * 3 + 1] = 0.3 + Math.abs(Math.sin(t * 0.7 + sm)) * 2.5; if (a[i * 3] > 20) a[i * 3] = -20; }
      else if (modo === 'petalos') { a[i * 3] += Math.sin(t * 0.6 + sm) * real * 0.8; a[i * 3 + 1] -= real * 0.35; if (a[i * 3 + 1] < 0) a[i * 3 + 1] = 10; }
      else { a[i * 3] += Math.sin(t * 0.8 + sm * 3) * real * 0.6; a[i * 3 + 1] = 0.5 + ((sm * 1.7) % 4) + Math.sin(t * 1.3 + sm) * 0.5; }
    }
    pos.needsUpdate = true;
    if (modo === 'luciernagas') E.ambiente.puntos.material.opacity = 0.65 + Math.sin(t * 3) * 0.3;
  }
  if (E.nubes && E.tema === 'pradera') for (const n of E.nubes) { n.position.x += real * 0.6; if (n.position.x > 70) n.position.x = -70; }
  if (E.antorchas && E.tema === 'castillo') for (const a of E.antorchas) { a.userData.llama.scale.setScalar(1 + Math.sin(t * 17 + a.position.z) * 0.12 + Math.random() * 0.06); }
  actualizarParticulas(dt);
}

// ---------- precarga de todo y precompilación ----------
export const TODOS_TEMAS = ['pradera', 'bosque', 'desierto', 'nieve', 'castillo'];
// Carga en segundo plano los modelos de todos los mundos (uno detrás de otro para no saturar la red).
export async function precargarTodo(alProgreso) {
  const todos = [...new Set(['mago', ...TODOS_TEMAS.flatMap(modelosTema)])];
  let hechos = todos.filter((n) => yaCargado(n)).length;
  for (const n of todos) {
    if (yaCargado(n)) continue;
    const g = await cargar(n); MODELOS.get(n).valor = g; hechos++;
    if (alProgreso) alProgreso(hechos / todos.length);
  }
}
export function temaListo(nombre) { return ['mago', ...modelosTema(nombre)].every((n) => yaCargado(n)); }
// Compila los sombreadores de todo lo que puede aparecer en el mundo (monstruos y jefe incluidos)
// antes de jugar, para que la primera vez que sale algo no haya tirones.
let efectosPrecompilar = null;
export async function precompilar() {
  const temporales = [];
  for (const n of [...(MONSTRUOS_TEMA[E.tema] || []), 'jefe-' + E.tema]) {
    const a = copiaAnimada(n, 1.5);
    if (!a) continue;
    a.o.position.set(0, 0, -20); E.escena.add(a.o); temporales.push(a.o);
  }
  // Efectos que se crean durante la partida (proyectil, halo, onda, moneda, sombra): se compilan ya para que la primera
  // vez que aparecen no den un tirón (en Safari compilar un sombreador puede costar varios fotogramas).
  // (No se liberan: si se liberara el material, three.js borraría también el sombreador compilado.)
  const ef = efectosPrecompilar || (efectosPrecompilar = [
    new THREE.Mesh(geoProyectil, new THREE.MeshBasicMaterial({ color: '#ffffff' })),
    new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })),
    new THREE.Mesh(geoProyectil, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, side: THREE.DoubleSide })),
    new THREE.Mesh(geoMoneda, toon('#ffcc33', { metalness: 0.9, roughness: 0.25, emissive: '#aa7700', emissiveIntensity: 0.3 })),
  ]);
  for (const o of ef) { o.position.set(0, 1, -20); E.escena.add(o); temporales.push(o); }
  try { if (E.renderer.compileAsync) await E.renderer.compileAsync(E.escena, E.camara); else E.renderer.compile(E.escena, E.camara); } catch (e) { /* sin precompilar */ }
  for (const o of temporales) E.escena.remove(o);
}
