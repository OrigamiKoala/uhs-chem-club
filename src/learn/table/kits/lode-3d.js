/**
 * kits/lode-3d.js — Lodestone's instruments at `3D On`.
 *
 * THE SAME PICTURE, MOVING. The built table paints the plate once per change, with no clock, so a flat picture that moves in time (a lead
 * clip, levels gliding as an ion takes its charge, an electron leaving an ionization strip) would stand still at `3D On`. A live dress lays
 * a thin screen over the fixture's box, just above the mat and under any glass, and repaints it with the fixture's own painter at the
 * running clock: what moves at `3D Off` moves the same way here, and the static picture under it is identical at every rest.
 * `userData.sync(f, state)` takes the table's latest state; `userData.tick(dt, still)` advances the clock (`still`, reduced motion, holds it).
 */

import { fixtureLayout } from '../layout.js';

const PX = 9; // canvas pixels per table unit

export function liveDress(handler) {
  return function dress3d(f, state, c) {
    const { THREE, scale: s, toPlate, own, ground } = c;
    const lay = fixtureLayout(f);
    const bw = lay.box.x1 - lay.box.x0; const bh = lay.box.y1 - lay.box.y0;
    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    const group = new THREE.Group();
    group.name = 'lode-live';
    if (!canvas || !canvas.getContext) return group;
    canvas.width = Math.round(bw * PX); canvas.height = Math.round(bh * PX);
    const ctx = canvas.getContext('2d');
    if (!ctx) return group;
    const tex = own(new THREE.CanvasTexture(canvas));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = own(new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    const mesh = new THREE.Mesh(own(new THREE.PlaneGeometry(bw * s * 0.985, bh * s * 0.985)), mat);
    mesh.rotation.x = -Math.PI / 2;
    const mid = toPlate({ x: (lay.box.x0 + lay.box.x1) / 2, y: (lay.box.y0 + lay.box.y1) / 2 });
    mesh.position.set(mid.x, ground + 0.0012, mid.z);
    mesh.renderOrder = 2;
    mesh.castShadow = false; mesh.receiveShadow = false;
    group.add(mesh);
    let latest = state; let fx = f; let clock = 0.001; let acc = 0;
    const paint = () => {
      ctx.fillStyle = '#14120e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const b = { X: u => (u - lay.box.x0) * PX, Y: u => (u - lay.box.y0) * PX, sc: PX, lay: fixtureLayout(fx), clock, bodies: false, scope: '3d-live' };
      try { handler.paint(ctx, fx, latest, b); } catch (err) { /* a painter that fails leaves the plate's own picture */ }
      tex.needsUpdate = true;
    };
    paint();
    group.userData.sync = (nf, ns) => { fx = nf || fx; latest = ns || latest; paint(); };
    group.userData.update = (nf, ns) => { fx = nf || fx; latest = ns || latest; paint(); };
    group.userData.tick = (dt, still) => {
      if (still) return;
      clock += dt; acc += dt;
      if (acc < 1 / 30) return;
      acc = 0;
      paint();
    };
    return group;
  };
}

/** Give every live Lodestone fixture its live dress, unless it builds solids of its own. */
export function installLodeDresses(entries) {
  for (const [, h] of entries) if (h.paint && h.live && !h.dress3d) h.dress3d = liveDress(h);
}
