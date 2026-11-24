// ¡Palabrones! · Interfaz: pantallas, menús, HUD, explicaciones, resultados y teclado.
import * as E from './escena.js?v=1.1.6';
import { J, empezar, lanzar, congelar, pausar, abandonar } from './juego.js?v=1.1.6';
import * as Pr from './progreso.js?v=1.1.6';
import { CATS, TRUCOS, MUNDOS, TIENDA, AVATARES, claveNivel } from './datos.js?v=1.1.6';
import { iniciarAudio, musica, volumenes, sfx, precargarMusica } from './audio.js?v=1.1.6';
import { decir, callar, activarVoz, desbloquearVoz } from './voz.js?v=1.1.6';
import { dibujar as dibujarEtiquetas, limpiar as limpiarEtiquetas } from './etiquetas.js?v=1.1.6';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---------- iconos SVG (los emojis de controles se ven mal en iOS) ----------
const ICO = {
  estrella: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="#ffd23f" stroke="#a86a00" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  estrellaVacia: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.45)" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  moneda: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#ffcc33" stroke="#a86a00" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="none" stroke="#e09a00" stroke-width="1.5"/><path d="M12 8.5v7" stroke="#a86a00" stroke-width="2" stroke-linecap="round"/></svg>',
  llama: '<svg viewBox="0 0 24 24"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5.5C10 10 11 11 11.5 12 12.5 9 12.5 5 12 2z" fill="#ff7a1a" stroke="#8a2a00" stroke-width="1.3" stroke-linejoin="round"/><path d="M12 13c1.2 1.4 2 2.4 2 3.8a2 2 0 0 1-4 0c0-1.3.8-2.4 2-3.8z" fill="#ffe066"/></svg>',
  corazon: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-8-4.8-8-11A4.5 4.5 0 0 1 12 6.6 4.5 4.5 0 0 1 20 9.5c0 6.2-8 11-8 11z" fill="#ff4d6d" stroke="#7a0a24" stroke-width="1.5" stroke-linejoin="round"/><path d="M7.5 8.5a2 2 0 0 1 2-1.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none" opacity=".7"/></svg>',
  engranaje: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.6"/><path d="M12 2.5v2.8M12 18.7v2.8M2.5 12h2.8M18.7 12h2.8M5.3 5.3l2 2M16.7 16.7l2 2M5.3 18.7l2-2M16.7 7.3l2-2"/></svg>',
  espada: '<svg viewBox="0 0 24 24"><path d="M20.5 3.5v4L10.5 17.5l-4-4 10-10z" fill="#e8f0ff" stroke="#2a1a4a" stroke-width="1.5" stroke-linejoin="round"/><path d="M4.5 12.5l7 7" stroke="#7a3a10" stroke-width="2.6" stroke-linecap="round"/><path d="M7 17l-3.5 3.5" stroke="#7a3a10" stroke-width="2.6" stroke-linecap="round"/></svg>',
  libro: '<svg viewBox="0 0 24 24"><path d="M3 5.5C6 4 9 4 12 6c3-2 6-2 9-.5V19c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z" fill="#fff6dc" stroke="#2a1a4a" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 6v13.5" stroke="#2a1a4a" stroke-width="1.5"/></svg>',
  calavera: '<svg viewBox="0 0 24 24"><path d="M12 3a8 8 0 0 0-8 8c0 2.6 1.3 4.4 3 5.5V20h10v-3.5c1.7-1.1 3-2.9 3-5.5a8 8 0 0 0-8-8z" fill="#f4f0ff" stroke="#2a1a4a" stroke-width="1.5"/><circle cx="8.8" cy="11.5" r="2" fill="#2a1a4a"/><circle cx="15.2" cy="11.5" r="2" fill="#2a1a4a"/><path d="M10 20v-2M14 20v-2" stroke="#2a1a4a" stroke-width="1.3"/><path d="M12 14.2l-1.1 1.6h2.2z" fill="#2a1a4a"/></svg>',
  sombrero: '<svg viewBox="0 0 24 24"><path d="M12 2.5l5 13H7z" fill="#a78bfa" stroke="#2a1a4a" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="12" cy="17" rx="9.5" ry="3" fill="#a78bfa" stroke="#2a1a4a" stroke-width="1.5"/><path d="M8.2 13h7.6" stroke="#ffd23f" stroke-width="2"/><circle cx="12" cy="8.5" r="1.2" fill="#ffd23f"/></svg>',
  trofeo: '<svg viewBox="0 0 24 24"><path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" fill="none" stroke="#8a5a00" stroke-width="1.5"/><path d="M7 3h10v5a5 5 0 0 1-10 0z" fill="#ffcc33" stroke="#8a5a00" stroke-width="1.5"/><path d="M12 13v4M8 21h8l-1-4H9z" fill="#ffcc33" stroke="#8a5a00" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  grafica: '<svg viewBox="0 0 24 24"><rect x="3.5" y="12" width="4" height="8" rx="1" fill="#60a5fa" stroke="#1e3a8a" stroke-width="1.3"/><rect x="10" y="7" width="4" height="13" rx="1" fill="#4ade80" stroke="#14532d" stroke-width="1.3"/><rect x="16.5" y="3.5" width="4" height="16.5" rx="1" fill="#fb7185" stroke="#7f1d1d" stroke-width="1.3"/></svg>',
  diana: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#fff" stroke="#b91c1c" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="#ef4444"/><circle cx="12" cy="12" r="3" fill="#fff"/><circle cx="12" cy="12" r="1.2" fill="#ef4444"/></svg>',
  atras: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  adelante: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  pausa: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>',
  copo: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6M12 5.5l-2-2M12 5.5l2-2M12 18.5l-2 2M12 18.5l2 2"/></svg>',
  nombre: '<svg viewBox="0 0 24 24"><path d="M3 12.5V4.5A1.5 1.5 0 0 1 4.5 3h8l8.5 8.5-9.5 9.5z" fill="#fff" stroke="#1e3a8a" stroke-width="1.6" stroke-linejoin="round"/><circle cx="7.5" cy="7.5" r="1.8" fill="#3b82f6"/></svg>',
  cualidad: '<svg viewBox="0 0 24 24"><path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z" fill="#fff" stroke="#14532d" stroke-width="1.6" stroke-linejoin="round"/><path d="M19 2.5v3M17.5 4h3M5 17.5v3M3.5 19h3" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>',
  accion: '<svg viewBox="0 0 24 24"><path d="M13.5 2L4.5 13.5h6L9.5 22l9-11.5h-6z" fill="#fff" stroke="#7f1d1d" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  bombilla: '<svg viewBox="0 0 24 24"><path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.6.5.8 1.1.8 1.7V17h6v-1c0-.6.2-1.2.8-1.7A6.5 6.5 0 0 0 12 2.5z" fill="#ffe066" stroke="#8a5a00" stroke-width="1.5"/><path d="M9.5 19.5h5M10.5 21.5h3" stroke="#8a5a00" stroke-width="1.5" stroke-linecap="round"/></svg>',
  candado: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="#cbd5e1" stroke="#1e293b" stroke-width="1.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#1e293b" stroke-width="2"/></svg>',
  corona: '<svg viewBox="0 0 24 24"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="#ffcc33" stroke="#8a5a00" stroke-width="1.5" stroke-linejoin="round"/></svg>',
};
const ICO_CAT = { S: 'nombre', A: 'cualidad', V: 'accion' };
function pintarIconos(raiz = document) { for (const s of $$('[data-ico]', raiz)) if (!s.firstChild) s.innerHTML = ICO[s.dataset.ico] || ''; }
const ico = (n, extra = '') => `<span class="ico ${extra}">${ICO[n]}</span>`;

// ---------- ajuste automático: ningún panel con scroll ----------
function desborda(el) { return el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1; }
function ajustar(el) {
  el.style.fontSize = '';
  const base = parseFloat(getComputedStyle(el).fontSize);
  let f = 1;
  while (f > 0.5 && desborda(el)) { f -= 0.04; el.style.fontSize = (base * f).toFixed(2) + 'px'; }
}
function ajustarTodo() { for (const el of $$('.pantalla.activa .ajustar, .modal.activa .ajustar')) ajustar(el); }
let tAjuste;
window.addEventListener('resize', () => { clearTimeout(tAjuste); tAjuste = setTimeout(ajustarTodo, 120); });

// ---------- pantallas y ventanas ----------
let pantalla = 'p-titulo';
function mostrar(id) {
  for (const p of $$('.pantalla')) p.classList.toggle('activa', p.id === id);
  pantalla = id;
  if (id !== 'p-juego') limpiarBanner();
  if (id !== 'p-juego' && id !== 'p-resultado') E.vista('menu');
  requestAnimationFrame(ajustarTodo);
}
function abrir(id) { $('#' + id).classList.add('activa'); requestAnimationFrame(ajustarTodo); }
function cerrar(id) { $('#' + id).classList.remove('activa'); }
const abierta = (id) => $('#' + id).classList.contains('activa');

for (const b of $$('.b-volver')) b.addEventListener('click', () => { sfx.click(); restaurarAspecto(); irA(b.dataset.volver || 'p-inicio'); });

function irA(id) {
  if (id === 'p-inicio') pintarInicio();
  if (id === 'p-progreso') pintarProgreso();
  mostrar(id);
  if (id === 'p-inicio' || id === 'p-perfiles') { asegurarTema(temaActual()); musica('menu'); }
}

// ---------- arranque ----------
const perfil = () => Pr.P.perfil;
function calidad() {
  const c = Pr.ajustes().calidad;
  if (c !== 'auto') return c;
  const tactilSolo = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
  const memoria = navigator.deviceMemory || 8, nucleos = navigator.hardwareConcurrency || 8;
  return tactilSolo || memoria < 4 || nucleos <= 4 ? 'baja' : 'alta';
}

let listo3D = false;
try {
  E.iniciar($('#c3d'), calidad());
  E.retro(!!Pr.ajustes().retro);
  E.default.alDibujar = dibujarEtiquetas;
  E.aspectoHeroe({ color: 'violeta', sombrero: 'mago', mascota: 'ninguna' }, '#a78bfa');
  E.vista('titulo', true);
  listo3D = true;
} catch (e) {
  console.error(e);
  $('#aviso-carga').textContent = 'Este navegador no puede mostrar gráficos 3D. Prueba con Chrome, Edge, Firefox o Safari actualizados.';
}
// Precarga: primero Lumi y el primer mundo (ya se puede jugar); luego, en segundo plano, todo lo demás.
function progresoCarga(p, texto) {
  $('#carga-barra').style.width = Math.round(p * 100) + '%';
  $('#aviso-carga').textContent = `${texto} ${Math.round(p * 100)} %`;
}
async function precargarInicio() {
  if (!listo3D) return;
  $('#b-empezar').disabled = true;
  $('#carga').classList.remove('oculto');
  await E.prepararTema('pradera', (p) => progresoCarga(p, 'Cargando el mundo…'));
  E.mostrarHeroe(); // el círculo de Lumi no se ve mientras carga
  $('#b-empezar').disabled = false;
  $('#carga').classList.add('oculto');
  $('#aviso-carga').textContent = '';
  E.precargarTodo((p) => { window.__precarga = p; }).then(() => precargarMusica());
}
precargarInicio();
// Antes de jugar o de ver un mundo, se asegura de que sus modelos están cargados y listos.
let cargandoMundo = null;
async function asegurarTema(t) {
  if (!E.temaListo(t)) {
    $('#cargando-mundo').classList.add('activa');
    await E.prepararTema(t, (p) => { $('#cargando-barra').style.width = Math.round(p * 100) + '%'; });
    $('#cargando-mundo').classList.remove('activa');
  } else await E.prepararTema(t);
}
pintarIconos();
const aj = Pr.ajustes();
volumenes(aj.musica, aj.efectos);
activarVoz(aj.voz);
(document.fonts && document.fonts.load ? Promise.race([document.fonts.load('100px "Lilita One"'), new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve()).then(() => {
  if (listo3D) $('#aviso-carga').textContent = '';
});

$('#b-empezar').addEventListener('click', () => {
  iniciarAudio(); desbloquearVoz();
  musica('menu'); sfx.click();
  pintarPerfiles();
  mostrar('p-perfiles');
});

// ---------- perfiles ----------
let avatarElegido = AVATARES[0];
function pintarPerfiles() {
  const lista = Pr.perfiles();
  const cont = $('#lista-perfiles');
  cont.innerHTML = lista.length ? '' : '<p class="vacio-perfiles">Todavía no hay jugadores. ¡Crea el tuyo!</p>';
  for (const p of lista) {
    const b = document.createElement('button');
    b.className = 'perfil';
    b.innerHTML = `<span class="avatar">${esc(p.avatar)}</span><b>${esc(p.nombre)}</b><small>Nivel ${p.nivel} · ${Pr.estrellasTotales(p)} ★</small>`;
    b.addEventListener('click', () => { sfx.click(); Pr.usarPerfil(p.id); entrar(); });
    cont.appendChild(b);
  }
}
$('#b-nuevo').addEventListener('click', () => {
  sfx.click();
  const usados = new Set(Pr.perfiles().map((p) => p.avatar));
  avatarElegido = AVATARES.find((a) => !usados.has(a)) || AVATARES[0];
  const cont = $('#lista-avatares'); cont.innerHTML = '';
  for (const a of AVATARES) {
    const b = document.createElement('button'); b.textContent = a; b.className = a === avatarElegido ? 'elegido' : '';
    b.addEventListener('click', () => { sfx.click(); avatarElegido = a; $$('#lista-avatares button').forEach((x) => x.classList.toggle('elegido', x === b)); });
    cont.appendChild(b);
  }
  $('#i-nombre').value = '';
  abrir('m-nuevo');
  setTimeout(() => $('#i-nombre').focus(), 100);
});
$('#b-cancelar-nuevo').addEventListener('click', () => { sfx.click(); cerrar('m-nuevo'); });
function crear() {
  const n = $('#i-nombre').value.trim();
  if (!n) { $('#i-nombre').focus(); $('#i-nombre').placeholder = '¡Escribe tu nombre!'; return; }
  sfx.compra();
  Pr.crearPerfil(n, avatarElegido);
  cerrar('m-nuevo');
  entrar();
}
$('#b-crear').addEventListener('click', crear);
$('#i-nombre').addEventListener('keydown', (e) => { if (e.key === 'Enter') crear(); });
$('#b-invitado').addEventListener('click', () => { sfx.click(); Pr.invitado(); entrar(); });

function entrar() {
  restaurarAspecto();
  irA('p-inicio');
  E.heroeSalta();
}

function temaActual() {
  const p = perfil();
  if (!p) return 'pradera';
  return MUNDOS[Math.min(MUNDOS.length - 1, Math.floor((p.desbloqueado - 1) / 4))].tema;
}
function colorTunica(id) { return (TIENDA.colores.find((c) => c.id === id) || TIENDA.colores[0]).hex; }
function restaurarAspecto() { const p = perfil(); if (p) E.aspectoHeroe(p.aspecto, colorTunica(p.aspecto.color)); }

// ---------- menú principal ----------
function pintarInicio() {
  const p = perfil();
  $('#j-avatar').textContent = p.avatar;
  $('#j-nombre').textContent = p.nombre;
  $('#j-rango').textContent = Pr.rango(p.nivel).nombre;
  $('#j-nivel').textContent = `Nv ${p.nivel} · ${p.xp}/${Pr.xpParaSubir(p.nivel)} XP`;
  $('#j-xp').style.width = Math.round((p.xp / Pr.xpParaSubir(p.nivel)) * 100) + '%';
  $('#j-racha').textContent = p.racha.dias;
  $('#j-estrellas').textContent = Pr.estrellasTotales(p);
  $('#j-monedas').textContent = p.monedas;
  const g = Math.min(p.desbloqueado - 1, MUNDOS.length * 4 - 1);
  $('#sub-aventura').textContent = `Mundo ${Math.floor(g / 4) + 1} · ${MUNDOS[Math.floor(g / 4)].nombre}`;
  const rep = Pr.palabrasRepaso().length;
  $('#globo-repaso').textContent = rep; $('#globo-repaso').classList.toggle('oculto', rep === 0);
  $('#sub-entrenar').textContent = rep ? `${rep} por repasar` : 'Práctica tranquila';
  $('#sub-desafio').textContent = `Récord ${p.record.desafio}`;
  $('#lista-misiones').innerHTML = p.misiones.lista.map((m) => `<li class="mision ${m.hecha ? 'hecha' : ''}"><span>${m.hecha ? '✔ ' : ''}${esc(m.texto)}</span><span class="premio-m">${ico('moneda')}${m.premio}</span><span class="barra"><i style="width:${Math.round((m.prog / m.meta) * 100)}%"></i></span></li>`).join('');
  $('#b-borrar').classList.toggle('oculto', p.invitado);
}
$('#chip-jugador').addEventListener('click', () => { sfx.click(); pintarPerfiles(); mostrar('p-perfiles'); });
$('#b-aventura').addEventListener('click', () => { sfx.click(); const p = perfil(); mundoMapa = Math.min(MUNDOS.length - 1, Math.floor((Math.min(p.desbloqueado, MUNDOS.length * 4) - 1) / 4)); pintarMapa(); mostrar('p-mapa'); });
$('#b-entrenar').addEventListener('click', () => { sfx.click(); jugar({ modo: 'repaso' }); });
$('#b-desafio').addEventListener('click', () => { sfx.click(); introModo('desafio'); });
$('#b-tienda').addEventListener('click', () => { sfx.click(); pintarTienda(); mostrar('p-tienda'); });
$('#b-logros').addEventListener('click', () => { sfx.click(); pintarLogros(); mostrar('p-logros'); });
$('#b-progreso').addEventListener('click', () => { sfx.click(); pintarProgreso(); mostrar('p-progreso'); });
$('#b-opciones').addEventListener('click', () => { sfx.click(); pintarOpciones(); mostrar('p-opciones'); });

// ---------- mapa ----------
let mundoMapa = 0;
function pintarMapa() {
  const p = perfil(), m = MUNDOS[mundoMapa];
  asegurarTema(m.tema);
  $('#mapa-num').textContent = `Mundo ${mundoMapa + 1}`;
  $('#mapa-nombre').textContent = m.nombre;
  $('#mapa-lema').textContent = m.lema;
  $('#mapa-estrellas').textContent = Pr.estrellasTotales(p);
  const cont = $('#mapa-niveles'); cont.innerHTML = '';
  m.niveles.forEach((nv, i) => {
    const g = mundoMapa * 4 + i, abierto = g < p.desbloqueado, est = p.estrellas[claveNivel(mundoMapa, i)] || 0;
    const b = document.createElement('button');
    b.className = `nodo ${nv.tipo === 'jefe' ? 'jefe' : ''} ${abierto ? '' : 'bloq'} ${abierto && g === p.desbloqueado - 1 && !est ? 'actual' : ''}`;
    const centro = !abierto ? ico('candado') : nv.tipo === 'jefe' ? ico('corona') : i + 1;
    b.innerHTML = `<span class="nodo-bola">${centro}</span><span class="nodo-nombre">${esc(nv.tipo === 'jefe' ? m.jefe.nombre : nv.nombre)}</span><span class="mini-estrellas">${[1, 2, 3].map((k) => ico(k <= est ? 'estrella' : 'estrellaVacia')).join('')}</span>`;
    b.addEventListener('click', () => {
      if (!abierto) { sfx.fallo(); b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-0.4rem)' }, { transform: 'translateX(0.4rem)' }, { transform: 'translateX(0)' }], { duration: 250 }); return; }
      sfx.click(); introNivel(mundoMapa, i);
    });
    cont.appendChild(b);
  });
  $('#mapa-puntos').innerHTML = MUNDOS.map((_, i) => `<i class="${i === mundoMapa ? 'activo' : ''}"></i>`).join('');
  $('#mapa-ant').disabled = mundoMapa === 0;
  $('#mapa-sig').disabled = mundoMapa === MUNDOS.length - 1;
  musica(m.tema);
  requestAnimationFrame(ajustarTodo);
}
$('#mapa-ant').addEventListener('click', () => { if (mundoMapa > 0) { sfx.click(); mundoMapa--; pintarMapa(); } });
$('#mapa-sig').addEventListener('click', () => { if (mundoMapa < MUNDOS.length - 1) { sfx.click(); mundoMapa++; pintarMapa(); } });

// ---------- intro de nivel ----------
let cfgPendiente = null;
function miniHechizo(c) { return `<div class="mini-hechizo" style="--c:${CATS[c].color}"><b>${ico(ICO_CAT[c])}${CATS[c].nombre}</b>${esc(TRUCOS[c].que)}</div>`; }
function introNivel(mi, ni) {
  const m = MUNDOS[mi], nv = m.niveles[ni], p = perfil();
  cfgPendiente = { modo: 'campana', mundo: mi, nivel: ni };
  $('#intro-num').textContent = `Mundo ${mi + 1} · ${nv.tipo === 'jefe' ? 'Jefe final' : 'Nivel ' + (ni + 1)}`;
  $('#intro-nombre').textContent = nv.tipo === 'jefe' ? m.jefe.nombre : nv.nombre;
  const est = p.estrellas[claveNivel(mi, ni)] || 0;
  $('#intro-estrellas').innerHTML = [1, 2, 3].map((k) => ico(k <= est ? 'estrella' : 'estrellaVacia')).join('');
  $('#intro-nuevo').textContent = nv.nuevo;
  $('#intro-hechizos').innerHTML = (nv.cats || ['S', 'A', 'V']).map(miniHechizo).join('');
  $('#intro-controles').classList.toggle('oculto', Pr.estrellasTotales(p) > 3);
  abrir('m-intro');
}
function introModo(modo) {
  cfgPendiente = { modo };
  $('#intro-num').textContent = modo === 'desafio' ? 'Desafío infinito' : 'Entrenamiento';
  $('#intro-nombre').textContent = modo === 'desafio' ? '¿Cuántos aguantas?' : 'Repasa tus fallos';
  $('#intro-estrellas').innerHTML = '';
  $('#intro-nuevo').textContent = modo === 'desafio' ? `Los Palabrones no paran y cada vez van más rápido. Tienes 3 corazones. Tu récord: ${perfil().record.desafio}.` : '';
  $('#intro-hechizos').innerHTML = ['S', 'A', 'V'].map(miniHechizo).join('');
  $('#intro-controles').classList.add('oculto');
  abrir('m-intro');
}
$('#intro-volver').addEventListener('click', () => { sfx.click(); cerrar('m-intro'); });
$('#intro-jugar').addEventListener('click', () => { sfx.click(); cerrar('m-intro'); jugar(cfgPendiente); });

let ultimaCfg = null;
async function jugar(cfg) {
  ultimaCfg = cfg;
  limpiarBanner(); limpiarEtiquetas();
  await asegurarTema(cfg.modo === 'campana' ? MUNDOS[cfg.mundo].tema : cfg.modo === 'desafio' ? 'castillo' : 'pradera');
  restaurarAspecto();
  mostrar('p-juego');
  $('#hud-jefe').classList.toggle('oculto', !(cfg.modo === 'campana' && MUNDOS[cfg.mundo].niveles[cfg.nivel].tipo === 'jefe'));
  $('#hud-objetivo').classList.add('vacio');
  $('#hud-racha').classList.add('oculto');
  empezar(cfg, UI);
}

// ---------- HUD ----------
let vidasAntes = 3;
const UI = {
  botones(cats) {
    for (const b of $$('.hechizo')) b.classList.toggle('bloqueado', !cats.includes(b.dataset.cat));
    $('#b-congelar').classList.toggle('oculto-jefe', !!J.jefe);
  },
  hud(s) {
    const v = $('#hud-vidas');
    if (s.vidas === Infinity) v.innerHTML = `${ico('corazon')}<span class="infinito">∞</span>`;
    else {
      let h = '';
      for (let i = 0; i < s.max; i++) h += ico('corazon', i < s.vidas ? (i === s.vidas - 1 && s.vidas > vidasAntes ? 'late' : '') : 'perdida' + (i === s.vidas && s.vidas < vidasAntes ? ' late' : ''));
      v.innerHTML = h; vidasAntes = s.vidas;
    }
    const prog = $('#hud-progreso');
    if (s.jefe || s.n === Infinity) { prog.querySelector('i').style.width = '100%'; prog.querySelector('b').textContent = s.jefe ? 'Jefe' : `${s.vencidos} vencidos · Oleada ${s.oleada}`; }
    else { prog.querySelector('i').style.width = Math.min(100, (s.vencidos / s.n) * 100) + '%'; prog.querySelector('b').textContent = s.modo === 'campana' ? `${s.vencidos}/${s.n} · Oleada ${s.oleada}/3` : `${s.vencidos}/${s.n}`; }
    $('#hud-puntos').textContent = s.puntos.toLocaleString('es-ES');
    const r = $('#hud-racha');
    r.classList.toggle('oculto', s.combo < 3);
    $('#racha-mult').textContent = 'x' + s.mult;
    $('#racha-n').textContent = `${s.combo} seguidas`;
    const sb = $('#b-congelar');
    sb.classList.toggle('listo', s.superCarga >= 1 && !s.congelado);
    $('#super-carga').style.height = Math.round(s.superCarga * 100) + '%';
    if (s.jefe) {
      $('#jefe-nombre').textContent = s.jefe.nombre;
      $('#jefe-vida').style.width = (s.jefe.vida / s.jefe.max) * 100 + '%';
      const t = Math.max(0, s.jefe.resto / s.jefe.tiempo);
      $('#jefe-tiempo').style.width = t * 100 + '%';
      $('.jefe-tiempo').classList.toggle('prisa', t < 0.35);
    }
  },
  objetivo(d) {
    const o = $('#hud-objetivo');
    if (!d) { o.classList.add('vacio'); return; }
    o.classList.remove('vacio', 'nuevo'); void o.offsetWidth; o.classList.add('nuevo');
    $('#obj-palabra').textContent = d.texto;
    $('#obj-frase').innerHTML = d.frase ? fraseHTML(d.frase, d.indice, d.hechos || []) : '';
    o.querySelector('.obj-pregunta').textContent = d.frase ? 'En esta frase, ¿qué es…?' : '¿Qué es…?';
  },
  cuenta(n) {
    const c = $('#cuenta');
    c.innerHTML = `<span>${n}</span>`;
    if (n === '¡Ya!') setTimeout(() => { if (c.textContent === '¡Ya!') c.innerHTML = ''; }, 900);
  },
  popup(x, y, txt, cat, extra) {
    const d = document.createElement('div');
    d.className = 'pop'; d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.setProperty('--c', CATS[cat].oscuro);
    d.innerHTML = esc(txt) + (extra ? `<small>${esc(extra)}</small>` : '');
    $('#popups').appendChild(d);
    setTimeout(() => d.remove(), 1100);
  },
  aviso(txt, clase) {
    const icono = { racha: '🔥', oleada: '⚔️', frenesi: '⚡', vida: '❤️', hielo: '❄️', jefe: '👑' }[clase] || '';
    anunciar({ icono, titulo: txt, clase, ms: clase === 'jefe' ? 2000 : 1500 });
  },
  peligro(n) {
    const v = $('#peligro');
    v.style.opacity = Math.min(1, n * 1.15).toFixed(2);
    v.classList.toggle('late', n > 0.45);
  },
  frenesi(si) { $('#p-juego').classList.toggle('frenesi', si); },
  sinObjetivo() { const o = $('#hud-objetivo'); o.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-0.3rem)' }, { transform: 'translateX(0.3rem)' }, { transform: 'translateX(0)' }], { duration: 200 }); },
  explicar(d, alCerrar) { mostrarExplicacion(d, alCerrar); },
  eventos(ev) { for (const e of ev) encolarEvento(e); },
  fin(r) { mostrarResultado(r); },
};

function fraseHTML(tokens, indice, hechos = []) {
  return tokens.map((t, i) => {
    const txt = esc(t.t);
    let h = txt;
    if (i === indice) h = `<mark>${txt}</mark>`;
    else if (hechos.includes(i)) h = `<span class="hecho-${t.cat}">${txt}</span>`;
    return h + esc(t.punt || '');
  }).join(' ');
}

// Hechizos: pointerdown para que respondan al instante en pantallas táctiles.
for (const b of $$('.hechizo')) {
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); lanzarUI(b.dataset.cat); });
}
function lanzarUI(cat) {
  if (abierta('m-explica') || abierta('m-pausa')) return;
  const b = $(`.hechizo[data-cat="${cat}"]`);
  if (b.classList.contains('bloqueado')) return;
  b.classList.add('pulsado'); setTimeout(() => b.classList.remove('pulsado'), 120);
  lanzar(cat);
}
$('#b-congelar').addEventListener('pointerdown', (e) => { e.preventDefault(); congelar(); });
$('#b-pausa').addEventListener('click', () => abrirPausa());

function abrirPausa() {
  if (!J.activo || J.terminado || abierta('m-explica')) return;
  pausar(true); sfx.click();
  $('#pausa-trucos').innerHTML = ['S', 'A', 'V'].map((c) => `<div class="mini-hechizo" style="--c:${CATS[c].color}"><b>${ico(ICO_CAT[c])}${CATS[c].nombre}</b>${esc(TRUCOS[c].que)} <i>${esc(TRUCOS[c].prueba)}</i></div>`).join('');
  abrir('m-pausa');
}
$('#pausa-seguir').addEventListener('click', () => { sfx.click(); cerrar('m-pausa'); pausar(false); });
$('#pausa-salir').addEventListener('click', () => { sfx.click(); cerrar('m-pausa'); abandonar(); callar(); restaurarAspecto(); irA(ultimaCfg && ultimaCfg.modo === 'campana' ? 'p-mapa' : 'p-inicio'); if (ultimaCfg && ultimaCfg.modo === 'campana') pintarMapa(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && pantalla === 'p-juego' && J.activo && !J.terminado && !J.pausado) abrirPausa(); });

// ---------- explicación del fallo ----------
let cerrarExplica = null, explicaDesde = 0;
function mostrarExplicacion(d, alCerrar) {
  const c = CATS[d.correcta];
  const panel = $('.panel-explica');
  panel.style.setProperty('--c', c.color); panel.style.setProperty('--c-osc', c.oscuro);
  $('#ex-titulo').textContent = d.elegida ? `¡Ups! No es ${CATS[d.elegida].nombre.toLowerCase()}` : J.jefe ? '¡Se acabó el tiempo!' : '¡Te ha alcanzado!';
  $('#ex-palabra').textContent = d.palabra;
  $('#ex-es').innerHTML = `es un <b>${c.nombre.toLowerCase()}</b>`;
  $('#ex-frase').innerHTML = d.frase ? '«' + fraseHTML(d.frase, d.indice) + '»' : '';
  $('#ex-elegiste').textContent = d.camaleon ? '🦎 Palabra camaleón' : '';
  cerrarExplica = alCerrar; explicaDesde = performance.now();
  abrir('m-explica');
  decir(`${d.palabra}: es un ${c.nombre.toLowerCase()}.`);
}
function cerrarExplicacion() {
  if (!abierta('m-explica') || performance.now() - explicaDesde < 700) return;
  sfx.click(); callar();
  cerrar('m-explica');
  const f = cerrarExplica; cerrarExplica = null;
  if (f) f();
}
$('#ex-vale').addEventListener('click', cerrarExplicacion);

// ---------- resultados ----------
function mostrarResultado(r) {
  const p = perfil();
  mostrar('p-resultado');
  E.vista('menu');
  let titulo;
  const esJefe = r.modo === 'campana' && MUNDOS[r.mundo].niveles[r.nivel].tipo === 'jefe';
  if (r.modo === 'campana') titulo = r.superado ? (esJefe ? '¡Jefe vencido!' : '¡Nivel superado!') : '¡Oh, no! Otra vez';
  else if (r.modo === 'desafio') titulo = r.mejora ? '¡Nuevo récord!' : `¡${r.vencidos} Palabrones!`;
  else titulo = '¡Entrenamiento hecho!';
  $('#res-titulo').textContent = titulo;
  if (r.superado || r.modo !== 'campana') E.celebrar(); else E.entristecer();
  const est = $('#res-estrellas');
  if (r.modo === 'campana') {
    est.innerHTML = [1, 2, 3].map(() => ico('estrella')).join('');
    [...est.children].forEach((s, i) => { if (i < r.estrellas) setTimeout(() => { s.classList.add('gana'); sfx.estrella(i); }, 500 + i * 380); });
  } else est.innerHTML = r.modo === 'desafio' ? `<span class="res-record">${ico('calavera')}</span>` : `<span>${ico('libro')}</span>`;
  $('#res-puntos').textContent = r.puntos.toLocaleString('es-ES');
  $('#res-acierto').textContent = r.total ? Math.round((r.ok / r.total) * 100) + ' %' : '—';
  $('#res-racha').textContent = r.mejorCombo;
  $('#res-cats').innerHTML = ['S', 'A', 'V'].filter((c) => r.porCat[c].total).map((c) => `<div class="res-cat" style="--c:${CATS[c].color}"><b>${r.porCat[c].ok}/${r.porCat[c].total}</b>${CATS[c].nombre}s</div>`).join('');
  $('#res-monedas').textContent = r.monedas;
  $('#res-xp').textContent = r.xp;
  $('#res-nivel').textContent = `Nv ${p.nivel} · ${p.xp}/${Pr.xpParaSubir(p.nivel)} XP`;
  $('#res-barra').style.width = '0%';
  setTimeout(() => ($('#res-barra').style.width = Math.round((p.xp / Pr.xpParaSubir(p.nivel)) * 100) + '%'), 300);
  const hay = r.modo === 'campana' && r.superado && r.mundo * 4 + r.nivel + 1 < MUNDOS.length * 4;
  $('#res-seguir').classList.toggle('oculto', !hay);
  $('#res-seguir').textContent = r.nivel === 3 ? 'Nuevo mundo' : 'Siguiente';
  musica('menu');
  for (const e of r.eventos) encolarEvento(e);
  requestAnimationFrame(ajustarTodo);
}
$('#res-menu').addEventListener('click', () => { sfx.click(); irA('p-inicio'); });
$('#res-repetir').addEventListener('click', () => { sfx.click(); jugar(ultimaCfg); });
$('#res-seguir').addEventListener('click', () => {
  sfx.click();
  const g = ultimaCfg.mundo * 4 + ultimaCfg.nivel + 1;
  mundoMapa = Math.floor(g / 4);
  mostrar('p-mapa'); pintarMapa();
  introNivel(Math.floor(g / 4), g % 4);
});

// ---------- logros, misiones y subidas de nivel ----------
const colaNiveles = [];
function encolarEvento(e) {
  if (e.tipo === 'logro') toast(e.logro.icono, '¡Logro! ' + e.logro.nombre, e.logro.desc, 'logro');
  else if (e.tipo === 'mision') toast('🎯', '¡Misión cumplida!', `${e.texto} · +${e.premio} monedas`, 'mision');
  else if (e.tipo === 'nivel') { colaNiveles.push(e); if (!abierta('m-nivel')) setTimeout(siguienteNivel, 1600); }
}
// Franja de avisos de la partida: de uno en uno, justo debajo de la tarjeta de la pregunta.
const colaBanner = []; let bannerOcupado = false, tBanner = 0;
function anunciar(o) {
  if (colaBanner.length >= 4) colaBanner.shift();
  colaBanner.push(o);
  if (!bannerOcupado) siguienteBanner();
}
function siguienteBanner() {
  const o = colaBanner.shift();
  const b = $('#banner');
  if (!o) { bannerOcupado = false; b.className = 'banner'; return; }
  bannerOcupado = true;
  b.className = 'banner ' + (o.clase || '');
  b.innerHTML = `${o.icono ? `<span class="b-ico">${esc(o.icono)}</span>` : ''}<span class="b-txt"><span>${esc(o.titulo)}</span>${o.sub ? `<span class="b-sub">${esc(o.sub)}</span>` : ''}</span>`;
  b.style.animationDuration = (o.ms || 1500) + 'ms';
  void b.offsetWidth; b.classList.add('entra');
  clearTimeout(tBanner);
  tBanner = setTimeout(() => { b.className = 'banner'; setTimeout(siguienteBanner, 100); }, o.ms || 1500);
}
function limpiarBanner() { colaBanner.length = 0; bannerOcupado = false; clearTimeout(tBanner); const b = $('#banner'); if (b) b.className = 'banner'; }

let tToast = 0;
function toast(icono, titulo, texto, clase) {
  if (pantalla === 'p-juego') { sfx.logro(); anunciar({ icono, titulo, sub: texto, clase: clase === 'logro' ? 'logro' : 'mision', ms: 2600 }); return; }
  const ahora = performance.now();
  const espera = Math.max(0, tToast - ahora);
  tToast = Math.max(ahora, tToast) + 1200;
  setTimeout(() => {
    const d = document.createElement('div');
    d.className = 'aviso ' + clase;
    d.innerHTML = `<span class="icono">${esc(icono)}</span><span><b>${esc(titulo)}</b><small>${esc(texto)}</small></span>`;
    $('#avisos').appendChild(d);
    sfx.logro();
    setTimeout(() => d.remove(), 3500);
  }, espera);
}
function siguienteNivel() {
  const e = colaNiveles.shift();
  if (!e) return;
  $('#nivel-num').textContent = e.nivel;
  $('#nivel-rango').textContent = e.rango ? `Nuevo rango: ${e.rango}` : Pr.rango(e.nivel).nombre;
  $('#nivel-premio').textContent = e.premio;
  sfx.nivel(); E.heroeSalta();
  abrir('m-nivel');
}
$('#nivel-vale').addEventListener('click', () => { sfx.click(); cerrar('m-nivel'); if (colaNiveles.length) setTimeout(siguienteNivel, 250); else if (pantalla === 'p-resultado') { const p = perfil(); $('#res-nivel').textContent = `Nv ${p.nivel} · ${p.xp}/${Pr.xpParaSubir(p.nivel)} XP`; } });

// ---------- tienda ----------
let pestana = 'sombreros', probando = null;
const MUESTRAS = { mago: '🧙', gorra: '🧢', vikingo: '⚔️', corona: '👑', flores: '🌸', chistera: '🎩', ninguna: '✖️', buho: '🦉', slime: '🟢', dragon: '🐉', estrella: '⭐', pez: '🐟' };
const CAMPO = { sombreros: 'sombrero', colores: 'color', mascotas: 'mascota' };
function pintarTienda() {
  const p = perfil();
  $('#tienda-monedas').textContent = p.monedas;
  for (const t of $$('.pestana')) t.classList.toggle('activa', t.dataset.tab === pestana);
  const cont = $('#tienda-lista'); cont.innerHTML = '';
  for (const it of TIENDA[pestana]) {
    const tiene = p.comprado.includes(it.id), puesto = p.aspecto[CAMPO[pestana]] === it.id;
    const b = document.createElement('button');
    b.className = `articulo ${puesto ? 'puesto' : ''} ${!tiene && p.monedas < it.precio ? 'caro' : ''}`;
    const muestra = pestana === 'colores' ? `<span class="muestra" style="background:${it.hex}"></span>` : `<span class="muestra">${MUESTRAS[it.id] || '✨'}</span>`;
    const estado = puesto ? '<span class="estado">Puesto ✔</span>' : tiene ? '<span class="estado">Tuyo · ponértelo</span>' : `<span class="precio">${ico('moneda')}${it.precio}</span>`;
    b.innerHTML = `${muestra}<b>${esc(it.nombre)}</b>${estado}`;
    b.addEventListener('click', () => tocarArticulo(it));
    cont.appendChild(b);
  }
  requestAnimationFrame(ajustarTodo);
}
function tocarArticulo(it) {
  const p = perfil();
  const campo = CAMPO[pestana];
  if (p.comprado.includes(it.id)) { sfx.click(); Pr.equipar(pestana, it.id); probando = null; restaurarAspecto(); E.heroeSalta(); pintarTienda(); return; }
  // Primer toque: probárselo. Segundo toque: comprar.
  if (probando !== it.id) {
    probando = it.id; sfx.click();
    E.aspectoHeroe(Object.assign({}, p.aspecto, { [campo]: it.id }), colorTunica(campo === 'color' ? it.id : p.aspecto.color));
    toast(MUESTRAS[it.id] || '🎨', 'Probándote: ' + it.nombre, p.monedas >= it.precio ? `Toca otra vez para comprarlo (${it.precio} monedas)` : `Te faltan ${it.precio - p.monedas} monedas`, 'mision');
    return;
  }
  const r = Pr.comprar(pestana, it.id);
  if (r.ok) { sfx.compra(); probando = null; restaurarAspecto(); E.heroeSalta(); for (const e of r.eventos) encolarEvento(e); Pr.guardar(); }
  else sfx.fallo();
  pintarTienda();
}
for (const t of $$('.pestana')) t.addEventListener('click', () => { sfx.click(); pestana = t.dataset.tab; probando = null; restaurarAspecto(); pintarTienda(); });

// ---------- logros ----------
function pintarLogros() {
  const p = perfil();
  $('#logros-cuenta').textContent = `${Object.keys(p.logros).length}/${Pr.LOGROS.length}`;
  const cont = $('#lista-logros'); cont.innerHTML = '';
  for (const l of Pr.LOGROS) {
    const b = document.createElement('button');
    const ganado = !!p.logros[l.id];
    b.className = 'insignia' + (ganado ? ' ganada' : '');
    b.textContent = l.icono; b.title = l.nombre;
    b.addEventListener('click', () => {
      sfx.click(); $$('.insignia').forEach((x) => x.classList.toggle('sel', x === b));
      $('#logro-detalle').innerHTML = `<b>${esc(l.nombre)}</b><br>${esc(l.desc)}${ganado ? ` · ✔ conseguido el ${esc(p.logros[l.id].split('-').reverse().join('/'))}` : ''}`;
    });
    cont.appendChild(b);
  }
  $('#logro-detalle').textContent = 'Toca una insignia para ver cómo se consigue.';
}

// ---------- progreso ----------
function anillo(pct, color) {
  const r = 26, c = 2 * Math.PI * r;
  return `<svg viewBox="0 0 64 64" role="img" aria-label="${pct} %"><circle cx="32" cy="32" r="${r}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="8"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(c * pct) / 100} ${c}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle" fill="#fff8ec" font-family="Lilita One, sans-serif" font-size="15">${pct}%</text></svg>`;
}
function grafica(sesiones) {
  const datos = sesiones.filter((s) => s.total > 0).slice(-12);
  const W = 300, H = 110, x0 = 26, y0 = 8, alto = H - y0 - 18;
  if (!datos.length) return `<svg viewBox="0 0 ${W} ${H}"><text class="vacio" x="${W / 2}" y="${H / 2}" text-anchor="middle">Juega unas partidas y aquí verás tu evolución</text></svg>`;
  const ancho = (W - x0 - 4) / 12;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Porcentaje de acierto de las últimas partidas">`;
  for (const v of [0, 50, 100]) { const y = y0 + alto - (v / 100) * alto; s += `<line class="eje" x1="${x0}" x2="${W}" y1="${y}" y2="${y}"/><text x="${x0 - 4}" y="${y + 4}" text-anchor="end">${v}</text>`; }
  datos.forEach((d, i) => {
    const pct = Math.min(100, Math.round((d.ok / d.total) * 100)), h = Math.max(2, (pct / 100) * alto);
    const x = x0 + i * ancho + 3, y = y0 + alto - h;
    s += `<rect class="barra" x="${x}" y="${y}" width="${ancho - 6}" height="${h}" rx="4"><title>${esc(d.f.split('-').reverse().join('/'))} · ${esc(nombreModo(d))}: ${pct} % (${d.ok}/${d.total})</title></rect>`;
    if (i === datos.length - 1) s += `<text x="${x + (ancho - 6) / 2}" y="${y - 4}" text-anchor="middle" fill="#fff8ec">${pct}%</text>`;
  });
  s += `<text x="${x0}" y="${H - 3}">antes</text><text x="${W - 2}" y="${H - 3}" text-anchor="end">última</text></svg>`;
  return s;
}
function nombreModo(s) { return s.modo === 'campana' ? 'Nivel ' + s.clave : s.modo === 'desafio' ? 'Desafío' : 'Entrenamiento'; }
function pintarProgreso() {
  const p = perfil();
  $('#prog-avatar').textContent = p.avatar;
  $('#prog-nombre').textContent = p.nombre;
  $('#prog-rango').textContent = `Nivel ${p.nivel} · ${Pr.rango(p.nivel).nombre}`;
  $('#prog-totales').innerHTML = [[Pr.estrellasTotales(p), 'estrellas'], [p.vencidos, 'vencidos'], [Math.round(p.tiempo / 60), 'minutos'], [Object.keys(p.logros).length, 'logros']].map(([n, t]) => `<div><b>${n}</b><small>${t}</small></div>`).join('');
  $('#prog-dominio').innerHTML = ['S', 'A', 'V'].map((c) => {
    const d = Pr.dominio(c), s = p.stats[c];
    const med = d.medalla ? `<span class="medalla ${d.medalla}">Medalla de ${d.medalla}</span>` : `<span class="medalla nada">${d.n < 10 ? 'Juega más para ganar medalla' : 'Sigue practicando'}</span>`;
    return `<div class="dominio" style="--c:${CATS[c].color}">${anillo(d.pct, CATS[c].color)}<div><h4>${CATS[c].nombre}s</h4><p>${s.ok} de ${s.total} aciertos</p>${med}</div></div>`;
  }).join('');
  $('#prog-grafica').innerHTML = grafica(p.sesiones);
  const dif = Pr.palabrasRepaso().slice(0, 12);
  $('#prog-dificiles').innerHTML = dif.length ? dif.map((f) => `<span class="chip" style="--c:${CATS[f.cat].oscuro}" title="Es ${CATS[f.cat].nombre.toLowerCase()} · fallada ${f.veces} ${f.veces === 1 ? 'vez' : 'veces'}">${esc(f.palabra)} <small>${CATS[f.cat].nombre.slice(0, 3)}.</small></span>`).join('') : '<span class="chip-ok">¡No tienes palabras pendientes! 🎉</span>';
  requestAnimationFrame(ajustarTodo);
}
$('#b-copiar').addEventListener('click', async () => {
  const txt = Pr.informeTexto();
  try { await navigator.clipboard.writeText(txt); toast('📋', 'Informe copiado', 'Pégalo en un correo o documento para el profe.', 'mision'); }
  catch (e) { prompt('Copia este informe:', txt); }
});
$('#b-clase').addEventListener('click', () => {
  sfx.click();
  const lista = Pr.perfiles().slice().sort((a, b) => b.nivel - a.nivel || b.xp - a.xp);
  const pct = (p, c) => { const s = p.stats[c]; return s.total ? Math.round((s.ok / s.total) * 100) + ' %' : '—'; };
  $('#tabla-clase').innerHTML = lista.length ? `<table class="tabla-clase"><thead><tr><th>Jugador</th><th>Nivel</th><th>★</th><th>Vencidos</th><th class="tS">Sust.</th><th class="tA">Adj.</th><th class="tV">Verb.</th><th>Repasar</th></tr></thead><tbody>${lista.map((p) => `<tr><td>${esc(p.avatar)} ${esc(p.nombre)}</td><td class="num">${p.nivel}</td><td class="num">${Pr.estrellasTotales(p)}</td><td class="num">${p.vencidos}</td><td>${pct(p, 'S')}</td><td>${pct(p, 'A')}</td><td>${pct(p, 'V')}</td><td class="num">${Object.keys(p.fallos).length}</td></tr>`).join('')}</tbody></table>` : '<p class="nota">No hay jugadores guardados en este dispositivo.</p>';
  mostrar('p-clase');
});

// ---------- opciones ----------
function pintarOpciones() {
  const a = Pr.ajustes();
  $('#o-musica').value = a.musica; $('#o-efectos').value = a.efectos;
  $('#o-retro').checked = !!a.retro;
  $('#o-voz').checked = a.voz; $('#o-velocidad').value = a.velocidad; textoVelocidad(a.velocidad);
  for (const b of $$('#o-calidad button')) b.classList.toggle('activo', b.dataset.v === a.calidad);
  $('#b-borrar').classList.toggle('oculto', !perfil() || perfil().invitado);
}
$('#o-musica').addEventListener('input', (e) => { Pr.ajustes().musica = +e.target.value; volumenes(Pr.ajustes().musica, Pr.ajustes().efectos); Pr.guardar(); });
$('#o-efectos').addEventListener('input', (e) => { Pr.ajustes().efectos = +e.target.value; volumenes(Pr.ajustes().musica, Pr.ajustes().efectos); Pr.guardar(); });
$('#o-efectos').addEventListener('change', () => sfx.acierto(3));
$('#o-retro').addEventListener('change', (e) => { Pr.ajustes().retro = e.target.checked; E.retro(e.target.checked); Pr.guardar(); });
$('#o-voz').addEventListener('change', (e) => { Pr.ajustes().voz = e.target.checked; activarVoz(e.target.checked); Pr.guardar(); if (e.target.checked) decir('Hola. Así sonará la voz que explica.'); });
function textoVelocidad(v) {
  const n = v <= 0.75 ? 'Tranquila' : v < 0.95 ? 'Suave' : v <= 1.05 ? 'Normal' : v <= 1.3 ? 'Rápida' : 'Trepidante';
  $('#o-velocidad-txt').textContent = `${n} · x${Number(v).toFixed(1).replace('.', ',')} (Palabrones y tiempo de los jefes)`;
}
$('#o-velocidad').addEventListener('input', (e) => { Pr.ajustes().velocidad = +e.target.value; textoVelocidad(+e.target.value); Pr.guardar(); });
for (const b of $$('#o-calidad button')) b.addEventListener('click', () => {
  const v = b.dataset.v; if (Pr.ajustes().calidad === v) return;
  Pr.ajustes().calidad = v; Pr.guardar(); location.reload();
});
$('#b-borrar').addEventListener('click', () => {
  $('#conf-titulo').textContent = '¿Borrar a ' + perfil().nombre + '?';
  $('#conf-texto').textContent = 'Se perderán su progreso, estrellas, monedas y logros. No se puede deshacer.';
  abrir('m-confirmar');
});
$('#conf-no').addEventListener('click', () => { sfx.click(); cerrar('m-confirmar'); });
$('#conf-si').addEventListener('click', () => { sfx.click(); cerrar('m-confirmar'); Pr.borrarPerfil(perfil().id); pintarPerfiles(); mostrar('p-perfiles'); });

// ---------- teclado ----------
const TECLAS = { '1': 'S', '2': 'A', '3': 'V', s: 'S', a: 'A', v: 'V', ArrowLeft: 'S', ArrowDown: 'A', ArrowUp: 'A', ArrowRight: 'V' };
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (abierta('m-explica')) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cerrarExplicacion(); } return; }
  if (abierta('m-nivel')) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#nivel-vale').click(); } return; }
  if (abierta('m-pausa')) { if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { e.preventDefault(); $('#pausa-seguir').click(); } return; }
  if (abierta('m-intro')) { if (e.key === 'Enter') { e.preventDefault(); $('#intro-jugar').click(); } else if (e.key === 'Escape') $('#intro-volver').click(); return; }
  if (pantalla === 'p-titulo' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); $('#b-empezar').click(); return; }
  if (pantalla !== 'p-juego') return;
  if (e.repeat) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (TECLAS[k]) { e.preventDefault(); lanzarUI(TECLAS[k]); }
  else if (e.key === ' ') { e.preventDefault(); congelar(); }
  else if (e.key === 'Escape' || k === 'p') { e.preventDefault(); abrirPausa(); }
});

// Para las pruebas automáticas.
window.__palabrones = { J, Pr, E, mostrar, UI, jugar, introNivel, pintarMapa, irA };
