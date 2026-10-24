/**
 * ligar-mol3d.js — a molecule standing on its card as a solid: balls on rods, lone pairs as faint lobes, the pull of each bond as an
 * arrow when the arrows tool lies on it.
 *
 * WHERE THE SHAPE IS THE IDEA, THE SHAPE IS A SOLID (CLAUDE.md, "Flat things are drawn flat; spatial things are 3D objects"). A
 * molecule card is the picture of a molecule seen from one side; at `3D On` the tile carries the molecule itself, built from the very
 * same vectors the flat picture projects (`vsepr.planDomains`, turned by `domain-field.js` `dmolPose` when the field swings it), so
 * the picture is honest either way: what is drawn is what is graded. The planner's axes are the table's: x across the plates, y up,
 * z toward the player.
 *
 * Pure over THREE like `ligar-props.js`; takes the same build context `c` a `piece3d` is given.
 */

import * as THREE from 'three';
import { COLOR as MODEL_COLOR } from './model-parts-ligar.js';

const RADIUS = { H: 0.2, C: 0.3, N: 0.29, O: 0.28, F: 0.25, B: 0.29, S: 0.34, Cl: 0.34, Xe: 0.38, Na: 0.36, K: 0.4, P: 0.33 };
const LEN = { H: 0.74, default: 0.9 };
const AMBER = 0xe59b24;

const rodBetween = (a, b, r, mat) => {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
  m.position.copy(A).lerp(B, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  m.castShadow = true;
  return m;
};

/** Turn a planner vector about the vertical by `yaw` (the card's presentation turn). */
const yawed = (v, yaw) => [v[0] * Math.cos(yaw) + v[2] * Math.sin(yaw), v[1], -v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw)];

/**
 * @param {object} c       the `piece3d` context (`hw`, `hh`, `own`)
 * @param {object} o       `{ hub, vectors, yaw, arrows, net }`: `vectors` are the planner's (or the swung) vectors, `arrows` are
 *                         `[{ sym, d }]` per bond (positive `d`: the atom pulls harder), `net` the unit net pull or null
 * @param {number} baseY   the height of the tile's face
 */
export function buildMolModel(c, { hub, vectors, yaw = 0, arrows = null, net = null }, baseY) {
  const g = new THREE.Group();
  const reach = Math.min(c.hw, c.hh) * 0.62;
  const k = reach / 1.0;
  const mat = color => c.own(new THREE.MeshStandardMaterial({ color, roughness: 0.46, metalness: 0.08 }));
  const radiusOf = sym => (RADIUS[sym] || 0.3) * k * 0.62;
  const centre = [0, baseY + reach * 0.62, 0];
  const pos = (v, f) => { const w = yawed(v, yaw); return [centre[0] + w[0] * f * k, centre[1] + w[1] * f * k, centre[2] + w[2] * f * k]; };

  const hubBall = new THREE.Mesh(new THREE.SphereGeometry(radiusOf(hub), 22, 16), mat(MODEL_COLOR[hub] || MODEL_COLOR.H));
  hubBall.position.set(...centre);
  hubBall.castShadow = true;
  g.add(hubBall);

  const rod = mat(0x8c8376);
  const atomVectors = vectors.filter(v => v.kind === 'atom');
  for (const v of vectors) {
    if (v.kind === 'lone') {
      const lobe = new THREE.Mesh(
        new THREE.SphereGeometry(k * 0.19, 16, 12),
        c.own(new THREE.MeshPhysicalMaterial({ color: 0xb9a56a, roughness: 0.2, transparent: true, opacity: 0.5 }))
      );
      lobe.scale.set(0.9, 1.25, 0.9);
      lobe.position.set(...pos(v.v, 0.62));
      g.add(lobe);
      continue;
    }
    const f = v.sym === 'H' ? LEN.H : LEN.default;
    const end = pos(v.v, f);
    const n = Math.min(3, v.mult || 1);
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * k * 0.09;
      g.add(rodBetween([centre[0], centre[1] + off, centre[2]], [end[0], end[1] + off, end[2]], k * 0.028, rod));
    }
    const ball = new THREE.Mesh(new THREE.SphereGeometry(radiusOf(v.sym), 20, 14), mat(MODEL_COLOR[v.sym] || MODEL_COLOR.H));
    ball.position.set(...end);
    ball.castShadow = true;
    g.add(ball);
  }

  // The arrows tool: a short amber arrow along each bond toward the atom that pulls the pair harder, and the sum of them all.
  if (arrows) {
    const amber = mat(AMBER);
    arrows.forEach((a, i) => {
      const v = atomVectors[i];
      if (!v || Math.abs(a.d) < 0.01) return;
      const from = a.d >= 0 ? 0.3 : 0.62;
      const to = a.d >= 0 ? 0.62 : 0.3;
      const lift = k * 0.12;
      const p0 = pos(v.v, from);
      const p1 = pos(v.v, to);
      p0[1] += lift; p1[1] += lift;
      g.add(rodBetween(p0, p1, k * 0.022, amber));
      const cone = new THREE.Mesh(new THREE.ConeGeometry(k * 0.06, k * 0.12, 10), amber);
      cone.position.set(...p1);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).normalize());
      g.add(cone);
    });
    if (net) {
      const w = yawed(net, yaw);
      const p0 = [centre[0] - w[0] * k * 0.5, baseY + k * 0.04, centre[2] - w[2] * k * 0.5];
      const p1 = [centre[0] + w[0] * k * 0.5, baseY + k * 0.04, centre[2] + w[2] * k * 0.5];
      g.add(rodBetween(p0, p1, k * 0.04, amber));
      const cone = new THREE.Mesh(new THREE.ConeGeometry(k * 0.1, k * 0.2, 12), amber);
      cone.position.set(...p1);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).normalize());
      g.add(cone);
    }
  }
  return g;
}
