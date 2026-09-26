/**
 * guide-arrow.js — A lit chevron that leads the player somewhere.
 *
 * Used twice by the voyage: aboard the landed Avalon it leads from wherever
 * the player is standing, down the spine, to the airlock's outer hatch; once
 * they are on the ground it leads to the bench (or pylon) they launched for.
 *
 * TWO HALVES, BECAUSE A PLAYER MAY BE LOOKING THE OTHER WAY.
 *   - In the world: a chevron hanging at chest height a couple of paces AHEAD
 *     of the player along the route, pointing along it, and breathing gently.
 *     It is a lamp (it is lit from inside), so it is filament amber and
 *     nothing about it blooms.
 *   - On the glass: a small plate under the HUD with the destination's name,
 *     the distance, and a chevron turned to the bearing of the next leg — so
 *     the way is known even with the chevron behind you.
 *
 * The route is a polyline in the scene's own coordinates. The chevron is put
 * on it by projecting the player onto the nearest leg and walking a fixed
 * distance further along, so it never points back the way they came and it
 * always turns the corner before they reach it.
 */

import * as THREE from "three";

const LEAD = 2.1;          // metres ahead of the player along the route
const ARRIVE = 1.4;        // within this of the end, the chevron points at the target

function chevronGeometry() {
  // A flat chevron in the x–y plane pointing along +x, then extruded thin.
  const s = new THREE.Shape();
  s.moveTo(0.22, 0);
  s.lineTo(-0.1, 0.2);
  s.lineTo(-0.2, 0.2);
  s.lineTo(0.06, 0);
  s.lineTo(-0.2, -0.2);
  s.lineTo(-0.1, -0.2);
  s.lineTo(0.22, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: false });
  g.translate(0, 0, -0.0175);
  // Lie it down (face up), then turn it to point along +z. The pivot tilts it
  // toward the viewer so it reads from standing height.
  g.rotateX(-Math.PI / 2);
  g.rotateY(-Math.PI / 2);
  return g;
}

export class GuideArrow {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'guide-arrow';
    const geo = chevronGeometry();
    this.lampMat = new THREE.MeshBasicMaterial({ color: 0xe59b24 });
    this.dimMat = new THREE.MeshBasicMaterial({ color: 0x7a4f14 });
    // Two chevrons in file, the rear one dimmer: reads as "this way" at a glance.
    this.front = new THREE.Mesh(geo, this.lampMat);
    this.back = new THREE.Mesh(geo, this.dimMat);
    this.front.position.z = 0.18;
    this.back.position.z = -0.18;
    this.pivot = new THREE.Group();
    this.pivot.add(this.front, this.back);
    this.pivot.rotation.x = -0.55;   // raised toward a standing eye
    this.group.add(this.pivot);
    this.group.visible = false;
    this.group.renderOrder = 2;

    this.route = null;
    this.label = '';
    this.heightFn = null;
    this.hover = 1.15;
    this.scene = null;
    this.chip = null;
    this._dir = new THREE.Vector3();
    this._fwd = new THREE.Vector3();
  }

  /**
   * Lead along `points` ([x, z] or {x, z}) in `scene`. `heightFn(x, z)` is
   * the ground under a point (null aboard, where the deck is y = 0), and
   * `hover` how high above it the chevron hangs.
   */
  show(scene, points, { label = '', heightFn = null, hover = 1.15, onArrive = null } = {}) {
    this.hide();
    this.scene = scene;
    this.route = points.map(p => Array.isArray(p) ? { x: p[0], z: p[1] } : { x: p.x, z: p.z });
    this.label = label;
    this.heightFn = heightFn;
    this.hover = hover;
    this.onArrive = onArrive;
    this.arrived = false;
    scene.add(this.group);
    this.group.visible = true;
    this._ensureChip();
    this.chip.querySelector('.voyage-guide-label').textContent = label;
    this.chip.hidden = false;
  }

  hide() {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.group.visible = false;
    this.route = null;
    this.scene = null;
    if (this.chip) this.chip.hidden = true;
  }

  get active() { return Boolean(this.route); }

  _ensureChip() {
    if (this.chip || typeof document === 'undefined') return;
    const el = document.createElement('div');
    el.className = 'voyage-guide';
    el.setAttribute('role', 'status');
    el.innerHTML = `
      <svg class="voyage-guide-dial" viewBox="-12 -12 24 24" aria-hidden="true">
        <circle r="10.5" class="voyage-guide-ring"></circle>
        <path class="voyage-guide-chev" d="M0 -7 L6 2 L3 2 L0 -2.5 L-3 2 L-6 2 Z"></path>
      </svg>
      <span class="voyage-guide-text">
        <span class="voyage-guide-label"></span>
        <span class="voyage-guide-dist"></span>
      </span>`;
    el.hidden = true;
    document.body.appendChild(el);
    this.chip = el;
  }

  /** Where along the route the player is: the nearest point, as a distance along it. */
  _progress(px, pz) {
    const R = this.route;
    let best = Infinity, bestS = 0, s = 0;
    for (let i = 0; i < R.length - 1; i++) {
      const a = R[i], b = R[i + 1];
      const dx = b.x - a.x, dz = b.z - a.z;
      const L2 = dx * dx + dz * dz || 1e-6;
      const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (pz - a.z) * dz) / L2));
      const qx = a.x + dx * t, qz = a.z + dz * t;
      const d = Math.hypot(px - qx, pz - qz);
      if (d < best) { best = d; bestS = s + Math.sqrt(L2) * t; }
      s += Math.sqrt(L2);
    }
    return { s: bestS, total: s };
  }

  /** The point and heading at distance `s` along the route. */
  _at(s) {
    const R = this.route;
    let acc = 0;
    for (let i = 0; i < R.length - 1; i++) {
      const a = R[i], b = R[i + 1];
      const L = Math.hypot(b.x - a.x, b.z - a.z);
      if (s <= acc + L || i === R.length - 2) {
        const t = L > 0 ? Math.max(0, Math.min(1, (s - acc) / L)) : 0;
        return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, hx: (b.x - a.x) / (L || 1), hz: (b.z - a.z) / (L || 1) };
      }
      acc += L;
    }
    const e = R[R.length - 1];
    return { x: e.x, z: e.z, hx: 0, hz: 1 };
  }

  /**
   * One frame. `camera` is in the same scene as the route (aboard: ship-local;
   * on the ground: world). Returns the distance left to the end of the route.
   */
  update(camera, time = 0) {
    if (!this.route) return Infinity;
    const cp = camera.position;
    const { s, total } = this._progress(cp.x, cp.z);
    const end = this.route[this.route.length - 1];
    const left = Math.hypot(end.x - cp.x, end.z - cp.z);
    const remaining = Math.max(left, total - s);

    let p;
    if (remaining < ARRIVE + LEAD) {
      // Nearly there: hang the chevron at the end and point it at the target.
      const prev = this.route[this.route.length - 2] || { x: cp.x, z: cp.z };
      const L = Math.hypot(end.x - prev.x, end.z - prev.z) || 1;
      p = { x: end.x, z: end.z, hx: (end.x - prev.x) / L, hz: (end.z - prev.z) / L };
    } else {
      p = this._at(Math.min(total, s + LEAD));
    }
    // Close enough to touch the target: the chevron would only be in the way
    // of it. The plate on the glass still says where it is.
    this.pivot.visible = left > 2.0;
    const ground = this.heightFn ? this.heightFn(p.x, p.z) : 0;
    this.group.position.set(p.x, ground + this.hover + Math.sin(time * 2.2) * 0.05, p.z);
    this.group.rotation.y = Math.atan2(p.hx, p.hz);
    // A slow filament breath, never a strobe.
    const k = 0.75 + 0.25 * Math.sin(time * 3.1);
    this.lampMat.color.setRGB(0.9 * k, 0.61 * k, 0.14 * k).convertSRGBToLinear();

    if (this.chip) {
      // Bearing of the chevron from where the player is facing.
      camera.getWorldDirection(this._fwd);
      const fwdYaw = Math.atan2(this._fwd.x, this._fwd.z);
      const tx = this.group.position.x - cp.x, tz = this.group.position.z - cp.z;
      const toYaw = Math.atan2(tx, tz);
      let rel = toYaw - fwdYaw;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      // Screen clockwise is a turn to the right, which is a negative yaw here.
      const deg = (-rel * 180) / Math.PI;
      const chev = this.chip.querySelector('.voyage-guide-chev');
      if (chev) chev.setAttribute('transform', `rotate(${deg.toFixed(1)})`);
      const dist = this.chip.querySelector('.voyage-guide-dist');
      if (dist) dist.textContent = `${Math.max(0, Math.round(remaining))} M`;
    }

    if (!this.arrived && left < ARRIVE) {
      this.arrived = true;
      this.onArrive?.();
    }
    return remaining;
  }
}
