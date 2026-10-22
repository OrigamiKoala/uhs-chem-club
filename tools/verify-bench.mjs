/**
 * verify-bench.mjs — The Learn benches, framed in the glass.
 *
 * Both Unit 1 instruments are BUILT at T4: the player walks Tallow, presses
 * [E] at a plate, and the instrument deploys onto the bench that is standing
 * there with its screens bolted over it. Two things can go wrong with that and
 * neither shows up in any other check.
 *
 * ONE — the bench can face the wrong way. Each site group's local +z is its
 * front; turn the group away from its `approachPos` and the instrument docks
 * the camera on the far side of the plate, looking at the back lip through the
 * site's own back wall. That is what "I can't adjust my viewport to see the
 * entire thing" was, and it is asserted here as an angle rather than trusted.
 *
 * TWO — a screen or a control can sit outside the glass. The panels are CSS3D
 * planes in the world, so nothing clips them and nothing warns; they simply
 * hang off the edge of the view, and the player sees the bottom half of a
 * briefing with no way to scroll the world. So every panel, every station and
 * the power dial are pushed through the real projection and required to be
 * inside the frame, at every aspect the product supports.
 *
 * It builds the REAL world and the REAL instruments in Node behind the DOM
 * shim, so it measures what ships.
 */

const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });

const THREE = await import('three');
const { TallowWorld } = await import('../src/three/tallow.js');
const { LigarWorld } = await import('../src/three/ligar.js');
const { SampleScope3D } = await import('../src/learn/engine/scope3d.js');
const { CoreBench3D } = await import('../src/learn/engine/corebench3d.js');
const { CatalogueBoard3D } = await import('../src/learn/engine/catalogue3d.js');
const { AssayFloor3D } = await import('../src/learn/engine/assay3d.js');
const { JoinBench3D } = await import('../src/learn/engine/joinbench3d.js');
const { getWorld } = await import('../src/learn/curriculum.js');

let failures = 0;
const fail = (msg) => { console.log(`  FAIL ${msg}`); failures++; };
const ok = (msg) => console.log(`  ok   ${msg}`);

console.log('Learn benches — facing the player, and inside the glass\n');

/** The stage camera's vertical field, from `three/stage.js`. */
const FOV = 55;

/** The viewports the leaned-in view is held to, in px: the six aspects, plus the smallest phone. */
const LEAN_VIEWPORTS = [
  ['ultrawide', 2560, 1080], ['16:9', 1920, 1080], ['16:10', 1680, 1050],
  ['3:2', 1440, 960], ['4:3', 1280, 960], ['phone landscape', 812, 375], ['small phone', 667, 375]
];

/**
 * Aspects the product supports. 375 px is the one confirmed device floor
 * (PRODUCT.md); a phone entering a world is landscape-locked, so the narrow
 * cases here are the landscape ones.
 */
const ASPECTS = [
  ['ultrawide', 2560 / 1080], ['16:9', 1920 / 1080], ['16:10', 1680 / 1050],
  ['3:2', 1440 / 960], ['4:3', 1280 / 960], ['phone landscape', 812 / 375]
];

/**
 * How much of the top of the glass the fixed chrome covers, as a fraction.
 * `--hud-h` is 64 px and the Learn host bar sits under it; on an 800 px tall
 * window that is a little over a sixth. Anything a player must read has to
 * clear it.
 */
const TOP_CHROME = 0.17;

// The world being measured. Tallow first, then Ligar: every check below reads
// this binding, so the second world is held to exactly the first one's rules.
let world = new TallowWorld(null);
world.scene.updateMatrixWorld(true);

/* ---------------------------------------------------------------- facing */

function checkFacing() {
const before = failures;
for (const site of world.data.sites) {
  const marker = world.siteMarkers.get(site.questId);
  if (!marker) continue;
  const ax = site.approachPos[0] - site.pos[0];
  const az = site.approachPos[2] - site.pos[2];
  const want = Math.atan2(ax, az);
  const got = marker.group.rotation.y;
  const diff = Math.abs(Math.atan2(Math.sin(want - got), Math.cos(want - got)));
  if (diff > 0.35) {
    fail(`${site.id} (${site.label}) faces ${(got * 180 / Math.PI).toFixed(0)}°, ` +
      `but the player walks in from ${(want * 180 / Math.PI).toFixed(0)}°`);
  }
}
if (failures === before) ok(`${world.data.name}: ${world.data.sites.length} sites all face the ground the player walks in from`);
}
checkFacing();

/* --------------------------------------------------------------- framing */

const corner = new THREE.Vector3();
const box = new THREE.Box3();

/** How far two bodies may share space before it counts: a bounding box is a
    loose fit around a rotated body, the same reasoning as `verify:tallow`. */
const TOUCH = 0.006;

/** Instruments and key sets with no free plate for the readings board. The cards still hold the readings; this is a count, not a failure, unless it is every one. */
const boardsMissing = new Set();
let boardsTried = 0;

const shrunk = (b, t) => new THREE.Box3(
  b.min.clone().addScalar(t), b.max.clone().subScalar(t));

/**
 * AABB of an object's meshes, expressed in the frame `inv` inverts into.
 *
 * AN INSTANCED BODY IS MEASURED PER INSTANCE. Its geometry's bounding box is
 * the UNIT body — a 1 m cylinder for a piece of salvage — and every instance
 * carries its own transform on top of it. Taking the geometry box at face value
 * therefore reports a metre-wide box wrapped round every heap in every bin, and
 * the overlap check duly finds that the assay floor is inside the bench vice
 * two metres away. Nothing was wrong with the bench; the ruler was.
 */
const _im = new THREE.Matrix4();

/** Each instance of a field as its own box, in the frame `inv` inverts into. */
function instanceBoxes(mesh, inv) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const g = mesh.geometry.boundingBox;
  const m = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld);
  const out = [];
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, _im);
    const b = g.clone().applyMatrix4(_im.premultiply(m));
    if (!b.isEmpty() && b.getSize(new THREE.Vector3()).lengthSq() > 1e-8) out.push(b);
  }
  return out;
}

/** A baked group's (or merged mesh's) recorded part boxes, each carried into the bench frame. */
function partBoxesIn(group, inv) {
  const m = new THREE.Matrix4().multiplyMatrices(inv, group.matrixWorld);
  return group.userData.partBoxes.map(b => b.clone().applyMatrix4(m)).filter(b => !b.isEmpty());
}

/** Whether any triangle of an open shell passes through `box` (bench frame). */
function shellTouches(mesh, inv, box) {
  const m = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld);
  const pos = mesh.geometry.attributes.position;
  const index = mesh.geometry.index;
  const tri = new THREE.Triangle();
  const n = index ? index.count : pos.count;
  const vtx = k => new THREE.Vector3().fromBufferAttribute(pos, index ? index.getX(k) : k).applyMatrix4(m);
  for (let k = 0; k < n; k += 3) {
    tri.set(vtx(k), vtx(k + 1), vtx(k + 2));
    if (box.intersectsTriangle(tri)) return true;
  }
  return false;
}

/**
 * Whether a TUBE — a cable, a hose — actually passes through `box` (bench
 * frame). A tube is a body drawn along a curve, and the box round a cable
 * slung in a catenary is the box round the whole sag: every bench standing
 * in front of the lab's cable run was "inside" it, though the cable hangs
 * half a metre under the plate. So the verdict is the tube itself: its
 * surface crossing the box, or the box sitting inside its bore.
 */
function tubeTouches(mesh, inv, box) {
  if (shellTouches(mesh, inv, box)) return true;
  const { path, radius } = mesh.geometry.parameters || {};
  if (!path?.getPoints) return true;              // cannot tell: the box stands
  const m = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld);
  const c = box.getCenter(new THREE.Vector3());
  const pts = path.getPoints(128).map(p => p.clone().applyMatrix4(m));
  for (let i = 1; i < pts.length; i++) {
    const seg = new THREE.Line3(pts[i - 1], pts[i]);
    if (seg.closestPointToPoint(c, true, new THREE.Vector3()).distanceTo(c) <= (radius || 0)) return true;
  }
  return false;
}

function localBox(obj, inv) {
  const b = new THREE.Box3();
  const v = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const corners = (g, mat) => {
    for (const x of [g.min.x, g.max.x]) {
      for (const y of [g.min.y, g.max.y]) {
        for (const z of [g.min.z, g.max.z]) b.expandByPoint(v.set(x, y, z).applyMatrix4(mat));
      }
    }
  };
  obj.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const g = o.geometry.boundingBox;
    m.multiplyMatrices(inv, o.matrixWorld);
    if (o.isInstancedMesh) {
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, _im);
        corners(g, _im.premultiply(m));
      }
      return;
    }
    corners(g, m);
  });
  return b.isEmpty() ? null : b;
}

/** NDC bounds of an object, as this camera would draw it. */
function ndcBounds(obj, camera) {
  box.setFromObject(obj);
  if (!isFinite(box.min.x)) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        corner.set(x, y, z).project(camera);
        minX = Math.min(minX, corner.x); maxX = Math.max(maxX, corner.x);
        minY = Math.min(minY, corner.y); maxY = Math.max(maxY, corner.y);
      }
    }
  }
  return { minX, maxX, minY, maxY };
}

/**
 * The frame's panels, in the bench's own local frame. Kept in step with
 * PANEL_LAYOUT in `learn/engine/frame.js` — the two are asserted equal below,
 * so a layout edit there cannot silently escape this check.
 */
const { PANEL_LAYOUT } = await import('../src/learn/engine/frame.js');
const { PX_PER_M } = await import('../src/three/world-ui.js');

function panelCorners(spec) {
  const w = spec.metres ?? spec.widthPx / PX_PER_M;
  const h = w * (spec.heightPx / spec.widthPx);
  const o = new THREE.Object3D();
  o.position.set(...spec.position);
  o.rotation.set((spec.rotation?.[0] || 0) + (spec.tilt || 0), spec.rotation?.[1] || 0, spec.rotation?.[2] || 0);
  o.updateMatrixWorld(true);
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]]
    .map(([dx, dy]) => new THREE.Vector3(dx, dy, 0).applyMatrix4(o.matrixWorld));
}

/**
 * THE KEYS ON THE BENCH. At T4 a stage's tool keys stand on the plate as a
 * switch panel (`BenchViewer3D.setKeys`, mirrored from the frame's DOM buttons
 * by `bench-keys.js`). Every instrument is made to carry two sets of them at
 * its widest stage:
 *   - FOUR KEYS UNDER A NAME, which is the most any stage in Units 1 and 2
 *     offers beside a bench of three or more samples (q2-core's View group of
 *     three and a tool; q4-ledger's, beside five). This is the panel.
 *   - SIX, the most any stage offers at all (the View group and three tools,
 *     which q2-core and q4-ledger only ever lay beside ONE sample). Beside a
 *     full bench there is no plate for that panel, so this is the rail.
 */
const KEY_SETS = [
  ['four keys', [
    { label: 'View', keys: [
      { id: 'v1', label: 'Whole piece', lit: true },
      { id: 'v2', label: 'The middle' },
      { id: 'v3', label: 'Outside' }
    ] },
    { label: null, keys: [{ id: 't1', label: 'Run Tester', badge: '2' }] }
  ]],
  ['six keys', [
    { label: 'View', keys: [
      { id: 'v1', label: 'Whole piece' },
      { id: 'v2', label: 'The middle', lit: true },
      { id: 'v3', label: 'Outside' }
    ] },
    { label: null, keys: [
      { id: 't1', label: 'Press Together' },
      { id: 't2', label: 'Read Charge' },
      { id: 't3', label: 'Reset Sample', disabled: true }
    ] }
  ]]
];

/**
 * THE READINGS BOARD. The bench log, the trend plot and the stage's device stand
 * on the plate as one raked slate beside the key bank (`bench-readings.js`,
 * `BenchViewer3D.setReadings`). Every instrument is made to carry it with a log of
 * rows and one picture, and it is held to the plate, the glass, the instrument and
 * the key bank.
 */
const READINGS_SAMPLE = {
  columns: [{ key: 'made', label: 'Molecules made' }, { key: 'total', label: 'Total weight' }],
  rows: [{ made: 0, total: '54.0' }, { made: 1, total: '54.0' }, { made: 3, total: '54.0' }],
  pictures: [{ id: 'device', canvas: { width: 360, height: 120 } }]
};

/**
 * Per-mesh boxes of a subtree in the frame `inv` inverts into; hidden bodies
 * skipped. A plain mesh is boxed by its own points, not by its geometry's box
 * turned with it: the station trays are octagons set a sixteenth of a turn
 * round, and the box of a turned box is a quarter wider than the tray.
 */
function pointBox(mesh, inv) {
  const pos = mesh.geometry.attributes?.position;
  if (!pos) return localBox(mesh, inv);
  const m = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld);
  const b = new THREE.Box3();
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) b.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(m));
  return b.isEmpty() ? null : b;
}

function meshBoxes(node, inv) {
  const out = [];
  node.traverse(o => {
    if (!o.isMesh || o.material?.visible === false) return;
    for (let a = o; a; a = a.parent) if (!a.visible) return;
    const bodies = o.isInstancedMesh ? instanceBoxes(o, inv) : [pointBox(o, inv)];
    for (const b of bodies) if (b) out.push(b);
  });
  return out;
}

/**
 * Everything any deployed instrument, key bank or readings board puts above the
 * plate, in the viewer's root frame (0.09 m above the floor under the bench), unioned
 * over every bench in every world. The bay's work volume must contain it.
 */
const instrumentReach = new THREE.Box3();

/** Deploy one quest's instrument and measure everything it puts on the plate. */
function check(questId, label, build, widest) {
  const anchor = world.benchAnchor(questId);
  if (!anchor) { fail(`${questId}: the world reports no bench`); return; }

  // AN INSTRUMENT IS DEPLOYED, SO THE CABINET IS CASED OPEN. What stands on the
  // plate when nobody is working is the instrument cased up; pressing [E] hides
  // it and deploys the stations in its place, so the two are never drawn at
  // once. Measuring against a bench that still had its cabinet on it would
  // report a collision the player can never be in.
  world.setBenchDeployed(questId, true);

  // The anchor frame the frame's panels are expressed in (createBenchAnchor).
  const anchorNode = new THREE.Group();
  anchorNode.position.set(anchor.position[0], anchor.topY - 0.895, anchor.position[2]);
  anchorNode.rotation.y = anchor.rotationY;
  anchorNode.updateMatrixWorld(true);

  for (const [keySetName, keySet] of KEY_SETS)
  for (const [aspectName, aspect] of ASPECTS) {
    const camera = new THREE.PerspectiveCamera(FOV, aspect, 0.05, 80);
    const bench = build(camera, anchor);
    widest(bench);
    let pressed = null;
    bench.viewer.setKeys(keySet, id => { pressed = id; });
    bench.viewer.placeKeys();
    const bank = bench.viewer.keyBank;
    if (!bank) fail(`${label}: setKeys stood no key bank on the bench`);
    bench.viewer.setReadings(READINGS_SAMPLE);
    const board = bench.viewer.readingsBoard;
    boardsTried++;
    camera.updateMatrixWorld(true);

    const tag = `${label} @ ${aspectName}, ${keySetName}`;

    // 1. The camera stands on the side the player walked in from.
    const site = world.data.sites.find(s => s.questId === questId);
    const toApproach = new THREE.Vector3(
      site.approachPos[0] - site.pos[0], 0, site.approachPos[2] - site.pos[2]
    ).normalize();
    const toCamera = new THREE.Vector3(
      camera.position.x - anchor.position[0], 0, camera.position.z - anchor.position[2]
    ).normalize();
    if (toApproach.dot(toCamera) < 0.5) {
      fail(`${tag}: the camera docks on the far side of the bench from the approach`);
    }

    // 2. Every panel is inside the glass, and clear of the fixed top chrome.
    for (const [id, spec] of Object.entries(PANEL_LAYOUT)) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of panelCorners(spec)) {
        corner.copy(p).applyMatrix4(anchorNode.matrixWorld).project(camera);
        minX = Math.min(minX, corner.x); maxX = Math.max(maxX, corner.x);
        minY = Math.min(minY, corner.y); maxY = Math.max(maxY, corner.y);
      }
      if (minX < -0.99 || maxX > 0.99 || minY < -0.99) {
        fail(`${tag}: panel "${id}" hangs off the glass — x[${minX.toFixed(2)}, ${maxX.toFixed(2)}] y[${minY.toFixed(2)}, ${maxY.toFixed(2)}]`);
      }
      const chromeTop = 1 - TOP_CHROME * 2;
      if (maxY > chromeTop) {
        fail(`${tag}: panel "${id}" runs under the HUD — top at ${maxY.toFixed(2)}, chrome starts at ${chromeTop.toFixed(2)}`);
      }
    }

    // 3. Every body the instrument laid out is in the frame.
    //
    // NOT EVERY INSTRUMENT IS STATION-SHAPED. The scope and the core bench lay
    // out wells with screens raked over them; the catalogue is a board and a
    // drawer, and the assay floor is a hopper over a chute over a row of bins.
    // `framedNodes()` is what the aim itself solves for, so it is what is
    // measured here — a check written against `stations` would simply skip the
    // two instruments most likely to hang off the edge of the glass.
    const bodies = bench.viewer.framedNodes();
    if (!bodies.length) fail(`${tag}: the instrument laid out nothing`);
    bodies.forEach((st, i) => {
      const b = ndcBounds(st.group, camera);
      if (!b) return;
      const cx = (b.minX + b.maxX) / 2;
      const cy = (b.minY + b.maxY) / 2;
      if (Math.abs(cx) > 0.95 || Math.abs(cy) > 0.95) {
        fail(`${tag}: body ${i + 1} sits at (${cx.toFixed(2)}, ${cy.toFixed(2)}) — outside the frame`);
      }
    });

    // 4. The instrument is AIMED into the open glass below the frame.
    //
    // Deployed, the quest frame is a page over the world, so the top of the
    // glass belongs to the header, the stage rail and the tool plate and the
    // bench has to sit under them. `aimForChrome` is the correction the live
    // bench applies once every fit; driving it here proves that it converges
    // and that nothing important ends up off the bottom of the view instead.
    const chromeNdc = 1 - TOP_CHROME * 2;
    for (let pass = 0; pass < 10; pass++) bench.viewer.aimForChrome(chromeNdc);
    camera.updateMatrixWorld(true);

    // THE READABLE SURFACE IS WHOLLY IN THE GLASS AND CLEAR OF THE CHROME.
    // Half a picture is not a picture, and a board whose bottom row is off the
    // bottom of the view is a board with eight cards missing.
    for (const st of bench.viewer.framedNodes()) {
      if (!st.face) continue;
      const b = ndcBounds(st.face, camera);
      if (!b) continue;
      if (b.maxY > chromeNdc + 0.02) {
        fail(`${tag}: a readable face still runs under the frame — top at ${b.maxY.toFixed(2)}, chrome at ${chromeNdc.toFixed(2)}`);
      }
      if (b.minY < -0.99 || b.minX < -0.99 || b.maxX > 0.99) {
        fail(`${tag}: a readable face hangs off the glass — x[${b.minX.toFixed(2)}, ${b.maxX.toFixed(2)}] y[${b.minY.toFixed(2)}, ${b.maxY.toFixed(2)}]`);
      }
    }
    // The tops the instrument declared clear the chrome, measured as points.
    {
      const p = new THREE.Vector3();
      for (const st of bench.viewer.framedNodes()) {
        if (!st.topMark) continue;
        st.topMark.getWorldPosition(p).project(camera);
        if (p.y > chromeNdc + 0.03) {
          fail(`${tag}: a body's top still runs under the frame at ${p.y.toFixed(2)} (chrome ${chromeNdc.toFixed(2)})`);
        }
      }
    }
    // And the working end stays in view: the crate, the drawer, the bins are
    // what the player reaches for.
    bench.viewer.framedNodes().forEach((st, i) => {
      const reach = bench.viewer.stations[i]?.tray || st.group;
      const b = ndcBounds(reach, camera);
      if (!b) return;
      if (b.minY < -0.99) {
        fail(`${tag}: body ${i + 1} has been aimed off the bottom of the glass (${b.minY.toFixed(2)})`);
      }
    });

    // 5a. Lanternfall's plate benches carry up to two dials: both are in the glass.
    for (const { dial } of bench.dials ? bench.dials.values() : []) {
      const b = ndcBounds(dial.group, camera);
      if (b && (b.minX < -0.98 || b.maxX > 0.98 || b.minY < -0.98 || b.maxY > 0.98)) {
        fail(`${tag}: a dial is off the glass — x[${b.minX.toFixed(2)}, ${b.maxX.toFixed(2)}] y[${b.minY.toFixed(2)}, ${b.maxY.toFixed(2)}]`);
      }
    }

    // 5. The power dial, where the instrument carries one, is reachable in view.
    if (bench.dial) {
      const b = ndcBounds(bench.dial.group, camera);
      if (b && (b.minX < -0.98 || b.maxX > 0.98 || b.minY < -0.98 || b.maxY > 0.98)) {
        fail(`${tag}: the power dial is off the glass — x[${b.minX.toFixed(2)}, ${b.maxX.toFixed(2)}] y[${b.minY.toFixed(2)}, ${b.maxY.toFixed(2)}]`);
      }
    }

    // 5b. THE KEY BANK is in the glass, on the plate, clear of the instrument,
    // and a press on each key reaches the key under it and nothing else.
    if (bank) {
      const b = ndcBounds(bank.group, camera);
      if (b && (b.minX < -0.98 || b.maxX > 0.98 || b.minY < -0.98 || b.maxY > 0.98)) {
        fail(`${tag}: the key bank is off the glass — x[${b.minX.toFixed(2)}, ${b.maxX.toFixed(2)}] y[${b.minY.toFixed(2)}, ${b.maxY.toFixed(2)}]`);
      }
      const inv = new THREE.Matrix4().copy(bench.viewer.root.matrixWorld).invert();
      const kb = localBox(bank.group, inv);
      if (kb && (kb.min.x < -2.3 || kb.max.x > 2.3)) {
        fail(`${tag}: the key bank runs off the end of the bench — x[${kb.min.x.toFixed(2)}, ${kb.max.x.toFixed(2)}]`);
      }
      if (kb && kb.max.y - 0.895 > 0.52) {
        fail(`${tag}: the key bank stands ${(kb.max.y - 0.895).toFixed(2)} m over the plate — it is a panel, not a tower`);
      }
      const others = bench.viewer.framedNodes().map(n => n.group);
      if (bench.dial) others.push(bench.dial.group);
      for (const { dial } of bench.dials ? bench.dials.values() : []) others.push(dial.group);
      let hitBody = null;
      for (const node of others) {
        for (const ob of meshBoxes(node, inv)) {
          if (kb && shrunk(kb, TOUCH).intersectsBox(shrunk(ob, TOUCH))) { hitBody = ob; break; }
        }
        if (hitBody) break;
      }
      if (hitBody) {
        const c = hitBody.getCenter(new THREE.Vector3());
        fail(`${tag}: the key bank at x[${kb.min.x.toFixed(2)}, ${kb.max.x.toFixed(2)}] stands in the instrument's body at (${c.x.toFixed(2)}, ${c.y.toFixed(2)}, ${c.z.toFixed(2)})`);
      }

      if (aspectName === '16:9') {
        // Pressed the way a finger arrives: the cap projected to the screen,
        // then the viewer's own pointerdown and pointerup, through the real ray.
        const p = new THREE.Vector3();
        for (const key of bank.keys) {
          pressed = null;
          key.cap.getWorldPosition(p).project(camera);
          const ev = { clientX: (p.x + 1) / 2 * 1280, clientY: (1 - p.y) / 2 * 720, pointerId: 7, preventDefault() {} };
          bench.viewer._onPointerDown(ev);
          bench.viewer._onPointerUp(ev);
          const want = key.disabled ? null : key.id;
          if (pressed !== want) {
            fail(`${tag}: a press on key "${key.id}" reported ${pressed === null ? 'nothing' : `"${pressed}"`}${want ? '' : ' (it is disabled)'}`);
          }
        }
      }
    }

    // 5c. THE READINGS BOARD is in the glass, on the plate, clear of the
    // instrument and of the key bank, and it is a mirror: it carries no grabbable.
    if (board) {
      const b = ndcBounds(board.group, camera);
      if (b && (b.minX < -0.98 || b.maxX > 0.98 || b.minY < -0.98 || b.maxY > 0.98)) {
        fail(`${tag}: the readings board is off the glass — x[${b.minX.toFixed(2)}, ${b.maxX.toFixed(2)}] y[${b.minY.toFixed(2)}, ${b.maxY.toFixed(2)}]`);
      }
      const inv = new THREE.Matrix4().copy(bench.viewer.root.matrixWorld).invert();
      const rb = localBox(board.group, inv);
      if (rb && (rb.min.x < -2.3 || rb.max.x > 2.3)) {
        fail(`${tag}: the readings board runs off the end of the bench — x[${rb.min.x.toFixed(2)}, ${rb.max.x.toFixed(2)}]`);
      }
      if (rb && rb.max.y - 0.895 > 0.52) fail(`${tag}: the readings board stands ${(rb.max.y - 0.895).toFixed(2)} m over the plate`);
      const others = bench.viewer.framedNodes().map(n => n.group);
      if (bench.dial) others.push(bench.dial.group);
      for (const { dial } of bench.dials ? bench.dials.values() : []) others.push(dial.group);
      if (bank) others.push(bank.group);
      for (const node of others) {
        for (const ob of meshBoxes(node, inv)) {
          if (rb && shrunk(rb, TOUCH).intersectsBox(shrunk(ob, TOUCH))) {
            const c = ob.getCenter(new THREE.Vector3());
            fail(`${tag}: the readings board at x[${rb.min.x.toFixed(2)}, ${rb.max.x.toFixed(2)}] stands in a body at (${c.x.toFixed(2)}, ${c.y.toFixed(2)}, ${c.z.toFixed(2)})`);
            break;
          }
        }
      }
    } else {
      boardsMissing.add(`${label} / ${keySetName}`);
    }

    // 6. NOTHING THE INSTRUMENT BRINGS STANDS INSIDE SOMETHING ALREADY THERE.
    //
    // A deployed instrument is laid on a bench that is a prop with its own
    // clutter, and the stands under the station screens come down on the plate
    // between it. The first run of this found every stand foot sitting inside a
    // swarf chip scattered along the bench's back lip.
    //
    // Measured per MESH and in the bench's own frame: a world AABB of a 4.8 m
    // lip on a rotated site is enormous and says everything hits everything.
    // Exempt: the working surface itself and anything at or below it (a foot is
    // MEANT to be seated in the plate), and ambient bodies like the sky dome.
    if (aspectName === '16:9') {
      const inv = new THREE.Matrix4().copy(bench.viewer.root.matrixWorld).invert();
      const own = new Set();
      bench.viewer.root.traverse(o => own.add(o));

      // Everything the instrument STANDS on the plate: a screen head, a board
      // and its stays, a hopper on its legs. Whatever it is, it must not come
      // down inside the bench's own clutter.
      const heads = [];
      const standing = bench.viewer.stations.length
        ? bench.viewer.stations.map(st => st.head).filter(Boolean)
        : bench.viewer.framedNodes().map(n => n.group);
      // The key bank stands on the plate too, and is held to the same rule.
      if (bank) standing.push(bank.group);
      if (board) standing.push(board.group);
      for (const node of standing) {
        node.traverse(o => {
          if (!o.isMesh || o.material?.visible === false) return;
          const b = localBox(o, inv);
          if (b && b.max.y > 0.905) { heads.push(b); instrumentReach.union(b); }
        });
      }

      const seen = new Set();
      const bakedSeen = new Set();
      world.scene.traverse(o => {
        if (!o.isMesh || own.has(o) || !o.geometry) return;
        // A body that is not drawn is not in the way. The cased-up instrument
        // is hidden for exactly as long as the deployed one stands in its
        // place, so it is not a thing the player can ever be inside.
        if (!o.visible) return;
        for (let a = o.parent; a; a = a.parent) if (!a.visible) return;

        /* EACH INSTANCE IS ITS OWN BODY. `localBox` unions a field's
           instances, which is right for a heap and wrong for a field spread
           across a room: the union of the rubble on a quarry floor is a box
           round the whole floor, and every bench standing in the quarry is
           "inside" it. So a field is measured one piece at a time.
           AND EACH BAKED PART IS ITS OWN BODY, for the same reason: a site
           baked by `mergeStatic` is one mesh per material, and the box round
           the one holding its plate, its lean-to and its crates encloses the
           bench standing in the middle of them. The bake records every part's
           box in the group's frame (`partBoxes`); those are measured, once. */
        let bodies;
        if (o.isInstancedMesh) bodies = instanceBoxes(o, inv);
        // A MERGED ROCK carries its own boxes, one per column or broken piece
        // (ligar/basalt.js): the box round the rubble on a quarry floor is a
        // box round the floor, and the forge bench stands in the middle of it.
        else if (o.userData.partBoxes?.length) bodies = partBoxesIn(o, inv);
        else if (o.userData.ownGeometry && o.parent?.userData?.partBoxes) {
          if (bakedSeen.has(o.parent)) return;
          bakedSeen.add(o.parent);
          bodies = partBoxesIn(o.parent, inv);
        } else bodies = [localBox(o, inv)];
        for (const b of bodies) {
          if (!b) continue;
          // At or below the plate the instrument is standing on: a stand foot
          // is seated there on purpose, and the plate is what it is seated in.
          if (b.max.y <= 0.905) continue;
          // Ambient bodies — the sky dome, the horizon, the celestial vista.
          if (b.getSize(new THREE.Vector3()).length() > 50) continue;
          if (collide(o, b)) return;
        }
      });

      /* The body a head is standing in, reported once. An OPEN SHELL — a
         barrel roof, a tube — has no inside, so its box is only a candidate
         and the verdict is its triangles: a head under a vault is under it,
         not in it. A closed body is solid and its box stands as the verdict. */
      function collide(o, b) {
        for (const h of heads) {
          if (!shrunk(h, TOUCH).intersectsBox(shrunk(b, TOUCH))) continue;
          if (o.userData?.openShell && !shellTouches(o, inv, shrunk(h, TOUCH))) continue;
          if (o.geometry?.type === 'TubeGeometry' && !tubeTouches(o, inv, shrunk(h, TOUCH))) continue;
          const c = b.getCenter(new THREE.Vector3());
          const key = `${c.x.toFixed(2)}|${c.y.toFixed(2)}|${c.z.toFixed(2)}`;
          if (seen.has(key)) return true;
          seen.add(key);
          const hc = h.getCenter(new THREE.Vector3());
          fail(`${tag}: the instrument stands inside world geometry — its body at ` +
            `(${hc.x.toFixed(2)}, ${hc.y.toFixed(2)}, ${hc.z.toFixed(2)}) ` +
            `meets a fitting at (${c.x.toFixed(2)}, ${c.y.toFixed(2)}, ${c.z.toFixed(2)})`);
          return true;
        }
        return false;
      }
    }

    bench.dispose?.();
  }

  world.setBenchDeployed(questId, false);
}

const worldFrame = (camera, anchor) => ({
  scene: world.scene,
  camera,
  position: anchor.position,
  rotationY: anchor.rotationY,
  topY: anchor.topY
});

check('q1-grain', 'sampler scope',
  (camera, anchor) => new SampleScope3D(null, {
    kinds: {
      a: { tint: 'bone', code: 'CAT 01', mass: 1 },
      b: { tint: 'sand', code: 'CAT 06', mass: 12 }
    },
    onPower: () => {},
    world: worldFrame(camera, anchor)
  }),
  // Four crates is the widest stage q1-grain declares.
  bench => bench.setSamples([
    { id: 's1', label: 'CRATE 41', particles: [{ kinds: ['a'], n: 40 }] },
    { id: 's2', label: 'CRATE 42', particles: [{ kinds: ['a', 'b'], n: 30 }] },
    { id: 's3', label: 'CRATE 43', particles: [{ kinds: ['a'], n: 20 }, { kinds: ['b'], n: 20 }] },
    { id: 's4', label: 'CRATE 44', particles: [{ kinds: ['a', 'a'], n: 30 }] }
  ])
);

check('q2-core', 'core bench',
  (camera, anchor) => new CoreBench3D(null, { world: worldFrame(camera, anchor) }),
  bench => bench.setSpecimens([
    { id: 'a', label: 'CAN 01', note: '', core: { marked: 3, blank: 4 }, rings: [2, 8, 1] },
    { id: 'b', label: 'CAN 02', note: '', core: { marked: 6, blank: 6 }, rings: [2, 8, 8, 2] },
    { id: 'c', label: 'CAN 03', note: '', core: { marked: 8, blank: 10 }, rings: [2, 8, 8, 1] }
  ])
);

/* The widest stage q4-ledger ever declared, for the core bench it used to stand on (it is a table now, T2, but the core bench
   is still a real instrument: the hopper boss fights on it): four samples beside a standard, FIVE stations end to end, which
   leaves no plate beside them for a key panel. That is the case the front rail is for, so it is the case measured. */
check('q4-ledger', 'ledger bench',
  (camera, anchor) => new CoreBench3D(null, { world: worldFrame(camera, anchor) }),
  bench => bench.setSpecimens([
    { id: 'std', label: 'SAMPLE A', note: '', core: { marked: 8, blank: 8 }, rings: [2, 6] },
    { id: 'n1', label: 'SAMPLE B', note: '', core: { marked: 8, blank: 10 }, rings: [2, 6], casing: true },
    { id: 'n2', label: 'SAMPLE C', note: '', core: { marked: 8, blank: 8 }, rings: [2, 8], casing: true },
    { id: 'n3', label: 'SAMPLE D', note: '', core: { marked: 7, blank: 9 }, rings: [2, 5], casing: true },
    { id: 'n4', label: 'SAMPLE E', note: '', core: { marked: 8, blank: 8 }, rings: [2, 6], casing: true }
  ])
);

/* THE CATALOGUE BOARD. The widest thing this quest puts on the bench is the
   full chart — three rows of eight, with the column heads over them — which is
   also the widest thing any Learn instrument builds. If anything is going to
   hang off the glass at phone landscape, it is this. */
check('q3-catalogue', 'catalogue board',
  (camera, anchor) => new CatalogueBoard3D(null, { world: worldFrame(camera, anchor) }),
  bench => {
    const cards = {};
    for (let z = 1; z <= 20; z++) {
      cards[`c${z}`] = { code: `CAT ${String(z).padStart(2, '0')}`, name: 'BERYLLIUM', pips: (z % 8) + 1 };
    }
    const row = n => Array.from({ length: 8 }, (_, c) => `c${n * 8 + c + 1}`);
    bench.setStage({
      cards,
      board: {
        label: 'Reference chart',
        columns: ['1', '2', '3', '4', '5', '6', '7', '8'],
        rows: [row(0), row(1), ['#s1', '#s2', '#s3', '#s4', '#s5', '#s6', '#s7', '#s8']]
      },
      drawer: ['c17', 'c18', 'c19', 'c20']
    });
  }
);

/* THE ASSAY FLOOR, BUILT. Three rigs is the widest stage, and each of them
   stands a hopper on legs well above the plate — the one instrument whose
   bodies are TALL rather than wide, and so the one most likely to run up under
   the frame's chrome rather than off the side. */
check('q5-assay', 'assay floor',
  (camera, anchor) => new AssayFloor3D(null, { world: worldFrame(camera, anchor) }),
  bench => bench.setHoppers([
    { id: 'ha', label: 'SAMPLE A', note: 'unlabelled, 40 pieces', bins: [{ mass: 20, n: 36 }, { mass: 22, n: 4 }] },
    { id: 'hb', label: 'SAMPLE B', note: 'unlabelled, 40 pieces', bins: [{ mass: 35, n: 30 }, { mass: 37, n: 10 }] },
    { id: 'hc', label: 'SAMPLE C', note: 'unlabelled, 40 pieces', bins: [{ mass: 10, n: 8 }, { mass: 11, n: 32 }] }
  ])
);

/* THE SAME FLOOR AT SITE 6: the weigh bench, whose widest stage is three bulk
   drums with the gate dogged shut. */
check('q6-weigh', 'weigh floor',
  (camera, anchor) => new AssayFloor3D(null, { world: worldFrame(camera, anchor) }),
  bench => bench.setHoppers([
    { id: 'd1', label: 'SAMPLE A', code: 'CAT 06', note: 'one drum, gate shut', bulk: true, bins: [{ mass: 12, n: 5 }] },
    { id: 'd2', label: 'SAMPLE B', code: 'CAT 08', note: 'one drum, gate shut', bulk: true, bins: [{ mass: 16, n: 4 }] },
    { id: 'd3', label: 'SAMPLE C', code: 'CAT 01', note: 'one drum, gate shut', bulk: true, bins: [{ mass: 1, n: 6 }] }
  ])
);

if (!failures) {
  ok(`all six instruments frame every body and control at ${ASPECTS.length} aspects`);
  if (boardsMissing.size) console.log(`  note ${boardsMissing.size} of ${boardsTried} placements left the readings board off (no free plate beside the keys): ${[...boardsMissing].slice(0, 8).join('; ')}`);
  if (boardsTried && boardsMissing.size === boardsTried) fail('the readings board found room on no instrument at all');
}

/* ------------------------------------------------------- every real stage

   THE TWO NEW INSTRUMENTS TAKE WHAT THEIR QUEST ACTUALLY DECLARES.

   The framing check above feeds each bench the widest stage by hand, which
   proves the geometry fits but proves nothing about the other seven stages. A
   built instrument is a second implementation of an interface the quest module
   uses blind, so the failure to be afraid of is a stage whose declaration the
   drawn bench handles and the built one does not — a board row of a shape it
   does not lay out, a hopper it cannot pour. Both quests export their tables,
   so every stage can simply be put through the built instrument here.

   It asserts the two things a player would notice: that the board offers the
   slots the quest is about to grade against, and that a pour lands exactly what
   `planPour` says it lands, in the bins it says, with the pieces really placed.
*/

const { CARDS } = await import('../src/learn/quests/unit01/q3-catalogue.js');
/* The catalogue quest is a card table now (T2), but the board is still a real instrument (the hopper boss files on it),
   so it is still driven through its own pointer path: the two boards the quest used to declare, a strip and a chart. */
const CAT_STAGES = [
  { board: { label: 'Reference strip', strip: true, rows: [['#p1', '#p2', '#p3', '#p4', '#p5', '#p6']] }, masked: true, drawer: ['c11', 'c19', 'c01', 'c18', 'c08', 'c06'] },
  { board: { label: 'Reference chart', strip: true, columns: ['1', '2', '\u00b7 \u00b7 \u00b7', '13', '14', '15', '16', '17', '18'], rows: [['c01', null, null, null, null, null, null, null, 'c02'], ['c03', 'c04', null, 'c05', 'c06', 'c07', 'c08', 'c09', 'c10'], ['#r1', '#r2', null, '#r3', '#r4', '#r5', '#r6', '#r7', '#r8']] }, drawer: ['c16', 'c11', 'c14', 'c18', 'c12', 'c17', 'c13', 'c15'] },
  { board: { label: 'Reference chart', columns: ['1', '2', '\u00b7 \u00b7 \u00b7', '13', '14', '15', '16', '17', '18'], rows: [['c01', null, null, null, null, null, null, null, 'c02'], ['c03', '#s1', null, 'c05', 'c06', '#s2', 'c08', 'c09', 'c10']] }, masked: true, drawer: ['c16', 'c04', 'c13', 'c07'] }
];
/* The two assay quests are tabletops now (T2: the mass kit), but the assay floor is still a real instrument, so it is still put
   through its own pour path with the hoppers those quests used to declare (and `AssayFloor3D`'s retirement is T7's). */
const CL_BINS = [{ mass: 35, n: 30 }, { mass: 37, n: 10 }];
const ASSAY_STAGES = [
  { hoppers: [{ id: 'h1', label: 'SAMPLE A', code: 'chlorine', note: '40 atoms', bins: CL_BINS }] },
  { hoppers: [{ id: 'h1', label: 'SAMPLE A', note: '40 atoms', bins: CL_BINS }, { id: 'h2', label: 'SAMPLE B', note: '80 atoms', bins: [{ mass: 35, n: 60 }, { mass: 37, n: 20 }] }] },
  { hoppers: [{ id: 'h3', label: 'SAMPLE A', note: '40 atoms', bins: [{ mass: 10, n: 8 }, { mass: 11, n: 32 }] }] },
  { hoppers: [{ id: 'h4', label: 'SAMPLE A', note: '40 atoms', bins: [{ mass: 19, n: 40 }] }] },
  { hoppers: [
    { id: 'ha', label: 'SAMPLE A', note: 'unlabelled, 40 atoms', bins: [{ mass: 20, n: 36 }, { mass: 22, n: 4 }] },
    { id: 'hb', label: 'SAMPLE B', note: 'unlabelled, 40 atoms', bins: CL_BINS },
    { id: 'hc', label: 'SAMPLE C', note: 'unlabelled, 40 atoms', bins: [{ mass: 10, n: 8 }, { mass: 11, n: 32 }] }
  ] }
];
const WEIGH_STAGES = [
  { hoppers: [{ id: 'h1', label: 'SAMPLE A', code: 'carbon', note: '40 atoms', bins: [{ mass: 12, n: 40 }] }, { id: 'h2', label: 'SAMPLE B', code: 'carbon', note: 'a full crate, gate shut', bulk: true, bins: [{ mass: 12, n: 300 }] }] },
  { hoppers: [{ id: 'd1', label: 'SAMPLE A', code: 'carbon', note: 'one drum, gate shut', bulk: true, bins: [{ mass: 12, n: 5 }] }, { id: 'd2', label: 'SAMPLE B', code: 'oxygen', note: 'one drum, gate shut', bulk: true, bins: [{ mass: 16, n: 4 }] }, { id: 'd3', label: 'SAMPLE C', code: 'hydrogen', note: 'one drum, gate shut', bulk: true, bins: [{ mass: 1, n: 6 }] }] }
];
const { planPour } = await import('../src/learn/engine/assay.js');

/**
 * One press on the middle of a body, through the instrument's own pointer path.
 * The point is projected the way a finger arrives — screen coordinates into
 * `setPointer` into the real raycast — so what the ray resolves is what is
 * being measured, not a stubbed answer.
 */
function press(board, camera, node) {
  if (!node) { fail('press: nothing to press'); return; }
  node.updateMatrixWorld(true);
  const p = new THREE.Vector3();
  node.getWorldPosition(p);
  camera.updateMatrixWorld(true);
  p.project(camera);
  board.onPointer({
    clientX: (p.x + 1) / 2 * 1280,
    clientY: (1 - p.y) / 2 * 720,
    preventDefault() {}
  });
}

function stagePasses() {
  const anchor = world.benchAnchor('q3-catalogue');
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 80);
  world.setBenchDeployed('q3-catalogue', true);

  const board = new CatalogueBoard3D(null, { world: worldFrame(camera, anchor) });
  CAT_STAGES.forEach((st, i) => {
    // The same faces the quest hands the drawn board, masked stages included.
    const cards = {};
    for (const [id, c] of Object.entries(CARDS)) {
      cards[id] = st.masked
        ? { code: c.name, name: 'code missing', pips: null }
        : { code: c.code, name: c.name, pips: c.outer };
    }
    board.setStage({ cards, board: st.board || null, drawer: st.drawer || [] });

    // Every slot the stage declares is a slot the board actually built.
    const want = [];
    for (const row of st.board?.rows || []) {
      for (const e of row) if (typeof e === 'string' && e.startsWith('#')) want.push(e.slice(1));
    }
    const got = board.slotIds();
    if (want.join(',') !== got.join(',')) {
      fail(`q3-catalogue stage ${i + 1}: the built board offers slots [${got}] for declared [${want}]`);
    }
    for (const id of want) {
      if (!board.slots.has(id)) fail(`q3-catalogue stage ${i + 1}: slot "${id}" has no place on the board`);
    }

    // FILING IS PRESSED, NOT POKED. This used to set `placed` and `drawer` by
    // hand and assert they read back, which is a test of an assignment. Every
    // rule the board has lives in `onPointer`, behind a real ray, so the press
    // is what has to be driven: aim at the middle of the thing a player would
    // aim at and let the instrument resolve it.
    const loose = (st.drawer || [])[0];
    if (loose && want.length) {
      const slotId = want[0];
      const held = () => board.heldCard();
      const filed = () => board.placements()[slotId];
      const cards = () => board.drawer.length + Object.keys(board.placements()).length;
      const before = cards();

      // 1. A press on a loose card takes it into the hand.
      press(board, camera, board.bodies.get(loose));
      if (held() !== loose) {
        fail(`q3-catalogue stage ${i + 1}: a press on a loose card did not take it into the hand`);
      }

      // 2. A press on the empty slot files it.
      press(board, camera, board.slots.get(slotId).hit);
      if (filed() !== loose) {
        fail(`q3-catalogue stage ${i + 1}: a press on an empty slot did not file the held card`);
      }
      if (!board.slots.get(slotId).card) {
        fail(`q3-catalogue stage ${i + 1}: a filed card has no body on the board`);
      }

      // 3. A press on the filed CARD lifts it back out — and this is the one
      // that fails if the board trusts the ray. The slot's pick target is a
      // deep invisible box that swallows the card standing in it, so the ray
      // answers "slot" whether the slot is full or empty; a board that reads
      // that as an empty slot leaves the card unliftable and then overwrites
      // it with the next card placed, which the player watches vanish.
      press(board, camera, board.slots.get(slotId).card);
      if (filed()) {
        fail(`q3-catalogue stage ${i + 1}: a press on a filed card did not lift it out of its slot`);
      }
      if (!board.drawer.includes(loose)) {
        fail(`q3-catalogue stage ${i + 1}: a lifted card did not come back to the drawer`);
      }
      if (cards() !== before) {
        fail(`q3-catalogue stage ${i + 1}: filing and lifting one card left ${cards()} of ${before} cards`);
      }

      board.clearBoard();
      if (Object.keys(board.placements()).length) {
        fail(`q3-catalogue stage ${i + 1}: clearing the board left cards filed`);
      }
    }
  });
  board.dispose();
  world.setBenchDeployed('q3-catalogue', false);
  ok(`q3-catalogue: the built board lays out all ${CAT_STAGES.length} stages and files a card on each`);

  /* ---- the assay floor ---- */
  const anchor5 = world.benchAnchor('q5-assay');
  const camera5 = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 80);
  world.setBenchDeployed('q5-assay', true);
  const floor = new AssayFloor3D(null, { world: worldFrame(camera5, anchor5) });

  ASSAY_STAGES.forEach((st, i) => {
    floor.setHoppers(st.hoppers || []);
    if ((st.hoppers || []).length !== floor.rigs.length) {
      fail(`q5-assay stage ${i + 1}: ${st.hoppers.length} samples declared, ${floor.rigs.length} rigs built`);
      return;
    }
    for (const hp of st.hoppers || []) {
      const rig = floor.rigs.find(r => r.hopper.id === hp.id);
      if (rig.bins.length !== hp.bins.length) {
        fail(`q5-assay stage ${i + 1}: ${hp.label} declares ${hp.bins.length} bins, the rig built ${rig.bins.length}`);
        continue;
      }
      // Pour it the way the quest does, straight to the end, and count.
      const { totals } = planPour(hp);
      rig.hopper.landed = totals.slice();
      rig.hopper.tally = true;
      floor.refreshBin(rig, null);
      rig.bins.forEach((bin, b) => {
        if (bin.pieces.count !== totals[b]) {
          fail(`q5-assay stage ${i + 1}: ${hp.label} bin ${b + 1} holds ${totals[b]} but draws ${bin.pieces.count}`);
        }
      });
      const drawn = rig.bins.reduce((n, b) => n + b.pieces.count, 0);
      const declared = hp.bins.reduce((n, b) => n + b.n, 0);
      if (drawn !== declared) {
        fail(`q5-assay stage ${i + 1}: ${hp.label} declares ${declared} pieces, the bins hold ${drawn}`);
      }
    }
  });
  floor.dispose();
  world.setBenchDeployed('q5-assay', false);
  ok(`q5-assay: the built floor pours all ${ASSAY_STAGES.length} stages and every piece is placed`);

  /* ---- the weigh bench: the same floor at site 6 ---- */
  const anchor6 = world.benchAnchor('q6-weigh');
  const camera6 = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 80);
  world.setBenchDeployed('q6-weigh', true);
  const floor6 = new AssayFloor3D(null, { world: worldFrame(camera6, anchor6) });
  WEIGH_STAGES.forEach((st, i) => {
    floor6.setHoppers(st.hoppers || []);
    if ((st.hoppers || []).length !== floor6.rigs.length) {
      fail(`q6-weigh stage ${i + 1}: ${st.hoppers.length} samples declared, ${floor6.rigs.length} rigs built`);
    }
  });
  floor6.dispose();
  world.setBenchDeployed('q6-weigh', false);
  ok(`q6-weigh: the built floor lays out all ${WEIGH_STAGES.length} stages`);
}

stagePasses();

/* ================================================================ LIGAR

   Ligar's built benches (the join bench, at sites one and two), deployed onto
   the built Ligar and measured by the same `check` that measures Tallow's five.
   Sites three and four stand ready for benches not yet built: the sampler scope
   and assay floor that used to stand there moved to Kettle with `q1-recipe` and
   `q2-weigh`, and are measured on Tallow. Each is fed the WIDEST stage its
   quest actually declares — read out of the quest's own table, not typed here —
   because the widest stage is the one that runs off the glass first. */

world = new LigarWorld(null);
world.scene.updateMatrixWorld(true);
console.log('');
checkFacing();

// Benches one and two (q1-joins, q2-lattice) are TABLETOPS since T1b and T3a: they are measured below with every real
// table stage. The join bench's pair plates stand on in the warden's room (measured with its foes), and its block plates
// serve no quest now; they are retired with T7.


/* ================================================================ LIGAR, BENCHES THREE TO NINE

   The bond bench, the pair board, the domain rig and the box rack in its
   molecular layout, deployed onto the built Ligar's sites three to nine and
   measured by the same `check` that measures every other instrument: every
   body, readable face and control inside the glass at six aspects, clear of the
   HUD and the world. Each is fed the widest stage its quest declares, read from
   the quest's own table, and then EVERY stage goes through the real pointer
   path: a press on each picture resolves to its own plate. */

const { BondBench3D } = await import('../src/learn/engine/bondbench3d.js');
const { PairBoard3D } = await import('../src/learn/engine/pairboard3d.js');
const { DomainRig3D } = await import('../src/learn/engine/domainrig3d.js');
const { BoxRack3D: LigarRack3D } = await import('../src/learn/engine/boxrack3d.js');

const LG = {};
// (`q4-dots` is a tabletop since T1b; the pair board stands at bench five and in the warden's room.)
for (const id of ['q3-distance', 'q5-resonance', 'q6-shape', 'q7-polarity', 'q8-hybrid', 'q9-orbitals']) {
  LG[id] = await import(`../src/learn/quests/unit03/${id}.js`);
}

function layLigar(bench, st) {
  if (bench instanceof BondBench3D) bench.setPlates(st.rigs, { settings: st.settings || [], setting: st.start || 1 });
  else if (bench instanceof PairBoard3D) bench.setPlates(st.rigs, { hands: ['bond', 'lone', 'x'] });
  else if (bench instanceof DomainRig3D) bench.setPlates(st.rigs, {});
  else bench.setPlates(st.rigs, { show: { counts: Boolean(st.counts) }, hand: null });
}

// A quest that has become a tabletop (q3-distance and q5-resonance in T3a, q6 to q8 in T3b, the rest in T3c) is measured with the real table
// stages below; what stays here is the instruments some quest still plays. The warden's room keeps the bond bench and the pair board.
const LG_BENCHES_ALL = [
  ['q3-distance', 'bond bench', (c, a) => new BondBench3D(null, { world: worldFrame(c, a) })],
  ['q5-resonance', 'pair board (resonance)', (c, a) => new PairBoard3D(null, { world: worldFrame(c, a) })],
  ['q6-shape', 'domain rig (shape)', (c, a) => new DomainRig3D(null, { world: worldFrame(c, a) })],
  ['q7-polarity', 'domain rig (field)', (c, a) => new DomainRig3D(null, { world: worldFrame(c, a) })],
  ['q8-hybrid', 'domain rig (mixer)', (c, a) => new DomainRig3D(null, { world: worldFrame(c, a) })],
  ['q9-orbitals', 'box rack (molecular)', (c, a) => new LigarRack3D(null, { world: worldFrame(c, a) })]
];
const LG_BENCHES = LG_BENCHES_ALL.filter(([id]) => !LG[id].STAGES.every(st => st.widget?.type === 'table'));

{
  const mark = failures;
  for (const [id, label, build] of LG_BENCHES) {
    const stages = LG[id].STAGES;
    const widestSt = stages.reduce((a, b) => (b.rigs.length > a.rigs.length ? b : a));
    check(id, label, build, bench => layLigar(bench, widestSt));
    const dialSt = stages.find(st => st.settings && st !== widestSt);
    if (dialSt) check(id, `${label}, dial stage`, build, bench => layLigar(bench, dialSt));
    // A different head is a different piece of hardware in the well: measure one stage of each.
    const seenHeads = new Set([widestSt.rigs.map(r => r.head).join()]);
    for (const st of stages) {
      const heads = st.rigs.map(r => r.head).join();
      if (seenHeads.has(heads)) continue;
      seenHeads.add(heads);
      check(id, `${label}, ${heads} plate`, build, bench => layLigar(bench, st));
    }
  }
  if (!LG_BENCHES.length) ok('every Ligar quest is a tabletop (T3c): the bond bench, the pair board, the domain rig, the join bench and the box rack serve no quest, and wait for T7 to retire them');
  else if (failures === mark) ok(`the later Ligar instruments frame every body and control at ${ASPECTS.length} aspects`);
}

async function ligarLaterPasses() {
  globalThis.requestAnimationFrame ??= () => 0;
  globalThis.cancelAnimationFrame ??= () => {};
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 80);
  const screenPoint = (station, px, py) => {
    const mesh = station.screen.mesh;
    mesh.updateMatrixWorld(true);
    const size = mesh.geometry.parameters;
    return new THREE.Vector3(
      (px / station.screen.w - 0.5) * size.width, (0.5 - py / station.screen.h) * size.height, 0
    ).applyMatrix4(mesh.matrixWorld);
  };
  const center = h => (h.r !== undefined ? [h.x, h.y] : [(h.x0 + h.x1) / 2, (h.y0 + h.y1) / 2]);

  for (const [id, label, build] of LG_BENCHES) {
    const anchor = world.benchAnchor(id);
    world.setBenchDeployed(id, true);
    let probed = null;
    const bench = build(camera, anchor);
    bench.onProbe = hit => { probed = hit; };
    const pressAt = p => {
      const q = p.clone().project(camera);
      bench.onPointer3D({ clientX: (q.x + 1) / 2 * 1280, clientY: (1 - q.y) / 2 * 720, preventDefault() {} });
    };
    let plates = 0, pressed = 0;
    const stages = LG[id].STAGES;
    for (let i = 0; i < stages.length; i++) {
      const st = stages[i];
      layLigar(bench, st);
      if (bench.stations.length !== st.rigs.length) {
        fail(`${id} stage ${i + 1}: ${st.rigs.length} plates declared, ${bench.stations.length} stations built`);
        continue;
      }
      bench.drawAll();
      bench.viewer.applyCamera();
      camera.updateMatrixWorld(true);
      for (const rec of bench.stations) {
        plates++;
        const where = `${id} stage ${i + 1} ${rec.item.label}`;
        if (rec.station.screen.w < 8) fail(`${where}: the screen has no pixels`);
        if (!rec.hits?.length) { fail(`${where}: the picture drew nothing a press could read`); continue; }

        if (bench instanceof LigarRack3D && rec.item.head === 'rack' && rec.item.combined) {
          // Pick Up from the tray, then tap the first free box: the electron must land.
          const boxHit = rec.hits.find(h => h.key === 'box' && !(rec.item.rack[`${h.row}:${h.idx}`]));
          const chip = rec.hits.find(h => h.key === 'hand' && h.hand === 'u');
          if (!chip || !boxHit) { fail(`${where}: the rack drew no tray or no boxes to press`); continue; }
          pressAt(screenPoint(rec.station, ...center(chip)));
          if (bench.cfg.hand !== 'u') fail(`${where}: a press on the Up chip did not pick it up`);
          const before = bench.readOf(rec.item.id).total;
          pressAt(screenPoint(rec.station, ...center(boxHit)));
          if (bench.readOf(rec.item.id).total !== before + 1) fail(`${where}: a press on a box did not place an electron`);
          bench.clear(rec.item.id); bench.setHand(null);
          pressed++;
          continue;
        }
        const hit = rec.hits.find(h => h.key !== 'hand') || rec.hits[0];
        probed = null;
        pressAt(screenPoint(rec.station, ...center(hit)));
        if (!probed) fail(`${where}: a press on the picture (${hit.key}) read nothing`);
        else if (probed.plateId !== undefined && probed.plateId !== rec.item.id) fail(`${where}: a press read plate ${probed.plateId}`);
        pressed++;
      }
    }
    bench.dispose();
    world.setBenchDeployed(id, false);
    ok(`${id}: all ${stages.length} stages built, ${plates} plates drawn and ${pressed} pressed through the real pointer path`);
  }
}
await ligarLaterPasses();

/* ================================================================ LANTERNFALL

   Nine benches on aurora ice, four new built instruments (the light bench, the
   cloud plate, the box rack and the electron bench) measured by the same
   `check` that measures Tallow's and Ligar's. Each instrument is fed the
   widest stage its quests declare, read from the quests' own tables, AND the
   stage that puts the most dials on the plate, because a knob outboard of the
   leftmost station is the thing most likely to run off the glass. Then every
   stage every quest declares is put through the built instrument and pressed
   through the real pointer path. */

const { LanternfallWorld } = await import('../src/three/lanternfall.js');
const { LightBench3D } = await import('../src/learn/engine/lightbench3d.js');
const { CloudPlate3D } = await import('../src/learn/engine/cloudplate3d.js');
const { BoxRack3D } = await import('../src/learn/engine/boxrack3d.js');
const { ElectronBench3D } = await import('../src/learn/engine/electronbench3d.js');

world = new LanternfallWorld(null);
world.scene.updateMatrixWorld(true);
console.log('');
checkFacing();

const LF = {};
for (const id of ['q1-wave', 'q2-photon', 'q3-lines', 'q4-cloud', 'q5-numbers', 'q6-filling', 'q7-pes', 'q8-trends', 'q9-absorb', 'boss-eater']) {
  LF[id] = await import(`../src/learn/quests/unit02/${id}.js`);
}

/** The items a stage lays on the bench, whichever name the quest gives them. */
const itemsOf = st => st.rigs || st.clouds || [];

/** What a stage tells its bench besides the items. */
function benchCfg(st) {
  return {
    settings: st.settings || [], setting: st.start || 1, brightness: st.brightnessStart ?? st.brightness ?? 3,
    brightnessDial: Boolean(st.brightnessDial), path: st.path ?? 1, region: st.region ?? 'uv-visible',
    mode: st.mode || null, after: Boolean(st.after), labels: st.labels || {}, extent: st.extent ?? 12,
    show: st.show || { n: true, l: true, ml: true, ms: true }, clouds: Boolean(st.cloudsBeside), ladderTop: st.ladderTop || ''
  };
}

function lay(bench, st) {
  const cfg = benchCfg(st);
  if (bench instanceof LightBench3D) bench.setRigs(itemsOf(st), cfg);
  else bench.setPlates(itemsOf(st), cfg);
}

// A quest that has become a tabletop no longer plays its old instrument; the Lantern-Eater (converted in T4d) still does, on the
// electron bench's spectrum head, the box rack and the light bench, so its phases are measured on those benches, at the converted
// quest's own site.
const BOSS_BENCH = { 'q7-pes': st => st.bench === 'pes', 'q9-absorb': st => st.bench === 'light' && st.rigs.some(r => r.head === 'plot'), 'q6-filling': st => st.bench === 'rack' };
const isTable = id => LF[id].STAGES.every(st => st.widget?.type === 'table');
const stagesOf = id => (isTable(id) ? (BOSS_BENCH[id] ? LF['boss-eater'].STAGES.filter(BOSS_BENCH[id]) : []) : LF[id].STAGES);
const widestStage = id => stagesOf(id).reduce((a, b) => (itemsOf(b).length > itemsOf(a).length ? b : a));
const dialStage = id => stagesOf(id).reduce((a, b) => {
  const dials = st => (st.settings ? 1 : 0) + (st.brightnessDial ? 1 : 0);
  return dials(b) > dials(a) ? b : a;
});

// A quest that has become a tabletop (T4a: q1-wave, q2-photon, q3-lines) is measured with the real table stages below;
// what stays here is the instruments some Lanternfall quest still plays (the light bench keeps the cuvette and the Eater's room).
const LF_BENCHES_ALL = [
  ['q1-wave', 'light bench (waves)', (c, a) => new LightBench3D(null, { world: worldFrame(c, a) })],
  ['q2-photon', 'light bench (photocell)', (c, a) => new LightBench3D(null, { world: worldFrame(c, a) })],
  ['q3-lines', 'light bench (spectra)', (c, a) => new LightBench3D(null, { world: worldFrame(c, a) })],
  ['q4-cloud', 'cloud plate', (c, a) => new CloudPlate3D(null, { world: worldFrame(c, a) })],
  ['q5-numbers', 'box rack (addresses)', (c, a) => new BoxRack3D(null, { world: worldFrame(c, a) })],
  ['q6-filling', 'box rack (filling)', (c, a) => new BoxRack3D(null, { world: worldFrame(c, a) })],
  ['q7-pes', 'electron bench (spectra)', (c, a) => new ElectronBench3D(null, { world: worldFrame(c, a) })],
  ['q8-trends', 'electron bench (atoms)', (c, a) => new ElectronBench3D(null, { world: worldFrame(c, a) })],
  ['q9-absorb', 'light bench (cuvette)', (c, a) => new LightBench3D(null, { world: worldFrame(c, a) })]
];
const LF_BENCHES = LF_BENCHES_ALL.filter(([id]) => stagesOf(id).length);

{
  const mark = failures;
  for (const [id, label, build] of LF_BENCHES) {
    check(id, label, build, bench => lay(bench, widestStage(id)));
    if (dialStage(id) !== widestStage(id) && (dialStage(id).settings || dialStage(id).brightnessDial)) {
      check(id, `${label}, dial stage`, build, bench => lay(bench, dialStage(id)));
    }
  }
  if (failures === mark) ok(`all ${LF_BENCHES.length} Lanternfall instruments still played frame every body and control at ${ASPECTS.length} aspects`);
}

/* EVERY STAGE, THROUGH THE REAL POINTER PATH. */
async function lanternfallPasses() {
  globalThis.requestAnimationFrame ??= () => 0;
  globalThis.cancelAnimationFrame ??= () => {};
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 80);
  const screenPoint = (station, px, py) => {
    const mesh = station.screen.mesh;
    mesh.updateMatrixWorld(true);
    const size = mesh.geometry.parameters;
    return new THREE.Vector3(
      (px / station.screen.w - 0.5) * size.width, (0.5 - py / station.screen.h) * size.height, 0
    ).applyMatrix4(mesh.matrixWorld);
  };
  const center = h => (h.r !== undefined ? [h.x, h.y] : [(h.x0 + h.x1) / 2, (h.y0 + h.y1) / 2]);

  for (const [id, label, build] of LF_BENCHES) {
    const anchor = world.benchAnchor(id);
    world.setBenchDeployed(id, true);
    let probed = null;
    const bench = build(camera, anchor);
    bench.onProbe = hit => { probed = hit; };
    const pressAt = p => {
      const q = p.clone().project(camera);
      bench.onPointer3D({ clientX: (q.x + 1) / 2 * 1280, clientY: (1 - q.y) / 2 * 720, preventDefault() {} });
    };
    let plates = 0, pressed = 0;
    const stages = stagesOf(id);
    for (let i = 0; i < stages.length; i++) {
      const st = stages[i];
      lay(bench, st);
      if (bench.stations.length !== itemsOf(st).length) {
        fail(`${id} stage ${i + 1}: ${itemsOf(st).length} plates declared, ${bench.stations.length} stations built`);
        continue;
      }
      // Fill a spectrum, fire a cloud, so every picture has something on it to press.
      if (bench instanceof ElectronBench3D) for (const item of bench.items) if (item.head === 'spectrum') item.progress = 1;
      if (bench instanceof CloudPlate3D) bench.fire(500);
      bench.drawAll();
      bench.viewer.applyCamera();
      camera.updateMatrixWorld(true);

      for (const rec of bench.stations) {
        plates++;
        const where = `${id} stage ${i + 1} ${rec.item.label}`;
        if (rec.station.screen.w < 8) fail(`${where}: the screen has no pixels`);
        if (bench instanceof BoxRack3D && rec.item.head === 'rack') {
          // Pick Up from the tray, then tap the first box: the electron must land.
          // The first box that can take an arrow: empty (Up), or holding one up arrow (Down) when a stage hands the rack over full.
          const free = rec.hits.find(h => h.key === 'box' && !(rec.item.rack[`${h.row}:${h.idx}`]));
          const half = rec.hits.find(h => h.key === 'box' && rec.item.rack[`${h.row}:${h.idx}`] === 'u');
          const boxHit = free || half;
          const spin = free ? 'u' : 'd';
          const chip = rec.hits.find(h => h.key === 'hand' && h.hand === spin);
          if (!chip || !boxHit) { fail(`${where}: the rack drew no tray or no boxes to press`); continue; }
          pressAt(screenPoint(rec.station, ...center(chip)));
          if (bench.cfg.hand !== spin) fail(`${where}: a press on the ${spin === 'u' ? 'Up' : 'Down'} chip did not pick it up`);
          const before = bench.readOf(rec.item.id).total;
          pressAt(screenPoint(rec.station, ...center(boxHit)));
          const after = bench.readOf(rec.item.id).total;
          if (after !== before + 1) fail(`${where}: a press on a box did not place an electron`);
          bench.clear(rec.item.id);
          bench.setHand(null);
          pressed++;
          continue;
        }
        // Only a picture that reads something is pressed: the ladder, the photocell and the
        // plot are read by eye, and a cloud's dots are counted, not tapped.
        if (rec.item.head && ['ladder', 'photocell', 'plot', 'ring', 'cloud'].includes(rec.item.head)) continue;
        const hit = rec.hits?.find(h => h.key !== 'hand');
        if (!hit) continue;
        probed = null;
        pressAt(screenPoint(rec.station, ...center(hit)));
        if (!probed) fail(`${where}: a press on the picture (${hit.key}) read nothing`);
        else if (probed.plateId !== rec.item.id) fail(`${where}: a press read plate ${probed.plateId}`);
        pressed++;
      }
    }
    bench.dispose();
    world.setBenchDeployed(id, false);
    ok(`${id}: all ${stages.length} stages built, ${plates} plates drawn and ${pressed} pressed through the real pointer path`);
  }
}
await lanternfallPasses();

/* ================================================================ BELLOWS

   Six benches on a cloud deck, and ONE built instrument, the gas rig, measured by
   the same `check` that measures every other. It is fed the widest stage its
   quests declare (read from the quests' own tables) and the stage that puts the
   most dials on the plate. Then every stage every Bellows quest declares, the
   boss's five included, is put through the built instrument and pressed through
   the real pointer path. */

const { BellowsWorld } = await import('../src/three/bellows.js');
const { GasRig3D } = await import('../src/learn/engine/gasrig3d.js');
const GASDATA = await import('../src/learn/engine/gasdata.js');

world = new BellowsWorld(null);
world.scene.updateMatrixWorld(true);
console.log('');
checkFacing();

const BW = {};
for (const id of ['q1-knocks', 'q2-laws', 'q3-ideal', 'q4-mixtures', 'q5-speed', 'q6-real', 'boss-compressor']) {
  BW[id] = await import(`../src/learn/quests/unit04/${id}.js`);
}

function layGas(bench, st) {
  bench.setRigs(st.rigs, GASDATA.benchCfg(st, {}));
}
const gasStages = id => BW[id].STAGES;
const gasWidest = id => gasStages(id).reduce((a, b) => (b.rigs.length > a.rigs.length ? b : a));
const gasDials = st => (st.volumes?.length > 1 ? 1 : 0) + (st.temps?.length > 1 ? 1 : 0) + (st.times?.length > 1 ? 1 : 0);
const gasDialStage = id => gasStages(id).reduce((a, b) => (gasDials(b) > gasDials(a) ? b : a));

const BW_BENCHES = ['q1-knocks', 'q2-laws', 'q3-ideal', 'q4-mixtures', 'q5-speed', 'q6-real'].map(id => [
  id, `gas rig (${id})`, (c, a) => new GasRig3D(null, { world: worldFrame(c, a) })
]);

{
  const mark = failures;
  for (const [id, label, build] of BW_BENCHES) {
    check(id, label, build, bench => layGas(bench, gasWidest(id)));
    if (gasDialStage(id) !== gasWidest(id) && gasDials(gasDialStage(id)) > 0) {
      check(id, `${label}, dial stage`, build, bench => layGas(bench, gasDialStage(id)));
    }
  }
  if (failures === mark) ok(`the gas rig frames every body and control at ${ASPECTS.length} aspects on all six Bellows benches`);
}

/* EVERY STAGE, THROUGH THE REAL POINTER PATH. */
async function bellowsPasses() {
  globalThis.requestAnimationFrame ??= () => 0;
  globalThis.cancelAnimationFrame ??= () => {};
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 80);
  const screenPoint = (station, px, py) => {
    const mesh = station.screen.mesh;
    mesh.updateMatrixWorld(true);
    const size = mesh.geometry.parameters;
    return new THREE.Vector3(
      (px / station.screen.w - 0.5) * size.width, (0.5 - py / station.screen.h) * size.height, 0
    ).applyMatrix4(mesh.matrixWorld);
  };
  const center = h => (h.r !== undefined ? [h.x, h.y] : [(h.x0 + h.x1) / 2, (h.y0 + h.y1) / 2]);

  for (const id of ['q1-knocks', 'q2-laws', 'q3-ideal', 'q4-mixtures', 'q5-speed', 'q6-real']) {
    const anchor = world.benchAnchor(id);
    world.setBenchDeployed(id, true);
    let probed = null;
    const bench = new GasRig3D(null, { world: worldFrame(camera, anchor) });
    bench.onProbe = hit => { probed = hit; };
    const pressAt = p => {
      const q = p.clone().project(camera);
      bench.onPointer3D({ clientX: (q.x + 1) / 2 * 1280, clientY: (1 - q.y) / 2 * 720, preventDefault() {} });
    };
    let plates = 0, pressed = 0;
    const stages = gasStages(id);
    for (let i = 0; i < stages.length; i++) {
      const st = stages[i];
      layGas(bench, st);
      if (bench.stations.length !== st.rigs.length) {
        fail(`${id} stage ${i + 1}: ${st.rigs.length} plates declared, ${bench.stations.length} stations built`);
        continue;
      }
      bench.drawAll();
      bench.viewer.applyCamera();
      camera.updateMatrixWorld(true);
      for (const rec of bench.stations) {
        plates++;
        const where = `${id} stage ${i + 1} ${rec.item.label}`;
        if (rec.station.screen.w < 8) fail(`${where}: the screen has no pixels`);
        const hit = rec.hits?.find(h => h.key !== 'hand');
        if (!hit) continue;
        probed = null;
        pressAt(screenPoint(rec.station, ...center(hit)));
        if (!probed) fail(`${where}: a press on the picture (${hit.key}) read nothing`);
        else if (probed.plateId !== rec.item.id) fail(`${where}: a press read plate ${probed.plateId}`);
        pressed++;
      }
    }
    bench.dispose();
    world.setBenchDeployed(id, false);
    ok(`${id}: all ${stages.length} stages built, ${plates} plates drawn and ${pressed} pressed through the real pointer path`);
  }
}
await bellowsPasses();



/* ================================================================ EMBER REACH

   Seven benches round a hot spring, and ONE built instrument, the calorimeter,
   with seven heads: contact, cup, diagram, bonds, hess, box and gibbs. Each quest
   is measured on its OWN site's plate, in its own shelter, at the same six
   aspects. It is fed the widest stage each quest declares and the stage with the
   most dials, and then every stage every Ember Reach quest declares, the boss's
   five included, is put through the built instrument and pressed through the real
   pointer path. The Crucible has no site of its own (it is fought at the rim, as
   every boss is fought on open ground); its phases stand on the first bench's plate. */

const { EmberReachWorld } = await import('../src/three/ember.js');
const { Calorimeter3D } = await import('../src/learn/engine/calorimeter3d.js');
const THERMO = await import('../src/learn/engine/thermodata.js');

const EMBER_IDS = ['q1-flow', 'q2-calorimetry', 'q3-enthalpy', 'q4-bonds', 'q5-hess', 'q6-entropy', 'q7-gibbs', 'boss-crucible'];
const EM = {};
for (const id of EMBER_IDS) EM[id] = await import(`../src/learn/quests/unit05/${id}.js`);

world = new EmberReachWorld(null);
world.scene.updateMatrixWorld(true);
console.log('');
checkFacing();

/** The plate a quest is worked on: its own site, or the first bench's for the boss. */
const emberSite = id => (world.benchAnchor(id) ? id : 'q1-flow');
function layThermo(bench, st) {
  bench.setRigs(st.rigs, THERMO.benchCfg(st, {}));
}
const emberWidest = id => EM[id].STAGES.reduce((a, b) => (b.rigs.length > a.rigs.length ? b : a));
const emberDial = id => EM[id].STAGES.find(st => st.dial?.values?.length > 1);

{
  const mark = failures;
  for (const id of EMBER_IDS) {
    const build = (c, a) => new Calorimeter3D(null, { world: worldFrame(c, a) });
    check(emberSite(id), `calorimeter (${id})`, build, bench => layThermo(bench, emberWidest(id)));
    const dialed = emberDial(id);
    if (dialed && dialed !== emberWidest(id)) {
      check(emberSite(id), `calorimeter (${id}), dial stage`, build, bench => layThermo(bench, dialed));
    }
  }
  if (failures === mark) ok(`the calorimeter frames every body and control at ${ASPECTS.length} aspects on all eight Ember Reach benches`);
}

/* EVERY STAGE, THROUGH THE REAL POINTER PATH. */
async function emberPasses() {
  globalThis.requestAnimationFrame ??= () => 0;
  globalThis.cancelAnimationFrame ??= () => {};
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 80);
  const screenPoint = (station, px, py) => {
    const mesh = station.screen.mesh;
    mesh.updateMatrixWorld(true);
    const size = mesh.geometry.parameters;
    return new THREE.Vector3(
      (px / station.screen.w - 0.5) * size.width, (0.5 - py / station.screen.h) * size.height, 0
    ).applyMatrix4(mesh.matrixWorld);
  };
  const center = h => (h.r !== undefined ? [h.x, h.y] : [(h.x0 + h.x1) / 2, (h.y0 + h.y1) / 2]);

  for (const id of EMBER_IDS) {
    const anchor = world.benchAnchor(emberSite(id));
    world.setBenchDeployed(emberSite(id), true);
    let probed = null;
    const bench = new Calorimeter3D(null, { world: worldFrame(camera, anchor) });
    bench.onProbe = hit => { probed = hit; };
    const pressAt = p => {
      const q = p.clone().project(camera);
      bench.onPointer3D({ clientX: (q.x + 1) / 2 * 1280, clientY: (1 - q.y) / 2 * 720, preventDefault() {} });
    };
    let plates = 0, pressed = 0;
    const stages = EM[id].STAGES;
    for (let i = 0; i < stages.length; i++) {
      const st = stages[i];
      layThermo(bench, st);
      if (bench.stations.length !== st.rigs.length) {
        fail(`${id} stage ${i + 1}: ${st.rigs.length} plates declared, ${bench.stations.length} stations built`);
        continue;
      }
      bench.drawAll();
      bench.viewer.applyCamera();
      camera.updateMatrixWorld(true);
      for (const rec of bench.stations) {
        plates++;
        const where = `${id} stage ${i + 1} ${rec.item.label}`;
        if (rec.station.screen.w < 8) fail(`${where}: the screen has no pixels`);
        const hit = rec.hits?.find(h => h.key !== 'hand');
        if (!hit) continue;
        probed = null;
        pressAt(screenPoint(rec.station, ...center(hit)));
        if (!probed) fail(`${where}: a press on the picture (${hit.key}) read nothing`);
        else if (probed.plateId !== rec.item.id) fail(`${where}: a press read plate ${probed.plateId}`);
        pressed++;
      }
    }
    bench.dispose();
    world.setBenchDeployed(emberSite(id), false);
    ok(`${id}: all ${stages.length} stages built, ${plates} plates drawn and ${pressed} pressed through the real pointer path`);
  }
}
await emberPasses();



/* ================================================================ THE FOES

   PHASE 5 OF docs/plans/storyline-and-combat.md: at T4 a stage that is a fight
   has its foes as BUILT BODIES standing in the wells of the instrument
   (`encounter3d.js`, `foebody.js`). They are measured like any other body, and
   then held to the rules a foe has that nothing else on the bench has:

     - one body per sample or plate, standing in the well of the station that
       holds it, in the order the stage prints them;
     - every pose the species can take stays inside the tray, below the screen
       it stands in front of, and inside the glass at six aspects;
     - NO BODY HIDES A PICTURE: a ray from the camera to a grid of points across
       every station's screen passes every foe in every pose (the instrument is
       still the player's rig and the flat picture is still the picture);
     - nothing a foe does stands inside the bench's own clutter or the world;
     - a press on a foe, through the real pointer path, is a press on its station;
     - a foe's pose is `planFoe`'s pose and nothing else: the 2D `Encounter` is
       driven for real and the body in the scene must read it back;
     - a committed miss makes every body lunge, a clear disperses every body, a
       knock-back makes every body whole, and a dispersed body is gone — not
       dead, gone — and comes back whole on a replayed stage;
     - the budget: a body is a few thousand triangles. */

const { resolveEncounter, planFoe, newFight } = await import('../src/learn/engine/foes.js');
const { Encounter } = await import('../src/learn/engine/encounter.js');
const { WELL_R: FOE_WELL_R } = await import('../src/learn/engine/foebody.js');

const WARDEN_POSES = [
  ['idle'], ['unmoved'], ['cleaved'], ['conductive'], ['splayed', { arms: 6 }], ['splayed', { arms: 2 }],
  ['turned'], ['still'], ['locked'], ['free'], ['dispersed']
];
const COMPRESSOR_POSES = [
  ['idle'], ['laboured'], ['easy'], ['steady'], ['venting'], ['dispersed']
];

/** Triangles a body draws, instances counted. */
function trianglesOf(group) {
  let n = 0;
  group.traverse(o => {
    if (!o.isMesh || !o.geometry || o.material?.colorWrite === false) return;
    const g = o.geometry;
    const per = (g.index ? g.index.count : g.attributes.position.count) / 3;
    n += per * (o.isInstancedMesh ? o.count : 1);
  });
  return n;
}

/** Advance the layer `seconds` of fight time, sampling each body's extent as it goes. */
function runLayer(layer, seconds, boxesOut, inv, dt = 1 / 20) {
  for (let t = 0; t < seconds; t += dt) {
    layer.update(dt);
    layer.group.updateMatrixWorld(true);
    for (const b of layer.bodies.values()) {
      if (!b.group.visible) continue;
      const bx = localBox(b.group, inv);
      if (!bx) continue;
      const prev = boxesOut.get(b);
      if (prev) prev.union(bx); else boxesOut.set(b, bx);
    }
  }
}

function snapshotOf(enc, pose, plan) {
  return { enc, fight: newFight(), poses: new Map(enc.foes.map(f => [f.id, { pose, ...(plan || {}) }])) };
}

/**
 * Put one fighting stage through the built instrument.
 * @param {{ questId, label, build, lay, items, select }} cfg
 */
function foeStage(cfg, stage, stageNo, aspects) {
  const { questId, label } = cfg;
  const anchor = world.benchAnchor(questId);
  const enc = resolveEncounter(stage);
  if (!enc) return null;
  world.setBenchDeployed(questId, true);
  const species = enc.species;
  const table = species === 'basalt warden' ? WARDEN_POSES : COMPRESSOR_POSES;

  for (const [aspectName, aspect] of aspects) {
    const camera = new THREE.PerspectiveCamera(FOV, aspect, 0.05, 80);
    const picked = [];
    const bench = cfg.build(camera, anchor, id => picked.push(id));
    cfg.lay(bench, stage);
    const viewer = bench.viewer;
    viewer.applyCamera();
    viewer.root.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const tag = `${label} stage ${stageNo} @ ${aspectName}`;
    const layer = viewer.foes;
    if (!layer) { fail(`${tag}: the viewer has no foe layer`); bench.dispose?.(); continue; }

    layer.sync(snapshotOf(enc, 'idle'));
    layer.update(0.05);

    // ONE BODY PER FOE, ONE STATION PER BODY, IN THE ORDER THE STAGE PRINTS THEM.
    if (layer.bodies.size !== enc.foes.length || viewer.stations.length !== enc.foes.length) {
      fail(`${tag}: ${enc.foes.length} foes, ${viewer.stations.length} stations, ${layer.bodies.size} bodies`);
      bench.dispose?.();
      continue;
    }
    enc.foes.forEach((foe, i) => {
      const body = layer.bodies.get(foe.id);
      if (!body || body.station !== viewer.stations[i]) fail(`${tag}: ${foe.label} does not stand at station ${i + 1}`);
      // The station the foe stands at holds the sample the foe is made from.
      const rec = bench.stations[i];
      const held = rec?.item?.id ?? rec?.sample?.id;
      if (held !== foe.id) fail(`${tag}: ${foe.label} stands at the station holding "${held}"`);
    });

    const inv = new THREE.Matrix4().copy(viewer.root.matrixWorld).invert();
    const extents = new Map();
    const stationX = i => viewer.stations[i].group.position.x;

    for (const [pose, plan] of table) {
      layer.sync(snapshotOf(enc, pose, plan));
      runLayer(layer, pose === 'dispersed' ? 4.2 : 2.2, extents, inv);
      if (pose === 'dispersed') {
        for (const b of layer.bodies.values()) {
          if (!b.gone && b.group.visible) fail(`${tag}: a dispersed ${species} is still on the plate after 4 s`);
        }
      } else {
        for (const b of layer.bodies.values()) {
          if (!b.group.visible) fail(`${tag}: a ${species} in pose "${pose}" is not drawn`);
        }
      }
    }
    // The counter: every body comes at the player once and returns.
    layer.sync(snapshotOf(enc, 'idle'));
    runLayer(layer, 0.5, extents, inv);
    layer.sync({ ...snapshotOf(enc, 'idle'), fight: { ...newFight(), lost: 1 } });
    for (const b of layer.bodies.values()) if (!(b.lunge > 0.99)) fail(`${tag}: a committed miss did not make a ${species} lunge`);
    runLayer(layer, 0.6, extents, inv);
    runLayer(layer, 0.6, extents, inv);

    // EVERY EXTENT, ALL POSES TOGETHER.
    let k = 0;
    for (const [body, b] of extents) {
      const i = body.stationIndex;
      if (![b.min.x, b.max.x, b.min.y, b.max.y, b.min.z, b.max.z].every(Number.isFinite)) {
        fail(`${tag}: ${body.species} ${i + 1} has a non-finite extent`);
        continue;
      }
      const cx = stationX(i);
      if (b.min.x < cx - 0.34 || b.max.x > cx + 0.34 || b.min.z < -0.34 || b.max.z > 0.36) {
        fail(`${tag}: ${body.species} ${i + 1} leaves its tray — x[${(b.min.x - cx).toFixed(2)}, ${(b.max.x - cx).toFixed(2)}] z[${b.min.z.toFixed(2)}, ${b.max.z.toFixed(2)}]`);
      }
      if (b.min.y < 0.93 || b.max.y > 0.95 + 0.36) {
        fail(`${tag}: ${body.species} ${i + 1} spans y[${b.min.y.toFixed(2)}, ${b.max.y.toFixed(2)}] — the well is at 0.95`);
      }
      k++;
    }

    // THE GLASS: every body, in every pose, inside the frame and under the chrome.
    layer.sync(snapshotOf(enc, 'idle'));
    runLayer(layer, 0.4, new Map(), inv);
    for (const body of layer.bodies.values()) {
      const nd = ndcBounds(body.group, camera);
      if (!nd) { fail(`${tag}: ${body.species} has no bounds`); continue; }
      if (nd.minX < -0.99 || nd.maxX > 0.99 || nd.minY < -0.99) {
        fail(`${tag}: ${body.species} ${body.stationIndex + 1} hangs off the glass — x[${nd.minX.toFixed(2)}, ${nd.maxX.toFixed(2)}] y[${nd.minY.toFixed(2)}, ${nd.maxY.toFixed(2)}]`);
      }
      if (nd.maxY > 1 - TOP_CHROME * 2) fail(`${tag}: ${body.species} ${body.stationIndex + 1} runs under the HUD`);
    }

    // NO BODY HIDES A PICTURE. From the camera to a grid across each screen,
    // in every pose of every foe.
    const rc = new THREE.Raycaster();
    const eye = camera.getWorldPosition(new THREE.Vector3());
    const blocked = new Set();
    for (const [pose, plan] of table) {
      layer.sync(snapshotOf(enc, pose, plan));
      runLayer(layer, pose === 'dispersed' ? 0.2 : 1.6, new Map(), inv);
      layer.group.updateMatrixWorld(true);
      for (const st of viewer.stations) {
        const mesh = st.screen.mesh;
        mesh.updateMatrixWorld(true);
        const w = mesh.geometry.parameters.width, h = mesh.geometry.parameters.height;
        for (let gx = 0; gx < 5; gx++) for (let gy = 0; gy < 5; gy++) {
          const target = new THREE.Vector3((gx / 4 - 0.5) * w * 0.96, (gy / 4 - 0.5) * h * 0.96, 0).applyMatrix4(mesh.matrixWorld);
          const dir = target.clone().sub(eye);
          const dist = dir.length();
          rc.set(eye, dir.normalize());
          rc.far = dist - 0.005;
          for (const body of layer.bodies.values()) {
            if (!body.group.visible) continue;
            const meshes = [];
            body.group.traverse(o => { if (o.isMesh && o !== body.hit && o.material?.colorWrite !== false && o.material?.opacity !== 0) meshes.push(o); });
            if (rc.intersectObjects(meshes, false).length) blocked.add(`${pose}@${st.index + 1}`);
          }
        }
      }
    }
    if (blocked.size) fail(`${tag}: a ${species} hides part of a screen in pose(s) ${[...blocked].slice(0, 4).join(', ')}`);

    // A PRESS ON A FOE IS A PRESS ON ITS STATION, through the real ray.
    layer.sync(snapshotOf(enc, 'idle'));
    runLayer(layer, 0.3, new Map(), inv);
    layer.group.updateMatrixWorld(true);
    for (const body of layer.bodies.values()) {
      const p = body.hit.getWorldPosition(new THREE.Vector3()).project(camera);
      viewer.setPointer({ clientX: (p.x + 1) / 2 * 1280, clientY: (1 - p.y) / 2 * 720 });
      if (viewer.stationUnderRay() !== body.station) fail(`${tag}: a press on ${body.species} ${body.stationIndex + 1} did not choose its station`);
    }
    if (aspectName === '16:9' && cfg.select && enc.foes.length > 1) {
      // The whole click, pointer down and up, on the SECOND foe: the stage's
      // `onSelect` must hear that sample's id.
      const target = layer.bodies.get(enc.foes[1].id);
      const p = target.hit.getWorldPosition(new THREE.Vector3()).project(camera);
      const ev = { clientX: (p.x + 1) / 2 * 1280, clientY: (1 - p.y) / 2 * 720, pointerId: 3, preventDefault() {} };
      viewer._onPointerDown(ev);
      viewer._onPointerUp(ev);
      if (picked[picked.length - 1] !== enc.foes[1].id) fail(`${tag}: pressing the second foe selected ${picked.pop() ?? 'nothing'}, not ${enc.foes[1].id}`);
    }

    // THE BUDGET.
    for (const body of layer.bodies.values()) {
      const tris = trianglesOf(body.group);
      const cap = 16000;
      if (tris > cap) fail(`${tag}: a ${species} draws ${Math.round(tris)} triangles (budget ${cap})`);
    }

    // NOTHING A FOE DOES STANDS INSIDE THE BENCH'S CLUTTER OR THE WORLD.
    if (aspectName === '16:9') {
      const own = new Set();
      viewer.root.traverse(o => own.add(o));
      const seen = new Set();
      world.scene.traverse(o => {
        if (!o.isMesh || own.has(o) || !o.geometry || !o.visible) return;
        for (let a = o.parent; a; a = a.parent) if (!a.visible) return;
        let bodies;
        if (o.isInstancedMesh) bodies = instanceBoxes(o, inv);
        else if (o.userData.partBoxes?.length) bodies = partBoxesIn(o, inv);
        else if (o.userData.ownGeometry && o.parent?.userData?.partBoxes) bodies = partBoxesIn(o.parent, inv);
        else bodies = [localBox(o, inv)];
        for (const wb of bodies) {
          if (!wb || wb.max.y <= 0.905) continue;
          if (wb.getSize(new THREE.Vector3()).length() > 50) continue;
          for (const [body, fb] of extents) {
            if (!shrunk(fb, TOUCH).intersectsBox(shrunk(wb, TOUCH))) continue;
            if (o.userData?.openShell && !shellTouches(o, inv, shrunk(fb, TOUCH))) continue;
            if (o.geometry?.type === 'TubeGeometry' && !tubeTouches(o, inv, shrunk(fb, TOUCH))) continue;
            const c = wb.getCenter(new THREE.Vector3());
            const key = `${c.x.toFixed(2)}|${c.y.toFixed(2)}|${c.z.toFixed(2)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            fail(`${tag}: ${body.species} ${body.stationIndex + 1} stands inside a fitting at (${c.x.toFixed(2)}, ${c.y.toFixed(2)}, ${c.z.toFixed(2)})`);
          }
        }
      });
    }
    bench.dispose?.();
  }
  world.setBenchDeployed(questId, false);
  return enc;
}

/**
 * The 2D Encounter driven for real, with a body standing under it: the pose in
 * the scene must be the pose `planFoe` returned, a miss must lunge, a clear must
 * disperse, a knock-back must make the foe whole, and a replay must restore it.
 */
function foeChain(cfg, stage, stageNo, probes) {
  const { questId, label } = cfg;
  const anchor = world.benchAnchor(questId);
  const enc = resolveEncounter(stage);
  world.setBenchDeployed(questId, true);
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 80);
  const host = { hidden: true, innerHTML: '', className: '', dataset: {}, querySelectorAll: () => [] };
  const encounter = new Encounter(host);
  encounter.begin(enc);                       // the frame runs before the instrument
  const bench = cfg.build(camera, anchor, () => {});
  cfg.lay(bench, stage);
  const layer = bench.viewer.foes;
  const tag = `${label} stage ${stageNo}`;
  layer.update(0.05);
  if (layer.bodies.size !== enc.foes.length) {
    fail(`${tag}: a viewer built after the stage began has ${layer.bodies.size} bodies for ${enc.foes.length} foes`);
  }
  for (const [foeId, probe] of probes) {
    const foe = enc.foes.find(f => f.id === foeId);
    const want = planFoe(enc, foe, probe);
    encounter.react(foeId, probe);
    layer.update(0.05);
    const body = layer.bodies.get(foeId);
    if (!want) continue;
    if (body.pose !== want.pose) fail(`${tag}: planFoe says "${want.pose}" and the body in the scene is in "${body.pose}"`);
  }
  encounter.onMiss();
  for (const b of layer.bodies.values()) if (!(b.lunge > 0.99)) fail(`${tag}: a miss through the Encounter did not make a body lunge`);
  encounter.cancel();
  encounter.onClear();
  layer.update(0.05);
  for (const b of layer.bodies.values()) if (b.pose !== 'dispersed') fail(`${tag}: a clear left a ${b.species} in "${b.pose}"`);
  for (let t = 0; t < 5.5; t += 0.05) layer.update(0.05);
  for (const b of layer.bodies.values()) if (b.group.visible) fail(`${tag}: a cleared foe is still standing`);
  // Replaying the stage starts the fight again with the foes whole.
  encounter.begin(enc);
  layer.update(0.05);
  for (const b of layer.bodies.values()) {
    if (!b.group.visible || b.pose !== 'idle') fail(`${tag}: a replayed stage did not restore its foes (${b.pose}, visible ${b.group.visible})`);
  }
  // A knock-back makes the foe whole again.
  for (let i = 0; i < 3; i++) encounter.onMiss();
  encounter.cancel();
  encounter.paint();
  layer.update(0.05);
  for (const b of layer.bodies.values()) if (b.pose !== 'idle') fail(`${tag}: a knock-back left a ${b.species} in "${b.pose}"`);
  encounter.dispose();
  layer.update(0.05);
  if (layer.bodies.size) fail(`${tag}: the foes outlived the encounter`);
  bench.dispose?.();
  world.setBenchDeployed(questId, false);
}

async function foePasses(cfg, stages, probesFor) {
  const fighting = stages.map((st, i) => [st, i + 1]).filter(([st]) => st.encounter);
  if (!fighting.length) { fail(`${cfg.questId}: no stage declares an encounter`); return; }
  // Every stage at the common aspect; the widest pack at all six.
  const widest = fighting.reduce((a, b) => (cfg.items(b[0]).length > cfg.items(a[0]).length ? b : a));
  const wide = ASPECTS.filter(([n]) => n === '16:9');
  const mark = failures;
  let tris = 0;
  for (const [st, no] of fighting) {
    const enc = foeStage(cfg, st, no, st === widest[0] ? ASPECTS : wide);
    if (enc) tris += enc.foes.length;
    foeChain(cfg, st, no, probesFor(st, enc));
  }
  if (failures === mark) {
    ok(`${cfg.questId}: ${fighting.length} fights built — ${tris} foes stand in their wells, inside the tray and the glass, hiding no screen, read back from planFoe`);
  }
}

console.log('');
console.log('The foes — spoil standing in the wells\n');

{
  // LIGAR: the basalt warden is five table phases since T3c, with its foe in the table's corner; it is held with the other table bosses
  // below ("boss-warden on its tables"), not here.

  // BELLOWS: the Compressor over the boss's five phases.
  // (`world` becomes Bellows.)
  world = new BellowsWorld(null);
  world.scene.updateMatrixWorld(true);
  const gasProbes = (st, enc) => {
    if (!enc) return [];
    const cfg = GASDATA.benchCfg(st, {});
    const out = [];
    for (const f of enc.foes) {
      const rig = st.rigs.find(r => r.id === f.id);
      const rest = rig.head === 'mixture'
        ? (() => { const m = GASDATA.mixtureState(rig, cfg); return { P: GASDATA.planMixture(rig.parts, m.T, m.V).P, V: m.V }; })()
        : (() => { const r = GASDATA.planGas(rig, cfg); return { P: r.P, V: r.V }; })();
      if (rig.head === 'cylinder' || rig.head === 'mixture') {
        out.push([f.id, { kind: 'gas', item: rig, cfg, rest }]);
        const hot = rig.head === 'cylinder' ? { ...rig, n: (rig.n || 1) * 3 } : { ...rig, parts: rig.parts.map(p => ({ ...p, n: p.n * 3 })) };
        out.push([f.id, { kind: 'gas', item: hot, cfg, rest }]);
      } else if (rig.head === 'leak') out.push([f.id, { kind: 'leak', gas: rig.gas, seconds: 6 }]);
      else if (rig.head === 'tube') out.push([f.id, { kind: 'tube', gas: rig.gas, seconds: 6, length: rig.length || 8 }]);
      else if (rig.head === 'path') out.push([f.id, { kind: 'path', hits: 6 }]);
    }
    return out;
  };
  const bellowsCfg = (questId, label) => ({
    questId, label, build: (camera, anchor) => new GasRig3D(null, { world: worldFrame(camera, anchor) }),
    lay: (bench, st) => layGas(bench, st), items: st => st.rigs || [], select: false
  });
  // The Compressor has no site of its own; its five phases stand on the first bench's plate.
  await foePasses(bellowsCfg('q1-knocks', 'gas rig (the Compressor)'), BW['boss-compressor'].STAGES, gasProbes);

  // EMBER REACH: the Crucible over the boss's five phases, on the first bench's plate.
  // (`world` becomes Ember Reach.)
  world = new EmberReachWorld(null);
  world.scene.updateMatrixWorld(true);
  const thermoProbes = (st, enc) => {
    if (!enc) return [];
    const cfg = THERMO.benchCfg(st, {});
    return enc.foes.flatMap(f => {
      const item = st.rigs.find(r => r.id === f.id);
      return [
        [f.id, { kind: 'thermo', item, cfg }],
        [f.id, { kind: 'thermo', item, cfg: { ...cfg, toggled: true } }]
      ];
    });
  };
  const emberCfg = {
    questId: 'q1-flow', label: 'calorimeter (the Crucible)',
    build: (camera, anchor) => new Calorimeter3D(null, { world: worldFrame(camera, anchor) }),
    lay: (bench, st) => layThermo(bench, st), items: st => st.rigs || [], select: false
  };
  await foePasses(emberCfg, EM['boss-crucible'].STAGES, thermoProbes);
}
/* ------------------------------------------------------------------ the bay */

/**
 * THE BAY CONTRACT (`three/bench-bay.js`). Whatever a world builds round a bench,
 * nothing of it may stand in the bay: not the plate and the air over it, not the
 * volume the frame's screens hang in, not the 1.95 m behind the plate, not the
 * ground the camera stands on in front. The shelters that used to stand here
 * guaranteed this by accident; this measures it, in all five worlds, so a host
 * that wraps machinery round a bench cannot grow into it.
 *
 * Each world is built UNBAKED (`bakeStatics` off) so the bench's own parts are still
 * identifiable and exempt: baking flattens the whole site into one mesh per
 * material. The bench's own bodies (`anchor.dormant.parent`) are skipped; every
 * other body in the world is measured in the bay's frame.
 */
{
  const BAY = await import('../src/three/bench-bay.js');
  const { findBayIntrusions, collectBoxes } = await import('./lib/overlap.mjs');
  const { planLeanIn, PLATE_ZONE } = await import('../src/learn/engine/lean.js');
  const { sightBlockers, behindCover } = await import('./lib/lean-check.mjs');
  const { Table3D: TableForKit } = await import('../src/learn/engine/table3d.js');
  const KITMODEL = await import('../src/learn/table/model.js');
  const KITFIX = await import('./lib/table-fixture.mjs');
  KITFIX.registerTestKit();
  const { BellowsWorld } = await import('../src/three/bellows.js');
  const { EmberReachWorld } = await import('../src/three/ember.js');
  console.log('\nthe bench bay, in every world');
  const posesCache = new Map();
  /** The whole-plate lean pose at a viewport, solved once. */
  const leanPlateRef = (vw, vh) => {
    const k = `${vw}x${vh}`;
    if (!posesCache.has(k)) posesCache.set(k, planLeanIn({ viewport: { w: vw, h: vh } }));
    return posesCache.get(k);
  };

  // The screens' envelope contains every panel the frame hangs (PANEL_LAYOUT), tilt and yaw included.
  {
    const volumes = BAY.bayBoxes();
    const env = new THREE.Box3(new THREE.Vector3(...volumes.panels.min), new THREE.Vector3(...volumes.panels.max));
    const out = [];
    for (const [id, spec] of Object.entries(PANEL_LAYOUT)) {
      const frameY = new THREE.Vector3(0, BAY.PANEL_FRAME_Y, 0);
      for (const c of panelCorners(spec)) {
        c.add(frameY);
        if (!env.containsPoint(c)) out.push(`${id} corner (${c.toArray().map(n => n.toFixed(2)).join(', ')})`);
      }
    }
    if (out.length) fail(`PANEL_LAYOUT leaves the bay's panel volume: ${out.join('; ')}`);
    else ok('every screen of PANEL_LAYOUT hangs inside the bay\'s panel volume');
  }

  /** The plate the instrument lays out on, as the viewer builds it, matches the bay's. */
  {
    const b = BAY.BENCH_BAY;
    if (b.width !== 4.8 || b.depth !== 1.3 || b.height !== 0.95) fail(`BENCH_BAY is ${b.width} x ${b.depth} at ${b.height}, not 4.8 x 1.3 at 0.95`);
    else ok('BENCH_BAY is the 4.8 x 1.3 m plate at 0.95 m');
  }

  // The bay's work volume contains everything any instrument raises over the plate.
  {
    const reach = instrumentReach.clone();
    reach.min.y += BAY.PLATE_TOP - 0.905; reach.max.y += BAY.PLATE_TOP - 0.905;   // the viewer's root sits 0.905 under the plate top
    const work = BAY.bayBoxes().work;
    const inside = reach.min.x >= work.min[0] && reach.max.x <= work.max[0] && reach.min.y >= BAY.PLATE_TOP - 0.1 &&
      reach.max.y <= work.max[1] && reach.min.z >= work.min[2] && reach.max.z <= work.max[2];
    const span = `x[${reach.min.x.toFixed(2)}, ${reach.max.x.toFixed(2)}] y[${reach.min.y.toFixed(2)}, ${reach.max.y.toFixed(2)}] z[${reach.min.z.toFixed(2)}, ${reach.max.z.toFixed(2)}]`;
    if (!instrumentReach.isEmpty() && inside) ok(`every instrument stays inside the bay's work volume (reach ${span})`);
    else fail(`the instruments reach ${span}, outside the bay's work volume`);
  }

  // Every skin: the same plate, the same anchor, the same footprint, whatever the dress.
  {
    const mat = new THREE.MeshStandardMaterial();
    const ctx = { own: (...o) => o[0], t4: false };
    const mats = { top: mat, dark: mat, stone: mat, timber: mat };
    const before = failures;
    for (const skin of BAY.BENCH_SKINS) {
      const bench = BAY.buildBayBench(ctx, { skin, mats, rail: null, plate: 'TEST' });
      bench.group.updateMatrixWorld(true);
      if (bench.topY !== BAY.PLATE_TOP) fail(`skin ${skin}: topY is ${bench.topY}, not ${BAY.PLATE_TOP}`);
      if (!bench.indicator || !bench.dormant || bench.dormant.userData.noMerge !== true) fail(`skin ${skin}: missing its indicator or its dormant slot`);
      const body = new THREE.Box3();
      bench.group.traverse(o => {
        if (!o.isMesh || o === bench.indicator) return;
        for (let a = o; a; a = a.parent) if (a === bench.dormant) return;
        body.union(new THREE.Box3().setFromObject(o));
      });
      const hw = BAY.BENCH_BAY.width / 2 + 0.1;
      const hd = BAY.BENCH_BAY.depth / 2 + 0.1;
      if (body.min.x < -hw || body.max.x > hw || body.min.z < -hd || body.max.z > hd || body.max.y > BAY.PLATE_TOP + 0.2 || body.min.y < -0.001) {
        fail(`skin ${skin}: its dress leaves the plate's footprint (${body.min.toArray().map(n => n.toFixed(2))} .. ${body.max.toArray().map(n => n.toFixed(2))})`);
      }
    }
    try { BAY.buildBayBench(ctx, { skin: 'nope', mats }); fail('an unknown skin was accepted'); } catch { /* refused, as it should be */ }
    if (failures === before) ok(`all ${BAY.BENCH_SKINS.length} skins keep the plate, the anchor and the footprint`);
  }

  /*
   * THE RATCHET. The shelters, gantries and lean-tos that stand round the benches today
   * were built to a looser envelope than the bay's, and `tools/bay-legacy.json` lists, per
   * bench, the volumes they still intrude on. A listed (bench, volume) is allowed; anything
   * else is a failure, and so is a listed entry that no longer occurs, so the file can only
   * shrink: the phase that rebuilds a bench's host deletes its line. New hosts get no entry.
   */
  const fs = await import('node:fs');
  const legacyPath = new URL('./bay-legacy.json', import.meta.url);
  const legacy = fs.existsSync(legacyPath) ? JSON.parse(fs.readFileSync(legacyPath, 'utf8')) : {};
  const found = {};
  let waived = 0;

  for (const [label, key, World] of [
    ['Tallow', 'tallow', TallowWorld], ['Ligar', 'ligar', LigarWorld], ['Lanternfall', 'lanternfall', LanternfallWorld],
    ['Bellows', 'bellows', BellowsWorld], ['Ember Reach', 'ember', EmberReachWorld]
  ]) {
    const proto = World.prototype;
    const baked = proto.bakeStatics;
    proto.bakeStatics = function () { /* bodies stay identifiable for this check */ };
    let w;
    try { w = new World(null); } finally { proto.bakeStatics = baked; }
    w.scene.updateMatrixWorld(true);
    const volumes = BAY.bayBoxes();
    const before = failures;
    let n = 0;
    for (const [questId, anchor] of w.benchAnchors) {
      n++;
      const node = new THREE.Group();
      node.position.set(anchor.position[0], anchor.topY - BAY.PLATE_TOP, anchor.position[2]);
      node.rotation.y = anchor.rotationY;
      node.updateMatrixWorld(true);
      const frame = new THREE.Matrix4().copy(node.matrixWorld).invert();
      const own = anchor.dormant?.parent;
      if (!own) { fail(`${label} ${questId}: the anchor has no bench to exempt`); continue; }
      const bodies = collectBoxes(w.scene, { frame, skip: o => o === own });
      const hits = findBayIntrusions(w.scene, frame, volumes, { skip: o => o === own, bodies });
      const byVolume = new Map();
      for (const h of hits) byVolume.set(h.volume, [...(byVolume.get(h.volume) || []), h]);

      // THE LEANED-IN VIEW (plan §2.6.2), from the whole-plate pose at each supported viewport:
      //   sight  no body stands between the camera and the plate;
      //   view   past the plate's far edge the frame is the host or the world, never bare sky.
      // (`lean`, the camera's own air, is the volume above.) The three share one waiver file.
      {
        const toWorld = node.matrixWorld;
        const lift = BAY.PLATE_TOP - 0.895;
        const blockedBy = [];
        let bare = null;
        for (const [name, vw, vh] of LEAN_VIEWPORTS) {
          const pose = leanPlateRef(vw, vh);
          const cam = [pose.position[0], pose.position[1] + lift, pose.position[2]];
          const sb = sightBlockers(bodies, cam, PLATE_ZONE, BAY.PLATE_TOP);
          if (sb.blocked) blockedBy.push({ body: `${sb.first.name} (${name})`, depth: 0.5, at: sb.first.at });
          const camera = new THREE.PerspectiveCamera(FOV, vw / vh, 0.05, 80);
          camera.position.set(...cam);
          camera.lookAt(pose.target[0], pose.target[1] + lift, pose.target[2]);
          const bc = behindCover({ bodies, camera, plateY: BAY.PLATE_TOP, farZ: -BAY.BENCH_BAY.depth / 2, toWorld, terrain: (x, z) => w.getTerrainHeight(x, z), safe: pose.safe });
          if (bc.covered < bc.total) bare = bare || { body: `${bc.total - bc.covered} of ${bc.total} rays past the plate reach no host and no ground (${name})`, depth: 0.5, at: cam.map(n => +n.toFixed(2)) };
        }
        if (blockedBy.length) byVolume.set('sight', blockedBy);
        if (bare) byVolume.set('view', [bare]);
      }
      const id = `${key}/${questId}`;
      const allowed = new Set(legacy[id] || []);
      if (byVolume.size) found[id] = [...byVolume.keys()].sort();
      for (const [volume, list] of byVolume) {
        if (allowed.has(volume)) { waived++; continue; }
        const h = list[0];
        fail(`${label} ${questId}: ${h.body} ${volume === 'sight' || volume === 'view' ? `spoils the leaned-in ${volume}` : `stands ${h.depth.toFixed(2)} m inside the bay's ${volume} volume`} at (${h.at.join(', ')})` +
          (list.length > 1 ? `, and ${list.length - 1} more` : ''));
      }
      for (const volume of allowed) {
        if (!byVolume.has(volume)) fail(`${label} ${questId}: the ${volume} volume is clear now; delete "${volume}" from tools/bay-legacy.json`);
      }
    }

    // THE TABLE IS THE HOST'S OWN WORK SURFACE (plan §2.6.1): a tabletop deployed on this world's bench dresses its
    // fixtures from the materials that bench was built from, never from the bench kit's defaults.
    {
      const [qid, anch] = [...w.benchAnchors][0];
      const hostMats = anch.dormant?.userData?.benchMats;
      if (!hostMats?.top || !hostMats?.dark) {
        fail(`${label} ${qid}: the host recorded no materials for its bench (buildBayBench keeps them on the case)`);
      } else {
        const dressed = (materials) => {
          const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 80);
          const t = new TableForKit(null, {
            world: { scene: w.scene, camera, position: anch.position, rotationY: anch.rotationY, topY: anch.topY, materials }
          });
          t.setState(KITMODEL.createTable(KITFIX.TEST_TABLE_WIDE, 'kit'));
          const offenders = new Set();
          for (const root of [t.fixtureRoot, t.pieceRoot, t.joinRoot]) {
            root.traverse(o => {
              if (!o.isMesh) return;
              const m = o.material;
              if (Object.values(hostMats).includes(m) || m.userData?.tableOwned) return;
              offenders.add(m === t.steelMat || m === t.darkMat ? 'the bench kit' : (m.type || 'a material'));
            });
          }
          const usesKit = [...t.fixtureRoot.children].some(c => c.material === t.steelMat || c.material === t.darkMat);
          t.dispose();
          return { offenders: [...offenders], usesKit };
        };
        const withKit = dressed(hostMats);
        if (withKit.offenders.length || withKit.usesKit) fail(`${label} ${qid}: a tabletop on this bench uses ${withKit.offenders.join(', ') || 'the bench kit'}, not the host's own materials`);
        // The check has teeth: with the host's materials withheld, the same table IS dressed from the bench kit.
        if (key === 'tallow') {
          const bare = dressed(null);
          if (!bare.offenders.includes('the bench kit')) fail('the material-kit check cannot tell a bench-kit table from a host-dressed one');
        }
      }
    }
    if (failures === before) ok(`${label}: ${n} benches, nothing new stands in any bay or in the leaned-in view, a tabletop dressed from the host's own materials`);
  }
  if (process.env.BAY_WRITE_BASELINE) {
    fs.writeFileSync(legacyPath, JSON.stringify(Object.fromEntries(Object.entries(found).sort()), null, 2) + '\n');
    console.log('       wrote tools/bay-legacy.json');
  }
  console.log(`       ${waived} legacy bench volumes still waived (tools/bay-legacy.json)`);
}


/* ------------------------------------------------------------ the leaned-in tabletop */

/**
 * THE TABLETOP, LEANED IN (plan `bench-tabletop.md` §2, §3.5). Proved on the
 * throwaway table (`tools/lib/table-fixture.mjs`), which no quest plays:
 *   - at every supported viewport the table's whole used zone is inside the free
 *     glass: below the HUD and the prompt strip, above the foot dock;
 *   - the smallest piece is at least 28 px across, on the smallest phone too;
 *   - the camera stands inside the bay's `approach` or `lean` air;
 *   - a press on a piece takes it, a press on empty table is a look, and the
 *     throwaway stage's whole solution is played through the REAL pointer path
 *     (viewer `_onPointerDown`/`Move`/`Up`), by drag and by two taps, and lands
 *     on the table the reducer reaches;
 *   - a step stands the player up, `[E]` leans in again, and a world's field
 *     point (registered through `three/field-points.js`) puts the item in the
 *     carry slot until the player is back at the bench;
 *   - fixtures are dressed from the host's own materials, never the bench kit's.
 */
{
  console.log('\nthe leaned-in tabletop, on the throwaway table');
  const MODEL = await import('../src/learn/table/model.js');
  const SNAP = await import('../src/learn/table/snap.js');
  const LAYOUT = await import('../src/learn/table/layout.js');
  const REG = await import('../src/learn/table/kits/registry.js');
  const FIX = await import('./lib/table-fixture.mjs');
  const BAY = await import('../src/three/bench-bay.js');
  const { Table3D } = await import('../src/learn/engine/table3d.js');
  const { chromeReserve, PLATE_ZONE, planLeanIn } = await import('../src/learn/engine/lean.js');
  const FP = await import('../src/three/field-points.js');
  FIX.registerTestKit();

  const questId = world.benchAnchor('q1-flow') ? 'q1-flow' : [...world.benchAnchors.keys()][0];
  const anchor = world.benchAnchor(questId);
  world.setBenchDeployed(questId, true);
  const mats = anchor.dormant?.userData?.benchMats || null;
  const frameOf = camera => ({
    scene: world.scene, camera, position: anchor.position, rotationY: anchor.rotationY, topY: anchor.topY,
    materials: mats, object: world, walkOwnsHeight: true
  });
  const setGlass = (w, h) => { window.innerWidth = w; window.innerHeight = h; };
  const before = failures;
  let grabs = 0;

  // The bay's `lean` air must hold every camera the planner can ask for.
  const lean = BAY.bayBoxes().lean;
  const inBox = (p, b) => p.every((v, i) => v >= b.min[i] - 1e-6 && v <= b.max[i] + 1e-6);
  const approach = BAY.bayBoxes().approach;
  const smallZone = LAYOUT.plateMap(FIX.TEST_TABLE_WIDE.bounds).zone;

  for (const [vpName, vw, vh] of LEAN_VIEWPORTS) {
    setGlass(vw, vh);
    const camera = new THREE.PerspectiveCamera(FOV, vw / vh, 0.05, 80);
    const bench = new Table3D(null, { world: frameOf(camera), onAction: () => {} });
    const state = MODEL.createTable(FIX.TEST_TABLE_WIDE, 'lean');
    bench.setState(state);
    bench.settleLean();
    const tag = `leaned in @ ${vpName} (${vw}x${vh})`;
    if (!bench.leaning || !bench.lean?.pose) { fail(`${tag}: the table did not lean in`); bench.dispose(); continue; }
    if (!bench.lean.pose.fits) fail(`${tag}: the used zone does not fit the free glass`);

    // Through the REAL camera the viewer left, the table's used zone is inside the free glass.
    const res = chromeReserve(vw, vh);
    const free = { l: -1 + 2 * res.left / vw, r: 1 - 2 * res.right / vw, b: -1 + 2 * res.bottom / vh, t: 1 - 2 * res.top / vh };
    camera.updateMatrixWorld(true);
    const zone = bench.map.zone;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, z] of [[zone.x0, zone.z0], [zone.x1, zone.z0], [zone.x0, zone.z1], [zone.x1, zone.z1]]) {
      const p = new THREE.Vector3(x, 0.895, z);
      bench.root.localToWorld(p);
      p.project(camera);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    const eps = 0.012;
    if (minX < free.l - eps || maxX > free.r + eps) fail(`${tag}: the table runs out of the free width — x[${minX.toFixed(2)}, ${maxX.toFixed(2)}] free[${free.l.toFixed(2)}, ${free.r.toFixed(2)}]`);
    if (maxY > free.t + eps) fail(`${tag}: the table runs under the HUD and the prompt strip — top at ${maxY.toFixed(2)}, free to ${free.t.toFixed(2)}`);
    if (minY < free.b - eps) fail(`${tag}: the table runs under the foot dock — bottom at ${minY.toFixed(2)}, free from ${free.b.toFixed(2)}`);
    if (maxY > 1 - 2 * res.hud / vh) fail(`${tag}: the table reaches into the HUD band`);

    // The smallest piece, in screen pixels.
    const kit = REG.getKit(state.kit);
    let smallest = Infinity;
    for (const p of Object.values(state.pieces)) {
      if (p.hidden) continue;
      const r = REG.radiusOf(kit, p);
      const a = bench.map.toPlate(p.at);
      const b = bench.map.toPlate({ x: p.at.x + r, y: p.at.y });
      const pa = new THREE.Vector3(a.x, 0.895, a.z);
      const pb = new THREE.Vector3(b.x, 0.895, b.z);
      bench.root.localToWorld(pa); bench.root.localToWorld(pb);
      pa.project(camera); pb.project(camera);
      smallest = Math.min(smallest, 2 * Math.hypot((pb.x - pa.x) * vw / 2, (pb.y - pa.y) * vh / 2));
    }
    if (smallest < 28) fail(`${tag}: the smallest piece is ${smallest.toFixed(1)} px across, under 28`);

    // The camera stands in air the bay keeps clear: `approach` or `lean`.
    const local = bench.root.worldToLocal(camera.position.clone());
    const inBay = [local.x, local.y + (BAY.PLATE_TOP - 0.895), local.z];
    if (!inBox(inBay, lean) && !inBox(inBay, approach)) fail(`${tag}: the camera at bay (${inBay.map(n => n.toFixed(2)).join(', ')}) is outside the approach and lean air`);
    if (vpName === '16:9' || vpName === 'small phone') drive3D(bench, camera, vw, vh, tag);
    if (vpName === '16:9') await behaviours(bench, camera, vw, vh, tag);
    bench.dispose();
  }

  // The half-size zone of the plate's whole width is also held in the lean air (a docked briefing slides it aside).
  for (const [vpName, vw, vh] of LEAN_VIEWPORTS) {
    for (const zones of [[PLATE_ZONE], [smallZone]]) {
      const pose = leanPlate(zones, vw, vh);
      const bay = [pose.position[0], pose.position[1] + (BAY.PLATE_TOP - 0.895), pose.position[2]];
      if (!inBox(bay, lean) && !inBox(bay, approach)) fail(`the lean pose at ${vpName} for ${zones[0] === PLATE_ZONE ? 'the whole plate' : 'the throwaway table'} is outside the lean air (bay ${bay.map(n => n.toFixed(2))})`);
    }
  }
  if (!grabs) fail('the pointer path never took hold of anything on the throwaway table');
  if (failures === before) ok(`the throwaway table leans in at ${LEAN_VIEWPORTS.length} viewports: whole zone in the free glass, smallest piece 28 px or more, camera in the bay's lean air; its solution played through the real pointer path (${grabs} presses took hold), a look, a step, [E] and a field point checked`);

  world.setBenchDeployed(questId, false);

  /** Table units to a client pixel at the current camera. */
  function px(bench, camera, vw, vh, u) {
    const pl = bench.map.toPlate(u);
    const p = new THREE.Vector3(pl.x, 0.895, pl.z);
    bench.root.localToWorld(p);
    p.project(camera);
    return { clientX: (p.x + 1) / 2 * vw, clientY: (1 - p.y) / 2 * vh };
  }
  function leanPlate(zones, vw, vh) {
    return planLeanIn({ zones, viewport: { w: vw, h: vh } });
  }

  /** Play the throwaway solution through the viewer's own pointer handlers. */
  function drive3D(bench, camera, vw, vh, tag) {
    const kit = REG.getKit('bars');
    const sigOf = s => JSON.stringify(MODEL.signature(s));
    const direct = MODEL.runScript(MODEL.createTable(FIX.TEST_TABLE_WIDE, 'lean'), FIX.TEST_SOLUTION, { mode: 'direct', strict: true });
    for (const mode of ['drag', 'tap']) {
      let state = MODEL.createTable(FIX.TEST_TABLE_WIDE, 'lean');
      const b2 = new Table3D(null, { world: frameOf(camera), onAction: a => { state = MODEL.apply(state, a); b2.setState(state); b2.settle(); } });
      b2.setState(state);
      b2.settleLean();
      camera.updateMatrixWorld(true);
      let id = 20;
      const ev = (u, extra = {}) => ({ ...px(b2, camera, vw, vh, u), pointerId: id, preventDefault() {}, ...extra });
      const down = u => { id++; const e = ev(u); b2._onPointerDown(e); if (b2.grabbing) grabs++; return e; };
      const move = u => b2._onPointerMove(ev(u));
      const up = u => b2._onPointerUp(ev(u));
      const tap = u => { down(u); up(u); };
      try {
        for (const step of FIX.TEST_SOLUTION) {
          const verb = Object.keys(step)[0];
          const arg = step[verb];
          let piece = null, to = null;
          if (verb === 'place' && arg.to !== undefined) { piece = arg.piece ?? state.carry.held; to = arg.to; }
          else if (verb === 'join') { piece = arg[0]; to = `piece:${arg[1]}`; }
          else if (verb === 'predict' && arg) { piece = arg; to = `slot:${state.prediction.slot}`; }
          if (piece) {
            const c = { ...state.pieces[piece].at };
            const p = SNAP.pointFor(state, kit, to, piece);
            if (mode === 'drag') { down(c); move({ x: (c.x + p.x) / 2, y: (c.y + p.y) / 2 }); move(p); up(p); }
            else { tap(c); tap(p); }
          } else if (verb === 'setDial') {
            const lay = LAYOUT.fixtureLayout(state.fixtures[arg.fixture]);
            const t = lay.dials.find(x => x.name === arg.dial);
            const d = state.fixtures[arg.fixture].dials[arg.dial];
            const x = t.x0 + (arg.value - d.min) / (d.max - d.min) * (t.x1 - t.x0);
            tap({ x, y: t.y });
          } else if (verb === 'run') {
            const r = LAYOUT.fixtureLayout(state.fixtures[typeof arg === 'string' ? arg : arg.fixture]).run;
            tap({ x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 });
          } else if (verb === 'pour') {
            const A = state.zones.containers[arg.from];
            const B = state.zones.containers[arg.to];
            // One drag from jar to jar pours one step; the script's amount is repeated that many times.
            for (let k = 0; k < arg.amount; k++) {
              if (mode === 'drag') { down(A.at); move({ x: (A.at.x + B.at.x) / 2, y: A.at.y }); move(B.at); up(B.at); }
              else { tap(A.at); tap(B.at); }
            }
          } else if (verb === 'lay') {
            const rows = b2.sheetRows();
            if (rows.length >= 2 && arg && arg.through) {
              const a = rows[arg.through[0]].u;
              const z = rows[arg.through[1]].u;
              down(a); move({ x: (a.x + z.x) / 2, y: (a.y + z.y) / 2 }); move(z); up(z);
            } else b2.onAction(step);
          } else if (verb === 'fetch') {
            b2.takeField({ id: arg, label: 'Shelf' });
            b2.flushCarry();
          } else {
            b2.onAction(step);
          }
        }
      } catch (e) {
        fail(`${tag}: playing the solution by ${mode} through the pointer path faulted — ${e.stack?.split('\n').slice(0, 3).join(' ')}`);
        b2.dispose();
        continue;
      }
      if (sigOf(state) !== sigOf(direct)) {
        const a = JSON.parse(sigOf(state));
        const d = JSON.parse(sigOf(direct));
        const keys = Object.keys(d).filter(k => JSON.stringify(a[k]) !== JSON.stringify(d[k]));
        fail(`${tag}: the pointer path by ${mode} does not reach the table the script names (differs in ${keys.join(', ')})`);
      }
      const bad = MODEL.checkInvariants(state);
      if (bad.length) fail(`${tag}: the table is unsound after the pointer path by ${mode} — ${bad[0]}`);
      b2.dispose();
    }
  }

  /** A look, a step, `[E]`, a field point, the carry slot. */
  async function behaviours(bench, camera, vw, vh, tag) {
    camera.updateMatrixWorld(true);
    // An empty spot is a look: nothing is grabbed, the view swings and settles back.
    const e0 = { ...px(bench, camera, vw, vh, { x: 66, y: 28.5 }), pointerId: 91, preventDefault() {} };
    bench._onPointerDown(e0);
    if (bench.grabbing) fail(`${tag}: a press on empty table took hold of something`);
    bench._onPointerMove({ ...e0, clientX: e0.clientX + 40, clientY: e0.clientY + 10 });
    if (!bench.lean || bench.lean.look.yaw === 0) fail(`${tag}: a drag on empty table is not a look`);
    bench._onPointerUp({ ...e0, clientX: e0.clientX + 40, clientY: e0.clientY + 10 });
    for (let i = 0; i < 90; i++) bench.update(1 / 30);
    if (bench.lean && (bench.lean.look.yaw !== 0 || bench.lean.look.pitch !== 0)) fail(`${tag}: the look did not settle back to the framing`);
    if (bench.playerControlled) fail(`${tag}: a look handed the camera to the player`);

    // A step stands the player up; [E] at the bench leans in again; Escape / Stand does the same as a step.
    bench.leaveLean({ walked: true });
    if (bench.leaning || !bench.playerControlled) fail(`${tag}: a step did not hand the camera back to the walk`);
    const origin = camera.position.clone();
    const toPlate = new THREE.Vector3(0, 0.895, 0.2);
    bench.root.localToWorld(toPlate);
    const stand = origin.clone().setY(anchor.topY + 0.65);
    const front = new THREE.Vector3(0, 0, 1.8); bench.root.localToWorld(front);
    stand.x = front.x; stand.z = front.z;
    const dir = toPlate.clone().sub(stand).normalize();
    const e = bench.aimedInteraction(stand, dir, world);
    if (!e || !/LEAN IN/.test(e.prompt)) fail(`${tag}: [E] at the bench does not offer to lean in`);
    else { e.act(); bench.settleLean(); if (!bench.leaning) fail(`${tag}: [E] did not lean in`); }
    bench.leaveLean();
    if (bench.leaning || bench.playerControlled) fail(`${tag}: Stand did not return the standing aim`);
    bench.leanIn({ instant: true });

    // A field point: registered by the world, taken with [E] where the camera POINTS, carried, then on the table.
    const shelf = FP.registerFieldPoint(world, { id: 'shelf', siteId: questId, label: 'Sample Shelf', host: 'throwaway', pos: [anchor.position[0] + 9, anchor.topY + 0.6, anchor.position[2] + 9] });
    const eye = new THREE.Vector3(shelf.pos[0], shelf.pos[1] + 0.9, shelf.pos[2] + 2);
    const at = bench.aimedInteraction(eye, new THREE.Vector3(0, -0.1, -1).normalize(), world);
    if (!at || !/TAKE/.test(at.prompt)) fail(`${tag}: [E] aimed at a registered field point offers nothing`);
    const away = bench.aimedInteraction(eye, new THREE.Vector3(1, 0, 0), world);
    if (away && /TAKE/.test(away.prompt)) fail(`${tag}: [E] offers a field point the camera is not pointed at`);
    const near = bench.aimedInteraction(eye.clone().add(new THREE.Vector3(0, 0, 8)), new THREE.Vector3(0, -0.1, -1).normalize(), world);
    if (near && /TAKE/.test(near.prompt)) fail(`${tag}: [E] offers a field point out of reach`);
    let carried = null;
    bench.onCarry = label => { carried = label; };
    bench.onAction = a => { bench.state = MODEL.apply(bench.state, a); bench.setState(bench.state); };
    if (at) at.act();
    if (!carried) fail(`${tag}: taking a field item left nothing in the carry slot`);
    if (!bench.state.pieces.w1.hidden) fail(`${tag}: the carried item is on the table before the player is back at the bench`);
    bench.leaveLean();
    bench.leanIn({ instant: true });
    if (carried) fail(`${tag}: leaning in at the bench left the item in the carry slot`);
    if (bench.state.pieces.w1.hidden) fail(`${tag}: the carried item did not appear on the table back at the bench`);
    else if (!bench.swarms?.get('seal')?.ids.includes('w1')) fail(`${tag}: an instanced kind's piece is not in its instanced body`);
    FP.clearFieldPoints(world);
    try { FP.registerFieldPoint(world, { id: 'free', siteId: questId, label: 'X', pos: [0, 0, 0] }); fail('a field point with no host was accepted'); } catch { /* refused, as it should be */ }
  }
}

/* ------------------------------------------------------------ the real table stages */

/**
 * EVERY REAL TABLE STAGE, LEANED IN, in the world its quest is played in (plan §3.5). The throwaway
 * table above proves the pipeline; this holds what shipped to the same rules:
 *   - at every supported viewport the stage's whole table is inside the free glass, below the HUD and
 *     the prompt strip and above the foot dock, and its smallest piece is 28 px or more across;
 *   - the camera stands in the bay's `approach` or `lean` air;
 *   - every piece's face is painted (the kit's `paintPiece` runs on a real canvas) and the table is
 *     dressed from the host's own materials, never the bench kit's;
 *   - the stage's whole SOLUTION is played through the viewer's own pointer handlers, by drag and by
 *     two taps, and lands on the table the reducer reaches (a field step goes through the world's
 *     registered point, the carry slot and the lean-in);
 *   - a stage that fetches names a point this world registered, and the plate is not drawn there.
 */
{
  console.log('\nthe real table stages, leaned in');
  const MODEL = await import('../src/learn/table/model.js');
  const SNAP = await import('../src/learn/table/snap.js');
  const LAYOUT = await import('../src/learn/table/layout.js');
  const REG = await import('../src/learn/table/kits/registry.js');
  const BAY = await import('../src/three/bench-bay.js');
  const FP = await import('../src/three/field-points.js');
  const { Table3D } = await import('../src/learn/engine/table3d.js');
  const { chromeReserve } = await import('../src/learn/engine/lean.js');
  const { setBenchHost } = await import('../src/learn/engine/bench-host.js');
  const { allQuests } = await import('../src/learn/curriculum.js');
  const WORLD_OF = { unit01: TallowWorld, unit03: LigarWorld, unit02: LanternfallWorld, unit04: BellowsWorld, unit05: EmberReachWorld };
  const worlds = new Map();
  const worldFor = unit => {
    if (!worlds.has(unit)) { const w = new WORLD_OF[unit](null); w.scene.updateMatrixWorld(true); worlds.set(unit, w); }
    return worlds.get(unit);
  };
  const setGlass = (w, h) => { window.innerWidth = w; window.innerHeight = h; };
  const lean = BAY.bayBoxes().lean;
  const approach = BAY.bayBoxes().approach;
  const inBox = (p, b) => p.every((v, i) => v >= b.min[i] - 1e-6 && v <= b.max[i] + 1e-6);
  const sigOf = s => JSON.stringify(MODEL.signature(s));
  let stages = 0;
  let presses = 0;

  for (const q of allQuests().filter(x => x.status === 'live')) {
    const mod = await q.module();
    const tableStages = (mod.STAGES || []).map((s, i) => [s, i]).filter(([s]) => s.widget?.type === 'table');
    if (!tableStages.length) continue;
    const [unit, questId] = q.key.split('/');
    // A BOSS is fought away from any bench: the player stands on open ground, so its tables are built in their own room
    // (the viewer's own scene, the bench kit's own materials) and are held to everything else a table is. A quest with NO
    // WORLD under it (Kettle) builds its own room too, but a NAMED one (`rooms.js`, `mod.ROOM`): its table is dressed from
    // that room's materials, never the bench kit's, and the room itself is held to the host's rules below.
    const boss = q.arena === 'boss';
    const roomId = mod.ROOM || null;
    const standalone = boss || !WORLD_OF[unit];
    const w = standalone ? null : worldFor(unit);
    const anchor = standalone ? null : w.benchAnchor(questId);
    if (!standalone && !anchor) { fail(`${q.key}: plays table stages but its world has no bench anchor`); continue; }
    if (!WORLD_OF[unit] && !roomId) { fail(`${q.key}: has no world to stand in and names no room (export ROOM)`); continue; }
    const mats = anchor?.dormant?.userData?.benchMats || null;
    if (!standalone) w.setBenchDeployed(questId, true);
    const frameOf = camera => (standalone ? null : { scene: w.scene, camera, position: anchor.position, rotationY: anchor.rotationY, topY: anchor.topY, materials: mats, object: w, walkOwnsHeight: true });

    for (const [stage, i] of tableStages) {
      stages++;
      const label = `${q.key} stage ${i + 1}`;
      const before = failures;
      const spec = stage.table;
      const kit = REG.getKit(spec.kit);

      // A stage that sends the player out: where this world registered the point, the player walks to it (the
      // chevron leads there, no plate is drawn or tapped, `[E]` takes it); everywhere else the drawn plate stands in.
      if (standalone && !boss && (spec.fetch || []).length) fail(`${label}: a quest with no walkable world declares a field stage`);
      for (const f of standalone ? [] : spec.fetch || []) {
        const pt = FP.fieldPointById(w, f.id);
        const guides = [];
        setBenchHost({ mount() {}, unmount() {}, guide: wp => guides.push(wp) });
        setGlass(1920, 1080);
        const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 80);
        let st = MODEL.createTable(spec, stage.title);
        const b = new Table3D(null, { world: frameOf(camera), onAction: a => { st = MODEL.apply(st, a); b.setState(st); b.settle(); } });
        b.setState(st);
        b.settleLean();
        camera.updateMatrixWorld(true);
        if (pt) {
          if (b.showsSite(f.id)) fail(`${label}: the world has the point "${f.id}" but the built table still shows its site plate`);
          const lead = guides.filter(Boolean).pop();
          if (!lead || Math.hypot(lead.x - pt.stand[0], lead.z - pt.stand[2]) > 0.01) fail(`${label}: the chevron does not lead to the field point "${f.id}"`);
          // A tap where the plate would be does nothing: the walk is the way.
          const plate = f.at;
          const pl = b.map.toPlate(plate);
          const pr = new THREE.Vector3(pl.x, 0.895, pl.z);
          b.root.localToWorld(pr);
          pr.project(camera);
          const e = { clientX: (pr.x + 1) / 2 * 1920, clientY: (1 - pr.y) / 2 * 1080, pointerId: 99, preventDefault() {} };
          b._onPointerDown(e); b._onPointerUp(e);
          if (Object.values(st.pieces).some(p => p.fetchFrom === f.id && !p.hidden)) fail(`${label}: a tap where the plate would be took the item without the walk`);
          b.takeField(pt);
          if (guides[guides.length - 1] !== null) fail(`${label}: the chevron is still leading once the item is carried`);
          b.flushCarry();
          if (Object.values(st.pieces).some(p => p.fetchFrom === f.id && p.hidden)) fail(`${label}: the carried item did not reach the table`);
        } else if (!b.showsSite(f.id)) {
          fail(`${label}: no field point in this world, yet the built table draws no site plate`);
        }
        b.dispose();
        setBenchHost(null);
      }

      for (const [vpName, vw, vh] of LEAN_VIEWPORTS) {
        setGlass(vw, vh);
        const camera0 = new THREE.PerspectiveCamera(FOV, vw / vh, 0.05, 80);
        const bench = new Table3D(null, { world: frameOf(camera0), onAction: () => {}, room: roomId });
        const camera = standalone ? bench.camera : camera0;
        const state = MODEL.createTable(spec, stage.title);
        try { bench.setState(state); } catch (e) { fail(`${label} @ ${vpName}: building the built table faulted — ${e.stack?.split('\n').slice(0, 3).join(' ')}`); bench.dispose(); continue; }
        bench.settleLean();
        const tag = `${label} leaned in @ ${vpName} (${vw}x${vh})`;
        if (!bench.leaning || !bench.lean?.pose) { fail(`${tag}: the table did not lean in`); bench.dispose(); continue; }
        if (!bench.lean.pose.fits) fail(`${tag}: the used zone does not fit the free glass`);
        const res = chromeReserve(vw, vh);
        const free = { l: -1 + 2 * res.left / vw, r: 1 - 2 * res.right / vw, b: -1 + 2 * res.bottom / vh, t: 1 - 2 * res.top / vh };
        camera.updateMatrixWorld(true);
        const zone = bench.map.zone;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const [x, z] of [[zone.x0, zone.z0], [zone.x1, zone.z0], [zone.x0, zone.z1], [zone.x1, zone.z1]]) {
          const p = new THREE.Vector3(x, 0.895, z);
          bench.root.localToWorld(p);
          p.project(camera);
          minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
        }
        const eps = 0.012;
        if (minX < free.l - eps || maxX > free.r + eps) fail(`${tag}: the table runs out of the free width`);
        if (maxY > free.t + eps) fail(`${tag}: the table runs under the HUD and the prompt strip`);
        if (minY < free.b - eps) fail(`${tag}: the table runs under the foot dock`);

        // The smallest piece, in screen pixels.
        let smallest = Infinity;
        for (const p of Object.values(state.pieces)) {
          // A fixed piece (an atom on a Lewis slate, a joint) is never grabbed: it is a target, found by the reach
          // of the piece dropped on it, so it owes no hit size.
          if (p.hidden || p.fixed) continue;
          const r = REG.radiusOf(kit, p);
          const a = bench.map.toPlate(p.at);
          const b = bench.map.toPlate({ x: p.at.x + r, y: p.at.y });
          const pa = new THREE.Vector3(a.x, 0.895, a.z);
          const pb = new THREE.Vector3(b.x, 0.895, b.z);
          bench.root.localToWorld(pa); bench.root.localToWorld(pb);
          pa.project(camera); pb.project(camera);
          smallest = Math.min(smallest, 2 * Math.hypot((pb.x - pa.x) * vw / 2, (pb.y - pa.y) * vh / 2));
        }
        if (smallest < 28) fail(`${tag}: the smallest piece is ${smallest.toFixed(1)} px across, under 28`);

        const local = bench.root.worldToLocal(camera.position.clone());
        const inBay = [local.x, local.y + (BAY.PLATE_TOP - 0.895), local.z];
        if (!inBox(inBay, lean) && !inBox(inBay, approach)) fail(`${tag}: the camera is outside the approach and lean air`);

        // Every kit-painted piece has a face, and every table is dressed from the host's own materials.
        if (vpName === '16:9') {
          const painted = bench.pieceRoot.children.filter(c => c.userData.ring).length;
          const expect = Object.values(state.pieces).filter(p => !p.hidden && !(p.kind === 'card' || p.token)).length;
          if (painted < expect) fail(`${tag}: ${painted} of ${expect} pieces were built`);
          const offenders = new Set();
          const dress = mats || bench.room?.mats || null;
          for (const root of [bench.fixtureRoot, bench.pieceRoot, bench.joinRoot]) {
            root.traverse(o => {
              if (!o.isMesh) return;
              const m = o.material;
              if (dress && (Object.values(dress).includes(m) || m.userData?.tableOwned)) return;
              offenders.add(m === bench.steelMat || m === bench.darkMat ? 'the bench kit' : (m.type || 'a material'));
            });
          }
          if (roomId && !bench.room) fail(`${tag}: names the room "${roomId}" and was built without it`);
          if (offenders.size && (!boss || roomId)) fail(`${tag}: dressed from ${[...offenders].join(', ')}, not ${roomId ? `the ${roomId} room's` : "the host's"} own materials`);
        }
        bench.dispose();
      }

      // The solution through the real pointer path, by drag and by two taps.
      const script = mod.SOLUTIONS[i];
      setGlass(1920, 1080);
      for (const mode of ['drag', 'tap']) {
        const camera0 = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 80);
        let st = MODEL.createTable(spec, stage.title);
        const b2 = new Table3D(null, { world: frameOf(camera0), onAction: a => { st = MODEL.apply(st, a); b2.setState(st); b2.settle(); }, room: roomId });
        const camera = standalone ? b2.camera : camera0;
        b2.setState(st);
        b2.settleLean();
        camera.updateMatrixWorld(true);
        let id = 40;
        const px = u => {
          const pl = b2.map.toPlate(u);
          const p = new THREE.Vector3(pl.x, 0.895, pl.z);
          b2.root.localToWorld(p);
          p.project(camera);
          return { clientX: (p.x + 1) / 2 * 1920, clientY: (1 - p.y) / 2 * 1080 };
        };
        const ev = u => ({ ...px(u), pointerId: id, preventDefault() {} });
        const down = u => { id++; b2._onPointerDown(ev(u)); if (b2.grabbing) presses++; };
        const move = u => b2._onPointerMove(ev(u));
        const up = u => b2._onPointerUp(ev(u));
        const tap = u => { down(u); up(u); };
        try {
          for (const step of script) {
            const verb = Object.keys(step)[0];
            const arg = step[verb];
            let piece = null, to = null;
            if (verb === 'place' && arg.to !== undefined) { piece = arg.piece ?? st.carry.held; to = arg.to; }
            else if (verb === 'join') { piece = arg[0]; to = `piece:${arg[1]}`; }
            else if (verb === 'predict' && arg) { piece = arg; to = `slot:${st.prediction.slot}`; }
            if (piece) {
              const c = { ...st.pieces[piece].at };
              const p = SNAP.pointFor(st, kit, to, piece);
              if (mode === 'drag') { down(c); move({ x: (c.x + p.x) / 2, y: (c.y + p.y) / 2 }); move(p); up(p); }
              else { tap(c); tap(to.startsWith('piece:') ? { ...st.pieces[to.slice(6)].at } : p); }
            } else if (verb === 'setDial') {
              const lay = LAYOUT.fixtureLayout(st.fixtures[arg.fixture]);
              const t = lay.dials.find(x => x.name === arg.dial);
              const d = st.fixtures[arg.fixture].dials[arg.dial];
              tap({ x: t.x0 + (arg.value - d.min) / (d.max - d.min) * (t.x1 - t.x0), y: t.y });
            } else if (verb === 'run') {
              const r = LAYOUT.fixtureLayout(st.fixtures[typeof arg === 'string' ? arg : arg.fixture]).run;
              tap({ x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 });
            } else if (verb === 'fetch') {
              // Where the world has the point, the player walks to it and presses [E]; here that is the point itself.
              const pt = w ? FP.fieldPointById(w, arg) : null;
              if (pt) { if (!b2.takeField(pt)) fail(`${label}: the world's point "${arg}" took nothing`); b2.flushCarry(); }
              else tap({ ...st.fetch[arg].at });
            } else {
              b2.onAction(step);
            }
          }
        } catch (e) {
          fail(`${label}: playing the solution by ${mode} through the pointer path faulted — ${e.stack?.split('\n').slice(0, 3).join(' ')}`);
          b2.dispose();
          continue;
        }
        const direct = MODEL.runScript(MODEL.createTable(spec, stage.title), script, { mode: 'direct', strict: true });
        if (sigOf(st) !== sigOf(direct)) {
          const a = JSON.parse(sigOf(st));
          const d = JSON.parse(sigOf(direct));
          fail(`${label}: the pointer path by ${mode} does not reach the table the script names (differs in ${Object.keys(d).filter(k => JSON.stringify(a[k]) !== JSON.stringify(d[k])).join(', ')})`);
        }
        const solved = stage.check({ ...mod.stateFor(i, {}), table: st });
        if (!solved.ok) fail(`${label}: after the pointer path by ${mode} the stage does not pass (${solved.msg})`);
        const bad = MODEL.checkInvariants(st);
        if (bad.length) fail(`${label}: the table is unsound after the pointer path by ${mode} — ${bad[0]}`);
        b2.dispose();
      }
      if (failures === before) ok(`${label}: leans in at ${LEAN_VIEWPORTS.length} viewports (whole table in the free glass, pieces 28 px or more, host materials), solved through the real pointer path by drag and by two taps`);
    }
    if (!standalone) w.setBenchDeployed(questId, false);
  }
  if (!stages) fail('no real table stage was found to check');
  else ok(`${stages} real table stage(s) checked on the built table (${presses} presses took hold)`);
}

/* ------------------------------------------------------------ the bosses on their tables */

/**
 * A BOSS'S FIGHT, ON A TABLE (plan §2.6 and the T2b and T2c briefs: the Hopper's five phases, the golem's two). Each phase is a table, and the foe stands in the
 * table's corner pad (`table/layout.js` `FOE_PAD`), watching it. Held here, at every viewport the table is leaned in at:
 *   - one body per foe the stage names, in the pad, and every pose it can take stays inside the pad: the body never leaves its
 *     corner, so it can neither stand in the camera's lean air nor over a zone, a fixture, the strip or a piece;
 *   - the body is in the frame (inside the free glass, under the chrome) wherever the table is;
 *   - nothing on the table stands under it: every zone, fixture and loose piece of the stage is clear of the pad;
 *   - its pose is `planFoe`'s and nothing else (the 2D `Encounter` driven for real: a reaction reads back, a committed miss
 *     lunges, a clear disperses, a replay and a knock-back restore it) and it is a few thousand triangles, no more;
 *   - a press on the pad is a press on the table, never a take of the foe (a foe only observes).
 */
for (const [bossName, bossModule, bossRoom] of [['boss-hopper', 'unit01/boss-hopper.js', null], ['boss-golem', 'unit07/boss-golem.js', 'foundry'], ['boss-warden', 'unit03/boss-warden.js', null]]) {
  console.log(`\n${bossName} on its tables`);
  const MODEL = await import('../src/learn/table/model.js');
  const SNAP = await import('../src/learn/table/snap.js');
  const LAYOUT = await import('../src/learn/table/layout.js');
  const REG = await import('../src/learn/table/kits/registry.js');
  const { Table3D } = await import('../src/learn/engine/table3d.js');
  const { chromeReserve } = await import('../src/learn/engine/lean.js');
  const hop = await import(`../src/learn/quests/${bossModule}`);
  // Every pose the species' planner can answer (`foes.js`): the hopper's and the golem's, and the warden's own.
  const POSES = bossName === 'boss-warden'
    ? [['idle'], ['unmoved'], ['gripped'], ['cleaved'], ['splayed'], ['turned'], ['still'], ['locked'], ['free'], ['dispersed']]
    : [['idle'], ['unmoved'], ['cracked'], ['neutral'], ['balanced'], ['starved'], ['dispersed']];
  const setGlass = (w, h) => { window.innerWidth = w; window.innerHeight = h; };
  const before = failures;
  let fights = 0;

  for (const [i, stage] of hop.STAGES.entries()) {
    const enc = resolveEncounter(stage);
    const label = `${bossName} phase ${i + 1}`;
    if (!enc) { fail(`${label}: declares no encounter`); continue; }
    if (stage.field || (stage.table.fetch || []).length) fail(`${label}: a boss phase declares a field stage (the walk is suspended while it stands)`);
    fights++;
    for (const [vpName, vw, vh] of LEAN_VIEWPORTS) {
      setGlass(vw, vh);
      const tag = `${label} @ ${vpName} (${vw}x${vh})`;
      // The frame runs before the instrument: the encounter has begun when the table stands up.
      const host = { hidden: true, innerHTML: '', className: '', dataset: {}, querySelectorAll: () => [] };
      const encounter = new Encounter(host);
      encounter.begin(enc);
      const bench = new Table3D(null, { onAction: () => {}, room: bossRoom });
      const state = MODEL.createTable(stage.table, stage.title);
      bench.setState(state);
      bench.settleLean();
      const camera = bench.camera;
      camera.updateMatrixWorld(true);
      const layer = bench.foes;
      layer.update(0.05);
      if (layer.bodies.size !== enc.foes.length) { fail(`${tag}: ${enc.foes.length} foes, ${layer.bodies.size} bodies`); bench.dispose(); encounter.dispose(); continue; }

      // The pad, on the plate (viewer frame, metres).
      const pad = LAYOUT.foePadOf(state.bounds);
      const a = bench.map.toPlate({ x: pad.rect.x0, y: pad.rect.y0 });
      const b = bench.map.toPlate({ x: pad.rect.x1, y: pad.rect.y1 });
      const padBox = { x0: a.x, x1: b.x, z0: a.z, z1: b.z };
      const inv = new THREE.Matrix4().copy(bench.root.matrixWorld).invert();

      // Every pose, drawn from planFoe's own pose names.
      const extents = new Map();
      for (const [pose] of POSES) {
        layer.sync(snapshotOf(enc, pose));
        runLayer(layer, pose === 'dispersed' ? 4.2 : 1.2, extents, inv);
      }
      layer.sync(snapshotOf(enc, 'idle'));
      layer.sync({ ...snapshotOf(enc, 'idle'), fight: { ...newFight(), lost: 1 } });
      runLayer(layer, 1.2, extents, inv);
      for (const [body, box] of extents) {
        const eps = 0.02;
        // (a committed miss makes the body lunge a few centimetres toward the player and back.)
        if (box.min.x < padBox.x0 - eps || box.max.x > padBox.x1 + eps || box.min.z < padBox.z0 - eps || box.max.z > padBox.z1 + 0.06) {
          fail(`${tag}: the ${body.species} leaves its corner — x[${box.min.x.toFixed(2)}, ${box.max.x.toFixed(2)}] z[${box.min.z.toFixed(2)}, ${box.max.z.toFixed(2)}] against the pad x[${padBox.x0.toFixed(2)}, ${padBox.x1.toFixed(2)}] z[${padBox.z0.toFixed(2)}, ${padBox.z1.toFixed(2)}]`);
        }
        if (box.min.y < 0.885 || box.max.y > 0.895 + 0.36) fail(`${tag}: the ${body.species} spans y[${box.min.y.toFixed(2)}, ${box.max.y.toFixed(2)}] — the plate is at 0.895`);
      }

      // Nothing stands under it: the table's own furniture and loose pieces are clear of the pad.
      const kit = REG.getKit(state.kit);
      const clear = (name, r) => {
        if (r.x0 < pad.rect.x1 && pad.rect.x0 < r.x1 && r.y0 < pad.rect.y1 && pad.rect.y0 < r.y1) fail(`${tag}: ${name} stands in the foe's corner`);
      };
      for (const z of Object.values(state.zones.trays)) clear(`tray ${z.id}`, SNAP.rectOf(z, SNAP.SIZES.tray));
      for (const z of Object.values(state.zones.slots)) clear(`slot ${z.id}`, SNAP.rectOf(z, SNAP.SIZES.slot));
      for (const z of Object.values(state.zones.containers)) clear(`container ${z.id}`, SNAP.rectOf(z, SNAP.SIZES.container));
      for (const z of Object.values(state.fixtures)) clear(`fixture ${z.id}`, LAYOUT.fixtureLayout(z).box);
      for (const p of Object.values(state.pieces)) { const r = REG.radiusOf(kit, p); clear(`piece ${p.id}`, { x0: p.at.x - r, x1: p.at.x + r, y0: p.at.y - r, y1: p.at.y + r }); }
      clear('the recorder strip', SNAP.rectOf(state.recorder.box, { w: 30, h: 18 }));

      // In the frame: inside the free glass wherever the table is, and under the chrome.
      const res = chromeReserve(vw, vh);
      const free = { l: -1 + 2 * res.left / vw, r: 1 - 2 * res.right / vw, b: -1 + 2 * res.bottom / vh, t: 1 - 2 * res.top / vh };
      layer.sync(snapshotOf(enc, 'idle'));
      runLayer(layer, 0.4, new Map(), inv);
      for (const body of layer.bodies.values()) {
        const nd = ndcBounds(body.group, camera);
        if (!nd) { fail(`${tag}: the ${body.species} has no bounds`); continue; }
        const eps = 0.02;
        if (nd.minX < free.l - eps || nd.maxX > free.r + eps || nd.maxY > free.t + eps || nd.minY < free.b - eps) {
          fail(`${tag}: the ${body.species} is outside the free glass — x[${nd.minX.toFixed(2)}, ${nd.maxX.toFixed(2)}] y[${nd.minY.toFixed(2)}, ${nd.maxY.toFixed(2)}] against x[${free.l.toFixed(2)}, ${free.r.toFixed(2)}] y[${free.b.toFixed(2)}, ${free.t.toFixed(2)}]`);
        }
      }
      for (const body of layer.bodies.values()) {
        const tris = trianglesOf(body.group);
        if (tris > 16000) fail(`${tag}: the ${body.species} draws ${Math.round(tris)} triangles (budget 16000)`);
      }

      // A press on the pad is a press on the table: the foe is not a handle.
      if (vpName === '16:9') {
        const hits = [];
        const grab = bench.gestures.wouldGrab({ x: pad.x, y: pad.y });
        if (grab) fail(`${tag}: a press on the foe's corner takes hold of something`);
      }
      bench.dispose();
      encounter.dispose();
    }

    // The 2D Encounter driven for real, with a body standing on the table.
    {
      setGlass(1920, 1080);
      const host = { hidden: true, innerHTML: '', className: '', dataset: {}, querySelectorAll: () => [] };
      const encounter = new Encounter(host);
      encounter.begin(enc);
      const bench = new Table3D(null, { onAction: () => {}, room: bossRoom });
      bench.setState(MODEL.createTable(stage.table, stage.title));
      const layer = bench.foes;
      layer.update(0.05);
      const tag = `${label} (the fight)`;
      for (const f of enc.foes) {
        for (const pose of bossName === 'boss-warden' ? ['gripped', 'cleaved', 'unmoved'] : ['cracked', 'neutral', 'unmoved']) {
          const probe = { pose };
          const want = planFoe(enc, f, probe);
          encounter.react(f.id, probe);
          layer.update(0.05);
          const body = layer.bodies.get(f.id);
          if (body.pose !== want.pose) fail(`${tag}: planFoe says "${want.pose}" and the body in the scene is in "${body.pose}"`);
        }
      }
      encounter.onMiss();
      for (const b of layer.bodies.values()) if (!(b.lunge > 0.99)) fail(`${tag}: a miss through the Encounter did not make the body lunge`);
      encounter.cancel();
      encounter.onClear();
      layer.update(0.05);
      for (const b of layer.bodies.values()) if (b.pose !== 'dispersed') fail(`${tag}: a clear left the foe in "${b.pose}"`);
      for (let t = 0; t < 5.5; t += 0.05) layer.update(0.05);
      for (const b of layer.bodies.values()) if (b.group.visible) fail(`${tag}: a cleared foe is still standing`);
      encounter.begin(enc);
      layer.update(0.05);
      for (const b of layer.bodies.values()) if (!b.group.visible || b.pose !== 'idle') fail(`${tag}: a replayed phase did not restore its foe (${b.pose})`);
      for (let k = 0; k < 3; k++) encounter.onMiss();
      encounter.cancel();
      encounter.paint();
      layer.update(0.05);
      for (const b of layer.bodies.values()) if (b.pose !== 'idle') fail(`${tag}: a knock-back left the foe in "${b.pose}"`);
      // A new phase on the same table puts the foe in the new board's corner (the table is rebuilt, the foe is not left behind).
      const next = hop.STAGES[(i + 1) % hop.STAGES.length];
      encounter.begin(resolveEncounter(next));
      bench.setState(MODEL.createTable(next.table, next.title));
      layer.update(0.05);
      const to = bench.foeSpots(1)[0];
      for (const b of layer.bodies.values()) {
        if (Math.hypot(b.baseX - to.x, b.baseZ - to.z) > 1e-6) fail(`${tag}: after the phase changed the foe stands at (${b.baseX.toFixed(2)}, ${b.baseZ.toFixed(2)}), not in the new table's corner (${to.x.toFixed(2)}, ${to.z.toFixed(2)})`);
      }
      encounter.dispose();
      layer.update(0.05);
      if (layer.bodies.size) fail(`${tag}: the foes outlived the encounter`);
      bench.dispose();
    }
  }
  if (failures === before) ok(`${bossName}: ${fights} phases fought on tables — the foe stands in the table's corner at ${LEAN_VIEWPORTS.length} viewports, every pose inside the pad and inside the glass, clear of every piece of furniture, read back from planFoe`);
}

/* ------------------------------------------------------------ Kettle's room, from the lean-in view */

/**
 * A ROOM IS HELD TO WHAT A HOST IS (plan `bench-tabletop.md` §2.6). Kettle has no world to stand in, so at T4 its table builds a
 * room of its own (`rooms.js`, the foundry). Measured here, in the bay frame, against the bodies the room builds (its own bench
 * is the one thing exempt, as a host's is):
 *   - none of the bay's clearance volumes holds a body (plate, work, panels, behind, approach, and the camera's `lean` air);
 *   - from the lean-in pose at every viewport no body stands between the camera and the plate (`sight`), and past the plate's
 *     far edge the frame is the room (`view`: a ray grid that reaches a wall, a prop or the floor, never bare sky);
 *   - there is a lamp over the plate: a lens that is the one lit thing in the room, with the light it throws, inside the plate's
 *     footprint and out of the camera's air; no other mesh is emissive;
 *   - the table is dressed from the room's own materials, not the bench kit's (and the check has teeth: with no room the same
 *     table IS dressed from the bench kit);
 *   - the room is a few thousand triangles.
 * And a heap is hundreds of atoms in one draw call: a table with piles of 300 and 200 builds three instanced bodies, not five
 * hundred meshes, every atom lies inside its container and clear of its neighbours, and a pile drawn down shows fewer.
 */
{
  console.log("\nKettle's room, from the lean-in view");
  const before = failures;
  const MODEL = await import('../src/learn/table/model.js');
  const BAY = await import('../src/three/bench-bay.js');
  const { Table3D } = await import('../src/learn/engine/table3d.js');
  const { planLeanIn, PLATE_ZONE } = await import('../src/learn/engine/lean.js');
  const { collectBoxes, findBayIntrusions } = await import('./lib/overlap.mjs');
  const { sightBlockers, behindCover } = await import('./lib/lean-check.mjs');
  const HEAP = await import('../src/learn/table/kits/heap.js');
  const setGlass = (w, h) => { window.innerWidth = w; window.innerHeight = h; };
  setGlass(1920, 1080);
  const lift = BAY.PLATE_TOP - 0.895;

  const room = new Table3D(null, { onAction: () => {}, room: 'foundry' });
  if (!room.room || room.room.id !== 'foundry') fail('a table asked for the foundry room did not build it');
  room.scene.updateMatrixWorld(true);
  const node = new THREE.Group();
  node.position.set(0, 0.895 - BAY.PLATE_TOP, 0);
  node.updateMatrixWorld(true);
  const frame = new THREE.Matrix4().copy(node.matrixWorld).invert();
  const own = room.benchGroup;
  const bodies = collectBoxes(room.scene, { frame, skip: o => o === own });
  if (bodies.length < 20) fail(`the foundry builds only ${bodies.length} bodies round its bench`);
  const hits = findBayIntrusions(room.scene, frame, BAY.bayBoxes(), { skip: o => o === own, bodies });
  for (const h of hits.slice(0, 3)) fail(`the foundry: ${h.body} stands ${h.depth.toFixed(2)} m inside the bay's ${h.volume} volume at (${h.at.join(', ')})`);

  // The leaned-in view at every supported viewport: nothing in the way, and a room behind the plate.
  let rays = 0;
  for (const [name, vw, vh] of LEAN_VIEWPORTS) {
    const pose = planLeanIn({ viewport: { w: vw, h: vh } });
    const cam = [pose.position[0], pose.position[1] + lift, pose.position[2]];
    const sb = sightBlockers(bodies, cam, PLATE_ZONE, BAY.PLATE_TOP);
    if (sb.blocked) fail(`the foundry: ${sb.first.name} stands between the camera and the plate at ${name} (${sb.blocked} of ${sb.total} rays)`);
    const camera = new THREE.PerspectiveCamera(FOV, vw / vh, 0.05, 80);
    camera.position.set(...cam);
    camera.lookAt(pose.target[0], pose.target[1] + lift, pose.target[2]);
    const bc = behindCover({ bodies, camera, plateY: BAY.PLATE_TOP, farZ: -BAY.BENCH_BAY.depth / 2, toWorld: new THREE.Matrix4(), terrain: () => lift, safe: pose.safe });
    rays += bc.total;
    if (bc.covered < bc.total) fail(`the foundry at ${name}: ${bc.total - bc.covered} of ${bc.total} rays past the plate reach no wall, no prop and no floor`);
  }

  // The checks have teeth: a body in the camera's air, a body in the sightline, and a room with no walls and no floor are each found.
  {
    const box = (x0, y0, z0, x1, y1, z1) => ({ box: new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1)), name: 'control', mesh: null });
    const inAir = findBayIntrusions(room.scene, frame, BAY.bayBoxes(), { skip: o => o === own, bodies: [...bodies, box(-0.3, 3.0, 1.2, 0.3, 3.2, 1.4)] });
    if (!inAir.some(h => h.volume === 'lean' && h.body === 'control')) fail('a body in the camera\'s air was not found by the lean volume');
    const pose = planLeanIn({ viewport: { w: 1920, h: 1080 } });
    const cam = [pose.position[0], pose.position[1] + lift, pose.position[2]];
    const mid = [cam[0], (cam[1] + BAY.PLATE_TOP) / 2, (cam[2] + 0) / 2];
    const blocker = box(mid[0] - 0.5, mid[1] - 0.1, mid[2] - 0.3, mid[0] + 0.5, mid[1] + 0.1, mid[2] + 0.3);
    if (sightBlockers([...bodies, blocker], cam, PLATE_ZONE, BAY.PLATE_TOP).blocked === 0) fail('a body between the camera and the plate was not found by the sight rays');
    const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 80);
    camera.position.set(...cam);
    camera.lookAt(pose.target[0], pose.target[1] + lift, pose.target[2]);
    const bare = behindCover({ bodies: [], camera, plateY: BAY.PLATE_TOP, farZ: -BAY.BENCH_BAY.depth / 2, toWorld: new THREE.Matrix4(), terrain: () => -100, safe: pose.safe });
    if (!(bare.total > 0 && bare.covered === 0)) fail(`a room with no walls and no floor still covers ${bare.covered} of ${bare.total} rays`);
  }

  // The lamp over the plate.
  {
    const [lx, ly, lz] = room.room.lamp;
    if (Math.abs(lx) > BAY.BENCH_BAY.width / 2 || Math.abs(lz) > BAY.BENCH_BAY.depth / 2) fail('the foundry lamp does not hang over the plate');
    if (ly < BAY.WORK_TOP - lift + 0.05) fail(`the foundry lamp hangs at ${ly.toFixed(2)} m, inside the bay's work air`);
    const key = room.room.key;
    if (!key || key.isSpotLight !== true || Math.hypot(key.position.x - lx, key.position.z - lz) > 0.3 || key.position.y > ly) fail('the foundry throws its light from somewhere other than its lamp');
    const lit = [];
    room.scene.traverse(o => { if (o.isMesh && o.material && o.material.emissiveIntensity > 0 && o.material.emissive?.getHex() > 0) lit.push(o.name || o.material.type); });
    if (lit.length !== 1 || lit[0] !== 'lamp-lens') fail(`the foundry is lit by ${lit.join(', ') || 'nothing'}, and the one lit thing should be the lamp's own lens`);
    const lights = [];
    room.scene.traverse(o => { if (o.isLight) lights.push(o); });
    if (lights.some(l => l.isPointLight)) fail('the foundry hangs a point light: only the lamp\'s spot lights the plate');
  }

  // Dressed from its own materials; with no room the same table IS the bench kit's.
  {
    const spec = { ...MODEL.createTable(HEAP.heapTable({ pieces: [{ id: 'a', kind: 'atom', label: 'H', at: { x: 20, y: 20 }, props: { el: 'H' } }], zones: { trays: [{ id: 't', label: 'Tray', at: { x: 60, y: 30 } }] }, fixtures: [{ id: 'f', kind: 'tally', label: 'Tally', at: { x: 90, y: 30 }, noRun: true, dials: { n: { min: 0, max: 5, step: 1, value: 0 } } }] }), 'dress') };
    const dressed = viewer => {
      viewer.setState(spec);
      const offenders = new Set();
      for (const root of [viewer.fixtureRoot, viewer.pieceRoot, viewer.joinRoot]) {
        root.traverse(o => {
          if (!o.isMesh) return;
          const m = o.material;
          if (viewer.room && (Object.values(viewer.room.mats).includes(m) || m.userData?.tableOwned)) return;
          if (m.userData?.tableOwned) return;
          offenders.add(m === viewer.steelMat || m === viewer.darkMat ? 'the bench kit' : (m.type || 'a material'));
        });
      }
      return [...offenders];
    };
    const inRoom = dressed(room);
    if (inRoom.length) fail(`a table in the foundry is dressed from ${inRoom.join(', ')}`);
    if (room.mats.top === room.steelMat || room.mats.dark === room.darkMat) fail('the foundry table shares a material with the bench kit');
    const bare = new Table3D(null, { onAction: () => {} });
    if (!dressed(bare).includes('the bench kit')) fail('the room material check cannot tell a bench-kit table from a foundry one');
    bare.dispose();
  }

  if (rays < 100) fail(`only ${rays} rays past the plate were cast across the six aspects, so the foundry's view is not measured`);

  // A room is a few thousand triangles, not tens of thousands.
  {
    const tris = trianglesOf(room.root);
    if (tris > 6000) fail(`the foundry draws ${Math.round(tris)} triangles (budget 6000)`);
  }
  room.dispose();

  // Heaps at hundreds of atoms: one draw call a heap.
  {
    const spec = HEAP.heapTable({
      zones: {
        containers: [
          HEAP.heap('hh', 'Hydrogen heap', 'H', 300, { x: 30, y: 20 }, { w: 44, h: 28 }),
          HEAP.heap('oo', 'Oxygen heap', 'O', 200, { x: 80, y: 20 }, { w: 44, h: 28 }),
          HEAP.product('mm', 'Built', { x: 60, y: 50 }, 150, { w: 44, h: 22 })
        ]
      }
    });
    const viewer = new Table3D(null, { onAction: () => {}, room: 'foundry' });
    let state = MODEL.createTable(spec, 'heaps');
    viewer.setState(state);
    const piles = [...viewer.piles.values()];
    if (piles.length !== 3 || !piles.every(m => m.isInstancedMesh)) fail(`three piles built ${piles.length} bodies (instanced: ${piles.every(m => m.isInstancedMesh)})`);
    let instanced = 0;
    viewer.fixtureRoot.traverse(o => { if (o.isInstancedMesh) instanced++; });
    if (instanced !== 3) fail(`five hundred atoms are ${instanced} instanced bodies, not three`);
    const countOf = id => viewer.piles.get(id).count;
    if (countOf('hh') !== 300 || countOf('oo') !== 200 || countOf('mm') !== 0) fail(`the piles show ${countOf('hh')}, ${countOf('oo')} and ${countOf('mm')} atoms, not 300, 200 and none`);
    // Every atom lies inside its container and clear of its neighbours.
    for (const [id, c] of [['hh', state.zones.containers.hh], ['oo', state.zones.containers.oo]]) {
      const mesh = viewer.piles.get(id);
      const r = viewer.map.toPlate({ x: c.at.x - c.size.w / 2, y: c.at.y - c.size.h / 2 });
      const r2 = viewer.map.toPlate({ x: c.at.x + c.size.w / 2, y: c.at.y + c.size.h / 2 });
      const m = new THREE.Matrix4();
      const pts = [];
      for (let i = 0; i < mesh.count; i++) { mesh.getMatrixAt(i, m); pts.push(new THREE.Vector3().setFromMatrixPosition(m)); }
      if (pts.some(p => p.x < r.x || p.x > r2.x || p.z < r.z || p.z > r2.z)) fail(`pile ${id}: an atom lies outside its container`);
      if (pts.some(p => p.y < 0.895)) fail(`pile ${id}: an atom lies below the plate`);
      let nearest = Infinity;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) nearest = Math.min(nearest, Math.hypot(pts[i].x - pts[j].x, pts[i].z - pts[j].z));
      const radius = (HEAP.pileOf(c).r) * viewer.map.s;
      if (nearest < radius * 1.9) fail(`pile ${id}: two atoms are ${(nearest / radius).toFixed(2)} radii apart`);
    }
    // Drawn down, a heap shows fewer atoms and the others stay where they were.
    const first = new THREE.Matrix4();
    viewer.piles.get('hh').getMatrixAt(5, first);
    state = MODEL.apply(state, { pour: { from: 'hh', to: 'mm', what: 'hydrogen', amount: 120 } });
    viewer.setState(state);
    if (countOf('hh') !== 180 || countOf('mm') !== 120) fail(`after 120 atoms moved the piles show ${countOf('hh')} and ${countOf('mm')}, not 180 and 120`);
    const again = new THREE.Matrix4();
    viewer.piles.get('hh').getMatrixAt(5, again);
    if (!first.equals(again)) fail('a pile drawn down moved the atoms that were left');
    if (trianglesOf(viewer.fixtureRoot) > 20000) fail('five hundred atoms draw more than 20000 triangles');
    viewer.dispose();
  }

  // A spectrum's electrons are one instanced body: a column under every bin of the strip, the electrons that fell shown and the rest not.
  {
    const PESQ = await import('../src/learn/quests/unit02/q7-pes.js');
    const PESK = await import('../src/learn/table/kits/pes.js');
    const viewer = new Table3D(null, { onAction: () => {}, room: 'foundry' });
    let state = MODEL.createTable(PESQ.STAGES[1].table, 'pes');
    viewer.setState(state);
    const mesh = viewer.piles.get('ch');
    if (!mesh || !mesh.isInstancedMesh) fail('the strip of a chamber stands no instanced body');
    else {
      let bodies = 0;
      viewer.fixtureRoot.traverse(o => { if (o.isInstancedMesh) bodies++; });
      if (bodies !== 1) fail(`one strip is ${bodies} instanced bodies, not one`);
      const shown = () => { const m = new THREE.Matrix4(); let n = 0; for (let i = 0; i < mesh.count; i++) { mesh.getMatrixAt(i, m); if (m.elements[0] > 1e-6) n++; } return n; };
      if (shown() !== 0) fail(`an unfired strip shows ${shown()} electrons`);
      state = MODEL.runScript(state, [{ place: { piece: 'b', to: 'slot:ch.spec' } }, { run: 'ch' }], { strict: true });
      viewer.setState(state);
      if (shown() !== 3) fail(`lithium fired shows ${shown()} electrons on the strip, not 3`);
      const m = new THREE.Matrix4();
      const pts = [];
      for (let i = 0; i < mesh.count; i++) { mesh.getMatrixAt(i, m); if (m.elements[0] > 1e-6) pts.push(new THREE.Vector3().setFromMatrixPosition(m)); }
      const f = state.fixtures.ch;
      const a = viewer.map.toPlate({ x: f.at.x - f.size.w / 2, y: f.at.y - f.size.h / 2 });
      const b = viewer.map.toPlate({ x: f.at.x + f.size.w / 2, y: f.at.y + f.size.h / 2 });
      if (pts.some(p => p.x < a.x || p.x > b.x || p.z < a.z || p.z > b.z)) fail('an electron of the strip lies outside its chamber');
      if (pts.some(p => p.y < 0.895)) fail('an electron of the strip lies below the plate');
      let nearest = Infinity;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) nearest = Math.min(nearest, Math.hypot(pts[i].x - pts[j].x, pts[i].z - pts[j].z));
      if (pts.length > 1 && nearest < PESK.chamberPiles(state)[0].r * viewer.map.s * 1.9) fail('two electrons of the strip stand on each other');
    }
    viewer.dispose();
  }

  if (failures === before) ok(`Kettle's foundry holds the bay's volumes clear, has nothing between the camera and the plate and a room behind it at ${LEAN_VIEWPORTS.length} viewports (${rays} rays), one lit lamp over the plate, a table dressed from its own materials; a heap of hundreds is one instanced body, and so is a spectrum's strip`);
}

console.log(`\n${failures === 0 ? 'BENCHES OK' : failures + ' PROBLEM(S) FOUND'}`);
process.exit(failures === 0 ? 0 : 1);
