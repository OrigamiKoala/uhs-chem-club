/**
 * domainrig.js — The domain rig, Ligar's instrument for shape.
 *
 * A hub with arms. Arms are clipped on from a tray (an arm carrying an atom, or a
 * balloon for a lone pair) and they PUSH APART and settle, so what the player
 * reads is where electrons end up when they cannot get away from each other. A
 * PROTRACTOR reads the angle between any two arms as a number, so nothing has to
 * be judged from a picture. The same rig carries four more heads, because they
 * all ask about one hub:
 *
 *   hub      the build plate: clip arms on, watch them settle, read angles.
 *   show     a molecule already assembled, to turn and measure.
 *   field    a molecule between two charged plates. FIELD switches the plates on
 *            and a molecule whose bond dipoles do not cancel swings to line up;
 *            ARROWS draws each bond's arrow and their sum.
 *   mixer    the hub's s and p orbitals, and a mixer that blends them: the lobes
 *            that result, and the p orbitals left over.
 *   twist    two hubs joined by one bond, two or three; TWIST turns one end.
 *
 * EVERYTHING IS DERIVED from `vsepr.js`: `planDomains` for where an arm settles,
 * `planDipole` for the field, `planMix` for the mixer, `planTwist` for the bond.
 * The rig draws a projection of those vectors and (at T4) stands them in the well
 * as real arms; it knows no names and prints none.
 *
 * Aesthetic contract (CLAUDE.md §4, §8): phosphor on a recessed plate, nothing
 * blooms; a lone pair is told from an atom by an outline and two dots, never by
 * colour alone.
 */

import { PlateBench, PLATE_COLORS, plateText, raster, aperture } from './plates.js';
import {
  RIG_MOLECULES, planDomains, angleBetween, planDipole, planMix, planTwist, EN
} from './vsepr.js';
import { drawTugOfWar } from './visual-devices.js';

const RAD = Math.PI / 180;
const BIG = new Set(['Cl', 'S', 'P', 'Xe', 'Br']);

/** The arms a stage's hub begins with: a molecule's own, or none. */
function startArms(item) {
  if (item.mol) return RIG_MOLECULES[item.mol].arms.map(a => ({ ...a }));
  return (item.prefill || []).map(a => ({ ...a }));
}

/** Rotate a vector about y (yaw) then x (pitch), the view the plate looks from. */
export function rotateView(v, yaw, pitch) {
  const cy = Math.cos(yaw); const sy = Math.sin(yaw);
  const x1 = v[0] * cy + v[2] * sy;
  const z1 = -v[0] * sy + v[2] * cy;
  const cp = Math.cos(pitch); const sp = Math.sin(pitch);
  return [x1, v[1] * cp - z1 * sp, v[1] * sp + z1 * cp];
}

/** Rotation taking unit vector `a` onto unit vector `b` (Rodrigues), as a function. */
function rotationBetween(a, b) {
  const v = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const c = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const s = Math.hypot(...v);
  if (s < 1e-6) return c > 0 ? (x => x) : (x => [-x[0], -x[1], x[2]]);
  const k = v.map(t => t / s);
  const ang = Math.atan2(s, c);
  return x => {
    const cos = Math.cos(ang); const sin = Math.sin(ang);
    const kx = k[1] * x[2] - k[2] * x[1]; const ky = k[2] * x[0] - k[0] * x[2]; const kz = k[0] * x[1] - k[1] * x[0];
    const kd = k[0] * x[0] + k[1] * x[1] + k[2] * x[2];
    return [x[0] * cos + kx * sin + k[0] * kd * (1 - cos), x[1] * cos + ky * sin + k[1] * kd * (1 - cos), x[2] * cos + kz * sin + k[2] * kd * (1 - cos)];
  };
}

export class DomainRig extends PlateBench {
  /** @param {{onProbe?: Function, onSelect?: Function}} opts */
  constructor(host, opts = {}) {
    super(host, opts);
    this.cfg = { hand: null, yaw: 0.55, pitch: 0.35, field: false, arrows: false, mix: null, twist: 0 };
  }

  prepare(item) {
    const arms = startArms(item);
    const plan = planDomains(arms);
    const stock = (item.stock || []).map(s => ({ ...s, left: s.n }));
    return {
      ...item,
      arms,
      stock,
      shown: plan.vectors.map(v => v.v.slice()),
      measure: null,       // { i, j } the last pair the protractor read
      first: null,         // the first arm tapped for the protractor
      align: 0,            // 0..1, how far a molecule in the field has swung round
      twistAngle: 0,
      shake: 0
    };
  }

  apertureClass(item) { return item.head === 'mixer' ? 'rig-aperture rig-wide' : 'rig-aperture'; }
  gridClass() { return 'rig-grid'; }

  setPlates(items, cfg = {}) {
    this.cfg = { hand: null, yaw: 0.55, pitch: 0.35, field: false, arrows: false, mix: null, twist: 0, ...cfg };
    super.setPlates(items);
  }

  /* ---- state ---- */

  armsOf(id) { return (this.itemFor(id)?.arms || []).map(a => ({ ...a })); }
  planOf(id) { return planDomains(this.itemFor(id)?.arms || []); }
  stockOf(id) { return (this.itemFor(id)?.stock || []).map(s => ({ ...s })); }

  setHand(hand) { this.cfg.hand = hand; this.drawAll(); }
  turn(dyaw = 0.7854, dpitch = 0) {
    this.cfg.yaw += dyaw;
    this.cfg.pitch = Math.max(-1.2, Math.min(1.2, this.cfg.pitch + dpitch));
    this.drawAll();
  }

  /** The protractor's last reading on a plate, in degrees, or null. */
  protractor(id) {
    const it = this.itemFor(id);
    if (!it?.measure) return null;
    return angleBetween(planDomains(it.arms), it.measure.i, it.measure.j);
  }

  setField(on) {
    this.cfg.field = Boolean(on);
    for (const it of this.items) {
      if (it.head !== 'field') continue;
      it.target = this.cfg.field && planDipole(it.mol).polar ? 1 : 0;
      it.shake = this.cfg.field && !planDipole(it.mol).polar ? 1 : 0;
    }
    this.startAnim();
  }
  setArrows(on) { this.cfg.arrows = Boolean(on); this.drawAll(); }
  setMix(p) { this.cfg.mix = p; this.drawAll(); }

  /** Turn one end of the bond. Returns what the bond did. */
  twist(id) {
    const it = this.itemFor(id);
    if (!it || it.head !== 'twist') return null;
    const plan = planTwist(it.bond);
    if (plan.free) {
      it.twistAngle = (it.twistAngle + 60) % 360;
      it.shake = 0;
    } else {
      it.shake = 1;
    }
    this.startAnim();
    return { plateId: id, bond: it.bond, free: plan.free, angle: it.twistAngle, why: plan.why };
  }

  clear(id = null) {
    for (const it of this.items) {
      if (id && it.id !== id) continue;
      it.arms = startArms(it);
      it.stock = (it.stock || []).map(s => ({ ...s, left: s.n }));
      it.measure = null; it.first = null;
    }
    this.retarget();
    this.drawAll();
  }

  /* ---- clipping arms ---- */

  /** One tap on the hub with a stocked arm held. */
  clip(item, stockId) {
    const s = item.stock.find(x => x.id === stockId);
    if (!s) return { action: 'refused', reason: 'That arm is not in the tray.' };
    if (s.left <= 0) return { action: 'refused', reason: 'The tray has no more of those.' };
    if (item.arms.length >= 6) return { action: 'refused', reason: 'The hub has room for six arms and no more.' };
    s.left -= 1;
    item.arms.push(s.kind === 'lone' ? { kind: 'lone' } : { kind: 'atom', sym: s.sym, mult: s.mult || 1 });
    item.measure = null; item.first = null;
    this.retarget(item);
    return { action: 'clipped', id: stockId };
  }

  unclip(item, armIndex) {
    if (item.locked) return { action: 'refused', reason: 'These arms are fixed on this stage.' };
    const arm = item.arms[armIndex];
    if (!arm) return { action: 'refused', reason: 'There is no arm there.' };
    const s = item.stock.find(x => (arm.kind === 'lone' ? x.kind === 'lone' : x.kind === 'atom' && x.sym === arm.sym && (x.mult || 1) === (arm.mult || 1)));
    if (s) s.left += 1;
    item.arms.splice(armIndex, 1);
    item.measure = null; item.first = null;
    this.retarget(item);
    return { action: 'unclipped' };
  }

  retarget() {
    for (const it of this.items) {
      const plan = planDomains(it.arms);
      // Arms that are new start at their socket's far side and swing in; old ones glide.
      it.shown = plan.vectors.map((v, k) => (it.shown[k] ? it.shown[k] : v.v.map(c => c * 0.2)));
      it.shown.length = plan.vectors.length;
      it.settling = true;
    }
    this.startAnim();
  }

  press(item, hit) {
    if (!hit) return null;
    if (hit.key === 'chip') return this.chipPress(item, hit);
    if (hit.key === 'plate') return { mark: {}, read: { kind: 'plate', plateId: item.id } };
    if (item.head !== 'hub' && item.head !== 'show') return null;

    if (hit.key === 'hub') {
      const h = this.cfg.hand || '';
      if (!h.startsWith('arm:')) return { mark: {}, read: { kind: 'rig', plateId: item.id, action: 'refused', reason: 'Pick an arm from the tray, then tap the hub.' } };
      if (item.locked || item.head === 'show') return { mark: {}, read: { kind: 'rig', plateId: item.id, action: 'refused', reason: 'These arms are fixed on this stage.' } };
      const res = this.clip(item, h.slice(4));
      return { mark: {}, read: { kind: 'rig', plateId: item.id, ...res, arms: this.armsOf(item.id), plan: planDomains(item.arms) } };
    }
    if (hit.key === 'arm') {
      if (this.cfg.hand === 'x') {
        const res = this.unclip(item, hit.i);
        return { mark: {}, read: { kind: 'rig', plateId: item.id, ...res, arms: this.armsOf(item.id), plan: planDomains(item.arms) } };
      }
      // The protractor: two arms, one angle.
      if (item.first == null || item.first === hit.i) {
        item.first = hit.i;
        return { mark: {}, read: { kind: 'protractor', plateId: item.id, pending: true, first: hit.i } };
      }
      item.measure = { i: item.first, j: hit.i };
      item.first = null;
      const angle = angleBetween(planDomains(item.arms), item.measure.i, item.measure.j);
      return { mark: {}, read: { kind: 'protractor', plateId: item.id, angle, ...item.measure } };
    }
    return null;
  }

  chipPress(item, hit) {
    const id = hit.id;
    if (id.startsWith('arm:') || id === 'x' || id === 'measure') {
      this.cfg.hand = id;
      return { mark: {}, read: { kind: 'hand', hand: id } };
    }
    if (id === 'field') { this.setField(!this.cfg.field); return { mark: {}, read: { kind: 'field', on: this.cfg.field } }; }
    if (id === 'arrows') { this.setArrows(!this.cfg.arrows); return { mark: {}, read: { kind: 'arrows', on: this.cfg.arrows } }; }
    if (id.startsWith('mix:')) { this.setMix(Number(id.slice(4))); return { mark: {}, read: { kind: 'mix', p: this.cfg.mix, plan: planMix(this.cfg.mix) } }; }
    if (id === 'twist') { const r = this.twist(item.id); return r ? { mark: {}, read: { kind: 'twist', ...r } } : null; }
    return null;
  }

  tick(dt) {
    let live = false;
    for (const it of this.items) {
      const plan = planDomains(it.arms);
      if (it.settling) {
        let moving = false;
        plan.vectors.forEach((v, k) => {
          const cur = it.shown[k] || [0, 0, 0];
          const next = cur.map((c, d) => c + (v.v[d] - c) * Math.min(1, dt * 7));
          if (Math.hypot(next[0] - v.v[0], next[1] - v.v[1], next[2] - v.v[2]) > 0.004) moving = true;
          it.shown[k] = next;
        });
        if (!moving) { it.shown = plan.vectors.map(v => v.v.slice()); it.settling = false; }
        live = live || moving;
      }
      if (it.head === 'field') {
        const goal = it.target ?? 0;
        if (Math.abs(it.align - goal) > 0.004) { it.align += (goal - it.align) * Math.min(1, dt * 4); live = true; } else it.align = goal;
        if (it.shake) { it.shakeT = (it.shakeT || 0) + dt; live = true; if (it.shakeT > 0.9) { it.shake = 0; it.shakeT = 0; } }
      }
      if (it.head === 'twist' && it.shake) { it.shakeT = (it.shakeT || 0) + dt; live = true; if (it.shakeT > 0.7) { it.shake = 0; it.shakeT = 0; } }
    }
    return live;
  }

  draw(ctx, w, h, item, o) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PLATE_COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    let hits = [];
    if (item.head === 'mixer') hits = drawMixer(ctx, w, h, item, this.cfg);
    else if (item.head === 'twist') hits = drawTwist(ctx, w, h, item, this.cfg);
    else if (item.head === 'field') hits = drawField(ctx, w, h, item, this.cfg);
    else hits = drawHub(ctx, w, h, item, this.cfg);
    raster(ctx, w, h, o.sweep, 0, h);
    aperture(ctx, w, h);
    // The whole plate is a hit of last resort, so a tap that lands on empty plate still reads it.
    hits.push({ key: 'plate', x0: 0, y0: 0, x1: w, y1: h });
    return hits;
  }
}

/* ------------------------------------------------------------------
   CHIPS: the tray along the bottom of a plate
   ------------------------------------------------------------------ */

function chipLabel(s) {
  if (s.label) return `${s.label.toUpperCase()} \u00d7${s.left}`;
  if (s.kind === 'lone') return `LONE PAIR ×${s.left}`;
  return `${s.sym}${s.mult === 2 ? '=' : s.mult === 3 ? '≡' : ''} ×${s.left}`;
}

export function chipsFor(item, cfg) {
  if (item.head === 'hub' || item.head === 'show') {
    return [
      ...(item.head === 'hub' && !item.locked ? item.stock.map(s => ({ id: `arm:${s.id}`, label: chipLabel(s), on: cfg.hand === `arm:${s.id}` })) : []),
      { id: 'measure', label: 'PROTRACTOR', on: cfg.hand === 'measure' },
      ...(item.head === 'hub' && !item.locked ? [{ id: 'x', label: 'REMOVE', on: cfg.hand === 'x' }] : [])
    ];
  }
  if (item.head === 'field') {
    return [{ id: 'field', label: 'FIELD', on: cfg.field }, { id: 'arrows', label: 'ARROWS', on: cfg.arrows }];
  }
  if (item.head === 'mixer') {
    if (item.noMix) return [];
    return [1, 2, 3].map(p => ({ id: `mix:${p}`, label: `${p + 1} ORBITALS`, on: cfg.mix === p }));
  }
  if (item.head === 'twist') return [{ id: 'twist', label: 'TWIST', on: false }];
  return [];
}

function drawChips(ctx, w, h, small, chips, hits) {
  if (!chips.length) return 0;
  const trayH = small * 3.2;
  const pad = 8;
  const cw = (w - pad * 2 - 6 * (chips.length - 1)) / chips.length;
  chips.forEach((c, k) => {
    const x = pad + k * (cw + 6);
    const y = h - trayH + 2;
    ctx.fillStyle = c.on ? '#2a2c1f' : '#16140f';
    ctx.fillRect(x, y, cw, trayH - 6);
    ctx.strokeStyle = c.on ? PLATE_COLORS.phosphor : PLATE_COLORS.rim;
    ctx.lineWidth = c.on ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, trayH - 7);
    plateText(ctx, c.label, x + cw / 2, y + (trayH - 6) / 2 + small * 0.4, {
      align: 'center', size: small * 0.98, color: c.on ? PLATE_COLORS.phosphor : PLATE_COLORS.dust, weight: 700
    });
    hits.push({ key: 'chip', id: c.id, x0: x, y0: y, x1: x + cw, y1: y + trayH - 6 });
  });
  return trayH;
}

/* ------------------------------------------------------------------
   PICTURES
   ------------------------------------------------------------------ */

function project(v, cfg, cx, cy, S) {
  const r = rotateView(v, cfg.yaw, cfg.pitch);
  const k = 1 / (1 - r[2] * 0.12);
  return { x: cx + r[0] * S * k, y: cy - r[1] * S * k, z: r[2], k };
}

function atomDisc(ctx, x, y, R, sym, ringed) {
  ctx.fillStyle = '#16140f';
  ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ringed ? PLATE_COLORS.amber : PLATE_COLORS.steel;
  ctx.lineWidth = ringed ? 2.2 : 1.5;
  ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke();
  plateText(ctx, sym, x, y + R * 0.34, { align: 'center', size: Math.max(8, R * 0.95), color: PLATE_COLORS.dust, weight: 700 });
}

function balloon(ctx, x0, y0, x1, y1, W) {
  const mx = (x0 + x1) / 2; const my = (y0 + y1) / 2;
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const len = Math.hypot(x1 - x0, y1 - y0);
  ctx.save();
  ctx.translate(mx, my); ctx.rotate(ang);
  ctx.strokeStyle = PLATE_COLORS.dust;
  ctx.lineWidth = 1.5;
  ctx.setLineDash?.([4, 3]);
  ctx.beginPath(); ctx.ellipse(0, 0, len / 2, W, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash?.([]);
  ctx.fillStyle = PLATE_COLORS.phosphor;
  ctx.beginPath(); ctx.arc(-len * 0.12, 0, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(len * 0.12, 0, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/** Draw a hub and its arms. `tilt` re-poses every vector (a molecule swung in a field). */
function drawStar(ctx, cx, cy, S, item, cfg, vecs, hits, opts = {}) {
  const plan = planDomains(item.arms);
  const base = Math.max(9, S * 0.2);
  const items = vecs.map((v, i) => ({ i, arm: item.arms[i], p: project(v, cfg, cx, cy, S) }));
  items.sort((a, b) => a.p.z - b.p.z);
  const hubP = project([0, 0, 0], cfg, cx, cy, S);
  let hubDone = false;
  const drawHubDisc = () => {
    atomDisc(ctx, hubP.x, hubP.y, base * 0.95, item.hub || RIG_MOLECULES[item.mol]?.hub || 'X');
    if (!opts.noHits) hits.push({ key: 'hub', x: hubP.x, y: hubP.y, r: base * 1.1 });
    hubDone = true;
  };
  for (const it of items) {
    if (!hubDone && it.p.z >= 0) drawHubDisc();
    const arm = it.arm;
    if (!arm) continue;
    const lit = item.measure && (item.measure.i === it.i || item.measure.j === it.i) || item.first === it.i;
    if (arm.kind === 'lone') {
      balloon(ctx, hubP.x, hubP.y, it.p.x, it.p.y, base * 0.55 * it.p.k);
      if (!opts.noHits) hits.push({ key: 'arm', i: it.i, x: (hubP.x + it.p.x) / 2, y: (hubP.y + it.p.y) / 2, r: base * 0.8 });
    } else {
      const n = arm.mult || 1;
      const ang = Math.atan2(it.p.y - hubP.y, it.p.x - hubP.x);
      const nx = -Math.sin(ang); const ny = Math.cos(ang);
      ctx.strokeStyle = lit ? PLATE_COLORS.amber : PLATE_COLORS.steel;
      ctx.lineWidth = 2;
      for (let k = 0; k < n; k++) {
        const off = (k - (n - 1) / 2) * 5;
        ctx.beginPath(); ctx.moveTo(hubP.x + nx * off, hubP.y + ny * off); ctx.lineTo(it.p.x + nx * off, it.p.y + ny * off); ctx.stroke();
      }
      const R = (arm.sym === 'H' ? base * 0.62 : BIG.has(arm.sym) ? base * 0.95 : base * 0.8) * it.p.k;
      atomDisc(ctx, it.p.x, it.p.y, R, arm.sym, lit);
      if (!opts.noHits) hits.push({ key: 'arm', i: it.i, x: it.p.x, y: it.p.y, r: R * 1.1 });
    }
  }
  if (!hubDone) drawHubDisc();
  return plan;
}

function drawHub(ctx, w, h, item, cfg) {
  const small = Math.max(8, Math.min(h * 0.045, w * 0.036));
  const hits = [];
  const pad = 10;
  plateText(ctx, item.label, pad, small * 1.7, { size: small * 1.5, color: PLATE_COLORS.dust, weight: 700 });
  plateText(ctx, `ARMS ${item.arms.length}`, w - pad, small * 1.5, { align: 'right', size: small * 1.1, color: PLATE_COLORS.phosphor, weight: 700 });
  const m = item.measure;
  const angle = m ? angleBetween(planDomains(item.arms), m.i, m.j) : null;
  plateText(ctx, angle != null ? `ANGLE ${angle}°` : 'ANGLE', w - pad, small * 2.9, {
    align: 'right', size: small * 1.1, color: angle != null ? PLATE_COLORS.amber : PLATE_COLORS.dim, weight: 700
  });

  const chips = chipsFor(item, cfg);
  const trayH = drawChips(ctx, w, h, small, chips, hits);
  const cy = (small * 3 + (h - trayH)) / 2 + small * 0.4;
  const S = Math.min(w * 0.36, (h - trayH - small * 4) * 0.4);
  drawStar(ctx, w / 2, cy, S, item, cfg, item.shown.length === item.arms.length ? item.shown : planDomains(item.arms).vectors.map(v => v.v), hits);
  return hits;
}

function drawField(ctx, w, h, item, cfg) {
  const small = Math.max(8, Math.min(h * 0.045, w * 0.036));
  const hits = [];
  const pad = 10;
  const mol = RIG_MOLECULES[item.mol];
  const dip = planDipole(item.mol);
  plateText(ctx, mol.label, pad, small * 1.7, { size: small * 1.6, color: PLATE_COLORS.dust, weight: 700 });
  plateText(ctx, cfg.arrows ? `NET ${dip.mag.toFixed(2)}` : 'NET', w - pad, small * 1.5, {
    align: 'right', size: small * 1.1, color: cfg.arrows ? PLATE_COLORS.amber : PLATE_COLORS.dim, weight: 700
  });
  const trayH = drawChips(ctx, w, h, small, chipsFor(item, cfg), hits);
  const top = small * 3; const bottom = h - trayH - 6;

  // The two plates, left and right, charged when the field is on.
  const on = cfg.field;
  for (const [x, sign] of [[w * 0.10, '+'], [w * 0.90, '−']]) {
    ctx.fillStyle = on ? '#2a2c1f' : '#16140f';
    ctx.fillRect(x - 6, top + 6, 12, bottom - top - 12);
    ctx.strokeStyle = on ? PLATE_COLORS.phosphor : PLATE_COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 5.5, top + 6.5, 11, bottom - top - 13);
    if (on) plateText(ctx, sign, x, (top + bottom) / 2 + small * 0.5, { align: 'center', size: small * 1.8, color: PLATE_COLORS.phosphor, weight: 800 });
  }

  // The molecule, swung toward the negative plate by `align` when its dipoles add.
  const cx = w / 2; const cy = (top + bottom) / 2;
  const S = Math.min(w * 0.22, (bottom - top) * 0.34);
  const plan = dip.plan;
  const net = dip.mag > 0.05 ? dip.net.map(c => c / dip.mag) : [1, 0, 0];
  // The negative end is drawn toward the positive plate, on the left.
  const swing = rotationBetween(net, [-1, 0, 0]);
  const shiver = item.shake ? Math.sin((item.shakeT || 0) * 40) * 0.05 : 0;
  const pose = plan.vectors.map(v => {
    const t = item.align;
    const turned = swing(v.v);
    const mixed = v.v.map((c, d) => c + (turned[d] - c) * t);
    return [mixed[0] + shiver, mixed[1], mixed[2]];
  });
  const view = { ...cfg, yaw: cfg.yaw * (1 - item.align * 0.7), pitch: cfg.pitch * (1 - item.align * 0.6) };
  const fake = { ...item, arms: mol.arms, hub: mol.hub, measure: null, first: null };
  drawStar(ctx, cx, cy, S, fake, view, pose, hits, { noHits: true });

  if (cfg.arrows) {
    // Each bond's arrow runs from the less to the more electronegative end; their sum is drawn bold.
    const hubP = project([0, 0, 0], view, cx, cy, S);
    let atomIdx = 0;
    plan.vectors.forEach((pv, idx) => {
      if (pv.kind !== 'atom') return;
      const a = dip.arrows[atomIdx++];
      const dir = pose[idx];
      const sign = a.d >= 0 ? 1 : -1;
      const p0 = project(dir.map(c => c * (sign > 0 ? 0.25 : 0.85)), view, cx, cy, S);
      const p1 = project(dir.map(c => c * (sign > 0 ? 0.85 : 0.25)), view, cx, cy, S);
      arrow(ctx, p0.x, p0.y, p1.x, p1.y, 1.6, PLATE_COLORS.dust);
    });
    if (dip.mag > 0.05) {
      const e = project([item.align > 0.5 ? -1.15 : net[0] * 1.15, item.align > 0.5 ? 0 : net[1] * 1.15, item.align > 0.5 ? 0 : net[2] * 1.15], view, cx, cy, S);
      arrow(ctx, hubP.x, hubP.y + S * 0.62, hubP.x + (e.x - hubP.x) * 0.9, hubP.y + S * 0.62 + (e.y - hubP.y) * 0.1, 3, PLATE_COLORS.amber);
    }
  }

  if (mol.arms.length === 1 && mol.arms[0].kind === 'atom') {
    const outerSym = mol.arms[0].sym;
    drawTugOfWar(ctx, cx - S * 1.1, bottom - S * 0.72, S * 2.2, S * 0.68, { symbol: mol.hub, en: EN[mol.hub] }, { symbol: outerSym, en: EN[outerSym] });
  }

  return hits;
}

function arrow(ctx, x0, y0, x1, y1, lw, color) {
  const ang = Math.atan2(y1 - y0, x1 - x0);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - Math.cos(ang - 0.4) * 8, y1 - Math.sin(ang - 0.4) * 8);
  ctx.lineTo(x1 - Math.cos(ang + 0.4) * 8, y1 - Math.sin(ang + 0.4) * 8);
  ctx.closePath(); ctx.fill();
}

function lobe(ctx, x, y, ang, len, wid, color, filled) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.strokeStyle = color; ctx.lineWidth = 1.6;
  ctx.fillStyle = filled ? 'rgba(111,143,63,0.18)' : 'rgba(0,0,0,0)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.25, -wid, len * 0.85, -wid, len, 0);
  ctx.bezierCurveTo(len * 0.85, wid, len * 0.25, wid, 0, 0);
  ctx.closePath();
  if (filled) ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawMixer(ctx, w, h, item, cfg) {
  const small = Math.max(8, Math.min(h * 0.045, w * 0.036));
  const hits = [];
  const pad = 10;
  plateText(ctx, item.label, pad, small * 1.7, { size: small * 1.5, color: PLATE_COLORS.dust, weight: 700 });
  const p = item.noMix ? null : cfg.mix;
  const plan = p ? planMix(p) : null;
  if (item.want != null) plateText(ctx, `ARMS NEEDED ${item.want}`, pad, small * 3.3, { size: small * 1.05, color: PLATE_COLORS.amber, weight: 700 });
  plateText(ctx, plan ? `LOBES ${plan.lobes}` : item.unpaired != null ? `UNPAIRED ${item.unpaired}` : 'LOBES', w - pad, small * 1.5, {
    align: 'right', size: small * 1.1, color: PLATE_COLORS.phosphor, weight: 700
  });
  plateText(ctx, plan ? `ORBITALS LEFT ${plan.leftoverP}` : item.bonds != null ? `BONDS ${item.bonds}` : 'ORBITALS LEFT', w - pad, small * 2.9, {
    align: 'right', size: small * 1.1, color: plan ? PLATE_COLORS.phosphor : PLATE_COLORS.dim, weight: 700
  });
  const trayH = drawChips(ctx, w, h, small, chipsFor(item, cfg), hits);
  const cx = w / 2; const cy = (small * 3 + (h - trayH)) / 2 + small;
  const L = Math.min(w * 0.30, (h - trayH - small * 4) * 0.46);

  atomDisc(ctx, cx, cy, L * 0.11, item.hub || 'C');
  if (!plan) {
    // Unmixed: the round s orbital and three p orbitals.
    ctx.strokeStyle = PLATE_COLORS.dust; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, L * 0.3, 0, Math.PI * 2); ctx.stroke();
    plateText(ctx, 's', cx + L * 0.3, cy - L * 0.3, { size: small, color: PLATE_COLORS.dim });
    [[0, 0], [Math.PI / 2, 0], [Math.PI / 4, 0]].forEach(([a], k) => {
      lobe(ctx, cx, cy, a, L * 0.8, L * 0.17, PLATE_COLORS.phosphor, false);
      lobe(ctx, cx, cy, a + Math.PI, L * 0.8, L * 0.17, PLATE_COLORS.phosphor, false);
      void k;
    });
    return hits;
  }
  // Mixed: `lobes` lobes along the arm directions, a small tail behind each, and the orbitals left over.
  const dirs = {
    2: [0, Math.PI],
    3: [-Math.PI / 2, -Math.PI / 2 + (2 * Math.PI) / 3, -Math.PI / 2 - (2 * Math.PI) / 3],
    4: [-Math.PI / 2 + 0.2, Math.PI / 2 + 0.55, Math.PI / 6 + 0.1, -Math.PI + 0.62]
  }[plan.lobes];
  dirs.forEach(a => {
    lobe(ctx, cx, cy, a, L * 0.78, L * 0.2, PLATE_COLORS.phosphor, true);
    lobe(ctx, cx, cy, a + Math.PI, L * 0.2, L * 0.07, PLATE_COLORS.dim, false);
  });
  // A p orbital left over stands at right angles to the plane the lobes lie in.
  for (let k = 0; k < plan.leftoverP; k++) {
    const a = Math.PI / 2 + (k ? 0.5 : 0);
    const stand = plan.lobes === 2 ? Math.PI / 2 : Math.PI / 2;
    lobe(ctx, cx, cy, stand + (k ? 0.4 : 0), L * 0.55, L * 0.12, PLATE_COLORS.amber, false);
    lobe(ctx, cx, cy, stand + Math.PI + (k ? 0.4 : 0), L * 0.55, L * 0.12, PLATE_COLORS.amber, false);
    void a;
  }
  return hits;
}

function drawTwist(ctx, w, h, item, cfg) {
  const small = Math.max(8, Math.min(h * 0.045, w * 0.036));
  const hits = [];
  const pad = 10;
  plateText(ctx, item.label, pad, small * 1.7, { size: small * 1.5, color: PLATE_COLORS.dust, weight: 700 });
  const plan = planTwist(item.bond);
  plateText(ctx, `TURN ${item.twistAngle}°`, w - pad, small * 1.5, { align: 'right', size: small * 1.1, color: PLATE_COLORS.phosphor, weight: 700 });
  const trayH = drawChips(ctx, w, h, small, chipsFor(item, cfg), hits);
  const cy = (small * 3 + (h - trayH)) / 2;
  const L = Math.min(w * 0.26, (h - trayH) * 0.34);
  const x0 = w / 2 - L * 0.55; const x1 = w / 2 + L * 0.55;
  const pegs = item.bond === 'single' ? 3 : 2;

  // The bond between the two centres: one line, and for a double bond the side-to-side pair above and below.
  atomDisc(ctx, x0, cy, L * 0.16, 'C');
  atomDisc(ctx, x1, cy, L * 0.16, 'C');
  ctx.strokeStyle = PLATE_COLORS.steel; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0 + L * 0.16, cy); ctx.lineTo(x1 - L * 0.16, cy); ctx.stroke();
  if (item.bond !== 'single') {
    const s = item.shake ? Math.sin((item.shakeT || 0) * 50) * 2 : 0;
    for (const sign of [-1, 1]) {
      ctx.strokeStyle = PLATE_COLORS.amber; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse((x0 + x1) / 2 + s, cy + sign * L * 0.2, L * 0.5, L * 0.07, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  // The pegs on each end: the left end is fixed, the right end turns.
  const turn = item.twistAngle * RAD;
  const peg = (x, k, rot, dir) => {
    const ang = rot + (k / pegs) * Math.PI * 2;
    const py = cy + Math.sin(ang) * L * 0.36;
    const px = x + dir * (L * 0.2 + Math.cos(ang) * L * 0.08);
    ctx.strokeStyle = PLATE_COLORS.steel; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(px, py); ctx.stroke();
    atomDisc(ctx, px, py, L * 0.09, 'H');
  };
  for (let k = 0; k < pegs; k++) { peg(x0, k, 0, -1); peg(x1, k, turn, 1); }
  void plan;
  return hits;
}
