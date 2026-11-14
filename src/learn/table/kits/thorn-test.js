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

import { substance, bromineFades, phOf, playOf, sceneOf } from '../../engine/thorndata.js';
import { registerFixture, registerPiece } from './thorn-registry.js';
import { C, ATOM_INK, frameOf, say, title, foot, progress, fitScenes, lerp, clamp, fixed1 } from './thorn-draw.js';
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

/* ------------------------------------------------------------------ the heat test (boiling point) */

/**
 * How each sample's molecule is drawn in the heat window: its heavy atoms as discs on a grid (`C`, `O`), with `h` marking an oxygen that
 * carries a hydrogen. Two copies are drawn lying against each other as closely as their shapes allow.
 */
const SHAPES = {
  ethane: [['C', 0, 0], ['C', 1, 0]],
  butane: [['C', 0, 0], ['C', 1, 0], ['C', 2, 0], ['C', 3, 0]],
  methylpropane: [['C', 0, 0], ['C', 1, 0], ['C', 2, 0], ['C', 1, 1]],
  pentane: [['C', 0, 0], ['C', 1, 0], ['C', 2, 0], ['C', 3, 0], ['C', 4, 0]],
  methylbutane: [['C', 0, 0], ['C', 1, 0], ['C', 2, 0], ['C', 3, 0], ['C', 1, 1]],
  dimethylpropane: [['C', 0, 0], ['C', 1, 0], ['C', 2, 0], ['C', 1, 1], ['C', 1, -1]],
  hexane: [['C', 0, 0], ['C', 1, 0], ['C', 2, 0], ['C', 3, 0], ['C', 4, 0], ['C', 5, 0]],
  ethanol: [['C', 0, 0], ['C', 1, 0], ['O', 2, 0, 'h']],
  methoxymethane: [['C', 0, 0], ['O', 1, 0], ['C', 2, 0]],
  propanone: [['C', 0, 0], ['C', 1, 0], ['C', 2, 0], ['O', 1, 1]],
  ethanoic: [['C', 0, 0], ['C', 1, 0], ['O', 2, 0, 'h'], ['O', 1, 1]]
};
/**
 * Two copies of a shape, the second turned over and brought up under the first until they touch: the offset of the second, and the pairs
 * of atoms that touch (one from each molecule). Pure; `tools/lib/thornmere/data-checks.mjs` holds the counts to the boiling points' order.
 */
export function heatContacts(sub) {
  const A = SHAPES[sub];
  if (!A) return { a: [], b: [], touching: [] };
  const B = A.map(([el, x, y, h]) => [el, x, -y, h]);
  let dy = -8;
  const clash = d => A.some(p => B.some(q => Math.hypot(p[1] - q[1], p[2] - (q[2] + d)) < 0.999));
  for (let d = -6; d <= 0; d += 0.05) { if (clash(d)) break; dy = d; }
  const touching = [];
  A.forEach((p, i) => B.forEach((q, j) => { if (Math.hypot(p[1] - q[1], p[2] - (q[2] + dy)) < 1.12) touching.push([i, j]); }));
  return { a: A, b: B.map(([el, x, y, h]) => [el, x, y + dy, h]), touching };
}
export const heatShapes = () => Object.keys(SHAPES);

addTest('heat', {
  title: 'Heat test',
  key: 'Heat',
  result: sub => substance(sub).bp,
  line: res => `Boiled at ${fixed1(res)} °C`,
  short: res => `${fixed1(res)} °C`,
  seconds: () => 4.2,
  paint(ctx, f, F, { sub, res, k, loaded }) {
    const wx = 3; const wy = 7; const ww = f.size.w - 22; const wh = f.size.h - 15;
    ctx.fillStyle = C.win; ctx.fillRect(F.x(wx), F.y(wy), F.len(ww), F.len(wh));
    ctx.strokeStyle = C.steel; ctx.strokeRect(Math.round(F.x(wx)) + 0.5, Math.round(F.y(wy)) + 0.5, Math.round(F.len(ww)), Math.round(F.len(wh)));
    // The thermometer: a bar that rises as the sample is heated and stops where it boils.
    const bx = f.size.w - 13; const by0 = 9; const by1 = f.size.h - 10; const lo = -120; const hi = 130;
    ctx.strokeStyle = C.steel; ctx.strokeRect(Math.round(F.x(bx)) + 0.5, Math.round(F.y(by0)) + 0.5, Math.round(F.len(5)), Math.round(F.len(by1 - by0)));
    for (const t of [-100, 0, 100]) {
      const y = by1 - ((t - lo) / (hi - lo)) * (by1 - by0);
      ctx.strokeStyle = C.dim; ctx.beginPath(); ctx.moveTo(F.x(bx - 1), F.y(y)); ctx.lineTo(F.x(bx), F.y(y)); ctx.stroke();
      say(ctx, `${t}`.replace('-', '−'), F.x(bx - 1.6), F.y(y), F.size(1.5, 6), { align: 'right', color: C.dim });
    }
    say(ctx, '°C', F.x(bx + 2.5), F.y(by0 - 1.8), F.size(1.6, 6), { align: 'center', color: C.dust });
    const show = sub || loaded;
    if (!show) { say(ctx, 'Two molecules of the sample, enlarged', F.x(wx + ww / 2), F.y(wy + wh / 2), F.size(1.8, 6), { align: 'center', color: C.dim }); return; }
    const heatK = sub ? clamp(k / 0.7, 0, 1) : 0;
    if (sub) {
      const top = lo + (res - lo) * heatK;
      const y = by1 - ((top - lo) / (hi - lo)) * (by1 - by0);
      ctx.fillStyle = C.minus; ctx.fillRect(F.x(bx + 0.6), F.y(y), F.len(3.8), F.len(by1 - y));
    }
    const S = heatContacts(show);
    if (!S.a.length) return;
    const all = [...S.a, ...S.b];
    const x0 = Math.min(...all.map(p => p[1])); const x1 = Math.max(...all.map(p => p[1]));
    const y0 = Math.min(...all.map(p => p[2])); const y1 = Math.max(...all.map(p => p[2]));
    const u = Math.min(7.5, (ww - 6) / (x1 - x0 + 1.4), (wh - 9) / (y1 - y0 + 1.4));
    const cx = wx + ww / 2; const cy = wy + wh / 2;
    // Once the sample boils the two molecules part.
    const apart = sub ? clamp((k - 0.72) / 0.28, 0, 1) : 0;
    const P = (p, lower) => ({ x: F.x(cx + (p[1] - (x0 + x1) / 2) * u), y: F.y(cy - (p[2] - (y0 + y1) / 2) * u + (lower ? 1 : -1) * apart * u * 0.9) });
    // The places where the two lie against each other, and a hydrogen bond where an O–H meets an oxygen.
    if (apart < 1) {
      ctx.globalAlpha = 1 - apart;
      for (const [i, j] of S.touching) {
        const a = P(S.a[i], false); const b2 = P(S.b[j], true);
        const hb = (S.a[i][0] === 'O' && S.b[j][0] === 'O') && (S.a[i][3] || S.b[j][3]);
        ctx.strokeStyle = hb ? C.amber : C.dust; ctx.lineWidth = hb ? 2.4 : 1.2; ctx.setLineDash(hb ? [3, 2] : [1.5, 2.5]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
      }
      ctx.setLineDash([]); ctx.lineWidth = 1; ctx.globalAlpha = 1;
    }
    const shake = sub && k < 1 ? heatK * 0.06 * u : 0;
    [[S.a, false], [S.b, true]].forEach(([M2, lower]) => {
      M2.forEach((p, i) => {
        const q = P(p, lower);
        const jx = Math.sin(k * 40 + i * 2.1 + (lower ? 1 : 0)) * F.len(shake); const jy = Math.cos(k * 37 + i * 1.7) * F.len(shake);
        const ink = ATOM_INK[p[0]];
        ctx.fillStyle = ink.fill; ctx.beginPath(); ctx.arc(q.x + jx, q.y + jy, F.len(u * 0.46), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = ink.ring; ctx.beginPath(); ctx.arc(q.x + jx, q.y + jy, F.len(u * 0.46), 0, Math.PI * 2); ctx.stroke();
        say(ctx, p[3] ? 'OH' : p[0], q.x + jx, q.y + jy + 0.5, Math.max(6.5, F.len(u * (p[3] ? 0.36 : 0.44))), { align: 'center', color: ink.text, weight: 800, sans: true });
      });
    });
    say(ctx, 'Dashes: where the two molecules lie against each other', F.x(wx + 1.5), F.y(wy + wh - 2.2), F.size(1.5, 6), { color: C.dim, maxW: F.len(ww - 3) });
  }
});

/* ------------------------------------------------------------------ the pH test */

addTest('ph', {
  title: 'pH test',
  key: 'Add to Water',
  result: sub => phOf(sub),
  line: res => `The meter reads pH ${fixed1(res)}`,
  short: res => `pH ${fixed1(res)}`,
  seconds: () => 3.6,
  paint(ctx, f, F, { sub, res, k, loaded }) {
    // The meter, on the left.
    const mx = 3; const my = 9; const mw = 20; const mh = 14;
    ctx.fillStyle = C.win; ctx.fillRect(F.x(mx), F.y(my), F.len(mw), F.len(mh));
    ctx.strokeStyle = C.steel; ctx.strokeRect(Math.round(F.x(mx)) + 0.5, Math.round(F.y(my)) + 0.5, Math.round(F.len(mw)), Math.round(F.len(mh)));
    say(ctx, 'pH meter', F.x(mx + mw / 2), F.y(my + 2.6), F.size(1.6, 6), { align: 'center', color: C.dust });
    say(ctx, sub && k > 0.8 ? fixed1(res) : sub ? '…' : '7.0', F.x(mx + mw / 2), F.y(my + 8.6), F.size(4.2, 11), { align: 'center', color: sub && k > 0.8 ? C.amber : C.dim, weight: 700 });
    say(ctx, sub ? '' : 'water alone', F.x(mx + mw / 2), F.y(my + mh + 2.4), F.size(1.5, 6), { align: 'center', color: C.dim });
    // The window: one molecule of the sample among water molecules.
    const wx = mx + mw + 3; const wy = 7; const ww = f.size.w - wx - 3; const wh = f.size.h - 15;
    ctx.fillStyle = C.win; ctx.fillRect(F.x(wx), F.y(wy), F.len(ww), F.len(wh));
    ctx.strokeStyle = C.steel; ctx.strokeRect(Math.round(F.x(wx)) + 0.5, Math.round(F.y(wy)) + 0.5, Math.round(F.len(ww)), Math.round(F.len(wh)));
    const show = sub || loaded;
    if (!show) { say(ctx, 'In the water, enlarged', F.x(wx + ww / 2), F.y(wy + wh / 2), F.size(1.8, 6), { align: 'center', color: C.dim }); return; }
    const S = substance(show);
    const kk = sub ? clamp(k / 0.8, 0, 1) : 0;
    const e = kk * kk * (3 - 2 * kk);
    const cx = wx + ww * 0.36; const cy = wy + wh * 0.5; const r = Math.min(4.2, wh * 0.15);
    const disc = (x, y, rr, el, label, q = 0) => {
      const ink = ATOM_INK[el];
      ctx.fillStyle = ink.fill; ctx.beginPath(); ctx.arc(F.x(x), F.y(y), F.len(rr), 0, Math.PI * 2); ctx.fill();
      say(ctx, label, F.x(x), F.y(y) + 0.5, Math.max(6.5, F.len(rr * 0.8)), { align: 'center', color: ink.text, weight: 800, sans: true });
      if (q) say(ctx, q > 0 ? '+' : '−', F.x(x + rr * 1.2), F.y(y - rr * 1.1), Math.max(8, F.len(rr * 0.9)), { align: 'center', color: q > 0 ? C.plus : C.minus, weight: 800, sans: true });
    };
    const bond = (x0, y0, x1, y1, a = 1) => { ctx.globalAlpha = a; ctx.strokeStyle = C.bond; ctx.lineWidth = Math.max(1.6, F.len(0.5)); ctx.beginPath(); ctx.moveTo(F.x(x0), F.y(y0)); ctx.lineTo(F.x(x1), F.y(y1)); ctx.stroke(); ctx.lineWidth = 1; ctx.globalAlpha = 1; };
    // A water molecule to the right: O with two H.
    const wxo = wx + ww * 0.78; const wyo = cy;
    const water = (extraH, lostH) => {
      bond(wxo, wyo, wxo + r * 1.3, wyo - r * 1.2);
      if (!lostH) bond(wxo, wyo, wxo + r * 1.3, wyo + r * 1.2);
      disc(wxo, wyo, r, 'O', 'O', extraH ? 1 : lostH ? -1 : 0);
      disc(wxo + r * 1.3, wyo - r * 1.2, r * 0.6, 'H', 'H');
      if (!lostH) disc(wxo + r * 1.3, wyo + r * 1.2, r * 0.6, 'H', 'H');
    };
    if (S.ionic) {
      // Sodium hydroxide: two ions held by attraction alone, which the water pulls apart.
      const gap = r * (1.05 + e * 2.6);
      bond(cx + gap, cy, cx + gap + r * 1.5, cy);
      disc(cx - gap, cy, r, 'Na', 'Na', 1);
      disc(cx + gap, cy, r, 'O', 'O', -1);
      disc(cx + gap + r * 1.5, cy, r * 0.6, 'H', 'H');
      say(ctx, e > 0.9 ? 'The ions have separated' : 'Two ions', F.x(wx + 1.5), F.y(wy + wh - 2.2), F.size(1.5, 6), { color: C.dim });
      return;
    }
    // A molecule: a carbon chain (R) bonded to the group that matters.
    const gx = cx + r * 2.4;
    bond(cx - r * 2.2, cy, cx, cy);
    ctx.fillStyle = '#3a3632'; ctx.fillRect(F.x(cx - r * 4.4), F.y(cy - r * 0.9), F.len(r * 2.4), F.len(r * 1.8));
    say(ctx, 'chain', F.x(cx - r * 3.2), F.y(cy), F.size(1.5, 6), { align: 'center', color: C.text });
    if (S.base) {
      // An amine: nitrogen takes a proton from water.
      const hx = wxo - r * 1.5 - e * (wxo - r * 1.5 - (cx + r * 1.5)); const hy = cy;
      bond(cx, cy, hx, hy, e > 0.85 ? 1 : 0); bond(hx, hy, wxo, wyo, e < 0.15 ? 1 : 0);
      disc(cx, cy, r, 'N', 'N', e > 0.85 ? 1 : 0);
      disc(hx, hy, r * 0.6, 'H', 'H');
      bond(wxo, wyo, wxo + r * 1.3, wyo - r * 1.2);
      disc(wxo, wyo, r, 'O', 'O', e > 0.85 ? -1 : 0);
      disc(wxo + r * 1.3, wyo - r * 1.2, r * 0.6, 'H', 'H');
      say(ctx, e > 0.9 ? 'A proton has moved from water to nitrogen' : 'The molecule and a water molecule', F.x(wx + 1.5), F.y(wy + wh - 2.2), F.size(1.5, 6), { color: C.dim, maxW: F.len(ww - 3) });
      return;
    }
    // An O–H group on carbon. An acid's proton moves to water; otherwise it stays where it is.
    const moves = Boolean(S.acid);
    const hx0 = gx + r * 1.5; const hx = moves ? hx0 + e * (wxo - r * 1.5 - hx0) : hx0 + Math.sin(k * 30) * 0.25 * (sub ? 1 - e : 0);
    bond(cx, cy, gx, cy);
    if (S.acid) { bond(cx, cy - 0.5, cx, cy - r * 2.3); bond(cx + 0.9, cy - 0.5, cx + 0.9, cy - r * 2.3); disc(cx + 0.45, cy - r * 2.5, r, 'O', 'O'); }
    bond(gx, cy, hx, cy, moves ? (e < 0.15 ? 1 : 0) : 1);
    if (moves) bond(hx, cy, wxo, wyo, e > 0.85 ? 1 : 0);
    disc(cx, cy, r, 'C', 'C');
    disc(gx, cy, r, 'O', 'O', moves && e > 0.85 ? -1 : 0);
    disc(hx, cy, r * 0.6, 'H', 'H');
    if (show === 'propanone' || show === 'methoxymethane') { /* no O–H on these: the hydrogen drawn is on carbon's neighbour and stays */ }
    water(moves && e > 0.85, false);
    say(ctx, moves && e > 0.9 ? 'A proton has moved to a water molecule' : sub && e > 0.9 ? 'Nothing has left the molecule' : 'The molecule and a water molecule', F.x(wx + 1.5), F.y(wy + wh - 2.2), F.size(1.5, 6), { color: C.dim, maxW: F.len(ww - 3) });
  }
});
