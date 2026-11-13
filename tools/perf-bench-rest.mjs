/**
 * perf-bench-rest.mjs — does a deployed bench come to rest?
 *
 * An open bench holds the sun's shadow map live only while something it stands
 * in the world is moving (`shadow-pace.js` `visitorsMoving`). This deploys every
 * live quest's table stages on their world, runs two seconds of frames with
 * nothing touched, and reports the stages whose shadow never rests, which is
 * where a shadow-casting part is being re-posed every frame. A reading aid,
 * not a check.
 *
 *   node tools/perf-bench-rest.mjs [-v]
 */
import { installDomShim } from './lib/dom-shim.mjs';
installDomShim({ tier: 'T4' });
const THREE = await import('three');
const MODEL = await import('../src/learn/table/model.js');
const { Table3D } = await import('../src/learn/engine/table3d.js');
const { setBenchHost } = await import('../src/learn/engine/bench-host.js');
const { allQuests } = await import('../src/learn/curriculum.js');
const { markWorldOwn, visitorsMoving } = await import('../src/three/shadow-pace.js');
const WORLD_OF = {
  unit01: ['tallow', 'TallowWorld'], unit02: ['lanternfall', 'LanternfallWorld'], unit03: ['ligar', 'LigarWorld'],
  unit04: ['bellows', 'BellowsWorld'], unit05: ['ember', 'EmberReachWorld'], unit06: ['mirrowen', 'MirrowenWorld'],
  unit07: ['kettle', 'KettleWorld'], unit08: ['teeter', 'TeeterWorld'], unit09: ['verdigris', 'VerdigrisWorld'],
  unit10: ['brinewire', 'BrinewireWorld'], unit11: ['quicklight', 'QuicklightWorld'], unit12: ['lodestone', 'LodestoneWorld']
};
const verbose = process.argv.includes('-v');
const worlds = new Map();
const worldFor = async unit => {
  if (!worlds.has(unit)) {
    const [file, cls] = WORLD_OF[unit];
    const w = new (await import(`../src/three/${file}.js`))[cls](null);
    w.scene.updateMatrixWorld(true);
    markWorldOwn(w.scene);
    worlds.set(unit, w);
  }
  return worlds.get(unit);
};
setBenchHost({ mount() {}, unmount() {}, guide() {} });
window.innerWidth = 1920; window.innerHeight = 1080;

const rows = [];
const restless = [];
for (const q of allQuests().filter(x => x.status === 'live')) {
  const [unit, questId] = q.key.split('/');
  if (!WORLD_OF[unit] || q.arena === 'boss') continue;
  const mod = await q.module();
  const tableStages = (mod.STAGES || []).map((s, i) => [s, i]).filter(([s]) => s.widget?.type === 'table');
  if (!tableStages.length) continue;
  const w = await worldFor(unit);
  const anchor = w.benchAnchor(questId);
  if (!anchor) continue;
  w.setBenchDeployed(questId, true);
  let rest = 0;
  for (const [stage, i] of tableStages) {
    const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.05, 80);
    let st = MODEL.createTable(stage.table, stage.title);
    let b;
    try {
      b = new Table3D(null, {
        skin: unit, onAction: () => {},
        world: { scene: w.scene, camera, position: anchor.position, rotationY: anchor.rotationY, topY: anchor.topY, materials: anchor.dormant?.userData?.benchMats || null, object: w, walkOwnsHeight: true }
      });
      b.setState(st);
      b.settleLean?.();
      let live = 0;
      for (let f = 0; f < 120; f++) {
        b.update(1 / 60);
        if (visitorsMoving(w.scene, 1 / 60) && f >= 60) live++;
      }
      if (live === 0) rest++; else restless.push(`${q.key} stage ${i + 1} (${live}/60 frames live)`);
    } catch (e) {
      restless.push(`${q.key} stage ${i + 1} threw: ${e.message}`);
    } finally {
      try { b?.dispose(); } catch { /* a bench that did not build has nothing to free */ }
    }
  }
  w.setBenchDeployed(questId, false);
  rows.push({ quest: q.key, stages: tableStages.length, 'at rest': rest });
}
console.table(rows);
const total = rows.reduce((a, r) => a + r.stages, 0);
const resting = rows.reduce((a, r) => a + r['at rest'], 0);
console.log(`${resting} of ${total} deployed table stages come to rest untouched`);
if (verbose && restless.length) console.log(restless.join('\n'));
