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
    say(ctx, o, F.x(3.2), F.y(8.8 + i * 7.4), F.size(2.1, 7.5), { color: on ? C.amber : C.text, weight: on ? 700 : 500, maxW: F.len(f.size.w - 6) });
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
  const glasses = [{ x: 5, label: 'Warm water, 40 °C', rate: 14 }, { x: f.size.w / 2 + 2, label: 'Ice-cold water, 2 °C', rate: 1.2 }];
  for (const g of glasses) {
    const gw = f.size.w / 2 - 8; const gy = 6.2; const gh = f.size.h - 14.5;
    box(ctx, F, g.x, gy + 1.5, gw, gh - 1.5, '#1c2429', '#cfd8de');
    // The fizzing tablet, labelled and shrinking as it reacts.
    const left = clamp(1 - (tt * g.rate) / 55, 0.2, 1);
    box(ctx, F, g.x + gw / 2 - 3.6 * left, gy + gh - 2.6, 7.2 * left, 2.2, '#e2dac9');
    say(ctx, 'Tablet', F.x(g.x + gw / 2), F.y(gy + gh - 1.5), F.size(1.3, 5.2), { align: 'center', color: '#221e1a', weight: 700 });
    // Bubbles of gas rising, many in warm water, almost none in cold.
    const n = Math.floor(tt * g.rate);
    for (let i = Math.max(0, n - 22); i < n; i++) {
      const born = i / g.rate; const age = tt - born; if (age < 0 || age > 1.5) continue;
      const bx = g.x + gw / 2 + Math.sin(i * 2.7) * gw * 0.34; const by = lerp(gy + gh - 3.0, gy + 2.6, age / 1.5);
      ctx.strokeStyle = '#cfe0ea'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(F.x(bx), F.y(by), Math.max(1.8, F.len(0.75)), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.lineWidth = 1;
    say(ctx, g.label, F.x(g.x + gw / 2), F.y(gy + gh + 2.2), F.size(1.7, 6.5), { align: 'center', color: C.text });
  }
});
