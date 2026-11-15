/**
 * kits/nuke-count.js — Cinder Halo's counter rig and what goes in it.
 *
 *   ncount   a Sample slot, an optional shield slot, optional charged plates, optional temperature keys and a lead housing for the tube,
 *            and a window that draws the sample's atoms and every track of radiation leaving them: bent by the plates, stopped in the
 *            shield, each charged track leaving a trail of ions. "Count" counts one minute; the card keeps its count.
 *   nsrc     a sample card (an ore, a source, a drum); it shows its last count
 *   nshield  a shield card (paper, aluminium, lead)
 *   ndrum    two sealed drums on a cold deck, each with a thermometer and an oxygen gauge; a tap on a drum looks inside its wall
 *   ntissue  a strip of living cells with a source inside it; a key picks which radiation is shown, and its trail and the molecules it
 *            breaks are drawn
 *
 * Every count comes from `countsOf` in `nucdata.js`. The window is drawn from the same planner (`tracksOf`): a shield the planner lets a
 * radiation through is a shield its tracks cross. Temperature changes how fast the atoms are drawn moving and nothing else.
 */

import { countsOf, tracksOf, SOURCES, SHIELDS, scatter } from '../../engine/nucdata.js';
import { registerFixture, registerPiece } from './nuke-registry.js';
import { C, frameOf, say, title, foot, progress, clamp, lerp, box, key, keyRow, gammaWave, commas, signed } from './nuke-draw.js';

const seated = (state, slotId) => (slotId ? Object.values(state.pieces).find(p => p.zone === `slot:${slotId}`) || null : null);

/* ------------------------------------------------------------------ the rig */

/**
 * @param {object} o `plates` draws charged plates (no count is printed with them on: the tracks are the reading); `temps` a list of
 *   temperatures in °C for keys (the first that is 20 starts set); `housing` a "Lead Housing" key for the tube; `shields` a shield slot.
 */
export function ncountFixture(id, at, { w = 96, h = 46, title: ttl = 'Counter', plates = false, temps = null, housing = false, shields = false, runLabel = null } = {}) {
  const slot = { id: `${id}.sample`, label: 'Sample', at: { x: at.x - w / 2 - 11, y: at.y - (shields ? 9.5 : 0) }, size: { w: 19, h: 12 } };
  const shieldSlot = shields ? { id: `${id}.shield`, label: 'Shield', at: { x: at.x - w / 2 - 11, y: at.y + 9.5 }, size: { w: 19, h: 12 } } : null;
  const dials = {};
  const hidden = [];
  if (temps) { dials.temp = { min: 0, max: temps.length - 1, step: 1, value: Math.max(0, temps.indexOf(20)), label: 'Temperature' }; hidden.push('temp'); }
  if (housing) { dials.housed = { min: 0, max: 1, step: 1, value: 0, label: 'Lead housing' }; hidden.push('housed'); }
  return {
    fixture: {
      id, kind: 'ncount', label: ttl, at: { ...at }, size: { w, h }, dials, runLabel: runLabel || (plates ? 'Run' : 'Count'),
      props: { slot: slot.id, shieldSlot: shieldSlot?.id || null, plates, temps, housing, hidden, last: { n: 0, src: null, grams: 1, shield: 'open', temp: 20, housed: false, count: null } }
    },
    slot,
    shieldSlot
  };
}

/** The temperature the rig is set to (°C), whether the housing is closed. */
const tempOf = f => (f.props.temps ? f.props.temps[Math.round(f.dials.temp.value)] : 20);
const housedOf = f => Boolean(f.props.housing && Math.round(f.dials.housed.value));

/** What the rig holds and has counted. */
export function countRead(state, id) {
  const f = state.fixtures[id];
  const card = seated(state, f.props.slot);
  const shieldCard = seated(state, f.props.shieldSlot);
  return { card, shieldCard, shield: shieldCard ? shieldCard.props.shield : 'open', temp: tempOf(f), housed: housedOf(f), last: f.props.last };
}
/** The count a card kept for one setting (`shield`, `temp`, `housed`), or undefined. */
export const keptCount = (state, cardId, { shield = 'open', temp = 20, housed = false } = {}) => state.pieces[cardId]?.props?.counts?.[`${shield}|${temp}|${housed ? 1 : 0}`];
/** Every count a card kept: `[{ shield, temp, housed, count }]`. */
export function keptCounts(state, cardId) {
  const c = state.pieces[cardId]?.props?.counts || {};
  return Object.entries(c).map(([k, count]) => { const [shield, temp, housed] = k.split('|'); return { shield, temp: Number(temp), housed: housed === '1', count }; });
}

function runCount(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const r = countRead(state, fid);
  const src = r.card ? r.card.props.src : null;
  const grams = r.card ? r.card.props.grams || 1 : 1;
  const n = p.last.n + 1;
  if (p.plates) {
    if (!r.card) return { noop: 'There is no sample card in the Sample slot.' };
    p.last = { n, src, grams, shield: r.shield, temp: r.temp, housed: r.housed, count: null, plates: true, card: r.card.id };
    r.card.props.seen = true;
    return { stamp: {} };
  }
  const count = countsOf(src, { shield: r.shield, grams, housed: r.housed, run: n, temp: r.temp });
  p.last = { n, src, grams, shield: r.shield, temp: r.temp, housed: r.housed, count, card: r.card?.id || null };
  p.log = [...(p.log || []), { src, grams, shield: r.shield, temp: r.temp, housed: r.housed, count }].slice(-12);
  if (r.card) {
    const k = `${r.shield}|${r.temp}|${r.housed ? 1 : 0}`;
    r.card.props.counts = { ...(r.card.props.counts || {}), [k]: count };
    r.card.props.last = count;
  }
  return { stamp: {} };
}

/** The rig's keys, in fixture units. */
function rigKeys(f) {
  const out = [];
  const w = f.size.w;
  if (f.props.temps) {
    const labels = f.props.temps.map(t => `${signed(t)} °C`);
    const zs = keyRow(labels, 0, 1.0, { h: 4.6 });
    const width = zs[zs.length - 1].x1;
    zs.forEach((z, i) => out.push({ ...z, x0: z.x0 + w - width - 2, x1: z.x1 + w - width - 2, dial: 'temp', value: i, text: labels[i] }));
  }
  if (f.props.housing) {
    const zs = keyRow(['Lead Housing'], 0, 1.0, { h: 4.6 });
    const width = zs[0].x1;
    out.push({ ...zs[0], x0: w - width - 2, x1: w - 2, dial: 'housed', step: 1, wrap: true, text: 'Lead Housing' });
  }
  return out;
}

/** The window's geometry, in fixture units. */
function windowOf(f) {
  const wx = 2; const wy = 7.2; const ww = f.size.w - 4; const wh = f.size.h - 15.5;
  return { wx, wy, ww, wh, sx: wx + 3, sw: 13, tubeX: wx + ww - 13, tubeW: 10, shieldX: wx + ww * 0.52, cy: wy + wh / 2 };
}
const SHIELD_T = { open: 0, paper: 0.35, aluminium: 1.6, lead: 4.2 };

/** Atoms of the sample, drawn as a block of discs moving faster the hotter it is. */
function drawSample(ctx, F, W, src, grams, temp, clock) {
  const S = SOURCES[src];
  const cols = grams > 1 ? 4 : 3; const rows = 5;
  const amp = 0.18 * Math.sqrt((temp + 273) / 293);
  const gx = (W.sw - 2) / cols; const gy = (W.wh - 4) / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const k = i * rows + j;
    const x = W.sx + 1 + gx * (i + 0.5) + Math.sin(clock * 23 + k * 1.9) * amp * gx;
    const y = W.wy + 2 + gy * (j + 0.5) + Math.cos(clock * 19 + k * 2.7) * amp * gy;
    ctx.fillStyle = S && Object.keys(S.lines).length ? '#7b6a52' : '#5f5a52';
    ctx.beginPath(); ctx.arc(F.x(x), F.y(y), Math.max(1.5, F.len(Math.min(gx, gy) * 0.3)), 0, Math.PI * 2); ctx.fill();
  }
}

/**
 * The tracks in the window: a steady stream from the sample's atoms (as many each second as the sample's rate, scaled for the eye), each
 * running right, bent by the plates, stopped by the shield when the planner says so, with a trail of ions.
 */
function drawTracks(ctx, F, W, f, src, shield, clock, k) {
  const lines = tracksOf(src, shield);
  const total = lines.reduce((s, l) => s + l.rate, 0);
  if (!total) return;
  const perSec = clamp(total / 220, 1.5, 12) * (k < 1 ? 0.4 + 0.6 * k : 1);
  const life = 0.9;
  const i1 = Math.floor(clock * perSec); const i0 = Math.max(0, i1 - Math.ceil(life * perSec) - 1);
  const sh = SHIELD_T[shield] || 0;
  for (let i = i0; i <= i1; i++) {
    const born = i / perSec + (scatter(`${f.id}:b:${i}`) * 0.5 + 0.5) / perSec;
    const age = clock - born;
    if (age < 0 || age > life) continue;
    // Which radiation this track is, in proportion to the sample's lines.
    let pick = (scatter(`${f.id}:k:${i}`) * 0.5 + 0.5) * total; let L = lines[0];
    for (const l of lines) { if (pick < l.rate) { L = l; break; } pick -= l.rate; }
    const passes = (scatter(`${f.id}:p:${i}`) * 0.5 + 0.5) < L.pass;
    const y0 = W.cy + scatter(`${f.id}:y:${i}`) * (W.wh * 0.28);
    const slope = scatter(`${f.id}:s:${i}`) * 0.05;
    const bend = f.props.plates ? (L.kind === 'alpha' ? 0.0035 : L.kind === 'beta' ? -0.03 : 0) : 0;
    const x0 = W.sx + W.sw;
    const stopX = shield !== 'open' && !passes ? W.shieldX + (L.kind === 'alpha' ? 0 : sh * (0.3 + 0.5 * (scatter(`${f.id}:d:${i}`) * 0.5 + 0.5))) : W.tubeX + 1;
    const len = stopX - x0;
    const reach = Math.min(len, (age / life) * len * 1.25);
    const at = s => ({ x: x0 + s, y: y0 + slope * s + bend * s * s });
    const fade = clamp(1.4 - age / life, 0, 1);
    ctx.globalAlpha = fade;
    if (L.kind === 'gamma') {
      gammaWave(ctx, F, x0, y0, Math.atan(slope), reach, i);
      if (scatter(`${f.id}:g:${i}`) > 0.6) { const q = at(reach * 0.6); ctx.fillStyle = C.ion; ctx.fillRect(F.x(q.x) - 1, F.y(q.y) - 1, 2.4, 2.4); }
    } else {
      ctx.strokeStyle = L.kind === 'alpha' ? C.alpha : C.beta; ctx.lineWidth = L.kind === 'alpha' ? 2 : 1.2;
      ctx.beginPath();
      for (let s = 0; s <= reach; s += 0.8) {
        const q = at(s);
        if (q.y < W.wy + 0.5 || q.y > W.wy + W.wh - 0.5) break;
        if (s === 0) ctx.moveTo(F.x(q.x), F.y(q.y)); else ctx.lineTo(F.x(q.x), F.y(q.y));
      }
      ctx.stroke(); ctx.lineWidth = 1;
      // The trail of ions: dense behind an alpha particle, sparse behind a beta particle.
      const every = L.kind === 'alpha' ? 0.9 : 4.5;
      ctx.fillStyle = C.ion;
      for (let s = every * (0.5 + 0.5 * scatter(`${f.id}:o:${i}`)); s <= reach; s += every) {
        const q = at(s);
        if (q.y < W.wy + 0.5 || q.y > W.wy + W.wh - 0.5) break;
        const off = scatter(`${f.id}:i:${i}:${Math.round(s * 10)}`) * 0.7;
        ctx.fillRect(F.x(q.x) - 1, F.y(q.y + off) - 1, 2, 2);
      }
    }
    ctx.globalAlpha = 1;
  }
}

/** A few background tracks from outside: from above and below the window, toward the tube; most stop at a closed housing. */
function drawBackground(ctx, F, W, f, housed, clock) {
  const perSec = 0.9; const life = 0.8;
  const i1 = Math.floor(clock * perSec);
  for (let i = Math.max(0, i1 - 2); i <= i1; i++) {
    const born = i / perSec; const age = clock - born;
    if (age < 0 || age > life) continue;
    const fromTop = scatter(`${f.id}:bt:${i}`) > 0;
    const tx = W.tubeX + W.tubeW / 2 + scatter(`${f.id}:bx:${i}`) * 6;
    const y0 = fromTop ? W.wy : W.wy + W.wh; const y1 = W.cy;
    const stop = housed && scatter(`${f.id}:bh:${i}`) > -0.7 ? (fromTop ? W.cy - 6 : W.cy + 6) : y1;
    const k = clamp(age / life * 1.3, 0, 1);
    ctx.globalAlpha = clamp(1.4 - age / life, 0, 1);
    gammaWave(ctx, F, tx, y0, fromTop ? Math.PI / 2 : -Math.PI / 2, Math.abs(lerp(y0, stop, k) - y0), i, '#8f8a74');
    ctx.globalAlpha = 1;
  }
}

function paintRig(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = countRead(state, f.id);
  title(ctx, f, F, b);
  const keys = rigKeys(f);
  for (const z of keys) key(ctx, F, z, z.text, z.dial === 'temp' ? Math.round(f.dials.temp.value) === z.value : housedOf(f));
  const W = windowOf(f);
  box(ctx, F, W.wx, W.wy, W.ww, W.wh, C.win, C.steel);
  // The plates, when the rig has them: positive above, negative below.
  if (p.plates) {
    box(ctx, F, W.sx + W.sw + 4, W.wy + 0.6, W.tubeX - W.sx - W.sw - 8, 1.6, '#7a4a32');
    box(ctx, F, W.sx + W.sw + 4, W.wy + W.wh - 2.2, W.tubeX - W.sx - W.sw - 8, 1.6, '#3e5470');
    say(ctx, '+', F.x(W.tubeX - 3), F.y(W.wy + 3.6), F.size(2.4, 8), { align: 'center', color: C.plus, weight: 700, sans: true });
    say(ctx, '−', F.x(W.tubeX - 3), F.y(W.wy + W.wh - 3.6), F.size(2.4, 8), { align: 'center', color: C.minus, weight: 700, sans: true });
  }
  // The shield, drawn as a sheet as thick as it is.
  if (r.shield !== 'open') {
    const t = SHIELD_T[r.shield];
    box(ctx, F, W.shieldX, W.wy + 1, t, W.wh - 2, C.shield[r.shield], null);
    say(ctx, SHIELDS[r.shield].name, F.x(W.shieldX + t / 2), F.y(W.wy + W.wh + 1.8), F.size(1.6, 6), { align: 'center', color: C.dust });
  }
  // The tube, in its lead housing when it is closed.
  if (housedOf(f)) box(ctx, F, W.tubeX - 2.2, W.wy + 2.4, W.tubeW + 3.4, W.wh - 4.8, '#3f434a', null);
  box(ctx, F, W.tubeX, W.cy - 4.5, W.tubeW, 9, '#2b2925', C.dust);
  box(ctx, F, W.tubeX - 0.6, W.cy - 3.2, 0.6, 6.4, '#5c5446', null);
  say(ctx, 'Tube', F.x(W.tubeX + W.tubeW / 2), F.y(W.cy), F.size(1.6, 6), { align: 'center', color: C.dust });
  // The sample and its tracks, once it has been run.
  const temp = r.temp;
  if (r.card) {
    drawSample(ctx, F, W, r.card.props.src, r.card.props.grams || 1, temp, b.clock || 0);
    if (p.temps) say(ctx, `${signed(temp)} °C`, F.x(W.sx + W.sw / 2), F.y(W.wy + W.wh + 1.8), F.size(1.6, 6), { align: 'center', color: C.dust });
  } else {
    say(ctx, 'No sample', F.x(W.sx + W.sw / 2), F.y(W.cy), F.size(1.6, 6), { align: 'center', color: C.dim });
  }
  const showing = r.card && p.last.n && p.last.src === r.card.props.src && (p.last.grams || 1) === (r.card.props.grams || 1);
  const k = p.last.n ? progress(`${f.id}:count`, b, p.last.n, 3) : 0;
  if (showing && p.last.shield === r.shield) drawTracks(ctx, F, W, f, r.card.props.src, r.shield, b.clock || 0, k);
  drawBackground(ctx, F, W, f, housedOf(f), b.clock || 0);
  // The foot line: what the last count read.
  const right = Math.max(9, f.runLabel.length * 1.9 + 3) + 3;
  const sameSetting = p.last.n && p.last.shield === r.shield && p.last.temp === temp && p.last.housed === housedOf(f) && (p.last.card || null) === (r.card?.id || null);
  if (p.plates) {
    if (!r.card) foot(ctx, f, F, 'Lay a sample card in the Sample slot', C.dust, right);
    else if (!showing) foot(ctx, f, F, `Press "${f.runLabel}"`, C.dust, right);
    else foot(ctx, f, F, 'Watch where the tracks go between the plates', C.text, right);
  } else if (sameSetting) {
    foot(ctx, f, F, k < 1 ? `Counting: ${commas(p.last.count * k)}` : `${commas(p.last.count)} counts in one minute`, k < 1 ? C.dust : C.text, right);
  } else foot(ctx, f, F, `Press "${f.runLabel}" to count for one minute`, C.dust, right);
}

registerFixture('ncount', {
  paint: paintRig,
  run: runCount,
  live: () => true,
  tapZones: f => rigKeys(f).map(z => ({ x0: z.x0, x1: z.x1, y0: z.y0, y1: z.y1, dial: z.dial, ...(z.value != null ? { value: z.value } : { step: z.step, wrap: z.wrap }) }))
});

/* ------------------------------------------------------------------ cards */

export const NCARD_RECT = Object.freeze({ hw: 10, hh: 5.2 });

/** A sample card: `src` a SOURCES key; `text` what the card says (a letter, a name); `grams` for ores; `temp` a printed temperature. */
export const nsrc = (id, src, at, { text = null, grams = null, temp = null } = {}) => ({
  id, kind: 'nsrc', label: text || SOURCES[src]?.name || src, at: { ...at }, props: { src, ...(grams ? { grams } : {}), ...(temp != null ? { temp } : {}), text }
});
/** A shield card. */
export const nshield = (id, shield, at) => ({ id, kind: 'nshield', label: `${SHIELDS[shield].name}, ${SHIELDS[shield].thick}`, at: { ...at }, props: { shield } });

function paintCard(ctx, p, o, top, sub, subColor) {
  const { x, y, sc, lit } = o;
  const w = NCARD_RECT.hw * 2 * sc; const h = NCARD_RECT.hh * 2 * sc;
  ctx.fillStyle = '#2a2620'; ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeStyle = lit ? C.amber : C.dust; ctx.lineWidth = lit ? 2 : 1; ctx.strokeRect(x - w / 2 + 0.5, y - h / 2 + 0.5, w - 1, h - 1); ctx.lineWidth = 1;
  say(ctx, top, x, y - (sub ? h * 0.17 : 0), Math.max(7, 2.2 * sc), { align: 'center', weight: 700, sans: true, maxW: w - 4 });
  if (sub) say(ctx, sub, x, y + h * 0.26, Math.max(6, 1.7 * sc), { align: 'center', color: subColor, maxW: w - 4 });
}
const cardSub = p => {
  const parts = [];
  if (p.props.temp != null) parts.push(`${signed(p.props.temp)} °C`);
  if (p.props.last != null) parts.push(`${commas(p.props.last)}/min`);
  return parts.join(' · ');
};
registerPiece('nsrc', {
  kind: { r: 7.2, rect: NCARD_RECT, nojoin: true },
  paint(ctx, p, state, o) { paintCard(ctx, p, o, p.label, cardSub(p), p.props.last != null ? C.amber : C.dust); },
  faceKey: p => `nsrc:${p.label}:${p.props.temp ?? ''}:${p.props.last ?? ''}`,
  printed: p => p.label
});
registerPiece('nshield', {
  kind: { r: 7.2, rect: NCARD_RECT, nojoin: true },
  paint(ctx, p, state, o) {
    paintCard(ctx, p, o, SHIELDS[p.props.shield].name, SHIELDS[p.props.shield].thick, C.dust);
    const { x, y, sc } = o; const w = NCARD_RECT.hw * 2 * sc; const h = NCARD_RECT.hh * 2 * sc;
    ctx.fillStyle = C.shield[p.props.shield]; ctx.fillRect(x - w / 2 + 2, y - h / 2 + 2, Math.max(2, sc * 0.9), h - 4);
  },
  faceKey: p => `nshield:${p.props.shield}`,
  printed: p => SHIELDS[p.props.shield].name
});

/* ------------------------------------------------------------------ the drums */

/**
 * Two sealed drums on a deck. `drums`: `[{ name, temp, o2, hot }]`, `hot` drums hold decaying ore. A tap on a drum looks inside its wall.
 */
export function ndrumFixture(id, at, { drums, deck = 9, w = 96, h = 46, title: ttl = 'Sealed drums' } = {}) {
  return {
    id, kind: 'ndrum', label: ttl, at: { ...at }, size: { w, h }, noRun: true,
    dials: { look: { min: 0, max: drums.length, step: 1, value: 0, label: 'Look inside' } },
    props: { drums, deck, hidden: ['look'] }
  };
}
const drumZone = (f, i) => ({ x0: 3 + i * 21, x1: 3 + i * 21 + 18, y0: 9, y1: f.size.h - 9 });
function paintDrums(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  title(ctx, f, F, b);
  say(ctx, `Deck ${p.deck} °C`, F.x(f.size.w - 2.2), F.y(3.2), F.size(1.9, 6.4), { align: 'right', color: C.dust });
  const look = Math.round(f.dials.look.value);
  p.drums.forEach((d, i) => {
    const z = drumZone(f, i);
    const on = look === i + 1;
    box(ctx, F, z.x0 + 2, z.y0 + 3, z.x1 - z.x0 - 4, z.y1 - z.y0 - 9, '#3a3a36', on ? C.amber : C.steel);
    for (let r = 1; r < 3; r++) box(ctx, F, z.x0 + 2, z.y0 + 3 + r * (z.y1 - z.y0 - 9) / 3, z.x1 - z.x0 - 4, 0.5, '#55534c');
    say(ctx, d.name, F.x((z.x0 + z.x1) / 2), F.y(z.y0 + 1), F.size(1.8, 6.2), { align: 'center', color: on ? C.amber : C.text, weight: 600, maxW: F.len(z.x1 - z.x0) });
    say(ctx, `${d.temp} °C`, F.x((z.x0 + z.x1) / 2), F.y(z.y1 - 3.8), F.size(1.9, 6.4), { align: 'center', color: C.text });
    say(ctx, `Oxygen ${d.o2}`, F.x((z.x0 + z.x1) / 2), F.y(z.y1 - 0.8), F.size(1.6, 6), { align: 'center', color: C.dust });
  });
  // The window: the inside of the wall of the drum tapped, enlarged.
  const wx = 3 + p.drums.length * 21 + 2; const wy = 7.5; const ww = f.size.w - wx - 2.5; const wh = f.size.h - 11;
  box(ctx, F, wx, wy, ww, wh, C.win, C.steel);
  if (!look) { say(ctx, 'Tap a drum to look inside its wall', F.x(wx + ww / 2), F.y(wy + wh / 2), F.size(1.7, 6), { align: 'center', color: C.dim, maxW: F.len(ww - 2) }); return; }
  const d = p.drums[look - 1];
  const clock = b.clock || 0;
  // Ore on the left, steel wall on the right; atoms of the steel drawn as a grid.
  const ore = wx + ww * 0.36;
  box(ctx, F, wx + 0.5, wy + 0.5, ore - wx - 0.5, wh - 1, '#2b261f');
  box(ctx, F, ore, wy + 0.5, wx + ww - ore - 0.5, wh - 1, '#24272b');
  say(ctx, 'Ore', F.x(wx + 2), F.y(wy + 2.4), F.size(1.5, 5.6), { color: C.dust });
  say(ctx, 'Steel wall', F.x(ore + 1.5), F.y(wy + 2.4), F.size(1.5, 5.6), { color: C.dust });
  const cols = 7; const rows = 6;
  const gx = (wx + ww - ore - 3) / cols; const gy = (wh - 6) / rows;
  // Where tracks stop, the atoms nearby are shaken harder.
  const stops = [];
  if (d.hot) for (let i = 0; i < 4; i++) {
    const t = (clock * 1.3 + i * 0.37) % 1.6;
    stops.push({ x: ore + 2 + (scatter(`${f.id}:sx:${i}:${Math.floor(clock * 1.3 / 1.6 + i * 0.23)}`) * 0.5 + 0.5) * (wx + ww - ore - 6), y: wy + 4 + (i + 0.5) * (wh - 6) / 4, t });
  }
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x0 = ore + 1.5 + gx * (i + 0.5); const y0 = wy + 4 + gy * (j + 0.5);
    let amp = 0.08;
    for (const s of stops) { const dd = Math.hypot(x0 - s.x, y0 - s.y); if (s.t > 0.6) amp += 0.32 * Math.exp(-dd / 3) * clamp(1.6 - s.t, 0, 1); }
    const x = x0 + Math.sin(clock * 29 + i * 3.1 + j) * amp * gx; const y = y0 + Math.cos(clock * 23 + j * 2.3 + i) * amp * gy;
    ctx.fillStyle = '#7d858d'; ctx.beginPath(); ctx.arc(F.x(x), F.y(y), Math.max(1.4, F.len(Math.min(gx, gy) * 0.28)), 0, Math.PI * 2); ctx.fill();
  }
  for (const s of stops) {
    if (s.t > 0.6) continue;
    const k = s.t / 0.6;
    ctx.strokeStyle = C.alpha; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(F.x(wx + 3), F.y(s.y)); ctx.lineTo(F.x(lerp(wx + 3, s.x, k)), F.y(s.y)); ctx.stroke(); ctx.lineWidth = 1;
  }
  if (!d.hot) say(ctx, 'No tracks', F.x(wx + ww / 2), F.y(wy + wh - 2.4), F.size(1.5, 5.6), { align: 'center', color: C.dim });
}
registerFixture('ndrum', {
  paint: paintDrums,
  live: () => true,
  tapZones: f => f.props.drums.map((_, i) => ({ ...drumZone(f, i), dial: 'look', value: i + 1 }))
});

/* ------------------------------------------------------------------ the tissue strip */

const TISSUE = ['alpha', 'beta', 'gamma'];
/** A strip of cells with a source at its left end; keys pick which radiation is shown. */
export function ntissueFixture(id, at, { w = 100, h = 40, title: ttl = 'Cells beside a swallowed source' } = {}) {
  return {
    id, kind: 'ntissue', label: ttl, at: { ...at }, size: { w, h }, noRun: true,
    dials: { kind: { min: 0, max: 3, step: 1, value: 0, label: 'Radiation shown' } },
    props: { hidden: ['kind'] }
  };
}
const tissueKeys = f => {
  const zs = keyRow(['Alpha', 'Beta', 'Gamma'], 0, 1.0, { h: 4.6 });
  const width = zs[zs.length - 1].x1;
  return zs.map((z, i) => ({ ...z, x0: z.x0 + f.size.w - width - 2, x1: z.x1 + f.size.w - width - 2, value: i + 1, text: ['Alpha', 'Beta', 'Gamma'][i] }));
};
/** Where the trail of each radiation breaks molecules, in cells along the strip (column, row): drawn, not printed. */
export function breaksOf(kind, cols = 14) {
  const out = [];
  if (kind === 'alpha') { for (let i = 0; i < 26; i++) out.push([Math.floor(i / 13), (i * 7) % 3]); }
  else if (kind === 'beta') { for (let c = 1; c < cols; c += 3) out.push([c, c % 3]); }
  else if (kind === 'gamma') out.push([9, 1]);
  return out;
}
function paintTissue(ctx, f, state, b) {
  const F = frameOf(b);
  title(ctx, f, F, b);
  const pick = Math.round(f.dials.kind.value);
  for (const z of tissueKeys(f)) key(ctx, F, z, z.text, pick === z.value);
  const cols = 14; const rows = 3;
  const x0 = 8; const y0 = 8.5; const cw = (f.size.w - x0 - 3) / cols; const ch = (f.size.h - y0 - 7) / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    box(ctx, F, x0 + i * cw + 0.3, y0 + j * ch + 0.3, cw - 0.6, ch - 0.6, '#3a2a26', '#5a4038');
    ctx.fillStyle = '#6e4a3e'; ctx.beginPath(); ctx.arc(F.x(x0 + (i + 0.5) * cw), F.y(y0 + (j + 0.5) * ch), Math.max(1.5, F.len(ch * 0.14)), 0, Math.PI * 2); ctx.fill();
  }
  // The source, at the strip's left end.
  ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(F.x(4.5), F.y(y0 + rows * ch / 2), Math.max(2.5, F.len(1.4)), 0, Math.PI * 2); ctx.fill();
  say(ctx, 'Source', F.x(4.5), F.y(y0 + rows * ch + 2), F.size(1.5, 5.6), { align: 'center', color: C.dust });
  if (!pick) { foot(ctx, f, F, 'Pick a radiation to see its trail', C.dust); return; }
  const kind = TISSUE[pick - 1];
  const k = progress(`${f.id}:kind`, b, pick, 2.2);
  const cy = y0 + rows * ch / 2;
  const reach = kind === 'alpha' ? 2 * cw : (cols) * cw;
  const end = x0 + reach * k;
  if (kind === 'gamma') gammaWave(ctx, F, 6, cy, 0, end - 6, 0);
  else { ctx.strokeStyle = kind === 'alpha' ? C.alpha : C.beta; ctx.lineWidth = kind === 'alpha' ? 2.2 : 1.2; ctx.beginPath(); ctx.moveTo(F.x(6), F.y(cy)); ctx.lineTo(F.x(end), F.y(cy + (kind === 'beta' ? Math.sin(end) * 0.6 : 0))); ctx.stroke(); ctx.lineWidth = 1; }
  // Broken molecules: a mark in the cell where each happened, once the trail has passed it.
  ctx.fillStyle = C.ion;
  breaksOf(kind, cols).forEach(([c, r], n) => {
    const x = x0 + (c + 0.2 + ((n * 37) % 60) / 100) * cw; const y = y0 + (r + 0.25 + ((n * 53) % 50) / 100) * ch;
    if (x > end) return;
    ctx.fillRect(F.x(x) - 1.5, F.y(y) - 1.5, 3, 3);
  });
  if (k >= 1) foot(ctx, f, F, 'Each amber mark is a broken molecule', C.text);
}
registerFixture('ntissue', {
  paint: paintTissue,
  live: () => true,
  tapZones: f => tissueKeys(f).map(z => ({ x0: z.x0, x1: z.x1, y0: z.y0, y1: z.y1, dial: 'kind', value: z.value }))
});
