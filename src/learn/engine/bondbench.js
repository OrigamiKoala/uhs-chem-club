/**
 * bondbench.js — The bond bench, Ligar's instrument for how far apart two joined
 * atoms sit and what it costs to part them.
 *
 * The join bench (`joinbench.js`) answers WHETHER two pieces hold. This one
 * answers how far apart they sit and how much holds them. It is built on the plate
 * bench as a sibling, not as a fourth field on a class that already carries two:
 * its pictures are a rail and a graph, neither of which the join bench draws.
 *
 *   pair     two atoms on a rail and a CRANK that winds them apart or together.
 *            Every setting of the crank is a point on the plate's energy trace,
 *            and the trace keeps the points the crank has been through, so the
 *            curve is something the player BUILDS by winding, and its bottom is
 *            a place they find. The readout (separation, energy) never goes away.
 *
 *   lattice  two ions drawn to scale and touching, with their charges stencilled
 *            and the distance between their centres. It reads no energy at all:
 *            charge and size are the evidence, and the order the lattices hold in
 *            is a thing the player works out from them.
 *
 * EVERY READING IS DERIVED. The trace is `bonddata.planCurve` over the pair's
 * measured length and energy; the lattice plate is `bonddata.IONS`. The bench
 * knows no chemistry beyond the figures it is handed.
 *
 * Aesthetic contract (CLAUDE.md §4, §8): phosphor on a recessed plate, nothing
 * blooms, a charge is told by a stencilled sign and never by colour alone.
 */

import { PlateBench, PLATE_COLORS, plateText, raster, aperture } from './plates.js';
import {
  PAIRS, DISC_RADIUS, IONS, LATTICES, planCurve, energySpan, centresOf, coulombIndex
} from './bonddata.js';

export const X_MAX = 330;

const fmtE = e => `${e > 0 ? '+' : e < 0 ? '−' : ''}${Math.abs(e).toFixed(0)}`;
const signed = q => `${q > 0 ? '+' : '−'}${Math.abs(q) > 1 ? Math.abs(q) : ''}`;

export class BondBench extends PlateBench {
  /** @param {{onProbe?: Function, onSelect?: Function, onSetting?: Function}} opts */
  constructor(host, opts = {}) {
    super(host, opts);
    this.onSetting = opts.onSetting || null;
    this.cfg = { settings: [], setting: 1 };
  }

  prepare(item) { return { ...item, trail: [] }; }

  apertureClass(item) { return item.head === 'lattice' ? 'bond-aperture bond-lattice' : 'bond-aperture'; }
  gridClass() { return 'bond-grid'; }

  /** Lay out the plates for a stage. `settings` are the separations (pm) the crank stops at. */
  setPlates(items, cfg = {}) {
    this.cfg = { settings: [], setting: 1, ...cfg };
    super.setPlates(items);
    this.visit();
  }

  /** The separation the crank is at, in pm. */
  get separation() { return this.cfg.settings[this.cfg.setting - 1] ?? null; }

  /** The setting the crank is on, 1-based. Records the point on every pair plate's trace. */
  setSetting(v) {
    const max = Math.max(1, this.cfg.settings.length);
    this.cfg.setting = Math.min(max, Math.max(1, v));
    this.visit();
    this.drawAll();
  }

  /** The crank has been here: keep the point. */
  visit() {
    const r = this.separation;
    if (r == null) return;
    for (const item of this.items) {
      if (item.head === 'lattice') continue;
      if (!item.trail.includes(r)) item.trail.push(r);
    }
  }

  /** Forget the trace and start the crank's walk again from where it stands. */
  clearTrace() {
    for (const item of this.items) item.trail = [];
    this.visit();
    this.drawAll();
  }

  /** What a pair plate reads at the crank's present setting. */
  reading(id) {
    const item = this.itemFor(id);
    const r = this.separation;
    if (!item || item.head === 'lattice' || r == null) return null;
    return { plateId: id, ...planCurve(item.pair, r) };
  }

  /** Every point a plate's trace holds, in the order the crank visited them. */
  traceOf(id) {
    const item = this.itemFor(id);
    return item ? item.trail.map(r => ({ r, ...planCurve(item.pair, r) })) : [];
  }

  press(item, hit) {
    if (!hit) return null;
    if (item.head === 'lattice') {
      const lat = LATTICES[item.lattice];
      const pull = (coulombIndex(lat) * 100).toFixed(2);
      return {
        mark: {},
        read: {
          kind: 'lattice', lattice: item.lattice,
          cation: IONS[lat.cation], anion: IONS[lat.anion], centres: centresOf(lat),
          pull
        }
      };
    }
    const read = this.reading(item.id);
    return read ? { mark: {}, read: { kind: 'pair', ...read } } : null;
  }

  draw(ctx, w, h, item, o) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PLATE_COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    if (item.head === 'lattice') drawLattice(ctx, w, h, item);
    else drawPair(ctx, w, h, item, this.separation, this.cfg);
    raster(ctx, w, h, o.sweep, 0, h);
    aperture(ctx, w, h);
    return [{ key: 'plate', x0: 0, y0: 0, x1: w, y1: h }];
  }

  tick() { return false; }
}

/* ------------------------------------------------------------------
   THE PICTURES
   ------------------------------------------------------------------ */

function drawAtom(ctx, x, y, r, sym) {
  ctx.fillStyle = '#16140f';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  plateText(ctx, sym, x, y + r * 0.34, { align: 'center', size: Math.max(9, r * 0.9), color: PLATE_COLORS.dust, weight: 700 });
}

function drawPair(ctx, w, h, item, r, cfg) {
  const pair = PAIRS[item.pair];
  const small = Math.max(8, Math.min(h * 0.045, w * 0.036));
  const pad = 10;

  plateText(ctx, pair.label, pad, small * 1.6, { size: small * 1.5, color: PLATE_COLORS.dust, weight: 700 });
  const now = r == null ? null : planCurve(pair, r);
  plateText(ctx, now ? `SEPARATION ${r} pm` : 'SEPARATION', w - pad, small * 1.3, {
    align: 'right', size: small * 1.05, color: PLATE_COLORS.phosphor, weight: 700
  });
  plateText(ctx, now ? `ENERGY ${fmtE(now.energy)} kJ/mol` : 'ENERGY', w - pad, small * 2.7, {
    align: 'right', size: small * 1.05, color: PLATE_COLORS.phosphor, weight: 700
  });

  // ---- the rail: both atoms to the same scale as the graph's axis ----
  const railY = small * 5.6;
  const left = pad + 18;
  const right = w - pad - 18;
  const px = pm => left + (pm / X_MAX) * (right - left);
  ctx.strokeStyle = PLATE_COLORS.dim;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(left, railY + small * 2.1); ctx.lineTo(right, railY + small * 2.1); ctx.stroke();
  for (let t = 0; t <= X_MAX; t += 50) {
    ctx.beginPath(); ctx.moveTo(px(t), railY + small * 2.1); ctx.lineTo(px(t), railY + small * 2.1 + 4); ctx.stroke();
  }
  if (r != null) {
    const scale = (right - left) / X_MAX;
    const ra = Math.max(5, (DISC_RADIUS[pair.a] || 60) * scale * 0.55);
    const rb = Math.max(5, (DISC_RADIUS[pair.b] || 60) * scale * 0.55);
    const ax = px(0) + ra;
    const bx = ax + r * scale;
    drawAtom(ctx, ax, railY, ra, pair.a);
    drawAtom(ctx, bx, railY, rb, pair.b);
    // The gap, as the bench measures it between centres.
    ctx.strokeStyle = PLATE_COLORS.amber;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ax, railY + small * 1.4); ctx.lineTo(bx, railY + small * 1.4); ctx.stroke();
  }

  // ---- the trace ----
  const gx0 = pad + 34; const gx1 = w - pad;
  const gy0 = railY + small * 4.4; const gy1 = h - small * 1.8;
  const span = energySpan(pair);
  const gx = pm => gx0 + (pm / X_MAX) * (gx1 - gx0);
  const gy = e => gy0 + (1 - (e - span.lo) / (span.hi - span.lo)) * (gy1 - gy0);

  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.lineWidth = 1;
  ctx.strokeRect(gx0 + 0.5, gy0 + 0.5, gx1 - gx0 - 1, gy1 - gy0 - 1);
  // The line where the atoms are parted and hold nothing.
  ctx.strokeStyle = PLATE_COLORS.dim;
  ctx.setLineDash?.([4, 4]);
  ctx.beginPath(); ctx.moveTo(gx0, gy(0)); ctx.lineTo(gx1, gy(0)); ctx.stroke();
  ctx.setLineDash?.([]);
  plateText(ctx, '0', gx0 - 4, gy(0) + small * 0.35, { align: 'right', size: small * 0.9, color: PLATE_COLORS.dim });
  plateText(ctx, 'ENERGY kJ/mol', pad, gy0 - 3, { size: small * 0.85, color: PLATE_COLORS.dim });
  plateText(ctx, 'SEPARATION pm', gx1, h - 3, { align: 'right', size: small * 0.85, color: PLATE_COLORS.dim });
  for (const t of [0, 100, 200, 300]) {
    plateText(ctx, String(t), gx(t), gy1 + small * 1.2, { align: 'center', size: small * 0.85, color: PLATE_COLORS.dim });
  }

  // The points the crank has visited, joined in order of separation.
  const pts = (item.trail || []).slice().sort((a, b) => a - b).map(rr => ({ r: rr, e: planCurve(pair, rr).energy }));
  ctx.strokeStyle = PLATE_COLORS.phosphor;
  ctx.fillStyle = PLATE_COLORS.phosphor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  pts.forEach((p, k) => { const x = gx(p.r); const y = Math.max(gy0, Math.min(gy1, gy(p.e))); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
  ctx.stroke();
  for (const p of pts) {
    const x = gx(p.r); const y = Math.max(gy0, Math.min(gy1, gy(p.e)));
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }
  if (now) {
    const x = gx(now.r); const y = Math.max(gy0, Math.min(gy1, gy(now.energy)));
    // The marble rides the trace at the current separation: amber because it is the live reading.
    ctx.save();
    ctx.fillStyle = PLATE_COLORS.amber;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PLATE_COLORS.bg;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

function drawLattice(ctx, w, h, item) {
  const lat = LATTICES[item.lattice];
  const cat = IONS[lat.cation];
  const an = IONS[lat.anion];
  const small = Math.max(8, Math.min(h * 0.05, w * 0.04));
  const pad = 10;
  plateText(ctx, lat.label, pad, small * 1.7, { size: small * 1.7, color: PLATE_COLORS.dust, weight: 700 });
  plateText(ctx, `CENTRES ${centresOf(lat)} pm`, w - pad, small * 1.5, {
    align: 'right', size: small * 1.1, color: PLATE_COLORS.phosphor, weight: 700
  });

  const pullVal = (coulombIndex(lat) * 100).toFixed(2);
  plateText(ctx, `PULL ${pullVal}`, w - pad, small * 2.9, {
    align: 'right', size: small * 1.05, color: PLATE_COLORS.amber, weight: 700
  });

  // The two ions touching, to one scale on every plate: 1 pm is the same length
  // everywhere, so a smaller ion is a smaller disc.
  const scale = (w * 0.30) / 280;
  const cy = h * 0.5;
  const cx = w * 0.30;
  const rc = cat.radius * scale;
  const ra = an.radius * scale;
  const x1 = cx - (rc + ra) / 2;
  const x2 = x1 + rc + ra;
  for (const [x, r, ion] of [[x1, rc, cat], [x2, ra, an]]) {
    ctx.fillStyle = '#16140f';
    ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PLATE_COLORS.steel;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.stroke();
    plateText(ctx, ion.sym, x, cy + small * 0.1, { align: 'center', size: Math.max(9, r * 0.8), color: PLATE_COLORS.dust, weight: 700 });
    plateText(ctx, signed(ion.charge), x, cy + r + small * 1.5, { align: 'center', size: small * 1.5, color: PLATE_COLORS.amber, weight: 700 });
    plateText(ctx, `${ion.radius} pm`, x, cy - r - small * 0.5, { align: 'center', size: small * 0.95, color: PLATE_COLORS.dim });
  }
  ctx.strokeStyle = PLATE_COLORS.amber;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x1, cy + Math.max(rc, ra) + small * 3); ctx.lineTo(x2, cy + Math.max(rc, ra) + small * 3); ctx.stroke();
  plateText(ctx, `PULL ${pullVal}`, (x1 + x2) / 2, cy + Math.max(rc, ra) + small * 4.4, {
    align: 'center', size: small * 0.9, color: PLATE_COLORS.amber, weight: 700
  });

  // A patch of the lattice itself, alternating, so the picture is of a solid.
  const gx = w * 0.70; const gy = h * 0.34; const cell = Math.min(w * 0.07, h * 0.1);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const isCat = (i + j) % 2 === 0;
      const ion = isCat ? cat : an;
      const r = Math.max(3, ion.radius * scale * 0.38);
      ctx.fillStyle = '#16140f';
      ctx.beginPath(); ctx.arc(gx + i * cell, gy + j * cell, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = isCat ? PLATE_COLORS.dust : PLATE_COLORS.steel;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(gx + i * cell, gy + j * cell, r, 0, Math.PI * 2); ctx.stroke();
    }
  }
}
