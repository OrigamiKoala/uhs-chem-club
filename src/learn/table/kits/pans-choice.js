/**
 * kits/pans-choice.js — answering by TAPPING THE THING, on the pans kit.
 *
 *   CHOICE   the answer a stage keeps. It looks like a small readout of what is chosen and has no knob: the student taps the vessel,
 *            beaker, salt or column the answer is, and the choice follows. Underneath it is the same dial an answer dial has
 *            (`value`, one position per option, the last a blank for "nothing chosen yet"), so a stage grades it exactly as it did
 *            and a scripted solution sets the same dial. A choice may also keep one option for itself (`same`): "the same" is not a
 *            thing on the table, so the readout is a plate to tap.
 *   PICK     `pickable(fixture, value)` makes a fixture tappable (`props.pick`, read by `gestures.js` `fixtureHit`); `pickColumns`
 *            does the same for the columns of the ratio vessels. The chosen one is framed in amber.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './pans-registry.js';
import { say, frameOf } from './matter-draw.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const AMBER = PLATE_COLORS.amber;

export function choiceFixture(id, label, at, { options, start, w = 46, same = null, plates = null } = {}) {
  return {
    id, kind: 'choice', label, at: { ...at }, size: { w, h: 9 }, noRun: true,
    dials: { value: { min: 1, max: options.length, step: 1, value: start ?? options.length, label: 'Chosen', labels: options } },
    props: {
      options, hidden: ['value'], ...(same ? { pick: { fixture: id, dial: 'value', value: same } } : {}),
      // Plates for answers that are not a thing on the table ("both", "neither"): the readout splits into tappable halves.
      ...(plates ? { plates, taps: plates.map((v, i) => ({ x0: (w / plates.length) * i, x1: (w / plates.length) * (i + 1), y0: 0, y1: 9, dial: 'value', value: v })) } : {})
    }
  };
}

function paintChoice(ctx, f, state, b) {
  const F = frameOf(b);
  const i = Math.round(f.dials.value.value) - 1;
  const text = (f.props.options[i] ?? '').trim();
  const sz = F.size(2.6, 6.4);
  say(ctx, f.label, F.x(2), F.y(3), F.size(2.2, 5.8), { color: DIM, maxW: F.len(f.size.w - 4) });
  if (!f.props.plates) say(ctx, text || 'tap to choose', F.x(2), F.y(f.size.h - 2.6), sz, { color: text ? AMBER : DIM, weight: 700, maxW: F.len(f.size.w - 4) });
  if (f.props.plates) {
    const n = f.props.plates.length; const cw = f.size.w / n;
    f.props.plates.forEach((v, k) => {
      ctx.strokeStyle = i + 1 === v ? AMBER : DUST;
      ctx.strokeRect(Math.round(F.x(k * cw + 0.5)) + 0.5, Math.round(F.y(5)) + 0.5, Math.round(F.len(cw - 1)), Math.round(F.len(4)));
      say(ctx, f.props.options[v - 1], F.x(k * cw + cw / 2), F.y(7), F.size(2.1, 5.4), { align: 'center', color: i + 1 === v ? AMBER : DIM, maxW: F.len(cw - 1.4) });
    });
    return;
  }
  const pk = f.props.pick;
  if (pk) {
    ctx.strokeStyle = i + 1 === pk.value ? AMBER : DUST;
    ctx.strokeRect(Math.round(F.x(0.5)) + 0.5, Math.round(F.y(0.5)) + 0.5, Math.round(F.len(f.size.w - 1)), Math.round(F.len(f.size.h - 1)));
  }
}

registerFixture('choice', { paint: paintChoice });

/** Make a fixture tappable: a tap on it sets the choice fixture `target` to `value`. */
export const pickable = (fx, value, target = 'pick') => ({ ...fx, props: { ...fx.props, pick: { fixture: target, dial: 'value', value } } });

/** Make a ratio-vessels fixture tappable column by column: column j (from 1) sets the choice to j. */
export function pickColumns(fx, target = 'pick') {
  const p = fx.props;
  const lw = p.lw ?? 34;
  const n = p.pans.length;
  const cw = (fx.size.w - lw - 1.5) / n;
  return { ...fx, props: { ...p, pick: { fixture: target, dial: 'value', cols: p.pans.map((_, j) => ({ x0: lw + j * cw, x1: lw + (j + 1) * cw, value: j + 1 })) } } };
}

/** The frame round the thing that is chosen, drawn after a fixture's own painter. */
export function paintPickFrame(ctx, f, state, b) {
  const pk = f.props?.pick;
  if (!pk || pk.fixture === f.id) return;
  const chosen = Math.round(state.fixtures[pk.fixture]?.dials?.[pk.dial || 'value']?.value ?? 0);
  const F = frameOf(b);
  ctx.strokeStyle = AMBER; ctx.lineWidth = Math.max(1.6, F.len(0.45));
  const box = (x, w) => ctx.strokeRect(F.x(x), F.y(0.4), F.len(w), F.len(f.size.h - 0.8));
  if (pk.cols) { const c = pk.cols.find(k => k.value === chosen); if (c) box(c.x0 + 0.2, c.x1 - c.x0 - 0.4); } else if (pk.value === chosen) box(0.4, f.size.w - 0.8);
  ctx.lineWidth = 1;
}

/** A tap target is announced on the flat plate by a dashed edge until it is chosen. */
export function paintPickHint(ctx, f, state, b) {
  const pk = f.props?.pick;
  if (!pk || pk.fixture === f.id) return;
  const F = frameOf(b);
  ctx.strokeStyle = DIM; ctx.setLineDash([2, 3]);
  const box = (x, w) => ctx.strokeRect(F.x(x), F.y(0.4), F.len(w), F.len(f.size.h - 0.8));
  if (pk.cols) pk.cols.forEach(c => box(c.x0 + 0.2, c.x1 - c.x0 - 0.4)); else box(0.4, f.size.w - 0.8);
  ctx.setLineDash([]);
}
