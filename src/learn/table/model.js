/**
 * model.js — The tabletop's state and the one reducer that changes it.
 *
 * A bench is becoming a table: loose pieces, trays, a rail, slots, containers
 * and fixtures that the player works with their hands, and a stage is graded
 * on what is on the table when Commit is pressed. This file is the table. It
 * has no DOM and no THREE. Every view (the drawn tabletop in
 * `engine/table2d.js`, the built one in T0b) dispatches actions at `apply` and
 * paints the state it returns; nothing else mutates a table. The same pure
 * functions run in `verify:table`, which replays every stage's solution
 * through them, by drag and by two taps.
 *
 *   TableState {
 *     v, kit, bounds {w, h},
 *     pieces   { [id]: { id, kind, label, at {x,y}, home {x,y}, rot, props,
 *                        joinedTo [ids], zone, hidden?, fixed?, token?, fetchFrom? } },
 *     links    { 'a|b': kit link data }      one entry per join that holds
 *     zones    { trays {..}, rail {..}|null, slots {..}, containers {..} },
 *     fixtures { [id]: { id, kind, label, at, size, dials {name: {min,max,step,value}} } },
 *     recorder { rows [{x, y, label}], tool, box {at, size} },
 *     carry    { held, field },              the piece in the hand; the field item carried
 *     prediction { slot, tokens [ids], token, tested } | null,
 *     tools, fetch, opts, last
 *   }
 *
 * ACTIONS are one-key objects, `{ verb: argument }`, so a solution reads as a
 * script. Anything a view does is one of these twelve:
 *
 *   pick     'id' | null                  take a piece in the hand (two-tap step one)
 *   place    { piece?, at? | to? }        drop it: `at` is a drag (a point, resolved by
 *                                         snap.js), `to` is a two-tap (a named target:
 *                                         'tray:ID' 'slot:ID' 'container:ID' 'rail:INDEX'
 *                                         'piece:ID' 'free:X,Y'). `piece` defaults to the
 *                                         piece in the hand.
 *   join     [a, b]                       the same as dropping a on b
 *   split    'id' | [a, b]                break every join of id, or just a-b
 *   pour     { from, to, what, amount }   between containers, clamped to what is there/fits
 *   setDial  { fixture, dial, value }     clamped and stepped to the dial's own range
 *   run      'fixtureId'                  the kit reads the fixture; the recorder keeps it
 *   flip     'id'                         a card, face down or up
 *   scale    { piece, factor }            a card's multiplier, 1..kit.maxScale
 *   predict  'tokenId' | null             put a prediction token in the prediction slot
 *   fetch    'pointId'                    bring the field item back to the bench
 *   lay      tool | null                  lay (or lift) the recorder's straightedge
 *
 * A drag and a two-tap that mean the same thing end in the same state:
 * `{place: {piece, at}}` and `[{pick: piece}, {place: {to}}]` both go through
 * `snap.resolveDrop` / `drop`. `expandStep` turns one script step into either.
 *
 * WHAT HAPPENS IS DECIDED BY THE KIT. `join` asks `kit.planJoin`; a pair that
 * does not hold drifts apart and stays free, and the reason is on `state.last`.
 * `run` asks `kit.run`. The reducer authors none of it (§2.3), and no stage
 * declares an outcome.
 *
 * TOOLS (`kit.kinds.x.tool`). A lens lies ON a sample: dropped on one, the planner may
 * answer that it holds, and it rides on the sample until it is picked up again. A cutter is
 * drawn ACROSS one: the planner answers `once`, the pass writes what it did on the sample
 * (`plan.set`) and the tool returns to where it hangs. Carrying a sample into a zone leaves
 * any tool on it behind.
 *
 * Deterministic (no clock, no random) and serialisable (plain JSON).
 */

import { getKit, radiusOf } from './kits/index.js';
import {
  SIZES, zoneKey, parseKey, parseTo, clusterOf, itemsIn, linkKey, rectOf,
  layoutIn, railPositions, resolveDrop, pointFor, clampTo
} from './snap.js';
import { reorder, startArrangement } from './rail.js';
import { emptyRecorder, append, lay } from './recorder.js';

export { clusterOf, itemsIn, zoneKey, parseTo, pointFor };

export const VERBS = ['pick', 'place', 'join', 'split', 'pour', 'setDial', 'run', 'flip', 'scale', 'predict', 'fetch', 'lay'];

const clone = o => structuredClone(o);
const round = v => Math.round(v * 1e9) / 1e9;
const unit = (from, to) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.hypot(dx, dy);
  return d < 1e-9 ? { x: 1, y: 0 } : { x: dx / d, y: dy / d };
};

/**
 * Every word a player reads on a table stage's declaration: piece, tray, slot,
 * container, fixture, dial, rail-end and prediction labels. The vocabulary gate
 * and the answer-leak search (`verify:learn`, `verify:table`) hold these to the
 * same rules as a prompt.
 */
export function labelsOf(spec) {
  if (!spec) return [];
  const z = spec.zones || {};
  return [
    ...(spec.pieces || []).map(p => p.label),
    ...(z.trays || []).map(t => t.label),
    ...(z.slots || []).map(t => t.label),
    ...(z.containers || []).map(t => t.label),
    z.rail?.first, z.rail?.last, z.rail?.label,
    ...(spec.fixtures || []).flatMap(f => [f.label, f.runLabel, ...Object.values(f.dials || {}).map(d => d.label)]),
    spec.prediction?.slot?.label,
    ...(spec.prediction?.tokens || []).map(t => t.label),
    ...(spec.fetch || []).map(f => f.label)
  ].filter(Boolean);
}

/* ------------------------------------------------------------------
   BUILDING A TABLE FROM A STAGE'S DECLARATION
   ------------------------------------------------------------------ */

/**
 * `spec` is a stage's `table: { kit, bounds?, pieces, zones, fixtures, tools,
 * prediction?, fetch? }`. A spec that does not hold together throws, so a bad
 * declaration fails `verify:table` and never reaches a player.
 *
 *   recorder  { at?, size? }  where the paper strip is drawn (default: the top-right corner)
 *   pieces    [{ id, kind, label?, at, rot?, props?, zone?, hidden?, fixed?, fetchFrom?, r? }]
 *   zones     { trays [{id, label, at, size?}], slots [...], containers [{.., capacity?, contents?}],
 *               rail { id?, label?, at, size?, first, last, items [ids], start? } }
 *   fixtures  [{ id, kind, label, at, size?, dials { name: {min, max, step, value, label?} } }]
 *   prediction { slot: {id?, label, at}, tokens [{id, label, at?}] }
 *   fetch     [{ id, label }]
 */
export function createTable(spec, seedKey = '') {
  getKit(spec.kit); // an unknown kit throws here, at declaration time
  const bounds = { w: 100, h: 60, ...(spec.bounds || {}) };
  const s = {
    v: 1, kit: spec.kit, bounds,
    pieces: {}, links: {},
    zones: { trays: {}, rail: null, slots: {}, containers: {} },
    fixtures: {},
    recorder: emptyRecorder(spec.recorder),
    carry: { held: null, field: null },
    prediction: null,
    tools: [...(spec.tools || [])],
    fetch: {},
    // Plain data the kit may read (`state.opts`): a stage's wording mode, say.
    opts: { ...(spec.opts || {}) },
    last: null
  };

  const addPiece = p => {
    if (!p.id || s.pieces[p.id]) throw new Error(`table: piece id "${p.id}" is missing or repeated`);
    s.pieces[p.id] = {
      id: p.id, kind: p.kind, label: p.label ?? p.id,
      at: { ...p.at }, home: { ...p.at }, rot: p.rot || 0,
      props: { ...(p.props || {}) },
      joinedTo: [], zone: p.zone || null,
      ...(p.r ? { r: p.r } : {}),
      ...(p.hidden ? { hidden: true } : {}),
      ...(p.fixed ? { fixed: true } : {}),
      ...(p.token ? { token: true } : {}),
      ...(p.fetchFrom ? { fetchFrom: p.fetchFrom } : {})
    };
  };

  const z = spec.zones || {};
  // A tray may declare `cap`, how many pieces it is meant to hold; the picture prints a stencilled `!` over it.
  for (const t of z.trays || []) {
    s.zones.trays[t.id] = {
      id: t.id, label: t.label || t.id, at: { ...t.at }, size: { ...SIZES.tray, ...(t.size || {}) },
      ...(t.cap != null ? { cap: t.cap } : {}),
      ...(t.cell ? { cell: t.cell } : {})
    };
  }
  for (const t of z.slots || []) s.zones.slots[t.id] = { id: t.id, label: t.label || '', at: { ...t.at }, size: { ...SIZES.slot, ...(t.size || {}) } };
  for (const c of z.containers || []) {
    s.zones.containers[c.id] = {
      id: c.id, label: c.label || c.id, at: { ...c.at }, size: { ...SIZES.container, ...(c.size || {}) },
      capacity: c.capacity ?? null, contents: { ...(c.contents || {}) }
    };
  }
  if (z.rail) {
    s.zones.rail = {
      id: z.rail.id || 'rail', label: z.rail.label || '', at: { ...z.rail.at },
      size: { ...SIZES.rail, ...(z.rail.size || {}) },
      first: z.rail.first || '', last: z.rail.last || '', order: []
    };
  }

  for (const p of spec.pieces || []) addPiece(p);

  for (const f of spec.fixtures || []) {
    if (s.fixtures[f.id]) throw new Error(`table: fixture id "${f.id}" is repeated`);
    const dials = {};
    for (const [name, d] of Object.entries(f.dials || {})) dials[name] = { step: 1, ...d, value: d.value ?? d.min };
    s.fixtures[f.id] = {
      id: f.id, kind: f.kind, label: f.label || f.id, at: { ...f.at }, size: { ...SIZES.fixture, ...(f.size || {}) }, dials,
      // `noRun` leaves the Run key off (a gauge or a dial that only sets); `runLabel` renames it ("Fire Beam").
      ...(f.noRun ? { noRun: true } : {}),
      ...(f.runLabel ? { runLabel: f.runLabel } : {}),
      props: { ...(f.props || {}) }
    };
  }

  // A field entry may carry `at`: where the DRAWN site plate stands, the spot a player taps at T1 to T3.
  for (const f of spec.fetch || []) {
    s.fetch[f.id] = { id: f.id, label: f.label || f.id, ...(f.at ? { at: { ...f.at }, size: { ...SIZES.site, ...(f.size || {}) } } : {}) };
  }

  if (spec.prediction) {
    const slot = spec.prediction.slot;
    const id = slot.id || 'predict';
    s.zones.slots[id] = { id, label: slot.label || '', at: { ...slot.at }, size: { ...SIZES.slot, w: 14, h: 10, ...(slot.size || {}) } };
    const tokens = spec.prediction.tokens || [];
    tokens.forEach((t, i) => {
      addPiece({ id: t.id, kind: 'token', token: true, label: t.label, at: t.at || { x: 12 + i * 20, y: bounds.h - 7 } });
    });
    s.prediction = { slot: id, tokens: tokens.map(t => t.id), token: null, tested: false };
  }

  // The rail's pieces, in their fixed shuffle (or the stage's own start).
  if (s.zones.rail) {
    const items = z.rail.items || [];
    for (const id of items) {
      if (!s.pieces[id]) throw new Error(`table: rail piece "${id}" is not a piece`);
    }
    const order = z.rail.start || startArrangement(items, seedKey);
    s.zones.rail.order = order.slice();
    for (const id of order) s.pieces[id].zone = 'rail';
    relayout(s, 'rail');
  }

  for (const p of Object.values(s.pieces)) {
    if (p.zone && p.zone !== 'rail') validateZone(s, p.zone);
  }
  for (const key of new Set(Object.values(s.pieces).map(p => p.zone).filter(k => k && k !== 'rail'))) relayout(s, key);
  return s;
}

function validateZone(s, key) {
  const { kind, id } = parseKey(key);
  const ok = (kind === 'tray' && s.zones.trays[id]) || (kind === 'slot' && s.zones.slots[id]) ||
    (kind === 'container' && s.zones.containers[id]) || (kind === 'rail' && s.zones.rail);
  if (!ok) throw new Error(`table: no zone "${key}"`);
}

/* ------------------------------------------------------------------
   LAYOUT — the positions a zone gives its pieces
   ------------------------------------------------------------------ */

function relayout(s, key) {
  if (key === 'rail') {
    const rail = s.zones.rail;
    if (!rail) return;
    const pos = railPositions(rail, rail.order.length);
    rail.order.forEach((id, i) => { s.pieces[id].at = pos[i]; });
    return;
  }
  const { kind, id } = parseKey(key);
  if (kind === 'slot') {
    const slot = s.zones.slots[id];
    for (const p of Object.values(s.pieces)) if (p.zone === key) p.at = { ...slot.at };
    return;
  }
  const zone = kind === 'tray' ? s.zones.trays[id] : s.zones.containers[id];
  if (!zone) return;
  const fallback = kind === 'tray' ? SIZES.tray : SIZES.container;
  // Joined pieces stay side by side: lay out cluster by cluster.
  const members = Object.values(s.pieces).filter(p => p.zone === key && !p.hidden).map(p => p.id);
  const seen = new Set();
  let n = 0;
  for (const m of members) {
    if (seen.has(m)) continue;
    for (const c of clusterOf(s, m)) {
      if (s.pieces[c].zone !== key || seen.has(c)) continue;
      seen.add(c);
      s.pieces[c].at = layoutIn(zone, fallback, n++);
    }
  }
}

function leaveZone(s, id) {
  const p = s.pieces[id];
  const key = p.zone;
  if (!key) return;
  if (key === 'rail') s.zones.rail.order = s.zones.rail.order.filter(x => x !== id);
  p.zone = null;
  relayout(s, key);
}

function moveGroup(s, group, id, to) {
  const dx = to.x - s.pieces[id].at.x;
  const dy = to.y - s.pieces[id].at.y;
  for (const g of group) {
    const p = s.pieces[g];
    p.at = { x: round(p.at.x + dx), y: round(p.at.y + dy) };
  }
}

/* ------------------------------------------------------------------
   THE REDUCER
   ------------------------------------------------------------------ */

/**
 * Apply one action. Returns a NEW state (the old one is never touched) with
 * `last` describing what happened: `{verb, ok, reason?, ...}`. An action that
 * cannot be done leaves the table as it was and says why in `last`; it never
 * throws, so a stray tap cannot break a stage.
 */
export function apply(state, action) {
  const s = clone(state);
  const verb = action && typeof action === 'object' ? Object.keys(action)[0] : undefined;
  const fn = HANDLERS[verb];
  if (!fn) {
    s.last = { verb: verb ?? null, ok: false, reason: 'unknown action' };
    return s;
  }
  const kit = getKit(s.kit);
  const r = fn(s, kit, action[verb]) || {};
  const { ok = true, ...info } = r;
  s.last = { verb, ok, ...info };
  syncPrediction(s);
  return s;
}

/** Apply a list of actions in order. */
export function applyAll(state, actions) {
  return actions.reduce(apply, state);
}

const fail = reason => ({ ok: false, reason });

/** A dial's value for a requested one: inside its range and on its step. */
export function snapDial(d, value) {
  const step = d.step || 1;
  const clamped = Math.max(d.min, Math.min(d.max, Number(value)));
  return round(Math.min(d.max, d.min + Math.round((clamped - d.min) / step) * step));
}

const HANDLERS = {
  pick(s, kit, id) {
    if (id === null || id === undefined) { s.carry.held = null; return { held: null }; }
    const p = s.pieces[id];
    if (!p || p.hidden) return fail('no such piece');
    if (p.fixed) return fail('that piece is fixed');
    s.carry.held = id;
    return { held: id };
  },

  place(s, kit, arg) {
    const id = arg?.piece ?? s.carry.held;
    if (!id) return fail('nothing in the hand');
    const p = s.pieces[id];
    if (!p || p.hidden) return fail('no such piece');
    if (p.fixed) return fail('that piece is fixed');

    let target;
    if (arg.to !== undefined) {
      target = typeof arg.to === 'string' ? parseTo(arg.to) : arg.to;
      const bad = checkTarget(s, target);
      if (bad) return fail(bad);
    } else if (arg.at) {
      target = resolveDrop(s, kit, id, arg.at);
    } else {
      return fail('nowhere to place it');
    }
    s.carry.held = null;
    return drop(s, kit, id, target);
  },

  join(s, kit, pair) {
    if (!Array.isArray(pair) || pair.length !== 2) return fail('a join needs two pieces');
    s.carry.held = null;
    return joinPieces(s, kit, pair[0], pair[1]);
  },

  split(s, kit, arg) {
    s.carry.held = null;
    if (Array.isArray(arg)) return splitLink(s, kit, arg[0], arg[1]);
    const p = s.pieces[arg];
    if (!p) return fail('no such piece');
    if (!p.joinedTo.length) return fail('it is not joined to anything');
    for (const n of p.joinedTo.slice()) splitLink(s, kit, arg, n);
    return { split: arg };
  },

  pour(s, kit, arg) {
    const from = s.zones.containers[arg?.from];
    const to = s.zones.containers[arg?.to];
    if (!from || !to) return fail('pour needs two containers');
    const have = from.contents[arg.what] || 0;
    const held = Object.values(to.contents).reduce((a, b) => a + b, 0);
    const room = to.capacity == null ? Infinity : to.capacity - held;
    const moved = round(Math.min(Number(arg.amount) || 0, have, room));
    if (moved <= 0) return fail(have <= 0 ? 'there is none to pour' : 'it is full');
    from.contents[arg.what] = round(have - moved);
    if (from.contents[arg.what] <= 0) delete from.contents[arg.what];
    to.contents[arg.what] = round((to.contents[arg.what] || 0) + moved);
    return { moved, what: arg.what };
  },

  setDial(s, kit, arg) {
    const d = s.fixtures[arg?.fixture]?.dials[arg?.dial];
    if (!d) return fail('no such dial');
    d.value = snapDial(d, arg.value);
    return { value: d.value };
  },

  run(s, kit, arg) {
    const id = typeof arg === 'string' ? arg : arg?.fixture;
    if (!s.fixtures[id]) return fail('no such fixture');
    const row = kit.run(s, id);
    if (s.prediction?.token) s.prediction.tested = true;
    if (!row) return fail('it read nothing');
    // A reading can also be written on the thing that was read (`stamp: {pieceId: props}`):
    // a tag on a sample that has been tested. The kit says; the reducer only writes.
    for (const [pid, props] of Object.entries(row.stamp || {})) {
      if (s.pieces[pid]) Object.assign(s.pieces[pid].props, props);
    }
    s.recorder = append(s.recorder, row);
    return { row };
  },

  flip(s, kit, id) {
    const p = s.pieces[id];
    if (!p || p.hidden || p.fixed) return fail('no such piece');
    p.props.flipped = !p.props.flipped;
    return { flipped: p.props.flipped };
  },

  scale(s, kit, arg) {
    const p = s.pieces[arg?.piece];
    if (!p || p.hidden || p.fixed) return fail('no such piece');
    const f = Math.round(Number(arg.factor));
    if (!(f >= 1 && f <= (kit.maxScale || 1))) return fail('out of range');
    p.props.scale = f;
    return { scale: f };
  },

  predict(s, kit, tokenId) {
    if (!s.prediction) return fail('this table asks for no prediction');
    s.carry.held = null;
    if (tokenId === null || tokenId === undefined) {
      const cur = s.prediction.token;
      if (cur) { leaveZone(s, cur); s.pieces[cur].at = { ...s.pieces[cur].home }; }
      return { token: null };
    }
    if (!s.prediction.tokens.includes(tokenId)) return fail('not a prediction token');
    return drop(s, kit, tokenId, { kind: 'slot', id: s.prediction.slot });
  },

  fetch(s, kit, arg) {
    const id = typeof arg === 'string' ? arg : arg?.point;
    if (!s.fetch[id]) return fail('no such field point');
    s.carry.field = id;
    for (const p of Object.values(s.pieces)) if (p.fetchFrom === id) p.hidden = false;
    return { fetched: id };
  },

  lay(s, kit, tool) {
    s.recorder = lay(s.recorder, tool);
    return { laid: Boolean(s.recorder.tool) };
  }
};

function checkTarget(s, t) {
  if (t.kind === 'tray') return s.zones.trays[t.id] ? null : 'no such tray';
  if (t.kind === 'slot') return s.zones.slots[t.id] ? null : 'no such slot';
  if (t.kind === 'container') return s.zones.containers[t.id] ? null : 'no such container';
  if (t.kind === 'rail') return s.zones.rail ? null : 'no rail on this table';
  if (t.kind === 'piece') return s.pieces[t.id] && !s.pieces[t.id].hidden ? null : 'no such piece';
  if (t.kind === 'free') return t.at && Number.isFinite(t.at.x) && Number.isFinite(t.at.y) ? null : 'no such place';
  return 'no such place';
}

/** Put a piece where a resolved target says. The one place a drop is carried out. */
function drop(s, kit, id, t) {
  const p = s.pieces[id];

  if (t.kind === 'piece') return joinPieces(s, kit, id, t.id);

  // A TOOL (a lens, laid on a sample) comes off what it lay on when it is picked up and put anywhere
  // else; and a piece going into a zone leaves any tool lying on it behind.
  if (isTool(kit, p)) unlinkAll(s, id);
  else if (t.kind !== 'free') liftTools(s, kit, id);

  if (t.kind === 'free') {
    const group = clusterOf(s, id);
    moveGroup(s, group, id, clampTo(s, t.at, radiusOf(kit, p)));
    group.forEach(g => leaveZone(s, g));
    return { placed: 'free' };
  }

  if (t.kind === 'tray' || t.kind === 'container') {
    const key = zoneKey(t.kind, t.id);
    const group = clusterOf(s, id);
    group.forEach(g => { leaveZone(s, g); s.pieces[g].zone = key; });
    relayout(s, key);
    return { placed: key };
  }

  if (t.kind === 'slot') {
    const key = zoneKey('slot', t.id);
    unlinkAll(s, id);
    leaveZone(s, id);
    for (const o of Object.values(s.pieces)) {
      if (o.zone === key && o.id !== id) { o.zone = null; o.at = { ...o.home }; }
    }
    p.zone = key;
    relayout(s, key);
    return { placed: key };
  }

  // rail
  unlinkAll(s, id);
  leaveZone(s, id);
  const rail = s.zones.rail;
  const index = t.index == null ? rail.order.length : t.index;
  rail.order = reorder([...rail.order, id], id, index);
  p.zone = 'rail';
  relayout(s, 'rail');
  return { placed: 'rail', index: rail.order.indexOf(id) };
}

/* ---------------- joins and splits ---------------- */

function joinPieces(s, kit, aId, bId) {
  const a = s.pieces[aId];
  const b = s.pieces[bId];
  if (!a || !b || a.hidden || b.hidden) return fail('no such piece');
  if (aId === bId) return fail('a piece cannot join itself');
  if (a.token || b.token) return fail('that is not a piece to join');
  if (a.fixed) return fail('that piece is fixed');
  for (const x of [a, b]) {
    if (x.zone === 'rail' || (x.zone && x.zone.startsWith('slot:'))) return fail('a piece on the rail or in a slot is not joined');
  }
  if (clusterOf(s, aId).includes(bId) && a.joinedTo.includes(bId)) return { joined: true, a: aId, b: bId, already: true };

  // A tool lifts off whatever it lay on before it is laid on something else.
  const tool = isTool(kit, a);
  if (tool) unlinkAll(s, aId);
  const group = tool ? [aId] : clusterOf(s, aId);
  // Joined pieces stand a little apart (`kit.joinGap`, 1 = touching) so the join between them can be seen.
  const reach = (radiusOf(kit, a) + radiusOf(kit, b)) * (kit.joinGap || 1);
  const dir = unit(b.at, a.at);
  const plan = kit.planJoin(a, b, s);

  if (plan.holds && (tool || plan.once)) {
    // Laid ON the target, not beside it. A tool that `once` makes a pass (a cutter across a sample)
    // does its work and goes back where it hangs; one that stays (a lens) rides with its sample.
    if (plan.set?.a) Object.assign(a.props, plan.set.a);
    if (plan.set?.b) Object.assign(b.props, plan.set.b);
    group.forEach(g => leaveZone(s, g));
    if (plan.once) {
      a.at = { ...a.home };
      return { joined: true, a: aId, b: bId, once: true, reason: plan.reason };
    }
    s.links[linkKey(aId, bId)] = plan.link ? clone(plan.link) : {};
    a.joinedTo = [...a.joinedTo, bId].sort();
    b.joinedTo = [...b.joinedTo, aId].sort();
    // It rests on the target, a little off its middle (`plan.rest`) so a press at the target's own
    // middle still takes the target and a press on the tool takes the tool.
    a.at = clampTo(s, { x: b.at.x + (plan.rest?.x || 0), y: b.at.y + (plan.rest?.y || 0) }, radiusOf(kit, a));
    return { joined: true, a: aId, b: bId, reason: plan.reason };
  }

  if (!plan.holds) {
    // A kit may send a refused piece home (`plan.home`): a dispenser that was dropped on something it
    // cannot serve goes back where it hangs, as a cutter does after its pass, and the reason is the same.
    if (plan.home) {
      group.forEach(g => leaveZone(s, g));
      a.at = { ...a.home };
      return { joined: false, a: aId, b: bId, reason: plan.reason || 'it does not hold', home: true };
    }
    // Released, it drifts apart: the pair is not joined and the planner says why.
    group.forEach(g => leaveZone(s, g));
    moveGroup(s, group, aId, clampTo(s, { x: b.at.x + dir.x * reach * 1.9, y: b.at.y + dir.y * reach * 1.9 }, radiusOf(kit, a)));
    return { joined: false, a: aId, b: bId, reason: plan.reason || 'it does not hold' };
  }

  const key = linkKey(aId, bId);
  s.links[key] = plan.link ? clone(plan.link) : {};
  a.joinedTo = [...a.joinedTo, bId].sort();
  b.joinedTo = [...b.joinedTo, aId].sort();
  if (plan.set?.a) Object.assign(a.props, plan.set.a);
  if (plan.set?.b) Object.assign(b.props, plan.set.b);
  const zone = b.zone;
  group.forEach(g => { if (s.pieces[g].zone !== zone) leaveZone(s, g); });
  if (zone && zone !== 'rail') {
    for (const g of clusterOf(s, aId)) s.pieces[g].zone = zone;
    relayout(s, zone);
  } else {
    moveGroup(s, group, aId, standBeside(s, kit, group, a, b, reach, dir));
  }
  return { joined: true, a: aId, b: bId, reason: plan.reason };
}

/**
 * Where `a` (and the pieces joined to it, `group`) stands beside `b` so the join can be seen: on the
 * side it came from if that is clear, otherwise the nearest side round `b` where nothing of the group
 * would stand on anything else. Deterministic, so a drag and two taps end in the same table.
 */
function standBeside(s, kit, group, a, b, reach, dir) {
  const free = Object.values(s.pieces).filter(p => !group.includes(p.id) && !p.hidden && !p.zone);
  const base = Math.atan2(dir.y, dir.x);
  const clear = at => {
    const dx = at.x - a.at.x;
    const dy = at.y - a.at.y;
    return group.every(g => {
      const q = s.pieces[g];
      const x = q.at.x + dx;
      const y = q.at.y + dy;
      const r = radiusOf(kit, q);
      if (x - r < 0 || y - r < 0 || x + r > s.bounds.w || y + r > s.bounds.h) return false;
      return free.every(o => Math.hypot(o.at.x - x, o.at.y - y) >= (r + radiusOf(kit, o)) * 0.9);
    });
  };
  for (let k = 0; k <= 12; k++) {
    for (const sign of k === 0 ? [1] : [1, -1]) {
      const th = base + sign * k * (Math.PI / 12);
      const at = { x: b.at.x + Math.cos(th) * reach, y: b.at.y + Math.sin(th) * reach };
      if (clear(at)) return at;
    }
  }
  return clampTo(s, { x: b.at.x + dir.x * reach, y: b.at.y + dir.y * reach }, radiusOf(kit, a));
}

/** Is this piece a tool, one that lies ON another piece and comes off it again (`kinds.x.tool`)? */
function isTool(kit, p) { return Boolean(kit.kinds?.[p?.kind]?.tool); }

/** Take every tool off the pieces joined to `id`: they stay where they were put, the work goes into the zone. */
function liftTools(s, kit, id) {
  for (const m of clusterOf(s, id)) {
    for (const n of s.pieces[m].joinedTo.slice()) if (isTool(kit, s.pieces[n])) unlinkPair(s, m, n);
  }
}

function unlinkPair(s, a, b) {
  delete s.links[linkKey(a, b)];
  s.pieces[a].joinedTo = s.pieces[a].joinedTo.filter(x => x !== b);
  s.pieces[b].joinedTo = s.pieces[b].joinedTo.filter(x => x !== a);
}

function unlinkAll(s, id) {
  for (const n of s.pieces[id].joinedTo.slice()) unlinkPair(s, id, n);
}

function splitLink(s, kit, aId, bId) {
  const a = s.pieces[aId];
  const b = s.pieces[bId];
  if (!a || !b || !a.joinedTo.includes(bId)) return fail('those two are not joined');
  unlinkPair(s, aId, bId);
  if (!clusterOf(s, aId).includes(bId)) {
    const side = clusterOf(s, bId);
    const dir = unit(a.at, b.at);
    const reach = (radiusOf(kit, a) + radiusOf(kit, b)) * 2.5;
    moveGroup(s, side, bId, clampTo(s, { x: a.at.x + dir.x * reach, y: a.at.y + dir.y * reach }, radiusOf(kit, b)));
    // A split-off piece in a zone stays in it; one on open table stays free.
  }
  return { split: [aId, bId] };
}

function syncPrediction(s) {
  const pred = s.prediction;
  if (!pred) return;
  const key = zoneKey('slot', pred.slot);
  const now = pred.tokens.find(t => s.pieces[t].zone === key) ?? null;
  if (now !== pred.token) { pred.token = now; pred.tested = false; }
}

/* ------------------------------------------------------------------
   SCRIPTS — a solution is a list of actions
   ------------------------------------------------------------------ */

/**
 * One script step, as the view would send it:
 *   mode 'drag'    a `place` / `join` / `predict` step becomes `place` at a point
 *   mode 'tap'     … becomes `pick`, then `place` at a named target
 *   mode 'direct'  the step as written
 * Other verbs pass through. Computed against the CURRENT state, because where
 * a target is depends on what the earlier steps did.
 */
export function expandStep(state, step, mode = 'direct') {
  if (mode === 'direct') return [step];
  const kit = getKit(state.kit);
  const verb = Object.keys(step)[0];
  const arg = step[verb];
  let piece = null;
  let to = null;
  if (verb === 'place' && arg.to !== undefined) { piece = arg.piece ?? state.carry.held; to = arg.to; }
  else if (verb === 'join') { piece = arg[0]; to = `piece:${arg[1]}`; }
  else if (verb === 'predict' && arg) { piece = arg; to = `slot:${state.prediction.slot}`; }
  else return [step];
  if (mode === 'tap') return [{ pick: piece }, { place: { to } }];
  return [{ place: { piece, at: pointFor(state, kit, to, piece) } }];
}

/**
 * Run a script through the reducer, one step at a time, by `mode`. Returns the
 * final state; `strict` throws on the first step that did not take, naming it.
 */
export function runScript(state, script, { mode = 'direct', strict = false } = {}) {
  let s = state;
  script.forEach((step, i) => {
    for (const action of expandStep(s, step, mode)) {
      s = apply(s, action);
      if (strict && !s.last.ok) throw new Error(`table script step ${i} ${JSON.stringify(step)} did not take: ${s.last.reason}`);
    }
  });
  return s;
}

/* ------------------------------------------------------------------
   COMPARING AND CHECKING
   ------------------------------------------------------------------ */

/**
 * What a table AMOUNTS TO, with the raw coordinates left out: who is in which
 * zone, the order on the rail, what is joined, what is poured, where the dials
 * stand, what the recorder holds, the prediction. Two tables that came by
 * different hands (a drag and two taps) are the same table when their
 * signatures are equal.
 */
export function signature(s) {
  const zones = {};
  for (const p of Object.values(s.pieces)) {
    if (p.hidden) continue;
    const key = p.zone && p.zone !== 'rail' ? p.zone : null;
    if (key) (zones[key] ||= []).push(p.id);
  }
  for (const k of Object.keys(zones)) zones[k].sort();
  const dials = {};
  for (const f of Object.values(s.fixtures)) {
    dials[f.id] = Object.fromEntries(Object.entries(f.dials).map(([n, d]) => [n, d.value]));
  }
  return {
    zones,
    rail: s.zones.rail ? s.zones.rail.order.slice() : null,
    joins: Object.keys(s.links).sort(),
    contents: Object.fromEntries(Object.values(s.zones.containers).map(c => [c.id, c.contents])),
    props: Object.fromEntries(Object.values(s.pieces).filter(p => Object.keys(p.props).length).map(p => [p.id, p.props])),
    dials,
    rows: s.recorder.rows,
    tool: s.recorder.tool,
    prediction: s.prediction ? { token: s.prediction.token, tested: s.prediction.tested } : null,
    field: s.carry.field,
    hidden: Object.values(s.pieces).filter(p => p.hidden).map(p => p.id).sort()
  };
}

/** Everything wrong with a state's internal bookkeeping (empty when sound). */
export function checkInvariants(s) {
  const bad = [];
  for (const p of Object.values(s.pieces)) {
    for (const n of p.joinedTo) {
      if (!s.pieces[n]) bad.push(`${p.id} is joined to missing ${n}`);
      else if (!s.pieces[n].joinedTo.includes(p.id)) bad.push(`${p.id}-${n} is joined one way only`);
      else if (!s.links[linkKey(p.id, n)]) bad.push(`${p.id}-${n} has no link record`);
    }
    if (p.zone === 'rail' && !s.zones.rail?.order.includes(p.id)) bad.push(`${p.id} says rail but is not on it`);
    if (p.zone && p.zone !== 'rail') {
      try { validateZone(s, p.zone); } catch { bad.push(`${p.id} is in missing zone ${p.zone}`); }
    }
    if (!Number.isFinite(p.at.x) || !Number.isFinite(p.at.y)) bad.push(`${p.id} has no position`);
  }
  for (const key of Object.keys(s.links)) {
    const [a, b] = key.split('|');
    if (!s.pieces[a]?.joinedTo.includes(b)) bad.push(`link ${key} has no pieces`);
  }
  for (const id of s.zones.rail?.order || []) {
    if (s.pieces[id]?.zone !== 'rail') bad.push(`${id} is on the rail but says ${s.pieces[id]?.zone}`);
  }
  const slots = {};
  for (const p of Object.values(s.pieces)) {
    if (p.zone && p.zone.startsWith('slot:')) { if (slots[p.zone]) bad.push(`slot ${p.zone} holds two pieces`); slots[p.zone] = p.id; }
  }
  return bad;
}

/* ------------------------------------------------------------------
   READINGS A STAGE'S check() AND A VIEW BOTH WANT
   ------------------------------------------------------------------ */

/** The pieces joined to `id` as ids, and the kit's formula for them. */
export function clusterFormula(s, id) {
  const ids = clusterOf(s, id);
  return getKit(s.kit).formulaOf(ids, s);
}

/** Every cluster of two or more pieces, as sorted id lists, in id order. */
export function clusters(s) {
  const seen = new Set();
  const out = [];
  for (const id of Object.keys(s.pieces).sort()) {
    if (seen.has(id) || !s.pieces[id].joinedTo.length) continue;
    const c = clusterOf(s, id);
    c.forEach(x => seen.add(x));
    out.push(c);
  }
  return out;
}

export { rectOf };
