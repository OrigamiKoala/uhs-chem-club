/**
 * cloak.js — a Fifth Guild figure: a long hooded coat with nobody's face in it, seen at a distance in an opening
 * scene (`director.js`). Built from primitives with the world's problem props (`site.js`), so it is compiled
 * with the world; between scenes it is parked under the ground rather than hidden, so showing it never compiles
 * anything on the frame it appears.
 */
import * as THREE from 'three';

const PARK_Y = -80;

export function buildCloak(kit) {
  const g = new THREE.Group();
  g.name = 'mystery-cloak';
  g.userData.noMerge = true;
  const cloth = kit.mat('cloak', () => new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.92, metalness: 0 }));
  const lining = kit.mat('cloak-lining', () => new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 1, metalness: 0 }));
  // The coat: a lathe from the shoulders to a hem that drags.
  const prof = [[0.02, 1.52], [0.2, 1.48], [0.26, 1.3], [0.28, 1.0], [0.32, 0.6], [0.38, 0.2], [0.42, 0.02], [0.0, 0.0]].map(([x, y]) => new THREE.Vector2(x, y));
  const coat = new THREE.Mesh(kit.own(new THREE.LatheGeometry(prof, 14)), cloth);
  coat.castShadow = true;
  g.add(coat);
  const hood = new THREE.Mesh(kit.own(new THREE.SphereGeometry(0.17, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62)), cloth);
  hood.position.set(0, 1.6, -0.02);
  hood.scale.set(1, 1.25, 1.15);
  hood.castShadow = true;
  g.add(hood);
  const face = new THREE.Mesh(kit.own(new THREE.CircleGeometry(0.11, 12)), lining);
  face.position.set(0, 1.6, 0.13);
  g.add(face);
  g.position.y = PARK_Y;
  return {
    group: g,
    x: 0, z: 0, yaw: 0, shown: false,
    place(world, x, z, yaw = this.yaw) {
      this.x = x; this.z = z; this.yaw = yaw; this.shown = true;
      g.position.set(x, world.getTerrainHeight(x, z), z);
      g.rotation.y = yaw;
    },
    /** A slight sway as it walks or stands in the wind. */
    sway(t, moving) {
      coat.rotation.z = Math.sin(t * (moving ? 5 : 1.1)) * (moving ? 0.03 : 0.012);
      hood.rotation.x = Math.sin(t * 0.7) * 0.03;
    },
    park() { this.shown = false; g.position.y = PARK_Y; }
  };
}
