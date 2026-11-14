/**
 * kits/thorn-mol.js — Thornmere's electron view (`tmol`) and its predict clips (`tlead`).
 *
 *   tmol   one drawn scene from `thorndata` (a molecule, or two that are about to react): atoms, bonds and, where `pairs`, every shared
 *          and lone pair of electrons as two dots at its place. Modes:
 *            show    the drawing alone (optionally `skeletal`)
 *            pick    tap an atom or a bond: the one tapped is the answer (`pick: { kind: 'atom' | 'bond', among: [ids] }`)
 *            arrow   tap a pair, tap an atom, press the key: the pair travels along a curved arrow. The arrow that begins the reaction
 *                    plays the whole of `play`; any other is drawn going out and coming back, with what the scene showed (`judgeArrow`).
 *                    `srcFixed` or `dstFixed` leaves one end of the arrow to the bench, so the decision is the other end.
 *            steps   the key plays the next step of `play` (`loop` starts again from the first scene)
 *          `meter: true` lets a tap on a carbon–carbon bond lay the length meter on it.
 *   tlead  a clip of a neighbouring case that plays by itself on a predict stage: a play from `thorndata`, or a named scene painter.
 *
 * The state is in hidden dials (`pick`, `src`, `dst`, `step`, `meter`); what the last press of the key showed is in `props.last`.
 */

import { sceneOf, playOf, pairsOf, judgeArrow, bondLengthPm } from '../../engine/thorndata.js';
import { registerFixture } from './thorn-registry.js';
import { C, frameOf, say, title, foot, progress, ease, clamp, fitScenes, pairPoints, drawScene, drawArrow } from './thorn-draw.js';

const STEP_S = 2.2;

/**
 * @param {object} o
 *   scene     the scene shown (default: the first scene of `play`)
 *   play      the reaction this view can run
 *   mode      'show' | 'pick' | 'arrow' | 'steps'
 *   pick      { kind: 'atom' | 'bond', among: [atom ids] or [[a, b], ...] }
 *   arrow     { right: { src, dst }, wrongs: [{ src?, dst?, msg }], srcFixed?, dstFixed?, srcAmong?: [pair ids], dstAmong?: [atom ids] }
 *   pairs     draw the electron pairs
 *   skeletal  draw only the carbon skeleton
 *   meter     tap a carbon–carbon bond to read its length
 *   marks     atom ids ringed (atoms that came from one molecule)
 *   keyLabel  the key's words; `loop` lets a steps view start again
 *   under     a line printed under the drawing (a stated simplification)
 */
export function tmolFixture(id, at, { scene = null, play = null, mode = 'show', pick = null, arrow = null, pairs = false, skeletal = false, meter = false, marks = null, keyLabel = 'Move Electrons', loop = false, under = '', title: ttl = 'Electron view', w = 100, h = 52 } = {}) {
  const P = play ? playOf(play) : null;
  const first = scene || (P ? P.scenes[0] : null);
  if (!sceneOf(first)) throw new Error(`tmol ${id}: no scene "${first}"`);
  const S = sceneOf(first);
  const srcList = arrow ? (arrow.srcAmong || pairsOf(S).map(p => p.id)) : [];
  const dstList = arrow ? (arrow.dstAmong || Object.keys(S.atoms)) : [];
  const pickList = pick ? pick.among : [];
  const bondsCC = meter ? S.bonds.filter(([a, b]) => S.atoms[a].el === 'C' && S.atoms[b].el === 'C').map(([a, b]) => [a, b]) : [];
  const runs = mode === 'arrow' || mode === 'steps';
  const dials = {
    pick: { min: 0, max: Math.max(1, pickList.length), step: 1, value: 0, label: 'Chosen' },
    src: { min: 0, max: Math.max(1, srcList.length), step: 1, value: 0, label: 'Pair' },
    dst: { min: 0, max: Math.max(1, dstList.length), step: 1, value: 0, label: 'Atom' },
    step: { min: 0, max: Math.max(1, P ? P.scenes.length - 1 : 1), step: 1, value: 0, label: 'Step' },
    meter: { min: 0, max: Math.max(1, bondsCC.length), step: 1, value: 0, label: 'Meter' }
  };
  return {
    id, kind: 'tmol', label: ttl, at: { ...at }, size: { w, h }, dials,
    ...(runs ? { runLabel: keyLabel } : { noRun: true }),
    props: {
      scene: first, play, mode, pick, arrow, pairs, skeletal, meter, marks, loop, under, srcList, dstList, pickList, bondsCC,
      hidden: ['pick', 'src', 'dst', 'step', 'meter'],
      last: { n: 0, ok: null, msg: '', src: null, dst: null, from: 0, to: 0 }
    }
  };
}

const dial = (f, name) => Math.round(f.dials[name].value);

/** What the view holds: the thing picked, the arrow as drawn, the step reached and what the last press showed. */
export function molRead(state, id) {
  const f = state.fixtures[id];
  const p = f.props;
  const src = p.arrow?.srcFixed || (dial(f, 'src') ? p.srcList[dial(f, 'src') - 1] : null);
  const dst = p.arrow?.dstFixed || (dial(f, 'dst') ? p.dstList[dial(f, 'dst') - 1] : null);
  const pk = dial(f, 'pick') ? p.pickList[dial(f, 'pick') - 1] : null;
  const m = dial(f, 'meter') ? p.bondsCC[dial(f, 'meter') - 1] : null;
  return {
    picked: pk, src, dst, step: dial(f, 'step'),
    done: p.last.ok === true,
    tried: p.last.n > 0,
    last: p.last,
    metered: m,
    pm: m ? bondLengthPm(p.scene, m[0], m[1]) : null
  };
}

function runMol(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const P = p.play ? playOf(p.play) : null;
  if (p.mode === 'steps') {
    const at = dial(f, 'step'); const end = P.scenes.length - 1;
    if (at >= end) {
      if (!p.loop) return { noop: 'There is no further step.' };
      f.dials.step.value = 0;
      p.last = { ...p.last, n: p.last.n + 1, ok: true, from: end, to: 0, msg: '' };
      return { stamp: {} };
    }
    f.dials.step.value = at + 1;
    p.last = { ...p.last, n: p.last.n + 1, ok: true, from: at, to: at + 1, msg: '' };
    return { stamp: {} };
  }
  if (p.mode !== 'arrow') return null;
  const r = molRead(state, fid);
  if (r.done) return { noop: 'The electrons have moved.' };
  if (!r.src) return { noop: 'Tap a pair of electrons first.' };
  if (!r.dst) return { noop: 'Tap the atom the pair moves to.' };
  const S = sceneOf(p.scene);
  const j = judgeArrow(S, r.src, r.dst, p.arrow.right, p.arrow.wrongs || []);
  if (j.ok) {
    const end = P ? P.scenes.length - 1 : 0;
    f.dials.step.value = end;
    p.last = { n: p.last.n + 1, ok: true, msg: '', src: r.src, dst: r.dst, from: 0, to: end };
  } else {
    p.last = { n: p.last.n + 1, ok: false, msg: j.msg, src: r.src, dst: r.dst, from: 0, to: 0 };
  }
  return { stamp: {} };
}

/* ---- geometry ---- */

function scenesOf(f) {
  const p = f.props;
  const P = p.play ? playOf(p.play) : null;
  return P ? P.scenes.map(sceneOf) : [sceneOf(p.scene)];
}
function geomOf(f) {
  const p = f.props;
  const footH = (p.mode === 'arrow' || p.mode === 'steps' || p.under || p.meter) ? 7 : 2.5;
  const rect = { x: 2.5, y: 6.5, w: f.size.w - 5, h: f.size.h - 6.5 - footH };
  return fitScenes(scenesOf(f), rect);
}
/** The scene a view rests on: the one its step dial has reached. */
function restScene(f) {
  const p = f.props;
  const P = p.play ? playOf(p.play) : null;
  return P ? sceneOf(P.scenes[clamp(dial(f, 'step'), 0, P.scenes.length - 1)]) : sceneOf(p.scene);
}

function molTaps(f) {
  const p = f.props;
  const G = geomOf(f);
  const S = restScene(f);
  const zones = [];
  const zr = Math.max(2.4, G.unit * 0.26);
  const atomZone = (id, dialName, value) => { const a = S.atoms[id]; if (!a) return; zones.push({ x0: G.X(a.x) - zr, x1: G.X(a.x) + zr, y0: G.Y(a.y) - zr, y1: G.Y(a.y) + zr, dial: dialName, value }); };
  if (p.mode === 'pick' && p.pick.kind === 'atom') p.pickList.forEach((id, i) => atomZone(id, 'pick', i + 1));
  if (p.mode === 'pick' && p.pick.kind === 'bond') {
    p.pickList.forEach(([a, b], i) => {
      const A = S.atoms[a]; const B = S.atoms[b];
      const mx = G.X((A.x + B.x) / 2); const my = G.Y((A.y + B.y) / 2);
      zones.push({ x0: mx - zr, x1: mx + zr, y0: my - zr, y1: my + zr, dial: 'pick', value: i + 1 });
    });
  }
  if (p.mode === 'arrow' && p.last.ok !== true) {
    const pts = pairPoints(sceneOf(p.scene));
    const pairZones = [];
    const pr = Math.max(2.2, G.unit * 0.22);
    if (!p.arrow.srcFixed) p.srcList.forEach((id, i) => { const q = pts.find(x => x.id === id); if (q) pairZones.push({ x0: G.X(q.x) - pr, x1: G.X(q.x) + pr, y0: G.Y(q.y) - pr, y1: G.Y(q.y) + pr, dial: 'src', value: i + 1 }); });
    const atomZones = [];
    if (!p.arrow.dstFixed) p.dstList.forEach((id, i) => { const a = sceneOf(p.scene).atoms[id]; atomZones.push({ x0: G.X(a.x) - zr, x1: G.X(a.x) + zr, y0: G.Y(a.y) - zr, y1: G.Y(a.y) + zr, dial: 'dst', value: i + 1 }); });
    // Until a pair is chosen a tap near both takes the pair; once one is, it takes the atom.
    if (dial(f, 'src') || p.arrow.srcFixed) zones.push(...atomZones, ...pairZones); else zones.push(...pairZones, ...atomZones);
  }
  if (p.meter) {
    p.bondsCC.forEach(([a, b], i) => {
      const A = S.atoms[a]; const B = S.atoms[b];
      const mx = G.X((A.x + B.x) / 2); const my = G.Y((A.y + B.y) / 2);
      zones.push({ x0: mx - zr, x1: mx + zr, y0: my - zr, y1: my + zr, dial: 'meter', value: i + 1 });
    });
  }
  return zones;
}

/** Screen point of a pair id (or `a:atom`) in a scene. */
function pointOf(F, G, scene, id) {
  if (id.startsWith('a:')) { const a = scene.atoms[id.slice(2)]; return { x: F.x(G.X(a.x)), y: F.y(G.Y(a.y)) }; }
  const q = pairPoints(scene).find(x => x.id === id);
  return q ? { x: F.x(G.X(q.x)), y: F.y(G.Y(q.y)) } : null;
}
/** Where an arrow ends: at the atom, or (`bond`) midway along the bond the pair is moving into. */
function targetOf(F, G, scene, arrow) {
  const D = scene.atoms[arrow.dst];
  if (!arrow.bond) return { x: F.x(G.X(D.x)), y: F.y(G.Y(D.y)) };
  const pr = pairsOf(scene).find(x => x.id === arrow.src);
  const ends = [scene.atoms[pr.a], scene.atoms[pr.b]];
  const near = ends.sort((u, v) => Math.hypot(u.x - D.x, u.y - D.y) - Math.hypot(v.x - D.x, v.y - D.y))[0];
  return { x: F.x(G.X((near.x + D.x) / 2)), y: F.y(G.Y((near.y + D.y) / 2)) };
}

/**
 * Draw a play part-way: `t` runs from 0 to the number of steps. In the first half of each step the arrows grow and the pairs travel; in
 * the second the atoms take their new places and the bonds change.
 */
export function drawPlay(ctx, F, G, play, t, o = {}) {
  const n = play.scenes.length - 1;
  const seg = clamp(Math.floor(t), 0, Math.max(0, n - 1));
  const local = n ? clamp(t - seg, 0, 1) : 1;
  if (!n || t >= n) { drawScene(ctx, F, G, sceneOf(play.scenes[n]), o); return; }
  const A = sceneOf(play.scenes[seg]); const B = sceneOf(play.scenes[seg + 1]);
  const arrows = play.arrows[seg] || [];
  const moveK = clamp((local - 0.5) / 0.5, 0, 1);
  const flyK = clamp(local / 0.55, 0, 1);
  drawScene(ctx, F, G, A, { ...o, to: B, k: moveK, hide: local < 0.6 ? arrows.map(a => a.src) : [] });
  if (local < 0.62) {
    for (const a of arrows) {
      const from = pointOf(F, G, A, a.src); if (!from) continue;
      drawArrow(ctx, from, targetOf(F, G, A, a), ease(flyK), { r: Math.max(1.3, F.len(G.unit) * 0.05), pairColor: a.src.startsWith('p:') ? C.pi : C.e });
    }
  }
}

function paintMol(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const G = geomOf(f);
  const r = molRead(state, f.id);
  const P = p.play ? playOf(p.play) : null;
  title(ctx, f, F, b);
  const base = { pairs: p.pairs, skeletal: p.skeletal, marks: p.marks };
  const lit = [];
  if (r.picked) lit.push(Array.isArray(r.picked) ? `b:${r.picked[0]}-${r.picked[1]}` : `a:${r.picked}`);
  if (r.metered) lit.push(`b:${r.metered[0]}-${r.metered[1]}`);

  const k = progress(`${f.id}:move`, b, p.last.n, p.last.ok ? Math.max(1, Math.abs(p.last.to - p.last.from)) * STEP_S : 1.6);
  if (p.mode === 'steps' && P) {
    const from = p.last.from; const to = p.last.to;
    if (p.last.n && to > from && k < 1) drawPlay(ctx, F, G, P, from + (to - from) * k, base);
    else drawScene(ctx, F, G, restScene(f), { ...base, lit });
  } else if (p.mode === 'arrow') {
    const S = sceneOf(p.scene);
    if (p.last.ok === true && P) {
      drawPlay(ctx, F, G, P, (P.scenes.length - 1) * k, base);
    } else {
      const chosen = [];
      if (r.src && !(p.last.ok === false && k < 1)) chosen.push(r.src);
      if (r.dst) chosen.push(`a:${r.dst}`);
      const flying = p.last.ok === false && k < 1;
      drawScene(ctx, F, G, S, { ...base, lit: chosen, hide: flying ? [p.last.src] : [] });
      const from = r.src ? pointOf(F, G, S, r.src) : null;
      const to = r.dst ? { x: F.x(G.X(S.atoms[r.dst].x)), y: F.y(G.Y(S.atoms[r.dst].y)) } : null;
      // The arrow as drawn so far; a move that failed sends the pair out and brings it back.
      if (from && to) {
        const out = flying ? (k < 0.5 ? ease(k / 0.5) * 0.8 : ease((1 - k) / 0.5) * 0.8) : 1;
        if (flying) drawArrow(ctx, from, to, out, { color: C.dim, r: Math.max(1.3, F.len(G.unit) * 0.05), pairColor: r.src.startsWith('p:') ? C.pi : C.e });
        else drawArrow(ctx, from, to, 1, { color: C.amber, r: 0.01 });
      }
    }
  } else {
    drawScene(ctx, F, G, restScene(f), { ...base, lit });
  }

  // The meter's reading, by the bond it lies on.
  if (r.metered) {
    const S = restScene(f);
    const A = S.atoms[r.metered[0]]; const B = S.atoms[r.metered[1]];
    const mx = (A.x + B.x) / 2; const my = (A.y + B.y) / 2;
    // Outside the ring, clear of the pairs drawn inside it.
    const all = Object.values(S.atoms); const gx = all.reduce((t, a) => t + a.x, 0) / all.length; const gy = all.reduce((t, a) => t + a.y, 0) / all.length;
    const out = Math.hypot(mx - gx, my - gy) || 1;
    say(ctx, `${r.pm} pm`, F.x(G.X(mx + ((mx - gx) / out) * 0.85)), F.y(G.Y(my + ((my - gy) / out) * 0.85)), F.size(2.1, 7), { align: 'center', color: C.amber, weight: 700 });
  }

  // The foot: what the last press showed, or how to use the view.
  const right = f.runLabel ? Math.max(9, f.runLabel.length * 1.9 + 3) + 3 : 0;
  if (p.mode === 'arrow') {
    if (p.last.ok === false) foot(ctx, f, F, p.last.msg, C.amber, right);
    else if (p.last.ok === true) foot(ctx, f, F, p.under || 'The electrons have moved.', C.phosphor, right);
    else if (!r.src) foot(ctx, f, F, 'Tap a pair of electrons', C.dust, right);
    else if (!r.dst) foot(ctx, f, F, 'Tap the atom it moves to', C.dust, right);
    else foot(ctx, f, F, `Press "${f.runLabel}"`, C.dust, right);
  } else if (p.meter && !r.metered) foot(ctx, f, F, 'Tap a bond between two carbons to measure it', C.dust, right);
  else if (p.under) foot(ctx, f, F, p.under, C.dust, right);
}

registerFixture('tmol', { paint: paintMol, run: runMol, tapZones: molTaps, live: () => true });

/** Script actions for an arrow view: choose the pair, choose the atom. */
export function arrowScript(fixtureSpec, src, dst) {
  const p = fixtureSpec.props; const out = [];
  if (src && !p.arrow.srcFixed) out.push({ setDial: { fixture: fixtureSpec.id, dial: 'src', value: p.srcList.indexOf(src) + 1 } });
  if (dst && !p.arrow.dstFixed) out.push({ setDial: { fixture: fixtureSpec.id, dial: 'dst', value: p.dstList.indexOf(dst) + 1 } });
  out.push({ run: fixtureSpec.id });
  return out;
}
/** Script action for a pick view. */
export function pickScript(fixtureSpec, what) {
  const p = fixtureSpec.props;
  const i = p.pickList.findIndex(x => (Array.isArray(x) ? x[0] === what[0] && x[1] === what[1] : x === what));
  return { setDial: { fixture: fixtureSpec.id, dial: 'pick', value: i + 1 } };
}

/* ================================================================== tlead */

const LEAD_SCENES = {};
/** Register a named clip painter: `(ctx, f, F, t)` with `t` the running clock in seconds. */
export const addLeadScene = (name, fn) => { LEAD_SCENES[name] = fn; };

/** A clip on a predict stage: `play` (a `thorndata` reaction, looping) or `scene` (a named painter). */
export function tleadFixture(id, at, { play = null, scene = null, caption = '', pairs = true, title: ttl = 'Watch first', w = 62, h = 34 } = {}) {
  return { id, kind: 'tlead', label: ttl, at: { ...at }, size: { w, h }, noRun: true, dials: {}, props: { play, scene, caption, pairs } };
}

function paintLead(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  title(ctx, f, F, b);
  const t = b.clock > 0 ? b.clock : 1e6;
  if (p.caption) say(ctx, p.caption, F.x(2.2), F.y(f.size.h - 3), F.size(1.85, 6.2), { color: C.dust, maxW: F.len(f.size.w - 4.4) });
  if (p.scene && LEAD_SCENES[p.scene]) { LEAD_SCENES[p.scene](ctx, f, F, t); return; }
  const P = playOf(p.play);
  if (!P) return;
  const G = fitScenes(P.scenes.map(sceneOf), { x: 2.5, y: 6.5, w: f.size.w - 5, h: f.size.h - 13 });
  const n = P.scenes.length - 1;
  const period = n * STEP_S + 2.4;
  const tt = b.clock > 0 ? (t % period) : period;
  drawPlay(ctx, F, G, P, Math.min(n, Math.max(0, tt - 0.8) / STEP_S), { pairs: p.pairs });
}
registerFixture('tlead', { paint: paintLead, live: () => true });
