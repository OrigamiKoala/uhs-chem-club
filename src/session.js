/**
 * session.js — Client-side state and token persistence for Avalon
 */

const TOKEN_KEY = 'avalon_session_token';
const GFX_KEY = 'avalon_gfx_tier';
const MOTION_KEY = 'avalon_motion_pref';

class SessionManager {
  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY) || null;
    this.player = null;
    this.team = null;
    this.xp = 0;
    this.level = 1;
    this.isAdmin = false;
    this.config = {};
    this.teams = [];
    this.events = {};
    this.activeQuest = null;
    this.gfxTier = localStorage.getItem(GFX_KEY) || 'auto';
    this.reduceMotion = localStorage.getItem(MOTION_KEY) === 'true';
    this.listeners = new Set();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const fn of this.listeners) {
      try { fn(this); } catch (e) { console.error('Session listener error:', e); }
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  setUserData(data) {
    if (!data) return;
    if (data.player) this.player = data.player;
    if (data.team) this.team = data.team;
    if (typeof data.xp === 'number') this.xp = data.xp;
    if (typeof data.level === 'number') this.level = data.level;
    if (typeof data.isAdmin === 'boolean') this.isAdmin = data.isAdmin;
    this.notify();
  }

  setGfxTier(tier) {
    this.gfxTier = tier;
    localStorage.setItem(GFX_KEY, tier);
    this.notify();
  }

  setReduceMotion(pref) {
    this.reduceMotion = Boolean(pref);
    localStorage.setItem(MOTION_KEY, String(this.reduceMotion));
    this.notify();
  }

  clear() {
    this.token = null;
    this.player = null;
    this.team = null;
    this.xp = 0;
    this.level = 1;
    this.isAdmin = false;
    localStorage.removeItem(TOKEN_KEY);
    this.notify();
  }
}

export const session = new SessionManager();
