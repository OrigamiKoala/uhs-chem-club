/**
 * kits/cell-site-sets.js — the sites of each stage whose answer is given to the particles (`cell-sites.js` says what a site is).
 *   ledger   electron slots either side of a metal strip, and atom copies on it: the two half-reaction cards are set by tapping them
 *   q1marks  the four kinds of particle of a displacement: tap to read the oxidation number before and after, tap again to mark a change
 *   nails    one iron nail per beaker: tap the nails that stay clean
 */
import { SPECIES } from '../../engine/celldata.js';
import { CARDS, cardReading, oxText } from '../../engine/celldata-q1.js';
import { siteSets } from './cell-sites.js';
import { ledgerOrder } from './cell-scenes.js';

const AMBER = '#e59b24'; const GREY = '#8c8376';
const val = (state, fid, dial) => Math.round(state.fixtures[fid]?.dials?.[dial]?.value ?? 0);

siteSets.ledger = (state, scene) => {
  const [donor, acceptor] = ledgerOrder(state, scene.props.watch);
  const out = [];
  [[donor, 0.24], [acceptor, 0.76]].forEach(([fid, sx]) => {
    const f = state.fixtures[fid];
    if (!f) return;
    const free = f.props.free || [];
    const left = free.find(c => c.kind === 'e' && c.side === 'left'); const right = free.find(c => c.kind === 'e' && c.side === 'right');
    if (left && right) {
      [[left, -0.16, 'in'], [right, 0.04, 'out']].forEach(([c, dx, word]) => {
        const cur = val(state, fid, c.dial);
        for (let j = 0; j < c.max; j++) out.push({ id: `${fid}:${c.side}:${j}`, x: sx + dx + j * 0.04, y: 0.41, r: 0.016, on: cur > j, label: '−', color: AMBER, act: { type: 'count', fixture: fid, dial: c.dial, index: j } });
        out.push({ id: `${fid}:${c.side}:t`, x: sx + dx + 0.06, y: 0.465, r: 0, text: word });
      });
    }
    if (f.props.mult) {
      const n = f.dials.k.max; const cur = val(state, fid, 'k');
      const sym = SPECIES[Object.keys(f.props.base.left)[0]]?.text || '';
      for (let j = 0; j < n; j++) out.push({ id: `${fid}:k:${j}`, x: sx - ((n - 1) * 0.04) / 2 + j * 0.04, y: 0.41, r: 0.017, on: cur > j, label: '', color: '#9aa3b8', act: { type: 'count', fixture: fid, dial: 'k', index: j, min: 1 } });
      out.push({ id: `${fid}:k:t`, x: sx, y: 0.465, r: 0, text: `${cur} × ${sym}` });
    }
  });
  return out;
};

const MARK_PARTS = [['zinc', 'Zn'], ['copper', 'Cu²⁺'], ['sulfur', 'S'], ['oxygen', 'O']];
siteSets.q1marks = (state, scene) => MARK_PARTS.map(([card, sym], i) => {
  const v = val(state, scene.id, `m${i}`);
  const r = cardReading(card);
  return { id: `m${i}`, x: 0.12 + i * 0.25, y: 0.42, r: 0.034, on: v >= 1, label: sym, color: v === 2 ? AMBER : GREY, read: v >= 1 ? `${oxText(r.before)} to ${oxText(r.after)}` : '', ring: v === 2, act: { type: 'cycle', fixture: scene.id, dial: `m${i}`, n: 3 } };
});
export const MARK_CARDS = MARK_PARTS.map(([c]) => c);

siteSets.nails = (state, scene) => {
  const n = state.fixtures[scene.props.watch[0]]?.props?.partners?.length || 0;
  return Array.from({ length: n }, (_, i) => {
    const v = val(state, scene.id, `n${i}`);
    const cx = 0.04 + (i + 0.5) * (0.92 / n);
    return { id: `n${i}`, x: cx - 0.07, y: 0.43, r: 0.022, on: v === 1, label: 'Fe', color: '#6aa3b8', ring: v === 1, act: { type: 'cycle', fixture: scene.id, dial: `n${i}`, n: 2 } };
  });
};

/* ------------------------------------------------------------------ answers picked on the particles of a scene */

const answerSel = state => Object.values(state.fixtures).find(f => f.kind === 'selector')?.id;

/** Tap a vessel, a strip or a bar: the answer dial of the stage's (hidden) selector takes `pickMap[i]`. `siteX` places the sites. */
siteSets.sides = (state, scene) => {
  const sel = answerSel(state);
  const map = scene.props.pickMap || [1, 2]; const xs = scene.props.siteX || [0.24, 0.76];
  const cur = val(state, sel, 'value');
  return xs.map((x, i) => ({ id: `side${i}`, x, y: 0.43, r: 0.026, on: cur === map[i], label: '', color: AMBER, ring: cur === map[i], act: { type: 'pick', fixture: sel, dial: 'value', value: map[i] } }));
};

/** Two strips, each tapped until it says whether atoms leave it or join it. */
siteSets.marks2 = (state, scene) => [0, 1].map(i => {
  const v = val(state, scene.id, `m${i}`);
  return { id: `m${i}`, x: i ? 0.76 : 0.24, y: 0.43, r: 0.026, on: v > 0, label: '', color: v === 1 ? AMBER : '#6aa3b8', read: v === 1 ? 'atoms leave' : v === 2 ? 'atoms join' : '', act: { type: 'cycle', fixture: scene.id, dial: `m${i}`, n: 3 } };
});

/** `q1-halves` stage 5: the strip metal or the ion of each beaker, tapped for the one that gives up electrons. */
siteSets.q1gives = (state, scene) => {
  const names = [['Cu', 'Ag⁺'], ['Mg', 'Fe²⁺']];
  return [0, 1].flatMap(v => [1, 2].map(k => {
    const cur = val(state, scene.id, `g${v + 1}`);
    return { id: `g${v}${k}`, x: (v ? 0.76 : 0.24) + (k === 1 ? -0.11 : 0.11), y: 0.43, r: 0.03, on: cur === k, label: names[v][k - 1], color: AMBER, ring: cur === k, act: { type: 'pick', fixture: scene.id, dial: `g${v + 1}`, value: k } };
  }));
};

/** `q1-halves` stage 8: a vessel tapped to mark its reaction as redox. */
siteSets.q1redox = (state, scene) => [0, 1, 2, 3].map(i => {
  const v = val(state, scene.id, `r${i}`);
  return { id: `r${i}`, x: 0.125 + i * 0.25, y: 0.43, r: 0.03, on: v === 1, label: 'ABCD'[i], color: AMBER, ring: v === 1, read: v === 1 ? 'redox' : '', act: { type: 'cycle', fixture: scene.id, dial: `r${i}`, n: 2 } };
});

/** `q5-load` stage 2: the two kinds of ion, each tapped while it is still there when the voltmeter reads zero. */
siteSets.ionsLeft = (state, scene) => [0, 1].map(i => {
  const v = val(state, scene.id, `t${i}`);
  return { id: `ion${i}`, x: i ? 0.76 : 0.24, y: 0.43, r: 0.028, on: v === 1, label: '', color: AMBER, ring: v === 1, read: v === 1 ? 'still there' : '', act: { type: 'cycle', fixture: scene.id, dial: `t${i}`, n: 2 } };
});
