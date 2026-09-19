/**
 * touch-controls.js — Twin virtual sticks and action keys for the T4 walk on a phone.
 *
 * A phone can render the walk; it cannot press W or swing a mouse. This mounts
 * the two things that replace them: a 360-degree look stick in the bottom-left
 * corner and a 360-degree move stick in the bottom-right, plus the two keys a
 * walk needs that a finger otherwise has no way to press — USE and JUMP.
 *
 * Both sticks float: the ring jumps to wherever the thumb lands inside its
 * corner zone, because a fixed centre is only reachable if you looked first.
 * Deflection is analogue — a half-pushed move stick walks at half speed, and a
 * move stick pushed to the rim sprints.
 *
 * The sticks feed `FpsControls.analogMove` / `.analogLook`, which the walk
 * consumes per frame exactly as it consumes W/A/S/D and mouse delta, so nothing
 * downstream — collision, terrain, interaction prompts — knows the difference.
 */

const HOME = { x: 81, y: 82 };   // stick home centre, matching .tc-ring in mobile-game.css
const TRAVEL = 46;               // px of knob travel at full deflection
const DEADZONE = 0.14;           // fraction of travel ignored, so a resting thumb is still

/** Overlays that own the screen; the sticks stand down while one is up. */
const BLOCKING = [
  '.in-world-terminal',
  '.deployed-chamber-overlay',
  '.cinematic-overlay',
  '.screen-container',
  '.lq'
].join(',');

export class TouchControls {
  constructor(fpsControls) {
    this.fps = fpsControls;
    this.root = null;
    this.visible = false;
    this.zones = {};
    this.pointers = new Map(); // pointerId -> stick name
    this.interactKey = null;
    this.jumpKey = null;
    this.interactArmed = false;

    this.build();

    this._onPointerDown = this.onPointerDown.bind(this);
    this._onPointerMove = this.onPointerMove.bind(this);
    this._onPointerUp = this.onPointerUp.bind(this);

    this.root.addEventListener('pointerdown', this._onPointerDown, { passive: false });
    window.addEventListener('pointermove', this._onPointerMove, { passive: false });
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
  }

  build() {
    const root = document.createElement('div');
    root.className = 'touch-controls hidden';
    root.innerHTML = `
      <div class="tc-zone tc-zone-look" data-stick="look">
        <div class="tc-ring">
          <span class="tc-ring-label">LOOK</span>
          <div class="tc-knob"></div>
        </div>
      </div>
      <div class="tc-keys">
        <button type="button" class="tc-key" data-key="interact" disabled>USE</button>
        <button type="button" class="tc-key" data-key="jump">JUMP</button>
      </div>
      <div class="tc-zone tc-zone-move" data-stick="move">
        <div class="tc-ring">
          <span class="tc-ring-label">MOVE</span>
          <div class="tc-knob"></div>
        </div>
      </div>
    `;
    document.body.appendChild(root);
    this.root = root;

    for (const el of root.querySelectorAll('.tc-zone')) {
      const name = el.getAttribute('data-stick');
      this.zones[name] = {
        el,
        ring: el.querySelector('.tc-ring'),
        knob: el.querySelector('.tc-knob'),
        pointerId: null,
        origin: { x: 0, y: 0 }
      };
      this.homeRing(this.zones[name]);
    }

    this.interactKey = root.querySelector('[data-key="interact"]');
    this.jumpKey = root.querySelector('[data-key="jump"]');

    this.interactKey.addEventListener('click', () => {
      if (this.fps && this.fps.onInteract) this.fps.onInteract();
    });
    this.jumpKey.addEventListener('click', () => {
      if (this.fps) this.fps.requestJump();
    });
  }

  homeRing(z) {
    z.ring.style.left = `${HOME.x}px`;
    z.ring.style.top = `${HOME.y}px`;
    z.knob.style.transform = 'translate(-50%, -50%)';
    z.el.classList.remove('active');
  }

  onPointerDown(e) {
    const zoneEl = e.target.closest ? e.target.closest('.tc-zone') : null;
    if (!zoneEl) return; // a key press, handled by its own click listener
    const name = zoneEl.getAttribute('data-stick');
    const z = this.zones[name];
    if (!z || z.pointerId !== null) return;

    e.preventDefault(); // also suppresses the synthetic mouse events that follow

    const rect = zoneEl.getBoundingClientRect();
    // Capture so the stick keeps the finger even when it slides off the zone,
    // and so a pointerup always arrives rather than a cancel.
    try { zoneEl.setPointerCapture(e.pointerId); } catch (err) {}
    z.pointerId = e.pointerId;
    z.origin = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    z.ring.style.left = `${z.origin.x}px`;
    z.ring.style.top = `${z.origin.y}px`;
    z.el.classList.add('active');
    this.pointers.set(e.pointerId, name);
    this.applyStick(name, 0, 0);
  }

  onPointerMove(e) {
    const name = this.pointers.get(e.pointerId);
    if (!name) return;
    const z = this.zones[name];
    const rect = z.el.getBoundingClientRect();
    let dx = (e.clientX - rect.left) - z.origin.x;
    let dy = (e.clientY - rect.top) - z.origin.y;

    const dist = Math.hypot(dx, dy);
    if (dist > TRAVEL) {
      dx = (dx / dist) * TRAVEL;
      dy = (dy / dist) * TRAVEL;
    }
    z.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    this.applyStick(name, dx / TRAVEL, dy / TRAVEL);
    e.preventDefault();
  }

  onPointerUp(e) {
    const name = this.pointers.get(e.pointerId);
    if (!name) return;
    this.pointers.delete(e.pointerId);
    const z = this.zones[name];
    try { z.el.releasePointerCapture(e.pointerId); } catch (err) {}
    z.pointerId = null;
    this.homeRing(z);
    this.applyStick(name, 0, 0);
  }

  /** x/y are -1..1 deflections; the deadzone is rescaled so the edge stays 1. */
  applyStick(name, x, y) {
    if (!this.fps) return;
    const mag = Math.hypot(x, y);
    let ax = 0;
    let ay = 0;
    if (mag > DEADZONE) {
      const scaled = Math.min(1, (mag - DEADZONE) / (1 - DEADZONE));
      ax = (x / mag) * scaled;
      ay = (y / mag) * scaled;
    }

    if (name === 'move') {
      // Screen up is forward; the walk's forward axis is +y.
      this.fps.analogMove.x = ax;
      this.fps.analogMove.y = -ay;
      this.fps.analogSprint = Math.hypot(ax, ay) > 0.9;
    } else {
      this.fps.analogLook.x = ax;
      this.fps.analogLook.y = ay;
    }
  }

  /** Release every axis — used when the sticks go away mid-push. */
  neutral() {
    for (const name of Object.keys(this.zones)) {
      const z = this.zones[name];
      if (z.pointerId !== null) this.pointers.delete(z.pointerId);
      z.pointerId = null;
      this.homeRing(z);
    }
    if (this.fps) {
      this.fps.analogMove.x = 0;
      this.fps.analogMove.y = 0;
      this.fps.analogLook.x = 0;
      this.fps.analogLook.y = 0;
      this.fps.analogSprint = false;
    }
  }

  /** The USE key lights only while the world is offering something to use. */
  setInteractAvailable(available) {
    const on = Boolean(available);
    if (on === this.interactArmed) return;
    this.interactArmed = on;
    this.interactKey.disabled = !on;
    this.interactKey.classList.toggle('armed', on);
  }

  setVisible(visible) {
    const on = Boolean(visible);
    if (on === this.visible) return;
    this.visible = on;
    this.root.classList.toggle('hidden', !on);
    document.body.classList.toggle('touch-walking', on);
    if (!on) this.neutral();
  }

  /** True when a full-screen overlay is up and the walk is not the foreground. */
  static overlayBlocking() {
    if (typeof document === 'undefined') return false;
    const modal = document.getElementById('modal-container');
    if (modal && !modal.classList.contains('hidden') && modal.childElementCount > 0) return true;
    return Boolean(document.querySelector(BLOCKING));
  }

  dispose() {
    this.neutral();
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerUp);
    document.body.classList.remove('touch-walking');
    if (this.root && this.root.parentNode) this.root.parentNode.removeChild(this.root);
    this.root = null;
  }
}
