/**
 * kits/lode-lead.js — the clips a Lodestone predict stage plays before the guess (`lodelead`): a neighbouring case, moving by itself, with no
 * control. Each scene is a pure function of `b.clock`, looping.
 */

import { registerFixture } from './lode-registry.js';
import { C, frameOf, say, title, orbital } from './lode-draw.js';
import { fillLevel } from '../../engine/lodedata.js';

export function lodeLeadFixture(id, at, { scene, title: ttl = 'Watch first', w = 60, h = 30 } = {}) {
  return { id, kind: 'lodelead', label: ttl, at: { ...at }, size: { w, h }, noRun: true, dials: {}, props: { scene } };
}

const SCENES = {
  /** Iron's eight outer electrons going in, one by one: 4s first, then 3d. */
  'fill-fe'(ctx, f, F, t) {
    const n = Math.min(8, Math.floor((t % 11) / 1.1));
    const s = Math.min(2, n); const d = Math.max(0, n - 2);
    say(ctx, 'Iron\'s electrons going in, in order', F.x(2.2), F.y(7), F.size(1.8, 6), { color: C.dust });
    const occ = [s, ...fillLevel(5, d)];
    orbital(ctx, F, 10, 19, 6, 5, occ[0], { colour: C.s4 });
    say(ctx, '4s', F.x(8.5), F.y(21.5), F.size(2, 6.5), { align: 'right', color: C.s4, weight: 700 });
    for (let i = 0; i < 5; i++) orbital(ctx, F, 10 + i * 7.3, 11, 6, 5, occ[i + 1], { colour: C.d3 });
    say(ctx, '3d', F.x(8.5), F.y(13.5), F.size(2, 6.5), { align: 'right', color: C.d3, weight: 700 });
    say(ctx, `${n} of 8 in`, F.x(f.size.w - 2.2), F.y(f.size.h - 3), F.size(1.9, 6), { align: 'right', color: C.amber, weight: 600 });
  }
};

function paintLead(ctx, f, state, b) {
  const F = frameOf(b);
  title(ctx, f, F, b);
  SCENES[f.props.scene]?.(ctx, f, F, b.clock || 0, b);
}

export const addLeadScene = (name, fn) => { SCENES[name] = fn; };
registerFixture('lodelead', { paint: paintLead, live: () => true });
