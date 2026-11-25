// ¡Palabrones! · Voz del navegador (Web Speech). Lee las explicaciones; baja la música mientras habla.
import { atenuar } from './audio.js?v=1.1.23';

const V = { activa: true, voz: null, desbloqueada: false, hablando: false };
const sintesis = window.speechSynthesis || null;

function elegirVoz() {
  if (!sintesis) return;
  const voces = sintesis.getVoices().filter((v) => /^es(-|_|$)/i.test(v.lang));
  if (!voces.length) return;
  const pref = [/es-ES/i, /Spain|España/i];
  const buenas = voces.filter((v) => /Natural|Online|Google|Mónica|Monica|Elvira|Helena|Lucía|Paulina/i.test(v.name));
  V.voz = buenas.find((v) => pref[0].test(v.lang)) || voces.find((v) => pref[0].test(v.lang)) || buenas[0] || voces[0];
}
if (sintesis) {
  elegirVoz();
  if ('onvoiceschanged' in sintesis) sintesis.onvoiceschanged = elegirVoz;
}

export function vozDisponible() { return !!sintesis; }
export function activarVoz(si) { V.activa = si; if (!si) callar(); }

// iOS solo deja hablar si la primera locución sale de un toque: se llama en el primer toque.
export function desbloquearVoz() {
  if (!sintesis || V.desbloqueada) return;
  V.desbloqueada = true;
  try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; sintesis.speak(u); } catch (e) { /* sin voz */ }
}

export function decir(texto) {
  if (!sintesis || !V.activa || !texto) return;
  try {
    sintesis.cancel();
    if (!V.voz) elegirVoz();
    const u = new SpeechSynthesisUtterance(texto.replace(/[«»]/g, ''));
    u.lang = (V.voz && V.voz.lang) || 'es-ES';
    if (V.voz) u.voice = V.voz;
    u.rate = 0.98; u.pitch = 1.05;
    u.onstart = () => { V.hablando = true; atenuar(true); };
    const fin = () => { V.hablando = false; atenuar(false); };
    u.onend = fin; u.onerror = fin;
    sintesis.speak(u);
  } catch (e) { atenuar(false); }
}

export function callar() {
  if (!sintesis) return;
  try { sintesis.cancel(); } catch (e) { /* nada */ }
  V.hablando = false; atenuar(false);
}
