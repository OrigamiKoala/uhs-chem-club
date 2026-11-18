#!/usr/bin/env node
/**
 * gen-ember-layout.mjs — Lays out Ember Reach's caldera-wall switchback and writes
 * `src/three/world-data/ember.json`.
 *
 * Deterministic, derived from `src/three/ember/caldera-plan.js` and `src/three/ember/host-plan.js`.
 * Site ids (`site-1..7`), `questId`, `label`, `stage` and `built` flags are preserved unchanged.
 *
 * Run: node tools/gen-ember-layout.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ROOMS, sitePlacement, PAD, SPAWN, SPAWN_LOOK, ARENA, LAKE, CONE, CALDERA_FLOOR, LEVEL, makeCalderaPlan
} from '../src/three/ember/caldera-plan.js';
import { HOST_PLAN } from '../src/three/ember/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const round = n => Math.round(n * 100) / 100;
const deg = d => d * Math.PI / 180;

const plan = makeCalderaPlan();

/* ---------------------------------------------------------------- the sites */

const sites = ROOMS.map((rm, i) => {
  const { pos, approachPos } = sitePlacement(rm);
  return {
    id: rm.site,
    questId: rm.questId,
    stage: i + 1,
    roomId: rm.id,
    pos,
    approachPos,
    label: `Bench ${i + 1} - ${rm.title}`,
    structure: HOST_PLAN[rm.site].structure,
    built: true
  };
});

/* --------------------------------------------------------- the caldera main */

/**
 * The elevated geothermal steam main: runs from the upper cliff wellhead along the caldera wall,
 * drops down to Level 4, lifts into a 7.4 m expansion loop across the entrance to the Crucible's
 * arena (`x = 20, z in [-42, -30]`), and runs west past the overlook to the Fifth Guild's siphon.
 * Points are `[x, height above ground(x,z), z]`.
 */
const pipes = [
  {
    id: 'caldera-main',
    radius: 0.45,
    points: [
      // From the Turbine Hall's west gable (`x = 28, z = -23`) out north onto `road-4`
      [27.2, 3.8, -23.0],
      [22.0, 3.8, -23.0],
      [22.0, 3.8, -32.0],
      // Expansion loop crossing the arena entrance (`x = 20, z in [-42, -30]`) high at 7.4 m
      [20.0, 3.8, -32.0],
      [20.0, 7.4, -32.0],
      [20.0, 7.4, -40.0],
      [20.0, 3.8, -40.0],
      // South-west along the cliff foot behind the arena (`z = -28`, off the walk) toward the west shelf
      [20.0, 3.8, -28.0],
      [-26.5, 3.8, -28.0],
      [-26.5, 3.8, -54.0]
    ]
  },
  // Tap from the main into the Fifth Guild's frost-furred siphon manifold on the west overlook ledge
  {
    id: 'siphon-tap',
    radius: 0.24,
    points: [
      [-26.5, 3.8, -54.0],
      [-29.2, 3.8, -54.0],
      [-29.2, 2.3, -54.0]
    ]
  }
];

/* ---------------------------------------------------------------- landmarks */

const landmarks = [];
const add = (asset, x, z, radius, extra = {}) => {
  landmarks.push({ asset, pos: [round(x), round(plan.height(x, z)), round(z)], radius, ...extra });
};

// Landing pad on the Rim Shelf (Level 0, y = 20 m), clear of every collider.
add('landing-pad', PAD[0], PAD[1], 10, { minTier: 'T3' });

// Comms mast at the southeast corner of the Rim Shelf (off the walk, behind the rim).
add('comms-mast', 84, 98, 1.6, { minTier: 'T3' });

// Worker habitats perched on the upper south-west rim shoulder (far country / skyline).
add('habitat', -42, 74, 6.0, { rotY: round(deg(155)), minTier: 'T3' });
add('habitat', -66, 68, 6.0, { rotY: round(deg(130)), minTier: 'T3' });

// Cooling cells & transformer on the lower west shelf outside the arena (`x < -30`, off the walk).
add('cooling-cells', -44, -44, 10.5, { rotY: round(deg(90)), minTier: 'T3' });
add('transformer', -44, -22, 4.2, { minTier: 'T3' });

// Power pylons climbing from the west transformer up the caldera shoulder to the south rim.
{
  const line = [[-44, -22], [-78, 18], [-82, 66], [-48, 104]];
  for (let i = 1; i < line.length; i++) {
    const prev = line[i - 1], next = line[Math.min(line.length - 1, i + 1)];
    const rotY = Math.atan2(next[0] - prev[0], next[1] - prev[1]);
    add('pylon', line[i][0], line[i][1], 3.2, { line: i - 1, rotY: round(rotY), minTier: 'T3' });
  }
}

// The Fifth Guild's frost-furred siphon manifold on the rock ledge just west of the overlook (`arena-deck` ends at x = -24).
add('siphon-manifold', -31.5, -54, 4.6, { rotY: round(deg(90)), minTier: 'T3' });

// Production wellheads on flat outer caldera shoulders feeding the geothermal plant.
add('wellhead', 96, 66, 3.4, { rotY: round(deg(180)), minTier: 'T3' });
add('wellhead', -78, -42, 3.4, { rotY: round(deg(0)), minTier: 'T3' });

// Volcanic vent field features placed purposefully on flat unwalked terrace shoulders (never on slopes or the road).
// Geyser on the lower east shelf outside Turn 4, visible as the player descends Ramp 4.
add('geyser', 86, -40, 4.6, { minTier: 'T3' });
// Mud pots on the flat outer shoulders.
add('mud-pot', -42, 38, 3.2, { minTier: 'T3' });
add('mud-pot', 86, -56, 2.8, { scale: 0.85, minTier: 'T3' });
// Sinter terraces on the flat outer shoulders.
add('sinter-terrace', -44, 62, 4.4, { scale: 0.85, rotY: 0.5, minTier: 'T4' });
add('sinter-terrace', 44, -56, 4.4, { scale: 0.85, rotY: 2.2, minTier: 'T4' });

// Fumaroles breathing sulphur plumes along flat outer caldera shoulders and overlook flanks.
const fumaroles = [
  [-56, 38, 1.0], [96, 38, 1.0], [96, 14, 1.0],
  [-78, 10, 1.05], [-78, -10, 1.0], [86, -10, 1.0],
  [54, -52, 1.05], [-34, -66, 1.15], [32, -56, 1.1],
  [96, 78, 0.95], [-52, 62, 1.0]
];
for (const [fx, fz, sc] of fumaroles) {
  add('fumarole', fx, fz, round(1.5 * sc), { scale: sc, minTier: 'T4' });
}

// Sulphur mounds & obsidian lava lobes on flat outer shoulders.
const mounds = [
  [-50, 38, 1.0], [94, 24, 0.9], [-76, -18, 1.0], [42, -48, 1.0], [-36, -60, 1.0]
];
for (const [mx, mz, sc] of mounds) {
  add('sulfur-mound', mx, mz, round(0.95 * sc), { scale: sc, minTier: 'T4' });
}
const lobes = [
  [-56, 62, 1.15], [88, -22, 1.2], [-76, -34, 1.15], [34, -64, 1.2], [-44, -66, 1.2]
];
for (const [lx, lz, sc] of lobes) {
  add('lava-lobe', lx, lz, round(1.4 * sc), { scale: sc, minTier: 'T4' });
}

// Work lamp posts marking the switchback road, ramps, hairpins and arena edge.
// Placed just off the inside edge of the road (`0.55 m` from the kerb/wall) so they never block walking.
const lampPosts = [
  // Rim shelf & Ramp 1
  [44, 60], [22, 60], [6, 65.1], [-8, 65.1],
  // Hairpin 1 & Road 1
  [-28.8, 52], [-28.8, 38], [-12, 34.8], [6, 34.8], [22, 34.8], [40, 34.8],
  // Ramp 2 & Hairpin 2
  [54, 41.1], [68, 41.1], [86.8, 30], [86.8, 14],
  // Road 2 & Ramp 3
  [64, 10.8], [42, 10.8], [20, 10.8], [-6, 10.8], [-22, 10.8], [-38, 17.1], [-50, 17.1],
  // Hairpin 3 & Road 3
  [-66.8, 6], [-66.8, -10], [-44, -13.2], [-20, -13.2], [0, -13.2], [22, -13.2],
  // Ramp 4 & Hairpin 4
  [42, -6.9], [56, -6.9], [74.8, -18], [74.8, -36],
  // Road 4 & Arena deck perimeter (well outside the 7 m Crucible ring around (0, -58))
  [52, -41.2], [30, -41.2], [18.5, -31.5], [18.5, -58], [-22.5, -36], [-22.5, -58]
];
for (const [lx, lz] of lampPosts) {
  add('lamp-post', lx, lz, 0.45, { minTier: 'T3' });
}

/* ---------------------------------------------------------------- t2 & t1 */

const stillCamera = {};
for (const s of sites) {
  stillCamera[s.id] = {
    pos: [s.approachPos[0], s.approachPos[1], s.approachPos[2]],
    lookAt: [s.pos[0], round(s.pos[1] + 1.2), s.pos[2]]
  };
}

const data = {
  id: 'ember',
  name: 'Ember Reach',
  place: 'Volcanic vent field',
  oneLine: 'Thermal energy transfer, reaction enthalpy, bond energies, entropy, and Gibbs free energy.',
  sky: 'ember-sky',
  terrain: {
    heightmap: 'ember-caldera',
    size: [240, 240],
    maxHeight: 20,
    material: 'sinter-crust'
  },
  ambience: {
    keyLight: 16764826,
    fillLight: 12887164,
    fogColor: 10257510,
    fogNear: 50,
    fogFar: 600,
    dustDensity: 0.5
  },
  floor: { level: CALDERA_FLOOR },
  lake: LAKE,
  cone: CONE,
  arena: {
    boss: ARENA.boss,
    player: ARENA.player
  },
  spawn: {
    pos: SPAWN,
    lookAt: SPAWN_LOOK
  },
  pipes,
  sites,
  landmarks,
  t2: { stillCamera },
  t1: { siteOrder: sites.map(s => s.id) },
  tracks: []
};

writeFileSync(join(root, 'src/three/world-data/ember.json'), JSON.stringify(data, null, 2) + '\n');
console.log(`wrote src/three/world-data/ember.json: ${sites.length} sites, ${landmarks.length} landmarks, ${pipes.length} pipe runs`);
