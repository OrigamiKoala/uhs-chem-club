/**
 * kits/shells.js — The address and filling kit: boxes that arrows are dealt into, an address strip that lights a room, electrons that
 * carry their own address, a magnet that reads the real sample.
 *
 * LANTERNFALL'S FIFTH AND SIXTH BENCHES, WORKED WITH THE HANDS (plan `bench-tabletop.md`, T4b): `q5-numbers` and `q6-filling`, the two
 * faces of the records tent's one board. A thin wrapper over `engine/electrons.js` (`placeElectron`, `removeElectron`, `readRack`,
 * `findRoom`, `validAddress`, `groundConfig`, `shortString`, `MEASURED`) and it authors nothing: how many arrows a box takes, what the
 * rack reads, which room an address names and whether any room has it, how hard the REAL sample is pulled are the planners' answers
 * and the listed samples' own, shown as the picture.
 *
 * THE RACK is a board (fixture `shelf`) with a fixed `box` piece for every box of every row, lowest energy at the bottom. Arrows are
 * dealt with hand pieces dropped on a box, as the Lewis slate deals pairs: `up` and `down` put an arrow in (a box takes one of each
 * direction and no more: a third is refused with the rack's own reason and the piece goes home), `lift` takes one out. An ELECTRON
 * TOKEN (`etok`) carries its own address, four numbers; dropped on the rack it stands in the room its address names, or is refused
 * with the rule shown (no room has that address, or two electrons would share all four numbers). A refusal is a reason, never a
 * gatekeeper for a correct answer: the planner is asked about anything the player attempts.
 *
 * THE ADDRESS STRIP (fixture `finder`) is four cells the player sets (shell, subshell, orbital, spin); the box the address names
 * lights on the rack, or nothing lights and the board says no room has that address. THE MAGNET (fixture `magnet`) reports the REAL
 * sample's pull (`MEASURED`), or, on the `rack` magnet, what the arrangement standing on the rack would do.
 */

import { registerKit } from './registry.js';
import { paintPiece, paintFixture, faceKey, RECTS } from './shells-draw.js';
import { buildPlateFrame } from '../../engine/lab-props.js';
import { buildArrowRod } from '../../engine/lab-props-lanternfall.js';
import {
  arrowsOf, boxKey, boxPieceId, placeElectron, removeElectron, whyNoRoom, addressOfToken, placedTokens, MEASURED, rackPull, sameAddress,
  fmtMl, rowOf, boxesOf, rackFor, groundConfig
} from './shells-read.js';

export const SHELLS_KIT_ID = 'shells';
export const SHELLS_BOUNDS_H = 64;

const BOX_PITCH_X = 8.2;

/* ------------------------------------------------------------------
   THE KIT
   ------------------------------------------------------------------ */

const upDown = (here, key, row, idx, spin) => placeElectron({ [key]: here }, row, idx, spin);

function planJoin(a, b, state) {
  const refuse = reason => ({ holds: false, home: true, reason });
  if (b.kind !== 'box') return refuse('That goes on the rack.');
  const { row, idx } = b.props;
  const key = boxKey(row, idx);
  const here = arrowsOf(state, b);
  const written = rack => ({ b: { up: (rack[key] || '').includes('u'), down: (rack[key] || '').includes('d') } });

  if (a.kind === 'up' || a.kind === 'down') {
    const r = upDown(here, key, row, idx, a.kind === 'up' ? 'u' : 'd');
    if (r.refused) return refuse(r.refused);
    return { holds: true, once: true, set: written(r.rack), reason: 'An electron went into the box.' };
  }
  if (a.kind === 'lift') {
    const pre = b.props.pre || '';
    if (pre && here.length <= pre.length) return refuse('That electron is fixed in place on this stage.');
    const r = removeElectron({ [key]: here }, row, idx);
    if (r.refused) return refuse(r.refused);
    return { holds: true, once: true, set: written(r.rack), reason: 'An electron came out of the box.' };
  }
  if (a.kind === 'etok') {
    if (a.props.placed) return { holds: true, once: true, set: { a: { placed: false } }, reason: 'The electron came back off the rack.' };
    const addr = addressOfToken(a);
    const why = whyNoRoom(addr);
    if (why) return refuse(why);
    if (placedTokens(state).some(t => sameAddress(t.address, addr))) {
      return refuse('Two electrons in one atom cannot share all four numbers, and one already stands at this address.');
    }
    const spin = addr.ms > 0 ? 'up' : 'down';
    return { holds: true, once: true, set: { a: { placed: true } }, reason: `The electron stands in its orbital, pointing ${spin}.` };
  }
  return refuse('That goes on the rack.');
}

function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (!f || f.noRun) return null;
  if (f.kind === 'magnet') {
    if (f.props.sample != null) {
      const m = MEASURED[f.props.sample];
      if (m == null) return { noop: 'The magnet has no reading for that sample.' };
      return { dials: { [f.id]: { pull: 1 + m } } };
    }
    return { dials: { [f.id]: { pull: 1 + rackPull(state, f.props.rack) } } };
  }
  return null;
}

const rect = (r, kind, extra = {}) => ({ r, rect: RECTS[kind], ...extra });

/**
 * An orbital box as the solid thing it is: a low slab with the box's picture on it (the ring on the target, the finder's light) and a rod
 * standing in it for each electron, an up arrow with its head at the top and a down arrow hanging the other way (Lanternfall, 2026-10-23).
 */
function piece3d(p, state, c) {
  if (p.kind !== 'box') return null;
  const g = buildPlateFrame(c, { face: c.face(), frame: false });
  const here = arrowsOf(state, p);
  const has = d => (Array.isArray(here) ? here.includes(d) : String(here).includes(d));
  if (has('u')) { const r = buildArrowRod(c, { up: true }); r.position.set(-c.hw * 0.42, 0.005, 0); g.add(r); }
  if (has('d')) { const r = buildArrowRod(c, { up: false }); r.position.set(c.hw * 0.42, 0.005 + 0.034, 0); g.add(r); }
  g.userData.height = 0.05;
  return g;
}

export const SHELLS_KIT = {
  id: SHELLS_KIT_ID,
  kinds: {
    box: rect(3, 'box'),
    up: { r: 6.5, tool: true },
    down: { r: 6.5, tool: true },
    lift: { r: 6.5, tool: true },
    etok: rect(7, 'etok'),
    ccard: rect(6.5, 'ccard', { nojoin: true }),
    tag: rect(7, 'tag', { nojoin: true }),
    estrip: rect(8, 'estrip', { nojoin: true })
  },
  planJoin,
  /** Only a box is ever a target: a piece set down beside another piece is just set down. */
  pairable: (a, b) => b.kind === 'box' && a.kind !== 'box',
  run,
  paintPiece,
  paintFixture,
  piece3d,
  deckStyle: () => 'instrument',
  printed: p => (p.kind === 'box' ? '' : String(p.label)),
  faceKey
};

registerKit(SHELLS_KIT);

/** A stage's declaration with the kit's defaults: the kit, the bounds, a parked recorder strip. */
export function shellsTable(spec, { w = 150 } = {}) {
  return { kit: SHELLS_KIT_ID, bounds: { w, h: SHELLS_BOUNDS_H }, tools: [], recorder: { at: { x: w - 2.6, y: SHELLS_BOUNDS_H - 2.4 }, size: { w: 5, h: 3.4 } }, ...spec };
}

/* ------------------------------------------------------------------
   THE RACK
   ------------------------------------------------------------------ */

/**
 * A rack: the board (fixture `shelf`) and a fixed box for every box of `rows` (ids from lowest energy up). `pre` is a drawing
 * already standing (a rack map, `{ '1s:0': 'ud' }`), `locked` makes it fixed; `target` rings one box; `finder` names the address
 * strip that lights boxes here; `show` prints the row labels as numbers (`{n, l, ml, ms}`), `reach` the distance each row's cloud
 * reaches; `core` names the switch that folds the closed core away.
 */
export function shelf(rackId, rows, at, { pre = null, locked = false, target = null, finder = null, show = null, reach = false, readout = true, core = null, labels = true } = {}) {
  const n = rows.length;
  const pitch = n >= 7 ? 6.2 : n >= 5 ? 8 : 12;
  const maxBoxes = Math.max(...rows.map(r => boxesOf(rowOf(r).l)));
  const w = Math.max(62, 22 + maxBoxes * BOX_PITCH_X + 4 + (reach ? 22 : 0));
  const head = readout ? 10 : 8;
  const h = Math.round((head + n * pitch + 4) * 10) / 10;
  const x0 = at.x - w / 2;
  const cx = x0 + 22 + (maxBoxes * BOX_PITCH_X) / 2;
  const boxes = [];
  rows.forEach((id, i) => {
    const row = rowOf(id);
    const count = boxesOf(row.l);
    const y = at.y + h / 2 - 3 - pitch * (i + 0.5);
    for (let k = 0; k < count; k++) {
      const key = boxKey(id, k);
      const have = pre?.[key] || '';
      boxes.push({
        id: boxPieceId(rackId, id, k), kind: 'box', label: 'Box', fixed: true,
        at: { x: Math.round((cx + (k - (count - 1) / 2) * BOX_PITCH_X) * 10) / 10, y: Math.round(y * 10) / 10 },
        props: {
          rack: rackId, row: id, idx: k,
          ...(have.includes('u') ? { up: true } : {}), ...(have.includes('d') ? { down: true } : {}),
          ...(locked && have ? { pre: have } : {}),
          ...(finder ? { finder } : {}),
          ...(target && target.row === id && target.idx === k ? { target: true } : {})
        }
      });
    }
  });
  return {
    fixture: {
      id: `shelf-${rackId}`, kind: 'shelf', label: ' ', at: { ...at }, size: { w, h }, noRun: true, dials: {},
      props: { backdrop: true, rack: rackId, rows, ...(show ? { show } : {}), ...(finder ? { finder } : {}), ...(reach ? { reach: true } : {}), ...(core ? { core } : {}), readout, labels }
    },
    boxes,
    size: { w, h }
  };
}

/** The pre-fill that stands in for an element's ground state, as a rack map (`electrons.js` `rackFor`). */
export const groundRack = z => rackFor(z);
/** The pre-fill of a configuration (rows to electron counts). */
export const rackOfCounts = counts => rackFor(0, { counts });

/* ------------------------------------------------------------------
   HAND PIECES, TOKENS, CARDS, STRIPS
   ------------------------------------------------------------------ */

/** An arrow to deal: `up` or `down`, and `lift` to take one out. `label` renames it (a stage that deals one kind of electron). */
export const hand = (id, kind, at, label = null) => ({ id, kind, label: label || { up: 'Up', down: 'Down', lift: 'Lift Out' }[kind], at, props: {} });

/** A small card with a short label (a subshell type), to be put in a tray. */
export const tag = (id, label, at) => ({ id, kind: 'tag', label, at, props: {} });

/** An electron that carries its address: shell n, subshell l, orbital ml, spin ms (+1/2 up, -1/2 down). */
export const electronToken = (id, letter, at, address) => ({
  id, kind: 'etok', label: `${letter}: n${address.n} l${address.l} ml${address.ml} ${address.ms > 0 ? '+1/2' : '-1/2'}`.replace('+1/2', '+½').replace('-1/2', '-½'),
  at, props: { ...address }
});

/** A card with a written configuration, to be put in a slot. */
export const configCard = (id, label, at) => ({ id, kind: 'ccard', label, at, props: {} });

/** An element's strip: its symbol over its ladder of bars, the row its last electron went into lit. */
export const elementStrip = (id, sym, at) => ({ id, kind: 'estrip', label: sym, at, props: { sym } });

/* ------------------------------------------------------------------
   FIXTURES
   ------------------------------------------------------------------ */

const FINDER_RANGE = { n: [1, 3], l: [0, 3], ml: [-3, 3] };
const FINDER_LABEL = { n: 'Shell (n)', l: 'Subshell (l)', ml: 'Orbital (ml)', ms: 'Spin (ms)' };

/**
 * The address strip: a cell for each of `fields` (set by dragging its knob), and the box the address names lights on the rack
 * `finder` is attached to. `show` is which numbers the board prints (and so what an address lights: a floor, a suite's row, one box);
 * a number that is not a cell stands at its value in `start`. `range` narrows a cell.
 */
export function addressStrip(id, at, { fields = ['n', 'l', 'ml', 'ms'], show = fields, range = {}, start = {}, rack = 'rack' } = {}) {
  const dials = {};
  const fixed = {};
  for (const k of ['n', 'l', 'ml', 'ms']) {
    if (!fields.includes(k)) { if (start[k] != null) fixed[k] = start[k]; continue; }
    if (k === 'ms') {
      dials.ms = { min: -0.5, max: 0.5, step: 1, value: start.ms ?? 0.5, label: FINDER_LABEL.ms, labels: ['-1/2', '+1/2'] };
    } else {
      const [lo, hi] = range[k] || FINDER_RANGE[k];
      dials[k] = {
        min: lo, max: hi, step: 1, value: start[k] ?? (k === 'n' ? 1 : 0), label: FINDER_LABEL[k],
        labels: Array.from({ length: hi - lo + 1 }, (_, i) => (k === 'ml' ? fmtMl(lo + i) : String(lo + i)))
      };
    }
  }
  const rows = Object.keys(dials).length;
  return { id, kind: 'finder', label: 'Address', at: { ...at }, size: { w: 52, h: 8 + 5 * (rows - 1) + 9 }, noRun: true, dials, props: { show, fixed, rack } };
}

/** The magnet. `sample` is an element or ion symbol (`MEASURED`): it reports that REAL sample. Without one, `rack` names the rack it reports. */
export function magnet(id, at, { sample = null, rack = 'rack', size = { w: 30, h: 36 }, label = null, runLabel = null } = {}) {
  return {
    id, kind: 'magnet', label: label || (sample != null ? 'Sample' : 'Rack'), at: { ...at }, size, runLabel: runLabel || (sample != null ? 'Test Sample' : 'Test Rack'),
    dials: { pull: { min: 0, max: 9, step: 1, value: 0 } },
    props: { hidden: ['pull'], ...(sample != null ? { sample } : { rack }) }
  };
}

/** A plain dial a player sets to a figure they have counted. */
export function marker(id, label, at, { min = 0, max = 10, step = 1, value = 0, size = { w: 40, h: 12 }, title = 'Marker' } = {}) {
  return { id, kind: 'marker', label: title, at: { ...at }, size, noRun: true, dials: { n: { min, max, step, value, label } }, props: {} };
}

/** A switch: folds every closed row that matches a noble gas into its symbol on the board. */
export function coreSwitch(id, at, { size = { w: 40, h: 12 } } = {}) {
  return { id, kind: 'switch', label: 'Core', at: { ...at }, size, noRun: true, dials: { core: { min: 0, max: 1, step: 1, value: 0, label: 'Collapse Core', labels: ['Off', 'On'] } }, props: {} };
}

export { groundConfig };
export * from './shells-read.js';
