/**
 * console.js — The Charge Gardens stage deck, as the dashboard it is read from.
 *
 * WHAT CHANGES, AND WHAT DOES NOT
 * At T4 the containment chamber is not a picture on a page: the player walked
 * across Erebus, pressed [E] at a pylon, and the chamber deployed. The prompt,
 * the scan readout, the hint ladder and the Submit key belong on the station
 * they are standing at, not on a card laid over the view.
 *
 * So the finished nodes are MOVED — never rebuilt, never re-authored. Every
 * string, every class, every id and every listener `quest.js` attached goes
 * along with them, which is the only way a change this large can be made without
 * a single word of copy shifting. `quest.js` keeps finding `#stage-card` and
 * `#grade-btn` through its `q()` helper, which looks past the container.
 *
 * ONE DASHBOARD, NOT THREE MONITORS
 * This used to raise three screens — a deck low and centre, and two plates
 * angled in from the left and right at eye height. Standing in the chamber that
 * is a cockpit of glass with the sample somewhere behind it: the two flanking
 * plates sat exactly where the molecule is, and the thing the stage is asking
 * you to look at was the thing you could not see. So there is now ONE surface,
 * and it is a CONSOLE rather than a screen — a raked fascia across the bottom of
 * the view with toggle banks, indicator lamps and rotaries cut into its cheeks,
 * the way a control desk is built. It is fitted to the glass every frame and
 * held under a quarter of the view's height, so three quarters of what the
 * player is looking through is always the chamber.
 *
 * WHY THE CONSOLE IS PARENTED TO THE CAMERA
 * The chamber's controls orbit the sample: dragging rotates the view so a
 * blocked path can be solved by looking at it from another side. Bolting the
 * desk to the room would swing it out of sight every time the player did the one
 * thing the stage is asking them to do. Parenting it to the camera says the
 * other thing instead — and it is the true one. The operator is standing at a
 * fixed station and the containment field is turning the sample in front of
 * them, which is exactly what a containment field is for.
 *
 * Tier: T4 only. At T3 and below the player never left the page, so the deck
 * stays the deck and not one pixel of the campaign path changes.
 */

import * as THREE from 'three';
import { tierAtLeast } from '../three/tier.js';
import { WorldPanel } from '../three/world-ui.js';
import { boltLine, placard } from '../three/materials/pbr-kit.js';

/**
 * The fascia, authored in CSS pixels.
 *
 * Deliberately a wide, shallow strip: a dashboard is a band you read across, not
 * a page you read down. The physical width is computed per frame from the
 * camera, so these are a shape and not a size.
 */
const DASH_PX = { w: 1560, h: 260 };

/** How far in front of the operator the desk stands, in chamber units. */
const DASH_DIST = 2.15;

/** The rake of the fascia. A console leans back; a monitor stands up. */
const DASH_RAKE = -0.42;

/**
 * The ceiling the user set, and the reason this file exists in this shape:
 * the console may never cover more than a quarter of the height of the glass.
 */
const MAX_VIEW_FRACTION = 0.25;

/** Never let the desk run right to the edges — a fascia has cheeks. */
const MAX_WIDTH_FRACTION = 0.94;

/**
 * The narrowest glass this console is worth raising on.
 *
 * The fascia is authored 1560 CSS px wide and is scaled to fit the view, so on
 * a narrow window one CSS pixel lands on a fraction of a device pixel and the
 * prompt becomes unreadable. Below this the quest keeps the 2D stage deck it
 * has always had, which is the interface `mobile-quest.css` was written for —
 * a bottom sheet with 44 px touch strips. A diegetic desk nobody can read is
 * worse than an honest card.
 */
const MIN_GLASS_PX = 900;

/**
 * The desk: a raked fascia with the screen let into it, switchgear down both
 * cheeks, a lamp row along the head and a hand rail along the front edge.
 *
 * BUILT AT UNIT WIDTH. The console is re-fitted to the glass whenever the
 * window changes, so its physical size is not known here. Everything below is
 * therefore expressed as a fraction of the APERTURE WIDTH — aperture width is
 * exactly 1 — and the caller scales the whole group by the metres it settled
 * on. Nothing has to be rebuilt when the window resizes, and the switchgear
 * cannot drift out of proportion with the screen it surrounds.
 *
 * Everything is built strictly OUTSIDE the screen rectangle, because the CSS
 * layer composites above WebGL and anything drawn over the aperture would
 * simply vanish.
 *
 * @param {number} h the aperture height, as a fraction of its width
 */
function buildDashboard(h) {
  const g = new THREE.Group();
  const geos = [];
  const own = x => { geos.push(x); return x; };
  const w = 1;

  const fascia = new THREE.MeshStandardMaterial({
    color: 0x5d5449, roughness: 0.76, metalness: 0.6
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x26231e, roughness: 0.9, metalness: 0.42
  });
  const switchCap = new THREE.MeshStandardMaterial({
    color: 0x8d7f68, roughness: 0.62, metalness: 0.55
  });
  // A lamp is the one thing in this world allowed to be lit (CLAUDE.md §4.2).
  const lampOn = new THREE.MeshStandardMaterial({
    color: 0xd99423, emissive: 0xd99423, emissiveIntensity: 1.1, roughness: 0.5
  });
  const lampOff = new THREE.MeshStandardMaterial({
    color: 0x4a4038, roughness: 0.8, metalness: 0.4
  });
  const mats = [fascia, dark, switchCap, lampOn, lampOff];

  const cheek = 0.065;      // fascia run past the aperture, each side
  const head = 0.016;       // the lip above the screen
  const apron = 0.042;      // the shelf below it
  const depth = 0.019;

  // The fascia plate itself, a hair behind the DOM so no edge of world shows.
  const plate = new THREE.Mesh(
    own(new THREE.BoxGeometry(w + cheek * 2, h + head + apron, depth)), fascia
  );
  plate.position.set(0, (apron - head) / -2, -depth / 2 - 0.002);
  plate.castShadow = plate.receiveShadow = true;
  g.add(plate);

  // Head lip above the aperture, carrying the indicator row.
  const lip = new THREE.Mesh(
    own(new THREE.BoxGeometry(w + cheek * 2, head, depth * 1.6)), fascia
  );
  lip.position.set(0, h / 2 + head / 2, depth * 0.25);
  g.add(lip);

  // Apron below it: the shelf your hands rest on, and the front rail.
  const shelf = new THREE.Mesh(
    own(new THREE.BoxGeometry(w + cheek * 2, apron, depth * 2.4)), fascia
  );
  shelf.position.set(0, -h / 2 - apron / 2, depth * 0.6);
  g.add(shelf);

  const rail = new THREE.Mesh(
    own(new THREE.CylinderGeometry(0.0045, 0.0045, w * 0.78, 8)), dark
  );
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, -h / 2 - apron * 0.8, depth * 1.7);
  g.add(rail);

  // Indicator lamps along the head. Five of them, one lit — a desk that is
  // powered up, not a christmas tree.
  for (let i = 0; i < 5; i++) {
    const lamp = new THREE.Mesh(
      own(new THREE.CylinderGeometry(0.0026, 0.0026, 0.004, 8)),
      i === 1 ? lampOn : lampOff
    );
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(-w / 2 - cheek * 0.5 + i * 0.0085, h / 2 + head / 2, depth * 0.85);
    g.add(lamp);
  }

  // Switchgear down both cheeks: a toggle bank and a rotary apiece.
  for (const side of [-1, 1]) {
    const cx = side * (w / 2 + cheek / 2);

    for (let r = 0; r < 3; r++) {
      const ly = h * 0.30 - r * h * 0.24;
      const body = new THREE.Mesh(
        own(new THREE.BoxGeometry(0.016, 0.006, 0.005)), dark
      );
      body.position.set(cx, ly, depth * 0.55);
      g.add(body);

      const dolly = new THREE.Mesh(
        own(new THREE.BoxGeometry(0.004, 0.009, 0.004)), switchCap
      );
      dolly.position.set(cx - 0.004, ly + 0.005, depth * 0.72);
      dolly.rotation.z = r % 2 ? 0.42 : -0.42;
      g.add(dolly);
    }

    const knob = new THREE.Mesh(
      own(new THREE.CylinderGeometry(0.0085, 0.0092, 0.007, 16)), switchCap
    );
    knob.rotation.x = Math.PI / 2;
    knob.position.set(cx, -h * 0.30, depth * 0.78);
    g.add(knob);

    const index = new THREE.Mesh(
      own(new THREE.BoxGeometry(0.0013, 0.006, 0.0013)), dark
    );
    index.position.set(cx, -h * 0.30 + 0.005, depth * 1.0);
    g.add(index);

    // The cheek is bolted to the plate, like everything else on this ship.
    g.add(boltLine(
      [cx, -h / 2 - apron * 0.35, depth * 0.9],
      [cx, h / 2 + head * 0.4, depth * 0.9], 4, dark,
      { size: 0.0024, normalAxis: 'z' }
    ));

    // The desk stands on something.
    const leg = new THREE.Mesh(
      own(new THREE.CylinderGeometry(0.005, 0.0062, 0.15, 8)), dark
    );
    leg.position.set(side * w * 0.36, -h / 2 - apron - 0.073, depth * 0.2);
    leg.rotation.x = 0.18;
    g.add(leg);
  }

  // The stencilled designator on the apron. A serial, not player copy.
  const tag = placard('CHM-01', { w: 0.042, h: 0.009, bg: '#413a31', fg: '#cbbfa6' });
  tag.position.set(-w / 2 + 0.03, -h / 2 - apron * 0.45, depth * 1.35);
  g.add(tag);

  g.userData.ownedGeos = geos;
  g.userData.ownedMats = mats;
  return g;
}

const _probe = new THREE.Object3D();
const _corner = new THREE.Vector3();

/**
 * How much of the glass a desk of width `w` sitting at height `y` covers.
 *
 * MEASURED, NOT ESTIMATED. The fascia is raked, so its bottom edge is nearer
 * the eye than its top and projects larger: the flat trigonometry that looks
 * right on paper put a "quarter height" desk at 29% of a 16:9 screen, with its
 * front lip hanging off the bottom of the glass. So the four corners are pushed
 * through the real projection matrix and the answer is read off in NDC, where
 * the whole glass is 2 units tall and the budget is therefore 0.5.
 */
export function measureConsole(cam, w, y) {
  const h = w * (DASH_PX.h / DASH_PX.w);
  _probe.position.set(0, y, -DASH_DIST);
  _probe.rotation.set(DASH_RAKE, 0, 0);
  _probe.updateMatrixWorld(true);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [dx, dy] of [[-w / 2, -h / 2], [w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]]) {
    _corner.set(dx, dy, 0).applyMatrix4(_probe.matrixWorld).project(cam);
    minX = Math.min(minX, _corner.x); maxX = Math.max(maxX, _corner.x);
    minY = Math.min(minY, _corner.y); maxY = Math.max(maxY, _corner.y);
  }
  return { h, minX, maxX, minY, maxY, hSpan: maxY - minY, wSpan: maxX - minX };
}

/**
 * Solve for the desk's width and height in the glass.
 *
 * The height budget is the rule the user set and it is enforced first: the
 * console may cover a quarter of the view and no more, leaving three quarters
 * of the glass for the chamber. Width is the second constraint, so a narrow
 * window shrinks the desk instead of letting it run off both sides.
 *
 * Solved by bisection, because the projected height is not linear in the width.
 * Twelve halvings on a range of a few metres settle far finer than a pixel at
 * this distance.
 *
 * Pure, and exported, so `npm run verify:console` can assert the ceiling holds
 * at every aspect rather than taking this file's word for it.
 *
 * @param {THREE.PerspectiveCamera} cam
 * @returns {{w: number, h: number, y: number}} width, height and centre height
 */
export function fitConsole(cam) {
  const viewH = 2 * DASH_DIST * Math.tan((cam.fov * Math.PI / 180) / 2);
  const viewW = viewH * (cam.aspect || 1.6);
  const rakeCos = Math.cos(DASH_RAKE);

  const yFor = w => -viewH / 2 + (w * (DASH_PX.h / DASH_PX.w) * rakeCos) / 2;
  const fits = w => {
    const m = measureConsole(cam, w, yFor(w));
    return m.hSpan <= 2 * MAX_VIEW_FRACTION && m.wSpan <= 2 * MAX_WIDTH_FRACTION;
  };

  let lo = 0.05;
  let hi = Math.max(viewW, viewH) * 2;
  if (fits(hi)) lo = hi;
  else for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) lo = mid; else hi = mid;
  }
  const w = lo;

  // Then raise it until its front lip is inside the glass. The rake throws the
  // bottom edge down and outward, so the naive "sit it on the floor of the
  // view" placement hangs it over the edge.
  let y = yFor(w);
  for (let i = 0; i < 5; i++) {
    const m = measureConsole(cam, w, y);
    const deficit = -0.985 - m.minY;
    if (deficit <= 0) break;
    y += (deficit / 2) * viewH;
  }

  return { w, h: w * (DASH_PX.h / DASH_PX.w), y };
}

/**
 * Take the deck off the page and put it on the desk.
 *
 * @param {HTMLElement} container the quest screen's root
 * @param {{scene: THREE.Scene, camera: THREE.Camera}} viewer the chamber
 * @returns {{dispose: Function} | null} null when this tier reads a page
 */
export function mountQuestConsole(container, viewer) {
  if (!tierAtLeast('T4') || !viewer?.scene || !viewer?.camera) return null;

  // A desk too small to read is not an interface. See MIN_GLASS_PX.
  const glass = Math.max(
    window.visualViewport?.width || 0, window.innerWidth || 0
  );
  if (glass < MIN_GLASS_PX) return null;

  const overlay = container.querySelector('.quest-hud-overlay');
  const deckCard = container.querySelector('.stage-card-wrap');
  const nav = container.querySelector('.quest-nav-cluster');
  const gardens = container.querySelector('.quest-gardens-slot');
  const legend = container.querySelector('.colormap-legend');
  if (!overlay || !deckCard || !nav) return null;

  // The console rides with the operator. The camera has to be in the scene
  // graph for that to mean anything — an orbit camera usually is not parented
  // to anything, and an unparented camera has no children that get drawn.
  const station = new THREE.Group();
  viewer.camera.add(station);
  if (!viewer.camera.parent) viewer.scene.add(viewer.camera);

  /**
   * One wrapper, four regions.
   *
   * The nodes keep their ids, their classes and their handlers; only their
   * parent changes. Where they sit on the fascia is decided by CSS on
   * `.quest-console-panel`, which is a two-column grid — the deck on the left,
   * the rail and the relay strip on the right.
   */
  const wrap = document.createElement('div');
  wrap.className = 'quest-console-panel quest-console-dash';
  const homes = [];
  const region = (cls, nodes) => {
    const box = document.createElement('div');
    box.className = cls;
    let any = false;
    for (const n of nodes) {
      if (!n) continue;
      homes.push({ node: n, parent: n.parentNode, next: n.nextSibling });
      box.appendChild(n);
      any = true;
    }
    if (any) wrap.appendChild(box);
  };

  region('qc-deck', [deckCard]);
  region('qc-rail', [nav, gardens, legend]);

  const panel = new WorldPanel({
    element: wrap,
    widthPx: DASH_PX.w,
    heightPx: DASH_PX.h,
    metres: 1,                 // replaced immediately by fit()
    scene: viewer.scene,
    position: [0, 0, -DASH_DIST],
    rotation: [DASH_RAKE, 0, 0],
    housing: 'none',
    glow: 0
  });
  // Re-express it in the operator's frame so it rides the camera.
  viewer.scene.remove(panel.object);
  station.add(panel.object);

  const dash = buildDashboard(DASH_PX.h / DASH_PX.w);
  const dashHolder = new THREE.Group();
  dashHolder.position.copy(panel.object.position);
  dashHolder.rotation.copy(panel.object.rotation);
  dashHolder.add(dash);
  station.add(dashHolder);

  // One filament under the head lip, throwing light DOWN the fascia. It lights
  // the desk; it does not bloom on its own face (CLAUDE.md §1.2). It hangs off
  // the station rather than the fascia, because a PointLight's `distance` is a
  // world figure and would not survive the holder being scaled to fit.
  const spill = new THREE.PointLight(0xd8b878, 2.4, 1.6, 2.0);
  station.add(spill);

  const fit = () => {
    const cam = viewer.camera;
    if (!cam?.isPerspectiveCamera) return;
    const { w, h, y } = fitConsole(cam);
    panel.setWidth(w);
    panel.object.position.set(0, y, -DASH_DIST);
    dashHolder.position.copy(panel.object.position);
    dashHolder.scale.setScalar(w);
    spill.position.set(0, y + h / 2 + 0.03, -DASH_DIST + 0.12);
  };

  fit();
  const onResize = () => fit();
  window.addEventListener('resize', onResize);
  // The chamber re-frames itself on a phone as the deck grows and shrinks, so
  // the desk is re-fitted on a slow tick rather than only on a window resize.
  const tick = setInterval(fit, 400);

  // Nothing is left in the overlay but the flash plate, so it must stop
  // claiming the screen or it would sit invisibly over the chamber.
  overlay.classList.add('quest-hud-diegetic');

  return {
    dispose() {
      clearInterval(tick);
      window.removeEventListener('resize', onResize);
      // The nodes go home first: disposing the panel detaches whatever it
      // holds, and quest.js may still be mid-teardown and querying for them.
      for (const h of homes) {
        if (h.parent) h.parent.insertBefore(h.node, h.next || null);
      }
      station.remove(panel.object);
      panel.dispose();
      station.remove(dashHolder);
      station.remove(spill);
      for (const x of dash.userData.ownedGeos || []) x.dispose();
      for (const m of dash.userData.ownedMats || []) m.dispose();
      dash.traverse(o => {
        if (o.userData?.ownGeometry) o.userData.ownGeometry.dispose();
        if (o.userData?.ownMaterial) o.userData.ownMaterial.dispose();
        if (o.userData?.ownTexture) o.userData.ownTexture.dispose();
      });
      viewer.camera.remove(station);
      overlay.classList.remove('quest-hud-diegetic');
      wrap.remove();
    }
  };
}
