/**
 * kits/ph-solid.js — the beaker with a solid (`phsolid`), registered on the ph kit. Verdigris's `q8-capacity`, pH and solubility.
 *
 *   BEAKER  a saturated solution of a slightly soluble salt (from `engine/eqdata.js` `KSP`) over its own solid. The window holds the
 *           ions that are dissolved (three rows of spheres) and, below them, the solid left (a square for each sphere's worth). One sphere
 *           is 0.1 mmol. Press "Pour acid" and 10 spheres of strong acid go in; an anion that is a base (hydroxide) takes the acid, so
 *           more solid dissolves to replace it, and an anion of a strong acid (chloride) does not, so nothing changes. The saturated
 *           amount that is dissolved to begin with comes from Ksp and is well under one sphere; the stage is qualitative, the size of the
 *           effect on solubility is not worked out.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './ph-registry.js';
import { frameOf } from './matter-draw.js';
import { KSP } from '../../engine/eqdata.js';
import { cellGrid, ionText } from './ph-read.js';
import { put, ball } from './ph-flask.js';
import { wobble } from '../../engine/phmotion.js';
import { withDial } from './ph-replay.js';
import { U } from './ph-buffer.js';
import './ph-solid-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const CAT_INK = '#b08d57';
const AN_INK = '#78a142';
const SOLID_INK = '#6b625a';

/** Spheres of formula unit that dissolve in V litres of pure water (saturated): Ksp = (c s)^c (a s)^a. */
export function saturatedSpheres(salt, V = 0.1) {
  const [c, a] = KSP[salt].ions;
  const s = Math.pow(KSP[salt].ksp / (Math.pow(c, c) * Math.pow(a, a)), 1 / (c + a));
  return (s * V) / U;
}

/**
 * What the beaker holds after `n` pours of `acidSph` spheres of strong acid: formula units dissolved (a base anion takes the acid, one
 * acid per anion, so the solid gives `acid / anions` more units; the solid runs out at `solid`), the ions that shows, and the solid left.
 */
export function solidAfter({ salt, V = 0.1, solid, basic, n, acidSph }) {
  const [c, a] = KSP[salt].ions;
  const s0 = saturatedSpheres(salt, V);
  const dissolved = Math.min(solid, s0 + (basic ? (n * acidSph) / a : 0));
  const anionsFree = basic ? a * s0 : a * dissolved; // a basic anion that is freed is taken by the acid at once
  return { dissolved, cations: Math.round(c * dissolved), anions: Math.round(anionsFree), left: solid - Math.round(dissolved), s0 };
}

export function solidRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const n = Math.round(f.dials.n.value);
  return { f, n, ...solidAfter({ salt: p.salt, V: p.V, solid: p.solid, basic: p.basic, n, acidSph: p.acidSph }) };
}

function paintSolid(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = solidRead(state, f.id);
  const w = f.size.w;
  put(ctx, `${Math.round(p.V * 1000)} mL`, F.x(2), F.y(7.6), F.size(2.4, 6.4), { align: 'left', color: PLATE_COLORS.text, weight: 700 });
  put(ctx, 'one sphere is 0.1 mmol', F.x(w - 2), F.y(7.6), F.size(1.8, 5.6), { align: 'right', color: DIM });
  const x = 2; const y = p.winTop; const ww = w - 4; const wh = p.wh;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(ww), F.len(wh));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(ww)), Math.round(F.len(wh)));
  const ionH = wh * 0.5;
  const ions = cellGrid(20 * 3, 20, x + 0.6, y + 0.6, ww - 1.2, ionH - 0.8);
  const ionList = [...Array(r.cations).fill([CAT_INK]), ...Array(r.anions).fill([AN_INK])];
  ionList.slice(0, ions.length).forEach(([ink], i) => { const c = ions[i]; const wb = wobble(i, b.clock || 0); ball(ctx, F.x(c.x + wb.wx * c.cw * 0.5), F.y(c.y + wb.wy * c.ch * 0.5), Math.max(1.4, F.len(Math.min(c.cw, c.ch) * 0.44)), ink); });
  ctx.strokeStyle = '#2a2622'; ctx.beginPath(); ctx.moveTo(F.x(x + 0.6), F.y(y + ionH)); ctx.lineTo(F.x(x + ww - 0.6), F.y(y + ionH)); ctx.stroke();
  const pel = cellGrid(p.solid, 20, x + 0.6, y + ionH + 0.4, ww - 1.2, wh - ionH - 1);
  for (let i = 0; i < r.left && i < pel.length; i++) {
    const c = pel[i]; const s = Math.min(c.cw, c.ch) * 0.8;
    ctx.fillStyle = SOLID_INK; ctx.fillRect(F.x(c.x - s / 2), F.y(c.y - s / 2), F.len(s), F.len(s));
  }
  const size = F.size(1.9, 5.8);
  const items = [[SOLID_INK, `solid ${p.formula}`, 'sq'], [CAT_INK, p.cation, 'o']];
  if (r.anions) items.push([AN_INK, p.anion, 'o']);
  let cx = x; let cy = y + wh + 3;
  const sw = F.len(1.7); const u = F.len(1);
  for (const [ink, name] of items) {
    const nm = ionText(name);
    ctx.font = `500 ${size}px "Quantico", "JetBrains Mono", sans-serif`;
    const tu = (ctx.measureText(nm).width + sw + F.len(2.4)) / u;
    if (cx + tu > x + ww && cx > x) { cx = x; cy += 3.3; }
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(F.x(cx) + sw / 2, F.y(cy), sw / 2, 0, Math.PI * 2); ctx.fill();
    put(ctx, nm, F.x(cx) + sw + F.len(0.6), F.y(cy), size, { align: 'left', color: DUST });
    cx += tu;
  }
  put(ctx, `acid poured: ${r.n * p.acidSph} spheres, not drawn`, F.x(2), F.y(f.size.h - 3.2), size, { align: 'left', color: DIM });
}

function run(state, fid) {
  const r = solidRead(state, fid);
  if (r.n >= r.f.props.maxPour) return { noop: 'The beaker is full.' };
  return { x: r.n + 1, y: r.dissolved, label: fid, dials: { [fid]: { n: r.n + 1 } } };
}

registerFixture('phsolid', { replay: { count: f => Math.round(f.dials.n.value), at: (f, i) => withDial(f, 'n', i) }, demo: (f, t) => ({ dials: { n: Math.floor(t / 0.9) % (Math.min(f.dials.n.max, 6) + 1) } }), bodies3d: true, paint: paintSolid, run, live: () => true });

/** A beaker of `salt` (a key of `KSP`) over `solid` spheres of its solid; `basic` says whether its anion takes acid. */
export function solidFixture(id, at, { salt, solid = 40, basic = false, acidSph = 10, maxPour = 8, V = 0.1, w = 44, title = 'Beaker' } = {}) {
  const S = KSP[salt];
  const wh = Math.round(7 * ((w - 5.2) / 20) * 10) / 10;
  const winTop = 10.5;
  const h = Math.round((winTop + wh + 3 + 3.3 * 2 + 8) * 10) / 10;
  return {
    fixture: {
      id, kind: 'phsolid', label: title, at: { ...at }, size: { w, h }, runLabel: 'Pour acid',
      dials: { n: { min: 0, max: maxPour, step: 1, value: 0, label: 'Poured' } },
      props: { hidden: ['n'], backdrop: true, top: 10.5, salt, solid, basic, acidSph, maxPour, V, wh, winTop, formula: S.formula, cation: S.cation, anion: S.anion }
    },
    size: { w, h }
  };
}
