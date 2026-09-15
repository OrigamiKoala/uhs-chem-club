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

// Call Google Apps Script backend
async function callAppsScript(route, body) {
  if (!APPS_SCRIPT_URL) {
    return localDevHandler(route, body);
  }

  const isPublicCacheable = (route === 'bootstrap' && (!body || !body.token)) || route === 'quest/manifest' || route === 'leaderboard';
  const cacheKey = route + ':' + JSON.stringify(body || {});
  if (isPublicCacheable) {
    const hit = getCached(cacheKey);
    if (hit) return hit;
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      k: PROXY_SECRET,
      route: route,
      body: body
    }),
    redirect: 'follow'
  });

  const text = await response.text();
  try {
    const result = JSON.parse(text);
    if (isPublicCacheable && result.ok) {
      setCached(cacheKey, result, route === 'leaderboard' ? 20000 : 60000);
    }
    return result;
  } catch (err) {
    throw new Error('Apps Script returned non-JSON response: ' + text.slice(0, 200));
  }
}

// --- Local dev mock fallback when APPS_SCRIPT_URL is not set ---
// Allows instant testing of full site & 3D quests before Google Sheet deployment.
const localStore = {
  players: [],
  submissions: [],
  inventory: [],
  nameHistory: [],
  teams: [
    { team_id: 'earth', name: 'earth', corp_name: 'earth', ship_name: 'earth', color_hex: '#1b5e20', accent_hex: '#4caf50', cap: 12, lore: '', emblem: 'geo' },
    { team_id: 'air', name: 'air', corp_name: 'air', ship_name: 'air', color_hex: '#006064', accent_hex: '#00e5ff', cap: 12, lore: '', emblem: 'aero' },
    { team_id: 'fire', name: 'fire', corp_name: 'fire', ship_name: 'fire', color_hex: '#bf360c', accent_hex: '#ff6e40', cap: 12, lore: '', emblem: 'pyro' },
    { team_id: 'water', name: 'water', corp_name: 'water', ship_name: 'water', color_hex: '#0d47a1', accent_hex: '#2979ff', cap: 12, lore: '', emblem: 'hydro' }
  ]
};

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
    return {
      ok: true,
      data: {
        token,
        player: p,
        team,
        xp: 120,
        level: 2,
        inventory: []
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
      const count = localStore.players.filter(p => p.team_id === t.team_id).length;
      return { ...t, count, available: Math.max(0, t.cap - count) };
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
          quest: { quest_id: 'q1', title: 'The Charge Gardens of Vareth-9', world: 'Vareth-9' },
          stages: [
            { stage_index: 0, kind: 'choice', xp: 0, max_attempts: 3, scene_config: { title: 'Arrival at Vareth-9', options: [{ id: 'a', label: 'Engage wideband electrostatic scanner' }, { id: 'b', label: 'Fire optical lidar' }] } },
            { stage_index: 1, kind: 'pick', xp: 10, max_attempts: 3, scene_config: { title: 'Stage 1: Calibrate the Scanner', prompt: 'Click the brightest, highest-density lobe to lock calibration.', moleculeId: 'h2o', anchors: ['lp_o', 'h1', 'h2'] } },
            { stage_index: 2, kind: 'rank', xp: 15, max_attempts: 3, scene_config: { title: 'Stage 2: Read the Lean', prompt: 'Rank the beacons from most polarized to most symmetric.', items: [{ id: 'hf', label: 'Beacon A (HF)' }, { id: 'lih', label: 'Beacon B (LiH)' }, { id: 'h2', label: 'Beacon C (H2)' }] } },
            { stage_index: 3, kind: 'pick_multi', xp: 20, max_attempts: 3, scene_config: { title: 'Stage 3: Giver and Taker', prompt: 'Select the donor lone pair and the starved carbon center.', moleculeId: 'nu_sub_pair', anchors: ['lp_o', 'c1', 'cl1'] } },
            { stage_index: 4, kind: 'arrow', xp: 25, max_attempts: 3, scene_config: { title: 'Stage 4: Route the Current', prompt: 'Drag an energy arrow from donor lone pair to starved carbon.', moleculeId: 'nu_sub_pair', anchors: ['lp_o', 'c1', 'cl1'] } },
            { stage_index: 5, kind: 'choice', xp: 25, max_attempts: 3, scene_config: { title: 'Stage 5: The Aftermath', options: [{ id: 'a', label: 'Pentavalent carbon' }, { id: 'b', label: 'C-O bond formed; chloride displaced' }, { id: 'c', label: 'Hydrogen detached' }] } },
            { stage_index: 6, kind: 'chain', xp: 40, max_attempts: 3, scene_config: { title: 'Stage 6: The Lock', prompt: 'Attack arrow followed by leaving-group departure arrow.', moleculeId: 'sn2_reaction', anchors: ['lp_o', 'c1', 'c_cl', 'cl'] } },
            { stage_index: 7, kind: 'chain', xp: 30, max_attempts: 3, scene_config: { title: 'Stage 7 (Bonus): Unlit Garden', prompt: 'Route both reaction arrows on the unscaffolded substrate.', moleculeId: 'bonus_reaction', anchors: ['lp_nu', 'c_sub', 'c_br', 'br'] } }
          ]
        },
        player: player ? {
          player: player,
          team: localStore.teams.find(t => t.team_id === player.team_id),
          xp: 120,
          level: 2,
          isAdmin: true
        } : null,
        events: {
          terra: { event_id: 'slipstream', name: 'Slipstream Current', polarity: 'good' },
          zephyr: { event_id: 'quiet_space', name: 'Quiet Space', polarity: 'neutral' },
          ignis: { event_id: 'solar_flare', name: 'Solar Flare', polarity: 'bad' },
          thalassa: { event_id: 'stellar_wind', name: 'Stellar Wind', polarity: 'good' }
        }
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
    }
    return {
      ok: true,
      data: {
        player: p || { player_id: pid, role: '', team_id: teamId },
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
    return {
      ok: true,
      data: {
        player: p,
        team: localStore.teams.find(t => t.team_id === teamId) || null,
        xp: 120,
        level: 2,
        isAdmin: p.email_lc === 'uhschemclub@gmail.com' || p.display_name_lc === 'admin'
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
    return {
      ok: true,
      data: {
        player: p,
        team: p ? localStore.teams.find(t => t.team_id === p.team_id) : null,
        xp: 120,
        level: 2
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
    return {
      ok: true,
      data: {
        player: p,
        team: p ? localStore.teams.find(t => t.team_id === p.team_id) : null,
        xp: 120,
        level: 2
      }
    };
  }

  if (route === 'quest/manifest') {
    return {
      ok: true,
      data: {
        quest: {
          quest_id: 'q1',
          title: 'The Charge Gardens of Vareth-9',
          world: 'Vareth-9',
          blurb: 'Survey paired molecular structures across the Vareth anomaly.',
          status: 'live',
          stage_count: 7,
          base_xp: 165
        },
        stages: [
          {
            stage_index: 0,
            kind: 'arrow',
            xp: 15,
            max_attempts: 3,
            hint_cost: 0,
            scene_config: {
              title: 'Phase 1: Direct Transfer',
              prompt: 'Drag an arrow from the red region to the blue region to initiate the reaction.',
              moleculeId: 'stage1_pair',
              anchors: ['red_lp1', 'blue_c1']
            }
          },
          {
            stage_index: 1,
            kind: 'arrow',
            xp: 15,
            max_attempts: 3,
            hint_cost: 1,
            scene_config: {
              title: 'Phase 2: Polarized Target',
              prompt: 'Connect the active red region to the blue target site.',
              moleculeId: 'stage2_pair',
              anchors: ['red_lp1', 'blue_c1']
            }
          },
          {
            stage_index: 2,
            kind: 'arrow',
            xp: 20,
            max_attempts: 3,
            hint_cost: 2,
            scene_config: {
              title: 'Phase 3: Competing Potentials',
              prompt: 'Multiple colored regions detected. Find and connect the strongest match.',
              moleculeId: 'stage3_pair',
              anchors: ['red_weak', 'red_extreme', 'blue_extreme', 'blue_weak']
            }
          },
          {
            stage_index: 3,
            kind: 'arrow',
            xp: 20,
            max_attempts: 3,
            hint_cost: 2,
            scene_config: {
              title: 'Phase 4: Site Selectivity',
              prompt: 'Analyze competing nodes across both molecules and route between the strongest pair.',
              moleculeId: 'stage4_pair',
              anchors: ['red_weak', 'red_extreme', 'blue_extreme', 'blue_weak']
            }
          },
          {
            stage_index: 4,
            kind: 'arrow',
            xp: 25,
            max_attempts: 3,
            hint_cost: 3,
            scene_config: {
              title: 'Phase 5: Spatial Pathways',
              prompt: 'Connect the red source to an accessible blue target.',
              moleculeId: 'stage5_pair',
              anchors: ['red_nu', 'blue_open', 'blue_blocked']
            }
          },
          {
            stage_index: 5,
            kind: 'arrow',
            xp: 25,
            max_attempts: 3,
            hint_cost: 3,
            scene_config: {
              title: 'Phase 6: Geometric Clearance',
              prompt: 'Inspect the 3D geometry and connect the red region to the unshielded blue site.',
              moleculeId: 'stage6_pair',
              anchors: ['red_nu', 'blue_open', 'blue_blocked']
            }
          },
          {
            stage_index: 6,
            kind: 'arrow',
            xp: 30,
            max_attempts: 3,
            hint_cost: 4,
            scene_config: {
              title: 'Phase 7: Nexus Reaction',
              prompt: 'Identify the active pair among all competing and shielded sites.',
              moleculeId: 'stage7_pair',
              anchors: ['red_weak1', 'red_weak2', 'red_supreme', 'blue_accessible', 'blue_caged', 'blue_weak']
            }
          }
        ]
      }
    };
  }

  if (route === 'quest/grade' || route === 'demo/grade') {
    const stageIdx = Number(body.stageIndex);
    const p = body.payload || {};
    let correct = false;
    let revealText = '';
    let isBlocked = false;

    if (stageIdx === 0) {
      correct = (p.from === 'red_lp1' && p.to === 'blue_c1');
      if (correct) revealText = 'The red region contains high electron density (lone pair) that seeks out the electron-deficient blue region (empty p-orbital) to form a bond.';
    } else if (stageIdx === 1) {
      correct = (p.from === 'red_lp1' && p.to === 'blue_c1');
      if (correct) revealText = 'Electrons flow from the concentrated donor lone pair into the polarized carbon center, beginning a nucleophilic substitution.';
    } else if (stageIdx === 2) {
      correct = (p.from === 'red_extreme' && p.to === 'blue_extreme');
      if (correct) revealText = 'When multiple sites compete, the most extreme electron density (strongest nucleophile) attacks the most electron-starved center (most electrophilic carbonyl carbon).';
    } else if (stageIdx === 3) {
      correct = (p.from === 'red_extreme' && p.to === 'blue_extreme');
      if (correct) revealText = 'The less electronegative nitrogen holds its lone pair more loosely than oxygen, creating a more extreme nucleophile that attacks the carbonyl carbon.';
    } else if (stageIdx === 4) {
      if (p.to === 'blue_blocked') isBlocked = true;
      correct = (p.from === 'red_nu' && p.to === 'blue_open');
      if (correct) revealText = 'Steric hindrance! Although the tertiary carbon is intensely electrophilic, bulky methyl groups physically block incoming groups, forcing the reaction to occur at the unhindered primary carbon.';
      else if (isBlocked) revealText = 'Trajectory obstructed: surrounding atoms physically shield this center from entry.';
    } else if (stageIdx === 5) {
      if (p.to === 'blue_blocked') isBlocked = true;
      correct = (p.from === 'red_nu' && p.to === 'blue_open');
      if (correct) revealText = 'Steric congestion shields the branched carbonyl site with bulky isopropyl wings. The nucleophile selectively attacks the open, unhindered carbonyl flank.';
      else if (isBlocked) revealText = 'Trajectory obstructed: surrounding atoms physically shield this center from entry.';
    } else if (stageIdx === 6) {
      if (p.to === 'blue_caged') isBlocked = true;
      correct = (p.from === 'red_supreme' && p.to === 'blue_accessible');
      if (correct) revealText = 'Mastery achieved! In complex organic synthesis, reaction outcome is dictated by the interplay of electron density (nucleophilicity/electrophilicity) and steric hindrance.';
      else if (isBlocked) revealText = 'Trajectory obstructed: surrounding cage groups physically prevent donor approach.';
    }

    return {
      ok: true,
      data: {
        correct,
        xpAwarded: correct ? (20 + stageIdx * 2) : 0,
        revealText,
        attemptsLeft: 2,
        nextStage: correct ? stageIdx + 1 : stageIdx
      }
    };
  }

  if (route === 'quest/complete') {
    return {
      ok: true,
      data: {
        totalXp: 185,
        awardedItem: 'resonance_key',
        newLevel: 3,
        epilogue: 'Quest complete! Here is the chemistry behind what you just discovered:\n\n1. Electron Density & Curved Arrows: The red regions represent high electron density (lone pairs / negative charge), while blue regions represent electron deficiency (positive partial charges / electrophiles). The arrows you drew match standard curved-arrow notation in organic chemistry, tracking the physical flow of electrons from source to target.\n\n2. Extremes & Selectivity: When multiple reactive sites compete, reactions preferentially proceed between the most electron-rich donor (strongest nucleophile) and most electron-poor center (strongest electrophile).\n\n3. Steric Hindrance: Physical geometry matters! Even when a site has strong positive charge, surrounding bulky groups (like methyl or isopropyl clusters) can physically block incoming molecules, steering reactions toward open, unhindered pathways.'
      }
    };
  }

  if (route === 'leaderboard') {
    return {
      ok: true,
      data: {
        individual: [
          { rank: 1, display_name: 'AstraNova', team_id: 'air', role: '', xp: 245, level: 3, level_title: 'Scout' },
          { rank: 2, display_name: 'ProtonPulse', team_id: 'fire', role: '', xp: 210, level: 3, level_title: 'Scout' },
          { rank: 3, display_name: 'KelvinZero', team_id: 'water', role: '', xp: 195, level: 2, level_title: 'Cadet' },
          { rank: 4, display_name: 'TerraFirm', team_id: 'earth', role: '', xp: 180, level: 2, level_title: 'Cadet' }
        ],
        teams: [
          { rank: 1, team_id: 'air', name: 'air', team_score: 220, roster_size: 10, active_members: 9 },
          { rank: 2, team_id: 'fire', name: 'fire', team_score: 205, roster_size: 11, active_members: 9 },
          { rank: 3, team_id: 'water', name: 'water', team_score: 190, roster_size: 9, active_members: 8 },
          { rank: 4, team_id: 'earth', name: 'earth', team_score: 185, roster_size: 10, active_members: 7 }
        ]
      }
    };
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

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local';

  try {
    // Intercept auth routes to perform scrypt hashing
    if (path === 'auth/register') {
      if (isRateLimited('reg:' + clientIp, 10, 60000)) {
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
      if (isRateLimited('login:' + clientIp, 20, 60000)) {
        res.statusCode = 429;
        return res.end(JSON.stringify({ ok: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Slow down.' } }));
      }

      const { identifier, password } = body;
      if (!identifier || !password) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: { code: 'MISSING_FIELDS', message: 'Identifier and password are required.' } }));
      }

      // 1. Fetch salt from cache or backend
      const idLc = identifier.toLowerCase();
      let saltB64 = saltCache.get(idLc);
      if (!saltB64) {
        const saltResp = await callAppsScript('auth/salt', { identifier });
        saltB64 = saltResp?.data?.salt || Buffer.from(identifier).toString('base64');
        saltCache.set(idLc, saltB64);
      }

      // 2. Derive key with scrypt
      const dk = await derivePassword(password, saltB64);

      // 3. Call backend auth/login with derived key
      const result = await callAppsScript('auth/login', { identifier, dk });

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

    // Pass through any other routes to Apps Script backend
    const result = await callAppsScript(path, body);
    res.statusCode = result.ok ? 200 : 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(result));
  } catch (err) {
    console.error('Proxy Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: String(err.message || err) }
    }));
  }
}
