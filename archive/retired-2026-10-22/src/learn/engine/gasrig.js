/**
 * gasrig.js — The gas rig, Bellows' instrument for what a gas does.
 *
 * A cylinder with a piston, a gauge on its wall, a thermometer, a counter that
 * ticks for every knock on the far wall and a window onto the particles. It is
 * built on the plate bench (`plates.js`) as a sibling of the light bench and the
 * bond bench, because its pictures — a window of bouncing particles, a dial, a
 * histogram, a trace — are plates, and a plate bench is what the 3D twin
 * (`gasrig3d.js`) already knows how to stand.
 *
 * SIX HEADS, one bench:
 *   cylinder   a gas in a cylinder: window, gauge, thermometer, counters, and an
 *              inset that is either the SPEED SCREEN or a TRACE of the points the
 *              dials have been through. This is every stage of q1 to q3 and q6.
 *   mixture    a tank holding several gases, each drawn in its own SHAPE (never in
 *              its own colour alone), with a counter for each gas (q4).
 *   leak       a chamber with a pinhole; the time dial opens it and the plate
 *              shows how much is left (q5).
 *   tube       two tubes of still air with a gas released at one end (q5).
 *   path       one particle's track through a crowd, path against distance (q5).
 *   record     a gauge record: one quantity plotted against another (q2).
 *
 * EVERY READING IS DERIVED. A plate's numbers are `gasdata.planGas` over its
 * declaration and the bench's dials; there is no figure on a plate that a quest
 * typed in. A mixture's pressure is the sum of each gas alone, because that is
 * what the ideal law gives for each; the bench never states it as a rule.
 *
 * THE PICTURE IS HONEST. The window holds one dot per twelfth of a mole, so
 * doubling the gas doubles the dots; its width follows the piston, so the room
 * on the plate is the room in the cylinder; a dot moves at a speed that follows
 * the mean speed of its gas at its temperature; and its size follows the
 * particles' own share of the room (the van der Waals `b`), which is only
 * visible when the room is nearly all taken.
 *
 * Aesthetic contract (CLAUDE.md §4, §8): phosphor on a recessed plate, nothing
 * blooms, a gas is told by a stencilled shape and never by colour alone.
 */

import { PlateBench, PLATE_COLORS, plateText, raster, aperture, mulberry32, hashId } from './plates.js';
import {
  GASES, planGas, stateOf, speedBins, fractionAbove, leftAfter, halfTime, front,
  planMixture, mixtureState, dotsFor, sig, litres, kPaToAtm, kPaToMmHg, ATM_KPA, toCelsius,
  pressureIdeal, volumeIdeal, speeds, R, recordCurve
} from './gasdata.js';
import { drawShareBars } from './visual-devices.js';

/** The words on the plate. A word is plain until its card has earned the real one. */
export function words(cfg = {}) {
  return {
    knocks: 'KNOCKS',
    amount: 'AMOUNT',
    volume: 'VOLUME',
    energy: 'ENERGY OF MOTION',
    speed: 'AVERAGE SPEED',
    share: 'SHARE',
    gauge: 'GAUGE',
    ...(cfg.labels || {})
  };
}

const PHOS = PLATE_COLORS.phosphor;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const AMBER = PLATE_COLORS.amber;

/** A triangle wave: a particle bouncing between two walls has this position. */
function bounce(x0, v, t, len) {
  if (len <= 0) return 0;
  const p = ((x0 + v * t) % (2 * len) + 2 * len) % (2 * len);
  return p <= len ? p : 2 * len - p;
}

/** The shape stencilled on a particle of each mixture gas, in order. */
export const SHAPES = ['circle', 'square', 'triangle', 'diamond'];

function drawShape(ctx, shape, x, y, r, fill = null) {
  ctx.beginPath();
  if (shape === 'circle') ctx.arc(x, y, r, 0, Math.PI * 2);
  else if (shape === 'square') ctx.rect(x - r, y - r, r * 2, r * 2);
  else if (shape === 'triangle') { ctx.moveTo(x, y - r * 1.15); ctx.lineTo(x + r * 1.1, y + r * 0.85); ctx.lineTo(x - r * 1.1, y + r * 0.85); ctx.closePath(); }
  else { ctx.moveTo(x, y - r * 1.2); ctx.lineTo(x + r * 1.1, y); ctx.lineTo(x, y + r * 1.2); ctx.lineTo(x - r * 1.1, y); ctx.closePath(); }
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.stroke();
}

/* ------------------------------------------------------------------
   THE BENCH
   ------------------------------------------------------------------ */

export class GasRig extends PlateBench {
  /**
   * @param {HTMLElement} host
   * @param {{onProbe?: Function, onSelect?: Function, onVolume?: Function,
   *          onTemp?: Function, onTime?: Function}} opts
   *   The `on...` hooks are heard only on the built bench, where the dials are
   *   real; the drawn bench's dials are the quest's own panel dials.
   */
  constructor(host, opts = {}) {
    super(host, opts);
    this.onVolume = opts.onVolume || null;
    this.onTemp = opts.onTemp || null;
    this.onTime = opts.onTime || null;
    this.cfg = GasRig.blankCfg();
    this.clock = 0;
  }

  static blankCfg() {
    return {
      volumes: [], volume: 1,
      temps: [], temp: 1, tempUnit: 'C', tempList: 'C',
      times: [], time: 1,
      step: 1, nMin: 0.5, nMax: 4,
      labels: {}, show: {}, scale: 'plain',
      vmax: 0, gaugeMax: 400, thermoLo: -50, thermoHi: 450,
      trace: null, inset: null, bar: null, speedMax: 2400, units: false
    };
  }

  prepare(item) {
    const it = { ...item };
    if (it.head === 'mixture') {
      it.parts = (item.parts || []).map(p => ({ ...p }));
      it.start = (item.parts || []).map(p => ({ ...p }));
    } else if (it.n === undefined && it.gas) {
      it.n = 1;
    }
    it.n0 = it.n;
    it.trail = [];
    return it;
  }

  apertureClass(item) {
    return item.head === 'record' || item.head === 'mixture' || item.head === 'cylinder'
      ? 'gas-aperture gas-tall' : 'gas-aperture';
  }

  gridClass() { return 'gas-grid'; }

  /**
   * Lay out the plates for a stage.
   * @param {Array<object>} rigs  `{ id, label, note, head, ...head fields }`
   * @param {object} cfg  `{ volumes, volume, temps, temp, tempUnit, times, time, step, nMin, nMax,
   *                         labels, show, scale, vmax, gaugeMax, thermoLo, thermoHi, trace, bar }`
   */
  setRigs(rigs, cfg = {}) {
    this.cfg = { ...GasRig.blankCfg(), ...cfg };
    this.setPlates(rigs);
    this.visitAll();
    if (this.items.some(r => this.animated(r))) this.startAnim();
  }

  animated(item) { return ['cylinder', 'mixture', 'leak', 'tube'].includes(item.head); }

  /* ---------------- the dials ---------------- */

  setVolume(i) { this.cfg.volume = i; this.setDialValue?.('volume', i); this.visitAll(); this.drawAll(); }
  setTemp(i) { this.cfg.temp = i; this.setDialValue?.('temp', i); this.visitAll(); this.drawAll(); }
  setTime(i) { this.cfg.time = i; this.setDialValue?.('time', i); this.drawAll(); }

  /** Seconds the time dial is at. */
  get seconds() { return this.cfg.times.length ? this.cfg.times[this.cfg.time - 1] : 0; }

  /** Add (or take away) gas on every cylinder that can be charged. Kept inside the bench's bounds. */
  addGas(delta = this.cfg.step) {
    const { nMin, nMax } = this.cfg;
    let moved = false;
    for (const it of this.items) {
      if (it.head !== 'cylinder' || it.charge === false) continue;
      const next = Math.round((it.n + delta) * 1000) / 1000;
      if (next < nMin - 1e-9 || next > nMax + 1e-9) continue;
      it.n = next;
      moved = true;
    }
    if (moved) { this.visitAll(); this.drawAll(); }
    return moved;
  }

  /** Set a cylinder to exactly `n` moles: the gas a reaction gave off. */
  gasTo(id, n) {
    const it = this.itemFor(id);
    if (!it || it.head !== 'cylinder') return false;
    it.n = Math.max(0, Math.round(n * 100000) / 100000);
    this.visitAll();
    this.drawAll();
    return true;
  }

  /** Put every plate back as the stage laid it. */
  reset() {
    for (const it of this.items) {
      if (it.head === 'cylinder') it.n = it.n0;
      if (it.head === 'mixture') it.parts = it.start.map(p => ({ ...p }));
      it.trail = [];
    }
    this.visitAll();
    this.drawAll();
  }

  /** Pour everything in plate `from` into plate `to`: the same room, so each gas keeps its own push. */
  pour(from, to) {
    const a = this.itemFor(from); const b = this.itemFor(to);
    if (!a || !b || a === b || a.head !== 'mixture' || b.head !== 'mixture') return false;
    for (const p of a.parts) {
      const into = b.parts.find(q => q.gas === p.gas);
      if (into) into.n += p.n; else b.parts.push({ ...p });
    }
    a.parts = [];
    this.drawAll();
    return true;
  }

  /** Add `n` moles of a gas to a mixture plate. */
  feed(id, gas, n) {
    const t = this.itemFor(id);
    if (!t || t.head !== 'mixture') return false;
    const into = t.parts.find(q => q.gas === gas);
    if (into) into.n = Math.round((into.n + n) * 1000) / 1000; else t.parts.push({ gas, n });
    this.drawAll();
    return true;
  }

  /** Take every particle of one gas out of a mixture (a trap that holds only that gas). */
  trap(id, gas) {
    const t = this.itemFor(id);
    if (!t || t.head !== 'mixture') return false;
    t.parts = t.parts.filter(q => q.gas !== gas);
    this.drawAll();
    return true;
  }

  /* ---------------- readings ---------------- */

  /** The state a plate reads under the present settings. */
  reading(id) {
    const it = this.itemFor(id);
    return it ? readPlate(it, this.cfg) : null;
  }

  /** The points a cylinder's dials have been through, in the order they were visited. */
  traceOf(id) {
    const it = this.itemFor(id);
    return it ? it.trail.slice() : [];
  }

  /** Keep the point every cylinder is at now. */
  visitAll() {
    for (const it of this.items) {
      if (it.head !== 'cylinder') continue;
      const s = stateOf(it, this.cfg);
      const key = `${s.n.toFixed(3)}|${s.T.toFixed(2)}|${s.V.toFixed(4)}`;
      if (!it.trail.some(p => p.key === key)) it.trail.push({ key, n: s.n, T: s.T, V: s.V, P: s.P, Z: s.Z });
    }
  }

  clearTrace() {
    for (const it of this.items) it.trail = [];
    this.visitAll();
    this.drawAll();
  }

  /* ---------------- plate behaviour ---------------- */

  press(item, hit) {
    if (!hit) return null;
    if (item.head === 'cylinder' || item.head === 'mixture') {
      return { mark: {}, read: { kind: item.head, ...readPlate(item, this.cfg) } };
    }
    if (item.head === 'leak') {
      return { mark: {}, read: { kind: 'leak', plateId: item.id, gas: item.gas, left: leftAfter(item.gas, this.seconds), seconds: this.seconds } };
    }
    if (item.head === 'tube') {
      return { mark: {}, read: { kind: 'tube', plateId: item.id, gas: item.gas, cm: front(item.gas, this.seconds), seconds: this.seconds } };
    }
    if (item.head === 'path') {
      const w = walkOf(item, this.seconds);
      return { mark: {}, read: { kind: 'path', plateId: item.id, ...w } };
    }
    if (item.head === 'record') return { mark: {}, read: { kind: 'record', plateId: item.id } };
    return null;
  }

  draw(ctx, w, h, item, o) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PLATE_COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    const cfg = this.cfg;
    const t = this.clock;
    switch (item.head) {
      case 'cylinder': drawCylinder(ctx, w, h, item, cfg, t); break;
      case 'mixture': drawMixture(ctx, w, h, item, cfg, t); break;
      case 'leak': drawLeak(ctx, w, h, item, cfg, t, this.seconds); break;
      case 'tube': drawTube(ctx, w, h, item, cfg, t, this.seconds); break;
      case 'path': drawPath(ctx, w, h, item, cfg, this.seconds); break;
      case 'record': drawRecord(ctx, w, h, item, cfg); break;
      default: break;
    }
    raster(ctx, w, h, o.sweep, 0, h);
    aperture(ctx, w, h);
    return [{ key: 'plate', x0: 0, y0: 0, x1: w, y1: h }];
  }

  tick(dt) {
    this.clock += dt;
    return this.items.some(r => this.animated(r));
  }
}

/** The reading of one plate, whatever its head. */
export function readPlate(item, cfg) {
  if (item.head === 'mixture') {
    const { T, V } = mixtureState(item, cfg);
    const m = planMixture(item.parts, T, V);
    return { plateId: item.id, head: 'mixture', ...m, T, V };
  }
  return { plateId: item.id, head: 'cylinder', ...planGas(item, cfg) };
}

/* ------------------------------------------------------------------
   SHARED PIECES
   ------------------------------------------------------------------ */

function sizes(w, h) {
  const small = Math.max(7.5, Math.min(h * 0.05, w * 0.034));
  return { small, pad: Math.max(7, Math.min(w, h) * 0.03) };
}

/** The gauge: a dial that reads kPa by default, or atm, mmHg, or all three rings. */
function drawGauge(ctx, cx, cy, r, P, cfg, small, scale = cfg.scale) {
  const max = cfg.gaugeMax;
  const a0 = Math.PI * 0.8; const a1 = Math.PI * 2.2;      // a 252-degree sweep, opening at the bottom
  const ang = p => a0 + Math.min(1.05, Math.max(0, p / max)) * (a1 - a0);
  const all = scale === 'all';

  ctx.fillStyle = '#16140f';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

  const bare = scale === 'ring1' || scale === 'ring2' || scale === 'ring3';
  const which = bare ? { ring1: 'atm', ring2: 'kpa', ring3: 'mmhg' }[scale] : scale;
  const rings = all
    ? [{ unit: 'atm', k: p => kPaToAtm(p), r: r * 0.46, dec: 1 }, { unit: 'kPa', k: p => p, r: r * 0.68, dec: 0 }, { unit: 'mmHg', k: p => kPaToMmHg(p), r: r * 0.9, dec: 0 }]
    : [{ unit: which === 'atm' ? 'atm' : which === 'mmhg' ? 'mmHg' : which === 'kpa' ? 'kPa' : '', k: which === 'atm' ? p => kPaToAtm(p) : which === 'mmhg' ? p => kPaToMmHg(p) : p => p, r: r * 0.82, dec: which === 'atm' ? 1 : 0 }];

  ctx.lineWidth = 1;
  for (const ring of rings) {
    // The ring itself, so three scales read as three scales.
    if (all) {
      ctx.strokeStyle = PLATE_COLORS.rim;
      ctx.beginPath(); ctx.arc(cx, cy, ring.r, a0, a1); ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      if (all && i % 2 === 1) continue;
      const p = (max * i) / 4;
      const a = ang(p);
      ctx.strokeStyle = PLATE_COLORS.steel;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * ring.r, cy + Math.sin(a) * ring.r);
      ctx.lineTo(cx + Math.cos(a) * (ring.r - r * 0.07), cy + Math.sin(a) * (ring.r - r * 0.07));
      ctx.stroke();
      const lab = ring.k(p);
      const text = ring.dec ? lab.toFixed(ring.dec) : String(Math.round(lab));
      const inset = all ? 0.16 : 0.2;
      plateText(ctx, text, cx + Math.cos(a) * (ring.r - r * inset), cy + Math.sin(a) * (ring.r - r * inset) + small * 0.28,
        { align: 'center', size: Math.max(6, small * (all ? 0.62 : 0.85)), color: DIM });
    }
  }
  // The needle.
  const a = ang(P);
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86); ctx.stroke();
  ctx.fillStyle = PLATE_COLORS.steel;
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(2, r * 0.07), 0, Math.PI * 2); ctx.fill();
}

/** What the gauge prints under itself. */
export function gaugeText(P, scale) {
  if (scale === 'ring1') return kPaToAtm(P).toFixed(2);
  if (scale === 'ring2') return sig(P, 4);
  if (scale === 'ring3') return String(Math.round(kPaToMmHg(P)));
  if (scale === 'all') return `${kPaToAtm(P).toFixed(2)} atm  ${sig(P, 4)} kPa  ${Math.round(kPaToMmHg(P))} mmHg`;
  if (scale === 'atm') return `${kPaToAtm(P).toFixed(2)} atm`;
  if (scale === 'mmhg') return `${Math.round(kPaToMmHg(P))} mmHg`;
  if (scale === 'kpa') return `${sig(P, 4)} kPa`;
  return sig(P, 4);
}

/** The thermometer: a bar with a fill, in the unit the stage has earned. */
function drawThermo(ctx, x, y, w, h, T, cfg, small) {
  const lo = cfg.thermoLo; const hi = cfg.thermoHi;
  const tc = toCelsius(T);
  ctx.fillStyle = '#16140f';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const f = Math.min(1, Math.max(0, (tc - lo) / (hi - lo)));
  ctx.fillStyle = PHOS;
  ctx.fillRect(x + 2, y + 2, Math.max(1, (w - 4) * f), h - 4);
  const unit = cfg.tempUnit;
  const text = unit === 'K' ? `${Math.round(T)} K` : unit === 'both' ? `${Math.round(tc)} °C  ${Math.round(T)} K` : `${Math.round(tc)} °C`;
  plateText(ctx, text, x + w, y - 2, { align: 'right', size: small, color: PHOS, weight: 700 });
  plateText(ctx, 'TEMPERATURE', x, y - 2, { size: small * 0.85, color: DIM });
}

/** A plain boxed readout line: LABEL ........ value. */
function readout(ctx, x, y, w, label, value, small, color = PHOS) {
  plateText(ctx, label, x, y, { size: small * 0.82, color: DIM });
  plateText(ctx, value, x + w, y, { align: 'right', size: small, color, weight: 700 });
}

/* ------------------------------------------------------------------
   THE CYLINDER
   ------------------------------------------------------------------ */

function drawCylinder(ctx, w, h, item, cfg, t) {
  const L = words(cfg);
  const { small, pad } = sizes(w, h);
  const s = planGas(item, cfg);
  const gas = GASES[item.gas];
  const show = cfg.show || {};

  // ---- the header ----
  plateText(ctx, item.label, pad, small * 1.5, { size: small * 1.5, color: DUST, weight: 700 });
  if (item.equation) plateText(ctx, item.equation, w - pad, small * 1.5, { align: 'right', size: small * 0.9, color: PHOS, weight: 700 });
  else if (!item.sealed) plateText(ctx, gas.sym, w - pad, small * 1.5, { align: 'right', size: small * 1.4, color: DUST, weight: 700 });

  // ---- the window and the gauge ----
  const topY = small * 2.3;
  const rings3 = (item.scale || cfg.scale) === 'all';
  const zoneH = Math.max(40, h * (rings3 ? 0.46 : 0.36));
  const gw = rings3 ? Math.min(w * 0.5, zoneH * 1.2) : Math.min(w * 0.32, zoneH * 1.05);
  const winX = pad; const winY = topY; const winW = w - pad * 2 - gw - 6; const winH = zoneH;

  ctx.fillStyle = '#0a0907';
  ctx.fillRect(winX, winY, winW, winH);
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(winX + 0.5, winY + 0.5, winW - 1, winH - 1);

  // The piston: the room on the plate is the room in the cylinder.
  const vmax = cfg.vmax || Math.max(...(cfg.volumes.length ? cfg.volumes : [s.V]), s.V) * 1.0001;
  const inner = winW - 6;
  const roomPx = Math.max(10, Math.min(inner, (s.V / vmax) * inner));
  const wallX = winX + 3;
  const pistonX = wallX + roomPx;
  ctx.fillStyle = '#16130f';
  ctx.fillRect(winX + 1, winY + 1, pistonX - winX - 1, winH - 2);

  // Dots: one for each twelfth of a mole, moving as fast as the gas does at this temperature.
  const sealed = Boolean(item.sealed);
  const nDots = sealed ? 0 : dotsFor(s.n);
  const r = Math.max(1.7, Math.min(9, Math.sqrt((s.crowd * roomPx * (winH - 8)) / (nDots * Math.PI)) * 1.25));
  const speedPx = (s.mean / 1300) * (roomPx * 0.5 + 30);
  const rnd = mulberry32(hashId(`${item.id}${item.gas}`));
  let flash = 0;
  ctx.strokeStyle = DUST;
  ctx.lineWidth = 1;
  for (let i = 0; i < nDots; i++) {
    const x0 = rnd() * Math.max(1, roomPx - 2 * r);
    const y0 = rnd() * Math.max(1, winH - 8 - 2 * r);
    const ang = rnd() * Math.PI * 2;
    const sp = speedPx * (0.4 + 1.2 * rnd());
    const px = bounce(x0, Math.cos(ang) * sp, t, Math.max(1, roomPx - 2 * r));
    const py = bounce(y0, Math.sin(ang) * sp, t, Math.max(1, winH - 8 - 2 * r));
    const x = wallX + r + px; const y = winY + 4 + r + py;
    if (px < 2.5) flash++;
    ctx.fillStyle = '#26231d';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  }
  // The knock strip on the far wall lights where a particle strikes it.
  ctx.fillStyle = flash ? AMBER : PLATE_COLORS.steel;
  ctx.fillRect(winX, winY + 2, 3, winH - 4);
  if (sealed) {
    // A sealed cylinder resolves nothing inside it, and says so.
    ctx.strokeStyle = PLATE_COLORS.rim; ctx.lineWidth = 1;
    for (let k = -winH; k < roomPx; k += 9) {
      ctx.beginPath(); ctx.moveTo(wallX + Math.max(0, k), winY + 2 + Math.max(0, -k)); ctx.lineTo(wallX + Math.min(roomPx, k + winH - 4), winY + 2 + Math.min(winH - 4, roomPx - k)); ctx.stroke();
    }
    plateText(ctx, 'SEALED', wallX + roomPx / 2, winY + winH / 2 + small * 0.35, { align: 'center', size: small * 1.2, color: DIM, weight: 700 });
  }

  // The piston plate and its rod, with a stack of weights when it is free.
  ctx.fillStyle = PLATE_COLORS.steel;
  ctx.fillRect(pistonX, winY + 1, 4, winH - 2);
  ctx.fillRect(pistonX + 4, winY + winH / 2 - 1.5, Math.max(0, winX + winW - pistonX - 4), 3);
  if (item.hold === 'P') {
    const weights = Math.max(1, Math.min(4, Math.round((item.P0 ?? ATM_KPA) / 50)));
    ctx.fillStyle = DIM;
    for (let k = 0; k < weights; k++) ctx.fillRect(Math.min(pistonX + 6, winX + winW - 9), winY + winH / 2 - 4 - (k + 1) * 4, 8, 3);
  }

  // The gauge.
  const scale = item.scale || cfg.scale;
  const gr = Math.min(gw / 2, (zoneH - small * 1.5) / 2) - 1;
  const gcx = winX + winW + 6 + gw / 2; const gcy = winY + gr + 1;
  drawGauge(ctx, gcx, gcy, gr, s.P, cfg, small, scale);
  if (scale !== 'all') plateText(ctx, gaugeText(s.P, scale), gcx, winY + zoneH - 1, { align: 'center', size: small * 0.95, color: PHOS, weight: 700 });
  if (scale === 'plain' || scale.startsWith('ring')) plateText(ctx, L.gauge || 'GAUGE', gcx, gcy + gr * 0.8, { align: 'center', size: small * 0.62, color: DIM });

  // ---- the thermometer ----
  const thY = winY + zoneH + small * 1.8;
  drawThermo(ctx, pad, thY, w - pad * 2, Math.max(6, small * 0.8), s.T, cfg, small);

  // ---- readouts, with an inset beside them when the stage asks for one ----
  const rowsTop = thY + small * 2.2;
  const inset = cfg.inset || null;
  const hasInset = Boolean(inset) && (rowsTop + 28 < h - pad);
  const rowsX = hasInset ? w * 0.55 : pad;
  const rowsW = w - pad - rowsX;
  const rows = [];
  if (scale === 'all') {
    // The three rings are named by where they sit until the card has named the units.
    const named = cfg.units ? ['ATM', 'KPA', 'MMHG'] : ['INNER RING', 'MIDDLE RING', 'OUTER RING'];
    rows.push([named[0], s.atm.toFixed(2)]);
    rows.push([named[1], sig(s.P, 4)]);
    rows.push([named[2], String(Math.round(s.mmHg))]);
  }
  if (!sealed) rows.push([L.amount, `${sig(s.n, 3)} mol`]);
  rows.push([L.volume, `${litres(s.V)} L`]);
  if (show.knocks !== false && !sealed) rows.push([L.knocks, `${Math.round(s.knocks)}`]);
  if (show.energy) rows.push([L.energy, `${sig(s.energy, 3)}`]);
  if (show.speed) rows.push([L.speed, `${Math.round(s.mean)} m/s`]);
  if (show.mass) rows.push(['MASS', `${sig(s.mass, 3)} g`]);
  if (show.molar) rows.push(['MOLAR MASS', `${gas.M.toFixed(2)} g/mol`]);
  if (show.z) rows.push(['LAW CHECK  PV / nRT', s.Z.toFixed(3)]);
  if (show.pull) rows.push(['PULL TAKES OFF', `${sig(s.pull, 3)} kPa`]);
  if (show.pullShare) rows.push(['THE PULL TAKES OFF', `${(s.pullShare * 100).toFixed(0)} % OF THE PUSH`]);
  if (show.room) rows.push(['SIZE PUTS ON', `${sig(Math.max(0, s.room), 3)} kPa`]);
  const avail = h - pad - rowsTop;
  const lineH = Math.max(small * 1.15, Math.min(small * 1.9, avail / Math.max(1, rows.length)));
  rows.slice(0, Math.max(1, Math.floor(avail / lineH))).forEach((row, i) => {
    readout(ctx, rowsX, rowsTop + small + i * lineH, rowsW, row[0], row[1], small);
  });
  if (show.knocks !== false && !sealed && rows.length && rowsTop + small + rows.length * lineH < h) {
    plateText(ctx, 'KNOCKS x 10^21 per cm² per s', rowsX, h - pad * 0.6, { size: small * 0.62, color: DIM });
  }

  if (hasInset) {
    const ix = pad; const iy = rowsTop - small * 0.2; const iw = w * 0.55 - pad * 2; const ih = h - pad - iy;
    if (inset === 'speed') drawSpeedInset(ctx, ix, iy, iw, ih, item, cfg, s, small);
    else if (Array.isArray(inset)) drawTraceInsets(ctx, ix, iy, iw, ih, item, cfg, small);
    else if (inset === 'trace') drawTraceInsets(ctx, ix, iy, iw, ih, item, cfg, small);
  }
}

/** The speed screen: how many particles move at each speed. */
function drawSpeedInset(ctx, x, y, w, h, item, cfg, s, small) {
  const bins = 28; const vmax = cfg.speedMax;
  const frac = speedBins(item.gas, s.T, bins, vmax);
  const top = 0.085;                     // a fixed vertical scale, so a hotter gas visibly flattens
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PLATE_COLORS.rim; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  plateText(ctx, 'SPEEDS', x + 4, y + small, { size: small * 0.8, color: DIM });
  const bx0 = x + 3; const bw = (w - 6) / bins; const base = y + h - small * 1.3; const gh = h - small * 2.8;
  const bar = cfg.bar != null ? cfg.bar : null;
  frac.forEach((f, i) => {
    const bh = Math.min(gh, (f / top) * gh);
    const v0 = (i / bins) * vmax;
    const beyond = bar != null && v0 >= bar;
    ctx.fillStyle = beyond ? AMBER : PHOS;
    ctx.globalAlpha = beyond ? 0.85 : 0.7;
    ctx.fillRect(bx0 + i * bw + 0.5, base - bh, Math.max(1, bw - 1), bh);
  });
  ctx.globalAlpha = 1;
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.beginPath(); ctx.moveTo(bx0, base + 0.5); ctx.lineTo(x + w - 3, base + 0.5); ctx.stroke();
  for (const v of [0, vmax / 2, vmax]) {
    plateText(ctx, `${Math.round(v)}`, bx0 + (v / vmax) * (w - 6), y + h - 2, { align: v === 0 ? 'left' : v === vmax ? 'right' : 'center', size: small * 0.72, color: DIM });
  }
  if (bar != null) {
    const bxp = bx0 + (bar / vmax) * (w - 6);
    ctx.strokeStyle = AMBER; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bxp, y + 3); ctx.lineTo(bxp, base); ctx.stroke();
    const share = fractionAbove(item.gas, s.T, bar);
    plateText(ctx, `ABOVE THE BAR ${(share * 100).toFixed(share < 0.1 ? 1 : 0)} %`, x + w - 4, y + small, { align: 'right', size: small * 0.85, color: AMBER, weight: 700 });
  }
}

/** One or two small plots of the points the dials have been through. */
function drawTraceInsets(ctx, x, y, w, h, item, cfg, small) {
  const specs = Array.isArray(cfg.trace) ? cfg.trace : cfg.trace ? [cfg.trace] : [];
  if (!specs.length) return;
  const gap = 6;
  const pw = (w - gap * (specs.length - 1)) / specs.length;
  specs.forEach((spec, k) => {
    const px = x + k * (pw + gap);
    plotAxes(ctx, px, y, pw, h, spec, small);
    // The points the dials have visited, each at its own coordinates, and the line through them.
    const pts = item.trail.map(p => ({ x: valueOf(spec.x, p), y: valueOf(spec.y, p) })).sort((a, b) => a.x - b.x);
    const sx = v => px + 3 + ((v - spec.xmin) / (spec.xmax - spec.xmin)) * (pw - 6);
    const sy = v => y + h - small * 1.3 - ((v - (spec.ymin ?? 0)) / (spec.ymax - (spec.ymin ?? 0))) * (h - small * 2.8);
    ctx.strokeStyle = PHOS; ctx.fillStyle = PHOS; ctx.lineWidth = 1.5;
    if (pts.length > 1) {
      ctx.beginPath();
      pts.forEach((p, i) => { const X = sx(p.x); const Y = sy(p.y); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
      ctx.stroke();
    }
    for (const p of pts) ctx.fillRect(sx(p.x) - 1.5, sy(p.y) - 1.5, 3, 3);
  });
}

/** The value of a plotted quantity for a state: pressure, volume, kelvin, celsius, amount. */
export function valueOf(q, p) {
  if (q === 'P') return p.P;
  if (q === 'V') return p.V;
  if (q === 'T') return p.T;
  if (q === 'TC') return toCelsius(p.T);
  if (q === 'n') return p.n;
  if (q === 'Z') return p.Z;
  return 0;
}

const AXIS_NAME = { P: 'PRESSURE', V: 'VOLUME', T: 'KELVIN', TC: '°C', n: 'AMOUNT', Z: 'LAW CHECK' };

function plotAxes(ctx, x, y, w, h, spec, small) {
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PLATE_COLORS.rim; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const base = y + h - small * 1.3;
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.beginPath(); ctx.moveTo(x + 3, base + 0.5); ctx.lineTo(x + w - 3, base + 0.5); ctx.stroke();
  // The zero line of the quantity on the x axis, when it is in view.
  if (spec.xmin < 0 && spec.xmax > 0) {
    const zx = x + 3 + ((0 - spec.xmin) / (spec.xmax - spec.xmin)) * (w - 6);
    ctx.strokeStyle = DIM;
    ctx.beginPath(); ctx.moveTo(zx + 0.5, y + 3); ctx.lineTo(zx + 0.5, base); ctx.stroke();
  }
  plateText(ctx, `${AXIS_NAME[spec.y] || spec.y} / ${AXIS_NAME[spec.x] || spec.x}`, x + 4, y + small, { size: small * 0.75, color: DIM });
  let ticks = spec.xticks || [spec.xmin, spec.xmax];
  // A small plot labels only the ticks it has the room for.
  const room = ((w - 6) / Math.max(1, Math.abs(spec.xmax - spec.xmin))) * Math.min(...ticks.slice(1).map((v, i) => Math.abs(v - ticks[i])).concat([Infinity]));
  if (ticks.length > 3 && room < 22) ticks = ticks.filter((_, i) => i === 0 || i === ticks.length - 1 || i % 2 === 0);
  ticks.forEach((tv, i) => {
    const tx = x + 3 + ((tv - spec.xmin) / (spec.xmax - spec.xmin)) * (w - 6);
    if (spec.xticks) {
      ctx.strokeStyle = DIM;
      ctx.beginPath(); ctx.moveTo(tx + 0.5, base); ctx.lineTo(tx + 0.5, base + 3); ctx.stroke();
    }
    plateText(ctx, String(tv), tx, y + h - 2, { align: i === 0 ? 'left' : i === ticks.length - 1 ? 'right' : 'center', size: small * 0.68, color: DIM });
  });
}

/* ------------------------------------------------------------------
   THE MIXTURE
   ------------------------------------------------------------------ */

function drawMixture(ctx, w, h, item, cfg, t) {
  const { small, pad } = sizes(w, h);
  const { T, V } = mixtureState(item, cfg);
  const parts = item.parts;
  const m = planMixture(parts, T, V);
  const L = words(cfg);
  const sealed = Boolean(item.sealed);

  plateText(ctx, item.label, pad, small * 1.5, { size: small * 1.5, color: DUST, weight: 700 });
  const heightName = cfg.volumeNames ? cfg.volumeNames[(cfg.volume || 1) - 1] : null;
  plateText(ctx, `${heightName ? `${cfg.volumeLabel || 'AT'} ${heightName}  ` : `${litres(V)} L  `}${Math.round(toCelsius(T))} °C`, w - pad, small * 1.5, { align: 'right', size: small, color: DIM });

  const topY = small * 2.3; const zoneH = Math.max(40, h * 0.36);
  const gw = Math.min(w * 0.32, zoneH * 1.05);
  const winX = pad; const winY = topY; const winW = w - pad * 2 - gw - 6; const winH = zoneH;
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(winX, winY, winW, winH);
  ctx.strokeStyle = PLATE_COLORS.steel; ctx.lineWidth = 1.5;
  ctx.strokeRect(winX + 0.5, winY + 0.5, winW - 1, winH - 1);

  // Every gas has its own stencilled shape, drawn at its own speed.
  ctx.lineWidth = 1; ctx.strokeStyle = DUST;
  const r = 3;
  let flash = 0;
  if (!sealed) parts.forEach((p, gi) => {
    const shape = SHAPES[gi % SHAPES.length];
    const sp = (speeds(p.gas, T).mean / 1300) * (winW * 0.5 + 30);
    const rnd = mulberry32(hashId(`${item.id}${p.gas}`));
    const n = dotsFor(p.n);
    for (let i = 0; i < n; i++) {
      const x0 = rnd() * (winW - 8 - 2 * r); const y0 = rnd() * (winH - 8 - 2 * r);
      const ang = rnd() * Math.PI * 2; const v = sp * (0.4 + 1.2 * rnd());
      const px = bounce(x0, Math.cos(ang) * v, t, Math.max(1, winW - 8 - 2 * r));
      const py = bounce(y0, Math.sin(ang) * v, t, Math.max(1, winH - 8 - 2 * r));
      if (px < 2.5) flash++;
      drawShape(ctx, shape, winX + 4 + r + px, winY + 4 + r + py, r, '#26231d');
    }
  });
  ctx.fillStyle = flash ? AMBER : PLATE_COLORS.steel;
  ctx.fillRect(winX, winY + 2, 3, winH - 4);
  if (sealed) {
    ctx.strokeStyle = PLATE_COLORS.rim; ctx.lineWidth = 1;
    for (let k = -winH; k < winW; k += 9) {
      ctx.beginPath(); ctx.moveTo(winX + 3 + Math.max(0, k), winY + 2 + Math.max(0, -k)); ctx.lineTo(winX + 3 + Math.min(winW - 6, k + winH - 4), winY + 2 + Math.min(winH - 4, winW - 6 - k)); ctx.stroke();
    }
    plateText(ctx, 'SEALED', winX + winW / 2, winY + winH / 2 + small * 0.35, { align: 'center', size: small * 1.2, color: DIM, weight: 700 });
  }

  const gr = Math.min(gw / 2, (zoneH - small * 1.5) / 2) - 1;
  const gcx = winX + winW + 6 + gw / 2; const gcy = winY + gr + 1;
  drawGauge(ctx, gcx, gcy, gr, m.P, cfg, small, cfg.scale);
  plateText(ctx, gaugeText(m.P, cfg.scale), gcx, winY + zoneH - 1, { align: 'center', size: small * 0.95, color: PHOS, weight: 700 });

  // One row for each gas: its shape, its formula, how much of it, how often it knocks.
  if (sealed) return;
  const top = winY + zoneH + small * 2;
  const shareH = item.inset === 'share' ? Math.max(54, h * 0.3) : 0;
  const lineH = Math.max(small * 1.35, Math.min(small * 2.1, (h - pad - top - shareH) / Math.max(1, parts.length + 1)));
  plateText(ctx, 'GAS', pad + small * 2.2, top, { size: small * 0.72, color: DIM });
  plateText(ctx, 'AMOUNT', w * 0.58, top, { align: 'right', size: small * 0.72, color: DIM });
  plateText(ctx, L.knocks, w - pad, top, { align: 'right', size: small * 0.72, color: DIM });
  if (cfg.show?.share) plateText(ctx, L.share, w * 0.78, top, { align: 'right', size: small * 0.72, color: DIM });
  m.rows.forEach((row, i) => {
    const y = top + (i + 1) * lineH;
    ctx.strokeStyle = DUST; ctx.lineWidth = 1;
    drawShape(ctx, SHAPES[i % SHAPES.length], pad + small * 0.8, y - small * 0.3, small * 0.55, '#26231d');
    plateText(ctx, GASES[row.gas].sym, pad + small * 2.2, y, { size: small, color: DUST, weight: 700 });
    plateText(ctx, `${sig(row.n, 3)} mol`, w * 0.58, y, { align: 'right', size: small, color: PHOS, weight: 700 });
    if (cfg.show?.share) plateText(ctx, row.x.toFixed(2), w * 0.78, y, { align: 'right', size: small, color: PHOS });
    plateText(ctx, `${Math.round(row.knocks)}`, w - pad, y, { align: 'right', size: small, color: PHOS, weight: 700 });
  });
  if (!parts.length) plateText(ctx, 'EMPTY', w / 2, top + lineH, { align: 'center', size: small * 1.2, color: DIM });
  if (shareH && parts.length) {
    // The two bars are read off the same planner as the gauge: each gas's share of the
    // moles, and its share of the push the gauge reports.
    const comps = m.rows.map(r => ({ label: GASES[r.gas].sym, molFraction: r.x, pressureShare: m.P > 0 ? r.P / m.P : 0 }));
    drawShareBars(ctx, pad, h - pad - shareH, w - pad * 2, shareH, comps);
  }
}

/* ------------------------------------------------------------------
   THE PINHOLE
   ------------------------------------------------------------------ */

function drawLeak(ctx, w, h, item, cfg, t, seconds) {
  const { small, pad } = sizes(w, h);
  const gas = GASES[item.gas];
  const left = leftAfter(item.gas, seconds);
  plateText(ctx, item.label, pad, small * 1.5, { size: small * 1.5, color: DUST, weight: 700 });
  if (!item.sealed) plateText(ctx, gas.sym, w - pad, small * 1.5, { align: 'right', size: small * 1.4, color: DUST, weight: 700 });

  const topY = small * 2.4; const bh = Math.max(40, h * 0.42);
  const cw = (w - pad * 2) * 0.55; const cx = pad;
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(cx, topY, cw, bh);
  ctx.strokeStyle = PLATE_COLORS.steel; ctx.lineWidth = 1.5;
  ctx.strokeRect(cx + 0.5, topY + 0.5, cw - 1, bh - 1);
  // The pinhole, in the right-hand wall.
  const holeY = topY + bh / 2;
  ctx.fillStyle = PLATE_COLORS.bg;
  ctx.fillRect(cx + cw - 2, holeY - 4, 4, 8);

  const total = Math.min(40, Math.max(8, item.dots || 24));
  const stay = Math.round(total * left);
  const rnd = mulberry32(hashId(item.id + item.gas));
  const sp = (speeds(item.gas, 300).mean / 1300) * (cw * 0.5 + 30);
  ctx.lineWidth = 1; ctx.strokeStyle = DUST;
  for (let i = 0; i < total; i++) {
    const x0 = rnd() * (cw - 12); const y0 = rnd() * (bh - 12);
    const ang = rnd() * Math.PI * 2; const v = sp * (0.4 + 1.2 * rnd());
    const inside = i < stay;
    if (inside) {
      const px = bounce(x0, Math.cos(ang) * v, t, cw - 12); const py = bounce(y0, Math.sin(ang) * v, t, bh - 12);
      ctx.fillStyle = '#26231d';
      ctx.beginPath(); ctx.arc(cx + 6 + px, topY + 6 + py, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 6 + px, topY + 6 + py, 2.4, 0, Math.PI * 2); ctx.stroke();
    } else {
      // Out in the open on the far side: spread along the way out, still.
      const k = (i - stay) / Math.max(1, total - stay);
      ctx.fillStyle = '#1b1915';
      ctx.beginPath(); ctx.arc(cx + cw + 8 + k * (w - cx - cw - pad - 16), holeY + (rnd() - 0.5) * bh * 0.7, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + cw + 8 + k * (w - cx - cw - pad - 16), holeY + (rnd() - 0.5) * bh * 0.7, 2.2, 0, Math.PI * 2); ctx.stroke();
    }
  }
  const y = topY + bh + small * 1.8;
  readout(ctx, pad, y, w - pad * 2, 'TIME', `${sig(seconds, 3)} s`, small);
  readout(ctx, pad, y + small * 1.6, w - pad * 2, 'LEFT IN THE CHAMBER', `${Math.round(left * 100)} %`, small);
  if (cfg.show?.half) readout(ctx, pad, y + small * 3.2, w - pad * 2, 'HALF EMPTY AT', `${halfTime(item.gas).toFixed(1)} s`, small, AMBER);
}

/* ------------------------------------------------------------------
   THE TUBE
   ------------------------------------------------------------------ */

function drawTube(ctx, w, h, item, cfg, t, seconds) {
  const { small, pad } = sizes(w, h);
  const gas = GASES[item.gas];
  const length = item.length || 8;                 // cm
  plateText(ctx, item.label, pad, small * 1.5, { size: small * 1.5, color: DUST, weight: 700 });
  plateText(ctx, gas.sym, w - pad, small * 1.5, { align: 'right', size: small * 1.4, color: DUST, weight: 700 });

  const tx = pad + 4; const tw = w - pad * 2 - 8; const ty = small * 3.4; const th = Math.max(16, h * 0.18);
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(tx, ty, tw, th);
  ctx.strokeStyle = PLATE_COLORS.steel; ctx.lineWidth = 1.5;
  ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, th - 1);
  const cm = Math.min(length, front(item.gas, seconds));
  const fx = tx + (cm / length) * tw;
  // Where the gas has got to: a filled band from the release end.
  ctx.fillStyle = PHOS; ctx.globalAlpha = 0.45;
  ctx.fillRect(tx + 1, ty + 1, Math.max(0, fx - tx - 1), th - 2);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = AMBER; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(fx, ty); ctx.lineTo(fx, ty + th); ctx.stroke();
  // Centimetre ticks and the far end.
  ctx.strokeStyle = DIM; ctx.lineWidth = 1;
  for (let c = 0; c <= length; c++) {
    const x = tx + (c / length) * tw;
    ctx.beginPath(); ctx.moveTo(x, ty + th); ctx.lineTo(x, ty + th + (c % 2 ? 3 : 6)); ctx.stroke();
  }
  plateText(ctx, 'RELEASED HERE', tx, ty - 3, { size: small * 0.75, color: DIM });
  plateText(ctx, 'FAR END', tx + tw, ty - 3, { align: 'right', size: small * 0.75, color: DIM });
  const y = ty + th + small * 3;
  readout(ctx, pad, y, w - pad * 2, 'TIME', `${sig(seconds, 3)} s`, small);
  readout(ctx, pad, y + small * 1.6, w - pad * 2, 'REACHED', `${cm.toFixed(1)} cm`, small);
  if (cm >= length - 1e-9) readout(ctx, pad, y + small * 3.2, w - pad * 2, 'FAR END', 'REACHED', small, AMBER);
}

/* ------------------------------------------------------------------
   THE PATH
   ------------------------------------------------------------------ */

/**
 * One particle's track through a crowd. Every step is a straight run between
 * collisions in a random direction; the track is seeded so it is the same track
 * every time. `steps` is how many runs the time dial has let it make.
 */
export function walkOf(item, seconds) {
  const rnd = mulberry32(hashId(item.id + (item.gas || 'x')));
  const pts = [{ x: 0, y: 0 }];
  const total = Math.max(0, Math.round(seconds * (item.stepsPerSecond || 6)));
  let x = 0; let y = 0; let length = 0;
  for (let i = 0; i < total; i++) {
    const a = rnd() * Math.PI * 2;
    const run = 10 + rnd() * 14;           // a run between two collisions
    x += Math.cos(a) * run; y += Math.sin(a) * run;
    length += run;
    pts.push({ x, y });
  }
  return { points: pts, length, net: Math.hypot(x, y), hits: total };
}

function drawPath(ctx, w, h, item, cfg, seconds) {
  const { small, pad } = sizes(w, h);
  plateText(ctx, item.label, pad, small * 1.5, { size: small * 1.5, color: DUST, weight: 700 });
  plateText(ctx, GASES[item.gas]?.sym || '', w - pad, small * 1.5, { align: 'right', size: small * 1.4, color: DUST, weight: 700 });
  const bx = pad; const by = small * 2.4; const bw = w - pad * 2; const bh = Math.max(50, h * 0.5);
  ctx.fillStyle = '#100f0c'; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = PLATE_COLORS.steel; ctx.lineWidth = 1.5; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

  // The crowd the particle is moving through: still, pale points.
  const rnd = mulberry32(hashId(item.id + 'crowd'));
  ctx.fillStyle = DIM;
  for (let i = 0; i < 70; i++) ctx.fillRect(bx + 3 + rnd() * (bw - 6), by + 3 + rnd() * (bh - 6), 2, 2);

  const walk = walkOf(item, seconds);
  const scale = Math.min(bw, bh) / 260;
  const ox = bx + bw / 2; const oy = by + bh / 2;
  ctx.strokeStyle = PHOS; ctx.lineWidth = 1.2;
  ctx.beginPath();
  walk.points.forEach((p, i) => {
    const X = Math.max(bx + 2, Math.min(bx + bw - 2, ox + p.x * scale));
    const Y = Math.max(by + 2, Math.min(by + bh - 2, oy + p.y * scale));
    if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
  });
  ctx.stroke();
  ctx.fillStyle = DUST; ctx.fillRect(ox - 2, oy - 2, 4, 4);
  const last = walk.points[walk.points.length - 1];
  ctx.fillStyle = AMBER;
  ctx.beginPath(); ctx.arc(Math.max(bx + 2, Math.min(bx + bw - 2, ox + last.x * scale)), Math.max(by + 2, Math.min(by + bh - 2, oy + last.y * scale)), 3, 0, Math.PI * 2); ctx.fill();

  const y = by + bh + small * 1.8;
  readout(ctx, pad, y, w - pad * 2, 'TIME', `${sig(seconds, 3)} s`, small);
  readout(ctx, pad, y + small * 1.6, w - pad * 2, 'DISTANCE RUN', `${Math.round(walk.length)}`, small);
  readout(ctx, pad, y + small * 3.2, w - pad * 2, 'DISTANCE FROM THE START', `${Math.round(walk.net)}`, small, AMBER);
}

/* ------------------------------------------------------------------
   THE RECORD
   ------------------------------------------------------------------ */

export { recordCurve };

function drawRecord(ctx, w, h, item, cfg) {
  const { small, pad } = sizes(w, h);
  const rec = item.record;
  plateText(ctx, item.label, pad, small * 1.5, { size: small * 1.5, color: DUST, weight: 700 });
  const px = pad; const py = small * 2.4; const pw = w - pad * 2; const ph = h - py - pad;
  const spec = { x: rec.x, y: rec.y, xmin: rec.xmin, xmax: rec.xmax, ymin: rec.ymin ?? 0, ymax: rec.ymax, xticks: rec.xticks };
  plotAxes(ctx, px, py, pw, ph, spec, small);
  const sx = v => px + 3 + ((v - spec.xmin) / (spec.xmax - spec.xmin)) * (pw - 6);
  const sy = v => py + ph - small * 1.3 - ((v - spec.ymin) / (spec.ymax - spec.ymin)) * (ph - small * 2.8);
  const curve = recordCurve(item);
  ctx.strokeStyle = PHOS; ctx.lineWidth = 1.8;
  ctx.beginPath();
  let started = false;
  for (const p of curve) {
    if (p.y > spec.ymax * 1.5 || p.y < spec.ymin) continue;
    const X = sx(p.x); const Y = Math.max(py + 2, sy(p.y));
    if (started) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); started = true; }
  }
  ctx.stroke();
  plateText(ctx, `${rec.ymax}`, px + 4, py + small * 2, { size: small * 0.68, color: DIM });
}
