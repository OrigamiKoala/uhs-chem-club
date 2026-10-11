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
      for (const node of standing) {
        node.traverse(o => {
          if (!o.isMesh || o.material?.visible === false) return;
          const b = localBox(o, inv);
          if (b && b.max.y > 0.905) heads.push(b);
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

/* The widest stage q4-ledger declares is read out of its own table: stage 8
   lays four samples beside a standard, FIVE stations end to end, which leaves
   no plate beside them for a key panel. That is the case the front rail is
   for, so it is the case measured. */
const { STAGES: LEDGER_STAGES } = await import('../src/learn/quests/unit01/q4-ledger.js');
check('q4-ledger', 'ledger bench',
  (camera, anchor) => new CoreBench3D(null, { world: worldFrame(camera, anchor) }),
  bench => bench.setSpecimens(LEDGER_STAGES.reduce((a, b) =>
    ((b.specimens?.length || 0) > (a.specimens?.length || 0) ? b : a)).specimens)
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

const { STAGES: CAT_STAGES, CARDS } = await import('../src/learn/quests/unit01/q3-catalogue.js');
const { STAGES: ASSAY_STAGES } = await import('../src/learn/quests/unit01/q5-assay.js');
const { STAGES: WEIGH_STAGES } = await import('../src/learn/quests/unit01/q6-weigh.js');
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

const { STAGES: JOIN_STAGES } = await import('../src/learn/quests/unit03/q1-joins.js');
const { STAGES: SLAB_STAGES } = await import('../src/learn/quests/unit03/q2-lattice.js');
const { planJoin } = await import('../src/learn/engine/joinbench.js');

const widest = (stages, key) => stages.reduce((a, b) => ((b[key]?.length || 0) > (a[key]?.length || 0) ? b : a));

const before = failures;
check('q1-joins', 'join bench (pairs)',
  (camera, anchor) => new JoinBench3D(null, { world: worldFrame(camera, anchor) }),
  bench => bench.setPlates(widest(JOIN_STAGES, 'pairs').pairs)
);
check('q2-lattice', 'join bench (blocks)',
  (camera, anchor) => new JoinBench3D(null, { world: worldFrame(camera, anchor) }),
  bench => bench.setPlates(widest(SLAB_STAGES, 'slabs').slabs)
);
if (failures === before) {
  ok(`both Ligar instruments frame every body and control at ${ASPECTS.length} aspects`);
}

/* THE JOIN BENCH, EVERY STAGE, THROUGH THE REAL POINTER PATH.

   The built join bench is a subclass of the drawn one, so its tools are the
   drawn bench's tools — but what it DRAWS and what a press on it RESOLVES are
   new, and those are the two things a player would notice. So every stage both
   quests declare is put on the built bench, and on each plate:
     - a press closes the jaws exactly when `planJoin` says the pair holds;
     - a press on each piece IN THE PICTURE, projected from the screen the way
       a finger arrives, reads back that plate and that piece, never its
       neighbour and never nothing;
     - a block struck, heated, cooled and tested shows the state it reports.
*/
async function joinStagePasses() {
  // A probe starts the bench's read sweep on the animation clock. Node has no
  // frames to give it, and none are needed: the report a probe makes is
  // synchronous, which is the thing being measured.
  globalThis.requestAnimationFrame ??= () => 0;
  globalThis.cancelAnimationFrame ??= () => {};
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 80);
  const screenPoint = (station, px, py) => {
    // Screen pixels back to a point on the screen mesh: the inverse of
    // `screenUnderRay`, so a press lands where the picture put the piece.
    const mesh = station.screen.mesh;
    mesh.updateMatrixWorld(true);
    const size = mesh.geometry.parameters;
    const local = new THREE.Vector3(
      (px / station.screen.w - 0.5) * size.width,
      (0.5 - py / station.screen.h) * size.height,
      0
    );
    return local.applyMatrix4(mesh.matrixWorld);
  };
  const pressAt = (bench, p) => {
    const q = p.clone().project(camera);
    bench.onPointer3D({ clientX: (q.x + 1) / 2 * 1280, clientY: (1 - q.y) / 2 * 720, preventDefault() {} });
  };

  for (const [questId, stages, key] of [['q1-joins', JOIN_STAGES, 'pairs'], ['q2-lattice', SLAB_STAGES, 'slabs']]) {
    const anchor = world.benchAnchor(questId);
    world.setBenchDeployed(questId, true);
    let probed = null;
    const bench = new JoinBench3D(null, {
      world: worldFrame(camera, anchor),
      onProbe: hit => { probed = hit; }
    });
    let plates = 0;
    for (let i = 0; i < stages.length; i++) {
      bench.setPlates(stages[i][key]);
      // Aim as the deployed bench does, so the screens are where a player sees them.
      bench.viewer.applyCamera();
      camera.updateMatrixWorld(true);
      for (const rec of bench.stations) {
        plates++;
        const item = rec.item;
        const where = `${questId} stage ${i + 1} ${item.label}`;
        if (!rec.hits?.length) fail(`${where}: the picture drew nothing a press could read`);
        for (const hit of rec.hits || []) {
          probed = null;
          pressAt(bench, screenPoint(rec.station, hit.x, hit.y));
          if (!probed) fail(`${where}: a press on the ${hit.side} piece read nothing`);
          else if (probed.plateId !== item.id || probed.side !== hit.side) {
            fail(`${where}: a press on the ${hit.side} piece read ${probed.plateId}/${probed.side}`);
          }
        }
        if (rec.kind === 'pair') {
          const type = planJoin(item).type;
          item.t = 1; item.pressed = type !== 'none';
          if (type === 'none') item.t = 0;
          bench.drawAll();
          const gap = rec.sides.right.jaw.position.x - rec.sides.left.jaw.position.x;
          const shut = gap < 0.26;
          if (shut !== (type !== 'none')) {
            fail(`${where}: the jaws are ${shut ? 'shut' : 'open'} on a pair that ${type === 'none' ? 'will not hold' : 'holds'}`);
          }
        } else {
          for (const state of ['struck', 'molten']) {
            item.state = state;
            if (state === 'struck') item.struck = true;
            bench.drawAll();
            const glowing = rec.stoneMat.emissiveIntensity > 0;
            if (glowing !== (state === 'molten')) fail(`${where}: the block glows when ${state}`);
            const whole = rec.halves.every(h => h.visible);
            const chips = rec.chips.some(c => c.visible);
            if (state === 'struck' && item.build === 'clusters' && (whole || !chips)) {
              fail(`${where}: a block that crumbled is not shown crumbled`);
            }
            if (state === 'struck' && item.build === 'web' && !whole) {
              fail(`${where}: a block that held is shown broken`);
            }
          }
          item.current = true; bench.drawAll();
          if (rec.lampMat.emissiveIntensity <= 0) fail(`${where}: a current passed and the lamp stayed dark`);
          item.current = null; item.state = 'intact'; item.struck = false; bench.drawAll();
        }
      }
    }
    bench.dispose();
    world.setBenchDeployed(questId, false);
    ok(`${questId}: all ${stages.length} stages built, ${plates} plates pressed through the real pointer path`);
  }
}
await joinStagePasses();

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
for (const id of ['q3-distance', 'q4-dots', 'q5-resonance', 'q6-shape', 'q7-polarity', 'q8-hybrid', 'q9-orbitals']) {
  LG[id] = await import(`../src/learn/quests/unit03/${id}.js`);
}

function layLigar(bench, st) {
  if (bench instanceof BondBench3D) bench.setPlates(st.rigs, { settings: st.settings || [], setting: st.start || 1 });
  else if (bench instanceof PairBoard3D) bench.setPlates(st.rigs, { hands: ['bond', 'lone', 'x'] });
  else if (bench instanceof DomainRig3D) bench.setPlates(st.rigs, {});
  else bench.setPlates(st.rigs, { show: { counts: Boolean(st.counts) }, hand: null });
}

const LG_BENCHES = [
  ['q3-distance', 'bond bench', (c, a) => new BondBench3D(null, { world: worldFrame(c, a) })],
  ['q4-dots', 'pair board', (c, a) => new PairBoard3D(null, { world: worldFrame(c, a) })],
  ['q5-resonance', 'pair board (resonance)', (c, a) => new PairBoard3D(null, { world: worldFrame(c, a) })],
  ['q6-shape', 'domain rig (shape)', (c, a) => new DomainRig3D(null, { world: worldFrame(c, a) })],
  ['q7-polarity', 'domain rig (field)', (c, a) => new DomainRig3D(null, { world: worldFrame(c, a) })],
  ['q8-hybrid', 'domain rig (mixer)', (c, a) => new DomainRig3D(null, { world: worldFrame(c, a) })],
  ['q9-orbitals', 'box rack (molecular)', (c, a) => new LigarRack3D(null, { world: worldFrame(c, a) })]
];

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
  if (failures === mark) ok(`all seven later Ligar instruments frame every body and control at ${ASPECTS.length} aspects`);
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
for (const id of ['q1-wave', 'q2-photon', 'q3-lines', 'q4-cloud', 'q5-numbers', 'q6-filling', 'q7-pes', 'q8-trends', 'q9-absorb']) {
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

const stagesOf = id => LF[id].STAGES;
const widestStage = id => stagesOf(id).reduce((a, b) => (itemsOf(b).length > itemsOf(a).length ? b : a));
const dialStage = id => stagesOf(id).reduce((a, b) => {
  const dials = st => (st.settings ? 1 : 0) + (st.brightnessDial ? 1 : 0);
  return dials(b) > dials(a) ? b : a;
});

const LF_BENCHES = [
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

{
  const mark = failures;
  for (const [id, label, build] of LF_BENCHES) {
    check(id, label, build, bench => lay(bench, widestStage(id)));
    if (dialStage(id) !== widestStage(id) && (dialStage(id).settings || dialStage(id).brightnessDial)) {
      check(id, `${label}, dial stage`, build, bench => lay(bench, dialStage(id)));
    }
  }
  if (failures === mark) ok(`all nine Lanternfall instruments frame every body and control at ${ASPECTS.length} aspects`);
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
     - the budget: a husk is a few thousand triangles, a moth a few more. */

const { resolveEncounter, planFoe, newFight } = await import('../src/learn/engine/foes.js');
const { Encounter } = await import('../src/learn/engine/encounter.js');
const { WELL_R: FOE_WELL_R } = await import('../src/learn/engine/foebody.js');

const HUSK_POSES = [
  ['idle'], ['unmoved'], ['split'], ['scattered'], ['layered', { layers: 2 }],
  ['layered', { layers: 4 }], ['even'], ['dispersed']
];
const CRAWLER_POSES = [
  ['idle'], ['unmoved'], ['rest', { stretch: 1 }], ['stretched', { stretch: 2.1 }], ['squeezed', { stretch: 0.55 }],
  ['parted'], ['plated', { sealed: 1, of: 4 }], ['plated', { sealed: 4, of: 4 }], ['held'], ['lost'], ['dispersed']
];
const WARDEN_POSES = [
  ['idle'], ['unmoved'], ['cleaved'], ['conductive'], ['splayed', { arms: 6 }], ['splayed', { arms: 2 }],
  ['turned'], ['still'], ['locked'], ['free'], ['dispersed']
];
const MOTH_POSES = [
  ['idle'], ['shedding', { dots: 1, speed: 2 }], ['shedding', { dots: 5, speed: 12 }], ['still'], ['dispersed']
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
 * @param {{ questId, label, build, lay, items, env, select }} cfg
 */
function foeStage(cfg, stage, stageNo, aspects) {
  const { questId, label } = cfg;
  const anchor = world.benchAnchor(questId);
  const enc = resolveEncounter(stage, cfg.env);
  if (!enc) return null;
  world.setBenchDeployed(questId, true);
  const species = enc.species;
  const table = species === 'salt husk' ? HUSK_POSES : species === 'slag crawler' ? CRAWLER_POSES : species === 'basalt warden' ? WARDEN_POSES : MOTH_POSES;

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
      const cap = species === 'salt husk' ? 14000 : 16000;
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
  const enc = resolveEncounter(stage, cfg.env);
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
  // LANTERNFALL: the lamp moths on the photocell. (`world` is still Lanternfall.)
  const { STAGES: PHOTON_STAGES } = LF['q2-photon'];
  await foePasses({
    questId: 'q2-photon', label: 'photocell',
    build: (camera, anchor) => new LightBench3D(null, { world: worldFrame(camera, anchor) }),
    lay: (bench, st) => lay(bench, st),
    items: itemsOf, env: {}, select: false
  }, PHOTON_STAGES, (st, enc) => enc
    ? enc.foes.flatMap(f => [[f.id, { nm: 430, brightness: 3 }], [f.id, { nm: 700, brightness: 5 }]])
    : []);

  // TALLOW: the salt husks on the sampler scope.
  world = new TallowWorld(null);
  world.scene.updateMatrixWorld(true);
  const { STAGES: GRAIN_STAGES, KINDS: GRAIN_KINDS } = await import('../src/learn/quests/unit01/q1-grain.js');
  await foePasses({
    questId: 'q1-grain', label: 'sampler scope',
    build: (camera, anchor, onSelect) => {
      const scope = new SampleScope3D(null, {
        kinds: GRAIN_KINDS, onPower: () => {}, onSelect, world: worldFrame(camera, anchor)
      });
      scope.setSelectable(true);
      return scope;
    },
    lay: (bench, st) => bench.setSamples(st.samples),
    items: st => st.samples || [], env: { kinds: GRAIN_KINDS }, select: true
  }, GRAIN_STAGES, (st, enc) => enc
    ? enc.foes.flatMap(f => [[f.id, { tool: 'cut' }], [f.id, { tool: 'settle' }]])
    : []);

  // LIGAR: slag crawlers on the bond bench, the pair board and the molecular rack,
  // and basalt wardens on the domain rig. (`world` becomes Ligar.)
  world = new LigarWorld(null);
  world.scene.updateMatrixWorld(true);
  const ligarCfg = (questId, label, build) => ({
    questId, label, build: (camera, anchor) => build(camera, anchor),
    lay: (bench, st) => layLigar(bench, st), items: st => st.rigs || [], env: {}, select: false
  });
  const crawlerProbes = {
    'q3-distance': (st, enc) => enc ? enc.foes.flatMap(f => {
      const rig = st.rigs.find(r => r.id === f.id);
      return [[f.id, { kind: 'curve', pair: rig.pair, r: st.settings[0] }], [f.id, { kind: 'curve', pair: rig.pair, r: st.settings[st.settings.length - 1] }]];
    }) : [],
    'q4-dots': (st, enc) => enc ? enc.foes.flatMap(f => [[f.id, { kind: 'lamps', lit: 1, of: 3 }], [f.id, { kind: 'lamps', lit: 3, of: 3 }]]) : [],
    'q5-resonance': (st, enc) => enc ? enc.foes.flatMap(f => [[f.id, { kind: 'lamps', lit: 2, of: 3 }], [f.id, { kind: 'charges', zero: 1, of: 3 }]]) : [],
    'q9-orbitals': (st, enc) => enc ? enc.foes.flatMap(f => [[f.id, { kind: 'order', order: 2, placed: 6 }], [f.id, { kind: 'order', order: 0, placed: 4 }]]) : []
  };
  await foePasses(ligarCfg('q3-distance', 'bond bench', (c, a) => new BondBench3D(null, { world: worldFrame(c, a) })), LG['q3-distance'].STAGES, crawlerProbes['q3-distance']);
  await foePasses(ligarCfg('q4-dots', 'pair board', (c, a) => new PairBoard3D(null, { world: worldFrame(c, a) })), LG['q4-dots'].STAGES, crawlerProbes['q4-dots']);
  await foePasses(ligarCfg('q5-resonance', 'pair board (resonance)', (c, a) => new PairBoard3D(null, { world: worldFrame(c, a) })), LG['q5-resonance'].STAGES, crawlerProbes['q5-resonance']);
  await foePasses(ligarCfg('q9-orbitals', 'molecular rack', (c, a) => new LigarRack3D(null, { world: worldFrame(c, a) })), LG['q9-orbitals'].STAGES, crawlerProbes['q9-orbitals']);
  for (const [id, label] of [['q6-shape', 'domain rig (shape)'], ['q7-polarity', 'domain rig (field)'], ['q8-hybrid', 'domain rig (mixer)']]) {
    await foePasses(ligarCfg(id, label, (c, a) => new DomainRig3D(null, { world: worldFrame(c, a) })), LG[id].STAGES,
      (st, enc) => enc ? enc.foes.flatMap(f => {
        const rig = st.rigs.find(r => r.id === f.id);
        if (rig.head === 'field') return [[f.id, { rig: 'field', mol: rig.mol, on: true }]];
        if (rig.head === 'twist') return [[f.id, { rig: 'twist', bond: rig.bond }]];
        if (rig.head === 'mixer') return [[f.id, { rig: 'mix', p: 3 }]];
        return [[f.id, { rig: 'arms', arms: [{ kind: 'atom', sym: 'H' }, { kind: 'atom', sym: 'H' }, { kind: 'lone' }] }]];
      }) : []);
  }
}
console.log(`\n${failures === 0 ? 'BENCHES OK' : failures + ' PROBLEM(S) FOUND'}`);
process.exit(failures === 0 ? 0 : 1);
