/**
 * kits/ph-replay.js — a miss replays its cause, and the Tour plays the tool.
 *
 * REPLAY. When a submit misses, the kit's `onMiss` marks every instrument that can replay (`handler.replay`) with `props.replay = { id, n }`: n is how
 * many steps led to the table as it stands (dilutions made, pours made). The painters (flat, and the 3D dress, which paints through the same
 * wrapper) then show the instrument at step 0, 1, ... n, one step a second, framed in amber, and settle on the table as the student left it. The
 * reason is read in the banner while the cause is seen on the bench.
 *
 * `handler.replay = { count(f) -> n, at(f, i) -> the fixture as it stood after i steps }`.
 *
 * TOUR CLIPS. `handler.demo(f, t) -> the fixture t seconds into a short demonstration of the tool being used` (a pour pressed, a dilution made). The
 * Tour draws it on a small canvas with the instrument's own painter, so the clip and the bench cannot differ.
 */

import { fixtureHandler } from './ph-registry.js';
import { scratch } from '../../engine/phmotion.js';
import { put } from './ph-flask.js';
import { PLATE_COLORS } from '../../engine/plates.js';

export const STEP_SECONDS = 1.1;
let counter = 0;

export const withDial = (f, dial, value) => ({ ...f, dials: { ...f.dials, [dial]: { ...f.dials[dial], value } } });

export const withProps = (f, props) => ({ ...f, props: { ...f.props, ...props } });

/** Mark the table's instruments for a replay (called by the kit's `onMiss`). */
export function markReplay(table) {
  counter++;
  for (const f of Object.values(table.fixtures || {})) {
    const h = fixtureHandler(f.kind);
    const n = h?.replay ? h.replay.count(f) : 0;
    if (n > 0) f.props.replay = { id: counter, n };
  }
}

/** The fixture as it should be drawn now: a step of its own replay while one is playing, else itself. */
export function replayView(f, clock, key) {
  const rp = f.props?.replay;
  const h = fixtureHandler(f.kind);
  if (!rp || !h?.replay) return { f, replaying: false };
  const sc = scratch(f, `rp-${key}`);
  if (sc.id !== rp.id) { sc.id = rp.id; sc.t0 = clock; }
  const i = Math.floor((clock - sc.t0) / STEP_SECONDS);
  if (i > rp.n) return { f, replaying: false };
  const k = Math.min(i, rp.n);
  // One clone per step, kept, so a painter's own memory (a hand-over's start time) survives from frame to frame.
  const cache = (sc.cache ||= {});
  return { f: (cache[k] ||= h.replay.at(f, k)), replaying: i < rp.n, step: k };
}

/** The fixture `t` seconds into its Tour demonstration: the handler names the dials and props to set, and each distinct setting is one kept clone. */
export function demoView(f, t) {
  const h = fixtureHandler(f.kind);
  const spec = h?.demo?.(f, t);
  if (!spec) return f;
  const key = JSON.stringify(spec);
  const cache = (scratch(f, 'demo').cache ||= {});
  return (cache[key] ||= {
    ...f,
    dials: Object.fromEntries(Object.entries(f.dials).map(([n, d]) => [n, spec.dials?.[n] != null ? { ...d, value: spec.dials[n] } : d])),
    props: { ...f.props, ...(spec.props || {}) }
  });
}

/** The amber frame and caption that say a replay is playing. */
export function replayMark(ctx, b, step, n) {
  if (ctx.__ball) return;
  const box = b.lay.box;
  ctx.strokeStyle = PLATE_COLORS.amber; ctx.lineWidth = 2;
  ctx.strokeRect(b.X(box.x0) + 1, b.Y(box.y0) + 1, b.X(box.x1) - b.X(box.x0) - 2, b.Y(box.y1) - b.Y(box.y0) - 2);
  ctx.lineWidth = 1;
  put(ctx, `Replay ${step} / ${n}`, b.X(box.x1) - 6, b.Y(box.y0) + 8, Math.max(8, b.sc * 2.2), { align: 'right', color: PLATE_COLORS.amber, weight: 700 });
}
