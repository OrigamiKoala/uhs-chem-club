/**
 * kits/thorn-test.js — Thornmere's test rig (`ttest`) and its sample cards (`tcard`).
 *
 *   ttest   one sample holder, one key, a window that shows what the particles do, and a line that says what was seen. Which test it runs
 *           is `props.test`; each test is registered with `addTest(name, def)` by the bench file that needs it, so no two builders edit
 *           one list. The card keeps what its test showed.
 *   tcard   a card naming one substance (or, sealed, only its formula).
 *
 * A test: `{ key, result(sub), line(res), short(res), seconds(res, sub), paint(ctx, f, F, { sub, res, k, b }) }`. `result` comes from the
 * planner in `thorndata.js`; `paint` draws the window for the sample last tested, `k` running 0 to 1 after the key is pressed.
 */

import { substance, bromineFades, playOf, sceneOf } from '../../engine/thorndata.js';
import { registerFixture, registerPiece } from './thorn-registry.js';
import { C, frameOf, say, title, foot, progress, fitScenes, lerp, clamp } from './thorn-draw.js';
import { drawPlay, addLeadScene } from './thorn-mol.js';

const TESTS = {};
export const addTest = (name, def) => { TESTS[name] = def; };
export const testDef = name => TESTS[name] || null;

const seated = (state, slotId) => Object.values(state.pieces).find(p => p.zone === `slot:${slotId}`) || null;

/** @param {object} o `test` the test's name; `only` the substances in store (others cannot be tested); `title`, `w`, `h`. */
export function ttestFixture(id, at, { test, only = null, title: ttl = null, w = 86, h = 46 } = {}) {
  const T = TESTS[test];
  if (!T) throw new Error(`ttest ${id}: no test "${test}"`);
  const slotId = `${id}.holder`;
  return {
    fixture: {
      id, kind: 'ttest', label: ttl || T.title, at: { ...at }, size: { w, h }, dials: {}, runLabel: T.key,
      props: { test, slot: slotId, only, last: { n: 0, sub: null, res: null, refused: '' } }
    },
    slot: { id: slotId, label: 'Sample', at: { x: at.x - w / 2 - 11, y: at.y }, size: { w: 19, h: 12 } }
  };
}

/** What the rig holds and has shown: the seated card, its substance, and each card's kept result for this rig's test. */
export function testRead(state, id) {
  const f = state.fixtures[id];
  const card = seated(state, f.props.slot);
  const results = {};
  for (const p of Object.values(state.pieces)) if (p.kind === 'tcard' && p.props.res && p.props.res[f.props.test] !== undefined) results[p.id] = p.props.res[f.props.test];
  return { card, sub: card ? card.props.sub : null, last: f.props.last, results };
}
/** The kept result of one card for a test (undefined if it was never tested). */
export const resultOf = (state, cardId, test) => state.pieces[cardId]?.props?.res?.[test];

function runTest(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const card = seated(state, p.slot);
  if (!card) return { noop: 'There is no sample in the holder.' };
  if (p.only && !p.only.includes(card.props.sub)) {
    p.last = { n: p.last.n + 1, sub: null, res: null, refused: 'None of that sample is in store.' };
    return { stamp: {} };
  }
  const res = TESTS[p.test].result(card.props.sub);
  card.props.res = { ...(card.props.res || {}), [p.test]: res };
  p.last = { n: p.last.n + 1, sub: card.props.sub, res, refused: '' };
  return { stamp: {} };
}

function paintTest(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const T = TESTS[p.test];
  const r = testRead(state, f.id);
  title(ctx, f, F, b);
  const right = Math.max(9, f.runLabel.length * 1.9 + 3) + 3;
  // The window shows the sample last tested while it is still in the holder.
  const showing = r.card && p.last.sub && r.card.props.sub === p.last.sub;
  const k = showing ? progress(`${f.id}:run`, b, p.last.n, T.seconds ? T.seconds(p.last.res, p.last.sub) : 3) : 0;
  T.paint(ctx, f, F, { sub: showing ? p.last.sub : null, res: showing ? p.last.res : null, k, b, loaded: r.card ? r.card.props.sub : null });
  if (p.last.refused && r.card && !showing) foot(ctx, f, F, p.last.refused, C.amber, right);
  else if (showing && k >= 1) foot(ctx, f, F, T.line(p.last.res), C.text, right);
  else if (!r.card) foot(ctx, f, F, 'Lay a sample card in the holder', C.dust, right);
  else if (!showing) foot(ctx, f, F, `Press "${f.runLabel}"`, C.dust, right);
}

registerFixture('ttest', { paint: paintTest, run: runTest, live: () => true });

/* ------------------------------------------------------------------ the bromine test */

/** A jar: outline, liquid of `color`, a name under it. */
export function jar(ctx, F, x, y, w, h, color, label) {
  ctx.fillStyle = color; ctx.fillRect(F.x(x), F.y(y + h * 0.22), F.len(w), F.len(h * 0.78));
  ctx.strokeStyle = '#cfd8de'; ctx.lineWidth = 1.5; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h))); ctx.lineWidth = 1;
  if (label) say(ctx, label, F.x(x + w / 2), F.y(y + h + 2.6), F.size(1.75, 6), { align: 'center', color: C.dust });
}
const mix = (a, b, k) => {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)); const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`;
};

addTest('bromine', {
  title: 'Bromine test',
  key: 'Add Bromine Water',
  result: sub => (bromineFades(sub) ? 'colourless' : 'orange'),
  line: res => (res === 'colourless' ? 'The jar is colourless' : 'The jar is still orange'),
  short: res => (res === 'colourless' ? 'colourless' : 'orange'),
  seconds: res => (res === 'colourless' ? 5.2 : 3),
  paint(ctx, f, F, { sub, res, k, loaded }) {
    const jx = 4; const jy = 9; const jw = 11; const jh = f.size.h - 21;
    const faded = res === 'colourless' ? clamp((k - 0.75) / 0.25, 0, 1) : 0;
    jar(ctx, F, jx, jy, jw, jh, sub ? mix(C.orange, C.clear, faded) : loaded ? C.clear : C.win, sub ? (faded >= 1 ? 'Colourless' : 'Orange') : loaded ? 'Sample' : 'Empty');
    // The window: one place in the sample, much enlarged.
    const wx = jx + jw + 5; const wy = 7; const ww = f.size.w - wx - 3; const wh = f.size.h - 15;
    ctx.fillStyle = C.win; ctx.fillRect(F.x(wx), F.y(wy), F.len(ww), F.len(wh));
    ctx.strokeStyle = C.steel; ctx.strokeRect(Math.round(F.x(wx)) + 0.5, Math.round(F.y(wy)) + 0.5, Math.round(F.len(ww)), Math.round(F.len(wh)));
    if (!sub) { say(ctx, 'Inside the jar, enlarged', F.x(wx + ww / 2), F.y(wy + wh / 2), F.size(1.8, 6), { align: 'center', color: C.dim }); return; }
    const P = playOf(res === 'colourless' ? 'br2-ene' : 'br2-ane');
    const G = fitScenes(P.scenes.map(sceneOf), { x: wx + 1, y: wy + 1, w: ww - 2, h: wh - 2 }, 9.5);
    const n = P.scenes.length - 1;
    drawPlay(ctx, F, G, P, Math.min(n, (k / (res === 'colourless' ? 0.78 : 1)) * n), { pairs: true });
  }
});

/** The clip before the bromine test: bromine water is orange, and where its bromine bonds to a sample's molecules the colour goes. */
addLeadScene('bromine-water', (ctx, f, F, t) => {
  const period = 7; const tt = t > 1e5 ? period : t % period;
  const k = clamp((tt - 2.2) / 2.6, 0, 1);
  const jx = 6; const jy = 8; const jw = 14; const jh = f.size.h - 20;
  jar(ctx, F, jx, jy, jw, jh, mix(C.orange, C.clear, k), 'Bromine water');
  // Bromine molecules (pairs of atoms) meet molecules of a sample and bond to them.
  const wx = jx + jw + 6; const ww = f.size.w - wx - 3;
  for (let i = 0; i < 4; i++) {
    const sx = wx + 4 + (i % 2) * (ww * 0.5); const sy = 12 + Math.floor(i / 2) * 9;
    ctx.fillStyle = '#5a554d'; ctx.fillRect(F.x(sx), F.y(sy), F.len(ww * 0.3), F.len(3.2));
    const bx = sx + ww * 0.15; const from = sy - 4.5 - (i % 2); const y = lerp(from, sy - 0.9, k);
    const gap = lerp(1.1, 2.6, k);
    ctx.fillStyle = '#b07a3a';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(F.x(bx + s * gap), F.y(y), Math.max(2, F.len(1)), 0, Math.PI * 2); ctx.fill(); }
    if (k < 0.5) { ctx.strokeStyle = '#b07a3a'; ctx.beginPath(); ctx.moveTo(F.x(bx - gap), F.y(y)); ctx.lineTo(F.x(bx + gap), F.y(y)); ctx.stroke(); }
  }
});

/* ------------------------------------------------------------------ sample cards */

export const TCARD_RECT = Object.freeze({ hw: 10, hh: 5.2 });
/**
 * A sample card. `face: 'formula'` prints only the formula (a sealed sample); `text` replaces the name. The card prints, small, what each
 * test showed for it.
 */
export const tcard = (id, sub, at, { face = 'name', text = null } = {}, extra = {}) => ({ id, kind: 'tcard', label: text || (face === 'formula' ? substance(sub).formula : substance(sub).name), at: { ...at }, props: { sub, face, text }, ...extra });

registerPiece('tcard', {
  kind: { r: 7.2, rect: TCARD_RECT, nojoin: true },
  paint(ctx, p, state, o) {
    const { x, y, sc, lit } = o;
    const w = TCARD_RECT.hw * 2 * sc; const h = TCARD_RECT.hh * 2 * sc;
    ctx.fillStyle = '#2a2620'; ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeStyle = lit ? C.amber : C.dust; ctx.lineWidth = lit ? 2 : 1; ctx.strokeRect(x - w / 2 + 0.5, y - h / 2 + 0.5, w - 1, h - 1); ctx.lineWidth = 1;
    const S = substance(p.props.sub);
    const top = p.props.text || (p.props.face === 'formula' ? S.formula : S.name);
    const res = p.props.res ? Object.entries(p.props.res).map(([t, v]) => TESTS[t]?.short(v) ?? '').filter(Boolean).join(', ') : '';
    say(ctx, top, x, y - (res ? h * 0.17 : 0), Math.max(7, 2.3 * sc), { align: 'center', weight: 700, sans: true, maxW: w - 4 });
    if (res) say(ctx, res, x, y + h * 0.26, Math.max(6, 1.7 * sc), { align: 'center', color: C.amber, maxW: w - 4 });
  },
  faceKey: p => `tcard:${p.props.sub}:${p.props.face}:${p.props.text || ''}:${JSON.stringify(p.props.res || {})}`,
  printed: p => p.props.text || (p.props.face === 'formula' ? substance(p.props.sub).formula : substance(p.props.sub).name)
});
