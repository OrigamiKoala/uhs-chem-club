/**
 * rooms.js — The rooms a built bench builds for itself where there is no world to stand in.
 *
 * A bench on a walkable world is laid on the bench that is already standing there, and the host IS the room
 * (plan `bench-tabletop.md` §2.6). A bench with no world under it (Kettle: no site is laid out yet, so its
 * quests are played "off-world") builds a little room round the plate, and that room is held to the same rules
 * as a host: the table is its own work surface in its own materials (never the bench kit's), the lean-in view
 * has geometry behind the plate at every aspect, the camera's air and its sightline to the plate are clear
 * (`verify:bench` measures all of it), and there is a lamp over the plate.
 *
 * A room is `build(viewer) -> { bench, set, mats, lights, key }`:
 *   bench   the work surface and its frame (the viewer's `benchGroup`): a plate 4.8 x 1.3 m with its top at
 *           0.895, the bay's footprint, nothing above the plate;
 *   set     everything else (floor, walls, props, the lamp), kept out of the bay's volumes;
 *   mats    the materials the table is dressed in (`top`, `dark`, `tray`): the room's own;
 *   lights  scene lights, the lamp's among them.
 *
 * THE FOUNDRY (`'foundry'`, Kettle). A cast-iron assay plate on a frame of rolled sections, in the corner of a
 * foundry bay: a firebrick wall behind it with a furnace mouth, ore hoppers on either side, a crane rail high
 * over a hanging ladle, plate pipework along the wall, and one pendant lamp over the plate. Nothing is lit but
 * the lamp's own lens; nothing blooms. Everything is a plain box, cylinder or cone: a few hundred triangles.
 */

import * as THREE from 'three';

const AMBER = 0xd99423;

/** The plate's top above the floor, as the viewer builds every bench. */
const PLATE_Y = 0.895;

/**
 * @param {{own: (...objs: object[]) => object}} viewer the bench viewer (it keeps what is `own`ed to dispose)
 */
function buildFoundry(viewer) {
  const own = (...o) => viewer.own(...o);
  const mat = (color, roughness, metalness, extra = {}) => own(new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra }));
  const M = {
    castIron: mat(0x5c564d, 0.9, 0.42),
    darkIron: mat(0x2f2b26, 0.95, 0.5),
    firebrick: mat(0x7d5644, 1.0, 0.0),
    slag: mat(0x27231f, 1.0, 0.1),
    plating: mat(0x45403a, 0.95, 0.3),
    brass: mat(0x8d7339, 0.55, 0.6),
    // The lamp's lens: the one lit thing in the room.
    lens: mat(0x3a3128, 0.45, 0.2, { emissive: AMBER, emissiveIntensity: 1.3 })
  };
  const box = (parent, w, h, d, m, x, y, z, name = '') => {
    const mesh = new THREE.Mesh(own(new THREE.BoxGeometry(w, h, d)), m);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  };
  const cyl = (parent, rt, rb, h, seg, m, x, y, z, rot = null) => {
    const mesh = new THREE.Mesh(own(new THREE.CylinderGeometry(rt, rb, h, seg)), m);
    mesh.position.set(x, y, z);
    if (rot) mesh.rotation.set(...rot);
    parent.add(mesh);
    return mesh;
  };

  /* ---------------- the work surface: the bay's plate, 4.8 x 1.3 m ---------------- */
  const bench = new THREE.Group();
  bench.name = 'foundry-bench';
  // The cast plate (its top is the plate), a raised lip along the back for tongs and gauges, a riveted apron.
  box(bench, 4.8, 0.07, 1.3, M.castIron, 0, PLATE_Y - 0.035, 0, 'assay-plate').receiveShadow = true;
  box(bench, 4.8, 0.05, 0.05, M.darkIron, 0, PLATE_Y + 0.025, -0.625, 'plate-lip');
  box(bench, 4.8, 0.16, 0.05, M.plating, 0, 0.78, 0.625, 'plate-apron');
  for (let i = 0; i < 14; i++) {
    const rivet = new THREE.Mesh(own(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 8)), M.darkIron);
    rivet.rotation.x = Math.PI / 2;
    rivet.position.set(-2.3 + i * 0.354, 0.78, 0.655);
    bench.add(rivet);
  }
  // Four legs of rolled section on foot plates, a cross brace, and a shelf of ingot moulds under the plate.
  for (const [lx, lz] of [[-2.2, -0.5], [2.2, -0.5], [-2.2, 0.5], [2.2, 0.5]]) {
    box(bench, 0.12, 0.81, 0.12, M.darkIron, lx, 0.405, lz);
    box(bench, 0.2, 0.025, 0.2, M.darkIron, lx, 0.0125, lz);
  }
  box(bench, 4.3, 0.06, 0.06, M.darkIron, 0, 0.28, -0.5);
  box(bench, 4.2, 0.03, 0.9, M.plating, 0, 0.3, 0);
  for (let i = 0; i < 5; i++) box(bench, 0.5, 0.14, 0.3, M.slag, -1.6 + i * 0.8, 0.385, 0);

  /* ---------------- the bay: floor, wall, furnace, hoppers, crane ---------------- */
  const set = new THREE.Group();
  set.name = 'foundry-set';

  // The floor: cast plates, the ground everything stands on.
  const floor = box(set, 34, 0.2, 18, M.plating, 0, -0.1, -5, 'foundry-floor');
  floor.userData.phys = 'ground';
  floor.receiveShadow = true;
  // The firebrick wall behind the bench, 2.35 m behind the plate's middle, with a pilaster of rolled section
  // every 3.5 m and a plinth course: it is the backdrop at every aspect.
  const wallZ = -2.6;
  box(set, 34, 8.4, 0.5, M.firebrick, 0, 4.2, wallZ, 'brick-wall');
  box(set, 34, 0.5, 0.2, M.slag, 0, 0.25, wallZ + 0.35, 'plinth');
  for (let x = -14; x <= 14.01; x += 3.5) box(set, 0.5, 8.4, 0.3, M.darkIron, x, 4.2, wallZ + 0.4, 'pilaster');
  // A band of plating and the plate pipework along the wall, with a flange at every pilaster.
  box(set, 34, 0.7, 0.1, M.plating, 0, 2.55, wallZ + 0.3, 'wall-band');
  cyl(set, 0.12, 0.12, 34, 12, M.darkIron, 0, 3.15, wallZ + 0.4, [0, 0, Math.PI / 2]).name = 'wall-pipe';
  for (let x = -14; x <= 14.01; x += 3.5) cyl(set, 0.17, 0.17, 0.08, 12, M.darkIron, x + 1.75, 3.15, wallZ + 0.4, [0, 0, Math.PI / 2]);
  for (const x of [-5.25, 1.75, 8.75]) {
    cyl(set, 0.06, 0.06, 1.2, 8, M.darkIron, x, 3.8, wallZ + 0.4);
    cyl(set, 0.2, 0.2, 0.05, 12, M.brass, x, 4.45, wallZ + 0.4, [Math.PI / 2, 0, 0]);
  }
  // The furnace mouth: an iron frame proud of the wall, a slag-black door set in it, and a brass sight lens.
  box(set, 3.6, 3.4, 0.2, M.darkIron, 0, 1.7, wallZ + 0.35, 'furnace-frame');
  box(set, 3.0, 2.9, 0.12, M.slag, 0, 1.55, wallZ + 0.47, 'furnace-door');
  box(set, 3.6, 0.3, 0.3, M.darkIron, 0, 3.55, wallZ + 0.4, 'furnace-lintel');
  cyl(set, 0.16, 0.16, 0.06, 14, M.brass, 0, 2.2, wallZ + 0.55, [Math.PI / 2, 0, 0]).name = 'sight-lens';
  for (const sx of [-1, 1]) box(set, 0.1, 2.2, 0.06, M.darkIron, sx * 1.1, 1.55, wallZ + 0.56);
  // Ore hoppers on legs at either end of the bench, spilling a mound of ore, clear of the bay.
  for (const sx of [-1, 1]) {
    const hx = sx * 4.1;
    const hopper = new THREE.Mesh(own(new THREE.CylinderGeometry(0.95, 0.22, 1.5, 4, 1, false)), M.plating);
    hopper.rotation.y = Math.PI / 4;
    hopper.position.set(hx, 2.6, -1.9);
    hopper.name = 'ore-hopper';
    set.add(hopper);
    box(set, 0.18, 1.85, 0.18, M.darkIron, hx - 0.65, 0.925, -2.2);
    box(set, 0.18, 1.85, 0.18, M.darkIron, hx + 0.65, 0.925, -2.2);
    box(set, 0.18, 1.85, 0.18, M.darkIron, hx - 0.65, 0.925, -1.5);
    box(set, 0.18, 1.85, 0.18, M.darkIron, hx + 0.65, 0.925, -1.5);
    cyl(set, 0.0, 0.8, 0.55, 7, M.slag, hx, 0.275, -1.1).name = 'ore-mound';
  }
  // Ingot stacks on the floor beyond the bench's ends.
  for (const sx of [-1, 1]) {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3 - r; c++) {
      box(set, 0.5, 0.16, 0.26, r % 2 ? M.castIron : M.slag, sx * (3.1 + 0.55 * c + 0.27 * r), 0.08 + 0.16 * r, 0.15, 'ingot');
    }
  }
  // The crane rail: a beam across the bay high over the bench, with a hanging ladle at one side and the lamp's chain.
  box(set, 34, 0.3, 0.18, M.darkIron, 0, 6.3, -1.0, 'crane-rail');
  box(set, 34, 0.05, 0.5, M.darkIron, 0, 6.17, -1.0);
  cyl(set, 0.02, 0.02, 2.9, 6, M.darkIron, -3.3, 4.7, -1.0).name = 'ladle-chain';
  cyl(set, 0.5, 0.36, 0.7, 12, M.plating, -3.3, 3.0, -1.0).name = 'ladle';
  cyl(set, 0.42, 0.42, 0.06, 12, M.slag, -3.3, 3.33, -1.0);

  // The lamp over the plate: a pendant shade on a chain from the crane, a lens in its throat. Clear of the camera's air.
  const lampPos = new THREE.Vector3(0.7, 3.0, -0.35);
  cyl(set, 0.012, 0.012, 3.1, 6, M.darkIron, lampPos.x, (6.17 + lampPos.y + 0.15) / 2, lampPos.z).name = 'lamp-chain';
  cyl(set, 0.1, 0.34, 0.26, 12, M.darkIron, lampPos.x, lampPos.y + 0.03, lampPos.z).name = 'lamp-shade';
  cyl(set, 0.12, 0.12, 0.03, 12, M.lens, lampPos.x, lampPos.y - 0.115, lampPos.z).name = 'lamp-lens';

  /* ---------------- light: the lamp, a fill, a cool rake from the wall ---------------- */
  const key = new THREE.SpotLight(0xffd9a6, 30, 9, Math.PI * 0.34, 0.6, 1.4);
  key.position.set(lampPos.x, lampPos.y - 0.14, lampPos.z);
  key.target.position.set(0, PLATE_Y, 0.05);
  const fill = new THREE.HemisphereLight(0xcfc0a2, 0x3a342c, 1.1);
  const ambient = new THREE.AmbientLight(0x6f665a, 0.85);
  const rake = new THREE.DirectionalLight(0x9a917e, 0.5);
  rake.position.set(3, 2.2, -3.5);
  const lights = [key, key.target, fill, ambient, rake];

  return {
    id: 'foundry',
    bench,
    set,
    // The table's own dressing: cast-iron pieces on the plate, blackened rims, firebrick trays (the ore tubs).
    mats: { top: M.castIron, dark: M.darkIron, tray: M.firebrick },
    lights,
    key,
    lamp: lampPos.toArray()
  };
}

export const ROOMS = Object.freeze({ foundry: buildFoundry });

/** The builder of a named room, or null. */
export function getRoom(id) {
  return id ? ROOMS[id] || null : null;
}
