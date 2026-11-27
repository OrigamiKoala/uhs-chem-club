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
  const cols = grams >= 3 ? 5 : grams > 1 ? 4 : 3;
  const rows = grams >= 3 ? 6 : grams > 1 ? 5 : 4;
  // Clear visual contrast between -40 °C (slow), 20 °C (steady), and 300 °C (vigorous).
  const tNorm = clamp((temp + 60) / 360, 0.05, 1);
  const amp = 0.05 + tNorm * 0.34;
  const freq = 6 + tNorm * 36;
  const gx = (W.sw - 2) / cols; const gy = (W.wh - 5) / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const k = i * rows + j;
    const x = W.sx + 1 + gx * (i + 0.5) + Math.sin(clock * freq + k * 1.9) * amp * gx;
    const y = W.wy + 3.2 + gy * (j + 0.5) + Math.cos(clock * (freq * 0.85) + k * 2.7) * amp * gy;
    ctx.fillStyle = S && Object.keys(S.lines).length ? '#9a8260' : '#736d64';
    ctx.beginPath(); ctx.arc(F.x(x), F.y(y), Math.max(1.6, F.len(Math.min(gx, gy) * 0.3)), 0, Math.PI * 2); ctx.fill();
  }
  say(ctx, 'Atoms', F.x(W.sx + W.sw / 2), F.y(W.wy + 1.8), F.size(1.5, 6), { align: 'center', color: C.dust });
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
  const perSec = f.props.housing ? 2.2 : 1.0; const life = 0.9;
  const i1 = Math.floor(clock * perSec);
  for (let i = Math.max(0, i1 - 4); i <= i1; i++) {
    const born = i / perSec; const age = clock - born;
    if (age < 0 || age > life) continue;
    const fromTop = scatter(`${f.id}:bt:${i}`) > 0;
    const tx = W.tubeX + W.tubeW / 2 + scatter(`${f.id}:bx:${i}`) * 5;
    const y0 = fromTop ? W.wy : W.wy + W.wh; const y1 = W.cy;
    const blocked = housed && scatter(`${f.id}:bh:${i}`) > -0.62;
    const stop = blocked ? (fromTop ? W.wy + 3.2 : W.wy + W.wh - 3.2) : y1;
    const k = clamp(age / life * 1.35, 0, 1);
    ctx.globalAlpha = clamp(1.4 - age / life, 0, 1);
    gammaWave(ctx, F, tx, y0, fromTop ? Math.PI / 2 : -Math.PI / 2, Math.abs(lerp(y0, stop, k) - y0), i, '#c2ba96');
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
    box(ctx, F, W.sx + W.sw + 4, W.wy + 0.6, W.tubeX - W.sx - W.sw - 8, 2.0, '#9a5832');
    box(ctx, F, W.sx + W.sw + 4, W.wy + W.wh - 2.6, W.tubeX - W.sx - W.sw - 8, 2.0, '#44658c');
    say(ctx, '+', F.x(W.tubeX - 4.5), F.y(W.wy + 4.4), F.size(3.4, 12), { align: 'center', color: C.plus, weight: 700, sans: true });
    say(ctx, '−', F.x(W.tubeX - 4.5), F.y(W.wy + W.wh - 4.4), F.size(3.4, 12), { align: 'center', color: C.minus, weight: 700, sans: true });
  }
  // The shield, drawn as a sheet as thick as it is.
  if (r.shield !== 'open') {
    const t = SHIELD_T[r.shield];
    box(ctx, F, W.shieldX, W.wy + 1, t, W.wh - 2, C.shield[r.shield], null);
    say(ctx, `${SHIELDS[r.shield].name} (${SHIELDS[r.shield].thick})`, F.x(W.shieldX + t / 2), F.y(W.wy + W.wh + 1.8), F.size(1.8, 7), { align: 'center', color: C.text });
  }
  // The tube, wrapped in thick lead walls on top, bottom, and right when Lead Housing is closed.
  if (housedOf(f)) {
    box(ctx, F, W.tubeX - 3.0, W.wy + 1.8, W.tubeW + 4.6, W.wh - 3.6, '#52565e', '#8c929c');
    box(ctx, F, W.tubeX - 0.8, W.cy - 5.4, W.tubeW + 1.2, 10.8, C.win, null);
    say(ctx, 'Lead', F.x(W.tubeX + W.tubeW / 2), F.y(W.wy + 3.6), F.size(1.6, 6.5), { align: 'center', color: C.text, weight: 700 });
  }
  box(ctx, F, W.tubeX, W.cy - 4.5, W.tubeW, 9, '#2b2925', C.dust);
  box(ctx, F, W.tubeX - 0.6, W.cy - 3.2, 0.6, 6.4, '#5c5446', null);
  say(ctx, 'Tube', F.x(W.tubeX + W.tubeW / 2), F.y(W.cy), F.size(1.7, 6.5), { align: 'center', color: C.dust });
  // The sample and its tracks, once it has been run.
  const temp = r.temp;
  if (r.card) {
    drawSample(ctx, F, W, r.card.props.src, r.card.props.grams || 1, temp, b.clock || 0);
    if (p.temps) say(ctx, `${signed(temp)} °C`, F.x(W.sx + W.sw / 2), F.y(W.wy + W.wh + 1.8), F.size(1.8, 7), { align: 'center', color: C.amber, weight: 700 });
  } else {
    say(ctx, 'No sample', F.x(W.sx + W.sw / 2), F.y(W.cy), F.size(1.7, 6.5), { align: 'center', color: C.dim });
  }
  const showing = r.card && p.last.n && p.last.src === r.card.props.src && (p.last.grams || 1) === (r.card.props.grams || 1);
  const k = p.last.n ? progress(`${f.id}:count`, b, p.last.n, 3) : 0;
  if (showing && p.last.shield === r.shield) drawTracks(ctx, F, W, f, r.card.props.src, r.shield, b.clock || 0, k);
  drawBackground(ctx, F, W, f, housedOf(f), b.clock || 0);
  // Active counting pulse on the tube when a count is running.
  if (p.last.n && k < 1) {
    ctx.fillStyle = C.amber;
    ctx.beginPath(); ctx.arc(F.x(W.tubeX + W.tubeW - 1.8), F.y(W.cy - 2.8), Math.max(2, F.len(0.8)), 0, Math.PI * 2); ctx.fill();
  }
  // The foot line: what the last count read.
  const right = Math.max(10, f.runLabel.length * 2.0 + 4) + 3;
  const sameSetting = p.last.n && p.last.shield === r.shield && p.last.temp === temp && p.last.housed === housedOf(f) && (p.last.card || null) === (r.card?.id || null);
  if (p.plates) {
    if (!r.card) foot(ctx, f, F, 'Lay a sample card in the Sample slot', C.dust, right);
    else if (!showing) foot(ctx, f, F, `Press "${f.runLabel}"`, C.dust, right);
    else foot(ctx, f, F, 'Watch where the tracks go between the plates', C.text, right);
  } else if (sameSetting) {
    const emptyTag = !r.card && !p.housing ? 'No sample in slot (background): ' : '';
    const col = !r.card && !p.housing ? C.amber : (k < 1 ? C.dust : C.text);
    foot(ctx, f, F, k < 1 ? `${emptyTag}Counting: ${commas(p.last.count * k)}` : `${emptyTag}${commas(p.last.count)} counts in one minute`, col, right);
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
export const nsrc = (id, src, at, { text = null, grams = null, temp = null, hideLast = false, sub = null } = {}) => ({
  id, kind: 'nsrc', label: text || SOURCES[src]?.name || src, at: { ...at }, props: { src, ...(grams ? { grams } : {}), ...(temp != null ? { temp } : {}), ...(hideLast ? { hideLast: true } : {}), ...(sub ? { sub } : {}), text }
});
/** A shield card. */
export const nshield = (id, shield, at) => ({ id, kind: 'nshield', label: `${SHIELDS[shield].name}, ${SHIELDS[shield].thick}`, at: { ...at }, props: { shield } });

function paintCard(ctx, p, o, top, sub, subColor) {
  const { x, y, sc, lit } = o;
  const w = NCARD_RECT.hw * 2 * sc; const h = NCARD_RECT.hh * 2 * sc;
  ctx.fillStyle = '#2a2620'; ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeStyle = lit ? C.amber : C.dust; ctx.lineWidth = lit ? 2 : 1; ctx.strokeRect(x - w / 2 + 0.5, y - h / 2 + 0.5, w - 1, h - 1); ctx.lineWidth = 1;
  say(ctx, top, x, y - (sub ? h * 0.19 : 0), Math.max(9, 2.7 * sc), { align: 'center', weight: 700, sans: true, maxW: w - 4 });
  if (sub) say(ctx, sub, x, y + h * 0.25, Math.max(8, 2.2 * sc), { align: 'center', color: subColor, weight: 600, maxW: w - 4 });
}
const cardSub = (p, state) => {
  const parts = [];
  if (p.props.sub) parts.push(p.props.sub);
  if (p.props.temp != null) parts.push(`${signed(p.props.temp)} °C`);
  else if (state && p.zone?.startsWith('slot:')) {
    const rig = Object.values(state.fixtures || {}).find(f => f.kind === 'ncount' && f.props?.temps && `slot:${f.props.slot}` === p.zone);
    if (rig) parts.push(`${signed(tempOf(rig))} °C`);
  }
  if (p.props.last != null && !p.props.hideLast) parts.push(`${commas(p.props.last)}/min`);
  return parts.join(' · ');
};
registerPiece('nsrc', {
  kind: { r: 7.2, rect: NCARD_RECT, nojoin: true },
  paint(ctx, p, state, o) {
    const sub = cardSub(p, state);
    paintCard(ctx, p, o, p.label, sub, (p.props.last != null && !p.props.hideLast) || p.props.temp != null ? C.amber : C.dust);
  },
  faceKey: (p, state) => {
    const rig = state && p.zone?.startsWith('slot:') ? Object.values(state.fixtures || {}).find(f => f.kind === 'ncount' && f.props?.temps && `slot:${f.props.slot}` === p.zone) : null;
    return `nsrc:${p.label}:${p.props.sub ?? ''}:${p.props.temp ?? (rig ? tempOf(rig) : '')}:${p.props.hideLast ? '' : (p.props.last ?? '')}`;
  },
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
    const dx = z.x0 + 2; const dy = z.y0 + 3; const dw = z.x1 - z.x0 - 4; const dh = z.y1 - z.y0 - 9.5;
    // Cylindrical steel drum silhouette with top/bottom rims and rolling ribs.
    box(ctx, F, dx, dy, dw, dh, d.hot ? '#4a3d33' : '#3a3c3e', on ? C.amber : C.steel);
    box(ctx, F, dx - 0.6, dy, dw + 1.2, 1.3, '#636058', on ? C.amber : C.steel);
    box(ctx, F, dx - 0.6, dy + dh - 1.3, dw + 1.2, 1.3, '#57544d', on ? C.amber : C.steel);
    for (let r = 1; r < 3; r++) box(ctx, F, dx - 0.3, dy + r * dh / 3, dw + 0.6, 0.9, '#6c685f');
    say(ctx, d.name, F.x(dx + dw / 2), F.y(dy + dh * 0.5), F.size(1.7, 6.5), { align: 'center', color: on ? C.amber : C.text, weight: 700, maxW: F.len(dw - 1) });
    say(ctx, `${d.temp} °C`, F.x((z.x0 + z.x1) / 2), F.y(z.y1 - 4.2), F.size(2.1, 7.5), { align: 'center', color: d.hot ? C.amber : C.text, weight: 700 });
    say(ctx, `O₂ ${d.o2}`, F.x((z.x0 + z.x1) / 2), F.y(z.y1 - 1.0), F.size(1.8, 6.5), { align: 'center', color: C.dust });
  });
  // The window: the inside of the wall of the drum tapped, enlarged.
  const wx = 3 + p.drums.length * 21 + 2; const wy = 7.5; const ww = f.size.w - wx - 2.5; const wh = f.size.h - 11;
  box(ctx, F, wx, wy, ww, wh, C.win, C.steel);
  if (!look) { say(ctx, 'Tap a drum to look inside its wall', F.x(wx + ww / 2), F.y(wy + wh / 2), F.size(1.8, 6.5), { align: 'center', color: C.dim, maxW: F.len(ww - 2) }); return; }
  const d = p.drums[look - 1];
  const clock = b.clock || 0;
  // Ore on the left, steel wall on the right; atoms of the steel drawn as a grid.
  const ore = wx + ww * 0.34;
  box(ctx, F, wx + 0.5, wy + 0.5, ore - wx - 0.5, wh - 1, '#2b261f');
  box(ctx, F, ore, wy + 0.5, wx + ww - ore - 0.5, wh - 1, '#24272b');
  say(ctx, 'Ore', F.x(wx + 2), F.y(wy + 2.4), F.size(1.7, 6.2), { color: C.dust, weight: 600 });
  say(ctx, 'Steel wall', F.x(ore + 1.5), F.y(wy + 2.4), F.size(1.7, 6.2), { color: C.dust, weight: 600 });
  const cols = 6; const rows = 5;
  const gx = (wx + ww - ore - 3) / cols; const gy = (wh - 7) / rows;
  // Where tracks stop inside the steel, the atoms nearby are shaken noticeably harder.
  const stops = [];
  if (d.hot) for (let i = 0; i < 4; i++) {
    const t = (clock * 1.1 + i * 0.4) % 1.6;
    stops.push({ x: ore + 2.5 + (scatter(`${f.id}:sx:${i}:${Math.floor((clock * 1.1 + i * 0.4) / 1.6)}`) * 0.5 + 0.5) * (wx + ww - ore - 6), y: wy + 5 + (i + 0.5) * (wh - 8) / 4, t });
  }
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x0 = ore + 1.5 + gx * (i + 0.5); const y0 = wy + 4.5 + gy * (j + 0.5);
    let amp = d.hot ? 0.24 : 0.04;
    for (const s of stops) { const dd = Math.hypot(x0 - s.x, y0 - s.y); if (s.t > 0.55) amp += 0.35 * Math.exp(-dd / 5) * clamp(1.6 - s.t, 0, 1); }
    const freq = d.hot ? 36 : 8;
    const x = x0 + Math.sin(clock * freq + i * 3.1 + j) * amp * gx; const y = y0 + Math.cos(clock * (freq * 0.85) + j * 2.3 + i) * amp * gy;
    ctx.fillStyle = d.hot ? '#b89476' : '#7d858d'; ctx.beginPath(); ctx.arc(F.x(x), F.y(y), Math.max(1.8, F.len(Math.min(gx, gy) * 0.3)), 0, Math.PI * 2); ctx.fill();
  }
  for (const s of stops) {
    if (s.t <= 0.65) {
      const k = clamp(s.t / 0.55, 0, 1);
      ctx.strokeStyle = C.amber; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(F.x(wx + 2.5), F.y(s.y)); ctx.lineTo(F.x(lerp(wx + 2.5, s.x, k)), F.y(s.y)); ctx.stroke(); ctx.lineWidth = 1;
    }
    if (s.t > 0.5 && s.t < 1.15) {
      const ring = (s.t - 0.5) / 0.65;
      ctx.strokeStyle = C.amber; ctx.globalAlpha = 1 - ring; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(F.x(s.x), F.y(s.y), F.len(1 + ring * 3.5), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    }
  }
  say(ctx, d.hot ? 'Tracks stop in steel → atoms shake faster' : 'No radiation tracks · steel atoms stay slow', F.x(wx + ww / 2), F.y(wy + wh - 2.2), F.size(1.7, 6.2), { align: 'center', color: d.hot ? C.amber : C.dim, maxW: F.len(ww - 2) });
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
  // The source, at the strip's left end (label above so it never overlaps the foot line).
  ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(F.x(4.5), F.y(y0 + rows * ch / 2), Math.max(3, F.len(1.6)), 0, Math.PI * 2); ctx.fill();
  say(ctx, 'Source', F.x(4.5), F.y(y0 - 1.6), F.size(1.6, 6.2), { align: 'center', color: C.dust });
  if (!pick) { foot(ctx, f, F, 'Pick a radiation to see its trail', C.dust); return; }
  const kind = TISSUE[pick - 1];
  const k = progress(`${f.id}:kind`, b, pick, 2.2);
  const cy = y0 + rows * ch / 2;
  const reach = kind === 'alpha' ? 2 * cw : (cols) * cw;
  const end = x0 + reach * k;
  if (kind === 'gamma') gammaWave(ctx, F, 6, cy, 0, end - 6, 0);
  else { ctx.strokeStyle = kind === 'alpha' ? C.alpha : C.beta; ctx.lineWidth = kind === 'alpha' ? 2.4 : 1.4; ctx.beginPath(); ctx.moveTo(F.x(6), F.y(cy)); ctx.lineTo(F.x(end), F.y(cy + (kind === 'beta' ? Math.sin(end) * 0.6 : 0))); ctx.stroke(); ctx.lineWidth = 1; }
  // Broken molecules: clear amber crosses with a running count under the strip.
  const pts = breaksOf(kind, cols);
  let shown = 0;
  ctx.strokeStyle = C.amber; ctx.lineWidth = 1.8;
  pts.forEach(([c, r], n) => {
    const x = x0 + (c + 0.2 + ((n * 37) % 60) / 100) * cw; const y = y0 + (r + 0.25 + ((n * 53) % 50) / 100) * ch;
    if (x > end) return;
    shown++;
    const sx = F.x(x); const sy = F.y(y); const sz = Math.max(3, F.len(0.75));
    ctx.beginPath(); ctx.moveTo(sx - sz, sy - sz); ctx.lineTo(sx + sz, sy + sz); ctx.moveTo(sx + sz, sy - sz); ctx.lineTo(sx - sz, sy + sz); ctx.stroke();
  });
  ctx.lineWidth = 1;
  const name = kind[0].toUpperCase() + kind.slice(1);
  const span = kind === 'alpha' ? 'in first 2 cells' : `across ${cols} cells`;
  foot(ctx, f, F, `${name}: ${shown} broken molecule${shown === 1 ? '' : 's'} ${span}`, C.amber);
}
registerFixture('ntissue', {
  paint: paintTissue,
  live: () => true,
  tapZones: f => tissueKeys(f).map(z => ({ x0: z.x0, x1: z.x1, y0: z.y0, y1: z.y1, dial: 'kind', value: z.value }))
});
