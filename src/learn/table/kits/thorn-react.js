/**
 * kits/thorn-react.js — what Thornmere's fifth bench (Making and Breaking, q5) adds to the thorn kit, as two tests on the test rig:
 *
 *   reach   a hydroxide ion comes in toward a carbon bonded to bromine, from the side opposite the bromine, between two of the carbon's
 *           other groups. Hydrogens leave the way open and the ion bonds; CH₃ groups, much larger, stand in the way and it is turned back.
 *   react   plays one reaction from `thorndata`, atom by atom, and counts the separate molecules and ions before and after.
 *
 * Plus the predict clip of ammonia and H–Cl. Each test is pure in its sample and the time since the key was pressed.
 */

import { substance, addSubstances, sceneOf, playOf } from '../../engine/thorndata.js';
import { addTest } from './thorn-test.js';
import { C, ATOM_INK, say, clamp, ease, lerp, fitScenes } from './thorn-draw.js';
import { drawPlay } from './thorn-mol.js';

addSubstances({
  bromomethane: { name: 'Bromomethane', formula: 'CH₃Br', ene: false, crowd: ['H', 'H', 'H'] },
  bromoethane: { name: 'Bromoethane', formula: 'C₂H₅Br', ene: false, crowd: ['H', 'H', 'CH₃'] },
  bromopropane2: { name: '2-Bromopropane', formula: 'C₃H₇Br', ene: false, crowd: ['CH₃', 'H', 'CH₃'] },
  tbutylbromide: { name: '2-Bromo-2-methylpropane', formula: 'C₄H₉Br', ene: false, crowd: ['CH₃', 'CH₃', 'CH₃'] },
  rxA: { name: 'Reaction A', formula: 'CH₂=CHCH₃ + HCl', ene: false, play: 'rx-add' },
  rxB: { name: 'Reaction B', formula: 'CH₃Cl + OH⁻', ene: false, play: 'rx-sub' },
  rxC: { name: 'Reaction C', formula: 'CH₃COOH + CH₃NH₂', ene: false, play: 'rx-cond' }
});

/* ------------------------------------------------------------------ reach */

/** Radius of a group as drawn and as felt by an incoming ion, in bond lengths. */
const RADIUS = { H: 0.32, 'CH₃': 0.6 };
/** How far each group stands from the carbon, as drawn. */
const ARM = 1.2;
const ION_R = 0.38;
/** The way in: the ray from the far side, at 150°, between the groups at 120° and 180°. Pure; the checks read it. */
export function reachOf(groups) {
  const flank = [groups[0], groups[1]];
  const gap = ARM * Math.sin(Math.PI / 6);
  const clear = flank.every(g => gap - RADIUS[g] >= ION_R - 0.25);
  return clear ? 'reached' : 'blocked';
}

function disc(ctx, F, x, y, r, el, label, o = {}) {
  const ink = ATOM_INK[el] || ATOM_INK.C;
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.fillStyle = label && label.length > 1 && el === 'C' ? '#4a443d' : ink.fill; ctx.beginPath(); ctx.arc(F.x(x), F.y(y), F.len(r), 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ink.ring; ctx.beginPath(); ctx.arc(F.x(x), F.y(y), F.len(r), 0, Math.PI * 2); ctx.stroke();
  say(ctx, label, F.x(x), F.y(y) + 0.5, Math.max(6.5, F.len(r * (label.length > 2 ? 0.62 : 0.9))), { align: 'center', color: ink.text, weight: 800, sans: true });
  if (o.q) say(ctx, o.q > 0 ? '+' : '−', F.x(x + r * 1.1), F.y(y - r * 1.1), Math.max(8, F.len(r * 0.8)), { align: 'center', color: o.q > 0 ? C.plus : C.minus, weight: 800, sans: true });
  ctx.globalAlpha = 1;
}
const bondLine = (ctx, F, a, b, alpha = 1) => { ctx.globalAlpha = alpha; ctx.strokeStyle = C.bond; ctx.lineWidth = Math.max(1.4, F.len(0.35)); ctx.beginPath(); ctx.moveTo(F.x(a.x), F.y(a.y)); ctx.lineTo(F.x(b.x), F.y(b.y)); ctx.stroke(); ctx.lineWidth = 1; ctx.globalAlpha = 1; };

addTest('reach', {
  title: 'Approach test',
  key: 'Send In OH⁻',
  result: sub => reachOf(substance(sub).crowd),
  line: res => (res === 'reached' ? 'The hydroxide ion reached the carbon and bonded' : 'The hydroxide ion was turned back before the carbon'),
  short: res => res,
  seconds: () => 4,
  paint(ctx, f, F, { sub, res, k, loaded }) {
    const wx = 3; const wy = 7; const ww = f.size.w - 6; const wh = f.size.h - 15;
    ctx.fillStyle = C.win; ctx.fillRect(F.x(wx), F.y(wy), F.len(ww), F.len(wh));
    ctx.strokeStyle = C.steel; ctx.strokeRect(Math.round(F.x(wx)) + 0.5, Math.round(F.y(wy)) + 0.5, Math.round(F.len(ww)), Math.round(F.len(wh)));
    const show = sub || loaded;
    if (!show) { say(ctx, 'The carbon bonded to bromine, enlarged', F.x(wx + ww / 2), F.y(wy + wh / 2), F.size(1.8, 6), { align: 'center', color: C.dim }); return; }
    const groups = substance(show).crowd;
    const u = Math.min(wh / 4.1, ww / 6.6);
    const cx = wx + ww * 0.6; const cy = wy + wh * 0.47;
    const P = (r, a) => ({ x: cx + Math.cos(a) * r * u, y: cy - Math.sin(a) * r * u });
    const angles = [120, 180, 240].map(d => (d * Math.PI) / 180);
    const reached = sub && res === 'reached';
    const go = sub ? clamp(k / 0.6, 0, 1) : 0;
    const after = reached ? ease(clamp((k - 0.6) / 0.4, 0, 1)) : 0;
    // The bromine leaves to the right once the ion has bonded.
    const br = { x: cx + u * (1.3 + 1.6 * after), y: cy };
    bondLine(ctx, F, { x: cx, y: cy }, br, 1 - after);
    disc(ctx, F, br.x, br.y, 0.5 * u, 'Br', 'Br', { q: after > 0.5 ? -1 : 0 });
    // The way in, drawn faintly.
    const a0 = (150 * Math.PI) / 180;
    const far = P(3.1, a0);
    ctx.strokeStyle = C.dim; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(F.x(far.x), F.y(far.y)); ctx.lineTo(F.x(cx), F.y(cy)); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < 3; i++) {
      const p = P(ARM, angles[i] + (after * Math.PI / 3) * (i === 1 ? 0 : i === 0 ? -0.5 : 0.5));
      bondLine(ctx, F, { x: cx, y: cy }, p);
      disc(ctx, F, p.x, p.y, RADIUS[groups[i]] * u, groups[i] === 'H' ? 'H' : 'C', groups[i]);
    }
    disc(ctx, F, cx, cy, 0.34 * u, 'C', 'C');
    // The ion: in along the way; it stops where a CH₃ group stands in the way, and is turned back.
    const stopAt = reached ? 1.05 : 1.95;
    let r = 3.1;
    if (sub) {
      if (reached) r = lerp(3.1, stopAt, ease(go));
      else r = k < 0.55 ? lerp(3.1, stopAt, ease(k / 0.55)) : lerp(stopAt, 3.1, ease((k - 0.55) / 0.45));
    }
    const ion = P(r, a0);
    if (reached && after > 0) bondLine(ctx, F, ion, { x: cx, y: cy }, after);
    disc(ctx, F, ion.x, ion.y, ION_R * u, 'O', 'OH', { q: reached && after > 0.5 ? 0 : -1 });
    say(ctx, 'Dashes: the way in, opposite the bromine', F.x(wx + 1.5), F.y(wy + wh - 2.2), F.size(1.5, 6), { color: C.dim, maxW: F.len(ww - 3) });
  }
});

/* ------------------------------------------------------------------ react */

/** Separate molecules and ions in a scene: groups of atoms joined by bonds. */
export function piecesIn(sceneId) {
  const S = sceneOf(sceneId);
  const ids = Object.keys(S.atoms); const par = Object.fromEntries(ids.map(i => [i, i]));
  const find = i => (par[i] === i ? i : (par[i] = find(par[i])));
  for (const [a, b] of S.bonds) par[find(a)] = find(b);
  return new Set(ids.map(find)).size;
}
/** Before and after counts of a reaction card. */
export function reactCounts(sub) {
  const P = playOf(substance(sub).play);
  return { before: piecesIn(P.scenes[0]), after: piecesIn(P.scenes[P.scenes.length - 1]) };
}

addTest('react', {
  title: 'Reaction viewer',
  key: 'Run Reaction',
  result: sub => { const c = reactCounts(sub); return `${c.before} → ${c.after}`; },
  line: res => `Separate molecules and ions: ${res.replace('→', 'before,')} after`,
  short: res => res,
  seconds: () => 3.6,
  paint(ctx, f, F, { sub, k, loaded }) {
    const wx = 3; const wy = 7; const ww = f.size.w - 6; const wh = f.size.h - 15;
    ctx.fillStyle = C.win; ctx.fillRect(F.x(wx), F.y(wy), F.len(ww), F.len(wh));
    ctx.strokeStyle = C.steel; ctx.strokeRect(Math.round(F.x(wx)) + 0.5, Math.round(F.y(wy)) + 0.5, Math.round(F.len(ww)), Math.round(F.len(wh)));
    const show = sub || loaded;
    if (!show) { say(ctx, 'The reaction, atom by atom', F.x(wx + ww / 2), F.y(wy + wh / 2), F.size(1.8, 6), { align: 'center', color: C.dim }); return; }
    const S = substance(show);
    const P = playOf(S.play);
    const G = fitScenes(P.scenes.map(sceneOf), { x: wx + 1, y: wy + 4, w: ww - 2, h: wh - 6 }, 9);
    drawPlay(ctx, F, G, P, sub ? clamp(k / 0.85, 0, 1) * (P.scenes.length - 1) : 0, { pairs: false });
    say(ctx, S.formula, F.x(wx + 1.5), F.y(wy + 2.4), F.size(1.6, 6), { color: C.dust, maxW: F.len(ww - 3) });
  }
});
