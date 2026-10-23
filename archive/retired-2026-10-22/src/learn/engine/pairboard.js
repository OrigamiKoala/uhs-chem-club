/**
 * pairboard.js — The pair board, Ligar's instrument for where every valence
 * electron of a molecule goes.
 *
 * A slate with a molecule's atoms laid out on it as symbols, and a tray holding
 * exactly the electrons the molecule has. Pairs are placed TWO-TAP, NEVER BY
 * DRAG: pick what the next tap places (a shared pair, a lone pair, a single
 * electron, or lift one out), then tap the slot between two atoms or an atom.
 * Several pairs on one slot make a double or triple bond.
 *
 * THE BOARD READS AND NEVER LECTURES. Each atom carries an OCTET LAMP: lit when
 * eight electrons stand round it (two, for hydrogen), amber for boron at six, a
 * stencilled "+" when it holds more than eight on an atom that has room, and a
 * stencilled "!" when it holds more than it can. The tray count is on the plate
 * all the time. The one rule the board enforces is that a hydrogen or a fluorine
 * atom shares one pair and no more.
 *
 * Two readings can be asked for, never volunteered: the CHARGE tool stencils the
 * formal charge of each atom, and the GAUGE reads the measured length of a bond.
 * The gauge reads the real molecule, not the drawing: a bond that is not drawn
 * has no length to read.
 *
 * EVERY READING IS DERIVED from `lewis.planLewis`, which the quests and
 * `verify:learn` call too, so the picture and the grading cannot disagree.
 */

import { PlateBench, PLATE_COLORS, plateText, raster, aperture } from './plates.js';
import {
  MOLECULES, linkKey, planLewis, trayFor, blankDrawing, addBond, addLone, addDot, removeOne,
  drawingKey, gaugeLength, VALENCE
} from './lewis.js';

const LAMP = { off: '#2a2620', full: PLATE_COLORS.phosphor, amber: PLATE_COLORS.amber, danger: '#b8382c' };

const HAND_LABEL = { bond: 'BOND', lone: 'LONE PAIR', dot: 'SINGLE', x: 'LIFT OUT', gauge: 'GAUGE' };

const copy = p => ({ bonds: { ...p.bonds }, lone: { ...p.lone }, dots: { ...p.dots } });

export class PairBoard extends PlateBench {
  /** @param {{onProbe?: Function, onSelect?: Function}} opts */
  constructor(host, opts = {}) {
    super(host, opts);
    this.cfg = { hand: null, hands: ['bond', 'lone', 'x'], charges: false, labels: null };
  }

  prepare(item) {
    const mol = MOLECULES[item.mol];
    return {
      ...item,
      placed: item.prefill ? copy(item.prefill) : blankDrawing(),
      charge: item.charge ?? mol.charge,
      recorded: []
    };
  }

  apertureClass() { return 'pair-aperture'; }
  gridClass() { return 'pair-grid'; }

  setPlates(items, cfg = {}) {
    this.cfg = { hand: null, hands: ['bond', 'lone', 'x'], charges: false, labels: null, ...cfg };
    super.setPlates(items);
  }

  /* ---- state ---- */

  placedOf(id) { return copy(this.itemFor(id)?.placed || blankDrawing()); }
  readOf(id) {
    const it = this.itemFor(id);
    return it ? planLewis(it.mol, it.placed, it.charge) : null;
  }
  chargeOf(id) { return this.itemFor(id)?.charge ?? 0; }
  recordedOf(id) { return (this.itemFor(id)?.recorded || []).map(copy); }

  setHand(hand) { this.cfg.hand = hand; this.drawAll(); }
  setCharges(on) { this.cfg.charges = Boolean(on); this.drawAll(); }

  /** Set the molecule's overall charge. The tray changes with it; the drawing does not. */
  setCharge(id, q) {
    const it = this.itemFor(id);
    if (!it || it.locked) return;
    it.charge = q;
    this.drawAll();
  }

  /** Back to what the stage handed over. */
  clear(id = null) {
    for (const item of this.items) {
      if (id && item.id !== id) continue;
      item.placed = item.prefill ? copy(item.prefill) : blankDrawing();
    }
    this.drawAll();
  }

  /** File the drawing on a plate as one the player has finished. Returns what happened. */
  record(id) {
    const it = this.itemFor(id);
    if (!it) return { action: 'refused', reason: 'There is no drawing there to file.' };
    const key = drawingKey(it.mol, it.placed);
    const already = it.recorded.some(p => drawingKey(it.mol, p) === key);
    if (already) return { action: 'refused', reason: 'That drawing is already filed.' };
    it.recorded.push(copy(it.placed));
    return { action: 'filed', count: it.recorded.length };
  }

  /** One tap with the hand held. Returns what happened. */
  act(item, hit) {
    const hand = this.cfg.hand;
    if (!hand) return { action: 'refused', reason: 'Pick what to place from the tray first.' };
    if (item.locked) return { action: 'refused', reason: 'This drawing is fixed on this stage.' };
    const mol = MOLECULES[item.mol];
    const read = planLewis(mol, item.placed, item.charge);

    if (hand === 'x') {
      const r = removeOne(mol, item.placed, hit.key === 'link' ? { kind: 'link', a: hit.a, b: hit.b } : { kind: 'atom', i: hit.i });
      if (r.refused) return { action: 'refused', reason: r.refused };
      item.placed = r.placed;
      return { action: 'removed' };
    }
    if (hand === 'bond') {
      if (hit.key !== 'link') return { action: 'refused', reason: 'A shared pair goes in the slot between two atoms.' };
      if (read.left < 2) return { action: 'refused', reason: 'The tray has no pair left.' };
      const r = addBond(mol, item.placed, hit.a, hit.b);
      if (r.refused) return { action: 'refused', reason: r.refused };
      item.placed = r.placed;
      return { action: 'placed', what: 'bond' };
    }
    if (hand === 'lone') {
      if (hit.key !== 'atom') return { action: 'refused', reason: 'A lone pair goes on one atom.' };
      if (read.left < 2) return { action: 'refused', reason: 'The tray has no pair left.' };
      item.placed = addLone(item.placed, hit.i).placed;
      return { action: 'placed', what: 'lone' };
    }
    if (hand === 'dot') {
      if (hit.key !== 'atom') return { action: 'refused', reason: 'A single electron goes on one atom.' };
      if (read.left < 1) return { action: 'refused', reason: 'The tray has no electron left.' };
      item.placed = addDot(item.placed, hit.i).placed;
      return { action: 'placed', what: 'dot' };
    }
    return { action: 'refused', reason: 'That tool does not place anything.' };
  }

  press(item, hit) {
    if (!hit) return null;
    if (hit.key === 'hand') {
      this.cfg.hand = hit.hand;
      return { mark: {}, read: { kind: 'hand', hand: hit.hand } };
    }
    if (hit.key !== 'link' && hit.key !== 'atom') return null;

    if (this.cfg.hand === 'gauge') {
      if (hit.key !== 'link') return { mark: {}, read: { kind: 'gauge', plateId: item.id, length: null, none: 'The gauge reads a bond. Tap the slot between two atoms.' } };
      const len = gaugeLength(item.mol, item.placed, linkKey(hit.a, hit.b));
      return {
        mark: {},
        read: {
          kind: 'gauge', plateId: item.id, link: linkKey(hit.a, hit.b), length: len,
          none: len == null ? 'There is no bond drawn there to measure.' : null
        }
      };
    }
    const res = this.act(item, hit);
    return { mark: {}, read: { kind: 'board', plateId: item.id, ...res, placed: copy(item.placed), reading: planLewis(item.mol, item.placed, item.charge) } };
  }

  draw(ctx, w, h, item, o) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PLATE_COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    const hits = drawSlate(ctx, w, h, item, this.cfg);
    raster(ctx, w, h, o.sweep, 0, h);
    aperture(ctx, w, h);
    return hits;
  }

  tick() { return false; }
}

/* ------------------------------------------------------------------
   THE SLATE
   ------------------------------------------------------------------ */

function lamp(ctx, x, y, r, state) {
  ctx.fillStyle = state === 'full' ? LAMP.full : state === 'amber' || state === 'expanded' ? LAMP.amber : state === 'over' ? LAMP.danger : LAMP.off;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  if (state === 'expanded' || state === 'over') {
    plateText(ctx, state === 'over' ? '!' : '+', x, y + r * 0.45, { align: 'center', size: r * 1.7, color: '#0d0c0a', weight: 800 });
  }
}

function drawSlate(ctx, w, h, item, cfg) {
  const mol = MOLECULES[item.mol];
  const read = planLewis(mol, item.placed, item.charge);
  const small = Math.max(8, Math.min(h * 0.045, w * 0.036));
  const hits = [];
  const pad = 10;

  // ---- the reading, always on the plate ----
  plateText(ctx, mol.label, pad, small * 1.7, { size: small * 1.8, color: PLATE_COLORS.dust, weight: 700 });
  const q = item.charge;
  if (q) plateText(ctx, `CHARGE ${q > 0 ? '+' : '−'}${Math.abs(q)}`, pad, small * 3.3, { size: small * 0.95, color: PLATE_COLORS.amber, weight: 700 });
  plateText(ctx, `TRAY ${read.left} OF ${read.total}`, w - pad, small * 1.5, {
    align: 'right', size: small * 1.1, color: read.left === 0 ? PLATE_COLORS.dim : PLATE_COLORS.phosphor, weight: 700
  });
  // Where the tray came from: what each atom brings, less a positive charge or plus a negative one.
  const sources = mol.syms.map(sym => `${sym} ${VALENCE[sym]}`).join(' + ') + (q ? ` ${q > 0 ? '−' : '+'} ${Math.abs(q)}` : '');
  plateText(ctx, sources, w - pad, small * 2.9, { align: 'right', size: small * 0.82, color: PLATE_COLORS.dim });

  // ---- the slate ----
  const trayH = small * 3.4;
  const top = small * 4.4;
  const bottom = h - trayH - 8;
  const sw = w - pad * 2 - 40;
  const sh = bottom - top - 24;
  const ax = i => w / 2 + (mol.pos[i][0] - 0.5) * sw;
  const ay = i => (top + bottom) / 2 + (mol.pos[i][1] - 0.5) * sh;
  const R = Math.max(10, Math.min(sw, sh) * (mol.syms.length > 5 ? 0.09 : 0.115));

  // Slots first, so atoms sit on top of them.
  for (const [a, b] of mol.links) {
    const x0 = ax(a); const y0 = ay(a); const x1 = ax(b); const y1 = ay(b);
    const mx = (x0 + x1) / 2; const my = (y0 + y1) / 2;
    const n = item.placed.bonds[linkKey(a, b)] || 0;
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const nx = -Math.sin(ang); const ny = Math.cos(ang);
    ctx.strokeStyle = n ? PLATE_COLORS.phosphor : PLATE_COLORS.rim;
    ctx.lineWidth = n ? 2.5 : 1;
    if (!n) ctx.setLineDash?.([3, 4]);
    const lines = Math.max(1, n);
    for (let k = 0; k < lines; k++) {
      const off = (k - (lines - 1) / 2) * 6;
      ctx.beginPath();
      ctx.moveTo(x0 + nx * off, y0 + ny * off); ctx.lineTo(x1 + nx * off, y1 + ny * off);
      ctx.stroke();
    }
    ctx.setLineDash?.([]);
    if (cfg.charges && n > 0) {
      ctx.strokeStyle = PLATE_COLORS.amber;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx - nx * (lines * 4 + 4), my - ny * (lines * 4 + 4));
      ctx.lineTo(mx + nx * (lines * 4 + 4), my + ny * (lines * 4 + 4));
      ctx.stroke();
    }
    const hr = Math.max(R * 0.7, 12);
    hits.push({ key: 'link', a, b, x: mx, y: my, r: hr });
  }

  mol.syms.forEach((sym, i) => {
    const x = ax(i); const y = ay(i);
    const at = read.atoms[i];
    ctx.fillStyle = '#16140f';
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PLATE_COLORS.steel;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke();
    plateText(ctx, sym, x, y + R * 0.34, { align: 'center', size: R * 1.05, color: PLATE_COLORS.dust, weight: 700 });
    lamp(ctx, x + R * 0.82, y - R * 0.82, Math.max(4, R * 0.26), at.lamp === 'short' ? 'off' : at.lamp);
    // A dark lamp says how far it is from lit.
    if (at.lamp === 'short') {
      const need = (sym === 'H' ? 2 : 8) - at.around;
      plateText(ctx, `needs ${need}`, x + R * 0.82, y - R * 0.82 + Math.max(4, R * 0.26) + small * 0.9, {
        align: 'center', size: Math.max(7, small * 0.7), color: PLATE_COLORS.dim
      });
    }

    // Lone pairs and single electrons sit round the atom, away from its bonds.
    let bx = 0; let by = 0;
    for (const [a, b] of mol.links) {
      if (a !== i && b !== i) continue;
      const o = a === i ? b : a;
      if (item.placed.bonds[linkKey(a, b)]) { bx += ax(o) - x; by += ay(o) - y; }
    }
    const base = Math.atan2(-by, -bx) || -Math.PI / 2;
    const slots = at.lone + at.dots;
    for (let k = 0; k < slots; k++) {
      const ang = base + (k - (slots - 1) / 2) * (slots > 3 ? 0.9 : 1.15) + (bx || by ? 0 : k * 0.3);
      const isDot = k >= at.lone;
      const cx = x + Math.cos(ang) * (R + 8); const cy = y + Math.sin(ang) * (R + 8);
      ctx.fillStyle = PLATE_COLORS.phosphor;
      if (isDot) {
        ctx.beginPath(); ctx.arc(cx, cy, 2.6, 0, Math.PI * 2); ctx.fill();
      } else {
        const tx = -Math.sin(ang) * 3.4; const ty = Math.cos(ang) * 3.4;
        ctx.beginPath(); ctx.arc(cx + tx, cy + ty, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx - tx, cy - ty, 2.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (cfg.charges) {
      const fc = at.fc;
      const brought = VALENCE[sym] || 0;
      const owns = 2 * at.lone + at.dots + at.shared;
      ctx.strokeStyle = fc !== 0 ? PLATE_COLORS.amber : PLATE_COLORS.phosphor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash?.([3, 2]);
      ctx.beginPath();
      ctx.arc(x, y, R + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash?.([]);

      plateText(ctx, fc === 0 ? '0' : `${fc > 0 ? '+' : '−'}${Math.abs(fc)}`, x - R * 0.9, y - R * 0.9, {
        align: 'center', size: small * 1.15, color: fc === 0 ? PLATE_COLORS.dim : PLATE_COLORS.amber, weight: 700
      });
      plateText(ctx, `B:${brought} O:${owns}`, x, y + R + small * 1.3, {
        align: 'center', size: Math.max(7, small * 0.75), color: PLATE_COLORS.dim, weight: 700
      });
    }
    hits.push({ key: 'atom', i, x, y, r: R });
  });

  // ---- the tray: pick what the next tap places ----
  const hands = cfg.hands || ['bond', 'lone', 'x'];
  const cw = (w - pad * 2 - 6 * (hands.length - 1)) / hands.length;
  hands.forEach((hnd, k) => {
    const x = pad + k * (cw + 6);
    const y = h - trayH + 2;
    const on = cfg.hand === hnd;
    ctx.fillStyle = on ? '#2a2c1f' : '#16140f';
    ctx.fillRect(x, y, cw, trayH - 6);
    ctx.strokeStyle = on ? PLATE_COLORS.phosphor : PLATE_COLORS.rim;
    ctx.lineWidth = on ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, trayH - 7);
    plateText(ctx, (cfg.labels && cfg.labels[hnd]) || HAND_LABEL[hnd], x + cw / 2, y + (trayH - 6) / 2 + small * 0.4, {
      align: 'center', size: small * 1.05, color: on ? PLATE_COLORS.phosphor : PLATE_COLORS.dust, weight: 700
    });
    hits.push({ key: 'hand', hand: hnd, x0: x, y0: y, x1: x + cw, y1: y + trayH - 6 });
  });
  return hits;
}
