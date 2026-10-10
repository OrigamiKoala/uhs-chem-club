/**
 * electronbench.js — The electron bench: the core bench's two Lanternfall extensions.
 *
 * Tallow's core bench shows one piece in three fields and strips light pieces off
 * it. Lanternfall asks two more questions of the same atom, and this bench is the
 * pair of heads that answer them. It is built on the plate bench (`plates.js`)
 * and borrows the core bench's look (rings of light pieces round a nucleus, a
 * needle's plain gauge), but it is its own class: the core bench's picture is
 * three fixed fields, and neither of these is one of them.
 *
 *   spectrum  FIRE HIGH-ENERGY LIGHT and every electron is knocked loose. Each
 *             lands on a strip graded in binding energy (MJ/mol, log scale) and
 *             the heights add up: one peak per row that holds electrons, its
 *             position the energy that row's electrons are held with, its height
 *             how many of them there are. A sealed specimen's peaks are all there
 *             is to read; the rows' names are not on it.
 *
 *   atom      the specimen drawn to scale (real atomic radius, shells in a
 *             Bohr's ratio of n squared), with a PULL METER: tap an electron and
 *             read the pull on it from Coulomb's law, the distance to it on a
 *             ruler, and the electrons that stand between it and the nucleus.
 *             `Ionize` strips the outermost electron and reports what it cost;
 *             `Add Electron` gives the atom one more.
 *
 * EVERY READING IS DERIVED. The peaks come from `electrons.planPES`; the pull is
 * `planPull(specimen, shell)` below, Coulomb's law over the declared nuclear
 * charge, the electrons in the shells below and the real radius; the energies a
 * strip costs are the measured ionization energies the specimen is declared with.
 * The bench knows no chemistry beyond the numbers it is handed.
 *
 * Aesthetic contract (CLAUDE.md §4, §8): phosphor on a recessed plate, nothing
 * blooms. A peak and an electron are told apart by position and size, never by
 * colour alone.
 */

import { PlateBench, PLATE_COLORS, plateText, raster, aperture } from './plates.js';
import { planPES, groundConfig, LADDER, zOf, symbolOf } from './electrons.js';

/* ------------------------------------------------------------------
   PURE PLANNERS
   ------------------------------------------------------------------ */

/** The peaks of a spectrum for specimen `sym`, from the real binding energies. */
export function spectrumOf(sym) { return planPES(sym) || []; }

/** Electrons per shell (n = 1, 2, 3 ...) for an element's ground state. */
export function shellsOf(sym) {
  const counts = groundConfig(zOf(sym));
  const byN = [];
  for (const row of LADDER) {
    const e = counts[row.id] || 0;
    if (e) byN[row.n - 1] = (byN[row.n - 1] || 0) + e;
  }
  return byN.map(n => n || 0);
}

/** The distance, in pm, an electron in shell `i` keeps from the nucleus: the real
 *  atomic radius at the outer shell, and Bohr's n-squared scaling inward. */
export function shellRadiusPm(item, i) {
  const n = item.shells.length;
  return item.radius * Math.pow((i + 1) / n, 2);
}

/**
 * The pull on an electron in shell `i`, from Coulomb's law in the form the
 * course uses it: the charge it feels (the nucleus less every electron in the
 * shells below it) over the square of its distance. Units are the bench's own,
 * set so a hydrogen-like outer electron at 100 pm reads one.
 */
export function planPull(item, i) {
  const Z = item.z;
  const between = item.shells.slice(0, i).reduce((a, b) => a + b, 0);
  const zeff = Z - between;
  const dist = shellRadiusPm(item, i);
  const pull = zeff * Math.pow(100 / dist, 2);
  return { z: Z, between, zeff, distPm: Math.round(dist), pull: Number(pull.toFixed(2)) };
}

/** Index of the outermost shell that still holds an electron. */
export function outerShell(item) {
  for (let i = item.shells.length - 1; i >= 0; i--) if (item.shells[i] > 0) return i;
  return 0;
}

/* ------------------------------------------------------------------
   DRAWING
   ------------------------------------------------------------------ */

const LOG_LO = Math.log10(0.3);
const LOG_HI = Math.log10(260);

function drawRings(ctx, cx, cy, R, item) {
  const n = item.shells.length;
  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.lineWidth = 1;
  item.shells.forEach((cnt, i) => {
    const r = R * (i + 1) / n;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    for (let k = 0; k < cnt; k++) {
      const a = (k / Math.max(cnt, 1)) * Math.PI * 2 + i * 0.5;
      ctx.fillStyle = PLATE_COLORS.dust;
      ctx.beginPath(); ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), Math.max(2, R * 0.07), 0, Math.PI * 2); ctx.fill();
    }
  });
  ctx.fillStyle = PLATE_COLORS.steel;
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(3, R * 0.1), 0, Math.PI * 2); ctx.fill();
}

function drawSpectrum(ctx, w, h, item, cfg, o) {
  const peaks = spectrumOf(item.sym);
  const small = Math.max(9, Math.min(h * 0.045, w * 0.04));
  const ringsW = item.showRings ? w * 0.3 : 0;
  const hits = [];

  // The specimen's own picture, when the stage gives it: rings, and its protons.
  if (item.showRings) {
    const R = Math.min(ringsW, h) * 0.38;
    const shells = shellsOf(item.sym);
    drawRings(ctx, ringsW / 2, h * 0.42, R, { shells });
    if (item.showProtons) plateText(ctx, `PROTONS ${zOf(item.sym)}`, ringsW / 2, h * 0.42 + R + small * 1.6, { align: 'center', size: small, color: PLATE_COLORS.dust, weight: 700 });
  }

  const x0 = ringsW + 14;
  const x1 = w - 12;
  const baseY = h * 0.8;
  const topY = h * 0.14;
  const xOf = e => x0 + ((Math.log10(e) - LOG_LO) / (LOG_HI - LOG_LO)) * (x1 - x0);
  const unit = (baseY - topY) / 6.5;

  // Axis: decades, labelled. Energy rises to the right.
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, baseY); ctx.lineTo(x1, baseY); ctx.stroke();
  for (const e of [0.3, 1, 3, 10, 30, 100]) {
    const x = xOf(e);
    ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, baseY + 5); ctx.stroke();
    plateText(ctx, String(e), x, baseY + 5 + small, { align: 'center', size: small * 0.85, color: PLATE_COLORS.dim });
  }
  plateText(ctx, `${cfg.labels?.energy || 'ENERGY TO REMOVE'} (MJ/mol, EACH TICK ABOUT TEN TIMES THE LAST)`.toUpperCase(), x1, h - 4, {
    align: 'right', size: small * 0.72, color: PLATE_COLORS.dim
  });
  plateText(ctx, 'ELECTRONS', x0, topY - 6, { size: small * 0.85, color: PLATE_COLORS.dim });
  for (let k = 1; k <= 6; k++) {
    const y = baseY - k * unit;
    ctx.globalAlpha = 0.18;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    ctx.globalAlpha = 1;
    plateText(ctx, String(k), x0 - 4, y + small * 0.3, { align: 'right', size: small * 0.8, color: PLATE_COLORS.dim });
  }

  if (!item.progress || item.progress <= 0) {
    plateText(ctx, 'NO LIGHT FIRED', (x0 + x1) / 2, (baseY + topY) / 2, { align: 'center', size: small * 1.2, color: PLATE_COLORS.dim });
    return hits;
  }

  const probed = o.probe && o.probe.plateId === item.id && o.probe.peak != null ? o.probe.peak : null;
  const shown = Math.ceil(peaks.length * Math.min(1, item.progress));
  const sorted = peaks.slice().sort((a, b) => a.energy - b.energy);
  sorted.slice(0, shown).forEach((p, i) => {
    const x = xOf(p.energy);
    const bw = Math.max(5, (x1 - x0) * 0.025);
    ctx.fillStyle = probed === i ? PLATE_COLORS.amber : PLATE_COLORS.phosphor;
    ctx.fillRect(x - bw / 2, baseY - p.height * unit, bw, p.height * unit);
    hits.push({ key: 'peak', index: i, peak: p, x0: x - bw * 1.5, y0: baseY - p.height * unit - 4, x1: x + bw * 1.5, y1: baseY });
    if (probed === i) {
      plateText(ctx, `${p.energy} MJ/mol, ${p.height}`, Math.min(x1, Math.max(x0 + 40, x)), baseY - p.height * unit - 8, {
        align: 'center', size: small, color: PLATE_COLORS.amber, weight: 700
      });
    }
  });
  return hits;
}

function drawAtom(ctx, w, h, item, cfg, o) {
  const small = Math.max(9, Math.min(h * 0.045, w * 0.04));
  const hits = [];
  const cx = w * 0.38;
  const cy = h * 0.5;
  const pxPerPm = (Math.min(w * 0.36, h * 0.44)) / (cfg.maxPm || 240);
  const n = item.shells.length;
  const outer = outerShell(item);

  // The rings, at their true distances; an empty ring is not drawn.
  const sel = o.probe && o.probe.plateId === item.id ? o.probe : null;
  item.shells.forEach((cnt, i) => {
    const r = shellRadiusPm(item, i) * pxPerPm;
    if (!cnt) return;
    ctx.strokeStyle = PLATE_COLORS.rim;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    for (let k = 0; k < cnt; k++) {
      const a = (k / cnt) * Math.PI * 2 + i * 0.7 - 0.6;
      const ex = cx + r * Math.cos(a);
      const ey = cy - r * Math.sin(a);
      const on = sel && sel.shell === i;
      ctx.fillStyle = on && k === 0 ? PLATE_COLORS.amber : PLATE_COLORS.dust;
      ctx.beginPath(); ctx.arc(ex, ey, Math.max(3.2, small * 0.55), 0, Math.PI * 2); ctx.fill();
      if (k === 0) hits.push({ key: 'electron', shell: i, x: ex, y: ey, r: Math.max(12, small * 1.3) });
    }
  });
  // The nucleus, with its charge.
  ctx.fillStyle = PLATE_COLORS.steel;
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(5, small * 0.8), 0, Math.PI * 2); ctx.fill();
  plateText(ctx, `+${item.z}`, cx, cy + small * 0.35, { align: 'center', size: small * 0.9, color: '#0d0c0a', weight: 700 });
  if (item.charge) {
    plateText(ctx, `${item.charge > 0 ? '+' : '-'}${Math.abs(item.charge) > 1 ? Math.abs(item.charge) : ''}`.trim() || (item.charge > 0 ? '+' : '-'), w * 0.38, small * 1.6, {
      align: 'center', size: small * 1.4, color: PLATE_COLORS.amber, weight: 700
    });
  }

  // The ruler, from the nucleus out to the selected electron.
  if (sel) {
    const rr = shellRadiusPm(item, sel.shell) * pxPerPm;
    ctx.strokeStyle = PLATE_COLORS.amber;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + rr * Math.cos(sel.angle ?? -0.6 + sel.shell * 0.7), cy - rr * Math.sin(sel.angle ?? -0.6 + sel.shell * 0.7)); ctx.stroke();
  }

  // The meter panel on the right: what is known about the selected electron.
  const px = w * 0.68;
  const pw = w - px - 8;
  ctx.fillStyle = '#16140f';
  ctx.fillRect(px, h * 0.1, pw, h * 0.8);
  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.strokeRect(px + 0.5, h * 0.1 + 0.5, pw - 1, h * 0.8 - 1);
  const L = { pull: 'PULL', core: 'CORE CHARGE', dist: 'DISTANCE', between: 'ELECTRONS BETWEEN', feel: 'CHARGE IT FEELS', ...(cfg.labels || {}) };
  plateText(ctx, item.label, px + 6, h * 0.1 + small * 1.5, { size: small, color: PLATE_COLORS.dim, weight: 700 });
  if (!sel) {
    plateText(ctx, 'TAP AN ELECTRON', px + 6, h * 0.1 + small * 3.6, { size: small * 0.95, color: PLATE_COLORS.dim });
  } else {
    const p = planPull(item, sel.shell);
    let y = h * 0.1 + small * 3.4;
    const row = (label, value, hot = false) => {
      plateText(ctx, label, px + 6, y, { size: small * 0.78, color: PLATE_COLORS.dim });
      plateText(ctx, value, px + pw - 6, y + small * 1.15, { align: 'right', size: small * 1.2, color: hot ? PLATE_COLORS.phosphor : PLATE_COLORS.dust, weight: 700 });
      y += small * 2.6;
    };
    row(L.pull, p.pull.toFixed(2), true);
    if (cfg.show?.core !== false) row(L.core, `+${p.z}`);
    row(L.dist, `${p.distPm} pm`);
    if (cfg.show?.between) row(L.between, String(p.between));
    if (cfg.show?.feel) row(L.feel, `+${p.zeff}`, true);
    // A gauge bar for the pull, on a log scale so a core electron and an outer one can share it.
    const gy = h * 0.9 - small * 2;
    ctx.fillStyle = '#0a0908';
    ctx.fillRect(px + 6, gy, pw - 12, 6);
    const fill = Math.max(0.02, Math.min(1, Math.log10(1 + p.pull) / Math.log10(260)));
    ctx.fillStyle = PLATE_COLORS.phosphor;
    ctx.fillRect(px + 6, gy, (pw - 12) * fill, 6);
  }
  void n; void outer;
  return hits;
}

/* ------------------------------------------------------------------
   THE BENCH
   ------------------------------------------------------------------ */

export class ElectronBench extends PlateBench {
  /** @param {{onProbe?: Function, onSelect?: Function}} opts */
  constructor(host, opts = {}) {
    super(host, opts);
    this.cfg = { maxPm: 240, labels: {}, show: {} };
    this.clock = 0;
  }

  prepare(item) {
    const it = { ...item, progress: item.progress ?? 0 };
    if (item.head === 'atom') {
      it.shells = (item.shells || shellsOf(item.sym)).slice();
      it.z = item.z ?? zOf(item.sym);
      it.charge = item.charge ?? 0;
      it.strips = 0;
      it.start = { shells: it.shells.slice(), radius: it.radius, charge: it.charge };
    }
    return it;
  }

  apertureClass(item) { return item.head === 'atom' ? 'electron-aperture electron-atom' : 'electron-aperture'; }
  gridClass() { return 'electron-grid'; }

  setPlates(items, cfg = {}) {
    this.cfg = { maxPm: 240, labels: {}, show: {}, ...cfg };
    super.setPlates(items);
  }

  /* ---- tools ---- */

  /** Fire high-energy light at every spectrum plate: the peaks fill in, lowest energy first. */
  fire() {
    for (const item of this.items) if (item.head === 'spectrum') item.progress = 0.0001;
    this.fireAnim = true;
    this.startAnim();
  }

  hasFired(id) { return (this.itemFor(id)?.progress || 0) >= 1; }

  /** Strip the outermost electron off an atom and report what it cost. */
  ionize(id) {
    const item = this.itemFor(id);
    if (!item || item.head !== 'atom') return null;
    const i = outerShell(item);
    if (item.shells.reduce((a, b) => a + b, 0) <= 0) return { refused: 'Nothing is left to strip.' };
    const energy = item.successive ? item.successive[item.strips] : item.ie;
    item.shells[i] -= 1;
    item.charge += 1;
    const declared = item.stripRadii?.[item.strips];
    const wasEmpty = item.shells[i] === 0;
    if (declared) item.radius = declared;
    else if (wasEmpty && i > 0) item.radius = item.radius * Math.pow(i / (i + 1), 2);
    item.strips += 1;
    // A shell that has emptied leaves the ring count one shorter, so the rings
    // that remain are drawn out to the true radius.
    if (wasEmpty) item.shells.length = outerShell(item) + 1;
    this.probe = null;
    this.drawAll();
    return { energy: energy ?? null, charge: item.charge };
  }

  /** Give the atom one more electron, in its outermost shell. */
  addElectron(id) {
    const item = this.itemFor(id);
    if (!item || item.head !== 'atom') return null;
    const i = outerShell(item);
    item.shells[i] += 1;
    item.charge -= 1;
    if (item.addRadius) item.radius = item.addRadius;
    this.probe = null;
    this.drawAll();
    return { charge: item.charge };
  }

  reset(id = null) {
    for (const item of this.items) {
      if (id && item.id !== id) continue;
      if (item.head === 'atom') {
        item.shells = item.start.shells.slice();
        item.radius = item.start.radius;
        item.charge = item.start.charge;
        item.strips = 0;
      } else item.progress = 0;
    }
    this.probe = null;
    this.drawAll();
  }

  atomOf(id) {
    const item = this.itemFor(id);
    return item ? { shells: item.shells.slice(), charge: item.charge, radius: item.radius, z: item.z, strips: item.strips } : null;
  }

  /* ---- reading ---- */

  press(item, hit) {
    if (!hit) return null;
    if (hit.key === 'peak') {
      return { mark: { peak: hit.index }, read: { kind: 'peak', rig: item, energy: hit.peak.energy, height: hit.peak.height, row: hit.peak.row } };
    }
    if (hit.key === 'electron') {
      const p = planPull(item, hit.shell);
      return { mark: { shell: hit.shell }, read: { kind: 'electron', rig: item, shell: hit.shell, ...p } };
    }
    return null;
  }

  draw(ctx, w, h, item, o) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PLATE_COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    const hits = item.head === 'atom' ? drawAtom(ctx, w, h, item, this.cfg, o) : drawSpectrum(ctx, w, h, item, this.cfg, o);
    raster(ctx, w, h, o.sweep, 0, h);
    aperture(ctx, w, h);
    return hits;
  }

  tick(dt) {
    this.clock += dt;
    let live = false;
    for (const item of this.items) {
      if (item.head === 'spectrum' && item.progress > 0 && item.progress < 1) {
        item.progress = Math.min(1, item.progress + dt * 0.9);
        live = true;
      }
    }
    return live;
  }
}

export { symbolOf };
