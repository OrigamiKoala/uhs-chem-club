/**
 * console.js — The Charge Gardens stage deck, as the desk it is read from.
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
 * a single word of copy shifting. `quest.js` keeps querying `#stage-card` and
 * `#grade-btn` and keeps finding them.
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
import { PanelRig } from '../three/world-ui.js';
import { boltLine } from '../three/materials/pbr-kit.js';

/**
 * Where each region sits in the operator's own frame, in chamber units.
 *
 * The camera looks down -z with a 50° vertical field, so at 2.4 units the view
 * is 1.12 units half-height. Everything below is inside that, and the three
 * plates are disjoint in x — a console with its own switchgear overlapping is
 * not a console.
 */
const CONSOLE_LAYOUT = {
  deck: {
    widthPx: 900, heightPx: 430, metres: 2.06,
    position: [0, -0.62, -2.4], rotation: [-0.34, 0, 0],
    designator: 'CHM-01', glow: 0.5
  },
  nav: {
    widthPx: 430, heightPx: 300, metres: 1.06,
    position: [-1.44, 0.30, -2.55], rotation: [-0.10, 0.42, 0],
    designator: 'NAV-02', glow: 0.35
  },
  relay: {
    widthPx: 430, heightPx: 300, metres: 1.06,
    position: [1.44, 0.30, -2.55], rotation: [-0.10, -0.42, 0],
    designator: 'RLY-03', glow: 0.35
  }
};

/**
 * The desk itself: a raked worktop under the main plate, cheeks either side and
 * a lip you would rest your hands on. Built strictly outside every screen
 * rectangle, because the DOM layer composites above WebGL.
 */
function buildDesk() {
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({
    color: 0x574f44, roughness: 0.78, metalness: 0.58
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x26231e, roughness: 0.9, metalness: 0.42
  });
  const geos = [];
  const own = x => { geos.push(x); return x; };

  // Worktop, raked to match the main plate and set just below it.
  const top = new THREE.Mesh(own(new THREE.BoxGeometry(2.45, 0.07, 0.62)), frame);
  top.position.set(0, -1.33, -2.16);
  top.rotation.x = -0.34 + Math.PI / 2;
  g.add(top);

  // Hand lip along the near edge.
  const lip = new THREE.Mesh(own(new THREE.BoxGeometry(2.45, 0.06, 0.06)), dark);
  lip.position.set(0, -1.46, -1.95);
  g.add(lip);
  g.add(boltLine([-1.1, -1.46, -1.91], [1.1, -1.46, -1.91], 9, dark,
    { size: 0.018, normalAxis: 'z' }));

  // Cheeks: the desk is a box, and a box has sides.
  for (const cx of [-1.26, 1.26]) {
    const cheek = new THREE.Mesh(own(new THREE.BoxGeometry(0.07, 0.62, 0.6)), frame);
    cheek.position.set(cx, -1.04, -2.2);
    cheek.rotation.x = -0.34;
    g.add(cheek);
  }

  // Standoff arms out to the two side plates.
  for (const sx of [-1.0, 1.0]) {
    const arm = new THREE.Mesh(own(new THREE.CylinderGeometry(0.022, 0.022, 0.95, 8)), dark);
    arm.position.set(sx * 1.24, -0.42, -2.42);
    arm.rotation.z = -sx * 0.42;
    g.add(arm);
  }

  g.userData.ownedGeos = geos;
  g.userData.ownedMats = [frame, dark];
  return g;
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

  const desk = buildDesk();
  station.add(desk);

  const rig = new PanelRig(viewer.scene, station);
  const wrappers = [];
  const homes = [];

  const mount = (id, nodes) => {
    const wrap = document.createElement('div');
    wrap.className = `quest-console-panel quest-console-${id}`;
    for (const n of nodes) {
      if (!n) continue;
      homes.push({ node: n, parent: n.parentNode, next: n.nextSibling });
      wrap.appendChild(n);
    }
    wrappers.push(wrap);
    return rig.add(id, wrap, CONSOLE_LAYOUT[id]);
  };

  mount('deck', [deckCard]);
  mount('nav', [nav]);
  mount('relay', [gardens, legend]);

  // Nothing is left in the overlay but the flash plate, so it must stop
  // claiming the screen or it would sit invisibly over the chamber.
  overlay.classList.add('quest-hud-diegetic');

  return {
    dispose() {
      // The nodes go home first: disposing the rig detaches whatever it holds,
      // and quest.js may still be mid-teardown and querying for them.
      for (const h of homes) {
        if (h.parent) h.parent.insertBefore(h.node, h.next || null);
      }
      rig.dispose();
      station.remove(desk);
      for (const x of desk.userData.ownedGeos || []) x.dispose();
      for (const m of desk.userData.ownedMats || []) m.dispose();
      desk.traverse(o => { if (o.userData?.ownGeometry) o.userData.ownGeometry.dispose(); });
      viewer.camera.remove(station);
      overlay.classList.remove('quest-hud-diegetic');
      for (const w of wrappers) w.remove();
    }
  };
}
