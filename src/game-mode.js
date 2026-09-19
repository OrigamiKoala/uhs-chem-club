/**
 * game-mode.js — Full-screen play on a handset.
 *
 * On a phone the browser chrome costs about a fifth of the screen and the
 * address bar eats the bottom-right corner, which is exactly where the move
 * stick lives. Game mode takes the screen.
 *
 * Three routes, in the order they are tried:
 *   1. The Fullscreen API, which must be asked for inside a user gesture — so
 *      the only callers are a button press and the navigation into a world.
 *      Android Chrome, Firefox, iPadOS and current iPhone Safari all honour
 *      it. Feature-detected, never sniffed for a browser or a version.
 *   2. Installed to the Home Screen. `manifest.webmanifest` plus
 *      `apple-mobile-web-app-capable` mean an installed Avalon launches with
 *      no address bar and nothing to hide; `isStandalone()` detects that and
 *      reports game mode as already on.
 *   3. Neither. The layout still goes full-bleed against the *small* viewport
 *      (`100dvh`), so the sticks sit above the toolbar rather than under it,
 *      and the player is told once how to install.
 *
 * Route 3 is where an older iPhone lands — Safari had the Fullscreen API for
 * `<video>` only (`HTMLVideoElement.webkitEnterFullscreen`, which is how a
 * video site takes the screen there) and not for an arbitrary element. That
 * path is no use to a WebGL canvas: it accepts a `<video>` and nothing else,
 * and piping the canvas through `captureStream()` into one would hand back a
 * one-way picture with no touch mapping. So it is not attempted.
 *
 * `body.game-mode` is the single hook the stylesheets key off.
 */

import { showToast } from './ui/toast.js';

const HINT_KEY = 'avalon_fs_hint_shown';

function el() {
  return document.documentElement;
}

export const gameMode = {
  active: false,
  armed: false,
  /** One arm per page load. A player who leaves full screen stays out of it. */
  armUsed: false,
  _armedFire: null,
  listeners: new Set(),

  /** The Fullscreen API is present and permitted on this element. */
  canFullscreen() {
    if (typeof document === 'undefined') return false;
    const d = document;
    const root = el();
    const has = Boolean(root.requestFullscreen || root.webkitRequestFullscreen);
    const allowed = d.fullscreenEnabled !== false && d.webkitFullscreenEnabled !== false;
    return has && allowed;
  },

  /** Launched from the Home Screen / as an installed app: no chrome to hide. */
  isStandalone() {
    if (typeof window === 'undefined') return false;
    if (window.navigator && window.navigator.standalone === true) return true;
    return Boolean(
      window.matchMedia &&
      (window.matchMedia('(display-mode: standalone)').matches ||
       window.matchMedia('(display-mode: fullscreen)').matches)
    );
  },

  isFullscreen() {
    if (typeof document === 'undefined') return false;
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  },

  /**
   * Enter game mode. Must be called from a user gesture for the Fullscreen API
   * to be granted; a refusal is not a failure, the full-bleed layout stands on
   * its own.
   */
  async enter() {
    this.disarm();
    this.armUsed = true;
    if (this.isStandalone() || this.isFullscreen()) {
      this.setActive(true);
      return true;
    }

    if (this.canFullscreen()) {
      const root = el();
      try {
        if (root.requestFullscreen) {
          await root.requestFullscreen({ navigationUI: 'hide' });
        } else if (root.webkitRequestFullscreen) {
          root.webkitRequestFullscreen();
        }
        // `fullscreenchange` flips `active`; nothing to set here.
        return true;
      } catch (e) {
        // Denied, or this browser refuses the element — fall through.
      }
    }

    // No Fullscreen API, or it was refused. The full-bleed layout is still
    // worth having, and installing is then the one route that actually works.
    this.setActive(true);
    this.showInstallHint();
    return false;
  },

  /**
   * Offered when the player steps into a 3D world rather than waiting for the
   * key to be found. Only from a touch device, and only inside whatever
   * gesture navigated here — a request outside one is refused by the browser,
   * which is harmless.
   */
  autoEnter() {
    if (this.active) return Promise.resolve(false);
    if (typeof window === 'undefined') return Promise.resolve(false);
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (!coarse) return Promise.resolve(false);
    return this.enter();
  },

  /**
   * Arm a one-shot: the player's next tap anywhere takes the screen.
   *
   * The Fullscreen API is only granted inside a user gesture, and the gesture
   * that signs a player in is spent by the time the bridge exists — the request
   * waits behind `await api.login(...)`, and a browser that has since dropped
   * the activation refuses it without a word. A returning player with a stored
   * token makes no gesture at all: they arrive on the bridge from a page load.
   *
   * So the tap itself becomes the gesture. Whatever the player touches first —
   * a nav button, a panel, bare plate — is a trusted activation, and the
   * listener is spent on it. It costs the player nothing and asks nothing.
   */
  armOnNextGesture() {
    if (typeof document === 'undefined') return false;
    if (this.armed || this.armUsed) return false;
    if (this.active || this.isStandalone() || this.isFullscreen()) return false;
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (!coarse) return false;

    // No element full screen at all — an iPhone, where Safari has it for
    // `<video>` and nothing else (an iPad does have it). Route 3 is the whole of
    // game mode there and needs no gesture: the full-bleed layout goes on and
    // the install hint is shown once, exactly as stepping onto a planet does it.
    if (!this.canFullscreen()) {
      this.enter();
      return false;
    }

    this.armed = true;
    this.armUsed = true;
    const fire = () => {
      this.disarm();
      this.enter();
    };
    this._armedFire = fire;
    // `click` and `touchend` are the events every browser counts as an
    // activation; `pointerdown` is not honoured everywhere.
    document.addEventListener('click', fire, { capture: true, once: true });
    document.addEventListener('touchend', fire, { capture: true, once: true });
    return true;
  },

  disarm() {
    if (!this.armed) return;
    this.armed = false;
    const fire = this._armedFire;
    this._armedFire = null;
    if (!fire) return;
    document.removeEventListener('click', fire, { capture: true });
    document.removeEventListener('touchend', fire, { capture: true });
  },

  /**
   * Pin the handset sideways. A planet surface is a horizon, and a horizon in
   * a 375px-wide portrait window is a letterbox with two sticks in it.
   *
   * The Screen Orientation API only grants a lock to a document that is
   * already full screen, so this must run after `enter()` has resolved.
   * Support for the lock is narrower than support for full screen itself, so
   * treat a refusal as ordinary: nothing is said and nothing is shown, the
   * player turns the device or does not, and the walk works either way.
   */
  async lockLandscape() {
    try {
      const o = window.screen && window.screen.orientation;
      if (!o || !o.lock) return false;
      await o.lock('landscape');
      return true;
    } catch (e) {
      return false;
    }
  },

  unlockOrientation() {
    try {
      const o = window.screen && window.screen.orientation;
      if (o && o.unlock) o.unlock();
    } catch (e) {}
  },

  /** Stepping onto a planet: take the screen, then turn it sideways. */
  async enterWorld() {
    await this.autoEnter();
    return this.lockLandscape();
  },

  async exit() {
    this.disarm();
    this.setActive(false);
    this.unlockOrientation();
    if (!this.isFullscreen()) return;
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (e) {}
  },

  toggle() {
    return this.active ? this.exit() : this.enter();
  },

  setActive(on) {
    const next = Boolean(on);
    if (next === this.active) return;
    this.active = next;
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('game-mode', next);
    }
    for (const fn of this.listeners) {
      try { fn(next); } catch (e) {}
    }
  },

  /** Told once, and only where it is the actual route to a full screen. */
  showInstallHint() {
    let seen = false;
    try { seen = localStorage.getItem(HINT_KEY) === '1'; } catch (e) {}
    if (seen) return;
    try { localStorage.setItem(HINT_KEY, '1'); } catch (e) {}
    showToast('Full screen needs Avalon on your Home Screen: Share, then Add to Home Screen.', 'info', 7000);
  },

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },

  /**
   * Wire up once at boot. Keeps `active` honest when the player leaves full
   * screen by a system gesture rather than by the key, and treats an installed
   * launch as game mode from the first frame.
   */
  init() {
    if (typeof document === 'undefined') return;

    // Only the browsers that actually have the Fullscreen API get their state
    // read back from it. Where there is none, `active` is whatever enter() and
    // exit() last set, and reading `isFullscreen()` would clear it every time.
    const sync = () => {
      if (this.isStandalone()) this.setActive(true);
      else if (this.canFullscreen()) this.setActive(this.isFullscreen());
    };

    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    sync();
  }
};
