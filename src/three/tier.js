/**
 * tier.js — Graphics quality tier probe and runtime management
 * T4 = Enhanced / Ultra (60fps, continuous walk, dust particles, full-res world)
 * T3 = High / Desktop (60fps, procedural interior, graph traversal)
 * T2 = Standard / Chromebook / Mobile (30fps, DPR 1, stills fallback)
 * T1 = Non-WebGL Fallback (DOM-only, zero GPU load)
 */

import { session } from '../session.js';

export const TIER_RANKS = {
  T1: 1,
  T2: 2,
  T3: 3,
  T4: 4
};

export function tierAtLeast(requiredTier, currentTier = tierManager.currentTier) {
  return (TIER_RANKS[currentTier] || 1) >= (TIER_RANKS[requiredTier] || 1);
}

export function isT4Eligible() {
  if (typeof window === 'undefined') return false;

  // 1. WebGL2 present
  try {
    const c = document.createElement('canvas');
    if (!c.getContext('webgl2')) return false;
  } catch (e) {
    return false;
  }

  // 2. Not coarse pointer (no touch-only phones/tablets)
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    return false;
  }

  // 3. Hardware concurrency >= 8
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 8) {
    return false;
  }

  // 4. Device memory >= 8 if reported
  if (navigator.deviceMemory && navigator.deviceMemory < 8) {
    return false;
  }

  // 5. DPR <= 2
  if (window.devicePixelRatio && window.devicePixelRatio > 2.0) {
    return false;
  }

  // 6. T4 not previously downgraded in this session
  if (session.t4Downgraded) {
    return false;
  }

  return true;
}

class TierManager {
  constructor() {
    this.currentTier = 'T3';
    this.probeComplete = false;
    this.frameTimes = [];
    this.probeFrames = 90;
    this.listeners = new Set();
  }

  init() {
    const pref = session.gfxTier;
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

    // GPU vendor probe — ceiling is strictly T3 (never auto-probe into T4)
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    let renderer = '';
    if (debugInfo) {
      renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    }

    const isMobileOrSlow = /mali|adreno|powervr|intel|chromebook/i.test(renderer) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      (window.devicePixelRatio && window.devicePixelRatio > 2.5);

    if (isMobileOrSlow) {
      this.setTier('T2');
    } else {
      this.setTier('T3');
    }
  }

  // Record a frame timestamp during boot probe or runtime downgrade monitoring
  recordFrame(now) {
    if (this.probeComplete) {
      // Monitor runtime performance for downgrades
      if (this.frameTimes.length > 120) this.frameTimes.shift();
      this.frameTimes.push(now);

      if (this.frameTimes.length >= 60) {
        const delta = this.frameTimes[this.frameTimes.length - 1] - this.frameTimes[0];
        const fps = (1000 * (this.frameTimes.length - 1)) / delta;

        if (fps < 24 && this.currentTier === 'T4') {
          session.t4Downgraded = true;
          this.setTier('T3');
        } else if (fps < 24 && this.currentTier === 'T3') {
          this.setTier('T2');
        } else if (fps < 15 && this.currentTier === 'T2') {
          this.setTier('T1');
        }
      }
      return;
    }

    this.frameTimes.push(now);
    if (this.frameTimes.length >= this.probeFrames) {
      let total = 0;
      for (let i = 1; i < this.frameTimes.length; i++) {
        total += (this.frameTimes[i] - this.frameTimes[i - 1]);
      }
      const avgMs = total / (this.frameTimes.length - 1);
      const fps = 1000 / avgMs;

      if (fps < 24 && this.currentTier === 'T3') {
        this.setTier('T2');
      } else if (fps < 15 && this.currentTier === 'T2') {
        this.setTier('T1');
      }
      this.probeComplete = true;
    }
  }

  setTier(tier) {
    if (tier !== 'T1' && tier !== 'T2' && tier !== 'T3' && tier !== 'T4') return;
    this.currentTier = tier;
    session.setGfxTier(tier);

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

  cycleTier() {
    let next;
    if (this.currentTier === 'T4') {
      next = 'T3';
    } else if (this.currentTier === 'T3') {
      next = 'T2';
    } else if (this.currentTier === 'T2') {
      next = 'T1';
    } else {
      next = isT4Eligible() ? 'T4' : 'T3';
    }
    this.setTier(next);
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const tierManager = new TierManager();
