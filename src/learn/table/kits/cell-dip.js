/**
 * kits/cell-dip.js — the dip rack, registered on the cell kit (`cell-registry.js`). Brinewire's `q2-activity`.
 *
 *   DIP RACK   a row of beakers, each a solution of one metal's ions, a mixed solution, or an acid. A strip laid over a beaker is dipped in
 *              it. The beaker is the window: the strip stands in the liquid and comes out coated with the metal of the solution (a
 *              rough layer in that metal's colour, the strip itself thinner), bubbling (acid), or clean. A mixed beaker also draws its ions
 *              as counted dots, so the metal taken out of it is missing from the picture afterwards. The beaker keeps a small mark for every
 *              strip that has been dipped in it (instrument memory, `settle`): a coloured square for a coating, a ring for bubbles, an empty
 *              square for none. No other log is printed; the player's own dips are the evidence.
 *   NAILS      four brine beakers, each holding an iron nail wired to a partner metal. "Leave a Week" ages them: blue spots appear on a nail
 *              where it is rusting.
 *   STRIP      a bar of one metal (or "X", sealed). Laid in a beaker's seat it is dipped.
 *
 * A THIN WRAPPER over `engine/celldata-q2-activity.js` (which is `celldata.js`'s `displaces`, `givesHydrogen`, `protectsIron`): a painter
 * decides nothing. The windows are flat pictures; at `3D On` each beaker stands in a low glass dish and a strip is a metal bar.
 */

import * as THREE from 'three';
import { PLATE_COLORS } from '../../engine/plates.js';
import { roundedSlab } from '../../engine/table-props.js';
import { metalTint } from '../../engine/lab-props.js';
import { registerFixture, registerPiece } from './cell-registry.js';
import { frameOf } from './matter-draw.js';
import { seatedIn } from './heat-read.js';
import { METALS } from '../../engine/celldata.js';
import { dipResult, dipWords, nailSpots, NAIL_SPOTS } from '../../engine/celldata-q2-activity.js';
import { put, METAL_INK } from './cell-board.js';
import './cell-dip-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const TEXT = PLATE_COLORS.text;

const RECT_BAR = { hw: 9.2, hh: 3.5 };

/** The layout, in the fixture's own units: a column for each beaker. */
export const DIP_UNIT = Object.freeze({
  col: 30, cup: { w: 22, h: 20 }, slotY: 12, cupTop: 17, nameY: 41.5, readY: 45.4, legendY: 49.4, marksY: 53.6, h: 60, title: 5
});

/** The ink of a coating, by the metal that formed it: grey on grey stays distinct by shade and by the rough edge. */
export const COAT_INK = Object.freeze({
  mg: '#e6e6e0', al: '#dfe2e3', zn: '#8fa3b8', fe: '#6a6c72', ni: '#b8bcb8', sn: '#c8cacc', pb: '#a8a8b0', cu: '#b4552d', ag: '#ecece6', au: '#e0b52c'
});
/** The dots of a mixed beaker's ions. */
const ION_INK = Object.freeze({ cu: '#4f86a8', fe: '#8bb06a', zn: '#9aa3b8', mg: '#c9c4b4', ag: '#d8d8d2', pb: '#a8a8b0', ni: '#b8bcb8' });
const LIQUID = Object.freeze({ cu: '#264559', fe: '#2f4636', acid: '#3a3a2e', mix: '#2c4650', default: '#2f3a42' });

/** What a beaker is called on the rack. */
export const beakerName = bk => bk.label ?? (bk.ion === 'acid' ? 'Acid, H⁺' : bk.ion === 'mix' ? 'Cu²⁺ and Fe²⁺' : `${METALS[bk.ion].ion} solution`);

/** The strip standing in a beaker's seat, as `{ piece, id }` (id is the metal it really is, even when it is sealed), or null. */
export function dippedIn(state, slotId) {
  const p = seatedIn(state, slotId);
  return p && p.kind === 'celldipstrip' ? { piece: p, id: p.props.metal } : null;
}

/** What the rack reads: for each beaker, the strip in it now and the strips that have ever been dipped in it. */
export function dipRead(state, fid) {
  const f = state.fixtures[fid];
  const noted = f.props.noted || {};
  return f.props.beakers.map(bk => {
    const now = dippedIn(state, bk.slot);
    return { bk, now, res: now ? dipResult(now.id, bk.ion) : null, tried: (noted[bk.id] || []).map(id => ({ id, res: dipResult(id, bk.ion) })) };
  });
}

/** What the beaker has shown for one strip, or null if that strip was never dipped there. */
export const triedIn = (state, fid, beakerId, stripId) => dipRead(state, fid).find(r => r.bk.id === beakerId)?.tried.find(t => t.id === stripId)?.res || null;

const stripSymbol = id => METALS[id].symbol;

/* ------------------------------------------------------------------ painting */

function bubble(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }

/** The strip in the liquid with its coating, bubbles or none. */
function paintDipped(ctx, F, cx, top, res, stripId, sealed) {
  const x0 = cx - 1.6; const bottom = top + 17; const surface = top + 5;
  const ink = sealed ? '#8a8780' : (METAL_INK[stripId] || '#9a9690');
  // The part above the liquid is the strip as it was.
  ctx.fillStyle = ink; ctx.fillRect(F.x(x0), F.y(top - 1), F.len(3.2), F.len(surface - top + 1));
  const wet = bottom - surface;
  if (res.coats.length) {
    // Thinner core, with a rough layer of the coating round it.
    ctx.fillStyle = ink; ctx.fillRect(F.x(cx - 1), F.y(surface), F.len(2), F.len(wet));
    if (res.coats.length === 1) paintCoat(ctx, F, cx, surface, wet, res.coats[0], 0);
    else {
      let y = surface; let k = 0;
      while (y < bottom - 0.01) { const h = Math.min(3, bottom - y); paintCoat(ctx, F, cx, y, h, res.coats[k % res.coats.length], k); y += h; k++; }
    }
  } else {
    ctx.fillStyle = ink; ctx.fillRect(F.x(x0), F.y(surface), F.len(3.2), F.len(wet));
    if (res.gas) {
      ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1, F.len(0.2));
      [[-3.4, 14], [3.6, 11], [-3.8, 8.5], [3.5, 6], [-3.2, 4.2], [3.8, 2.6]].forEach(([dx, dy], i) => bubble(ctx, F.x(cx + dx), F.y(top + dy), Math.max(1.3, F.len(0.62 + (i % 2) * 0.2))));
      ctx.lineWidth = 1;
    }
  }
}

function paintCoat(ctx, F, cx, y, h, metalId, k) {
  ctx.fillStyle = COAT_INK[metalId] || '#a0a0a0';
  ctx.fillRect(F.x(cx - 2.5), F.y(y), F.len(5), F.len(h));
  // A rough edge: small bumps of the same colour, the same every time.
  for (let i = 0; i < Math.max(1, Math.round(h / 1.5)); i++) {
    const side = (i + k) % 2 ? 1 : -1;
    ctx.beginPath(); ctx.arc(F.x(cx + side * 2.6), F.y(y + 0.7 + i * 1.5), Math.max(1, F.len(0.55)), 0, Math.PI * 2); ctx.fill();
  }
}

/** The mixed beaker's ions as dots: left of the strip, then right of it. */
function paintIons(ctx, F, cx, cupTop, ions) {
  const slots = [];
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) slots.push([cx + side * (4.2 + (i % 3) * 2.6), cupTop + 8.5 + Math.floor(i / 3) * 3.6]);
  let k = 0;
  const order = ['cu', 'fe', ...Object.keys(ions).filter(m => m !== 'cu' && m !== 'fe')];
  for (const m of order) {
    for (let i = 0; i < (ions[m] || 0); i++, k++) {
      if (k >= slots.length) return;
      ctx.fillStyle = ION_INK[m] || '#aaa';
      ctx.beginPath(); ctx.arc(F.x(slots[k][0]), F.y(slots[k][1]), Math.max(1.4, F.len(0.95)), 0, Math.PI * 2); ctx.fill();
    }
  }
}

/** The small mark a beaker keeps for one strip. */
function paintMark(ctx, F, x, y, res, id) {
  const s = F.len(2.1);
  const x0 = F.x(x); const y0 = F.y(y) - s / 2;
  if (res.coats.length) {
    res.coats.forEach((m, i) => { ctx.fillStyle = COAT_INK[m]; ctx.fillRect(x0 + (i * s) / res.coats.length, y0, s / res.coats.length, s); });
    ctx.strokeStyle = STEEL; ctx.strokeRect(x0 + 0.5, y0 + 0.5, s - 1, s - 1);
  } else if (res.gas) {
    ctx.strokeStyle = DUST; ctx.beginPath(); ctx.arc(x0 + s / 2, y0 + s / 2, s / 2 - 0.5, 0, Math.PI * 2); ctx.stroke();
  } else {
    ctx.strokeStyle = STEEL; ctx.strokeRect(x0 + 0.5, y0 + 0.5, s - 1, s - 1);
  }
  put(ctx, id, x0 + s + F.len(0.5), F.y(y), F.size(1.9, 5.6), { align: 'left', color: DUST });
}

function paintDip(ctx, f, state, b) {
  const F = frameOf(b);
  const U = DIP_UNIT;
  for (const r of dipRead(state, f.id)) {
    const bk = r.bk;
    const cx = bk.cx;
    const x0 = cx - U.cup.w / 2;
    // The beaker: liquid and glass.
    ctx.fillStyle = LIQUID[bk.ion] || LIQUID.default;
    ctx.fillRect(F.x(x0 + 0.5), F.y(U.cupTop + 5), F.len(U.cup.w - 1), F.len(U.cup.h - 5.5));
    ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1.4, F.len(0.35));
    ctx.beginPath(); ctx.moveTo(F.x(x0), F.y(U.cupTop)); ctx.lineTo(F.x(x0), F.y(U.cupTop + U.cup.h)); ctx.lineTo(F.x(x0 + U.cup.w), F.y(U.cupTop + U.cup.h)); ctx.lineTo(F.x(x0 + U.cup.w), F.y(U.cupTop)); ctx.stroke();
    ctx.lineWidth = 1;
    // What is in the window: the strip, or (for a mixed beaker) its ions.
    const ions = r.res?.ions || (bk.ion === 'mix' ? { cu: 6, fe: 6 } : null);
    if (r.now) paintDipped(ctx, F, cx, U.cupTop, r.res, r.now.id, Boolean(r.now.piece.props.sealed));
    if (ions) paintIons(ctx, F, cx, U.cupTop, ions);
    // Its name, and what the strip in it shows.
    put(ctx, beakerName(bk), F.x(cx), F.y(U.nameY), F.size(2.5, 6.6), { color: TEXT, weight: 700, maxW: F.len(U.col - 1.5) });
    if (r.now) {
      const label = r.now.piece.label;
      put(ctx, `${label}: ${dipWords(r.res)}`, F.x(cx), F.y(U.readY), F.size(2.1, 6.0), { color: DUST, maxW: F.len(U.col - 1.5) });
    }
    if (ions) {
      const keys = Object.keys(ions).sort((p, q) => (p === 'cu' ? -1 : q === 'cu' ? 1 : p === 'fe' ? -1 : q === 'fe' ? 1 : 0));
      const gap = 11.5; const start = cx - ((keys.length - 1) * gap) / 2;
      keys.forEach((m, i) => {
        ctx.fillStyle = ION_INK[m] || '#aaa';
        ctx.beginPath(); ctx.arc(F.x(start + i * gap - 3.6), F.y(U.legendY), Math.max(1.3, F.len(0.8)), 0, Math.PI * 2); ctx.fill();
        put(ctx, METALS[m].ion, F.x(start + i * gap - 2), F.y(U.legendY), F.size(2.0, 5.8), { align: 'left', color: DUST });
      });
    }
    // One mark for each strip ever dipped in it.
    r.tried.forEach((t, i) => paintMark(ctx, F, cx - 12 + (i % 4) * 6.4, U.marksY + Math.floor(i / 4) * 3.4, t.res, stripSymbol(t.id)));
  }
}

/** The rack keeps a mark for every strip that has stood in each beaker, in the order they were dipped. */
function settle(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'celldip') continue;
    const noted = f.props.noted || (f.props.noted = {});
    for (const bk of f.props.beakers) {
      const s = dippedIn(state, bk.slot);
      if (!s) continue;
      const list = noted[bk.id] || (noted[bk.id] = []);
      if (!list.includes(s.id)) list.push(s.id);
    }
  }
}

/** Low glass dishes round the beakers at `3D On`. */
function wallsFor(c, group, cups, cupW, cupD) {
  const { THREE: T, scale: s, toPlate, box } = c;
  const H = 0.026; const t = 0.005;
  const wall = (cx, cy, lw, ld, dx, dz) => {
    const m = new T.Mesh(new T.BoxGeometry(lw, H, ld), c.mats.labGlass);
    const q = toPlate({ x: cx, y: cy });
    m.position.set(q.x + dx, c.ground + H / 2, q.z + dz);
    m.castShadow = false; m.receiveShadow = false;
    group.add(m);
  };
  for (const at of cups) {
    const w = cupW * s; const d = cupD * s;
    const cx = box.x0 + at.x; const cy = box.y0 + at.y;
    wall(cx, cy, w + 2 * t, t, 0, -d / 2 - t / 2);
    wall(cx, cy, w + 2 * t, t, 0, d / 2 + t / 2);
    wall(cx, cy, t, d, -w / 2 - t / 2, 0);
    wall(cx, cy, t, d, w / 2 + t / 2, 0);
  }
}

function dressDip(f, state, c) {
  const U = DIP_UNIT;
  const group = new c.THREE.Group();
  wallsFor(c, group, f.props.beakers.map(bk => ({ x: bk.cx, y: U.cupTop + U.cup.h / 2 })), U.cup.w, U.cup.h);
  return group;
}

registerFixture('celldip', { paint: paintDip, settle, dress3d: dressDip });

/**
 * The dip rack. `beakers` is `[{ id, ion, label? }]` where `ion` is a metal id (a solution of its ions), `'acid'` or `'mix'`. Returns
 * `{ fixture, slots, size }`: the stage adds the returned `slots` (one seat over each beaker, id `<id>.<beaker id>`) to its zones.
 */
export function dipFixture(id, at, { beakers, title = 'Dip rack' }) {
  const U = DIP_UNIT;
  const w = 4 + beakers.length * U.col; const h = U.h;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const list = beakers.map((bk, k) => ({ ...bk, cx: 2 + k * U.col + U.col / 2, slot: `${id}.${bk.id}` }));
  const slots = list.map(bk => ({ id: bk.slot, label: ' ', at: { x: x0 + bk.cx, y: y0 + U.slotY }, size: { w: 18, h: 9 } }));
  return {
    fixture: {
      id, kind: 'celldip', label: title, at: { ...at }, size: { w, h }, noRun: true, dials: {},
      props: { backdrop: true, beakers: list, noted: {} }
    },
    slots,
    size: { w, h }
  };
}

/* ------------------------------------------------------------------ the nails */

const NAIL_SPOT_AT = [[-0.9, 4], [0.9, 7.5], [-0.8, 11], [0.8, 14.5], [-0.6, 17.5]];

function paintNails(ctx, f, state, b) {
  const F = frameOf(b);
  const U = DIP_UNIT;
  const aged = Math.round(f.dials.aged?.value ?? 0) === 1;
  const top = 16;
  for (const p of f.props.partners) {
    const cx = p.cx; const x0 = cx - 11;
    ctx.fillStyle = '#33403a';
    ctx.fillRect(F.x(x0 + 0.5), F.y(top + 5), F.len(21), F.len(14.5));
    ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1.4, F.len(0.35));
    ctx.beginPath(); ctx.moveTo(F.x(x0), F.y(top)); ctx.lineTo(F.x(x0), F.y(top + 20)); ctx.lineTo(F.x(x0 + 22), F.y(top + 20)); ctx.lineTo(F.x(x0 + 22), F.y(top)); ctx.stroke();
    ctx.lineWidth = 1;
    // The nail (left) and the partner bar (right), joined by a wire over the top.
    const nx = cx - 4; const px = cx + 4;
    ctx.fillStyle = METAL_INK.fe; ctx.fillRect(F.x(nx - 1), F.y(top - 4), F.len(2), F.len(21));
    ctx.fillRect(F.x(nx - 2.2), F.y(top - 5), F.len(4.4), F.len(1.4));
    ctx.fillStyle = METAL_INK[p.metal] || '#9a9690'; ctx.fillRect(F.x(px - 1.5), F.y(top - 4), F.len(3), F.len(21));
    ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1.1, F.len(0.28));
    ctx.beginPath(); ctx.moveTo(F.x(nx), F.y(top - 5)); ctx.lineTo(F.x(nx), F.y(top - 7.5)); ctx.lineTo(F.x(px), F.y(top - 7.5)); ctx.lineTo(F.x(px), F.y(top - 4)); ctx.stroke();
    ctx.lineWidth = 1;
    // After a week: blue spots on a nail that is rusting.
    if (aged) {
      const n = nailSpots(p.metal);
      ctx.fillStyle = '#3d7bbd';
      for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(F.x(nx + NAIL_SPOT_AT[i][0] * 0.55), F.y(top + NAIL_SPOT_AT[i][1] + 1), Math.max(1.3, F.len(0.85)), 0, Math.PI * 2); ctx.fill(); }
    }
    put(ctx, METALS[p.metal].name === 'tin' ? 'Tin' : METALS[p.metal].name[0].toUpperCase() + METALS[p.metal].name.slice(1), F.x(cx), F.y(top + 24.5), F.size(2.6, 6.8), { color: TEXT, weight: 700, maxW: F.len(U.col - 2) });
  }
  put(ctx, 'Each nail is wired to the metal named under its beaker.', F.x(2), F.y(top + 30), F.size(2.1, 6.0), { align: 'left', color: DUST, maxW: F.len(f.size.w - 38) });
  put(ctx, 'Blue spots show where the iron is dissolving.', F.x(2), F.y(top + 33.6), F.size(2.1, 6.0), { align: 'left', color: DUST, maxW: F.len(f.size.w - 38) });
}

function runNails(state, fid) {
  const f = state.fixtures[fid];
  if (Math.round(f.dials.aged?.value ?? 0) === 1) return { noop: 'The nails have already been left for a week.' };
  return { x: 1, y: f.props.partners.filter(p => nailSpots(p.metal) > 0).length, label: fid, dials: { [fid]: { aged: 1 } } };
}

function dressNails(f, state, c) {
  const group = new c.THREE.Group();
  wallsFor(c, group, f.props.partners.map(p => ({ x: p.cx, y: 16 + 10 })), 22, 20);
  return group;
}

registerFixture('celldipnails', { paint: paintNails, run: runNails, dress3d: dressNails });

/** Whether the nails have been left for a week. */
export const nailsAged = (state, fid) => Math.round(state.fixtures[fid].dials.aged?.value ?? 0) === 1;

/** The nail rack: an iron nail in brine wired to each partner metal (`partners` is a list of metal ids). */
export function nailsFixture(id, at, { partners, title = 'Nails in brine' }) {
  const U = DIP_UNIT;
  const w = 4 + partners.length * U.col; const h = 56;
  return {
    id, kind: 'celldipnails', label: title, at: { ...at }, size: { w, h }, runLabel: 'Leave a Week',
    dials: { aged: { min: 0, max: 1, step: 1, value: 0, label: 'Left' } },
    props: { hidden: ['aged'], backdrop: true, partners: partners.map((m, k) => ({ metal: m, cx: 2 + k * U.col + U.col / 2 })) }
  };
}

/* ------------------------------------------------------------------ the strip */

function paintStrip(ctx, p, state, o) {
  const sc = o.sc;
  const x0 = o.x - RECT_BAR.hw * sc; const y0 = o.y - RECT_BAR.hh * sc; const w = RECT_BAR.hw * 2 * sc; const h = RECT_BAR.hh * 2 * sc;
  ctx.fillStyle = p.props.sealed ? '#8a8780' : (METAL_INK[p.props.metal] || '#9a9690'); ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = o.lit ? PLATE_COLORS.amber : STEEL; ctx.lineWidth = o.lit ? 2 : 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1); ctx.lineWidth = 1;
  put(ctx, p.label, o.x, o.y, Math.max(8, Math.min(3.4 * sc, (w - 1.4 * sc) / (Math.max(2, p.label.length) * 0.6))), { color: '#16140f', weight: 700, maxW: w - 1.2 * sc });
}

const STRIP_MATS = new WeakMap();
function stripMaterial(mats, id, sealed) {
  let byId = STRIP_MATS.get(mats);
  if (!byId) { byId = new Map(); STRIP_MATS.set(mats, byId); }
  const key = sealed ? 'sealed' : id;
  if (!byId.has(key)) {
    const m = mats.labSteel.clone();
    m.color = new THREE.Color(sealed ? 0x8a8780 : metalTint(METALS[id].symbol));
    byId.set(key, m);
  }
  return byId.get(key);
}

/** A strip at `3D On`: a thin bar of the metal lying on the plate, a flat face for its name. */
function pieceStrip3d(p, state, c) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const H = 0.014;
  const body = new THREE.Mesh(roundedSlab(hw * 2, hh * 2, H, Math.min(hw, hh) * 0.2, 0.002), stripMaterial(m, p.props.metal, p.props.sealed));
  body.castShadow = true; body.receiveShadow = true; g.add(body);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 * 0.92, hh * 2 * 0.8), c.face());
  face.rotation.x = -Math.PI / 2; face.position.y = H + 0.0012; face.receiveShadow = true; g.add(face);
  g.userData.height = H + 0.002;
  return g;
}

registerPiece('celldipstrip', {
  kind: { r: 9.6, rect: RECT_BAR, nojoin: true },
  paint: paintStrip,
  faceKey: p => `celldipstrip|${p.label}|${p.props.metal}|${p.props.sealed ? 1 : 0}`,
  piece3d: pieceStrip3d,
  printed: p => p.label
});

const GAS_MATS = new WeakMap();
const gasMaterial = mats => {
  if (!GAS_MATS.has(mats)) { const m = mats.labSteel.clone(); m.color = new THREE.Color(0xd6cfb8); GAS_MATS.set(mats, m); }
  return GAS_MATS.get(mats);
};
function paintGas(ctx, p, state, o) {
  const r = o.sc * 7.4;
  ctx.fillStyle = '#d6cfb8'; ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = o.lit ? PLATE_COLORS.amber : STEEL; ctx.lineWidth = o.lit ? 2 : 1; ctx.stroke(); ctx.lineWidth = 1;
  put(ctx, p.label, o.x, o.y, Math.max(8, r * 0.95), { color: '#16140f', weight: 700 });
}
/** A bubble of gas as a piece (hydrogen in `q2-activity`): a pale sphere with its formula. */
registerPiece('cellgas', {
  kind: { r: 8, nojoin: true },
  paint: paintGas,
  faceKey: p => `cellgas|${p.label}`,
  piece3d: (p, state, c) => {
    const g = new THREE.Group();
    const r = c.hw * 0.9;
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), gasMaterial(c.mats));
    m.position.y = r; m.castShadow = true; m.receiveShadow = true; g.add(m);
    g.userData.height = r * 2;
    return g;
  },
  printed: p => p.label
});
/** A bubble of hydrogen. */
export const hydrogenPiece = (id, at) => ({ id, kind: 'cellgas', label: 'H₂', at, props: {}, caption: 'Hydrogen.' });
/** A bubble of any gas, labelled with its formula. */
export const gasPiece = (id, label, at) => ({ id, kind: 'cellgas', label, at, props: {}, caption: null });

/** A strip of one metal (a key of `METALS`); its face says its symbol, or "X" when `sealed`. */
export const stripPiece = (id, metal, at, { label = null, sealed = false, caption = 'Dip it in a beaker.' } = {}) => ({
  id, kind: 'celldipstrip', label: label ?? (sealed ? 'X' : METALS[metal].symbol), at, props: { metal, sealed }, caption
});

export { DIM, NAIL_SPOTS };
