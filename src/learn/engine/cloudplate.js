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
 *
 * Two heads. A `cloud` plate shows its dots in the plane it is looking along
 * (xy, or all three of xy / xz / yz side by side). A `ring` plate draws a
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

/** The most shots a plate holds. Every drawn picture is the first N of these. */
export const MAX_SHOTS = 500;

/** The half thickness, in bohr, of the slab a slice keeps. */
export const SLICE_HALF = 1.0;

const PLANES = {
  xy: { a: 'x', b: 'y', c: 'z', name: 'along z' },
  xz: { a: 'x', b: 'z', c: 'y', name: 'along y' },
  yz: { a: 'y', b: 'z', c: 'x', name: 'along x' }
};

/** Which dots a plate shows, given the slice setting. */
export function visibleDots(points, fired, plane, slice) {
  const out = [];
  const c = PLANES[plane].c;
  for (let i = 0; i < fired && i < points.length; i++) {
    const p = points[i];
    if (slice && Math.abs(p[c]) > SLICE_HALF) continue;
    out.push(p);
  }
  return out;
}

function drawPanel(ctx, x0, y0, size, item, plane, cfg, o) {
  const P = PLANES[plane];
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

  // The dots.
  const dots = visibleDots(item.points || [], item.fired, plane, cfg.slice);
  const dot = Math.max(1.6, size * 0.011);
  ctx.fillStyle = PLATE_COLORS.phosphor;
  for (const p of dots) {
    ctx.fillRect(cx + p[P.a] * k - dot / 2, cy - p[P.b] * k - dot / 2, dot, dot);
  }
  // A single shot is circled, because one dot on a dark plate is easy to lose.
  if (item.fired === 1 && dots.length === 1) {
    const p = dots[0];
    ctx.strokeStyle = PLATE_COLORS.amber;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx + p[P.a] * k, cy - p[P.b] * k, dot * 3.2, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();

  if (item.plane === 'all' || cfg.showPlane) {
    plateText(ctx, P.name.toUpperCase(), x0 + 4, y0 + size - 5, { size: Math.max(8, size * 0.055), color: PLATE_COLORS.dim });
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
  return [{ key: 'cloud', x0: 0, y0: top, x1: w, y1: h }];
}

function drawRing(ctx, w, h, item, cfg, o) {
  const settings = cfg.settings || [];
  const wl = settings[Math.max(0, (cfg.setting || 1) - 1)];
  const small = Math.max(9, h * 0.05);
  const cx = w / 2;
  const cy = h * 0.54;
  const R = Math.min(w, h) * 0.3;
  const circ = 2 * Math.PI * R;

  // The track.
  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  plateText(ctx, 'NUCLEUS', cx, cy + small * 0.3, { align: 'center', size: small, color: PLATE_COLORS.dim });
  ctx.fillStyle = PLATE_COLORS.steel;
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(2.5, R * 0.04), 0, Math.PI * 2); ctx.fill();

  if (wl == null) return [];
  // The wave, drawn round the track, lap on lap. A wavelength that fits repeats
  // itself exactly and leaves one crisp ring; any other leaves each lap a
  // little out of step with the last, and the laps smear into a band.
  const n = RING_CIRCUMFERENCE_PM / wl;
  const A = R * 0.14;
  const laps = 6;
  ctx.lineWidth = Math.max(1.2, h * 0.006);
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
  void circ;

  plateText(ctx, `WAVELENGTH ${wl} pm`, 8, h * 0.08, { size: small * 1.15, color: PLATE_COLORS.phosphor, weight: 700 });
  plateText(ctx, `TRACK ${RING_CIRCUMFERENCE_PM.toFixed(0)} pm ROUND`, w - 8, h * 0.08, { align: 'right', size: small, color: PLATE_COLORS.dim });
  return [];
}

export class CloudPlate extends PlateBench {
  /** @param {{onProbe?: Function, onSelect?: Function, onSetting?: Function}} opts */
  constructor(host, opts = {}) {
    super(host, opts);
    this.onSetting = opts.onSetting || null;
    this.cfg = { extent: 12, slice: false, settings: [], setting: 1, showPlane: false };
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

  gridClass() { return 'cloud-grid'; }

  /**
   * @param {Array<object>} items `{ id, label, head: 'cloud'|'ring', orbital?, plane?, fired? }`
   * @param {{extent?: number, settings?: number[], setting?: number}} cfg
   */
  setPlates(items, cfg = {}) {
    this.cfg = { extent: 12, slice: false, settings: [], setting: 1, showPlane: false, ...cfg };
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

  /**
   * The bench never draws a path, and says why when asked to. There is no
   * method that joins two shots, and none will be added.
   */
  track() {
    return {
      refused: true,
      reason: 'Tracking needs a position and a speed at the same moment. Fixing the position blurs the speed, and fixing the speed blurs the position.'
    };
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
