/**
 * kits/nuke-choice.js — Cinder Halo's answer list (`nchoice`: statements to tap, a hidden dial with a blank start) and the clip a predict
 * stage plays first (`nlead`: a neighbouring case, looping, with nothing to run).
 */

import { registerFixture } from './nuke-registry.js';
import { C, frameOf, say, box, clamp, lerp } from './nuke-draw.js';

export function nchoiceFixture(id, label, at, { options, w = 60 } = {}) {
  const h = 7 + options.length * 7.4;
  const taps = options.map((_, i) => ({ x0: 1, x1: w - 1, y0: 5.6 + i * 7.4, y1: 12 + i * 7.4, dial: 'value', value: i + 1 }));
  return {
    id, kind: 'nchoice', label, at: { ...at }, size: { w, h }, noRun: true,
    dials: { value: { min: 0, max: options.length, step: 1, value: 0, label: 'Chosen' } },
    props: { options, hidden: ['value'], taps }
  };
}
/** The 1-based number of the statement tapped (0 while none is). */
export const chosenIndex = (state, id) => Math.round(state.fixtures[id]?.dials?.value?.value ?? 0);

function paintChoice(ctx, f, state, b) {
  const F = frameOf(b);
  const pick = chosenIndex(state, f.id);
  say(ctx, f.label, F.x(2), F.y(3), F.size(2.1, 6.5), { color: C.dust, weight: 600, maxW: F.len(f.size.w - 4) });
  f.props.options.forEach((o, i) => {
    const on = pick === i + 1;
    ctx.strokeStyle = on ? C.amber : C.steel; ctx.lineWidth = on ? 2 : 1;
    ctx.strokeRect(Math.round(F.x(1.2)) + 0.5, Math.round(F.y(5.8 + i * 7.4)) + 0.5, Math.round(F.len(f.size.w - 2.4)), Math.round(F.len(6)));
    ctx.lineWidth = 1;
    say(ctx, o, F.x(2.6), F.y(8.8 + i * 7.4), F.size(2.1, 7), { color: on ? C.amber : C.text, weight: on ? 700 : 500, maxW: F.len(f.size.w - 5) });
  });
}
registerFixture('nchoice', { paint: paintChoice });

/* ------------------------------------------------------------------ lead clips */

const SCENES = {};
export const addNukeLead = (name, paint) => { SCENES[name] = paint; };

export function nleadFixture(id, at, { scene, caption = '', w = 66, h = 30, title: ttl = 'Watch first' } = {}) {
  if (!SCENES[scene]) throw new Error(`nlead ${id}: no scene "${scene}"`);
  return { id, kind: 'nlead', label: ttl, at: { ...at }, size: { w, h }, dials: {}, noRun: true, props: { scene, caption } };
}
function paintLead(ctx, f, state, b) {
  const F = frameOf(b);
  say(ctx, f.label, F.x(2.2), F.y(3.2), F.size(2.2, 7), { color: C.dust, weight: 600 });
  SCENES[f.props.scene](ctx, f, F, b.clock || 0);
  if (f.props.caption) say(ctx, f.props.caption, F.x(2.2), F.y(f.size.h - 2.6), F.size(1.75, 6), { color: C.text, maxW: F.len(f.size.w - 4) });
}
registerFixture('nlead', { paint: paintLead, live: () => true });

/** A neighbouring case for the cold-drum prediction: the same fizzing tablet in warm water and in ice-cold water (a chemical reaction). */
addNukeLead('fizz', (ctx, f, F, t) => {
  const period = 6; const tt = t > 1e5 ? period * 0.7 : t % period;
  const glasses = [{ x: 6, label: 'Warm water, 40 °C', rate: 9 }, { x: f.size.w / 2 + 2, label: 'Ice-cold water, 2 °C', rate: 1.6 }];
  for (const g of glasses) {
    const gw = f.size.w / 2 - 10; const gy = 6.5; const gh = f.size.h - 15;
    box(ctx, F, g.x, gy + 2, gw, gh - 2, '#1c2226', '#cfd8de');
    // The tablet, shrinking as it reacts.
    const left = clamp(1 - (tt * g.rate) / 40, 0.15, 1);
    box(ctx, F, g.x + gw / 2 - 3 * left, gy + gh - 2.2, 6 * left, 1.8, '#d6cebd');
    // Bubbles of gas rising, as many each second as the reaction's speed.
    const n = Math.floor(tt * g.rate);
    for (let i = Math.max(0, n - 14); i < n; i++) {
      const born = i / g.rate; const age = tt - born; if (age < 0 || age > 1.6) continue;
      const bx = g.x + gw / 2 + Math.sin(i * 2.7) * gw * 0.3; const by = lerp(gy + gh - 2.6, gy + 3, age / 1.6);
      ctx.strokeStyle = '#a9b8c0'; ctx.beginPath(); ctx.arc(F.x(bx), F.y(by), Math.max(1.2, F.len(0.5)), 0, Math.PI * 2); ctx.stroke();
    }
    say(ctx, g.label, F.x(g.x + gw / 2), F.y(gy + gh + 2), F.size(1.6, 6), { align: 'center', color: C.dust });
  }
});
