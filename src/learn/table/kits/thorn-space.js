/**
 * kits/thorn-space.js — Thornmere's two instruments whose idea is position in space (Isomers, q3), each a model drawn in 3D and turned:
 *
 *   twist   a test on the test rig (`ttest`, test 'twist'): two carbons and what each holds, seen in perspective. "Twist" turns the far
 *           carbon about the bond. A single bond turns, and the model stays turned half way round. A double bond's second pair lies in two
 *           halves, above and below the bond: as the far end turns the halves come apart, and the end springs back. Once it has, the rig
 *           draws beside it the form with the far end turned over, so the student can compare the two.
 *   tmirror a carbon holding four groups, beside its mirror image. "Next Turn" turns the image to the next of the twelve ways a
 *           tetrahedron can be turned onto itself; groups of the image that land on the same group of the original light up, and the
 *           rig counts them ("2 of 4 in place") and the turns tried. A holder takes a sample card where the bench offers several.
 *
 * Both are pure functions of the state and `b.clock`: the angle drawn comes from the last press and the time since.
 */

import { substance, addSubstances, TETRA, TETRA_TURNS, mirrorOf, mirrorMatches } from '../../engine/thorndata.js';
import { registerFixture } from './thorn-registry.js';
import { C, ATOM_INK, frameOf, say, title, foot, progress, ease, clamp, lerp } from './thorn-draw.js';
import { addTest, testDef } from './thorn-test.js';
import { addLeadScene } from './thorn-mol.js';
import { addTourText } from '../tour.js';

/* ------------------------------------------------------------------ the samples these instruments hold */

/**
 * `ends` for the twist: the groups on the near carbon and on the far carbon, and the order of the bond between them. A carbon of a
 * single bond holds three groups, of a double bond two. `groups` for the mirror: the four groups round one carbon.
 */
addSubstances({
  dichloroethane: { name: '1,2-Dichloroethane', formula: 'C₂H₄Cl₂', ene: false, ends: { order: 1, near: ['Cl', 'H', 'H'], far: ['Cl', 'H', 'H'] } },
  dichloroethene12: { name: '1,2-Dichloroethene', formula: 'C₂H₂Cl₂', ene: true, ends: { order: 2, near: ['Cl', 'H'], far: ['Cl', 'H'] } },
  dichloroethene11: { name: '1,1-Dichloroethene', formula: 'C₂H₂Cl₂', ene: true, ends: { order: 2, near: ['Cl', 'Cl'], far: ['H', 'H'] } },
  bromochlorofluoromethane: { name: 'CHFClBr', formula: 'CHFClBr', ene: false, groups: ['H', 'F', 'Cl', 'Br'] },
  dichloromethane: { name: 'Dichloromethane', formula: 'CH₂Cl₂', ene: false, groups: ['Cl', 'H', 'H', 'Cl'] },
  bromochloromethane: { name: 'Bromochloromethane', formula: 'CH₂BrCl', ene: false, groups: ['Br', 'H', 'H', 'Cl'] },
  chloroethanol: { name: '1-Chloroethanol', formula: 'C₂H₅ClO', ene: false, groups: ['H', 'CH₃', 'OH', 'Cl'] },
  chloropropane: { name: '2-Chloropropane', formula: 'C₃H₇Cl', ene: false, groups: ['CH₃', 'H', 'Cl', 'CH₃'] },
  bromobutane: { name: '2-Bromobutane', formula: 'C₄H₉Br', ene: false, groups: ['H', 'CH₃', 'Br', 'C₂H₅'] }
});

/* ------------------------------------------------------------------ projection */

const TILT = 0.5; const YAW = -0.35;
/** A point in the model (x along the bond, y up, z toward the viewer) as seen by the rig, slightly from above and from the side. */
export function project([x, y, z]) {
  const y2 = y * Math.cos(TILT) - z * Math.sin(TILT); const z2 = y * Math.sin(TILT) + z * Math.cos(TILT);
  const x3 = x * Math.cos(YAW) + z2 * Math.sin(YAW); const z3 = -x * Math.sin(YAW) + z2 * Math.cos(YAW);
  return { x: x3, y: y2, z: z3 };
}
const rotX = ([x, y, z], a) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];

const groupInk = g => ATOM_INK[g] || (g === 'OH' ? ATOM_INK.O : ATOM_INK.C);
function ball(ctx, F, p, r, g, o = {}) {
  const ink = groupInk(g);
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.fillStyle = ink.fill; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = o.lit ? C.amber : ink.ring; ctx.lineWidth = o.lit ? 2.4 : 1; ctx.beginPath(); ctx.arc(p.x, p.y, r + (o.lit ? 1.5 : 0), 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
  say(ctx, g, p.x, p.y + 0.5, Math.max(6.5, r * (g.length > 2 ? 0.62 : g.length > 1 ? 0.8 : 1.05)), { align: 'center', color: ink.text, weight: 800, sans: true });
  ctx.globalAlpha = 1;
}
const stick = (ctx, a, b, w = 1.6, color = C.bond, alpha = 1) => { ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.lineWidth = 1; ctx.globalAlpha = 1; };

/* ------------------------------------------------------------------ the twist */

/** Where each group of a two-carbon model stands, in model units, with the far end turned by `a` (radians). Pure; the checks read it. */
export function twistModel(ends, a) {
  const L = 0.75;
  const near = { at: [-L, 0, 0] }; const far = { at: [L, 0, 0] };
  const place = (groups, sign, turn) => groups.map((g, i) => {
    // Three groups on a single-bonded carbon stand at 120° round the bond and lean back from it; two on a double-bonded carbon stand in
    // the plane of the page, up and down.
    const ang = groups.length === 3 ? (Math.PI / 2) + i * (2 * Math.PI / 3) : (i === 0 ? Math.PI / 2 : -Math.PI / 2);
    const lean = groups.length === 3 ? 0.42 : 0.62;
    const p = [sign * (L + lean), 0.95 * Math.sin(ang), 0.95 * Math.cos(ang) * (groups.length === 3 ? 1 : 0)];
    const q = turn ? rotX([p[0], p[1], p[2]], turn) : p;
    return { g, at: q };
  });
  return { near, far, nearGroups: place(ends.near, -1, 0), farGroups: place(ends.far, 1, a), order: ends.order };
}

/** How the far end has turned `k` (0 to 1) after a press: a single bond goes half way round and stays; a double bond springs back. */
export function twistAngle(order, k) {
  if (order === 1) return Math.PI * ease(k);
  const up = clamp(k / 0.45, 0, 1); const back = clamp((k - 0.55) / 0.3, 0, 1);
  return (Math.PI / 2) * ease(up) * (1 - ease(back));
}

export function drawTwist(ctx, F, cx, cy, u, ends, a, o = {}) {
  const M = twistModel(ends, a);
  const P = v => { const p = project(v); return { x: F.x(cx + p.x * u), y: F.y(cy - p.y * u), z: p.z }; };
  const n = P(M.near.at); const f = P(M.far.at);
  const alpha = o.alpha ?? 1;
  // The bond, then (for a double bond) its second pair in two halves, above and below, one half on each carbon's side.
  stick(ctx, n, f, Math.max(1.6, F.len(u) * 0.06), C.bond, alpha);
  if (M.order === 2) {
    const off = 0.48;
    const nearUp = P([-0.3, 0, off]); const nearDn = P([-0.3, 0, -off]);
    // A form made again with its far end turned over (`o.remade`) has its second pair whole again, lying as it always does.
    const pa = o.remade ? 0 : a;
    const farUp = P(rotX([0.3, 0, off], pa)); const farDn = P(rotX([0.3, 0, -off], pa));
    const gap = Math.abs(Math.sin(pa));
    ctx.globalAlpha = alpha * (1 - 0.6 * gap);
    ctx.strokeStyle = C.pi; ctx.lineWidth = Math.max(1.4, F.len(u) * 0.05); ctx.setLineDash(gap > 0.5 ? [2, 3] : []);
    for (const [x0, x1] of [[nearUp, farUp], [nearDn, farDn]]) { ctx.beginPath(); ctx.moveTo(x0.x, x0.y); ctx.lineTo(x1.x, x1.y); ctx.stroke(); }
    ctx.setLineDash([]); ctx.lineWidth = 1; ctx.globalAlpha = alpha;
    const r = Math.max(1.4, F.len(u) * 0.055);
    ctx.fillStyle = C.pi;
    for (const q of [nearUp, nearDn, farUp, farDn]) { ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  // Groups, farthest first, then the carbons.
  const items = [
    ...M.nearGroups.map(q => ({ q, from: n })), ...M.farGroups.map(q => ({ q, from: f }))
  ].map(it => ({ ...it, p: P(it.q.at) })).sort((x, y) => x.p.z - y.p.z);
  for (const it of items) stick(ctx, it.from, it.p, Math.max(1.3, F.len(u) * 0.045), C.bond, alpha);
  for (const it of items) ball(ctx, F, it.p, Math.max(4, F.len(u) * (it.q.g === 'H' ? 0.19 : 0.27)), it.q.g, { alpha });
  for (const c of [n, f]) ball(ctx, F, c, Math.max(4.5, F.len(u) * 0.27), 'C', { alpha });
}

addTest('twist', {
  title: 'Twist rig',
  key: 'Twist',
  result: sub => (substance(sub).ends.order === 1 ? 'turned' : 'sprang back'),
  line: res => (res === 'turned' ? 'The far end turned and stayed turned' : 'The far end sprang back'),
  short: res => res,
  seconds: () => 4.2,
  paint(ctx, f, F, { sub, k, loaded }) {
    const wx = 3; const wy = 7; const ww = f.size.w - 6; const wh = f.size.h - 15;
    ctx.fillStyle = C.win; ctx.fillRect(F.x(wx), F.y(wy), F.len(ww), F.len(wh));
    ctx.strokeStyle = C.steel; ctx.strokeRect(Math.round(F.x(wx)) + 0.5, Math.round(F.y(wy)) + 0.5, Math.round(F.len(ww)), Math.round(F.len(wh)));
    const show = sub || loaded;
    if (!show) { say(ctx, 'The molecule, turned in space', F.x(wx + ww / 2), F.y(wy + wh / 2), F.size(1.8, 6), { align: 'center', color: C.dim }); return; }
    const S = substance(show);
    const a = sub ? twistAngle(S.ends.order, k) : 0;
    const done = sub && k >= 1 && S.ends.order === 2;
    const u = Math.min(wh * 0.3, ww * 0.16);
    drawTwist(ctx, F, wx + ww * (done ? 0.27 : 0.5), wy + wh * 0.52, u, S.ends, a);
    if (done) {
      // The form with the far end turned over (by breaking the bond and making it again), for comparison.
      drawTwist(ctx, F, wx + ww * 0.75, wy + wh * 0.52, u, S.ends, Math.PI, { alpha: 0.9, remade: true });
      say(ctx, 'As it is', F.x(wx + ww * 0.27), F.y(wy + 2.6), F.size(1.6, 6), { align: 'center', color: C.dust });
      say(ctx, 'Far end turned over', F.x(wx + ww * 0.75), F.y(wy + 2.6), F.size(1.6, 6), { align: 'center', color: C.dust });
    }
    say(ctx, S.ends.order === 2 ? 'Rust: the second pair, in two halves' : 'One shared pair', F.x(wx + 1.5), F.y(wy + wh - 2.2), F.size(1.5, 6), { color: C.dim, maxW: F.len(ww - 3) });
  }
});

/* ------------------------------------------------------------------ the mirror */

/**
 * The corners of the tetrahedron as the rig draws them. `TETRA`'s mirror plane (z = 0, which swaps corners 2 and 3, as `mirrorOf` does)
 * is turned to stand upright on the screen, so the image drawn on the same corners with corners 2 and 3 swapped is exactly the molecule
 * reflected in the dashed mirror line between the two.
 */
const VIEW = TETRA.map(([x, y, z]) => [z, y, -x]);
/** Seen a little from above, and square-on so left and right stay mirror images of each other. */
const projectUpright = ([x, y, z]) => ({ x, y: y * Math.cos(-0.6) - z * Math.sin(-0.6), z: y * Math.sin(-0.6) + z * Math.cos(-0.6) });
/** The image's corner `c` after turn `t`: it is drawn where the original's corner `TETRA_TURNS[t][c]` is. */
const imageCorner = (t, c) => TETRA_TURNS[t][c];

function drawTetra(ctx, F, cx, cy, u, groups, posOf, { lit = [] } = {}) {
  const P = v => { const p = projectUpright(v); return { x: F.x(cx + p.x * u), y: F.y(cy - p.y * u), z: p.z }; };
  const c = P([0, 0, 0]);
  const pts = groups.map((g, i) => ({ g, i, p: P(posOf(i)) })).sort((a, b) => a.p.z - b.p.z);
  const back = pts.filter(q => q.p.z < 0); const front = pts.filter(q => q.p.z >= 0);
  // Depth: a group nearer the viewer is drawn larger, on a thicker bond; one farther away smaller, on a thinner one.
  const near = q => 1 + 0.32 * q.p.z;
  const one = q => { stick(ctx, c, q.p, Math.max(1, F.len(u) * 0.05 * near(q) * near(q))); ball(ctx, F, q.p, Math.max(4, F.len(u) * 0.24 * near(q)), q.g, { lit: lit.includes(q.i) }); };
  back.forEach(one);
  ball(ctx, F, c, Math.max(4.5, F.len(u) * 0.22), 'C');
  front.forEach(one);
}
const slerpish = (a, b, k) => { const v = [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; const L = Math.hypot(...v) || 1; return v.map(x => x / L); };

/**
 * Draw an original and its turned mirror image in `rect`. `t` the turn the image rests on; `from` the turn it is leaving and `k` how far.
 */
export function drawMirrorPair(ctx, F, rect, groups, t, { from = t, k = 1, light = true } = {}) {
  const img = mirrorOf(groups);
  const u = Math.min(rect.h * 0.36, rect.w * 0.17);
  const cy = rect.y + rect.h * 0.52;
  // The original on the left, the mirror between, the image on the right.
  drawTetra(ctx, F, rect.x + rect.w * 0.25, cy, u, groups, i => VIEW[i]);
  ctx.strokeStyle = C.steel; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(F.x(rect.x + rect.w / 2), F.y(rect.y + 1)); ctx.lineTo(F.x(rect.x + rect.w / 2), F.y(rect.y + rect.h - 1)); ctx.stroke(); ctx.setLineDash([]);
  const settled = k >= 1;
  const lit = light && settled ? img.map((g, c) => (g === groups[imageCorner(t, c)] ? c : -1)).filter(c => c >= 0) : [];
  // The image stands on the same corners, so a group that lands on its match stands where the original's does.
  drawTetra(ctx, F, rect.x + rect.w * 0.75, cy, u, img, c => {
    const a = VIEW[imageCorner(from, c)]; const b = VIEW[imageCorner(t, c)];
    return settled ? b : slerpish(a, b, ease(k));
  }, { lit });
}

/**
 * @param {object} o `groups` a fixed molecule's four groups, or `holder: true` for a sample card's; `title`, `w`, `h`.
 */
export function tmirrorFixture(id, at, { groups = null, sub = null, holder = false, title: ttl = 'Mirror rig', w = 100, h = 50 } = {}) {
  const slotId = `${id}.holder`;
  const fixture = {
    id, kind: 'tmirror', label: ttl, at: { ...at }, size: { w, h }, runLabel: 'Next Turn',
    dials: { turn: { min: 0, max: TETRA_TURNS.length - 1, step: 1, value: 0, label: 'Turn' } },
    props: { groups, sub, holder: holder ? slotId : null, hidden: ['turn'], last: { n: 0, from: 0, to: 0 }, tried: {}, seen: null }
  };
  return holder ? { fixture, slot: { id: slotId, label: 'Sample', at: { x: at.x - w / 2 - 11, y: at.y }, size: { w: 19, h: 12 } } } : fixture;
}

const seated = (state, slotId) => (slotId ? Object.values(state.pieces).find(p => p.zone === `slot:${slotId}`) || null : null);
function mirrorSubject(state, f) {
  if (!f.props.holder) return { sub: f.props.sub, groups: f.props.groups, card: null };
  const card = seated(state, f.props.holder);
  return card ? { sub: card.props.sub, groups: substance(card.props.sub)?.groups || null, card } : { sub: null, groups: null, card: null };
}

/** What the rig shows: the molecule, the turn the image rests on, how many groups are in place, how many turns have been tried. */
export function mirrorRead(state, id) {
  const f = state.fixtures[id];
  const { sub, groups, card } = mirrorSubject(state, f);
  const t = Math.round(f.dials.turn.value);
  const tried = (sub && f.props.tried[sub]) || [];
  return { sub, groups, card, turn: t, inPlace: groups ? mirrorMatches(groups, t) : 0, tried: tried.length, best: tried.length ? Math.max(...tried.map(x => mirrorMatches(groups, x))) : 0 };
}

function runMirror(state, fid) {
  const f = state.fixtures[fid];
  const { sub, groups, card } = mirrorSubject(state, f);
  if (!groups) return { noop: 'There is no sample card in the Sample slot.' };
  const key = sub || 'fixed';
  const tried = f.props.tried[key] || [0];
  if (tried.length >= TETRA_TURNS.length) return { noop: 'Every one of the twelve turns has been tried.' };
  const from = Math.round(f.dials.turn.value);
  // The next turn not yet tried, in order.
  let next = 0; while (tried.includes(next)) next++;
  f.dials.turn.value = next;
  f.props.tried = { ...f.props.tried, [key]: [...tried, next] };
  f.props.last = { n: f.props.last.n + 1, from, to: next };
  if (card) {
    const best = Math.max(...[...tried, next].map(x => mirrorMatches(groups, x)));
    card.props.res = { ...(card.props.res || {}), mirror: best };
  }
  return { stamp: {} };
}

function settleMirror(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'tmirror' || !f.props.holder) continue;
    // A new card in the Sample slot starts its image as the plain mirror image, with its own count of turns.
    const { sub } = mirrorSubject(state, f);
    if (!sub || sub === f.props.seen) continue;
    f.props.seen = sub;
    const tried = f.props.tried[sub];
    const want = tried && tried.length ? tried[tried.length - 1] : 0;
    f.dials.turn.value = want; f.props.last = { n: f.props.last.n, from: want, to: want };
  }
}

function paintMirror(ctx, f, state, b) {
  const F = frameOf(b);
  const r = mirrorRead(state, f.id);
  title(ctx, f, F, b);
  const rect = { x: 3, y: 7, w: f.size.w - 6, h: f.size.h - 15 };
  ctx.fillStyle = C.win; ctx.fillRect(F.x(rect.x), F.y(rect.y), F.len(rect.w), F.len(rect.h));
  ctx.strokeStyle = C.steel; ctx.strokeRect(Math.round(F.x(rect.x)) + 0.5, Math.round(F.y(rect.y)) + 0.5, Math.round(F.len(rect.w)), Math.round(F.len(rect.h)));
  const right = Math.max(9, f.runLabel.length * 1.9 + 3) + 3;
  if (!r.groups) { say(ctx, 'A molecule and its mirror image', F.x(rect.x + rect.w / 2), F.y(rect.y + rect.h / 2), F.size(1.8, 6), { align: 'center', color: C.dim }); foot(ctx, f, F, 'Lay a sample card in the Sample slot', C.dust, right); return; }
  const k = progress(`${f.id}:turn`, b, f.props.last.n, 1.4);
  drawMirrorPair(ctx, F, rect, r.groups, r.turn, { from: f.props.last.from, k });
  say(ctx, 'Molecule', F.x(rect.x + rect.w * 0.25), F.y(rect.y + 2.6), F.size(1.6, 6), { align: 'center', color: C.dust });
  say(ctx, 'Mirror image, turned', F.x(rect.x + rect.w * 0.75), F.y(rect.y + 2.6), F.size(1.6, 6), { align: 'center', color: C.dust });
  const turns = Math.max(1, r.tried);
  foot(ctx, f, F, k < 1 ? 'Turning…' : `${r.inPlace} of 4 in place · turns tried: ${turns} of 12`, k < 1 ? C.dust : C.text, right);
}

registerFixture('tmirror', { paint: paintMirror, run: runMirror, settle: settleMirror, live: () => true });

/** The predict clip: dichloromethane beside its mirror image, turned until every group stands on its match. */
addLeadScene('mirror-ch2cl2', (ctx, f, F, t) => {
  const groups = substance('dichloromethane').groups;
  const seq = [0, ...turnsToMatch(groups)];
  const hold = 1.6;
  const period = seq.length * hold + 2.4; const tt = t > 1e5 ? period - 0.01 : t % period;
  const step = Math.min(seq.length - 1, Math.floor(tt / hold));
  const k = step === 0 ? 1 : clamp((tt - step * hold) / 1.0, 0, 1);
  drawMirrorPair(ctx, F, { x: 2.5, y: 6.5, w: f.size.w - 5, h: f.size.h - 13 }, groups, seq[step], { from: seq[Math.max(0, step - 1)], k });
});

/** The turns a script presses to reach a turn where the image matches (for checks). */
export function turnsToMatch(groups) { return turnsToMatchOf(groups); }
const turnsToMatchOf = groups => { const out = []; for (let x = 1; x < TETRA_TURNS.length; x++) { out.push(x); if (mirrorMatches(groups, x) === 4) return out; } return null; };

/* A card that has been in the mirror rig prints the most groups any turn put in place. */
addTest('mirror', { title: 'Mirror rig', key: 'Next Turn', result: () => null, line: () => '', short: v => `best ${v} of 4`, paint() {} });

addTourText({
  'thorn:tmirror': {
    title: 'Mirror rig', dials: false,
    text: 'Press "Next Turn" to rotate the mirror image and test whether groups align.'
  }
}, {});

export { testDef };
