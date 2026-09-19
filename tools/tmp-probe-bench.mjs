// Probe: build Tallow + a deployed CoreBench3D exactly as the app does, and
// print where the camera docks and where every panel lands in NDC.
const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });
const THREE = await import('three');
const { TallowWorld } = await import('../src/three/tallow.js');

const W = 1440, H = 900;
const camera = new THREE.PerspectiveCamera(55, W / H, 0.05, 60);

const world = new TallowWorld(null);
world.scene.updateMatrixWorld(true);

const anchor = world.benchAnchor('q2-core');
console.log('core-bench anchor:', JSON.stringify({
  position: anchor.position.map(v => +v.toFixed(2)),
  rotationY: +anchor.rotationY.toFixed(3),
  topY: +anchor.topY.toFixed(3)
}));
const site2 = world.data.sites.find(s => s.id === 'site-2');
console.log('site-2 approachPos:', site2.approachPos);

const { CoreBench3D } = await import('../src/learn/engine/corebench3d.js');
const bench = new CoreBench3D(null, {
  world: {
    scene: world.scene,
    camera,
    position: anchor.position,
    rotationY: anchor.rotationY,
    topY: anchor.topY
  },
  // no bench host registered -> scene never mounted; we only need its camera math
});
// 3 specimen stations, the widest layout this quest builds
bench.setSpecimens([
  { id: 'a', label: 'CAN 01', note: '', core: { marked: 3, blank: 4 }, rings: [2, 8, 1] },
  { id: 'b', label: 'CAN 02', note: '', core: { marked: 6, blank: 6 }, rings: [2, 8, 8, 2] },
  { id: 'c', label: 'CAN 03', note: '', core: { marked: 8, blank: 10 }, rings: [2, 8, 8, 1] }
]);

camera.updateMatrixWorld(true);
console.log('docked camera world pos:', camera.position.toArray().map(v => +v.toFixed(2)));

// Where does the camera look?
const dir = new THREE.Vector3();
camera.getWorldDirection(dir);
console.log('camera dir:', dir.toArray().map(v => +v.toFixed(2)));

// Panel corners through the SAME anchor transform frame.js uses
const PANEL_LAYOUT = {
  deck: { widthPx: 560, heightPx: 720, position: [-0.94, 1.54, -0.68], rotation: [0, 0.40, 0] },
  rail: { widthPx: 460, heightPx: 250, position: [0.94, 1.83, -0.68], rotation: [0, -0.40, 0] },
  controls: { widthPx: 460, heightPx: 330, position: [0.94, 1.36, -0.63], rotation: [0, -0.40, 0] },
  comms: { widthPx: 700, heightPx: 500, position: [0, 1.74, -0.44], rotation: [0, 0, 0] }
};
const PX_PER_M = 760;
const anchorG = new THREE.Group();
anchorG.position.set(anchor.position[0], anchor.topY - 0.895, anchor.position[2]);
anchorG.rotation.y = anchor.rotationY;
anchorG.updateMatrixWorld(true);

for (const [id, p] of Object.entries(PANEL_LAYOUT)) {
  const w = p.widthPx / PX_PER_M;
  const h = w * (p.heightPx / p.widthPx);
  let minX = 2, maxX = -2, minY = 2, maxY = -2;
  for (const [dx, dy] of [[-w / 2, -h / 2], [w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]]) {
    const pt = new THREE.Vector3(p.position[0] + dx, p.position[1] + dy, p.position[2]);
    pt.applyMatrix4(anchorG.matrixWorld);
    pt.project(camera);
    minX = Math.min(minX, pt.x); maxX = Math.max(maxX, pt.x);
    minY = Math.min(minY, pt.y); maxY = Math.max(maxY, pt.y);
  }
  console.log(`${id.padEnd(9)} ndc x[${minX.toFixed(2)}, ${maxX.toFixed(2)}] y[${minY.toFixed(2)}, ${maxY.toFixed(2)}]`);
}

// station wells
for (const st of bench.stations) {
  const p = new THREE.Vector3();
  st.station.tray.getWorldPosition(p);
  p.project(camera);
  console.log(`station ${st.station.index} ndc (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`);
}
process.exit(0);
