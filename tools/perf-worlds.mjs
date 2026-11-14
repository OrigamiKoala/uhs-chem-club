/**
 * perf-worlds.mjs — what each walkable Learn world costs to draw and to update.
 *
 * Builds every world headlessly (the same DOM shim the verify scripts use) and
 * reports, per world: draw calls a frame would issue with nothing culled,
 * triangles, lights, shadow casters, distinct materials and geometries, the
 * objects whose matrices are recomputed each frame, and the CPU time of one
 * `update()`. A reading aid, not a check.
 *
 *   node tools/perf-worlds.mjs [world ...] [-v] [--props]
 */
import { installDomShim } from './lib/dom-shim.mjs';
installDomShim({ tier: 'T4' });
const THREE = await import('three');
const { consolidateStatic } = await import('../src/three/materials/pbr-kit.js');

const WORLDS = {
  tallow: ['../src/three/tallow.js', 'TallowWorld'],
  lanternfall: ['../src/three/lanternfall.js', 'LanternfallWorld'],
  ligar: ['../src/three/ligar.js', 'LigarWorld'],
  bellows: ['../src/three/bellows.js', 'BellowsWorld'],
  ember: ['../src/three/ember.js', 'EmberReachWorld'],
  mirrowen: ['../src/three/mirrowen.js', 'MirrowenWorld'],
  kettle: ['../src/three/kettle.js', 'KettleWorld'],
  teeter: ['../src/three/teeter.js', 'TeeterWorld'],
  verdigris: ['../src/three/verdigris.js', 'VerdigrisWorld'],
  brinewire: ['../src/three/brinewire.js', 'BrinewireWorld'],
  quicklight: ['../src/three/quicklight.js', 'QuicklightWorld'],
  lodestone: ['../src/three/lodestone.js', 'LodestoneWorld'],
  thornmere: ['../src/three/thornmere.js', 'ThornmereWorld']
};

const pick = process.argv.slice(2).filter(a => !a.startsWith('-'));
const verbose = process.argv.includes('-v');
const rows = [];
for (const [name, [path, cls]] of Object.entries(WORLDS)) {
  if (pick.length && !pick.includes(name)) continue;
  const mod = await import(path);
  const t0 = performance.now();
  const world = new mod[cls](null);
  const build = performance.now() - t0;
  const scene = world.scene;
  // A world built for drawing bakes its props together (`consolidateStatic`); one built with no renderer does not, so
  // the same pass is run here. `--props` reports the world as the checks see it. The pass must not lose a triangle.
  if (!process.argv.includes('--props')) {
    const count = () => { let t = 0; scene.traverse(o => { const g = o.isMesh && o.geometry; if (g) t += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); }); return t; };
    const was = count();
    consolidateStatic(scene);
    if (count() !== was) throw new Error(`${name}: consolidateStatic changed the triangle count (${was} -> ${count()})`);
  }
  scene.updateMatrixWorld(true);

  let objects = 0, draws = 0, tris = 0, casters = 0, casterTris = 0, auto = 0, transparent = 0, noCull = 0, sprites = 0;
  const mats = new Set(), geos = new Set(), lights = {}, byName = new Map();
  scene.traverse(o => {
    objects++;
    if (o.matrixAutoUpdate) auto++;
    if (o.isLight) lights[o.type + (o.castShadow ? '*' : '')] = (lights[o.type + (o.castShadow ? '*' : '')] || 0) + 1;
    if (!(o.isMesh || o.isLine || o.isPoints || o.isSprite)) return;
    let vis = true;
    for (let p = o; p; p = p.parent) if (!p.visible) { vis = false; break; }
    if (!vis) return;
    if (o.isSprite) sprites++;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    const g = o.geometry;
    const groups = Array.isArray(o.material) && g?.groups?.length ? g.groups.length : 1;
    draws += groups;
    ms.forEach(m => { mats.add(m); if (m?.transparent) transparent++; });
    if (g) {
      geos.add(g);
      const n = g.index ? g.index.count : (g.attributes.position?.count || 0);
      const t = (n / 3) * (o.isInstancedMesh ? o.count : 1);
      tris += t;
      if (o.castShadow) { casters++; casterTris += t; }
    }
    if (o.frustumCulled === false) noCull++;
    if (verbose) {
      let top = o; while (top.parent && top.parent !== scene) top = top.parent;
      const k = top.name || top.type;
      byName.set(k, (byName.get(k) || 0) + groups);
    }
  });

  // One update, timed over many frames from a standing camera.
  const cam = new THREE.Vector3(0, 1.7, 0);
  let ms = NaN;
  try {
    for (let i = 0; i < 20; i++) world.update(1 / 60, cam);
    const N = 300, t1 = performance.now();
    for (let i = 0; i < N; i++) world.update(1 / 60, cam);
    ms = (performance.now() - t1) / N;
  } catch (e) { ms = `threw: ${e.message}`; }

  rows.push({ world: name, 'build ms': Math.round(build), objects, 'auto-matrix': auto, draws, 'k tris': Math.round(tris / 1000), materials: mats.size, geometries: geos.size, casters, 'caster k tris': Math.round(casterTris / 1000), transparent, 'no-cull': noCull, 'update ms': typeof ms === 'number' ? +ms.toFixed(3) : ms, lights: Object.entries(lights).map(([k, v]) => `${k.replace('Light', '')}:${v}`).join(' ') });
  if (verbose) console.log(name, [...byName.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25));
}
console.table(rows);
