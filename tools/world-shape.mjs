/**
 * world-shape.mjs — how different the walkable Learn worlds are from one another, in numbers.
 *
 * Builds every world headlessly (the DOM shim the verify scripts use) and reports, per world:
 *
 *   ground    the lowest and highest ground a bench's approach mark stands on
 *   relief    the range of ground height met on straight lines from the spawn to each approach
 *             (a crude reading: a line may cross ground the player cannot walk, as Ligar's hills)
 *   housing   per bench, standing at its approach mark at eye height: `R` if there is a roof within
 *             14 m overhead, and how many of 8 compass directions meet a body or the ground within 12 m
 *   housed    benches with a roof and at least 4 of 8 directions closed
 *
 * and, across worlds, every pair whose benches stand on the same coordinates (a cloned layout).
 *
 * A reading aid, not a check. `docs/plans/world-distinction-plan.md` uses it for before and after.
 *
 *   node tools/world-shape.mjs [world ...]
 */
import { installDomShim } from './lib/dom-shim.mjs';
installDomShim({ tier: 'T4' });
const THREE = await import('three');
const { housing, benchGround, marksOf, layoutKey } = await import('./lib/world-shape-checks.mjs');

const WORLDS = {
  tallow: 'TallowWorld', lanternfall: 'LanternfallWorld', ligar: 'LigarWorld', bellows: 'BellowsWorld',
  ember: 'EmberReachWorld', mirrowen: 'MirrowenWorld', kettle: 'KettleWorld', teeter: 'TeeterWorld',
  verdigris: 'VerdigrisWorld', brinewire: 'BrinewireWorld', quicklight: 'QuicklightWorld', lodestone: 'LodestoneWorld', thornmere: 'ThornmereWorld'
};

const pick = process.argv.slice(2).filter(a => !a.startsWith('-'));
const names = pick.length ? pick.filter(n => WORLDS[n]) : Object.keys(WORLDS);
const layouts = {};

console.log('world        benches  ground (m)       relief (m)  housed  housing per bench');
for (const name of names) {
  let world;
  try {
    const mod = await import(`../src/three/${name}.js`);
    world = new mod[WORLDS[name]](null);
  } catch (err) {
    console.log(`${name.padEnd(12)} failed to build: ${String(err.message).split('\n')[0]}`);
    continue;
  }
  const sites = world.data.sites;
  const marks = marksOf(world);
  layouts[name] = layoutKey(world.data);

  const { heights: ground } = benchGround(world);
  const sp = Array.isArray(world.data.spawn) ? world.data.spawn : world.data.spawn.pos;
  let lo = Infinity, hi = -Infinity;
  for (const [x, z] of marks) {
    for (let t = 0; t <= 1; t += 0.02) {
      const h = world.getTerrainHeight(sp[0] + (x - sp[0]) * t, sp[2] + (z - sp[2]) * t);
      lo = Math.min(lo, h); hi = Math.max(hi, h);
    }
  }

  // The measurements themselves are the ones the rebuilt worlds' verify scripts hold (`lib/world-shape-checks.mjs`).
  const rows = housing(world, THREE);
  const housed = rows.filter(r => r.housed).length;
  const housingCodes = rows.map(r => r.code);

  console.log(
    name.padEnd(12),
    String(sites.length).padStart(7), ' ',
    `${Math.min(...ground).toFixed(2)} to ${Math.max(...ground).toFixed(2)}`.padEnd(16),
    (hi - lo).toFixed(2).padStart(10), ' ',
    `${housed}/${sites.length}`.padEnd(7),
    housingCodes.join(' ')
  );
  world.dispose?.();
}

const built = Object.keys(layouts);
const clones = [];
for (let i = 0; i < built.length; i++) {
  for (let j = i + 1; j < built.length; j++) {
    if (layouts[built[i]] === layouts[built[j]]) clones.push(`${built[i]} = ${built[j]}`);
  }
}
console.log(clones.length ? `\nbenches on identical coordinates: ${clones.join('; ')}` : '\nno two worlds share bench coordinates');
