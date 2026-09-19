// Probe: along the bridge<->quarters line, where is a doorway clear?
const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });
const THREE = await import('three');
const { ShipInterior } = await import('../src/three/ship.js');
const scene = new THREE.Scene();
const ship = new ShipInterior(scene);

// bridge (0, 2.0) -> quarters (-3.8, 2.2)
const bx = 0, bz = 2.0, qx = -3.8, qz = 2.2;
let dx = qx - bx, dz = qz - bz;
const L = Math.hypot(dx, dz);
dx /= L; dz /= L;
const px = -dz, pz = dx;

console.log('colliders near the line:');
for (const c of ship.colliders) {
  if (c.maxX > -4.2 && c.minX < 0.5 && c.maxZ > 1.2 && c.minZ < 2.8) {
    console.log(`  box x[${c.minX.toFixed(2)},${c.maxX.toFixed(2)}] z[${c.minZ.toFixed(2)},${c.maxZ.toFixed(2)}]`);
  }
}

for (let t = -0.4; t <= 3.9; t += 0.1) {
  const x = (bx + qx) / 2 + dx * t - (-0.0);
  const z = (bz + qz) / 2 + dz * t;
  // centre between two rooms:
  const mx = (bx + qx) / 2, mz = (bz + qz) / 2;
  const cx = mx + dx * t, cz = mz + dz * t;
  let free = true;
  for (const s of [-0.75, 0.75]) {
    const jx = cx + px * s, jz = cz + pz * s;
    const hit = ship.colliders.some(c => jx + 0.3 > c.minX && jx - 0.3 < c.maxX && jz + 0.3 > c.minZ && jz - 0.3 < c.maxZ);
    if (hit) free = false;
  }
  const holoDist = Math.hypot(cx - 0, cz - 3.2);
  console.log(`t=${t.toFixed(1)}  centre(${cx.toFixed(2)},${cz.toFixed(2)}) colliders-free=${free} holoDist=${holoDist.toFixed(2)}`);
}
