/**
 * tier.js — 3D graphics mode probe and runtime management
 * 2 Settings:
 * - 3D On: Full WebGL2/WebGL 3D experience (60fps, continuous walk, dust particles, full-res worlds).
 * - 3D Off: Non-WebGL 2D Fallback (DOM-only, zero GPU load).
 *
 * For backwards compatibility with shaders, stage lighting, and tests:
 * - 3D On maps internally to T4.
 * - 3D Off maps internally to T1.
 */

import { session } from '../session.js';

/** Bumped when a change to the probe invalidates tiers stored by older builds. */
const TIER_REV_KEY = 'avalon_gfx_rev';
const TIER_REV = '4';

export const TIER_RANKS = {
  T1: 1,
  T2: 2,
  T3: 3,
  T4: 4
};

export function tierAtLeast(requiredTier, currentTier = tierManager.currentTier) {
  return (TIER_RANKS[currentTier] || 1) >= (TIER_RANKS[requiredTier] || 1);
}

/**
 * True when the primary input is a finger.
 */
export function isTouchPrimary() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
  const fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  return !fine && (navigator.maxTouchPoints || 0) > 0;
}

/**
 * Device capability probe for 3D support.
 */
export function is3DCapable() {
  if (typeof window === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    if (!c.getContext('webgl2') && !c.getContext('webgl')) return false;
  } catch (e) {
    return false;
  }
  return true;
}

export function isT4Capable() {
  return is3DCapable();
}

export function is3DEligible() {
  return is3DCapable();
}

export function isT4Eligible() {
  return is3DCapable();
}

export function is3DEnabled() {
  return tierManager.is3D();
}

class TierManager {
  constructor() {
    this.currentTier = 'T4';
    this.probeComplete = false;
    this.listeners = new Set();
  }

  /**
   * Migrate legacy tier settings (T2/T3) from older builds into 3D On ('T4').
   */
  migrateStoredTier() {
    let done = false;
    try { done = localStorage.getItem(TIER_REV_KEY) === TIER_REV; } catch (e) { return; }
    if (done) return;
    try { localStorage.setItem(TIER_REV_KEY, TIER_REV); } catch (e) {}

    // Legacy T2 or T3 preference becomes T4 (3D On)
    if (session.gfxTierPref && (session.gfxTierPref === 'T2' || session.gfxTierPref === 'T3')) {
      session.setGfxTier('T4', true);
    }
  }

  init() {
    this.migrateStoredTier();

    const pref = session.gfxTierPref;
    if (pref === 'T1' || pref === 'off') {
      this.setTier('T1');
      this.probeComplete = true;
      return;
    }
    if (pref === 'T4' || pref === 'T3' || pref === 'T2' || pref === 'on') {
      this.setTier(is3DCapable() ? 'T4' : 'T1');
      this.probeComplete = true;
      return;
    }

    // Default: Check WebGL availability
    if (is3DCapable()) {
      this.setTier('T4');
    } else {
      this.setTier('T1');
    }
    this.probeComplete = true;
  }

  recordFrame() {}

  is3D() {
    return this.currentTier !== 'T1';
  }

  set3D(enabled, opts = {}) {
    this.setTier(enabled ? 'T4' : 'T1', opts);
  }

  choose3D(enabled) {
    this.set3D(enabled, { persist: true });
  }

  toggle3D() {
    this.choose3D(!this.is3D());
  }

  cycleTier() {
    this.toggle3D();
  }

  /**
   * @param {string|boolean} tier
   * @param {{persist?: boolean}} [opts]
   */
  setTier(tier, opts = {}) {
    if (tier === 'on' || tier === true || tier === 'T2' || tier === 'T3') tier = 'T4';
    if (tier === 'off' || tier === false) tier = 'T1';
    if (tier !== 'T1' && tier !== 'T4') return;

    this.currentTier = tier;
    session.setGfxTier(tier, Boolean(opts.persist));

    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('tier-t4', tier === 'T4');
    }

    // Toggle backdrop visibility
    const fallbackEl = document.getElementById('fallback-backdrop');
    const canvasEl = document.getElementById('webgl-canvas');
    if (fallbackEl && canvasEl) {
      if (tier === 'T1') {
        fallbackEl.classList.remove('hidden');
        canvasEl.classList.add('hidden');
      } else {
        fallbackEl.classList.add('hidden');
        canvasEl.classList.remove('hidden');
      }
    }

    const label = document.getElementById('gfx-tier-label');
    if (label) label.textContent = tier === 'T1' ? '3D OFF' : '3D ON';

    const dot = document.querySelector('.gfx-dot');
    if (dot) dot.classList.toggle('is-off', tier === 'T1');

    for (const fn of this.listeners) {
      try { fn(tier); } catch (e) {}
    }
  }

  chooseTier(tier) {
    this.setTier(tier, { persist: true });
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const tierManager = new TierManager();

