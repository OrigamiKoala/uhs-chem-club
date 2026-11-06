/**
 * kits/cell-scene.js — the mechanism view beside Brinewire's instruments. It watches one or more fixtures (`props.watch`) or runs a fixed
 * demonstration (`props.demo`, the lead-in of a predict stage), builds a spec from their reads (`cell-scenes.js`) and shows
 * `engine/cellscene.js` at the table's clock:
 *   - at `3D On`, a 3D dress: glass vessels, metal strips, ions and electrons as spheres that hover and move (`userData.tick`);
 *   - at `3D Off`, the same primitives projected flat and painted at `b.clock`.
 * Both read the same pure model; the cards, dials, rigs it watches remain the controls.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './cell-registry.js';
import { frameOf } from './matter-draw.js';
import { sceneAt, specLive } from '../../engine/cellscene.js';
import { specFor } from './cell-scenes.js';
import { put } from './cell-board.js';
import './cell-scene-tour.js';
import { freeRect } from './cell-room.js';
import { sitesFor, toUnits, fit } from './cell-sites.js';
import './cell-site-sets.js';

const TEXT = PLATE_COLORS.text; const STEEL = PLATE_COLORS.steel;
const YTOP = 0.52; const YSPAN = 0.6;

/* ------------------------------------------------------------------ a miss replays its cause */

const nowSec = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
const REPLAY = { msg: '', t0: -1e9, listeners: new Set() };
/** A wrong commit: the model runs again from its start for a few seconds, with whatever does not add up ringed in amber and the reason above it. */
export function noteMiss(msg) { REPLAY.msg = msg || ''; REPLAY.t0 = nowSec(); REPLAY.listeners.forEach(fn => fn()); }
export const replaying = () => nowSec() - REPLAY.t0 < 6;
const replayClock = () => nowSec() - REPLAY.t0;

/* ------------------------------------------------------------------ flat */

function paintScene(ctx, f, state, b) {
  const spec = specFor(state, f);
  if (!spec) return;
  const F = frameOf(b);
  const w = f.size.w; const h = f.size.h;
  const rp = replaying();
  const m = sceneAt(spec, rp ? replayClock() : (b.clock || 0));
  // Uniform scale, centred: a narrow or short rectangle shows a smaller, undistorted scene.
  const sw = Math.min(w, (h - 5) / YSPAN);
  const ox = (w - sw) / 2; const oy = ((h - 5) - sw * YSPAN) / 2;
  const X = u => F.x(ox + u * sw);
  const Y = v => F.y(4 + oy + (YTOP - v) * sw);
  const L = u => F.len(u * sw); const H = v => F.len(v * sw);
  const al = (c, a, fn) => { ctx.globalAlpha = a; ctx.fillStyle = c; fn(); ctx.globalAlpha = 1; };
  for (const bx of m.boxes) {
    const x = X(bx.x - bx.w / 2); const y = Y(bx.y + bx.h / 2);
    if (bx.kind === 'glass') { ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1, F.len(0.4)); ctx.strokeRect(x, y, L(bx.w), H(bx.h)); ctx.lineWidth = 1; } else al(bx.color, bx.a, () => ctx.fillRect(x, y, L(bx.w), H(bx.h)));
  }
  for (const ln of m.lines) {
    ctx.strokeStyle = ln.color; ctx.lineWidth = Math.max(1, F.len(ln.thick ? 1.1 : 0.5)); ctx.beginPath();
    ln.pts.forEach(([px, py], i) => (i ? ctx.lineTo(X(px), Y(py)) : ctx.moveTo(X(px), Y(py)))); ctx.stroke(); ctx.lineWidth = 1;
  }
  const r0 = F.len(sw * 0.011);
  for (const bl of m.balls.sort((p, q) => p.z - q.z)) {
    const rr = Math.max(F.len(0.9), r0 * (bl.r / 0.011) * 0.8);
    al(bl.color, bl.a, () => { ctx.beginPath(); ctx.arc(X(bl.x), Y(bl.y), rr, 0, Math.PI * 2); ctx.fill(); });
    if (bl.label && rr > F.len(1.6)) put(ctx, bl.label, X(bl.x), Y(bl.y), Math.max(6, rr * 0.95), { color: '#0d0c0a', weight: 700 });
    if (rp && bl.prob) { ctx.strokeStyle = '#d99423'; ctx.lineWidth = Math.max(1.5, F.len(0.5)); ctx.beginPath(); ctx.arc(X(bl.x), Y(bl.y), rr + F.len(1.3 + Math.sin(replayClock() * 8)), 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
  }
  if (rp && REPLAY.msg) put(ctx, REPLAY.msg, X(0.5), Y(0.5), F.size(2.1, 6.5), { color: '#d99423', weight: 700, maxW: F.len(w * 0.96) });
  for (const t of m.texts) put(ctx, t.label, X(t.x), Y(t.y), F.size(2.2, 7), { color: t.note ? '#d99423' : TEXT, weight: 700, maxW: F.len(w * 0.95) });
  // Resting particles the student answers on: a ring while empty, a solid sphere once set.
  for (const st of sitesFor(state, f)) {
    const rr = Math.max(F.len(1.5), F.len(st.r * sw));
    ctx.beginPath(); ctx.arc(X(st.x), Y(st.y), rr, 0, Math.PI * 2);
    if (st.on) { ctx.fillStyle = st.color || '#e59b24'; ctx.fill(); } else { ctx.strokeStyle = st.color || '#e59b24'; ctx.setLineDash?.([3, 3]); ctx.stroke(); ctx.setLineDash?.([]); }
    if (st.label) put(ctx, st.label, X(st.x), Y(st.y), Math.max(6, rr * 0.95), { color: st.on ? '#0d0c0a' : (st.color || '#e59b24'), weight: 700, maxW: rr * 2.2 });
    if (st.read) put(ctx, st.read, X(st.x), Y(st.y) + rr + F.len(2.4), F.size(2, 6), { color: TEXT, weight: 700, maxW: F.len(sw * 0.3) });
    if (st.ring) { ctx.strokeStyle = '#d99423'; ctx.lineWidth = Math.max(1.5, F.len(0.5)); ctx.beginPath(); ctx.arc(X(st.x), Y(st.y), rr + F.len(1.4), 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
  }
  for (const t of sitesFor(state, f).filter(q => q.text)) put(ctx, t.text, X(t.x), Y(t.y), F.size(2, 6), { color: STEEL, weight: 700, maxW: F.len(sw * 0.3) });
}

/* ------------------------------------------------------------------ 3D */

const CAP = { boxes: 10, balls: 60, segs: 16 };

function dressScene(f, state, c) {
  const { THREE, scale: s, toPlate, box } = c;
  // A model with no room on the table (`props.hover`) hangs in the air over the plate's far side at a fixed size; its flat form is a small
  // thumbnail in the one empty corner the table has. Gravity is not the point.
  const hover = Boolean(f.props.hover);
  const U = hover ? 0.78 : fit(f).sw * s;
  const group = new THREE.Group();
  group.name = 'cell-scene';
  const at = toPlate({ x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2 });
  const root = new THREE.Group();
  if (hover) root.position.set(at.x - U / 2, c.ground + 0.22, at.z - 0.26);
  else root.position.set(at.x - U / 2, c.ground + 0.012, at.z + 0.0);
  group.add(root);
  const mats = new Map();
  const mat = (color, a) => {
    const key = `${color}|${a.toFixed(2)}`;
    if (!mats.has(key)) {
      // The host's own steel, tinted: a world's materials stay its own.
      const m = c.mats.labSteel.clone();
      m.color = new THREE.Color(color);
      if (a < 0.99) { m.transparent = true; m.opacity = a; m.depthWrite = false; }
      mats.set(key, m);
    }
    return mats.get(key);
  };
  const boxes = Array.from({ length: CAP.boxes }, () => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat('#888888', 1)); m.visible = false; root.add(m); return m; });
  const balls = Array.from({ length: CAP.balls }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), mat('#888888', 1)); m.visible = false; root.add(m); return m; });
  const segs = Array.from({ length: CAP.segs }, () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 6), mat('#6b625a', 1)); m.visible = false; root.add(m); return m; });
  const st = { spec: specFor(state, f), clock: 0 };
  const siteMeshes = Array.from({ length: 24 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), mat('#e59b24', 1)); m.visible = false; root.add(m); return m; });
  const showSites = (fx, stt) => {
    const list = sitesFor(stt, fx).filter(q => q.act);
    siteMeshes.forEach((m, i) => {
      const q = list[i]; m.visible = Boolean(q);
      if (!q) { m.userData.hotUnits = null; return; }
      m.material = mat(q.color || '#e59b24', q.on ? 1 : 0.28);
      m.position.set(q.x * U, q.y * U, 0.13 * U);
      m.scale.setScalar(Math.max(q.r * U, 0.012));
      m.userData.hotUnits = toUnits(fx, q.x, q.y);
    });
  };
  showSites(f, state);

  const render = () => {
    if (!st.spec) { [...boxes, ...balls, ...segs].forEach(m => { m.visible = false; }); return; }
    const m = sceneAt(st.spec, st.clock);
    boxes.forEach((mesh, i) => {
      const bx = m.boxes[i];
      mesh.visible = Boolean(bx);
      if (!bx) return;
      mesh.material = mat(bx.color, bx.a);
      mesh.position.set(bx.x * U, bx.y * U, bx.z * U);
      mesh.scale.set(bx.w * U, bx.h * U, bx.d * U);
    });
    balls.forEach((mesh, i) => {
      const bl = m.balls[i];
      mesh.visible = Boolean(bl);
      if (!bl) return;
      mesh.material = mat(bl.color, Math.max(0.05, bl.a));
      mesh.position.set(bl.x * U, bl.y * U, bl.z * U);
      mesh.scale.setScalar(bl.r * U * (replaying() && bl.prob ? 1.1 + 0.35 * Math.abs(Math.sin(replayClock() * 8)) : 1.1));
    });
    let k = 0;
    for (const ln of m.lines) {
      for (let i = 0; i + 1 < ln.pts.length && k < CAP.segs; i++, k++) {
        const a = new THREE.Vector3(...ln.pts[i]).multiplyScalar(U); const b = new THREE.Vector3(...ln.pts[i + 1]).multiplyScalar(U);
        const mesh = segs[k];
        mesh.visible = true; mesh.material = mat(ln.color, 1);
        mesh.position.copy(a).add(b).multiplyScalar(0.5);
        const d = b.clone().sub(a);
        mesh.scale.set(U * (ln.thick ? 0.009 : 0.004), d.length(), U * (ln.thick ? 0.009 : 0.004));
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      }
    }
    for (; k < CAP.segs; k++) segs[k].visible = false;
  };
  render();
  group.userData.sync = (fx, stt) => { st.spec = specFor(stt, fx); showSites(fx, stt); render(); };
  group.userData.tick = (dt, still) => {
    if (replaying()) { st.clock = replayClock(); render(); return; } if (still || !st.spec || !specLive(st.spec)) { if (!still) { st.clock += dt * 0.2; render(); } return; } st.clock += dt; render(); };
  return group;
}

registerFixture('cellscene', {
  paint: paintScene, dress3d: dressScene,
  live: (f, state) => { const sp = specFor(state, f); return replaying() || (Boolean(sp) && (specLive(sp) || (sp.ions || []).length > 0)); }
});

/**
 * The moving model for the fixtures in `watch` (ids), or for a fixed `demo` spec. Place it with `withScene` below.
 */
export const sceneFixture = (id, at, { watch = [], demo = null, w = 150, h = 54, title = 'Model', hover = false, sitesKey = null, dials = {}, extra = {} } = {}) => ({
  id, kind: 'cellscene', label: hover ? '' : title, at: { ...at }, size: { w, h }, noRun: true, dials, props: { backdrop: true, watch, demo, hover, hideLabel: hover, sitesKey, hidden: Object.keys(dials), ...extra }
});

/**
 * A stage's table with the model added below everything else: a table spec from `cellTable`, the ids to watch. The bounds grow by the model's height.
 */
export function withScene(table, watch, { demo = null, title = 'Model', placement = null, compact = false, sitesKey = null, dials = {}, extra = {} } = {}) {
  const bw = table.bounds.w; const bh = table.bounds.h;
  // The plate is 3.7 times wider than deep, so a tall table has free width beside it: put the model there and nothing shrinks. A wide table
  // gets it below, or beside it, whichever keeps the bench's scale larger.
  const PLATE = 4.8 / 1.3;
  const free = PLATE * bh - bw;
  const sw = free >= 76 ? Math.min(130, free - 6) : 70;
  const right = { w: sw, h: Math.max(bh, 44) };
  const below = { w: Math.min(bw - 6, compact ? 110 : 150), h: compact ? 26 : 44 };
  const scaleOf = (W, H) => Math.min(PLATE / (W / H) , 1) * 1 / H;
  const rb = { w: bw + right.w + 6, h: Math.max(bh, right.h) }; const bb = { w: bw, h: bh + below.h + 6 };
  const best = (a, b) => Math.min(4.8 / a.w, 1.3 / a.h) >= Math.min(4.8 / b.w, 1.3 / b.h);
  const useRight = placement === 'right';
  if (useRight) {
    const fx = sceneFixture('scene', { x: bw + 3 + right.w / 2, y: right.h / 2 }, { watch, demo, w: right.w, h: right.h, title, sitesKey, dials, extra });
    return { ...table, bounds: rb, fixtures: [...(table.fixtures || []), fx] };
  }
  const fx = sceneFixture('scene', { x: bw / 2, y: bh + 3 + below.h / 2 }, { watch, demo, w: below.w, h: below.h, title, sitesKey, dials, extra });
  return { ...table, bounds: bb, fixtures: [...(table.fixtures || []), fx] };
}

/* ------------------------------------------------------------------ embedded view: the rigs whose beakers have no room for a model beside them */

import { fixtureHandler } from './cell-registry.js';

/** Where the scene's two vessels sit in an instrument's own flat picture: centres of the two cups, a cup's width, its top and height (table units). */
const CUPS = {
  cellgalv: f => { const p = f.props; return { x0: p.lx + p.cupW / 2, x1: p.rx + p.cupW / 2, top: p.by, h: p.cupH }; },
  cellboard: f => { const p = f.props; return { x0: p.refAt.x + p.cup.w / 2, x1: p.metalAt.x + p.cup.w / 2, top: p.refAt.y, h: p.cup.h }; }
};

function paintInside(kind, orig) {
  return (ctx, f, state, b) => {
    const r = orig(ctx, f, state, b);
    const spec = specFor(state, { props: { watch: [f.id] } });
    if (!spec) return r;
    const g = CUPS[kind](f);
    const F = frameOf(b);
    const m = sceneAt(spec, b.clock || 0);
    const k = (g.x1 - g.x0) / 0.52;
    const U = x => F.x(g.x0 + ((x - 0.24) / 0.52) * (g.x1 - g.x0));
    const V = y => F.y(y <= 0.3 ? g.top + g.h - (y / 0.3) * g.h * 0.9 : g.top - ((y - 0.3) / 0.16) * 6);
    for (const bl of m.balls) {
      ctx.globalAlpha = bl.a; ctx.fillStyle = bl.color; ctx.beginPath();
      ctx.arc(U(bl.x), V(bl.y), Math.max(F.len(0.75), F.len(bl.r * k * 0.9)), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    return r;
  };
}
for (const kind of Object.keys(CUPS)) {
  const h = fixtureHandler(kind);
  if (h && !h.embedded) {
    h.paint = paintInside(kind, h.paint);
    h.live = (f, state) => specLive(specFor(state, { props: { watch: [f.id] } }));
    h.embedded = true;
  }
}

/**
 * The model placed in empty area INSIDE the table, so its bounds do not change (a table whose pieces are at the phone floor in width and depth
 * cannot grow). Returns the table with the model added, or null when no empty area is big enough.
 */
export function withSceneInside(table, watch, { demo = null, title = 'Model', foe = false, sitesKey = null, dials = {}, extra = {} } = {}) {
  let r = freeRect(table, { foe });
  let hover = false;
  if (!r) { r = freeRect(table, { foe, minW: 12, minH: 8, maxW: 40, maxH: 54 }); hover = true; }
  if (!r) return null;
  const fx = sceneFixture('scene', { x: r.x0 + r.w / 2, y: r.y0 + r.h / 2 }, { watch, demo, w: r.w, h: r.h, title, hover, sitesKey, dials, extra });
  return { ...table, fixtures: [...(table.fixtures || []), fx] };
}
