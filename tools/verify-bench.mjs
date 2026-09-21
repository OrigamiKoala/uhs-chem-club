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
const { CatalogueBoard3D } = await import('../src/learn/engine/catalogue3d.js');
const { AssayFloor3D } = await import('../src/learn/engine/assay3d.js');
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
          const hc = h.getCenter(new THREE.Vector3());
          fail(`${tag}: the instrument stands inside world geometry — its body at ` +
            `(${hc.x.toFixed(2)}, ${hc.y.toFixed(2)}, ${hc.z.toFixed(2)}) ` +
            `meets a fitting at (${c.x.toFixed(2)}, ${c.y.toFixed(2)}, ${c.z.toFixed(2)})`);
          return;
        }
      });
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

    // Filing a loose card really moves it, and lifting it really puts it back.
    const loose = (st.drawer || [])[0];
    if (loose && want.length) {
      board.held = loose;
      board.layout();
      board.placed[want[0]] = loose;
      board.drawer = board.drawer.filter(x => x !== loose);
      board.held = null;
      board.layout();
      if (board.placements()[want[0]] !== loose) {
        fail(`q3-catalogue stage ${i + 1}: a filed card is not reported as filed`);
      }
      if (!board.slots.get(want[0]).card) {
        fail(`q3-catalogue stage ${i + 1}: a filed card has no body on the board`);
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

console.log(`\n${failures === 0 ? 'BENCHES OK' : failures + ' PROBLEM(S) FOUND'}`);
process.exit(failures === 0 ? 0 : 1);
