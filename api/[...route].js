import { scrypt, randomBytes } from 'node:crypto';

const PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };
const PEPPER = process.env.PEPPER || 'avalon_dev_pepper_do_not_use_in_prod_123';
const PROXY_SECRET = process.env.PROXY_SECRET || 'avalon_proxy_secret_change_in_prod';
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || '';

// In-memory rate limiting & salt cache
const rateLimits = new Map();
const saltCache = new Map();
const normalizeTeam = (tid) => ({ terra: 'earth', zephyr: 'air', ignis: 'fire', thalassa: 'water' }[tid] || tid);

function isRateLimited(key, limit, windowMs) {
  const now = Date.now();
  const entry = rateLimits.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + windowMs;
    rateLimits.set(key, entry);
    return false;
  }
  entry.count++;
  rateLimits.set(key, entry);
  return entry.count > limit;
}

// Scrypt password derivation
function derivePassword(password, saltB64) {
  const salt = Buffer.concat([
    Buffer.from(saltB64, 'base64'),
    Buffer.from(PEPPER)
  ]);
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, PARAMS.keylen, PARAMS, (err, dk) => {
      if (err) reject(err);
      else resolve(dk.toString('base64'));
    });
  });
}

// In-memory cache for public endpoints (bootstrap, quest manifest, leaderboards)
const publicCache = new Map();

function getCached(key) {
  const item = publicCache.get(key);
  if (!item) return null;
  if (Date.now() > item.exp) {
    publicCache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data, ttlMs) {
  publicCache.set(key, { data, exp: Date.now() + ttlMs });
}

export const CANONICAL_STAGES_20 = [
  { stage_index: 0, kind: 'arrow', xp: 15, max_attempts: 9999, scene_config: { title: 'Stage 1 — Target Lock', prompt: 'Two sites are glowing. Drag an arrow from the red giver to the blue receiver.', moleculeId: 'stage1_pair', anchors: ['red_lp1', 'blue_c1'] } },
  { stage_index: 1, kind: 'arrow', xp: 15, max_attempts: 9999, scene_config: { title: 'Stage 2 — Making Room', prompt: 'The blue center already has an attached group. Connect the red giver to the blue center to displace it.', moleculeId: 'stage2_pair', anchors: ['red_lp1', 'blue_c1'] } },
  { stage_index: 2, kind: 'arrow', xp: 20, max_attempts: 9999, scene_config: { title: 'Stage 3 — Four Live Sites', prompt: 'Four sites are glowing. Connect the brightest red giver to the deepest blue receiver.', moleculeId: 'stage3_pair', anchors: ['red_weak', 'red_extreme', 'blue_extreme', 'blue_weak'] } },
  { stage_index: 3, kind: 'arrow', xp: 20, max_attempts: 9999, scene_config: { title: 'Stage 4 — Decoys', prompt: 'Four sites are present, and two are decoys. Connect the strongest red giver to the strongest blue receiver.', moleculeId: 'stage4_pair', anchors: ['red_weak', 'red_extreme', 'blue_extreme', 'blue_weak'] } },
  { stage_index: 4, kind: 'arrow', xp: 25, max_attempts: 9999, scene_config: { title: 'Stage 5 — The Trap', prompt: 'Two blue sites pull equally, but one is blocked. Rotate the chamber to find the unblocked route.', moleculeId: 'stage5_pair', anchors: ['red_nu', 'blue_open', 'blue_blocked'] } },
  { stage_index: 5, kind: 'arrow', xp: 25, max_attempts: 9999, scene_config: { title: 'Stage 6 — Fenced In', prompt: 'Bulky groups surround the upper site. Rotate the chamber to connect to the open blue site below.', moleculeId: 'stage6_pair', anchors: ['red_nu', 'blue_open', 'blue_blocked'] } },
  { stage_index: 6, kind: 'arrow', xp: 30, max_attempts: 9999, scene_config: { title: 'Stage 7 — Six Sites, One Answer', prompt: 'Six sites are visible. Connect the strongest red giver to the open, unblocked blue receiver.', moleculeId: 'stage7_pair', anchors: ['red_weak1', 'red_weak2', 'red_supreme', 'blue_accessible', 'blue_caged', 'blue_weak'] } },
  { stage_index: 7, kind: 'arrow', xp: 30, max_attempts: 9999, scene_config: { title: 'Stage 8 — Three in the Chamber', prompt: 'Three molecules are present. Connect the active red giver to the blue receiver, ignoring the bystander.', moleculeId: 'stage8_trio', anchors: ['red_base', 'blue_acid', 'spectator_mid'] } },
  { stage_index: 8, kind: 'arrow', xp: 30, max_attempts: 9999, scene_config: { title: 'Stage 9 — The Race', prompt: 'Two red givers compete for one blue receiver. Connect the stronger giver to the target.', moleculeId: 'stage9_trio', anchors: ['red_strong', 'red_weak', 'blue_target'] } },
  { stage_index: 9, kind: 'arrow', xp: 35, max_attempts: 9999, scene_config: { title: 'Stage 10 — Warm-Up Act', prompt: 'The main structure is unreactive on its own. Transfer to the helper site first to activate it.', moleculeId: 'stage10_trio', anchors: ['red_base', 'blue_proton', 'blue_substrate'] } },
  { stage_index: 10, kind: 'multi_arrow', xp: 35, max_attempts: 9999, scene_config: { title: 'Stage 11 — One In, One Out', prompt: 'Draw two arrows in sequence. Attach the incoming piece first, then displace the leaving piece.', moleculeId: 'stage11_pair', multiArrow: true, maxArrows: 2, anchors: ['red_nu', 'blue_c', 'red_cl', 'blue_scavenger'], steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger' }] } },
  { stage_index: 11, kind: 'multi_arrow', xp: 35, max_attempts: 9999, scene_config: { title: 'Stage 12 — The Double Link', prompt: 'Two atoms share a double bond. Push into the center first to swing the double bond open. Two arrows.', moleculeId: 'stage12_pair', multiArrow: true, maxArrows: 2, anchors: ['red_nu', 'blue_c', 'red_o', 'blue_h'], steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_o', expectedTo: 'blue_h' }] } },
  { stage_index: 12, kind: 'multi_arrow', xp: 35, max_attempts: 9999, scene_config: { title: 'Stage 13 — Passing It Along', prompt: 'Transfer the piece across the chamber in two sequential steps. Two arrows.', moleculeId: 'stage13_pair', multiArrow: true, maxArrows: 2, anchors: ['red_base1', 'blue_h1', 'red_base2', 'blue_h2'], steps: [{ order: 1, expectedFrom: 'red_base1', expectedTo: 'blue_h1' }, { order: 2, expectedFrom: 'red_base2', expectedTo: 'blue_h2' }] } },
  { stage_index: 13, kind: 'multi_arrow', xp: 40, max_attempts: 9999, scene_config: { title: 'Stage 14 — Add, Then Drop', prompt: 'The center is occupied. Add the new piece first, then expel the old group. Two arrows.', moleculeId: 'stage14_pair', multiArrow: true, maxArrows: 2, anchors: ['red_nu', 'blue_c', 'red_cl', 'blue_scavenger'], steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger' }] } },
  { stage_index: 14, kind: 'multi_arrow', xp: 40, max_attempts: 9999, scene_config: { title: 'Stage 15 — Wake It Up First', prompt: 'The main center is unreactive. Transfer to the helper site first to activate it, then attack. Two arrows.', moleculeId: 'stage15_trio', multiArrow: true, maxArrows: 2, anchors: ['red_o_carbonyl', 'blue_proton', 'red_water', 'blue_activated_c'], steps: [{ order: 1, expectedFrom: 'red_o_carbonyl', expectedTo: 'blue_proton' }, { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_activated_c' }] } },
  { stage_index: 15, kind: 'multi_arrow', xp: 40, max_attempts: 9999, scene_config: { title: 'Stage 16 — Cutting the Tail', prompt: 'Attack the center first, then release the leaving tail. Two arrows.', moleculeId: 'stage16_trio', multiArrow: true, maxArrows: 2, anchors: ['red_nu', 'blue_c', 'red_ethoxide', 'blue_proton'], steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_ethoxide', expectedTo: 'blue_proton' }] } },
  { stage_index: 16, kind: 'multi_arrow', xp: 40, max_attempts: 9999, scene_config: { title: 'Stage 17 — Ring Opening', prompt: 'The three-membered ring is under high strain. Attack a corner to snap it open, then neutralize. Two arrows.', moleculeId: 'stage17_pair', multiArrow: true, maxArrows: 2, anchors: ['red_nu', 'blue_c_ring', 'red_o_ring', 'blue_proton'], steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c_ring' }, { order: 2, expectedFrom: 'red_o_ring', expectedTo: 'blue_proton' }] } },
  { stage_index: 17, kind: 'multi_arrow', xp: 45, max_attempts: 9999, scene_config: { title: 'Stage 18 — Domino', prompt: 'Remove the outer group first to generate a reactive center, then attack the target. Two arrows.', moleculeId: 'stage18_pair', multiArrow: true, maxArrows: 2, anchors: ['red_base', 'blue_h_alpha', 'c_alpha', 'blue_target'], steps: [{ order: 1, expectedFrom: 'red_base', expectedTo: 'blue_h_alpha' }, { order: 2, expectedFrom: 'c_alpha', expectedTo: 'blue_target' }] } },
  { stage_index: 18, kind: 'multi_arrow', xp: 45, max_attempts: 9999, scene_config: { title: 'Stage 19 — Leave, Then Fill', prompt: 'The crowded center has no room for an incoming group. The leaving group must depart first. Two arrows.', moleculeId: 'stage19_pair', multiArrow: true, maxArrows: 2, anchors: ['red_cl', 'blue_scavenger', 'red_water', 'blue_carbocation'], steps: [{ order: 1, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger' }, { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_carbocation' }] } },
  { stage_index: 19, kind: 'multi_arrow', xp: 50, max_attempts: 9999, scene_config: { title: 'Stage 20 — Grand Finish', prompt: 'Activate the scaffold with the helper first, then connect the core piece. Two arrows.', moleculeId: 'stage20_multi', multiArrow: true, maxArrows: 2, anchors: ['red_cat', 'blue_proton', 'red_core', 'blue_c_scaffold'], steps: [{ order: 1, expectedFrom: 'red_cat', expectedTo: 'blue_proton' }, { order: 2, expectedFrom: 'red_core', expectedTo: 'blue_c_scaffold' }] } }
];

/**
 * A transport-level failure talking to Apps Script — a timeout, a 5xx, or one of
 * Google's intermittent HTML error pages. It is explicitly NOT an auth failure:
 * the whole point of the separate class is that nothing downstream may turn a
 * backend hiccup into UNAUTHORIZED and log a signed-in student out.
 */
class BackendUnavailableError extends Error {
  constructor(message, detail) {
    super(message);
    this.name = 'BackendUnavailableError';
    this.code = 'BACKEND_UNAVAILABLE';
    this.detail = detail || '';
  }
}

// Apps Script normally answers in 1-4s. The per-attempt cap is what stops a
// wedged execution from holding the request open until Vercel kills it, which
// is what a sign-in that "takes forever" actually was.
const APPS_SCRIPT_TIMEOUT_MS = 9000;
const APPS_SCRIPT_ATTEMPTS = 3;
const APPS_SCRIPT_BACKOFF_MS = [200, 600];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Apps Script answers an HTML page — "Page Not Found", a quota notice, a sign-in
// interstitial — instead of JSON whenever Google's serving layer hiccups or the
// script hits its simultaneous-execution limit. It is almost always transient,
// so it is retried rather than surfaced.
function describeHtml(text) {
  const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : 'an HTML page';
}

async function fetchAppsScriptOnce(route, body) {
  let response;
  try {
    response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ k: PROXY_SECRET, route: route, body: body }),
      redirect: 'follow',
      signal: AbortSignal.timeout(APPS_SCRIPT_TIMEOUT_MS)
    });
  } catch (err) {
    const why = err?.name === 'TimeoutError' || err?.name === 'AbortError'
      ? `timed out after ${APPS_SCRIPT_TIMEOUT_MS}ms`
      : String(err?.message || err);
    throw new BackendUnavailableError('Backend did not respond.', why);
  }

  const text = await response.text();

  if (response.status >= 500 || response.status === 429) {
    throw new BackendUnavailableError('Backend is busy.', `HTTP ${response.status}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new BackendUnavailableError(
      'Backend returned an unexpected response.',
      `HTTP ${response.status}, ${describeHtml(text)}`
    );
  }

  // The script itself reporting that Sheets was busy. Same treatment as a
  // transport failure: worth another attempt, never worth signing anyone out.
  if (parsed && parsed.ok === false && parsed.error?.code === 'BACKEND_BUSY') {
    throw new BackendUnavailableError('Backend is busy.', 'BACKEND_BUSY from Apps Script');
  }

  return parsed;
}

// Call Google Apps Script backend
async function callAppsScript(route, body) {
  if (!APPS_SCRIPT_URL) {
    return localDevHandler(route, body);
  }

  const isPublicCacheable = (route === 'bootstrap' && (!body || !body.token)) || route === 'quest/manifest' || route === 'leaderboard' || route === 'team/roster';
  const cacheKey = route + ':' + JSON.stringify(body || {});
  if (isPublicCacheable) {
    const hit = getCached(cacheKey);
    if (hit) return hit;
  }

  let result;
  let lastErr;
  for (let attempt = 0; attempt < APPS_SCRIPT_ATTEMPTS; attempt++) {
    try {
      result = await fetchAppsScriptOnce(route, body);
      lastErr = null;
      break;
    } catch (err) {
      if (!(err instanceof BackendUnavailableError)) throw err;
      lastErr = err;
      console.warn(`Apps Script ${route} attempt ${attempt + 1}/${APPS_SCRIPT_ATTEMPTS} failed: ${err.detail || err.message}`);
      if (attempt < APPS_SCRIPT_ATTEMPTS - 1) await sleep(APPS_SCRIPT_BACKOFF_MS[attempt] || 900);
    }
  }
  if (lastErr) throw lastErr;

  if (result && result.data) {
    const properNames = { earth: 'Earth', air: 'Air', fire: 'Fire', water: 'Water' };
    if (Array.isArray(result.data.teams)) {
      result.data.teams = result.data.teams.map(t => {
        const normId = normalizeTeam(t.team_id);
        return {
          ...t,
          team_id: normId,
          name: properNames[normId] || t.name || normId
        };
      });
    }
    if (result.data.events) {
      const normEv = {};
      for (const k of Object.keys(result.data.events)) {
        normEv[normalizeTeam(k)] = result.data.events[k];
      }
      result.data.events = normEv;
    }
    if (result.data.player && result.data.player.team) {
      const pTid = normalizeTeam(result.data.player.team.team_id);
      result.data.player.team.team_id = pTid;
      result.data.player.team.name = properNames[pTid] || result.data.player.team.name || pTid;
    }
    // Normalize stages: replace obsolete choice stage 0 or missing moleculeId
    // Normalize stages: replace obsolete or incomplete stage lists with the canonical 20 stages
    const checkStages = result.data.stages || result.data.activeQuest?.stages;
    if (Array.isArray(checkStages) && (checkStages.length < 20 || checkStages[0].kind === 'choice' || !checkStages[0].scene_config?.moleculeId)) {
      if (result.data.stages) result.data.stages = CANONICAL_STAGES_20;
      if (result.data.activeQuest) result.data.activeQuest.stages = CANONICAL_STAGES_20;
    }
  }
  if (isPublicCacheable && result.ok) {
    setCached(cacheKey, result, route === 'leaderboard' ? 20000 : 60000);
  }
  return result;
}

// The reveal at the end of Quest 1 — the one place jargon is allowed, because the
// player has already built the intuition. Kept identical to apps-script/Quests.gs.
const QUEST1_EPILOGUE = [
  'Here is the chemistry you were actually doing.',
  '',
  'Every red cloud was a spot with extra electrons — a region of negative charge. Every blue spot was electron-poor and positively charged. Opposite charges attract, so reactions start where the reddest region meets the bluest one.',
  '',
  'The lines you drew are called curved arrows, and chemists use exactly this notation. An arrow shows a pair of electrons moving from where they are to where they are going.',
  '',
  'When two blue targets competed, geometry decided the winner: bulky groups physically block incoming molecules, so reactions take the open route. That is called steric hindrance.',
  '',
  'In the multi-step stages you were writing a reaction mechanism — the exact order in which bonds form and break. That is the core skill of organic chemistry, and you just did twenty of them.'
].join('\n');

// --- Local dev mock fallback when APPS_SCRIPT_URL is not set ---
// Allows instant testing of full site & 3D quests before Google Sheet deployment.
const localStore = {
  players: [],
  submissions: [],
  inventory: [],
  nameHistory: [],
  progress: [],
  // Learn-track rows live in their own list, never in `progress` or
  // `submissions`, because those two are what XP and the leaderboard are
  // computed from. The Learn track must stay invisible to both.
  learn: [],
  teams: [
    { team_id: 'earth', name: 'Earth', corp_name: 'Earth', ship_name: 'Earth', color_hex: '#241f14', accent_hex: '#8a7148', cap: 12, lore: '', emblem: 'geo' },
    { team_id: 'air', name: 'Air', corp_name: 'Air', ship_name: 'Air', color_hex: '#1a2226', accent_hex: '#75818a', cap: 12, lore: '', emblem: 'aero' },
    { team_id: 'fire', name: 'Fire', corp_name: 'Fire', ship_name: 'Fire', color_hex: '#2a1a0f', accent_hex: '#9c5423', cap: 12, lore: '', emblem: 'pyro' },
    { team_id: 'water', name: 'Water', corp_name: 'Water', ship_name: 'Water', color_hex: '#12231f', accent_hex: '#3f7d76', cap: 12, lore: '', emblem: 'hydro' }
  ]
};

// Stage XP plus the 40 + 25 completion bonus per finished quest — the same sum
// Scoring.computePlayerTotalXp produces. player/me, auth/login and the leaderboard
// all read through here, because a mock whose profile and standings disagree about
// a player's total teaches a dev run the wrong thing about production.
function localTotalXp(player) {
  const stageXp = typeof player.xp === 'number' ? player.xp : 0;
  const completed = localStore.progress.filter(
    pr => pr.player_id === player.player_id && pr.completed_at
  ).length;
  return stageXp + completed * 65;
}

function localDevHandler(route, body) {
  const now = new Date().toISOString();

  if (route === 'auth/salt') {
    const id = (body.identifier || '').trim().toLowerCase();
    const p = localStore.players.find(x => x.email_lc === id || x.display_name_lc === id);
    if (p) return { ok: true, data: { salt: p.pw_salt } };
    return { ok: true, data: { salt: Buffer.from(id || 'dummy').toString('base64') } };
  }

  if (route === 'auth/register') {
    const id = 'p_' + Date.now().toString(36);
    const player = {
      player_id: id,
      email_lc: body.email.toLowerCase(),
      pw_hash: body.pwHash,
      pw_salt: body.pwSalt,
      pw_algo: body.pwAlgo,
      display_name: body.displayName,
      display_name_lc: body.displayName.toLowerCase(),
      role: '',
      team_id: '',
      avatar_json: JSON.stringify({ suitColor: 'default', helmet: 'mark1', visor: 'gold', skin: 'medium' }),
      created_at: now,
      status: 'active'
    };
    localStore.players.push(player);
    const token = Buffer.from(JSON.stringify({ pid: id, exp: Date.now() + 864000000 })).toString('base64') + '.sig';
    return { ok: true, data: { token, player, next: 'onboarding' } };
  }

  if (route === 'auth/login') {
    const id = (body.identifier || '').trim().toLowerCase();
    const p = localStore.players.find(x => x.email_lc === id || x.display_name_lc === id);
    if (!p || p.pw_hash !== body.dk) {
      return { ok: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials.' } };
    }
    const token = Buffer.from(JSON.stringify({ pid: p.player_id, exp: Date.now() + 864000000 })).toString('base64') + '.sig';
    const teamId = normalizeTeam(p.team_id);
    const team = localStore.teams.find(t => t.team_id === teamId) || null;
    const pXp = localTotalXp(p);
    const pLevel = Math.max(1, Math.floor(Math.sqrt(pXp / 45)) + 1);
    return {
      ok: true,
      data: {
        token,
        player: p,
        team,
        xp: pXp,
        level: pLevel,
        salt: p.pw_salt,
        inventory: [],
        progress: (localStore.progress || []).filter(x => x.player_id === p.player_id)
      }
    };
  }

  if (route === 'bootstrap') {
    let player = null;
    if (body.token) {
      try {
        const payload = JSON.parse(Buffer.from(body.token.split('.')[0], 'base64').toString('utf8'));
        player = localStore.players.find(x => x.player_id === payload.pid) || null;
      } catch (e) {}
    }

    const teamSlots = localStore.teams.map(t => {
      const members = localStore.players
        .filter(p => normalizeTeam(p.team_id) === t.team_id && p.status !== 'banned')
        .map(p => ({ display_name: p.display_name || 'Crew Member', trinket: p.trinket || '' }));
      return { ...t, count: members.length, available: Math.max(0, t.cap - members.length), members };
    });

    return {
      ok: true,
      data: {
        config: {
          season_name: 'Season I: The Long Dark',
          active_quest: 'q1',
          team_slot_cap: '12',
          signups_open: 'TRUE',
          demo_mode_enabled: 'TRUE'
        },
        teams: teamSlots,
        activeQuest: {
          quest: { quest_id: 'q1', title: 'The Charge Gardens of Erebus', world: 'Erebus' },
          stages: CANONICAL_STAGES_20
        },
        player: player ? {
          player: player,
          team: localStore.teams.find(t => t.team_id === player.team_id),
          xp: typeof player.xp === 'number' ? player.xp : 0,
          level: Math.max(1, Math.floor(Math.sqrt((player.xp || 0) / 45)) + 1),
          isAdmin: player.email_lc === 'uhschemclub@gmail.com' || player.display_name_lc === 'admin',
          progress: (localStore.progress || []).filter(x => x.player_id === player.player_id),
          learn: (localStore.learn || []).filter(x => x.player_id === player.player_id)
        } : null,
        events: {
          earth: { event_id: 'slipstream', name: 'Slipstream Current', polarity: 'good' },
          air: { event_id: 'quiet_space', name: 'Quiet Space', polarity: 'neutral' },
          fire: { event_id: 'solar_flare', name: 'Solar Flare', polarity: 'bad' },
          water: { event_id: 'stellar_wind', name: 'Stellar Wind', polarity: 'good' }
        }
      }
    };
  }

  if (route === 'team/roster') {
    const teamId = normalizeTeam(body.teamId);
    const members = (localStore.players || [])
      .filter(p => normalizeTeam(p.team_id) === teamId && p.status !== 'banned')
      .map(p => ({
        display_name: p.display_name || 'Crew Member',
        trinket: p.trinket || ''
      }));
    return {
      ok: true,
      data: {
        team_id: teamId,
        members
      }
    };
  }

  if (route === 'player/create') {
    let pid = 'p_demo';
    if (body.token) {
      try {
        pid = JSON.parse(Buffer.from(body.token.split('.')[0], 'base64').toString('utf8')).pid;
      } catch (e) {}
    }
    const p = localStore.players.find(x => x.player_id === pid);
    const teamId = normalizeTeam(body.teamId);
    if (p) {
      p.role = '';
      p.team_id = teamId;
      p.avatar_json = typeof body.avatar === 'object' ? JSON.stringify(body.avatar) : (body.avatar || p.avatar_json);
      if (body.background) p.background = body.background;
      if (body.trinket) {
        p.trinket = body.trinket;
        if (!localStore.inventory.find(i => i.player_id === p.player_id && i.item_id === body.trinket)) {
          localStore.inventory.push({ inv_id: `inv_${Date.now()}`, player_id: p.player_id, item_id: body.trinket, qty: 1 });
        }
      }
    }
    return {
      ok: true,
      data: {
        player: p || { player_id: pid, role: '', team_id: teamId, background: body.background || '', trinket: body.trinket || '' },
        team: localStore.teams.find(t => t.team_id === teamId),
        xp: 0,
        level: 1
      }
    };
  }

  if (route === 'player/me') {
    let pid = null;
    if (body.token) {
      try {
        pid = JSON.parse(Buffer.from(body.token.split('.')[0], 'base64').toString('utf8')).pid;
      } catch (e) {}
    }
    let p = localStore.players.find(x => x.player_id === pid);
    if (!p && pid) {
      p = {
        player_id: pid,
        email_lc: 'student@example.com',
        display_name: 'Explorer',
        display_name_lc: 'explorer',
        team_id: 'air',
        role: '',
        status: 'active'
      };
      localStore.players.push(p);
    }
    if (!p) {
      return { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } };
    }
    const teamId = normalizeTeam(p.team_id);
    const pXp = localTotalXp(p);
    const pLevel = Math.max(1, Math.floor(Math.sqrt(pXp / 45)) + 1);
    return {
      ok: true,
      data: {
        player: p,
        team: localStore.teams.find(t => t.team_id === teamId) || null,
        xp: pXp,
        level: pLevel,
        isAdmin: p.email_lc === 'uhschemclub@gmail.com' || p.display_name_lc === 'admin',
        progress: (localStore.progress || []).filter(x => x.player_id === p.player_id),
        learn: (localStore.learn || []).filter(x => x.player_id === p.player_id)
      }
    };
  }

  if (route === 'player/rename') {
    let pid = null;
    if (body.token) {
      try {
        pid = JSON.parse(Buffer.from(body.token.split('.')[0], 'base64').toString('utf8')).pid;
      } catch (e) {}
    }
    const p = localStore.players.find(x => x.player_id === pid);
    if (p && body.displayName) {
      p.display_name = body.displayName;
      p.display_name_lc = body.displayName.toLowerCase();
    }
    const pXp = typeof p?.xp === 'number' ? p.xp : 0;
    const pLevel = Math.max(1, Math.floor(Math.sqrt(pXp / 45)) + 1);
    return {
      ok: true,
      data: {
        player: p,
        team: p ? localStore.teams.find(t => t.team_id === p.team_id) : null,
        xp: pXp,
        level: pLevel
      }
    };
  }

  if (route === 'player/update') {
    let pid = null;
    if (body.token) {
      try {
        pid = JSON.parse(Buffer.from(body.token.split('.')[0], 'base64').toString('utf8')).pid;
      } catch (e) {}
    }
    const p = localStore.players.find(x => x.player_id === pid);
    if (p && body.avatar_json) {
      p.avatar_json = typeof body.avatar_json === 'object' ? JSON.stringify(body.avatar_json) : body.avatar_json;
    }
    const pXp = typeof p?.xp === 'number' ? p.xp : 0;
    const pLevel = Math.max(1, Math.floor(Math.sqrt(pXp / 45)) + 1);
    return {
      ok: true,
      data: {
        player: p,
        team: p ? localStore.teams.find(t => t.team_id === p.team_id) : null,
        xp: pXp,
        level: pLevel
      }
    };
  }

  if (route === 'quest/manifest') {
    return {
      ok: true,
      data: {
        quest: {
          quest_id: 'q1',
          title: 'The Charge Gardens of Erebus',
          world: 'Erebus',
          blurb: 'Survey paired molecular structures across the Erebus anomaly.',
          status: 'live',
          stage_count: 20,
          base_xp: 650
        },
        stages: CANONICAL_STAGES_20
      }
    };
  }

  if (route === 'quest/grade' || route === 'demo/grade') {
    const stageIdx = Number(body.stageIndex);
    const p = body.payload || {};
    let correct = false;
    let isBlocked = false;

    if (stageIdx === 0) {
      correct = (p.from === 'red_lp1' && p.to === 'blue_c1');
    } else if (stageIdx === 1) {
      correct = (p.from === 'red_lp1' && p.to === 'blue_c1');
    } else if (stageIdx === 2) {
      correct = (p.from === 'red_extreme' && p.to === 'blue_extreme');
    } else if (stageIdx === 3) {
      correct = (p.from === 'red_extreme' && p.to === 'blue_extreme');
    } else if (stageIdx === 4) {
      if (p.to === 'blue_blocked') isBlocked = true;
      correct = (p.from === 'red_nu' && p.to === 'blue_open');
    } else if (stageIdx === 5) {
      if (p.to === 'blue_blocked') isBlocked = true;
      correct = (p.from === 'red_nu' && p.to === 'blue_open');
    } else if (stageIdx === 6) {
      if (p.to === 'blue_caged') isBlocked = true;
      correct = (p.from === 'red_supreme' && p.to === 'blue_accessible');
    } else if (stageIdx === 7) {
      correct = (p.from === 'red_base' && p.to === 'blue_acid');
    } else if (stageIdx === 8) {
      correct = (p.from === 'red_strong' && p.to === 'blue_target');
    } else if (stageIdx === 9) {
      correct = (p.from === 'red_base' && p.to === 'blue_proton');
    } else if (stageIdx >= 10 && stageIdx <= 19) {
      const arrs = p.arrows || [];
      const stageCfg = CANONICAL_STAGES_20[stageIdx];
      const steps = stageCfg?.scene_config?.steps || [];
      if (arrs.length >= steps.length) {
        let allCorrect = true;
        for (const st of steps) {
          const matching = arrs.find(a => a.order === st.order);
          if (!matching || (st.expectedFrom && matching.from !== st.expectedFrom) || (st.expectedTo && matching.to !== st.expectedTo)) {
            allCorrect = false;
            break;
          }
        }
        correct = allCorrect;
      }
    }

    const stageXp = CANONICAL_STAGES_20[stageIdx]?.xp || 25;

    // XP is paid once per stage, exactly like Quests.gs — replays are free practice.
    let awarded = 0;
    if (correct && body.token) {
      try {
        const pid = JSON.parse(Buffer.from(body.token.split('.')[0], 'base64').toString('utf8')).pid;
        const playerObj = localStore.players.find(x => x.player_id === pid);
        if (playerObj) {
          let prog = (localStore.progress || []).find(x => x.player_id === pid && x.quest_id === 'q1');
          if (!prog) {
            prog = { player_id: pid, quest_id: 'q1', stage_reached: 0, xp_earned: 0, cleared: [] };
            localStore.progress.push(prog);
          }
          if (!Array.isArray(prog.cleared)) prog.cleared = [];
          // Track the exact stages cleared, matching Quests.gs (which checks the
          // player's prior correct submissions for this stage).
          const alreadyCleared = prog.cleared.includes(stageIdx);
          awarded = alreadyCleared ? 0 : stageXp;
          if (!alreadyCleared) prog.cleared.push(stageIdx);
          playerObj.xp = (playerObj.xp || 0) + awarded;
          prog.stage_reached = Math.max(prog.stage_reached || 0, stageIdx + 1);
          prog.xp_earned = (prog.xp_earned || 0) + awarded;
        }
      } catch (e) {}
    } else if (correct) {
      awarded = stageXp;
    }

    return {
      ok: true,
      data: {
        correct,
        xpAwarded: awarded,
        blocked: isBlocked,
        attemptsLeft: 9999,
        nextStage: correct ? stageIdx + 1 : stageIdx
      }
    };
  }

  if (route === 'quest/complete') {
    const questXp = CANONICAL_STAGES_20.reduce((sum, st) => sum + (st.xp || 0), 0);
    let playerXp = questXp;
    // Completion is idempotent, exactly like Quests.gs: a replay of the final stage
    // re-opens the debrief but must not mint a second item or move any total.
    let alreadyCompleted = false;
    try {
      const pid = JSON.parse(Buffer.from(body.token.split('.')[0], 'base64').toString('utf8')).pid;
      const playerObj = localStore.players.find(x => x.player_id === pid);
      if (playerObj && typeof playerObj.xp === 'number') playerXp = playerObj.xp;
      let prog = (localStore.progress || []).find(x => x.player_id === pid && x.quest_id === 'q1');
      if (!prog) {
        prog = { player_id: pid, quest_id: 'q1', stage_reached: 0, xp_earned: 0, cleared: [] };
        localStore.progress.push(prog);
      }
      alreadyCompleted = Boolean(prog.completed_at);
      if (!alreadyCompleted) prog.completed_at = new Date().toISOString();
      prog.stage_reached = Math.max(prog.stage_reached || 0, CANONICAL_STAGES_20.length);
      prog.items_awarded = prog.items_awarded || 'resonance_key';
    } catch (e) {}

    return {
      ok: true,
      data: {
        totalXp: questXp,
        awardedItem: 'resonance_key',
        newLevel: Math.max(1, Math.floor(Math.sqrt(playerXp / 45)) + 1),
        alreadyCompleted,
        epilogue: QUEST1_EPILOGUE
      }
    };
  }

  /* -----------------------------------------------------------------
     LEARN TRACK — progress only. These handlers never touch player.xp,
     localStore.submissions or localStore.progress, so nothing recorded
     here can reach the leaderboard.
     ----------------------------------------------------------------- */
  if (route === 'learn/progress' || route === 'learn/stage' || route === 'learn/complete') {
    let pid = null;
    try {
      pid = JSON.parse(Buffer.from(String(body.token || '').split('.')[0], 'base64').toString('utf8')).pid;
    } catch (e) {}
    if (!pid) return { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } };

    const rowsFor = () => localStore.learn.filter(r => r.player_id === pid);

    if (route === 'learn/progress') {
      return { ok: true, data: { learn: rowsFor() } };
    }

    const worldId = String(body.worldId || '');
    const questId = String(body.questId || '');
    if (!worldId || !questId) {
      return { ok: false, error: { code: 'BAD_REQUEST', message: 'worldId and questId are required.' } };
    }

    let row = localStore.learn.find(r => r.player_id === pid && r.world_id === worldId && r.quest_id === questId);
    if (!row) {
      row = { player_id: pid, world_id: worldId, quest_id: questId, stages: [], completed_at: null };
      localStore.learn.push(row);
    }

    if (route === 'learn/stage') {
      const idx = Number(body.stageIndex);
      if (isFinite(idx) && !row.stages.includes(idx)) row.stages.push(idx);
      row.updated_at = now;
      // No xpAwarded field, deliberately: there is nothing for a client to add.
      return { ok: true, data: { world_id: worldId, quest_id: questId, stages: row.stages } };
    }

    // learn/complete — idempotent, and worth nothing either way.
    const alreadyCompleted = Boolean(row.completed_at);
    if (!alreadyCompleted) row.completed_at = now;
    row.updated_at = now;
    return { ok: true, data: { world_id: worldId, quest_id: questId, alreadyCompleted, completed_at: row.completed_at } };
  }

  if (route === 'leaderboard') {
    // Computed from localStore, not hardcoded. A fixed board cannot show whether
    // XP reaches the standings, which is the one thing a dev run needs to prove;
    // the formulas below mirror Scoring.gs so dev behaviour matches production.
    const LEVEL_TITLES = [[2, 'Cadet'], [4, 'Scout'], [6, 'Navigator'], [8, 'Voyager'], [10, 'Pathfinder'], [12, 'Starmarshal']];
    const levelOf = xp => Math.min(12, Math.max(1, xp > 0 ? Math.floor(Math.sqrt(xp / 45)) + 1 : 1));
    const titleOf = lvl => (LEVEL_TITLES.find(([max]) => lvl <= max) || [0, 'Starmarshal'])[1];

    const individual = localStore.players
      .filter(p => p.status !== 'banned')
      .map(p => {
        const xp = localTotalXp(p);
        const level = levelOf(xp);
        return {
          player_id: p.player_id,
          display_name: p.display_name,
          team_id: normalizeTeam(p.team_id),
          role: p.role || '',
          xp,
          level,
          level_title: titleOf(level)
        };
      })
      .sort((a, b) => b.xp - a.xp)
      .map((row, i) => ({ ...row, rank: i + 1 }));

    // §4.4 — mean of active members, not the sum, scaled by participation.
    const teams = localStore.teams.map(tm => {
      const roster = individual.filter(r => r.team_id === tm.team_id);
      const active = roster.filter(r => r.xp > 0);
      const meanXp = active.length ? active.reduce((sum, r) => sum + r.xp, 0) / active.length : 0;
      const partMult = roster.length ? 0.75 + 0.5 * (active.length / roster.length) : 1.0;
      return {
        team_id: tm.team_id,
        name: tm.name,
        corp_name: tm.corp_name,
        ship_name: tm.ship_name,
        color_hex: tm.color_hex,
        accent_hex: tm.accent_hex,
        emblem: tm.emblem,
        roster_size: roster.length,
        active_members: active.length,
        team_score: Math.round(meanXp * partMult)
      };
    })
      .sort((a, b) => b.team_score - a.team_score)
      .map((row, i) => ({ ...row, rank: i + 1 }));

    const data = { individual: individual.slice(0, 50), teams };

    if (body && body.token) {
      try {
        const pid = JSON.parse(Buffer.from(body.token.split('.')[0], 'base64').toString('utf8')).pid;
        const me = individual.find(r => r.player_id === pid);
        if (me) data.myRank = { rank: me.rank, display_name: me.display_name, xp: me.xp, level: me.level };
      } catch (e) {}
    }

    return { ok: true, data };
  }

  return { ok: true, data: { status: 'mock_dev_ready', route } };
}

export default async function handler(req, res) {
  // CORS & method check
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  // Parse route path
  let path = '';
  if (req.url) {
    const parsed = new URL(req.url, 'http://localhost');
    path = parsed.pathname.replace(/^\/api\/?/, '');
  }

  // Parse body
  let body = {};
  if (req.method === 'POST') {
    if (typeof req.body === 'object' && req.body !== null) {
      body = req.body;
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw) {
        try {
          body = JSON.parse(raw);
        } catch (e) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ ok: false, error: { code: 'BAD_JSON', message: 'Invalid JSON body' } }));
        }
      }
    }
  }

  // x-forwarded-for is a chain; the client is the first entry.
  const clientIp = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local')
    .split(',')[0].trim();

  try {
    // Intercept auth routes to perform scrypt hashing
    if (path === 'auth/register') {
      if (isRateLimited('reg:' + clientIp, 40, 60000)) {
        res.statusCode = 429;
        return res.end(JSON.stringify({ ok: false, error: { code: 'RATE_LIMITED', message: 'Too many registrations. Slow down.' } }));
      }

      const { email, password, displayName } = body;
      if (!email || !password || !displayName) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: { code: 'MISSING_FIELDS', message: 'Email, password, and display name are required.' } }));
      }
      if (password.length < 8) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: { code: 'PASSWORD_TOO_SHORT', message: 'Password must be at least 8 characters.' } }));
      }

      // Generate 16 bytes random salt
      const saltB64 = randomBytes(16).toString('base64');
      const dk = await derivePassword(password, saltB64);

      // Cache salt for future logins
      saltCache.set(email.toLowerCase(), saltB64);
      saltCache.set(displayName.toLowerCase(), saltB64);

      const result = await callAppsScript('auth/register', {
        email,
        pwHash: dk,
        pwSalt: saltB64,
        pwAlgo: 'scrypt-16384-8-1-64',
        displayName
      });

      res.statusCode = result.ok ? 200 : 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(result));
    }

    if (path === 'auth/login') {
      const { identifier, password, cachedSalt } = body;
      if (!identifier || !password) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: { code: 'MISSING_FIELDS', message: 'Identifier and password are required.' } }));
      }

      const idLc = identifier.toLowerCase();

      // Guessing is per-account, so the tight limit is per-account. A whole
      // club signing in from one school's network shares a single outbound IP,
      // and a 20/min cap on that IP locked the room out of its own portal; the
      // per-IP limit stays only to blunt a spray across many accounts.
      if (isRateLimited('login-id:' + idLc, 10, 60000) || isRateLimited('login-ip:' + clientIp, 150, 60000)) {
        res.statusCode = 429;
        return res.end(JSON.stringify({ ok: false, error: { code: 'RATE_LIMITED', message: 'Too many sign-in attempts. Wait a minute and try again.' } }));
      }
      let saltB64 = cachedSalt || saltCache.get(idLc);
      const usedCachedSalt = !!saltB64;

      if (!saltB64) {
        const saltResp = await callAppsScript('auth/salt', { identifier });
        saltB64 = saltResp?.data?.salt || Buffer.from(identifier).toString('base64');
        saltCache.set(idLc, saltB64);
      }

      // 2. Derive key with scrypt
      let dk = await derivePassword(password, saltB64);

      // 3. Call backend auth/login with derived key
      let result = await callAppsScript('auth/login', { identifier, dk });

      // If login was REFUSED while using a cached salt, the cache may be stale
      // (the password was changed elsewhere), so re-fetch and try once more.
      // Only on a refusal: retrying a backend hiccup here used to double an
      // already-slow sign-in with a second salt fetch and a second scrypt pass.
      if (!result.ok && usedCachedSalt && result.error?.code === 'INVALID_CREDENTIALS') {
        const freshSaltResp = await callAppsScript('auth/salt', { identifier });
        const freshSalt = freshSaltResp?.data?.salt;
        if (freshSalt && freshSalt !== saltB64) {
          saltB64 = freshSalt;
          saltCache.set(idLc, saltB64);
          dk = await derivePassword(password, saltB64);
          result = await callAppsScript('auth/login', { identifier, dk });
        }
      }

      if (result.ok && result.data) {
        saltCache.set(idLc, saltB64);
        result.data.salt = saltB64;
      }

      res.statusCode = result.ok ? 200 : 401;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(result));
    }

    if (path === 'auth/change-password') {
      const { oldPassword, newPassword, token } = body;
      const saltResp = await callAppsScript('auth/salt', { token });
      const saltB64 = saltResp?.data?.salt || Buffer.from('salt').toString('base64');
      const oldDk = await derivePassword(oldPassword, saltB64);

      const newSaltB64 = randomBytes(16).toString('base64');
      const newHash = await derivePassword(newPassword, newSaltB64);

      const result = await callAppsScript('auth/change-password', {
        token,
        oldDk,
        newHash,
        newSalt: newSaltB64,
        newAlgo: 'scrypt-16384-8-1-64'
      });

      res.statusCode = result.ok ? 200 : 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(result));
    }

    if (path === 'admin/reset-password') {
      const { targetPlayerId, newPassword, token } = body;
      const newSaltB64 = randomBytes(16).toString('base64');
      const newHash = await derivePassword(newPassword, newSaltB64);

      const result = await callAppsScript('admin/reset-password', {
        token,
        targetPlayerId,
        newHash,
        newSalt: newSaltB64,
        newAlgo: 'scrypt-16384-8-1-64'
      });

      res.statusCode = result.ok ? 200 : 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(result));
    }

    if (path === 'bootstrap') {
      try {
        const result = await callAppsScript('bootstrap', body);
        if (result && result.ok && result.data && result.data.config) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(result));
        }
        console.warn('Apps Script bootstrap returned no config:', JSON.stringify(result?.error || result));
      } catch (e) {
        console.warn('Apps Script bootstrap failed, falling back to local handler:', e.detail || e.message);
      }
      // The fallback is a mock with an empty roster, so it cannot know who is
      // signed in. It must say so: a client that reads `player: null` from it
      // as "your token is dead" would log a student out every time Apps Script
      // hiccupped. `degraded` marks the payload as public config only.
      const fallback = localDevHandler('bootstrap', body);
      if (APPS_SCRIPT_URL && fallback?.data) {
        fallback.data.degraded = true;
        if (body && body.token && !fallback.data.player) delete fallback.data.player;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(fallback));
    }

    if (path === 'team/roster') {
      try {
        const result = await callAppsScript('team/roster', body);
        if (result && result.ok) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(result));
        }
      } catch (e) {
        console.warn('Apps Script team/roster failed, falling back to local handler:', e.detail || e.message);
      }
      const fallback = localDevHandler('team/roster', body);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(fallback));
    }

    // Pass through any other routes to Apps Script backend
    const result = await callAppsScript(path, body);
    res.statusCode = result.ok ? 200 : 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(result));
  } catch (err) {
    // A transport failure is reported as its own retryable code. It must never
    // reach the client as UNAUTHORIZED, and it must never read as a permanent
    // misconfiguration: the deployment checklist goes to the server log, where
    // it is useful, instead of into a student's face mid-quest.
    if (err instanceof BackendUnavailableError) {
      console.error(`Backend unavailable on ${path}: ${err.detail || err.message}. ` +
        "If this persists, check Apps Script: run 'setup' once, deploy as Web app with " +
        "'Execute as: Me' / 'Who has access: Anyone', and redeploy a New version.");
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        ok: false,
        error: { code: 'BACKEND_UNAVAILABLE', message: 'The server is busy. Try that again in a moment.' }
      }));
    }
    console.error('Proxy Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: String(err.message || err) }
    }));
  }
}
