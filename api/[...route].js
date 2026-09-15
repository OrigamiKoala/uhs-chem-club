import { scrypt, randomBytes } from 'node:crypto';

const PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };
const PEPPER = process.env.PEPPER || 'avalon_dev_pepper_do_not_use_in_prod_123';
const PROXY_SECRET = process.env.PROXY_SECRET || 'avalon_proxy_secret_change_in_prod';
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || '';

// In-memory rate limiting map
const rateLimits = new Map();

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
    { team_id: 'terra', name: 'Terra', corp_name: 'Terra Dominion', ship_name: 'TDS Lodestone', color_hex: '#1b5e20', accent_hex: '#4caf50', cap: 12, lore: 'Heavy metallurgy and mineral synthesis.', emblem: 'geo' },
    { team_id: 'zephyr', name: 'Zephyr', corp_name: 'Zephyr Aeronautics', ship_name: 'ZAS Windward', color_hex: '#006064', accent_hex: '#00e5ff', cap: 12, lore: 'Atmospheric distillation and fluid kinetics.', emblem: 'aero' },
    { team_id: 'ignis', name: 'Ignis', corp_name: 'Ignis Combine', ship_name: 'ICS Emberline', color_hex: '#bf360c', accent_hex: '#ff6e40', cap: 12, lore: 'High-energy combustion and plasma catalysis.', emblem: 'pyro' },
    { team_id: 'thalassa', name: 'Thalassa', corp_name: 'Thalassa Deepworks', ship_name: 'TDW Tideglass', color_hex: '#0d47a1', accent_hex: '#2979ff', cap: 12, lore: 'Aqueous solvent extractions and deep pressure chemistry.', emblem: 'hydro' }
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
    return { ok: true, data: { token, player: p } };
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
    if (p) {
      p.role = body.role;
      p.team_id = body.teamId;
      p.avatar_json = typeof body.avatar === 'object' ? JSON.stringify(body.avatar) : body.avatar;
    }
    return {
      ok: true,
      data: {
        player: p || { player_id: pid, role: body.role, team_id: body.teamId },
        team: localStore.teams.find(t => t.team_id === body.teamId),
        xp: 0,
        level: 1
      }
    };
  }

  if (route === 'quest/grade' || route === 'demo/grade') {
    const stageIdx = Number(body.stageIndex);
    let correct = false;
    let revealText = '';

    if (stageIdx === 0) correct = (body.payload?.correct?.[0] === 'a');
    else if (stageIdx === 1) correct = (body.payload?.anchors?.[0] === 'lp_o');
    else if (stageIdx === 2) correct = (JSON.stringify(body.payload?.order) === JSON.stringify(['hf', 'lih', 'h2']));
    else if (stageIdx === 3) correct = (body.payload?.anchors?.includes('lp_o') && body.payload?.anchors?.includes('c1'));
    else if (stageIdx === 4) correct = (body.payload?.from === 'lp_o' && body.payload?.to === 'c1');
    else if (stageIdx === 5) correct = (body.payload?.correct?.[0] === 'b');
    else if (stageIdx === 6 || stageIdx === 7) correct = true;

    if (correct) revealText = 'Charge routed successfully! Telemetry confirmed.';

    return {
      ok: true,
      data: {
        correct,
        xpAwarded: correct ? 25 : 0,
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
        epilogue: 'The crowded places you clicked are lone pairs. The starved places are electrophiles. The arrow you drew is curved-arrow notation!'
      }
    };
  }

  if (route === 'leaderboard') {
    return {
      ok: true,
      data: {
        individual: [
          { rank: 1, display_name: 'AstraNova', team_id: 'zephyr', role: 'Navigator', xp: 245, level: 3, level_title: 'Scout' },
          { rank: 2, display_name: 'ProtonPulse', team_id: 'ignis', role: 'Engineer', xp: 210, level: 3, level_title: 'Scout' },
          { rank: 3, display_name: 'KelvinZero', team_id: 'thalassa', role: 'Xenobiologist', xp: 195, level: 2, level_title: 'Cadet' },
          { rank: 4, display_name: 'TerraFirm', team_id: 'terra', role: 'Quartermaster', xp: 180, level: 2, level_title: 'Cadet' }
        ],
        teams: [
          { rank: 1, team_id: 'zephyr', name: 'Zephyr', ship_name: 'ZAS Windward', team_score: 220, roster_size: 10, active_members: 9 },
          { rank: 2, team_id: 'ignis', name: 'Ignis', ship_name: 'ICS Emberline', team_score: 205, roster_size: 11, active_members: 9 },
          { rank: 3, team_id: 'thalassa', name: 'Thalassa', ship_name: 'TDW Tideglass', team_score: 190, roster_size: 9, active_members: 8 },
          { rank: 4, team_id: 'terra', name: 'Terra', ship_name: 'TDS Lodestone', team_score: 185, roster_size: 10, active_members: 7 }
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

      // 1. Fetch salt from backend (or get dummy salt)
      const saltResp = await callAppsScript('auth/salt', { identifier });
      const saltB64 = saltResp?.data?.salt || Buffer.from(identifier).toString('base64');

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
