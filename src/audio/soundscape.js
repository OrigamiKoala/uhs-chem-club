/**
 * soundscape.js — Web Audio sound engine for Avalon.
 *
 * Provides physical ship hum, room tints, UI foley, game reaction audio,
 * and Vess radio murmur. Uses pure Web Audio synthesis so it works immediately
 * with zero missing-file latency or 404s.
 */

import { session } from '../session.js';

class Soundscape {
  constructor() {
    this.ctx = null;
    this.unlocked = false;

    this.masterGain = null;
    this.ambienceGain = null;
    this.effectsGain = null;
    this.duckGain = null;

    // Active ambient nodes
    this.currentRoom = null;
    this.bedOsc1 = null;
    this.bedOsc2 = null;
    this.bedNoiseNode = null;
    this.roomTintNode = null;

    // Active murmur
    this.murmurTimer = null;
    this.murmurGain = null;

    this._bindUnlock();
  }

  _bindUnlock() {
    const unlock = () => {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    window.addEventListener('touchstart', unlock, { once: false });
  }

  initContext() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();

      // Master
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      // Ambience (duckable)
      this.duckGain = this.ctx.createGain();
      this.duckGain.connect(this.masterGain);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.connect(this.duckGain);

      // Effects
      this.effectsGain = this.ctx.createGain();
      this.effectsGain.connect(this.masterGain);

      this.unlocked = true;
      this.updateVolumes();

      // Subscribe to session changes
      session.subscribe(() => {
        this.updateVolumes();
      });
    } catch (e) {
      console.warn('Web Audio initialization failed:', e);
    }
  }

  updateVolumes() {
    if (!this.ctx) return;
    const s = session.sound || { master: 60, ambience: 60, effects: 60, muted: false };
    const now = this.ctx.currentTime;

    const masterVal = s.muted ? 0 : (s.master / 100) * 0.8;
    const ambVal = (s.ambience / 100) * 0.7;
    const fxVal = (s.effects / 100) * 0.85;

    this.masterGain?.gain.setTargetAtTime(masterVal, now, 0.05);
    this.ambienceGain?.gain.setTargetAtTime(ambVal, now, 0.05);
    this.effectsGain?.gain.setTargetAtTime(fxVal, now, 0.05);
  }

  duckBed(ducked = true) {
    if (!this.ctx || !this.duckGain) return;
    const now = this.ctx.currentTime;
    this.duckGain.gain.setTargetAtTime(ducked ? 0.25 : 1.0, now, 0.15);
  }

  // --- Ambient Ship Bed & Room Tints ---

  setRoom(room) {
    if (!room || room === this.currentRoom) return;
    this.currentRoom = room;
    this.initContext();
    if (!this.ctx || session.sound?.muted) return;

    this._crossfadeBed(room);
  }

  _crossfadeBed(room) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Stop old bed gently if running
    if (this.bedOsc1) {
      try {
        this.bedOsc1.stop(now + 0.8);
        this.bedOsc2?.stop(now + 0.8);
        this.bedNoiseNode?.stop(now + 0.8);
      } catch (e) {}
    }

    // Room tint filter frequencies
    const roomFreqs = {
      cockpit: 58,
      bridge: 55,
      starmap: 50,
      comms: 65,
      cargo: 45,
      quarters: 52,
      quest: 60
    };
    const baseFreq = roomFreqs[room] || 55;

    // 1. Dual sub-harmonic oscillators
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 1.99, now);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.001, now);
    oscGain.gain.setTargetAtTime(0.18, now, 0.5);

    osc1.connect(oscGain);
    osc2.connect(oscGain);

    // 2. Filtered ambient noise (air displacement / hull hiss)
    const noiseBuf = this._createNoiseBuffer(2);
    let noiseNode = null;
    if (noiseBuf) {
      noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = noiseBuf;
      noiseNode.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(room === 'comms' ? 850 : 260, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.setTargetAtTime(room === 'comms' ? 0.08 : 0.04, now, 0.5);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ambienceGain);

      noiseNode.start(now);
    }

    oscGain.connect(this.ambienceGain);
    osc1.start(now);
    osc2.start(now);

    this.bedOsc1 = osc1;
    this.bedOsc2 = osc2;
    this.bedNoiseNode = noiseNode;
  }

  _createNoiseBuffer(seconds = 2) {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * seconds;
    const buf = this.ctx.createBuffer(1, length, sampleRate);
    const data = buf.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      // Brown/pink filter
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buf;
  }

  // --- UI Foley ---

  playKeyCapThunk() {
    this.initContext();
    if (!this.ctx || session.sound?.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.effectsGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playToggleClack() {
    this.initContext();
    if (!this.ctx || session.sound?.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.effectsGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  playNavRelayClick() {
    this.initContext();
    if (!this.ctx || session.sound?.muted) return;
    const now = this.ctx.currentTime;

    // Double relay click: 0ms and 18ms
    [0, 0.018].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(idx === 0 ? 980 : 640, now + offset);
      osc.frequency.exponentialRampToValueAtTime(80, now + offset + 0.025);

      gain.gain.setValueAtTime(0.12, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.025);

      osc.connect(gain);
      gain.connect(this.effectsGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.025);
    });
  }

  playCrtTick() {
    this.initContext();
    if (!this.ctx || session.sound?.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.018);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

    osc.connect(gain);
    gain.connect(this.effectsGain);
    osc.start(now);
    osc.stop(now + 0.018);
  }

  // --- Game Foley ---

  playScanSweep() {
    this.initContext();
    if (!this.ctx || session.sound?.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.28);

    filter.type = 'bandpass';
    filter.Q.value = 4.5;
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1900, now + 0.28);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  playBondSnap() {
    this.initContext();
    if (!this.ctx || session.sound?.muted) return;
    const now = this.ctx.currentTime;

    // Transient snap + metal ping
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(650, now);
    snapOsc.frequency.exponentialRampToValueAtTime(90, now + 0.08);

    snapGain.gain.setValueAtTime(0.4, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    snapOsc.connect(snapGain);
    snapGain.connect(this.effectsGain);
    snapOsc.start(now);
    snapOsc.stop(now + 0.08);

    // Harmonic ring
    const ringOsc = this.ctx.createOscillator();
    const ringGain = this.ctx.createGain();
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(880, now + 0.02);
    ringGain.gain.setValueAtTime(0.12, now + 0.02);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    ringOsc.connect(ringGain);
    ringGain.connect(this.effectsGain);
    ringOsc.start(now + 0.02);
    ringOsc.stop(now + 0.35);
  }

  playMissBuzzer() {
    this.initContext();
    if (!this.ctx || session.sound?.muted) return;
    const now = this.ctx.currentTime;

    // Soft low dual tone, never mocking
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(130, now);
    osc2.frequency.setValueAtTime(175, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.22);
    osc2.stop(now + 0.22);
  }

  playPylonWake() {
    this.initContext();
    if (!this.ctx || session.sound?.muted) return;
    const now = this.ctx.currentTime;

    // Rising filament hum
    const hum = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    hum.type = 'triangle';
    hum.frequency.setValueAtTime(75, now);
    hum.frequency.exponentialRampToValueAtTime(280, now + 0.7);

    humGain.gain.setValueAtTime(0.01, now);
    humGain.gain.linearRampToValueAtTime(0.3, now + 0.4);
    humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    hum.connect(humGain);
    humGain.connect(this.effectsGain);
    hum.start(now);
    hum.stop(now + 0.85);

    // Resonant chime at peak
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(560, now + 0.45);
    chimeGain.gain.setValueAtTime(0.18, now + 0.45);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    chime.connect(chimeGain);
    chimeGain.connect(this.effectsGain);
    chime.start(now + 0.45);
    chime.stop(now + 1.2);
  }

  // --- Voice Murmur (Vess radio voice) ---

  startMurmur() {
    this.initContext();
    if (!this.ctx || session.sound?.muted) return;
    this.stopMurmur();

    this.duckBed(true);

    const now = this.ctx.currentTime;
    const murmurMaster = this.ctx.createGain();
    murmurMaster.gain.setValueAtTime(0.16, now);
    murmurMaster.connect(this.effectsGain);
    this.murmurGain = murmurMaster;

    // Pulse syllables at randomized intervals ~100ms
    const pulseSyllable = () => {
      if (!this.ctx || !this.murmurGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      // Scrambled frequency
      const freq = 340 + Math.random() * 220;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450 + Math.random() * 1200, t);
      filter.Q.value = 3.0;

      const dur = 0.06 + Math.random() * 0.05;
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.murmurGain);

      osc.start(t);
      osc.stop(t + dur);

      const nextInterval = 60 + Math.random() * 70;
      this.murmurTimer = setTimeout(pulseSyllable, nextInterval);
    };

    pulseSyllable();
  }

  stopMurmur() {
    if (this.murmurTimer) {
      clearTimeout(this.murmurTimer);
      this.murmurTimer = null;
    }
    if (this.murmurGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.murmurGain.gain.setTargetAtTime(0.001, now, 0.05);
      setTimeout(() => {
        try { this.murmurGain?.disconnect(); } catch (e) {}
        this.murmurGain = null;
      }, 100);
    }
    this.duckBed(false);
  }
}

export const soundscape = new Soundscape();
