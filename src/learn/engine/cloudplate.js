/**
 * cloudplate.js — The cloud plate, Lanternfall's instrument for orbitals.
 *
 * A probe that finds an electron's position once per shot and leaves a dot on a
 * plate. One shot is a dot. Five hundred shots are a cloud. Every position is a
 * draw from the real hydrogen-like |psi|^2 (`orbitals.js`), seeded so any
 * picture can be reproduced, and so the dots a plate shows after fifty shots
 * are the first fifty of the five hundred it will show later.
 *
 * Tools:
 *   fire(n)       fire n shots at every plate on the bench (1, 50 or 500)
 *   clear()       wipe every plate
 *   setSlice(on)  show only the dots within a thin slab through the middle, so a
 *                 shell with nothing in it is visible instead of hidden behind
 *                 the dots in front of it
 *   setRing(i)    the ring head's wavelength dial
 *   turn(dy, dp)  turn every `turn` plate together, a step at a time or by a drag
 *   resetView()   put the turning plates back where they started
 *
 * Two heads. A `cloud` plate shows its dots in the plane it is looking along
 * (xy, or all three of xy / xz / yz side by side), or, with `plane: 'turn'`, as
 * the whole cloud in three dimensions that the player turns in their hands. A `ring` plate draws a
 * de Broglie wave round a circular track and lets the player turn its
 * wavelength: a wave that fits closes into one clean ring, and one that does not
 * meets itself out of step on every lap and smears.
 *
 * THE BENCH NEVER DRAWS A PATH. There is no tool that connects two shots, and
 * `track()` exists only to refuse, with the reason: that is stage eight's point.
 *
 * Aesthetic contract (CLAUDE.md §4, §8): phosphor dots on a recessed plate,
 * nothing blooms; a shell with no dots in it is a position on a scale, never a
 * colour.
 */

import { PlateBench, PLATE_COLORS, plateText, raster, aperture } from './plates.js';
import {
  ORBITALS, sampleOrbital, ringFits, BOHR_PM, RING_CIRCUMFERENCE_PM
} from './orbitals.js';

export { sampleOrbital, ringFits, RING_CIRCUMFERENCE_PM };

/**
 * THE TRADE THE UNCERTAINTY PRINCIPLE MAKES, at precision level `level` (1 to 5): the blur in position (pm) and in speed
 * (km/s). Their product is the same at every level, and sits a factor of two above the floor (Dx . Dv >= h / 4 pi m, about
 * 5.8 x 10^4 pm km/s). One function: the drawn plate and the tabletop's blur gauge both print these.
 */
export function blurAt(level) {
  return { dx: Math.round(150 / level), dv: Math.round(level * 770) };
}

/**
 * The refusal the bench gives when asked to follow an electron along a path: there is no path to follow, and this is why.
 * ONE sentence, one source: `CloudPlate.track()` and the tabletop's Track Electron key both read it.
 */
export function trackRefusal() {
  return {
    refused: true,
    reason: 'Tracking needs a position and a speed at the same moment. Fixing the position blurs the speed, and fixing the speed blurs the position.'
  };
}

/** The most shots a plate holds. Every drawn picture is the first N of these. */
export const MAX_SHOTS = 500;

/** The half thickness, in bohr, of the slab a slice keeps. */
export const SLICE_HALF = 1.0;

const PLANES = {
  xy: { a: 'x', b: 'y', c: 'z', name: 'along z' },
  xz: { a: 'x', b: 'z', c: 'y', name: 'along y' },
  yz: { a: 'y', b: 'z', c: 'x', name: 'along x' }
};

/** One step of the turn keys, in radians. A multiple of it reaches every axis-on view. */
export const TURN_STEP = Math.PI / 6;

/** Where a turning plate starts: oblique, so no two of x, y and z foreshorten alike. */
export const DEFAULT_VIEW = Object.freeze({ yaw: Math.PI / 6, pitch: Math.PI / 6 });

/** Yaw wraps; pitch stops at straight up and straight down. */
export function clampView(v) {
  const TAU = Math.PI * 2;
  const yaw = ((v.yaw % TAU) + TAU) % TAU;
  const pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, v.pitch));
  return { yaw, pitch };
}

/**
 * A dot as the turned cloud shows it: `a` right, `b` up and `c` toward the eye.
 * At yaw and pitch zero this is exactly the xy plate, looking along z.
 */
export function turnPoint(p, view) {
  const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw);
  const cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
  const x1 = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;
  return { a: x1, b: p.y * cp - z1 * sp, c: p.y * sp + z1 * cp };
}

/**
 * Every dot a plate shows, projected: `{ a, b, c }` with `c` the depth the slice
 * is cut across. A fixed plane reads the cloud's own axes; `turn` reads them
 * through the view. One function, so the drawn plate and the glass block agree.
 */
export function projectDots(points, fired, plane, slice, view = DEFAULT_VIEW) {
  const out = [];
  for (let i = 0; i < fired && i < points.length; i++) {
    const p = points[i];
    let q;
    if (plane === 'turn') q = turnPoint(p, view);
    else { const P = PLANES[plane]; q = { a: p[P.a], b: p[P.b], c: p[P.c] }; }
    if (slice && Math.abs(q.c) > SLICE_HALF) continue;
    out.push(q);
  }
  return out;
}

/** Which dots a plate shows, given the slice setting. */
export function visibleDots(points, fired, plane, slice, view) {
  const out = [];
  const flat = plane !== 'turn';
  const c = flat ? PLANES[plane].c : null;
  for (let i = 0; i < fired && i < points.length; i++) {
    const p = points[i];
    if (slice && Math.abs(flat ? p[c] : turnPoint(p, view || DEFAULT_VIEW).c) > SLICE_HALF) continue;
    out.push(p);
  }
  return out;
}

function drawAxes(ctx, x0, y0, size, view) {
  // The cloud's own x, y and z, so a lobe's direction can be named from any side.
  const len = size * 0.13;
  const ox = x0 + size * 0.17;
  const oy = y0 + size * 0.83;
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = PLATE_COLORS.steel;
  for (const [name, p] of [['x', { x: 1, y: 0, z: 0 }], ['y', { x: 0, y: 1, z: 0 }], ['z', { x: 0, y: 0, z: 1 }]]) {
    const q = turnPoint(p, view);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + q.a * len, oy - q.b * len);
    ctx.stroke();
    plateText(ctx, name, ox + q.a * (len + 7) - 3, oy - q.b * (len + 7) + 3, { size: Math.max(8, size * 0.055), color: PLATE_COLORS.dim });
  }
  ctx.restore();
}

function drawPanel(ctx, x0, y0, size, item, plane, cfg, o) {
  const turning = plane === 'turn';
  const view = cfg.view || DEFAULT_VIEW;
  const half = cfg.extent;
  const k = size / (2 * half);
  const cx = x0 + size / 2;
  const cy = y0 + size / 2;

  ctx.fillStyle = '#0a0908';
  ctx.fillRect(x0, y0, size, size);
  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, size - 1, size - 1);

  // Cross-hairs at the nucleus and a distance ring every 100 pm.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, size, size);
  ctx.clip();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, y0 + size); ctx.moveTo(x0, cy); ctx.lineTo(x0 + size, cy); ctx.stroke();
  const step = 100 / BOHR_PM;
  for (let r = step; r < half * 1.5; r += step) {
    ctx.beginPath(); ctx.arc(cx, cy, r * k, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // The dots. On a turning plate the near ones are bigger and brighter, the
  // far ones small and dim: depth is the only thing a flat picture of a solid has.
  const dots = projectDots(item.points || [], item.fired, plane, cfg.slice, view);
  const dot = Math.max(1.6, size * 0.011);
  ctx.fillStyle = PLATE_COLORS.phosphor;
  for (const p of dots) {
    if (turning) {
      const near = Math.max(0, Math.min(1, (p.c / half + 1) / 2));
      ctx.globalAlpha = 0.3 + 0.7 * near;
      const d = dot * (0.75 + 0.6 * near);
      ctx.fillRect(cx + p.a * k - d / 2, cy - p.b * k - d / 2, d, d);
    } else {
      ctx.fillRect(cx + p.a * k - dot / 2, cy - p.b * k - dot / 2, dot, dot);
    }
  }
  ctx.globalAlpha = 1;
  // A single shot is circled, because one dot on a dark plate is easy to lose.
  if (item.fired === 1 && dots.length === 1) {
    const p = dots[0];
    ctx.strokeStyle = PLATE_COLORS.amber;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx + p.a * k, cy - p.b * k, dot * 3.2, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();

  if (turning) drawAxes(ctx, x0, y0, size, view);
  else if (item.plane === 'all' || cfg.showPlane) {
    plateText(ctx, PLANES[plane].name.toUpperCase(), x0 + 4, y0 + size - 5, { size: Math.max(8, size * 0.055), color: PLATE_COLORS.dim });
  }
}

function drawCloud(ctx, w, h, item, cfg, o) {
  const small = Math.max(9, h * 0.05);
  const headH = h * 0.12;
  plateText(ctx, `SHOTS ${item.fired}`, 8, headH * 0.72, { size: small * 1.2, color: item.fired ? PLATE_COLORS.phosphor : PLATE_COLORS.dim, weight: 700 });
  if (cfg.slice) plateText(ctx, 'SLICE THROUGH THE MIDDLE', w - 8, headH * 0.72, { align: 'right', size: small, color: PLATE_COLORS.amber });

  const top = headH;
  const avail = h - top - 4;
  if (item.plane === 'all') {
    const gap = Math.max(4, w * 0.015);
    const size = Math.min(avail, (w - gap * 4) / 3);
    const startX = (w - (size * 3 + gap * 2)) / 2;
    ['xy', 'xz', 'yz'].forEach((pl, i) => drawPanel(ctx, startX + i * (size + gap), top + (avail - size) / 2, size, item, pl, cfg, o));
  } else {
    const size = Math.min(avail, w - 8);
    drawPanel(ctx, (w - size) / 2, top + (avail - size) / 2, size, item, item.plane || 'xy', cfg, o);
  }
  if (cfg.precision != null) {
    const { dx, dv } = blurAt(cfg.precision || 3);
    plateText(ctx, `POSITION BLUR Δx: ±${dx} pm`, 8, h - 22, { size: small * 0.85, color: PLATE_COLORS.amber, weight: 700 });
    plateText(ctx, `SPEED BLUR Δv: ±${dv} km/s`, 8, h - 8, { size: small * 0.85, color: PLATE_COLORS.amber, weight: 700 });
    plateText(ctx, 'FLOOR: Δx · Δp ≥ ℏ/2', w - 8, h - 8, { align: 'right', size: small * 0.85, color: PLATE_COLORS.dim, weight: 700 });
  }
  return [{ key: 'cloud', x0: 0, y0: top, x1: w, y1: h }];
}

/**
 * The de Broglie wave drawn round a circular track of radius `R` at (`cx`, `cy`), lap on lap. A wavelength that fits
 * repeats itself exactly and leaves one crisp ring; any other leaves each lap a little out of step with the last, and the
 * laps smear into a band. ONE function: the drawn plate and the tabletop's ring both call it.
 */
export function strokeRingWave(ctx, cx, cy, R, wl, { lineWidth = 1.2, laps = 6 } = {}) {
  const n = RING_CIRCUMFERENCE_PM / wl;
  const A = R * 0.14;
  ctx.lineWidth = lineWidth;
  for (let lap = 0; lap < laps; lap++) {
    ctx.strokeStyle = PLATE_COLORS.phosphor;
    ctx.globalAlpha = 0.9 / Math.sqrt(laps) + 0.08;
    ctx.beginPath();
    const steps = 360;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const s = t / (Math.PI * 2);
      const phase = 2 * Math.PI * (n * s + lap * n);
      const r = R + A * Math.cos(phase);
      const px = cx + r * Math.cos(t);
      const py = cy - r * Math.sin(t);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawRing(ctx, w, h, item, cfg, o) {
  const settings = cfg.settings || [];
  const wl = settings[Math.max(0, (cfg.setting || 1) - 1)];
  const small = Math.max(9, h * 0.05);
  const cx = w / 2;
  const cy = h * 0.54;
  const R = Math.min(w, h) * 0.3;

  // The track.
  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  plateText(ctx, 'NUCLEUS', cx, cy + small * 0.3, { align: 'center', size: small, color: PLATE_COLORS.dim });
  ctx.fillStyle = PLATE_COLORS.steel;
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(2.5, R * 0.04), 0, Math.PI * 2); ctx.fill();

  if (wl == null) return [];
  strokeRingWave(ctx, cx, cy, R, wl, { lineWidth: Math.max(1.2, h * 0.006) });

  plateText(ctx, `WAVELENGTH ${wl} pm`, 8, h * 0.08, { size: small * 1.15, color: PLATE_COLORS.phosphor, weight: 700 });
  plateText(ctx, `TRACK ${RING_CIRCUMFERENCE_PM.toFixed(0)} pm ROUND`, w - 8, h * 0.08, { align: 'right', size: small, color: PLATE_COLORS.dim });
  return [];
}

export class CloudPlate extends PlateBench {
  /** @param {{onProbe?: Function, onSelect?: Function, onSetting?: Function}} opts */
  constructor(host, opts = {}) {
    super(host, opts);
    this.onSetting = opts.onSetting || null;
    this.onTurn = opts.onTurn || null;
    this.cfg = { extent: 12, slice: false, settings: [], setting: 1, showPlane: false, view: { ...DEFAULT_VIEW } };
    this.flash = 0;
  }

  prepare(item) {
    const it = { ...item, fired: item.fired ?? 0, points: null, plane: item.plane || 'xy' };
    // A plate that starts already fired (a stage that hands over a finished
    // cloud) needs its dots before the first picture is drawn.
    if (it.fired && it.head !== 'ring') it.points = sampleOrbital(it.orbital, MAX_SHOTS, it.seed || 1);
    return it;
  }

  apertureClass(item) {
    return item.head === 'ring' || item.plane === 'all' ? 'cloud-aperture cloud-wide' : 'cloud-aperture';
  }

  /**
   * A drag on a turning plate turns every turning plate. Taps are for the keys:
   * a drag is optional here, and the built bench, which resolves a press and not
   * a stroke, turns by the keys alone.
   */
  onPointer(plate, e) {
    if (plate.item.plane !== 'turn' || e.button > 0) return super.onPointer(plate, e);
    let lx = e.clientX;
    let ly = e.clientY;
    const move = ev => {
      this.turn((ev.clientX - lx) * 0.012, (ev.clientY - ly) * 0.012);
      lx = ev.clientX; ly = ev.clientY;
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return undefined;
  }

  gridClass() { return 'cloud-grid'; }

  /**
   * @param {Array<object>} items `{ id, label, head: 'cloud'|'ring', orbital?, plane?, fired? }`
   * @param {{extent?: number, settings?: number[], setting?: number}} cfg
   */
  setPlates(items, cfg = {}) {
    this.cfg = { extent: 12, slice: false, settings: [], setting: 1, showPlane: false, ...cfg, view: { ...DEFAULT_VIEW, ...(cfg.view || {}) } };
    for (const it of items || []) if (it.head !== 'ring' && !ORBITALS[it.orbital]) {
      throw new Error(`cloud plate: unknown orbital "${it.orbital}"`);
    }
    super.setPlates(items);
  }

  ensurePoints(item) {
    if (!item.points && item.head !== 'ring') item.points = sampleOrbital(item.orbital, MAX_SHOTS, item.seed || 1);
    return item.points;
  }

  /** How many shots a plate has taken. */
  shots(id) { return this.itemFor(id)?.fired ?? 0; }

  /** Fire `n` more shots at every plate. */
  fire(n) {
    for (const item of this.items) {
      if (item.head === 'ring') continue;
      this.ensurePoints(item);
      item.fired = Math.min(MAX_SHOTS, item.fired + n);
    }
    this.sweep = 1;
    this.probe = null;
    this.startAnim();
    this.drawAll();
  }

  clear() {
    for (const item of this.items) item.fired = 0;
    this.drawAll();
  }

  setSlice(on) { this.cfg.slice = Boolean(on); this.drawAll(); }
  setRing(i) { this.cfg.setting = i; this.setDialValue?.('setting', i); this.drawAll(); }
  setPrecision(v) { this.cfg.precision = v; this.drawAll(); }

  /** The view every turning plate shares, so two clouds are always compared from the same side. */
  getView() { return { ...(this.cfg.view || DEFAULT_VIEW) }; }
  setView(v) { this.cfg.view = clampView({ ...this.getView(), ...v }); this.onTurn?.(this.cfg.view); this.drawAll(); }
  /** Turn by `dYaw` about the vertical and `dPitch` about the horizontal, in radians. */
  turn(dYaw, dPitch = 0) {
    const v = this.getView();
    this.setView({ yaw: v.yaw + dYaw, pitch: v.pitch + dPitch });
  }
  resetView() { this.setView({ ...DEFAULT_VIEW }); }

  /**
   * The bench never draws a path, and says why when asked to. There is no
   * method that joins two shots, and none will be added.
   */
  track() {
    return trackRefusal();
  }

  draw(ctx, w, h, item, o) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PLATE_COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    const hits = item.head === 'ring' ? drawRing(ctx, w, h, item, this.cfg, o) : drawCloud(ctx, w, h, item, this.cfg, o);
    raster(ctx, w, h, o.sweep, 0, h);
    aperture(ctx, w, h);
    return hits;
  }

  press() { return null; }

  tick() { return false; }
}
