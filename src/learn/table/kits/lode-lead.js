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

const bar = (ctx, F, x, base, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(F.x(x), F.y(base - h), F.len(w), F.len(h)); };

const SCENES = {
  /** Two hydrogen atoms meet: each brings one electron, in its own colour, and the pair between them is the bond. */
  'h2-bond'(ctx, f, F, t) {
    say(ctx, 'Two hydrogen atoms bonding', F.x(2.2), F.y(7), F.size(1.8, 6), { color: C.dust });
    const p = Math.min(1, (t % 6) / 3);
    const cy = F.y(f.size.h / 2 + 2); const gap = 16 - 9 * p;
    const ax = F.x(f.size.w / 2 - gap); const bx = F.x(f.size.w / 2 + gap);
    for (const [x, col, dir] of [[ax, '#c98f4a', 1], [bx, '#6f8fb0', -1]]) {
      ctx.fillStyle = '#d6cebd'; ctx.beginPath(); ctx.arc(x, cy, F.len(3), 0, Math.PI * 2); ctx.fill();
      say(ctx, 'H', x, cy, F.size(1.9, 7), { align: 'center', color: '#14100c', weight: 800, sans: true });
      const ex = x + dir * F.len(3 + 1.6) * (1 - p) + dir * F.len(p * (gap - 0.6));
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ex, cy, Math.max(2.4, F.len(0.75)), 0, Math.PI * 2); ctx.fill();
    }
    if (p >= 1) say(ctx, 'one electron from each atom', F.x(f.size.w / 2), F.y(f.size.h - 3), F.size(1.8, 6), { align: 'center', color: C.amber });
  },
  /** Two neighbours in the row lose their third electron: one more proton, a higher cost. */
  'ie-ti-v'(ctx, f, F, t) {
    say(ctx, 'The third electron of two neighbours', F.x(2.2), F.y(7), F.size(1.8, 6), { color: C.dust });
    const p = Math.min(1, (t % 6) / 2.5);
    const base = f.size.h - 7; const H = f.size.h - 18;
    const rows = [['Ti²⁺', 22, 2652.5, 12], ['V²⁺', 23, 2830, 36]];
    for (const [name, z, v, x] of rows) {
      const h = (v / 3200) * H * p;
      bar(ctx, F, x, base, 10, h, C.d3);
      if (p >= 1) say(ctx, `${Math.round(v)} kJ/mol`, F.x(x + 5), F.y(base - h - 1.6), F.size(1.6, 6), { align: 'center', color: C.text });
      say(ctx, `${name}, ${z} protons`, F.x(x + 5), F.y(base + 2.6), F.size(1.7, 6), { align: 'center', color: C.dust });
    }
  },

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
