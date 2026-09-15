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
      const checkStages = result.data.stages || result.data.activeQuest?.stages;
      if (Array.isArray(checkStages) && checkStages.length > 0) {
        const first = checkStages[0];
        if (first.kind === 'choice' || !first.scene_config?.moleculeId) {
          const canonical = [
            { stage_index: 0, kind: 'arrow', xp: 15, max_attempts: 3, scene_config: { title: 'Stage 1', prompt: 'Drag an arrow from the densest donor region (red) to the least dense acceptor center (blue).', moleculeId: 'stage1_pair', anchors: ['red_lp1', 'blue_c1'] } },
            { stage_index: 1, kind: 'arrow', xp: 15, max_attempts: 3, scene_config: { title: 'Stage 2', prompt: 'Connect the donor site (red) to the polarized target site (blue).', moleculeId: 'stage2_pair', anchors: ['red_lp1', 'blue_c1'] } },
            { stage_index: 2, kind: 'arrow', xp: 20, max_attempts: 3, scene_config: { title: 'Stage 3', prompt: 'Multiple reactive sites: route the arrow between the strongest donor (extreme red) and the strongest acceptor (extreme blue).', moleculeId: 'stage3_pair', anchors: ['red_weak', 'red_extreme', 'blue_extreme', 'blue_weak'] } },
            { stage_index: 3, kind: 'arrow', xp: 20, max_attempts: 3, scene_config: { title: 'Stage 4', prompt: 'Select the primary reactive site (extreme red) and connect to the primary acceptor center (extreme blue).', moleculeId: 'stage4_pair', anchors: ['red_weak', 'red_extreme', 'blue_extreme', 'blue_weak'] } },
            { stage_index: 4, kind: 'arrow', xp: 25, max_attempts: 3, scene_config: { title: 'Stage 5', prompt: 'Steric hindrance: orbit the view to find the open, accessible target site (blue) and connect from the donor (red).', moleculeId: 'stage5_pair', anchors: ['red_nu', 'blue_open', 'blue_blocked'] } },
            { stage_index: 5, kind: 'arrow', xp: 25, max_attempts: 3, scene_config: { title: 'Stage 6', prompt: 'Bulky groups shield one site: orbit the view to target the accessible center (blue).', moleculeId: 'stage6_pair', anchors: ['red_nu', 'blue_open', 'blue_blocked'] } },
            { stage_index: 6, kind: 'arrow', xp: 30, max_attempts: 3, scene_config: { title: 'Stage 7', prompt: 'Master challenge: identify the unhindered active site among multiple centers and route the arrow from the strongest donor.', moleculeId: 'stage7_pair', anchors: ['red_weak1', 'red_weak2', 'red_supreme', 'blue_accessible', 'blue_caged', 'blue_weak'] } }
          ];
          if (result.data.stages) result.data.stages = canonical;
          if (result.data.activeQuest) result.data.activeQuest.stages = canonical;
        }
      }
    }
    if (isPublicCacheable && result.ok) {
      setCached(cacheKey, result, route === 'leaderboard' ? 20000 : 60000);
    }
    return result;
  } catch (err) {
    const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'HTML page';
    throw new Error(`Apps Script returned non-JSON (${title}). Verify in Apps Script: 1) Run 'setup' once to grant permissions; 2) Deploy as Web app with 'Execute as: Me' and 'Who has access: Anyone'; 3) In Manage Deployments, click Edit (pencil) and select Version: 'New version' then Deploy.`);
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
    { team_id: 'earth', name: 'Earth', corp_name: 'Earth', ship_name: 'Earth', color_hex: '#1b5e20', accent_hex: '#a3824c', cap: 12, lore: '', emblem: 'geo' },
    { team_id: 'air', name: 'Air', corp_name: 'Air', ship_name: 'Air', color_hex: '#006064', accent_hex: '#8a9ba8', cap: 12, lore: '', emblem: 'aero' },
    { team_id: 'fire', name: 'Fire', corp_name: 'Fire', ship_name: 'Fire', color_hex: '#bf360c', accent_hex: '#c85a17', cap: 12, lore: '', emblem: 'pyro' },
    { team_id: 'water', name: 'Water', corp_name: 'Water', ship_name: 'Water', color_hex: '#0d47a1', accent_hex: '#2a9d8f', cap: 12, lore: '', emblem: 'hydro' }
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
          quest: { quest_id: 'q1', title: 'The Charge Gardens of Erebus', world: 'Erebus' },
          stages: [
            { stage_index: 0, kind: 'arrow', xp: 15, max_attempts: 3, scene_config: { title: 'Stage 1', prompt: 'Drag an arrow from the densest donor region (red) to the least dense acceptor center (blue).', moleculeId: 'stage1_pair', anchors: ['red_lp1', 'blue_c1'] } },
            { stage_index: 1, kind: 'arrow', xp: 15, max_attempts: 3, scene_config: { title: 'Stage 2', prompt: 'Connect the donor site (red) to the polarized target site (blue).', moleculeId: 'stage2_pair', anchors: ['red_lp1', 'blue_c1'] } },
            { stage_index: 2, kind: 'arrow', xp: 20, max_attempts: 3, scene_config: { title: 'Stage 3', prompt: 'Multiple reactive sites: route the arrow between the strongest donor (extreme red) and the strongest acceptor (extreme blue).', moleculeId: 'stage3_pair', anchors: ['red_weak', 'red_extreme', 'blue_extreme', 'blue_weak'] } },
            { stage_index: 3, kind: 'arrow', xp: 20, max_attempts: 3, scene_config: { title: 'Stage 4', prompt: 'Select the primary reactive site (extreme red) and connect to the primary acceptor center (extreme blue).', moleculeId: 'stage4_pair', anchors: ['red_weak', 'red_extreme', 'blue_extreme', 'blue_weak'] } },
            { stage_index: 4, kind: 'arrow', xp: 25, max_attempts: 3, scene_config: { title: 'Stage 5', prompt: 'Steric hindrance: orbit the view to find the open, accessible target site (blue) and connect from the donor (red).', moleculeId: 'stage5_pair', anchors: ['red_nu', 'blue_open', 'blue_blocked'] } },
            { stage_index: 5, kind: 'arrow', xp: 25, max_attempts: 3, scene_config: { title: 'Stage 6', prompt: 'Bulky groups shield one site: orbit the view to target the accessible center (blue).', moleculeId: 'stage6_pair', anchors: ['red_nu', 'blue_open', 'blue_blocked'] } },
            { stage_index: 6, kind: 'arrow', xp: 30, max_attempts: 3, scene_config: { title: 'Stage 7', prompt: 'Master challenge: identify the unhindered active site among multiple centers and route the arrow from the strongest donor.', moleculeId: 'stage7_pair', anchors: ['red_weak1', 'red_weak2', 'red_supreme', 'blue_accessible', 'blue_caged', 'blue_weak'] } }
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
          earth: { event_id: 'slipstream', name: 'Slipstream Current', polarity: 'good' },
          air: { event_id: 'quiet_space', name: 'Quiet Space', polarity: 'neutral' },
          fire: { event_id: 'solar_flare', name: 'Solar Flare', polarity: 'bad' },
          water: { event_id: 'stellar_wind', name: 'Stellar Wind', polarity: 'good' }
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
          title: 'The Charge Gardens of Erebus',
          world: 'Erebus',
          blurb: 'Survey paired molecular structures across the Erebus anomaly.',
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
              title: 'Stage 1',
              prompt: 'Drag an arrow from the densest donor region (red) to the least dense acceptor center (blue).',
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
              title: 'Stage 2',
              prompt: 'Connect the donor site (red) to the polarized target site (blue).',
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
              title: 'Stage 3',
              prompt: 'Multiple reactive sites: route the arrow between the strongest donor (extreme red) and the strongest electrophile (extreme blue).',
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
              title: 'Stage 4',
              prompt: 'Select the primary reactive site (extreme red) and connect to the electrophilic center (extreme blue).',
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
              title: 'Stage 5',
              prompt: 'Steric hindrance: orbit the view to find the open, accessible target site (blue) and connect from the donor (red).',
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
              title: 'Stage 6',
              prompt: 'Bulky groups shield one site: orbit the view to target the accessible center (blue).',
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
              title: 'Stage 7',
              prompt: 'Master challenge: identify the unhindered active site among multiple centers and route the arrow from the strongest donor.',
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
    }

    return {
      ok: true,
      data: {
        correct,
        xpAwarded: correct ? (20 + stageIdx * 2) : 0,
        blocked: isBlocked,
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
        epilogue: 'Quest complete! You successfully navigated all stages and routed the connections across the structures.'
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
