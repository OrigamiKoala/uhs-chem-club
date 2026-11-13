/**
 * commit-gate.js — Reusable Predict-Then-Run gate and reveal-on-miss state.
 *
 * Reveal state lives in WeakMaps keyed by `table` (never mutating fixture props)
 * so `verify:table` remains pure and deterministic.
 */

const REVEALED = new WeakMap();
const RUN_REVEALED = new WeakMap();

/** Mark a table as revealed (called from kit.onMiss). */
export function revealTable(table) {
  if (table && typeof table === 'object') REVEALED.set(table, true);
}

/** Mark a specific fixture as revealed on this table. */
export function revealFixture(table, fixtureId) {
  if (!table || typeof table !== 'object') return;
  let set = RUN_REVEALED.get(table);
  if (!set) { set = new Set(); RUN_REVEALED.set(table, set); }
  set.add(fixtureId);
}

/** Whether the table (or a specific fixture on it) has been revealed via onMiss. */
export function isRevealed(state, fixtureId = null) {
  if (!state || typeof state !== 'object') return false;
  if (REVEALED.get(state)) return true;
  if (fixtureId && RUN_REVEALED.get(state)?.has(fixtureId)) return true;
  return false;
}

/**
 * Evaluate whether the student has placed their prediction or answer for `gate`.
 * `gate` may be:
 *  - 'prediction' : a token is placed in `state.prediction.slot`
 *  - 'rail'       : the rail has all items placed or differs from `start`
 *  - { slot: id } : a piece is placed in slot `id`
 *  - { slots: [ids] } : every named slot has a piece
 *  - { anySlot: [ids] } : at least one named slot has a piece
 *  - { entry: id } : `state.entries[id]` is non-empty
 *  - { dial: name, start?: val } : dial `name` on `f` has moved from `start` (default 1)
 *  - function(state, f) -> boolean
 */
export function isCommitted(state, gate, f = null) {
  if (!gate) return true;
  if (typeof gate === 'function') return Boolean(gate(state, f));
  if (gate === 'prediction') return Boolean(state?.prediction?.token);
  if (gate === 'rail') {
    const rail = state?.zones?.rail;
    if (!rail) return false;
    return Array.isArray(rail.order) && rail.order.length > 0;
  }
  if (typeof gate === 'object') {
    if (gate.slot) {
      return Object.values(state?.pieces || {}).some(p => p.zone === `slot:${gate.slot}`);
    }
    if (Array.isArray(gate.slots)) {
      return gate.slots.every(id => Object.values(state?.pieces || {}).some(p => p.zone === `slot:${id}`));
    }
    if (Array.isArray(gate.anySlot)) {
      return gate.anySlot.some(id => Object.values(state?.pieces || {}).some(p => p.zone === `slot:${id}`));
    }
    if (gate.entry) {
      return String(state?.entries?.[gate.entry] ?? '').trim().length > 0;
    }
    if (Array.isArray(gate.railChanged)) {
      const order = state?.zones?.rail?.order;
      return Array.isArray(order) && order.join() !== gate.railChanged.join();
    }
    if (gate.fixtureDial && gate.dial) {
      const val = state?.fixtures?.[gate.fixtureDial]?.dials?.[gate.dial]?.value;
      return val != null && val !== (gate.start ?? 1);
    }
    if (gate.anyFixtureDial && Array.isArray(gate.anyFixtureDial.ids)) {
      const { ids, dial, start = 0 } = gate.anyFixtureDial;
      return ids.some(id => {
        const val = state?.fixtures?.[id]?.dials?.[dial]?.value;
        return val != null && Math.round(val) !== start;
      });
    }
    if (typeof gate.railFull === 'number') {
      const order = state?.zones?.rail?.order;
      return Array.isArray(order) && order.length >= gate.railFull;
    }
    if (gate.dial && f?.dials?.[gate.dial]) {
      return Math.round(f.dials[gate.dial].value) !== (gate.start ?? 1);
    }
  }
  return true;
}

/**
 * Gate a `Run` action on fixture `f`: if `f.props.gate` (or `state.opts.gate`) is set
 * and not yet committed (and not revealed), return `{ noop: reason }`.
 */
export function gateRun(state, f, reason = 'Place your prediction first.') {
  const gate = f?.props?.gate ?? state?.opts?.gate;
  if (!gate) return null;
  if (isRevealed(state, f?.id) || isCommitted(state, gate, f)) return null;
  return { noop: f?.props?.gateMsg || reason };
}
