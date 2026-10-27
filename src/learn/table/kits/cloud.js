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
import { SHOT_STEPS, MAX_SHOTS, trackReason, FILMS, plateRead, trackRead, RING_CIRCUMFERENCE_PM, viewRead } from './cloud-read.js';
import { fixtureLayout, joystickGeometry } from '../layout.js';

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

/** A film or tile standing in a holder slot rests on the socket's rubber pad. */
function restHeight(p) {
  if (p?.zone?.startsWith('slot:')) return 0.0105;
  return 0;
}

/** Solid 3D wave standing over the ring track when a tile is seated. */
function dress3d(f, state, c) {
  const { THREE, scale: s, toPlate, box } = c;
  const group = new THREE.Group();
  if (f.kind === 'wavering') {
    const w = f.size.w;
    const h = f.size.h;
    const cxRel = w * 0.62;
    const cyRel = h * 0.55;
    const R_units = Math.min(w * 0.3, h * 0.34);
    const R_m = R_units * s;
    const centerPlate = toPlate({ x: box.x0 + cxRel, y: box.y0 + cyRel });

    const waveGroup = new THREE.Group();
    waveGroup.position.set(centerPlate.x, c.ground + 0.004, centerPlate.z);
    group.add(waveGroup);

    const N = 120;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array((N + 1) * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0x78a142, linewidth: 2 });
    const line = new THREE.Line(geo, mat);
    line.visible = false;
    waveGroup.add(line);

    let activeRead = null;
    let phase = 0;

    const sync = (fixture, st) => {
      activeRead = trackRead(st, fixture.id);
      if (!activeRead || !activeRead.nm) {
        line.visible = false;
        return;
      }
      line.visible = true;
      const n = RING_CIRCUMFERENCE_PM / activeRead.nm;
      const A_m = R_m * 0.16;
      mat.color.set(activeRead.fits ? 0x78a142 : 0xd99423);
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2;
        const dr = activeRead.fits ? A_m * Math.cos(n * th) : A_m * 0.3 * Math.cos(n * th);
        pos[i * 3] = (R_m + dr) * Math.cos(th);
        pos[i * 3 + 1] = 0.002;
        pos[i * 3 + 2] = (R_m + dr) * Math.sin(th);
      }
      geo.attributes.position.needsUpdate = true;
    };

    group.userData.tick = (delta, reduced) => {
      if (!line.visible || reduced || !activeRead || !activeRead.nm) return;
      phase += delta * 2.4;
      const n = RING_CIRCUMFERENCE_PM / activeRead.nm;
      const A_m = R_m * 0.16;
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2;
        const dr = activeRead.fits
          ? A_m * Math.cos(n * th) * Math.cos(phase)
          : A_m * 0.08 * Math.cos(n * th - phase); // non-integer smeared/cancelled
        pos[i * 3] = (R_m + dr) * Math.cos(th);
        pos[i * 3 + 1] = 0.002;
        pos[i * 3 + 2] = (R_m + dr) * Math.sin(th);
      }
      geo.attributes.position.needsUpdate = true;
    };

    group.userData.sync = sync;
    sync(f, state);
  }
  if (f.kind === 'view') {
    const j = joystickGeometry(f);
    const centerPlate = toPlate({ x: j.cx, y: j.cy });
    const R_m = j.r * s;

    const own = c.own ? c.own.bind(c) : m => { m.userData.tableOwned = true; return m; };

    // Bezel ring for socket
    const bezelMat = c.mats?.lining || own(new THREE.MeshStandardMaterial({ color: 0x2e2a24, roughness: 0.6 }));
    bezelMat.userData = { ...bezelMat.userData, tableOwned: true };
    const bezelGeo = new THREE.CylinderGeometry(R_m * 0.95, R_m, 0.005, 32);
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.position.set(centerPlate.x, c.ground + 0.002, centerPlate.z);
    group.add(bezel);

    // Inner socket bowl
    const bowlMat = own(new THREE.MeshStandardMaterial({ color: 0x14120f, roughness: 0.85 }));
    bowlMat.userData = { ...bowlMat.userData, tableOwned: true };
    const bowlGeo = new THREE.CylinderGeometry(R_m * 0.78, R_m * 0.68, 0.004, 24);
    const bowl = new THREE.Mesh(bowlGeo, bowlMat);
    bowl.position.set(centerPlate.x, c.ground + 0.003, centerPlate.z);
    group.add(bowl);

    // Joystick stick pivot group
    const stickGroup = new THREE.Group();
    stickGroup.position.set(centerPlate.x, c.ground + 0.003, centerPlate.z);
    group.add(stickGroup);

    // Shaft
    const shaftLen = 0.038;
    const shaftGeo = new THREE.CylinderGeometry(0.003, 0.0035, shaftLen, 12);
    shaftGeo.translate(0, shaftLen / 2, 0);
    const shaftMat = own(new THREE.MeshStandardMaterial({ color: 0xa8a096, metalness: 0.8, roughness: 0.2 }));
    shaftMat.userData = { ...shaftMat.userData, tableOwned: true };
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    stickGroup.add(shaft);

    // Knob ball
    const knobGeo = new THREE.SphereGeometry(0.009, 20, 16);
    const knobMat = c.mats?.brass || own(new THREE.MeshStandardMaterial({ color: 0xd4a742, metalness: 0.7, roughness: 0.3 }));
    knobMat.userData = { ...knobMat.userData, tableOwned: true };
    const knob = new THREE.Mesh(knobGeo, knobMat);
    knob.position.set(0, shaftLen, 0);
    stickGroup.add(knob);

    // Rubber collar at base
    const collarGeo = new THREE.CylinderGeometry(0.007, 0.012, 0.006, 16);
    const collarMat = c.mats?.rubber || own(new THREE.MeshStandardMaterial({ color: 0x1a1815, roughness: 0.9 }));
    collarMat.userData = { ...collarMat.userData, tableOwned: true };
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 0.003, 0);
    stickGroup.add(collar);

    const syncJoystick = (fixture, st) => {
      const v = viewRead(st, fixture.id);
      const fx = (v.turn / 12) * 2 - 1;
      const fy = -(v.tilt / 3);
      const maxTilt = 0.35;
      stickGroup.rotation.z = -fx * maxTilt;
      stickGroup.rotation.x = fy * maxTilt;
    };
    group.userData.sync = syncJoystick;
    group.userData.update = syncJoystick;
    syncJoystick(f, state);
  }
  return group;
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
  dress3d,
  pilesOf,
  slot3d: (zone, state) => (state?.prediction && zone.id === state.prediction.slot ? null : 'holder'),
  deckStyle: () => 'instrument',
  restHeight,
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

const SHOT_LABELS = ['1', '50', '500'];

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
  if (exposure) dials.burst = { min: 1, max: 3, step: 1, value: 1, label: 'Number of shots:', labels: SHOT_LABELS };
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

/** The joystick view every turning cloud shares: turn (0 to 330 degrees, 30 a step) and tilt (-90 to 90), and optionally a slice switch. */
export function viewFixture(id, at, { slice = false } = {}) {
  const size = slice ? { w: 54, h: 32 } : { w: 42, h: 24 };
  const dials = {
    turn: { min: 0, max: 12, step: 0.05, value: 1, label: 'Turn' },
    tilt: { min: -3, max: 3, step: 0.05, value: 1, label: 'Tilt' }
  };
  if (slice) dials.slice = { min: 0, max: 1, step: 1, value: 0, label: 'Slice', labels: ['Off', 'On'] };
  return {
    id, kind: 'view', label: 'View', at: { ...at }, size, noRun: true, dials,
    props: { joystick: true, hideLabel: true }
  };
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
