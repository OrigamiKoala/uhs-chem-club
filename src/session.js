/**
 * session.js — Client-side state and token persistence for Avalon
 */

const TOKEN_KEY = 'avalon_session_token';
const USER_KEY = 'avalon_user_session';
const GFX_KEY = 'avalon_gfx_tier';
const MOTION_KEY = 'avalon_motion_pref';
const CONFIG_KEY = 'avalon_cached_config';
const TEAMS_KEY = 'avalon_cached_teams';
const SOUND_KEY = 'avalon_sound_pref';
const FLAGS_KEY = 'avalon_flags';
const LEARN_KEY = 'avalon_learn';
const SESSION_FLAGS = new Set(['clubHoloClosed', 'starmapHoloClosed']);

/** Reading storage throws in a locked-down browser; a missing value is not a fault. */
function safeRead(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

const ALIAS_MAP = { terra: 'earth', zephyr: 'air', ignis: 'fire', thalassa: 'water' };
const PROPER_TEAM_NAMES = { earth: 'Earth', air: 'Air', fire: 'Fire', water: 'Water' };

function normalizeTeamId(tid) {
  if (!tid) return tid;
  const lc = String(tid).toLowerCase().trim();
  return ALIAS_MAP[lc] || lc;
}

const COMMENDATIONS_KEY = 'avalon_commendations';
const LOADOUT_KEY = 'avalon_loadout';
const MARKS_KEY = 'avalon_clean_stages';
const NOTEBOOK_KEY = 'avalon_notebook';
const PRACTICE_KEY = 'avalon_practice';
const STATE_META_KEY = 'avalon_state_meta';
/** Per-device UI toggles: never synced, or closing a hologram here would close it everywhere. */
const DEVICE_FLAG = /HoloClosed$/;

export {
  MAX_LEVEL,
  LEVEL_THRESHOLDS,
  LEVEL_TITLES,
  levelForXp,
  levelTitle,
  levelProgress
} from './progression/levels.js';
import { levelForXp, levelProgress, levelTitle } from './progression/levels.js';
import { progressionFeed } from './progression/feed.js';
import { evaluateCommendations } from './progression/commendations.js';
import { nextLevelRequisition } from './progression/requisitions.js';
import { mergeDocs, docsEqual, STATE_VERSION } from './shared/statemerge.js';
import { loreIdsForClue } from './story/lore.js';


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
    // Two facts, deliberately apart. `gfxTierPref` is a tier the *player* chose
    // in Settings or with the HUD chip, and nothing else may write it; `null`
    // means "probe the device". `gfxTier` is whatever is running right now.
    // They used to be one value, so every automatic demotion — including one
    // caused by a slow first load — was stored as though it had been chosen,
    // and the device never got a second look.
    this.gfxTierPref = safeRead(GFX_KEY) || null;
    this.gfxTier = (this.gfxTierPref === 'T1' || this.gfxTierPref === 'off') ? 'T1' : 'T4';
    this.reduceMotion = localStorage.getItem(MOTION_KEY) === 'true';
    this.sound = { master: 60, ambience: 60, effects: 60, muted: false };
    this.flags = { sessionZeroDone: false };
    this.sessionFlags = {};
    if (typeof sessionStorage !== 'undefined') {
      try {
        const sf = sessionStorage.getItem('avalon_session_flags');
        if (sf) this.sessionFlags = JSON.parse(sf);
      } catch (e) {}
    }
    // Learn-track progress, keyed "<worldId>/<questId>". Deliberately NOT part of
    // `progress`, which the server pays XP against — the Learn track pays none.
    this.learn = { saga: { beatsSeen: [], clues: [] } };
    // Lore the player has seen (ids into the story registry, in the order they
    // were met) and drill results. Both are synced; see applyRemoteState.
    this.notebook = [];
    this.practice = {};
    // When a 'latest'-mode section (loadout, settings) was last changed here.
    this.stateMeta = { loadoutAt: 0, settingsAt: 0 };
    // sync.js sets this; the session never imports the network layer.
    this.stateDirtyHook = null;
    this.listeners = new Set();

    try {
      const s = localStorage.getItem(SOUND_KEY);
      if (s) this.sound = { ...this.sound, ...JSON.parse(s) };
      const f = localStorage.getItem(FLAGS_KEY);
      if (f) {
        this.flags = { ...this.flags, ...JSON.parse(f) };
        let purged = false;
        for (const sf of SESSION_FLAGS) {
          if (sf in this.flags) {
            delete this.flags[sf];
            purged = true;
          }
        }
        if (purged) {
          try { localStorage.setItem(FLAGS_KEY, JSON.stringify(this.flags)); } catch (e) {}
        }
      }
      const l = localStorage.getItem(LEARN_KEY);
      if (l) this.learn = JSON.parse(l) || {};
      if (!this.learn.saga) this.learn.saga = { beatsSeen: [], clues: [] };
      if (!Array.isArray(this.learn.saga.beatsSeen)) this.learn.saga.beatsSeen = [];
      if (!Array.isArray(this.learn.saga.clues)) this.learn.saga.clues = [];
      const comms = localStorage.getItem(COMMENDATIONS_KEY);
      if (comms) this.commendations = JSON.parse(comms) || [];
      const loadout = localStorage.getItem(LOADOUT_KEY);
      if (loadout) this.loadout = { ...this.loadout, ...JSON.parse(loadout) };
      const marks = localStorage.getItem(MARKS_KEY);
      if (marks) this.cleanStages = JSON.parse(marks) || [];
      const nb = localStorage.getItem(NOTEBOOK_KEY);
      if (nb) this.notebook = JSON.parse(nb) || [];
      const pr = localStorage.getItem(PRACTICE_KEY);
      if (pr) this.practice = JSON.parse(pr) || {};
      const meta = localStorage.getItem(STATE_META_KEY);
      if (meta) this.stateMeta = { ...this.stateMeta, ...JSON.parse(meta) };
    } catch (e) {}
    if (!Array.isArray(this.notebook)) this.notebook = [];
    if (!this.practice || typeof this.practice !== 'object') this.practice = {};

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

    // Always restore persisted XP if higher than default
    try {
      const savedXp = localStorage.getItem('avalon_xp');
      if (savedXp !== null) {
        const parsedXp = Number(savedXp);
        if (!isNaN(parsedXp) && parsedXp > this.xp) {
          this.xp = parsedXp;
          this.level = levelForXp(this.xp);
        }
      }
    } catch (e) {}
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

  notifySubscribers() {
    this.notify();
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      this.sessionFlags = {};
      if (typeof sessionStorage !== 'undefined') {
        try { sessionStorage.removeItem('avalon_session_flags'); } catch (e) {}
      }
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  /**
   * @param {object} data server payload
   * @param {{trustXp?: boolean}} opts pass trustXp:false for endpoints that do not
   *   return a real XP total (e.g. player/create during onboarding) so a stale 0
   *   cannot wipe the player's score.
   */
  setUserData(data, opts = {}) {
    const trustXp = opts.trustXp !== false;
    if (!data) return;

    if (data.player && typeof data.player === 'object') {
      this.player = { ...(this.player || {}), ...data.player };
    } else if (data.player_id) {
      this.player = { ...(this.player || {}), ...data };
    }

    if (data.team !== undefined) {
      this.team = normalizeTeamObj(data.team);
    }
    if (this.team && this.team.team_id) {
      if (!this.player) this.player = {};
      this.player.team_id = this.team.team_id;
    } else if (this.player && this.player.team_id) {
      this.player.team_id = normalizeTeamId(this.player.team_id);
      if (!this.team && this.teams && this.teams.length > 0) {
        const found = this.teams.find(t => t.team_id === this.player.team_id);
        if (found) this.team = found;
      }
    }
    // The server is authoritative on XP. Taking Math.max here used to let locally
    // awarded XP (including replayed stages) inflate forever and never reconcile.
    if (trustXp && typeof data.xp === 'number') {
      this.xp = data.xp;
      this.level = levelForXp(this.xp);
      if (this.player) {
        this.player.xp = this.xp;
        this.player.level = this.level;
      }
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

    if (data.loadout_json || data.player?.loadout_json) {
      const raw = data.loadout_json || data.player?.loadout_json;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed) this.loadout = { ...(this.loadout || {}), ...parsed };
    }
    if (Array.isArray(data.commendations) || Array.isArray(data.player?.commendations)) {
      const arr = Array.isArray(data.commendations) ? data.commendations : data.player.commendations;
      this.commendations = Array.from(new Set([...(this.commendations || []), ...arr]));
    }
    if (data.player && typeof data.player.board_optout === 'boolean') {
      this.player.board_optout = data.player.board_optout;
    } else if (typeof data.board_optout === 'boolean') {
      if (!this.player) this.player = {};
      this.player.board_optout = data.board_optout;
    }

    // Auto-match team if player has team_id
    if (this.player && this.player.team_id && (!this.team || this.team.team_id !== this.player.team_id)) {
      if (this.teams && this.teams.length > 0) {
        const found = this.teams.find(t => t.team_id === this.player.team_id);
        if (found) this.team = found;
      }
    }

    // Learn rows and the synced-state document ride on the same payloads
    // (bootstrap, player/me, login's follow-up read). Both are UNIONED in, never
    // laid over what this device already holds.
    if (Array.isArray(data.learn)) this.setLearnState(data.learn);
    if (data.state) this.applyRemoteState(data.state);

    this.saveSession();
    this.saveProgression();
    this.checkCommendations();
    this.notify();
  }

  addXp(amount) {
    if (!amount || typeof amount !== 'number') return;
    const oldLevel = this.level || 1;
    this.xp = (this.xp || 0) + amount;
    this.level = levelForXp(this.xp);
    if (this.player) {
      this.player.xp = this.xp;
      this.player.level = this.level;
    }
    if (this.level > oldLevel) {
      const req = nextLevelRequisition(oldLevel);
      progressionFeed.enqueueLevelUp(this.level, req);
    }
    this.saveSession();
    this.checkCommendations();
    this.notify();
  }

  saveProgression() {
    try {
      localStorage.setItem(COMMENDATIONS_KEY, JSON.stringify(this.commendations || []));
      localStorage.setItem(LOADOUT_KEY, JSON.stringify(this.loadout || {}));
      localStorage.setItem(MARKS_KEY, JSON.stringify(this.cleanStages || []));
    } catch (e) {}
    this.markStateDirty();
  }

  /** Stamp a deliberate loadout change, so the newest choice wins across devices. */
  touchLoadout() {
    this.stateMeta.loadoutAt = Date.now();
    this.saveStateMeta();
  }

  setLoadout(updates = {}) {
    this.touchLoadout();
    this.loadout = { ...(this.loadout || {}), ...updates };
    this.saveProgression();
    this.notify();
  }

  pinPlate(plateId) {
    this.touchLoadout();
    if (!this.loadout) this.loadout = {};
    if (!Array.isArray(this.loadout.pinnedPlates)) this.loadout.pinnedPlates = [];
    if (this.loadout.pinnedPlates.includes(plateId)) return;
    if (this.loadout.pinnedPlates.length >= 3) {
      this.loadout.pinnedPlates.shift();
    }
    this.loadout.pinnedPlates.push(plateId);
    this.saveProgression();
    this.notify();
  }

  unpinPlate(plateId) {
    this.touchLoadout();
    if (!this.loadout || !Array.isArray(this.loadout.pinnedPlates)) return;
    this.loadout.pinnedPlates = this.loadout.pinnedPlates.filter(id => id !== plateId);
    this.saveProgression();
    this.notify();
  }

  recordCleanStage(stageIndex) {
    if (!this.cleanStages) this.cleanStages = [];
    if (!this.cleanStages.includes(stageIndex)) {
      this.cleanStages.push(stageIndex);
      this.cleanStages.sort((a, b) => a - b);
    }
    this.saveProgression();
    this.checkCommendations();
  }

  checkCommendations() {
    const q1Prog = (this.progress || []).find(p => p.quest_id === 'q1');
    const stageReached = q1Prog ? Number(q1Prog.stage_reached || 0) : 0;
    const state = {
      clearedStagesCount: stageReached,
      stageReached,
      cleanStreak: this.cleanStreak || 0,
      maxCleanStreak: this.maxCleanStreak || 0,
      cleanStages: this.cleanStages || [],
      learn: this.learn || {},
      practice: this.practice || {},
      flags: this.flags || {},
      teamId: this.teamId,
      role: this.player?.role,
      watchCount: this.watch?.watchCount || 0,
      contractsCompletedCount: this.contractsCompletedCount || 0
    };
    const earned = evaluateCommendations(state);
    if (!this.commendations) this.commendations = [];
    const existingSet = new Set(this.commendations);
    let newlyEarned = false;

    for (const c of earned) {
      if (!existingSet.has(c.id)) {
        this.commendations.push(c.id);
        existingSet.add(c.id);
        newlyEarned = true;
        progressionFeed.enqueueCommendation(c);
      }
    }
    if (newlyEarned) {
      this.saveProgression();
      this.notify();
    }
  }

  recordProgress(questId, stageReached) {
    if (!this.progress) this.progress = [];
    let entry = this.progress.find(p => p.quest_id === questId);
    if (!entry) {
      entry = { quest_id: questId, stage_reached: stageReached };
      this.progress.push(entry);
    } else {
      entry.stage_reached = Math.max(entry.stage_reached || 0, stageReached);
    }
    try {
      localStorage.setItem(`avalon_${questId}_stage_reached`, String(entry.stage_reached));
    } catch (e) {}
    this.saveSession();
  }

  saveSession() {
    try {
      localStorage.setItem('avalon_xp', String(this.xp || 0));
      localStorage.setItem('avalon_level', String(this.level || 1));
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

  /**
   * @param {string} tier
   * @param {boolean} persist true only when the player picked this tier. A tier
   *   the frame monitor or the capability probe arrived at is never written, so
   *   a device is re-judged on its next visit instead of being filed away.
   */
  setGfxTier(tier, persist = false) {
    if (tier === 'on' || tier === true || tier === 'T2' || tier === 'T3') tier = 'T4';
    if (tier === 'off' || tier === false) tier = 'T1';
    this.gfxTier = tier;
    if (persist) {
      this.gfxTierPref = tier;
      try { localStorage.setItem(GFX_KEY, tier); } catch (e) {}
    }
    this.notify();
  }

  /** Forget a stored choice so the probe decides again. */
  clearGfxTierPref() {
    this.gfxTierPref = null;
    try { localStorage.removeItem(GFX_KEY); } catch (e) {}
  }

  setReduceMotion(pref) {
    this.reduceMotion = Boolean(pref);
    localStorage.setItem(MOTION_KEY, String(this.reduceMotion));
    this.stateMeta.settingsAt = Date.now();
    this.saveStateMeta();
    this.markStateDirty();
    this.notify();
  }

  setSound(updates = {}) {
    this.sound = { ...this.sound, ...updates };
    try { localStorage.setItem(SOUND_KEY, JSON.stringify(this.sound)); } catch (e) {}
    this.stateMeta.settingsAt = Date.now();
    this.saveStateMeta();
    this.markStateDirty();
    this.notify();
  }

  /* ---------------------------------------------------------------
     LEARN TRACK
     Cards cleared and quests finished, and nothing else. No XP crosses
     this boundary in either direction: the Learn track is a study aid,
     and a study aid that moved the leaderboard would turn reading into
     grinding and punish the students it exists to help.
     --------------------------------------------------------------- */
  learnKey(worldId, questId) {
    return `${worldId}/${questId}`;
  }

  getLearnQuest(worldId, questId) {
    return this.learn[this.learnKey(worldId, questId)] || null;
  }

  saveLearn() {
    try { localStorage.setItem(LEARN_KEY, JSON.stringify(this.learn)); } catch (e) {}
    this.markStateDirty();
  }

  recordLearnStage(worldId, questId, stageIndex) {
    if (!worldId || !questId || typeof stageIndex !== 'number') return;
    const key = this.learnKey(worldId, questId);
    const rec = this.learn[key] || { stages: [], completedAt: null };
    if (!rec.stages.includes(stageIndex)) rec.stages.push(stageIndex);
    this.learn[key] = rec;
    this.saveLearn();
    this.notify();
  }

  markLearnQuestComplete(worldId, questId) {
    const key = this.learnKey(worldId, questId);
    const rec = this.learn[key] || { stages: [], completedAt: null };
    if (!rec.completedAt) rec.completedAt = new Date().toISOString();
    this.learn[key] = rec;
    this.saveLearn();
    this.notify();
  }

  /* ---------------------------------------------------------------
     STORY SPINE & CASE FILE (SAGA)
     --------------------------------------------------------------- */
  getSaga() {
    if (!this.learn.saga) this.learn.saga = { beatsSeen: [], clues: [] };
    if (!Array.isArray(this.learn.saga.beatsSeen)) this.learn.saga.beatsSeen = [];
    if (!Array.isArray(this.learn.saga.clues)) this.learn.saga.clues = [];
    return this.learn.saga;
  }

  recordClue(clueId) {
    if (!clueId) return;
    const saga = this.getSaga();
    if (!saga.clues.includes(clueId)) {
      saga.clues.push(clueId);
      this.saveLearn();
      this.recordNotebookMany(loreIdsForClue(clueId));
      this.notify();
    }
  }

  hasClue(clueId) {
    const saga = this.getSaga();
    return saga.clues.includes(clueId);
  }

  recordSagaBeat(beatId) {
    if (!beatId) return;
    const saga = this.getSaga();
    if (!saga.beatsSeen.includes(beatId)) {
      saga.beatsSeen.push(beatId);
      this.saveLearn();
      this.recordNotebook(`spine:${beatId}`);
      this.notify();
    }
  }

  hasSagaBeat(beatId) {
    const saga = this.getSaga();
    return saga.beatsSeen.includes(beatId);
  }

  /**
   * Merge the server's copy of learn progress in. Union, never overwrite: the
   * local record may hold stages cleared while the fire-and-forget sync was
   * offline, and losing them would silently re-lock a quest the player finished.
   */
  setLearnState(rows) {
    if (!rows) return;
    if (typeof rows === 'object' && !Array.isArray(rows)) {
      if (rows.saga) {
        const saga = this.getSaga();
        if (Array.isArray(rows.saga.beatsSeen)) {
          for (const b of rows.saga.beatsSeen) {
            if (!saga.beatsSeen.includes(b)) saga.beatsSeen.push(b);
          }
        }
        if (Array.isArray(rows.saga.clues)) {
          for (const c of rows.saga.clues) {
            if (!saga.clues.includes(c)) saga.clues.push(c);
          }
        }
      }
      if (Array.isArray(rows.learn)) rows = rows.learn;
      else if (Array.isArray(rows.rows)) rows = rows.rows;
    }
    if (!Array.isArray(rows)) {
      this.saveLearn();
      this.notify();
      return;
    }
    for (const row of rows) {
      if (!row || !row.world_id || !row.quest_id) continue;
      if (row.world_id === '__saga__') {
        const saga = this.getSaga();
        if (row.quest_id === 'clues') {
          const list = Array.isArray(row.stages) ? row.stages : String(row.stages || '').split(',').map(s => s.trim()).filter(Boolean);
          for (const c of list) if (!saga.clues.includes(c)) saga.clues.push(c);
        } else if (row.quest_id === 'beats') {
          const list = Array.isArray(row.stages) ? row.stages : String(row.stages || '').split(',').map(s => s.trim()).filter(Boolean);
          for (const b of list) if (!saga.beatsSeen.includes(b)) saga.beatsSeen.push(b);
        }
        continue;
      }
      const key = this.learnKey(row.world_id, row.quest_id);
      const rec = this.learn[key] || { stages: [], completedAt: null };
      const remote = Array.isArray(row.stages)
        ? row.stages
        : String(row.stages || '').split(',').map(s => s.trim()).filter(Boolean);
      for (const st of remote) {
        const n = Number(st);
        if (isFinite(n) && !rec.stages.includes(n)) rec.stages.push(n);
      }
      if (row.completed_at && !rec.completedAt) rec.completedAt = row.completed_at;
      this.learn[key] = rec;
    }
    this.saveLearn();
    this.notify();
  }

  /* ---------------------------------------------------------------
     NOTEBOOK & PRACTICE
     --------------------------------------------------------------- */
  /** Ids of the lore entries the player has met, in the order they met them. */
  getNotebook() {
    return this.notebook;
  }

  hasNotebookEntry(id) {
    return this.notebook.includes(id);
  }

  /** File a lore entry. Idempotent; returns true only the first time. */
  recordNotebook(id) {
    if (!id || this.notebook.includes(id)) return false;
    this.notebook.push(id);
    try { localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(this.notebook)); } catch (e) {}
    this.markStateDirty();
    this.notifyNotebook(1);
    this.notify();
    return true;
  }

  /** File several entries at once; returns how many were new. */
  recordNotebookMany(ids) {
    let added = 0;
    for (const id of ids || []) {
      if (id && !this.notebook.includes(id)) { this.notebook.push(id); added++; }
    }
    if (added) {
      try { localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(this.notebook)); } catch (e) {}
      this.markStateDirty();
      this.notifyNotebook(added);
      this.notify();
    }
    return added;
  }

  /** The notebook grew. main.js listens and says so, once, however many entries. */
  notifyNotebook(count) {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      try { window.dispatchEvent(new CustomEvent('notebook:added', { detail: { count } })); } catch (e) {}
    }
  }

  savePractice() {
    try { localStorage.setItem(PRACTICE_KEY, JSON.stringify(this.practice)); } catch (e) {}
    this.markStateDirty();
    this.notify();
  }

  /* ---------------------------------------------------------------
     SYNCED STATE
     The Google Sheet is the master copy of everything below; localStorage is
     the cache the game actually plays from. `sync.js` pushes this document
     after a change and hands the server's copy back to applyRemoteState.
     --------------------------------------------------------------- */
  saveStateMeta() {
    try { localStorage.setItem(STATE_META_KEY, JSON.stringify(this.stateMeta)); } catch (e) {}
  }

  markStateDirty() {
    if (typeof this.stateDirtyHook === 'function') {
      try { this.stateDirtyHook(); } catch (e) {}
    }
  }

  /** This device's state as one mergeable document. */
  buildStateDoc() {
    const flags = {};
    for (const [k, v] of Object.entries(this.flags || {})) {
      if (!SESSION_FLAGS.has(k) && !DEVICE_FLAG.test(k)) flags[k] = v;
    }
    const learn = {};
    for (const [k, v] of Object.entries(this.learn || {})) {
      if (k === 'saga' || !v || typeof v !== 'object') continue;
      learn[k] = { stages: (v.stages || []).filter(n => typeof n === 'number'), completedAt: v.completedAt || '' };
    }
    const saga = this.getSaga();
    const at = Date.now();
    return {
      v: STATE_VERSION,
      sections: {
        flags: { at, mode: 'union', v: flags },
        learn: { at, mode: 'union', v: learn },
        saga: { at, mode: 'union', v: { beatsSeen: saga.beatsSeen.slice(), clues: saga.clues.slice() } },
        notebook: { at, mode: 'union', v: this.notebook.slice() },
        practice: { at, mode: 'union', v: this.practice },
        progression: { at, mode: 'union', v: { commendations: (this.commendations || []).slice(), cleanStages: (this.cleanStages || []).slice() } },
        loadout: { at: this.stateMeta.loadoutAt || 0, mode: 'latest', v: this.loadout || {} },
        settings: { at: this.stateMeta.settingsAt || 0, mode: 'latest', v: { sound: this.sound, reduceMotion: this.reduceMotion } }
      }
    };
  }

  /** Lay a merged document over this device's state and write it to localStorage. */
  applyStateDoc(doc) {
    const sec = (doc && doc.sections) || {};
    const val = n => (sec[n] ? sec[n].v : undefined);

    const flags = val('flags');
    if (flags && typeof flags === 'object') {
      const synced = {};
      for (const [k, v] of Object.entries(flags)) {
        if (!SESSION_FLAGS.has(k) && !DEVICE_FLAG.test(k)) synced[k] = v;
      }
      this.flags = { ...this.flags, ...synced };
      try { localStorage.setItem(FLAGS_KEY, JSON.stringify(this.flags)); } catch (e) {}
    }

    const learn = val('learn');
    if (learn && typeof learn === 'object') {
      for (const [k, rec] of Object.entries(learn)) {
        if (!rec || typeof rec !== 'object') continue;
        const mine = this.learn[k] || { stages: [], completedAt: null };
        for (const n of rec.stages || []) if (!mine.stages.includes(n)) mine.stages.push(n);
        if (rec.completedAt && !mine.completedAt) mine.completedAt = rec.completedAt;
        this.learn[k] = mine;
      }
    }
    const saga = val('saga');
    if (saga && typeof saga === 'object') {
      const mine = this.getSaga();
      for (const b of saga.beatsSeen || []) if (!mine.beatsSeen.includes(b)) mine.beatsSeen.push(b);
      for (const c of saga.clues || []) if (!mine.clues.includes(c)) mine.clues.push(c);
    }
    try { localStorage.setItem(LEARN_KEY, JSON.stringify(this.learn)); } catch (e) {}

    const nb = val('notebook');
    if (Array.isArray(nb)) {
      for (const id of nb) if (!this.notebook.includes(id)) this.notebook.push(id);
      try { localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(this.notebook)); } catch (e) {}
    }

    const pr = val('practice');
    if (pr && typeof pr === 'object') {
      this.practice = pr;
      try { localStorage.setItem(PRACTICE_KEY, JSON.stringify(this.practice)); } catch (e) {}
    }

    const prog = val('progression');
    if (prog && typeof prog === 'object') {
      this.commendations = Array.from(new Set([...(this.commendations || []), ...(prog.commendations || [])]));
      const marks = new Set([...(this.cleanStages || []), ...(prog.cleanStages || [])]);
      this.cleanStages = Array.from(marks).sort((a, b) => a - b);
    }

    if (sec.loadout && (sec.loadout.at || 0) >= (this.stateMeta.loadoutAt || 0) && sec.loadout.v && typeof sec.loadout.v === 'object') {
      this.loadout = { ...sec.loadout.v };
      this.stateMeta.loadoutAt = sec.loadout.at;
    }
    if (sec.settings && (sec.settings.at || 0) >= (this.stateMeta.settingsAt || 0) && sec.settings.v) {
      const st = sec.settings.v;
      if (st.sound && typeof st.sound === 'object') {
        this.sound = { ...this.sound, ...st.sound };
        try { localStorage.setItem(SOUND_KEY, JSON.stringify(this.sound)); } catch (e) {}
      }
      if (typeof st.reduceMotion === 'boolean') {
        this.reduceMotion = st.reduceMotion;
        try { localStorage.setItem(MOTION_KEY, String(this.reduceMotion)); } catch (e) {}
      }
      this.stateMeta.settingsAt = sec.settings.at;
    }
    this.saveStateMeta();
    try {
      localStorage.setItem(COMMENDATIONS_KEY, JSON.stringify(this.commendations || []));
      localStorage.setItem(LOADOUT_KEY, JSON.stringify(this.loadout || {}));
      localStorage.setItem(MARKS_KEY, JSON.stringify(this.cleanStages || []));
    } catch (e) {}
  }

  /**
   * The server's copy arrived. Merge it with ours, adopt the result, and if we
   * hold anything the server lacked, ask for a push. Returns the merged doc.
   */
  applyRemoteState(remote) {
    if (!remote || typeof remote !== 'object' || !remote.sections) return null;
    // Work on copies. The merge hands back parts of its inputs as they are, so without
    // this a later edit to the notebook or practice record would also edit
    // `lastRemoteState`, and the push that edit needs would be skipped as "unchanged".
    const copy = JSON.parse(JSON.stringify(remote));
    const merged = mergeDocs(this.buildStateDoc(), copy);
    this.applyStateDoc(merged);
    this.lastRemoteState = JSON.parse(JSON.stringify(remote));
    if (!docsEqual(merged, remote)) this.markStateDirty();
    this.notify();
    return merged;
  }

  setFlag(key, val) {
    if (SESSION_FLAGS.has(key)) {
      this.sessionFlags[key] = val;
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem('avalon_session_flags', JSON.stringify(this.sessionFlags));
        } catch (e) {}
      }
      this.notify();
      return;
    }
    this.flags[key] = val;
    try { localStorage.setItem(FLAGS_KEY, JSON.stringify(this.flags)); } catch (e) {}
    if (!DEVICE_FLAG.test(key)) this.markStateDirty();
    this.notify();
  }

  hasFlag(key) {
    if (SESSION_FLAGS.has(key)) {
      return Boolean(this.sessionFlags && this.sessionFlags[key]);
    }
    return Boolean(this.flags && this.flags[key]);
  }

  getFlag(key) {
    if (SESSION_FLAGS.has(key)) {
      return this.sessionFlags ? this.sessionFlags[key] : undefined;
    }
    return this.flags ? this.flags[key] : undefined;
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
    this.sessionFlags = {};
    if (typeof sessionStorage !== 'undefined') {
      try { sessionStorage.removeItem('avalon_session_flags'); } catch (e) {}
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('avalon_xp');
    localStorage.removeItem('avalon_level');
    localStorage.removeItem('avalon_q1_stage_reached');
    this.learn = { saga: { beatsSeen: [], clues: [] } };
    localStorage.removeItem(LEARN_KEY);
    // Everything else that belongs to the signed-in player goes too: a shared
    // school computer must not hand one student's flags, notebook or practice
    // record to the next. The server holds the master copy and restores it at
    // the next sign-in.
    this.flags = { sessionZeroDone: false };
    this.notebook = [];
    this.practice = {};
    this.commendations = [];
    this.cleanStages = [];
    this.loadout = {};
    this.stateMeta = { loadoutAt: 0, settingsAt: 0 };
    this.lastRemoteState = null;
    for (const k of [FLAGS_KEY, NOTEBOOK_KEY, PRACTICE_KEY, STATE_META_KEY, COMMENDATIONS_KEY, LOADOUT_KEY, MARKS_KEY]) {
      try { localStorage.removeItem(k); } catch (e) {}
    }
    this.notify();
  }
}

export const session = new SessionManager();

