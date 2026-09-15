/**
 * tier.js — Graphics quality tier probe and runtime management
 * T3 = High / Desktop (60fps)
 * T2 = Standard / Chromebook / Mobile (30fps, DPR 1, no post)
 * T1 = Non-WebGL Fallback (DOM-only, zero GPU load)
 */

import { session } from '../session.js';

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
    if (pref === 'T1' || pref === 'T2' || pref === 'T3') {
      this.setTier(pref);
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

    // GPU vendor probe
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

  // Record a frame timestamp during boot probe
  recordFrame(now) {
    if (this.probeComplete) return;
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
    if (tier !== 'T1' && tier !== 'T2' && tier !== 'T3') return;
    this.currentTier = tier;
    session.setGfxTier(tier);

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
    const next = this.currentTier === 'T3' ? 'T2' : this.currentTier === 'T2' ? 'T1' : 'T3';
    this.setTier(next);
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const tierManager = new TierManager();
