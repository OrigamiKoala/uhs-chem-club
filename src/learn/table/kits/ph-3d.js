/**
 * kits/ph-3d.js — the particles of Verdigris's windows as solid spheres at `3D On`.
 *
 * The flat painter of each instrument already says where every particle is at clock time t (`ball(ctx, x, y, r, ink)` in `ph-flask.js`), and its
 * counts come from the planner. This dress runs that same painter against a recording canvas (the `__ball` hook), at a scale that makes pixels and
 * table units the same, and stands every recorded sphere up as an instance of one InstancedMesh. So the 3D and the flat picture are one fact, and
 * a painter that learns a new motion is seen in both. At `3D On` the plate leaves the spheres to this dress (`__skip`, set by the kit when the
 * handler names `bodies3d`). The spheres hover a little over the plate and bob with the wobble; gravity is not the point, clarity is.
 */

const S = 8;            // pixels per table unit in the recording frame
const CAP = 1800;       // the most spheres one fixture shows (a 200-unit window with 3 parts, plus a 1000-dot sample)

function recorder(rec) {
  const own = {};
  const nop = () => undefined;
  return new Proxy(own, {
    get(t, k) {
      if (k === '__ball') return (x, y, r, ink) => { if (rec.length < CAP) rec.push([x, y, r, ink]); };
      if (k === 'measureText') return s => ({ width: String(s).length * 6 });
      return k in t ? t[k] : nop;
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}

/** Every sphere a flat painter draws at `clock`: [x, y, r, ink] in pixels of a frame that is `S` pixels to the table unit (the 3D dress divides by S). */
export function recordBalls(paint, f, state, box, clock, key = '3d') {
  const rec = [];
  const b = { sc: S, X: u => u * S, Y: u => u * S, lay: { box }, bodies: false, clock, sk: key, x0: box.x0 * S, y0: box.y0 * S, x1: box.x1 * S, y1: box.y1 * S };
  try { paint(recorder(rec), f, state, b); } catch { /* a painter that wants a real canvas draws nothing here */ }
  return rec;
}
export const FRAME_SCALE = S;

/** The group of spheres for one fixture whose handler paints through `ball`. `paint` is the handler's flat painter. */
export function bodiesDress(f, state, c, paint) {
  const { THREE, scale: s, toPlate, box } = c;
  const group = new THREE.Group();
  group.name = 'ph-bodies';
  const geo = new THREE.SphereGeometry(1, 10, 7);
  // The host's own steel, whitened so the instance colours (one per species) show as they are: a world's materials stay its own.
  const mat = c.mats.labSteel.clone();
  mat.color = new THREE.Color(0xffffff);
  const mesh = new THREE.InstancedMesh(geo, mat, CAP);
  mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false;
  mesh.count = 0;
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 3), 3);
  group.add(mesh);
  const st = { f, state, clock: 0 };
  const col = new THREE.Color(); const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const v = new THREE.Vector3(); const sc = new THREE.Vector3();
  const cache = new Map();
  const inkOf = ink => { let c0 = cache.get(ink); if (!c0) { c0 = new THREE.Color(ink); cache.set(ink, c0); } return c0; };

  const render = () => {
    const rec = recordBalls(paint, st.f, st.state, box, st.clock);
    const n = Math.min(rec.length, CAP);
    for (let i = 0; i < n; i++) {
      const [px, py, pr, ink] = rec[i];
      const tx = px / S; const ty = py / S; const r = Math.max(0.12, pr / S) * s;
      const pl = toPlate({ x: tx, y: ty });
      const bob = Math.sin(st.clock * 1.6 + i * 1.7) * 0.0025;
      v.set(pl.x, c.ground + 0.014 + r + bob, pl.z);
      sc.set(r, r, r);
      m4.compose(v, q, sc);
      mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, col.copy(inkOf(ink)));
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };
  render();
  group.userData.sync = (fx, stt) => { st.f = fx; st.state = stt; render(); };
  group.userData.tick = (dt, still) => { if (still) return; st.clock += dt; render(); };
  return group;
}
