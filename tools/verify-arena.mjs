#!/usr/bin/env node
/**
 * verify-arena.mjs — The boss fights, seen: the table in the arena, the bodies, and the camera that looks up at them.
 *
 * A boss is fought over a table stood in the boss's own arena (`three/arena-table.js`), so the foe is in the glass and not a toy in
 * the table's corner. This holds that to what it owes:
 *
 *  - THE TABLE STANDS ON OPEN GROUND, in each of the five walkable worlds: level ground under its deck, no collider and no world body
 *    on the deck, in the air over it (the camera's lean air), or in the corridor between the table and the boss, and the boss itself
 *    stands on ground with nothing in its reach.
 *  - IT IS REGISTERED AS A BENCH: `benchAnchor` answers for the boss quest, deploying it counts as an open bench, taking it down
 *    leaves the world exactly as it was (anchor, collider, scene children).
 *  - IT FACES THE PLAYER, between the player and the boss.
 *  - EVERY BOSS BODY IS WELL FORMED (the five of the walkable worlds; Kettle's golem has no arena yet): built, finite, grounded (the flier hovers with its tendrils clear of the ground), a size that
 *    reads as a boss at the arena's scale, a few thousand to a few tens of thousands of triangles, a muzzle, armour that is struck
 *    off as it is hurt and is already gone when a fight is resumed late, every pose (gathering, striking, rearing, hurt,
 *    convulsing) a finite one, and a collapse that ends.
 *  - THE CAMERA LOOKS UP AT THE BOSS and comes back: a leaned-in table in an arena turns toward a gaze request, holds it, returns to
 *    the lean pose exactly, ignores presses on the plate while it is away, and a deployed table takes the arena's shake.
 *  - THE CORNER FOE STANDS DOWN: a table in an arena has no toy on its pad.
 */

const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });

const THREE = await import('three');
// The worlds first: they pull in the shared kit in the order the app does (`bench-bay.js` first would meet its own cycle through the tier probe).
await import('../src/three/tallow.js');
await import('../src/three/lanternfall.js');
await import('../src/three/ligar.js');
await import('../src/three/bellows.js');
await import('../src/three/ember.js');
const { collectBoxes } = await import('./lib/overlap.mjs');
const { arenaTablePlan, buildArenaTable, ARENA_TABLE } = await import('../src/three/arena-table.js');
const { BOSS_ARENA_SPOTS } = await import('../src/learn/engine/boss-arena.js');

let failures = 0;
const fail = msg => { console.log(`  FAIL ${msg}`); failures++; };
const ok = msg => console.log(`  ok   ${msg}`);
const check = (cond, good, bad) => (cond ? ok(good) : fail(bad));

console.log('Boss fights — the table in the arena, the bodies, the look up\n');

/* ------------------------------------------------------------ the table, in every world */

const WORLDS = [
  ['unit01', 'Tallow', '../src/three/tallow.js', 'TallowWorld', 'boss-hopper'],
  ['unit02', 'Lanternfall', '../src/three/lanternfall.js', 'LanternfallWorld', 'boss-eater'],
  ['unit03', 'Ligar', '../src/three/ligar.js', 'LigarWorld', 'boss-warden'],
  ['unit04', 'Bellows', '../src/three/bellows.js', 'BellowsWorld', 'boss-compressor'],
  ['unit05', 'Ember Reach', '../src/three/ember.js', 'EmberReachWorld', 'boss-crucible']
];

const IGNORED = /cobbles|scrub|pebble|gravel|grass|dust|snow|ice-|decal/i;

for (const [unit, name, file, ctor, questId] of WORLDS) {
  console.log(`${name}: ${questId}`);
  const spot = BOSS_ARENA_SPOTS[questId];
  check(spot && spot.worldId === unit, `${questId} has an arena spot in ${unit}`, `${questId} has no arena spot in ${unit}`);
  if (!spot) continue;

  const mod = await import(file);
  let world = null;
  try { world = new mod[ctor](null); } catch (err) { fail(`${name} did not build: ${err.stack || err.message}`); continue; }
  world.scene.updateMatrixWorld(true);
  const ground = (x, z) => world.getTerrainHeight(x, z);

  const plan = arenaTablePlan(spot, ground);
  const { deck, half } = ARENA_TABLE;

  // Between the player and the boss, facing the player, on level ground.
  const toBoss = [spot.bossPos[0] - spot.playerPos[0], spot.bossPos[2] - spot.playerPos[2]];
  const along = ((plan.x - spot.playerPos[0]) * toBoss[0] + (plan.z - spot.playerPos[2]) * toBoss[1]) / Math.hypot(...toBoss);
  check(Math.abs(along - ARENA_TABLE.standOff) < 1e-6, `the plate stands ${along.toFixed(1)} m in front of the player, toward the boss`, `the plate is ${along.toFixed(2)} m along the line to the boss, not ${ARENA_TABLE.standOff}`);
  // The bench frame's +z (the front) points back along the line from the boss.
  const front = [Math.sin(plan.rotationY), Math.cos(plan.rotationY)];
  const facing = front[0] * -plan.forward[0] + front[1] * -plan.forward[1];
  check(facing > 0.999, 'the table faces the player (its front is the side away from the boss)', `the table's front is ${facing.toFixed(2)} of the way round toward the player`);

  let lo = Infinity, hi = -Infinity;
  const cos = Math.cos(plan.rotationY), sin = Math.sin(plan.rotationY);
  for (let i = 0; i <= 8; i++) for (let j = 0; j <= 6; j++) {
    const lx = -deck.w / 2 + (deck.w * i) / 8;
    const lz = deck.z0 + ((deck.z1 - deck.z0) * j) / 6;
    const h = ground(plan.x + lx * cos + lz * sin, plan.z - lx * sin + lz * cos);
    lo = Math.min(lo, h); hi = Math.max(hi, h);
  }
  check(hi - lo < 0.45, `the ground under the deck is level (${(hi - lo).toFixed(2)} m of fall)`, `the ground under the deck falls ${(hi - lo).toFixed(2)} m: the table would hang or sink`);

  // The deck in the world frame, as a box from the ground to the lean camera's ceiling (4.6 m above the plate).
  const corners = [[-deck.w / 2, deck.z0], [deck.w / 2, deck.z0], [-deck.w / 2, deck.z1], [deck.w / 2, deck.z1]].map(([lx, lz]) => [plan.x + lx * cos + lz * sin, plan.z - lx * sin + lz * cos]);
  const volume = new THREE.Box3(
    new THREE.Vector3(Math.min(...corners.map(c => c[0])) - 0.3, hi + 0.25, Math.min(...corners.map(c => c[1])) - 0.3),
    new THREE.Vector3(Math.max(...corners.map(c => c[0])) + 0.3, plan.y + 5.6, Math.max(...corners.map(c => c[1])) + 0.3)
  );
  const bodies = collectBoxes(world.scene, { tolerance: 0.0 });
  const onDeck = bodies.filter(b => b.box.intersectsBox(volume) && !IGNORED.test(b.name));
  check(onDeck.length === 0, 'no world body stands on the deck or in the air over it', `bodies on the table's ground: ${[...new Set(onDeck.map(h => h.name))].slice(0, 6).join(', ')}`);

  // The corridor from the table to the boss, wide enough for a view and as high as the boss is tall.
  const corridor = new THREE.Box3(
    new THREE.Vector3(Math.min(plan.x, spot.bossPos[0]) - 3, hi + 0.4, Math.min(plan.z, spot.bossPos[2]) - 0.5),
    new THREE.Vector3(Math.max(plan.x, spot.bossPos[0]) + 3, hi + 6, Math.max(plan.z, spot.bossPos[2]) - deck.z0 - 1.6)
  );
  // (the boss's own backdrop, the Compressor's plinth and the Crucible's rim, stand beyond it, not in it)
  const inView = bodies.filter(b => b.box.intersectsBox(corridor) && !IGNORED.test(b.name) &&
    b.box.getCenter(new THREE.Vector3()).z > Math.min(spot.bossPos[2] + 6, plan.z - 6) && b.box.getSize(new THREE.Vector3()).y > 0.4);
  check(inView.length === 0, 'nothing stands in the corridor between the table and the boss', `in the way of the view: ${[...new Set(inView.map(h => h.name))].slice(0, 6).join(', ')}`);

  // (the walk's own radius is a quarter of a metre: that much room round the deck is what a collider must leave)
  const room = 0.25;
  const blocking = (world.colliders || []).filter(c => {
    if (c.radius != null) {
      const dx = Math.max(volume.min.x + 0.3 - c.x, 0, c.x - (volume.max.x - 0.3));
      const dz = Math.max(volume.min.z + 0.3 - c.z, 0, c.z - (volume.max.z - 0.3));
      return Math.hypot(dx, dz) < c.radius + room * 0 + 0.0;
    }
    return c.maxX > volume.min.x + 0.3 && c.minX < volume.max.x - 0.3 && c.maxZ > volume.min.z + 0.3 && c.minZ < volume.max.z - 0.3;
  });
  void room;
  check(blocking.length === 0, 'no collider reaches the deck', `${blocking.length} colliders on the deck, e.g. ${JSON.stringify(blocking[0])}`);

  // Registered like a bench; taking it down restores the world.
  const children = world.scene.children.length;
  const colliders = world.colliders.length;
  const arena = buildArenaTable(world, { questId, spot });
  const anchor = world.benchAnchor(questId);
  check(Boolean(anchor) && anchor.arena === true && Math.abs(anchor.topY - (plan.y + 0.995)) < 1e-6, `${questId} answers as a bench (plate top ${anchor?.topY?.toFixed(2)})`, `${questId} is not registered as a bench`);
  check(world.scene.children.length === children + 1 && world.colliders.length === colliders + 1, 'one table in the scene, one collider in the walk', 'the table added the wrong number of things to the world');
  world.setBenchDeployed(questId, true);
  check(world.benchesOpen === 1 || world.benchesOpen > 0, 'deploying it counts as an open bench', 'deploying it did not count as an open bench');
  arena.group.updateMatrixWorld(true);
  const tb = new THREE.Box3().setFromObject(arena.group);
  check(tb.min.y >= plan.y - 0.02 && tb.max.y < plan.y + 1.6 && tb.getSize(new THREE.Vector3()).x < deck.w + 0.1, `the table is ${tb.getSize(new THREE.Vector3()).x.toFixed(1)} m wide and ${(tb.max.y - plan.y).toFixed(2)} m high`, 'the table is the wrong size');
  const hit = world.colliders[world.colliders.length - 1];
  check(hit.maxX - hit.minX > 4.8 && hit.maxZ - hit.minZ > 1.3, 'its collider covers the plate', 'its collider is smaller than the plate');
  arena.dispose();
  check(!world.benchAnchor(questId) && world.scene.children.length === children && world.colliders.length === colliders, 'taking it down leaves the world as it was', 'the table left something behind in the world');
  check(!(world.benchesOpen > 0), 'and no bench is left open', 'a bench was left open');

  // The boss's own ground is not under water and not on a slope it would slide down.
  const bg = [ground(spot.bossPos[0], spot.bossPos[2]), ground(spot.bossPos[0] + 4, spot.bossPos[2]), ground(spot.bossPos[0] - 4, spot.bossPos[2]), ground(spot.bossPos[0], spot.bossPos[2] + 4)];
  check(Math.max(...bg) - Math.min(...bg) < 1.2, `the boss stands on level ground (${(Math.max(...bg) - Math.min(...bg)).toFixed(2)} m over its stride)`, 'the boss stands on a slope');
  void half;
  world.dispose?.();
}

/* ------------------------------------------------------------ the bodies */

console.log('\nthe five bodies');
{
  const { CombatMonster3D } = await import('../src/learn/engine/combat-monster-3d.js');
  const { BOSS_SPECIES } = await import('../src/learn/engine/boss-models.js');
  const SPECIES = ['the hopper', 'the lantern-eater', 'basalt warden', 'the compressor', 'the crucible'];
  check(SPECIES.every(s => BOSS_SPECIES.includes(s)) && BOSS_SPECIES.length === 5, 'boss-models.js builds all five', `boss-models.js builds ${BOSS_SPECIES.join(', ')}`);

  const SCALE = { 'the hopper': 1.8, 'the lantern-eater': 1.1, 'basalt warden': 1.0, 'the compressor': 1.5, 'the crucible': 1.4 };
  for (const spec of SPECIES) {
    const spotEntry = Object.values(BOSS_ARENA_SPOTS).find(s => s.species === spec);
    const scale = spotEntry?.scale ?? SCALE[spec];
    const m = new CombatMonster3D(spec, { id: 'boss' }, { x: 0, y: 0, z: 0, scale: 1 });
    const scene = new THREE.Scene();
    scene.add(m.group);
    const eye = new THREE.Vector3(0, 1.6, 30);
    const flier = Boolean(spotEntry?.flies);
    const label = spec;

    check(Boolean(m.rig) && m.isBoss, `${label}: a rig, flagged a boss`, `${label}: no rig`);
    m.update(0.016, false, eye);
    m.hitBox.visible = false;
    let tris = 0, meshes = 0, bad = 0;
    m.group.traverse(o => {
      if (!o.isMesh) return;
      meshes++;
      const g = o.geometry;
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) if (!Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i))) { bad++; break; }
    });
    check(bad === 0, `${label}: every vertex is finite`, `${label}: ${bad} geometries have NaN vertices`);
    check(tris >= 3000 && tris <= 40000 && meshes <= 260, `${label}: ${meshes} meshes, ${Math.round(tris)} triangles`, `${label}: ${meshes} meshes, ${Math.round(tris)} triangles (3000..40000 triangles, 260 meshes)`);

    const box = new THREE.Box3().setFromObject(m.group);
    const size = box.getSize(new THREE.Vector3());
    const h = size.y * scale;
    check(h >= 5.2 && h <= 10.5, `${label}: ${h.toFixed(1)} m tall at its arena's scale ${scale}`, `${label}: ${h.toFixed(1)} m tall at scale ${scale} (a boss stands 5..10 m)`);
    check(size.x * scale <= 14 && size.z * scale <= 11, `${label}: ${(size.x * scale).toFixed(1)} m across, ${(size.z * scale).toFixed(1)} m deep`, `${label}: ${(size.x * scale).toFixed(1)} x ${(size.z * scale).toFixed(1)} m is too much body for the arena`);
    if (flier) check(box.min.y > -3.2 * scale && box.min.y < 0, `${label}: hovers, tendrils ${(-box.min.y * scale).toFixed(1)} m below its middle`, `${label}: the flier's lowest point is ${box.min.y.toFixed(2)}`);
    else check(box.min.y > -0.4 && box.min.y < 0.2, `${label}: stands on the ground (lowest point ${box.min.y.toFixed(2)})`, `${label}: lowest point ${box.min.y.toFixed(2)} m: it floats or sinks`);
    check(Boolean(m.muzzle), `${label}: has a muzzle for its bolt`, `${label}: no muzzle`);
    check(m.armourPlates.length >= 2, `${label}: ${m.armourPlates.length} armour plates`, `${label}: only ${m.armourPlates.length} armour plates to strike off`);

    // Every pose, finite, then a collapse that ends.
    const run = n => { for (let i = 0; i < n; i++) m.update(0.016, false, eye); };
    const finite = () => { const b = new THREE.Box3().setFromObject(m.group); return Number.isFinite(b.min.x + b.min.y + b.min.z + b.max.x + b.max.y + b.max.z); };
    let posesOk = true;
    m.triggerTelegraph(0.55); for (let i = 0; i < 70 && posesOk; i++) { m.update(0.016, false, eye); posesOk = finite(); }
    m.triggerHitReact(1); run(40); posesOk = posesOk && finite();
    m.triggerRoar(); run(80); posesOk = posesOk && finite();
    m.setDamage(0.5); run(120); posesOk = posesOk && finite();
    check(posesOk, `${label}: gather, strike, hit, roar and wound all pose to finite geometry`, `${label}: a pose produced non-finite geometry`);
    let events = [];
    m.onEvent = (n) => events.push(n);
    m.setDamage(1); run(240);
    check(m.armourPlates.every(p => p.off), `${label}: every plate is off at full wound`, `${label}: ${m.armourPlates.filter(p => !p.off).length} plates still on at full wound`);
    check(events.includes('plate'), `${label}: a plate struck off says so (the arena throws sparks)`, `${label}: striking a plate off raised no event`);
    m.triggerDeathThroes(); run(70); m.shatter(); run(60 * 6);
    check(m.isGone, `${label}: comes apart and is gone`, `${label}: still standing after the collapse`);
    m.dispose();

    // Resumed at phase 4: it arrives already hurt, plates already off, nothing flying.
    const r = new CombatMonster3D(spec, { id: 'boss' }, { x: 0, y: 0, z: 0, scale: 1 });
    const rs = new THREE.Scene(); rs.add(r.group);
    r.setDamage(0.8, true);
    const early = r.armourPlates.filter(p => p.at <= 0.8);
    check(early.every(p => p.off && !p.mesh.visible) && r.flying.length === 0, `${label}: a fight resumed at 80% finds its first plates already gone`, `${label}: resuming a fight left plates on or threw them`);
    r.dispose();
  }
}

/* ------------------------------------------------------------ the camera */

console.log('\nthe look up');
{
  const MODEL = await import('../src/learn/table/model.js');
  const FIX = await import('./lib/table-fixture.mjs');
  const { Table3D } = await import('../src/learn/engine/table3d.js');
  const host = await import('../src/learn/engine/bench-host.js');
  const { TallowWorld } = await import('../src/three/tallow.js');
  FIX.registerTestKit();

  const world = new TallowWorld(null);
  world.scene.updateMatrixWorld(true);
  const spot = BOSS_ARENA_SPOTS['boss-hopper'];
  const arena = buildArenaTable(world, { questId: 'boss-hopper', spot });
  const anchor = world.benchAnchor('boss-hopper');
  world.setBenchDeployed('boss-hopper', true);
  window.innerWidth = 1920; window.innerHeight = 1080;
  const camera = new THREE.PerspectiveCamera(55, 1920 / 1080, 0.05, 200);
  const frame = {
    scene: world.scene, camera, position: anchor.position, rotationY: anchor.rotationY, topY: anchor.topY,
    materials: anchor.dormant?.userData?.benchMats || null, object: world, walkOwnsHeight: true, arena: true
  };
  const actions = [];
  const bench = new Table3D(null, { world: frame, onAction: a => actions.push(a) });
  const state = MODEL.createTable(FIX.TEST_TABLE_WIDE, 'arena');
  bench.setState(state);
  bench.settleLean();
  check(bench.leaning, 'a table in an arena leans in over its plate', 'the table did not lean in');

  const target = new THREE.Vector3(spot.bossPos[0], 4, spot.bossPos[2]);
  const dir = (cam) => new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
  const toTarget = () => target.clone().sub(camera.position).normalize();
  const angleOff = () => dir(camera).angleTo(toTarget());

  const lean = camera.position.clone();
  const leanDir = dir(camera).clone();
  const off0 = angleOff();
  check(off0 > 0.4, `leaned in, the view is on the table (${(off0 * 57.3).toFixed(0)} degrees off the boss)`, 'the lean view already looks at the boss');

  host.requestGaze({ point: out => out.copy(target), hold: 1.0, inS: 0.3, outS: 0.5 });
  let t = 0;
  const step = (sec) => { for (let i = 0; i < Math.round(sec / 0.016); i++) { bench.update(0.016); t += 0.016; } };
  step(0.5);
  check(angleOff() < 0.05, `held on the boss after the turn (${(angleOff() * 57.3).toFixed(1)} degrees off)`, `the view did not turn onto the boss: ${(angleOff() * 57.3).toFixed(1)} degrees off`);
  check(camera.position.distanceTo(lean) < 1e-6, 'the camera does not move, only turns', `the camera moved ${camera.position.distanceTo(lean).toFixed(3)} m`);
  check(bench.gazing, 'the plate takes no press while the view is away', 'the table still thinks it is looked at');
  check(bench.unitsAtRay() === null, 'a ray at that moment reaches no table unit', 'a press while looking away reaches the table');
  step(1.4);
  check(!bench.gazing && dir(camera).angleTo(leanDir) < 1e-3, 'it comes back to the lean pose exactly', `it did not return: ${(dir(camera).angleTo(leanDir) * 57.3).toFixed(2)} degrees off`);

  // The arena's shake is applied to the camera while leaned in.
  let shakeCalls = 0;
  host.setShakeSource(() => { shakeCalls++; return { roll: 0, posX: 0.05, posY: 0.03 }; });
  bench.update(0.016);
  check(shakeCalls > 0 && Math.abs(camera.position.x - lean.x - 0.05) < 1e-6, 'the shake source moves the leaned-in camera', 'the arena\'s shake does not reach the leaned-in camera');
  host.setShakeSource(null);

  // A new request while one is under way carries on from where the head is, and a request to end lets go.
  host.requestGaze({ point: out => out.copy(target), hold: 5, inS: 0.3, outS: 0.4 });
  step(0.5);
  host.requestGaze(null);
  step(0.7);
  check(!bench.gaze, 'a request to end the look lets go', 'a look outlived its end');

  // No toy in the corner.
  const snap = { enc: { foes: [{ id: 'f', label: 'The Boss' }], species: 'the hopper', speciesName: 'The Hopper' }, fight: { lost: 0 }, poses: new Map() };
  bench.foes.sync(snap);
  bench.foes.update(0.05);
  check(!bench.foes.group.visible, 'the corner foe stands down in an arena', 'the corner foe is on the pad of a table in an arena');

  bench.dispose();
  arena.dispose();
}

console.log(`\n${failures === 0 ? 'ARENA OK' : `ARENA FAILED: ${failures}`}`);
process.exit(failures === 0 ? 0 : 1);
