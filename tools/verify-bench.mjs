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
const { SampleScope3D } = await import('../src/learn/engine/scope3d.js');
const { CoreBench3D } = await import('../src/learn/engine/corebench3d.js');
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

const world = new TallowWorld(null);
world.scene.updateMatrixWorld(true);

/* ---------------------------------------------------------------- facing */

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
if (!failures) ok(`${world.data.sites.length} sites all face the ground the player walks in from`);

/* --------------------------------------------------------------- framing */

const corner = new THREE.Vector3();
const box = new THREE.Box3();

/** How far two bodies may share space before it counts: a bounding box is a
    loose fit around a rotated body, the same reasoning as `verify:tallow`. */
const TOUCH = 0.006;

const shrunk = (b, t) => new THREE.Box3(
  b.min.clone().addScalar(t), b.max.clone().subScalar(t));

/** AABB of an object's meshes, expressed in the frame `inv` inverts into. */
function localBox(obj, inv) {
  const b = new THREE.Box3();
  const v = new THREE.Vector3();
  const m = new THREE.Matrix4();
  obj.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const g = o.geometry.boundingBox;
    m.multiplyMatrices(inv, o.matrixWorld);
    for (const x of [g.min.x, g.max.x]) {
      for (const y of [g.min.y, g.max.y]) {
        for (const z of [g.min.z, g.max.z]) b.expandByPoint(v.set(x, y, z).applyMatrix4(m));
      }
    }
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

/** Deploy one quest's instrument and measure everything it puts on the plate. */
function check(questId, label, build, widest) {
  const anchor = world.benchAnchor(questId);
  if (!anchor) { fail(`${questId}: the world reports no bench`); return; }

  // The anchor frame the frame's panels are expressed in (createBenchAnchor).
  const anchorNode = new THREE.Group();
  anchorNode.position.set(anchor.position[0], anchor.topY - 0.895, anchor.position[2]);
  anchorNode.rotation.y = anchor.rotationY;
  anchorNode.updateMatrixWorld(true);

  for (const [aspectName, aspect] of ASPECTS) {
    const camera = new THREE.PerspectiveCamera(FOV, aspect, 0.05, 80);
    const bench = build(camera, anchor);
    widest(bench);
    camera.updateMatrixWorld(true);

    const tag = `${label} @ ${aspectName}`;

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

    // 3. Every station the instrument laid out is in the frame.
    const stations = bench.viewer.stations || [];
    if (!stations.length) fail(`${tag}: the instrument laid out no stations`);
    stations.forEach((st, i) => {
      const b = ndcBounds(st.group, camera);
      if (!b) return;
      const cx = (b.minX + b.maxX) / 2;
      const cy = (b.minY + b.maxY) / 2;
      if (Math.abs(cx) > 0.95 || Math.abs(cy) > 0.95) {
        fail(`${tag}: station ${i + 1} sits at (${cx.toFixed(2)}, ${cy.toFixed(2)}) — outside the frame`);
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

    for (const st of bench.viewer.stations) {
      const b = ndcBounds(st.screen.mesh, camera);
      if (!b) continue;
      if (b.maxY > chromeNdc + 0.02) {
        fail(`${tag}: a station screen still runs under the frame — top at ${b.maxY.toFixed(2)}, chrome at ${chromeNdc.toFixed(2)}`);
      }
      if (b.minY < -0.99 || b.minX < -0.99 || b.maxX > 0.99) {
        fail(`${tag}: a station screen hangs off the glass — x[${b.minX.toFixed(2)}, ${b.maxX.toFixed(2)}] y[${b.minY.toFixed(2)}, ${b.maxY.toFixed(2)}]`);
      }
    }
    // The wells stay in view too: the crate is what the player reaches for.
    bench.viewer.stations.forEach((st, i) => {
      const b = ndcBounds(st.tray, camera);
      if (!b) return;
      if (b.minY < -0.99) {
        fail(`${tag}: station ${i + 1} has been aimed off the bottom of the glass (${b.minY.toFixed(2)})`);
      }
    });

    // 5. The power dial, where the instrument carries one, is reachable in view.
    if (bench.dial) {
      const b = ndcBounds(bench.dial.group, camera);
      if (b && (b.minX < -0.98 || b.maxX > 0.98 || b.minY < -0.98 || b.maxY > 0.98)) {
        fail(`${tag}: the power dial is off the glass — x[${b.minX.toFixed(2)}, ${b.maxX.toFixed(2)}] y[${b.minY.toFixed(2)}, ${b.maxY.toFixed(2)}]`);
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

      const heads = [];
      for (const st of bench.viewer.stations) {
        if (!st.head) continue;
        st.head.traverse(o => {
          if (!o.isMesh) return;
          const b = localBox(o, inv);
          if (b) heads.push(b);
        });
      }

      const seen = new Set();
      world.scene.traverse(o => {
        if (!o.isMesh || own.has(o) || !o.geometry) return;
        const b = localBox(o, inv);
        if (!b) return;
        // At or below the plate the instrument is standing on: a stand foot is
        // seated there on purpose, and the plate is what it is seated in.
        if (b.max.y <= 0.905) return;
        // Ambient bodies — the sky dome, the horizon, the celestial vista.
        if (b.getSize(new THREE.Vector3()).length() > 50) return;
        for (const h of heads) {
          if (!shrunk(h, TOUCH).intersectsBox(shrunk(b, TOUCH))) continue;
          const c = b.getCenter(new THREE.Vector3());
          const key = `${c.x.toFixed(2)}|${c.y.toFixed(2)}|${c.z.toFixed(2)}`;
          if (seen.has(key)) return;
          seen.add(key);
          fail(`${tag}: a station stand is inside world geometry at bench-local ` +
            `(${c.x.toFixed(2)}, ${c.y.toFixed(2)}, ${c.z.toFixed(2)})`);
          return;
        }
      });
    }

    bench.dispose?.();
  }
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

if (!failures) {
  ok(`both instruments frame every screen, station and control at ${ASPECTS.length} aspects`);
}

console.log(`\n${failures === 0 ? 'BENCHES OK' : failures + ' PROBLEM(S) FOUND'}`);
process.exit(failures === 0 ? 0 : 1);
