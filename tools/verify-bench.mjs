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

      // Everything the instrument STANDS on the plate: a screen head, a board
      // and its stays, a hopper on its legs. Whatever it is, it must not come
      // down inside the bench's own clutter.
      const heads = [];
      const standing = bench.viewer.stations.length
        ? bench.viewer.stations.map(st => st.head).filter(Boolean)
        : bench.viewer.framedNodes().map(n => n.group);
      for (const node of standing) {
        node.traverse(o => {
          if (!o.isMesh || o.material?.visible === false) return;
          const b = localBox(o, inv);
          if (b && b.max.y > 0.905) heads.push(b);
        });
      }

      const seen = new Set();
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
           "inside" it. So a field is measured one piece at a time. */
        const bodies = o.isInstancedMesh ? instanceBoxes(o, inv) : [localBox(o, inv)];
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

check('q4-ledger', 'ledger bench',
  (camera, anchor) => new CoreBench3D(null, { world: worldFrame(camera, anchor) }),
  // Four sealed samples is the widest stage q4-ledger declares.
  bench => bench.setSpecimens([
    { id: 'a', label: 'SAMPLE A', note: '', core: { marked: 12, blank: 12 }, rings: [2, 8, 2] },
    { id: 'b', label: 'SAMPLE B', note: '', core: { marked: 12, blank: 14 }, rings: [2, 8, 2] },
    { id: 'c', label: 'SAMPLE C', note: '', core: { marked: 12, blank: 12 }, rings: [2, 8] },
    { id: 'd', label: 'SAMPLE D', note: '', core: { marked: 13, blank: 14 }, rings: [2, 8, 3] }
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

if (!failures) {
  ok(`all five instruments frame every body and control at ${ASPECTS.length} aspects`);
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
}

stagePasses();

/* ================================================================ LIGAR

   The four Unit 2 benches, deployed onto the built Ligar and measured by the
   same `check` that measures Tallow's five. Each is fed the WIDEST stage its
   quest actually declares — read out of the quest's own table, not typed here —
   because the widest stage is the one that runs off the glass first. */

world = new LigarWorld(null);
world.scene.updateMatrixWorld(true);
console.log('');
checkFacing();

const { STAGES: JOIN_STAGES } = await import('../src/learn/quests/unit02/q1-joins.js');
const { STAGES: SLAB_STAGES } = await import('../src/learn/quests/unit02/q2-lattice.js');
const { STAGES: RECIPE_STAGES, KINDS: RECIPE_KINDS } = await import('../src/learn/quests/unit02/q3-recipe.js');
const { STAGES: WEIGH_STAGES } = await import('../src/learn/quests/unit02/q4-weigh.js');
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
check('q3-recipe', 'sampler scope (Ligar)',
  (camera, anchor) => new SampleScope3D(null, {
    kinds: RECIPE_KINDS, onPower: () => {}, world: worldFrame(camera, anchor)
  }),
  bench => bench.setSamples(widest(RECIPE_STAGES, 'samples').samples)
);
check('q4-weigh', 'assay floor (Ligar)',
  (camera, anchor) => new AssayFloor3D(null, { world: worldFrame(camera, anchor) }),
  bench => bench.setHoppers(widest(WEIGH_STAGES, 'hoppers').hoppers)
);
if (failures === before) {
  ok(`all four Ligar instruments frame every body and control at ${ASPECTS.length} aspects`);
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

console.log(`\n${failures === 0 ? 'BENCHES OK' : failures + ' PROBLEM(S) FOUND'}`);
process.exit(failures === 0 ? 0 : 1);
