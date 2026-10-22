/**
 * kits/cloud.js — The cloud kit: a probe that drops a dot a press, rings and films laid over a plate, a ring of string tuned until it
 * closes, clouds turned onto the axis they lie along.
 *
 * LANTERNFALL'S FOURTH BENCH, WORKED WITH THE HANDS (plan `bench-tabletop.md`, T4b): `q4-cloud`. Each press of a plate's Run key
 * fires a shot (the exposure dial says one, fifty or five hundred), and the dots are the real hydrogen-like |psi|^2 in the order
 * they will always come. A counting ring set on the plate counts what is inside it or what lies in its shell; a film (an outline of
 * a fixed area) laid on the plate counts what it catches; a tile of string put round the ring track draws the wave it makes there,
 * and the track closes it or smears it; clouds are cards that show the dots from the one view the table shares (turn and tilt), put
 * on the peg of the axis their lobes lie along or in a tray by their shape; the blur gauge prints the trade a sharper position makes.
 *
 * A THIN WRAPPER over `orbitals.js` and `cloudplate.js` (`sampleOrbital`, `ringFits`, `projectDots`, `blurAt`, `trackRefusal`) and it
 * authors nothing: what a ring counts, what a film catches, whether a slice is empty and whether a wave closes are the planners'
 * answers, shown as the picture. Pieces never join (`nojoin`); a fixture reads whatever stands in the slot it owns.
 */

import { registerKit } from './registry.js';
import { paintPiece, paintFixture, faceKey, RECTS } from './cloud-draw.js';
import { buildPlateFrame } from '../../engine/lab-props.js';
import { SHOT_STEPS, MAX_SHOTS, trackReason, FILMS, plateRead } from './cloud-read.js';
import { fixtureLayout } from '../layout.js';

export const CLOUD_KIT_ID = 'cloud';
export const CLOUD_BOUNDS_H = 64;

/* ------------------------------------------------------------------
   THE KIT
   ------------------------------------------------------------------ */

function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (!f || f.noRun) return null;
  if (f.kind === 'cloud') {
    const fired = Math.round(f.dials.fired.value);
    if (fired >= MAX_SHOTS) return { noop: `The plate has taken all ${MAX_SHOTS} shots it holds.` };
    const k = SHOT_STEPS[f.dials.burst.value - 1] ?? 1;
    return { dials: { [f.id]: { fired: Math.min(MAX_SHOTS, fired + k) } } };
  }
  if (f.kind === 'tracker') return { noop: trackReason() };
  return null;
}

const rect = (r, kind) => ({ r, rect: RECTS[kind], nojoin: true });

/**
 * The dots of every cloud plate, as beads standing over its picture (`table3d.js` `pilesOf`): a turning cloud is a real solid, each dot
 * hanging at its depth, and the view dials turn it. A flat plate (no view) keeps its dots on the surface, as the plate shows them.
 */
function pilesOf(state) {
  const out = [];
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'cloud') continue;
    const read = plateRead(state, f.id);
    const lay = fixtureLayout(f);
    const dialRows = lay.dials;
    const picTop = (dialRows.length ? dialRows[dialRows.length - 1].y - lay.box.y0 : 6) + 3.6;
    const pic = f.props.pic ?? 34;
    const half = f.props.extent ?? 5;
    const k = pic / (2 * half);
    const cx = lay.box.x0 + 2.5 + pic / 2;
    const cy = lay.box.y0 + picTop + pic / 2;
    const turning = read.plane === 'turn';
    const slots = [];
    const shown = [];
    for (let i = 0; i < MAX_SHOTS; i++) {
      const d = read.shown[i];
      if (d) {
        slots.push({ x: cx + d.a * k - f.at.x, y: cy - d.b * k - f.at.y, hu: turning ? (Math.max(-1, Math.min(1, d.c / half)) + 1) / 2 * 6.5 : 0, h: 0 });
        shown.push(true);
      } else { slots.push({ x: 0, y: 0, hu: 0, h: 0 }); shown.push(false); }
    }
    out.push({
      id: f.id, at: { x: f.at.x, y: f.at.y }, cap: MAX_SHOTS, n: read.shown.length, slots, shown,
      key: `${read.fired}|${read.turn}|${read.tilt}|${read.slice ? 1 : 0}|${read.orbital}`, r: Math.max(0.42, pic * 0.0135), colour: '#78a142'
    });
  }
  return out;
}

/** A plate or a tile in its frame; a film is bare acetate. */
function piece3d(p, state, c) {
  if (p.kind === 'cloud' || p.kind === 'tile') return buildPlateFrame(c, { face: c.face(), frame: true });
  if (p.kind === 'film') return buildPlateFrame(c, { face: c.face(), frame: false });
  return null;
}

export const CLOUD_KIT = {
  id: CLOUD_KIT_ID,
  kinds: {
    cloud: rect(9, 'cloud'),
    tile: rect(8.5, 'tile'),
    film: rect(8.5, 'film')
  },
  run,
  paintPiece,
  paintFixture,
  piece3d,
  pilesOf,
  slot3d: () => 'holder',
  deckStyle: () => 'instrument',
  printed: p => String(p.label),
  faceKey
};

registerKit(CLOUD_KIT);

/** A stage's declaration with the cloud kit's defaults: the kit, the bounds, a parked recorder strip. */
export function cloudTable(spec, { w = 150 } = {}) {
  return { kit: CLOUD_KIT_ID, bounds: { w, h: CLOUD_BOUNDS_H }, tools: [], recorder: { at: { x: w - 2.6, y: CLOUD_BOUNDS_H - 2.4 }, size: { w: 5, h: 3.4 } }, ...spec };
}

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

/** A cloud card: the dots of `orbital`, seen from the view fixture `view`. */
export const cloudCard = (id, label, at, orbital, { view = 'view', seed = 1, extent = 12, fired = 500 } = {}) => ({
  id, kind: 'cloud', label, at, props: { orbital, seed, view, extent, fired }
});

/** A tile of string cut to `pm` picometres, to be put round the ring track. */
export const ringTile = (id, at, pm) => ({ id, kind: 'tile', label: `${pm} pm`, at, props: { pm } });

/** A film: an outline of one of the four shapes (`cloud-read.js` `FILMS`), laid over a plate. */
export const filmPiece = (id, label, at, shape) => {
  if (!FILMS[shape]) throw new Error(`cloud kit: no film "${shape}"`);
  return { id, kind: 'film', label, at, props: { shape } };
};

/* ------------------------------------------------------------------
   FIXTURES (each builder returns the fixture and the zones it owns)
   ------------------------------------------------------------------ */

const EXPOSURE = ['1 shot', '50 shots', '500 shots'];

/**
 * A cloud plate: an exposure dial, a Run key that fires, and the picture. `ring` ('disc' or 'band') gives it a counting ring (a dial
 * in pm, `ringMax` and `ringStep`); `slice` a slice switch of its own; `view` the id of the shared view fixture it is seen from;
 * `film: true` a slot for a film in its side column. Its height follows its dials.
 */
export function cloudPlate(id, label, at, orbital, { seed = 1, ring = null, ringMax = 300, ringStep = 10, slice = false, view = null, film = false, extent = 5, pic = null, exposure = true } = {}) {
  const rows = (exposure ? 1 : 0) + (ring ? 1 : 0) + (slice ? 1 : 0);
  const side = pic ?? (rows >= 3 ? 30 : 32);
  const picTop = 8 + 5 * Math.max(0, rows - 1) + 3.6;
  const size = { w: 64, h: Math.round((picTop + side + 8.5) * 10) / 10 };
  const dials = {};
  if (exposure) dials.burst = { min: 1, max: 3, step: 1, value: 1, label: 'Exposure', labels: EXPOSURE };
  if (ring) dials.ring = { min: 0, max: ringMax, step: ringStep, value: 0, label: 'Ring (pm)' };
  if (slice) dials.slice = { min: 0, max: 1, step: 1, value: 0, label: 'Slice', labels: ['Off', 'On'] };
  dials.fired = { min: 0, max: MAX_SHOTS, step: 1, value: 0 };
  const slotId = `${id}.film`;
  const x0 = at.x - size.w / 2;
  const y0 = at.y - size.h / 2;
  const sx = 2.5 + side + 2.5;
  return {
    fixture: {
      id, kind: 'cloud', label, at: { ...at }, size, runLabel: 'Fire',
      dials,
      props: {
        backdrop: true, hidden: ['fired'], orbital, seed, extent, pic: side,
        ...(ring ? { ring } : {}), ...(view ? { view } : {}), ...(film ? { film: slotId } : {})
      }
    },
    slots: film ? [{ id: slotId, label: '', at: { x: x0 + sx + (size.w - sx - 1.5) / 2, y: y0 + picTop + 23 }, size: { w: 18, h: 18 } }] : [],
    size
  };
}

/** The view every turning cloud shares: turn (0 to 330 degrees, 30 a step) and tilt (-90 to 90), and optionally a slice switch. */
export function viewFixture(id, at, { slice = false } = {}) {
  const rows = 2 + (slice ? 1 : 0);
  const size = { w: 44, h: 8 + 5 * (rows - 1) + 8 };
  const dials = {
    turn: { min: 0, max: 11, step: 1, value: 1, label: 'Turn (deg)', labels: Array.from({ length: 12 }, (_, i) => String(i * 30)) },
    tilt: { min: -3, max: 3, step: 1, value: 1, label: 'Tilt (deg)', labels: [-3, -2, -1, 0, 1, 2, 3].map(i => String(i * 30)) }
  };
  if (slice) dials.slice = { min: 0, max: 1, step: 1, value: 0, label: 'Slice', labels: ['Off', 'On'] };
  return { id, kind: 'view', label: 'View', at: { ...at }, size, noRun: true, dials, props: {} };
}

/** The ring track: a slot for a tile of string, and the wave it makes there. */
export function ringTrack(id, at, { size = { w: 70, h: 47 } } = {}) {
  const slotId = `${id}.tile`;
  const x0 = at.x - size.w / 2;
  const y0 = at.y - size.h / 2;
  return {
    fixture: { id, kind: 'wavering', label: 'Ring track', at: { ...at }, size, noRun: true, dials: {}, props: { backdrop: true, slot: slotId } },
    slots: [{ id: slotId, label: 'On the track', at: { x: x0 + 12, y: y0 + size.h - 13 }, size: { w: 18, h: 13 } }]
  };
}

/** The blur gauge: the precision level (1 to 5) and the blur in position and in speed it makes. */
export function blurGauge(id, at, { size = { w: 44, h: 37 } } = {}) {
  return { id, kind: 'blur', label: 'Precision', at: { ...at }, size, noRun: true, dials: { level: { min: 1, max: 5, step: 1, value: 3, label: 'Level' } }, props: { rowsAt: 14 } };
}

/** The Track Electron key: it asks the bench to follow the electron along a path, and the bench says why it cannot. */
export function tracker(id, at, { size = { w: 40, h: 22 } } = {}) {
  return { id, kind: 'tracker', label: 'Path', at: { ...at }, size, runLabel: 'Track Electron', dials: {}, props: {} };
}

export * from './cloud-read.js';
