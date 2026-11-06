/**
 * kits/cell-sites.js — the student's answer given to the particles themselves. A SITE is a resting particle in the mechanism view (an
 * electron slot on a strip, an atom, an ion) that a tap changes; the change is a setDial on a hidden dial, so the stage grades exactly as it
 * did while a dial or a card used to carry the answer. `siteSets[key](state, scene)` lists the sites of a stage; the scene fixture names its
 * set in `props.sitesKey`. Sites live in the scene's own coordinates (x 0..1 across, y up), so they stay put while the model moves round them.
 *
 *   act { type: 'count', fixture, dial, index, min? }   site `index` filled means `index + 1` in the dial; tapping a filled one empties it and
 *                                                        those above (the first never goes under `min`)
 *   act { type: 'cycle', fixture, dial, n }              each tap steps the dial 0 -> n-1 -> 0
 *   act { type: 'pick',  fixture, dial, value }          sets the dial to `value`
 */
import { rectOf, SIZES } from '../snap.js';

export const siteSets = {};

const dialOf = (state, a) => Math.round(state.fixtures[a.fixture]?.dials?.[a.dial]?.value ?? 0);

/** The sites a scene fixture shows now: `{ id, x, y, r, kind, on, label, read?, act }`. */
export function sitesFor(state, scene) {
  const k = scene.props?.sitesKey;
  return k && siteSets[k] ? siteSets[k](state, scene) : [];
}

/** The action a tap on a site makes. */
export function siteAction(state, site) {
  const a = site.act; const cur = dialOf(state, a);
  let v = cur;
  if (a.type === 'count') { v = cur > a.index ? a.index : a.index + 1; if (a.min != null) v = Math.max(a.min, v); } else if (a.type === 'cycle') v = (cur + 1) % a.n;
  else if (a.type === 'pick') v = a.value;
  return { setDial: { fixture: a.fixture, dial: a.dial, value: v } };
}

/* The scene is drawn in a uniform square-ish fit inside its fixture box (see `cell-scene.js`); these are the same numbers. */
export const YTOP = 0.52; export const YSPAN = 0.6;
export function fit(f) {
  const w = f.size.w; const h = f.size.h;
  const sw = Math.min(w, (h - 5) / YSPAN);
  return { sw, ox: (w - sw) / 2, oy: ((h - 5) - sw * YSPAN) / 2 };
}

/** A scene point as table units. */
export function toUnits(f, x, y) {
  const box = rectOf(f, SIZES.fixture); const { sw, ox, oy } = fit(f);
  return { x: box.x0 + ox + x * sw, y: box.y0 + 4 + oy + (YTOP - y) * sw };
}

/** Everything a press can land on in a scene fixture, in table units. */
export function hotspots(f, state) {
  // A cell on the table whose lamp is tapped to say it lit (`props.markable`).
  if (f.kind === 'cellrig' && f.props.markable) {
    const box = rectOf(f, SIZES.fixture); const m = f.props.meter;
    const on = Math.round(f.dials.mark?.value ?? 0);
    return [{ x: box.x0 + m.x + m.w + 4, y: box.y0 + m.y + m.h / 2, r: 3.6, action: { setDial: { fixture: f.id, dial: 'mark', value: on ? 0 : 1 } }, id: `${f.id}:lamp` }];
  }
  if (f.kind !== 'cellscene') return null;
  const { sw } = fit(f);
  return sitesFor(state, f).filter(s => s.act).map(s => ({ ...toUnits(f, s.x, s.y), r: Math.max(2.2, s.r * sw * 1.1), action: siteAction(state, s), id: s.id }));
}
