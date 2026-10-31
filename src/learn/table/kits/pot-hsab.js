/**
 * kits/pot-hsab.js — The instruments and pieces of Kettle's q9-hsab (Hard Soft Acid Base Theory).
 *
 * Registered on the pot kit (`pot-registry.js`).
 *
 * THE FIRMNESS PROBE (fixture `hsabprobe`):
 *   A socket for an ion puck, a "Test" key, and a live display of the ion's electron cloud
 *   under an electric field:
 *     - Hard ions: small, compact, rigid circular cloud (low polarizability).
 *     - Soft ions: large, diffuse cloud that deforms/squishes into an ellipse (high polarizability).
 *
 * THE REACTION WELLS (fixture `hsabwells`):
 *   Two reaction chambers with a "Mix" key.
 *   Shows whether a solid precipitate forms (cloudy liquid, settled solid) or stays dissolved (clear).
 *
 * THE BOND VIEWER (fixture `hsabbond`):
 *   Displays particle diagrams of hard-hard ionic attraction vs soft-soft covalent cloud overlap,
 *   with sockets for explanation chips.
 *
 * Tour steps registered via `addTourText`.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { addTourText } from '../tour.js';
import { registerFixture, registerPiece } from './pot-registry.js';
import { frameOf, topOf, say, slab } from './pot-draw.js';
import { seatedIn, dialAt } from './pot-read.js';
import { contentTop } from './heat-draw.js';
import { probeIon, pairOutcome, HSAB_DATA, PRECIPITATE_COLORS } from '../../engine/reactdata-hsab.js';
import { IONS, pretty } from '../../engine/reactdata.js';

const AMBER = PLATE_COLORS.amber;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;

/* ------------------------------------------------------------------
   READINGS
   ------------------------------------------------------------------ */

/** What the firmness probe reads: the seated ion, and whether "Test" was run. */
export function probeRead(state, fid) {
  const table = state.table || state;
  const fixtures = table.fixtures || {};
  const f = Array.isArray(fixtures) ? fixtures.find(x => x.id === fid) : fixtures[fid];
  const slotId = f?.props?.slot || `${fid}.in`;
  const piece = seatedIn(table, slotId);
  const ionId = piece?.props?.ion || null;
  const sig = `${fid}|${ionId || ''}`;
  const rows = table.recorder?.rows || state.recorder?.rows || [];
  const ran = Boolean(ionId) && rows.some(r => r.label === sig);
  const data = ionId ? probeIon(ionId) : null;
  return { f, piece, ionId, ran, data, sig };
}

/** What the reaction wells read. */
export function wellsRead(state, fid) {
  const table = state.table || state;
  const fixtures = table.fixtures || {};
  const f = Array.isArray(fixtures) ? fixtures.find(x => x.id === fid) : fixtures[fid];
  const p = f?.props || {};
  let reagent = p.reagent || null;
  if (f?.dials?.reagent) {
    const v = dialAt(table, fid, 'reagent');
    reagent = v === 2 ? 'I' : 'F';
  }
  const cat1 = p.cat1 || null;
  const cat2 = p.cat2 || null;
  const sig = `${fid}|${cat1 || ''}|${cat2 || ''}|${reagent || ''}`;
  const rows = table.recorder?.rows || state.recorder?.rows || [];
  const ran = Boolean(reagent) && (p.autoRun || rows.some(r => r.label === sig));
  return { f, cat1, cat2, reagent, ran, sig };
}

/* ------------------------------------------------------------------
   PROBE FIXTURE
   ------------------------------------------------------------------ */

export function probeFixture(id, at, { w = 50, h = 30 } = {}) {
  const slot = { id: `${id}.in`, label: ' ', at: { x: at.x - 14, y: at.y + 1 }, r: 7.5 };
  return {
    fixture: {
      id,
      kind: 'hsabprobe',
      label: 'Firmness Probe',
      at: { ...at },
      size: { w, h },
      runLabel: 'Test',
      dials: {},
      props: { backdrop: true, slot: slot.id }
    },
    slots: [slot],
    size: { w, h }
  };
}

function runProbe(state, fid) {
  const r = probeRead(state, fid);
  if (!r.ionId) return { noop: 'Put an ion disc into the socket first.' };
  return { x: r.data?.polarizability || 0, y: r.data?.deformation || 0, label: r.sig };
}

function paintProbe(ctx, f, state, b) {
  const F = frameOf(b);
  const r = probeRead(state, f.id);
  const sc = b.sc;

  // Title
  say(ctx, 'FIRMNESS PROBE', F.x(2.0), F.y(2.2), F.size(2.0, 6.4), { weight: 700, color: DUST });

  // Display area on right
  const dx = F.x(19);
  const dy = F.y(6);
  const dw = 29 * sc;
  const dh = 18 * sc;
  ctx.fillStyle = '#14120e';
  ctx.fillRect(dx, dy, dw, dh);
  ctx.strokeStyle = '#2d2822';
  ctx.lineWidth = 1;
  ctx.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);

  if (!r.ionId) {
    say(ctx, 'Insert ion disc in socket', dx + dw / 2, dy + dh / 2, F.size(1.8, 5.6), { align: 'center', color: DIM });
    return;
  }

  // Field indicator plates (+ on left, - on right)
  const cx = dx + dw / 2;
  const cy = dy + dh / 2 - 1.5 * sc;
  ctx.fillStyle = '#4a7fb0';
  ctx.fillRect(dx + 2 * sc, dy + 2 * sc, 1.8 * sc, dh - 4 * sc);
  say(ctx, '+', dx + 2.9 * sc, dy + dh / 2, F.size(2.2, 7.0), { align: 'center', color: '#15130f', weight: 700 });

  ctx.fillStyle = '#b05a4a';
  ctx.fillRect(dx + dw - 3.8 * sc, dy + 2 * sc, 1.8 * sc, dh - 4 * sc);
  say(ctx, '−', dx + dw - 2.9 * sc, dy + dh / 2, F.size(2.2, 7.0), { align: 'center', color: '#15130f', weight: 700 });

  const ion = IONS[r.ionId];
  const sym = ion ? pretty(ion.f) : r.ionId;
  const isHardIon = r.data?.hard;

  if (!r.ran) {
    // Unpolarized round cloud
    ctx.beginPath();
    ctx.arc(cx, cy, 5.5 * sc, 0, Math.PI * 2);
    ctx.fillStyle = isHardIon ? '#5a7860' : '#8a6880';
    ctx.globalAlpha = 0.45;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = DUST;
    ctx.stroke();

    say(ctx, sym, cx, cy, F.size(2.2, 6.8), { align: 'center', weight: 700, color: '#f0ece1' });
    say(ctx, 'Press "Test" to apply electric field', cx, dy + dh - 2.5 * sc, F.size(1.6, 5.2), { align: 'center', color: AMBER });
    return;
  }

  // Tested state
  const deform = r.data.deformation; // 0.08 hard, 0.65 soft
  const rx = (5.5 + deform * 3.5) * sc;
  const ry = (5.5 - deform * 1.8) * sc;

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = isHardIon ? '#4f8060' : '#a85080';
  ctx.globalAlpha = 0.55;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = isHardIon ? '#78a142' : AMBER;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.lineWidth = 1;

  say(ctx, sym, cx, cy, F.size(2.2, 6.8), { align: 'center', weight: 700, color: '#ffffff' });

  const desc = isHardIon ? 'Rigid cloud · Low polarizability' : 'Squishy cloud · High polarizability';
  const tagColor = isHardIon ? '#78a142' : AMBER;
  say(ctx, desc, cx, dy + dh - 2.8 * sc, F.size(1.7, 5.4), { align: 'center', weight: 700, color: tagColor });
}

registerFixture('hsabprobe', { paint: paintProbe, run: runProbe });

/* ------------------------------------------------------------------
   WELLS FIXTURE
   ------------------------------------------------------------------ */

export function wellsFixture(id, at, { w = 56, h = 30, cat1 = null, cat2 = null, reagent = null, label = 'Reaction Wells', dials = {}, runLabel = 'Mix', autoRun = false } = {}) {
  return {
    fixture: {
      id,
      kind: 'hsabwells',
      label,
      at: { ...at },
      size: { w, h },
      runLabel,
      dials,
      props: { cat1, cat2, reagent, autoRun }
    },
    slots: [],
    size: { w, h }
  };
}

function runWells(state, fid) {
  const r = wellsRead(state, fid);
  return { x: 0, y: 0, label: r.sig };
}

function drawWell(ctx, F, x, y, w, h, title, cat, an, ran, sc) {
  ctx.fillStyle = '#14120e';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#2d2822';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  say(ctx, title, x + w / 2, y + 2.4 * sc, F.size(1.8, 5.6), { align: 'center', weight: 700, color: DUST });

  if (!cat || !an) {
    say(ctx, 'Empty well', x + w / 2, y + h / 2, F.size(1.7, 5.2), { align: 'center', color: DIM });
    return;
  }

  const out = pairOutcome(cat, an);

  if (!ran) {
    say(ctx, `${pretty(cat)} + ${pretty(an)}`, x + w / 2, y + h / 2 - 1.5 * sc, F.size(1.9, 5.8), { align: 'center', color: '#dcd6cc' });
    say(ctx, 'Ready to mix', x + w / 2, y + h - 2.5 * sc, F.size(1.6, 5.0), { align: 'center', color: AMBER });
    return;
  }

  // Outcome
  const ly = y + 5 * sc;
  const lh = h - 10 * sc;
  if (out.precipitates) {
    // Cloudy liquid
    ctx.fillStyle = out.ink || '#e6e2da';
    ctx.globalAlpha = 0.35;
    ctx.fillRect(x + 2 * sc, ly, w - 4 * sc, lh);
    // Settled solid at bottom
    ctx.globalAlpha = 0.9;
    ctx.fillRect(x + 2 * sc, y + h - 6 * sc, w - 4 * sc, 4.5 * sc);
    ctx.globalAlpha = 1;

    say(ctx, `${out.formula}(s) solid`, x + w / 2, y + h / 2 - 1 * sc, F.size(1.9, 5.8), { align: 'center', weight: 700, color: '#ffffff' });
    say(ctx, `${out.color || 'Solid'} precipitate`, x + w / 2, y + h - 2.2 * sc, F.size(1.6, 5.0), { align: 'center', weight: 700, color: AMBER });
  } else {
    // Clear solution
    ctx.fillStyle = '#4a7fb0';
    ctx.globalAlpha = 0.2;
    ctx.fillRect(x + 2 * sc, ly, w - 4 * sc, lh);
    ctx.globalAlpha = 1;

    say(ctx, 'No precipitate', x + w / 2, y + h / 2 - 1 * sc, F.size(1.9, 5.8), { align: 'center', color: '#9bb8cc' });
    say(ctx, 'Stays in water (aq)', x + w / 2, y + h - 2.2 * sc, F.size(1.6, 5.0), { align: 'center', color: DUST });
  }
}

function paintWells(ctx, f, state, b) {
  const F = frameOf(b);
  const r = wellsRead(state, f.id);
  const sc = b.sc;

  say(ctx, f.label.toUpperCase(), F.x(2.0), F.y(2.2), F.size(2.0, 6.4), { weight: 700, color: DUST });

  const cat1 = r.cat1 || f.props?.cat1 || null;
  const cat2 = r.cat2 || f.props?.cat2 || null;
  const an = r.reagent || f.props?.reagent || null;

  const ww = 24 * sc;
  const wh = 18 * sc;
  drawWell(ctx, F, F.x(3.5), F.y(6), ww, wh, cat1 ? `${pretty(cat1)} Well` : 'Well 1', cat1, an, r.ran, sc);
  drawWell(ctx, F, F.x(29.5), F.y(6), ww, wh, cat2 ? `${pretty(cat2)} Well` : 'Well 2', cat2, an, r.ran, sc);
}

registerFixture('hsabwells', { paint: paintWells, run: runWells });

/* ------------------------------------------------------------------
   BOND MECHANISM VIEWER FIXTURE
   ------------------------------------------------------------------ */

export function bondViewerFixture(id, at, { w = 72, h = 30 } = {}) {
  const s1 = { id: `${id}.1`, label: ' ', at: { x: at.x - 18, y: at.y + 9 }, size: { hw: 14, hh: 3.5 } };
  const s2 = { id: `${id}.2`, label: ' ', at: { x: at.x + 18, y: at.y + 9 }, size: { hw: 14, hh: 3.5 } };
  return {
    fixture: {
      id,
      kind: 'hsabbond',
      label: 'Bond Nature Viewer',
      at: { ...at },
      size: { w, h },
      noRun: true,
      dials: {},
      props: { backdrop: true, s1: s1.id, s2: s2.id }
    },
    slots: [s1, s2],
    size: { w, h }
  };
}

function paintBondViewer(ctx, f, state, b) {
  const F = frameOf(b);
  const sc = b.sc;

  say(ctx, 'BOND NATURE COMPARATOR', F.x(2.0), F.y(2.2), F.size(2.0, 6.4), { weight: 700, color: DUST });

  const pw = 32 * sc;
  const ph = 15 * sc;
  const p1x = F.x(3);
  const p2x = F.x(37);
  const py = F.y(5.5);

  // Panel 1: Hard-Hard (Ca2+ + F-)
  ctx.fillStyle = '#14120e';
  ctx.fillRect(p1x, py, pw, ph);
  ctx.strokeStyle = '#2d2822';
  ctx.strokeRect(p1x + 0.5, py + 0.5, pw - 1, ph - 1);
  say(ctx, 'Hard + Hard (Ca²⁺ & F⁻)', p1x + pw / 2, py + 2.4 * sc, F.size(1.8, 5.6), { align: 'center', weight: 700, color: '#78a142' });

  // Two compact spheres, electrostatic line
  const c1x = p1x + 10 * sc, c2x = p1x + 22 * sc, cy1 = py + 8.5 * sc;
  ctx.beginPath(); ctx.arc(c1x, cy1, 4.2 * sc, 0, Math.PI * 2); ctx.fillStyle = '#c8c0a0'; ctx.fill();
  ctx.beginPath(); ctx.arc(c2x, cy1, 3.8 * sc, 0, Math.PI * 2); ctx.fillStyle = '#8fc0b0'; ctx.fill();
  say(ctx, 'Ca²⁺', c1x, cy1, F.size(1.7, 5.2), { align: 'center', weight: 700, color: '#15130f' });
  say(ctx, 'F⁻', c2x, cy1, F.size(1.7, 5.2), { align: 'center', weight: 700, color: '#15130f' });
  say(ctx, 'Small radii · Concentrated charges', p1x + pw / 2, py + 13.5 * sc, F.size(1.5, 4.8), { align: 'center', color: DUST });

  // Panel 2: Soft-Soft (Ag+ + I-)
  ctx.fillStyle = '#14120e';
  ctx.fillRect(p2x, py, pw, ph);
  ctx.strokeStyle = '#2d2822';
  ctx.strokeRect(p2x + 0.5, py + 0.5, pw - 1, ph - 1);
  say(ctx, 'Soft + Soft (Ag⁺ & I⁻)', p2x + pw / 2, py + 2.4 * sc, F.size(1.8, 5.6), { align: 'center', weight: 700, color: AMBER });

  // Overlapping squishy ellipses
  const o1x = p2x + 11 * sc, o2x = p2x + 21 * sc, cy2 = py + 8.5 * sc;
  ctx.beginPath(); ctx.ellipse(o1x, cy2, 5.6 * sc, 4.2 * sc, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#aeb4ba'; ctx.globalAlpha = 0.6; ctx.fill();
  ctx.beginPath(); ctx.ellipse(o2x, cy2, 6.2 * sc, 4.5 * sc, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#7d6aa8'; ctx.globalAlpha = 0.6; ctx.fill();
  ctx.globalAlpha = 1;
  say(ctx, 'Ag⁺', o1x - 1.5 * sc, cy2, F.size(1.7, 5.2), { align: 'center', weight: 700, color: '#ffffff' });
  say(ctx, 'I⁻', o2x + 1.5 * sc, cy2, F.size(1.7, 5.2), { align: 'center', weight: 700, color: '#ffffff' });
  say(ctx, 'Squishy clouds · Orbital overlap', p2x + pw / 2, py + 13.5 * sc, F.size(1.5, 4.8), { align: 'center', color: DUST });
}

registerFixture('hsabbond', { paint: paintBondViewer });

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

export const HSAB_CARD_RECT = Object.freeze({ hw: 9.0, hh: 4.8 });

/** A card representing an ion pair or prediction. */
export const hsabCard = (id, label, at, props = {}, extra = {}) => ({
  id,
  kind: 'hsabcard',
  label,
  at,
  props,
  ...extra
});

function paintHsabCard(ctx, p, state, o) {
  const box = slab(ctx, o, HSAB_CARD_RECT, '#1d1a16');
  const sc = o.sc;
  say(ctx, p.label, o.x, o.y, Math.max(6.2, 1.9 * sc), {
    align: 'center',
    weight: 700,
    color: '#f0ece1',
    maxW: box.w - 1.6 * sc
  });
}

registerPiece('hsabcard', {
  kind: { r: 6.8, rect: HSAB_CARD_RECT, nojoin: true },
  paint: paintHsabCard,
  faceKey: p => `hsabcard|${p.label}|${p.id}`,
  printed: p => String(p.label)
});

export const HSAB_CHIP_RECT = Object.freeze({ hw: 13.0, hh: 3.5 });

/** A formula or explanation chip. */
export const hsabChip = (id, label, at, props = {}, extra = {}) => ({
  id,
  kind: 'hsabchip',
  label,
  at,
  props,
  ...extra
});

function paintHsabChip(ctx, p, state, o) {
  const box = slab(ctx, o, HSAB_CHIP_RECT, '#181613');
  const sc = o.sc;
  say(ctx, p.label, o.x, o.y, Math.max(6.0, 1.8 * sc), {
    align: 'center',
    weight: 600,
    color: '#e4dfd5',
    maxW: box.w - 1.6 * sc
  });
}

registerPiece('hsabchip', {
  kind: { r: 7.2, rect: HSAB_CHIP_RECT, nojoin: true },
  paint: paintHsabChip,
  faceKey: p => `hsabchip|${p.label}|${p.id}`,
  printed: p => String(p.label)
});

/* ------------------------------------------------------------------
   TOUR WORDS
   ------------------------------------------------------------------ */

addTourText(
  {
    'pot:hsabprobe': {
      title: 'Firmness Probe',
      dials: false,
      text: 'Put an ion disc into the socket and press "Test". The probe measures how easily the ion\'s electron cloud deforms in an electric field.'
    },
    'pot:hsabwells': {
      title: 'Reaction Wells',
      dials: false,
      text: 'Seat solution jars in the test wells and press "Mix". The window shows whether the ions combine into an insoluble precipitate or remain dissolved.'
    },
    'pot:hsabbond': {
      title: 'Bond Viewer',
      dials: false,
      text: 'Examine the two particle diagrams showing ionic charge attraction and covalent cloud overlap, then place matching chips in the sockets.'
    }
  },
  {
    hsabcard: ['Card', 'A card that names an ion pair or prediction. Drag it into the matching tray or slot.'],
    hsabchip: ['Chip', 'A chip that names a formula or bond type. Drag it into the socket that matches.']
  }
);
