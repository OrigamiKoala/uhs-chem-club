/**
 * tier.js — Graphics quality tier probe and runtime management
 * T4 = Enhanced / Ultra (60fps, continuous walk, dust particles, full-res world)
 * T3 = High / Desktop (60fps, procedural interior, graph traversal)
 * T2 = Standard / Chromebook / Mobile (30fps, DPR 1, stills fallback)
 * T1 = Non-WebGL Fallback (DOM-only, zero GPU load)
 *
 * A phone is not disqualified from T4 by being a phone. A 2020-or-later handset
 * runs the walk at 60fps; what it cannot do is a mouse, so T4 on a touch device
 * is driven by the twin sticks in `touch-controls.js` instead. The capability
 * probe below asks about the GPU and the cores.
 *
 * THE TIER IS DECIDED ONCE, WHEN THE PAGE OPENS, AND KEPT. Nothing measures
 * frames and demotes mid-session any more: a tier change rebuilds render
 * settings under whatever the player is doing — a voyage, a bench, a walk —
 * and a slow stretch (a world building, shaders compiling) is not evidence
 * about the device. Only the player changes it after boot, by choosing.
 */

import { session } from '../session.js';

/** Bumped when a change to the probe invalidates tiers stored by older builds. */
const TIER_REV_KEY = 'avalon_gfx_rev';
const TIER_REV = '3';

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
 * True when the primary input is a finger. This is the one thing that actually
 * differs about T4 on a phone: there is no mouse to look with and no keyboard
 * to walk with, so the twin sticks mount and the look/move rig switches over.
 * It is never a reason on its own to refuse T4.
 */
export function isTouchPrimary() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
  const fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  return !fine && (navigator.maxTouchPoints || 0) > 0;
}

/**
 * What the *device* can do, ignoring anything that happened this page session.
 * Settings and the HUD chip ask this, so a handset that dipped below 24fps once
 * can still be put back on T4 by hand.
 */
export function isT4Capable() {
  if (typeof window === 'undefined') return false;

  // 1. WebGL2 present
  try {
    const c = document.createElement('canvas');
    if (!c.getContext('webgl2')) return false;
  } catch (e) {
    return false;
  }

  // 2. Hardware concurrency >= 4. Every phone that can carry the walk reports
  //    at least this; the ones that report less are the ones that cannot.
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return false;
  }

  // 3. Device memory >= 4 if reported (Chrome only; Safari omits it)
  if (navigator.deviceMemory && navigator.deviceMemory < 4) {
    return false;
  }

  return true;
}

/** Kept for callers that ask; with no runtime demotion it is just capability. */
export function isT4Eligible() {
  return isT4Capable();
}

class TierManager {
  constructor() {
    this.currentTier = 'T4';
    this.probeComplete = false;
    this.listeners = new Set();
  }

  /**
   * One-time correction for a stored tier that the *old* probe wrote.
   *
   * T4 used to be refused to every coarse-pointer device outright, and the
   * refusal was persisted as T3 — so a phone that got the old build carries a
   * stored T3 and would never see T4 again, however capable it is. This clears
   * exactly that case, once, and leaves every other stored preference alone:
   * a desktop choice, a phone that is genuinely not T4-capable, and a phone
   * that chooses T3 after this has run are all untouched.
   */
  migrateStoredTier() {
    let done = false;
    try { done = localStorage.getItem(TIER_REV_KEY) === TIER_REV; } catch (e) { return; }
    if (done) return;
    try { localStorage.setItem(TIER_REV_KEY, TIER_REV); } catch (e) {}

    // Any sub-T4 tier a *phone* carries from an older build was written for it,
    // not chosen by it: T4 was refused to every coarse pointer outright, and a
    // single slow load cascaded a capable handset down to the 2D stills. Clear
    // it and let this build look at the device again. A desktop's stored choice
    // and a phone that genuinely cannot hold T4 are both left alone.
    if (isTouchPrimary() && session.gfxTierPref && session.gfxTierPref !== 'T4' && isT4Capable()) {
      session.clearGfxTierPref();
    }
  }

  init() {
    this.migrateStoredTier();

    // A tier the player chose is honoured, and the device is not re-probed for
    // it. Only a choice reaches here: an automatic tier is never written.
    const pref = session.gfxTierPref;
    if (pref === 'T1' || pref === 'T2' || pref === 'T3' || pref === 'T4') {
      if (pref === 'T4' && !isT4Eligible()) {
        this.setTier('T3');
      } else {
        this.setTier(pref);
      }
      this.probeComplete = true;
      return;
    }

    // Check WebGL2 availability
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      this.setTier('T1');
      this.probeComplete = true;
      return;
    }

    // Default to T4 if eligible, else T3 / T2
    if (isT4Eligible()) {
      this.setTier('T4');
    } else {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      let renderer = '';
      if (debugInfo) {
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      }

      // Apple's mobile GPU is not in this list and must not be added to it: a
      // recent iPhone carries the walk, and a renderer string is not a frame
      // rate.
      const isMobileOrSlow = /mali|adreno|powervr|chromebook/i.test(renderer) ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);

      if (isMobileOrSlow) {
        this.setTier('T2');
      } else {
        this.setTier('T3');
      }
    }
    this.probeComplete = true;
  }

  /**
   * The render loop still reports every frame here. It is deliberately a
   * no-op: the tier is fixed at boot (see the header), and a frame monitor that
   * demoted mid-session once swapped a player's renderer out from under a
   * voyage.
   */
  recordFrame() {}

  /**
   * @param {string} tier
   * @param {{persist?: boolean}} [opts] `persist` only when the player picked
   *   it; use `chooseTier` for that rather than passing it by hand.
   */
  setTier(tier, opts = {}) {
    if (tier !== 'T1' && tier !== 'T2' && tier !== 'T3' && tier !== 'T4') return;
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
    if (label) label.textContent = tier;

    for (const fn of this.listeners) {
      try { fn(tier); } catch (e) {}
    }
  }

  /**
   * The player picked this tier — in Settings or with the HUD chip. This is the
   * only path that writes the preference, and the only way the tier changes
   * after boot.
   */
  chooseTier(tier) {
    this.setTier(tier, { persist: true });
  }

  cycleTier() {
    let next;
    if (this.currentTier === 'T4') {
      next = 'T3';
    } else if (this.currentTier === 'T3') {
      next = 'T2';
    } else if (this.currentTier === 'T2') {
      next = 'T1';
    } else {
      next = isT4Capable() ? 'T4' : 'T3';
    }
    this.chooseTier(next);
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const tierManager = new TierManager();
