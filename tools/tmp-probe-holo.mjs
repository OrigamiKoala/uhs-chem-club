// Probe: is the club holo sightline clear after the doorway fix?
const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });
const THREE = await import('three');
const { ShipInterior } = await import('../src/three/ship.js');

const scene = new THREE.Scene();
const ship = new ShipInterior(scene);
scene.updateMatrixWorld(true);

const doorways = ship.group.children.find(c => c.name === 'doorways');
console.log('doorway positions:');
for (const d of doorways.children) console.log(`  (${d.position.x.toFixed(2)}, ${d.position.z.toFixed(2)})`);

const ray = new THREE.Raycaster();
const isHolo = o => { let p = o; while (p) { if (p === ship.clubHoloGroup) return true; p = p.parent; } return false; };
const isBeam = o => o === ship.clubHoloBeam;

let blocked = 0, rays = 0;
const corners = [[-0.9, 1.05], [0.9, 1.05], [-0.9, 2.05], [0.9, 2.05], [0, 1.55]];
for (let ex = -1.5; ex <= 1.5; ex += 0.3) {
  for (const ez of [0.6, 1.2, 1.8, 2.2]) {
    const eye = new THREE.Vector3(ex, 1.55, ez);
    for (const [dx, cy] of corners) {
      const t = new THREE.Vector3(dx, cy, 3.2);
      ray.set(eye, t.clone().sub(eye).normalize());
      ray.far = eye.distanceTo(t) - 0.02;
      const hits = ray.intersectObjects(ship.group.children, true)
        .filter(h => h.object.isMesh && !isHolo(h.object) && !isBeam(h.object));
      rays++;
      if (hits.length) {
        blocked++;
        console.log(`blocked: eye(${ex.toFixed(1)},${ez}) -> (${dx},${cy}) by ${hits[0].object.geometry?.type} at (${hits[0].point.x.toFixed(2)}, ${hits[0].point.y.toFixed(2)}, ${hits[0].point.z.toFixed(2)})`);
      }
    }
  }
}
console.log(`\n${rays - blocked}/${rays} rays clear`);
