/**
 * session.js — Client-side state and token persistence for Avalon
 */

const TOKEN_KEY = 'avalon_session_token';
const USER_KEY = 'avalon_user_session';
const GFX_KEY = 'avalon_gfx_tier';
const MOTION_KEY = 'avalon_motion_pref';
const CONFIG_KEY = 'avalon_cached_config';
const TEAMS_KEY = 'avalon_cached_teams';

const ALIAS_MAP = { terra: 'earth', zephyr: 'air', ignis: 'fire', thalassa: 'water' };
const PROPER_TEAM_NAMES = { earth: 'Earth', air: 'Air', fire: 'Fire', water: 'Water' };

function normalizeTeamId(tid) {
  if (!tid) return tid;
  const lc = String(tid).toLowerCase().trim();
  return ALIAS_MAP[lc] || lc;
}

function normalizeTeamObj(t) {
  if (!t || typeof t !== 'object') return t;
  const tid = normalizeTeamId(t.team_id);
  return {
    ...t,
    team_id: tid,
    name: PROPER_TEAM_NAMES[tid] || t.name || tid
  };
}

class SessionManager {
  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY) || null;
    this.player = null;
    this.team = null;
    this.xp = 0;
    this.level = 1;
    this.isAdmin = false;
    this.inventory = [];
    this.progress = [];
    this.config = {};
    this.teams = [];
    this.events = {};
    this.activeQuest = null;
    this.gfxTier = localStorage.getItem(GFX_KEY) || 'auto';
    this.reduceMotion = localStorage.getItem(MOTION_KEY) === 'true';
    this.listeners = new Set();

    // Restore cached config & teams
    try {
      const cachedCfg = localStorage.getItem(CONFIG_KEY);
      if (cachedCfg) this.config = JSON.parse(cachedCfg);
      const cachedTeams = localStorage.getItem(TEAMS_KEY);
      if (cachedTeams) {
        const parsed = JSON.parse(cachedTeams);
        this.teams = Array.isArray(parsed) ? parsed.map(normalizeTeamObj) : [];
      }
    } catch (e) {
      console.warn('Failed restoring cached config/teams:', e);
    }

    // Restore user session if token exists
    if (this.token) {
      const cachedUser = localStorage.getItem(USER_KEY);
      if (cachedUser) {
        try {
          const parsed = JSON.parse(cachedUser);
          if (parsed.player) {
            this.player = parsed.player;
            if (this.player.team_id) {
              this.player.team_id = normalizeTeamId(this.player.team_id);
            }
          }
          if (parsed.team) this.team = normalizeTeamObj(parsed.team);
          if (typeof parsed.xp === 'number') this.xp = parsed.xp;
          if (typeof parsed.level === 'number') this.level = parsed.level;
          if (typeof parsed.isAdmin === 'boolean') this.isAdmin = parsed.isAdmin;
          if (Array.isArray(parsed.inventory)) this.inventory = parsed.inventory;
          if (Array.isArray(parsed.progress)) this.progress = parsed.progress;
        } catch (e) {
          console.warn('Failed restoring cached user session:', e);
        }
      }
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }

  get isSignedIn() {
    return Boolean(this.token && this.player);
  }

  get teamId() {
    return this.player?.team_id || this.team?.team_id || null;
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
      localStorage.removeItem(USER_KEY);
    }
  }

  setUserData(data) {
    if (!data) return;

    if (data.player && typeof data.player === 'object') {
      this.player = { ...(this.player || {}), ...data.player };
    } else if (data.player_id) {
      this.player = { ...(this.player || {}), ...data };
    }

    if (data.team !== undefined) {
      this.team = normalizeTeamObj(data.team);
    }
    if (this.player && this.player.team_id) {
      this.player.team_id = normalizeTeamId(this.player.team_id);
    }
    if (typeof data.xp === 'number') {
      this.xp = data.xp;
    }
    if (typeof data.level === 'number') {
      this.level = data.level;
    }
    if (typeof data.isAdmin === 'boolean') {
      this.isAdmin = data.isAdmin;
    }
    if (Array.isArray(data.inventory)) {
      this.inventory = data.inventory;
    }
    if (Array.isArray(data.progress)) {
      this.progress = data.progress;
    }

    // Auto-match team if player has team_id
    if (this.player && this.player.team_id && (!this.team || this.team.team_id !== this.player.team_id)) {
      if (this.teams && this.teams.length > 0) {
        const found = this.teams.find(t => t.team_id === this.player.team_id);
        if (found) this.team = found;
      }
    }

    this.saveSession();
    this.notify();
  }

  saveSession() {
    try {
      if (this.token && (this.player || this.team)) {
        localStorage.setItem(USER_KEY, JSON.stringify({
          player: this.player,
          team: this.team,
          xp: this.xp,
          level: this.level,
          isAdmin: this.isAdmin,
          inventory: this.inventory,
          progress: this.progress
        }));
      }
    } catch (e) {
      console.warn('Failed saving user session to localStorage:', e);
    }
  }

  setConfigAndTeams(config, teams) {
    if (config) {
      this.config = config;
      try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); } catch (e) {}
    }
    if (teams && Array.isArray(teams)) {
      this.teams = teams.map(normalizeTeamObj);
      try { localStorage.setItem(TEAMS_KEY, JSON.stringify(this.teams)); } catch (e) {}
    }
    if (this.player && this.player.team_id && (!this.team || this.team.team_id !== this.player.team_id)) {
      if (this.teams && this.teams.length > 0) {
        const found = this.teams.find(t => t.team_id === this.player.team_id);
        if (found) this.team = found;
      }
    }
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
    this.inventory = [];
    this.progress = [];
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.notify();
  }
}

export const session = new SessionManager();

