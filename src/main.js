/**
 * main.js — Application entry point and HUD synchronization
 */

import { api } from './api.js';
import { session, levelProgress, levelTitle } from './session.js';
import { stage } from './three/stage.js';
import { tierManager } from './three/tier.js';
import { Router } from './router.js';
import { soundscape } from './audio/soundscape.js';
import { setBenchHost } from './learn/engine/bench-host.js';

/** Guild liveries, keyed by team id. Legacy ids are aliased in session.js. */
const TEAM_LIVERY = {
  earth: 'var(--team-earth)',
  air: 'var(--team-air)',
  fire: 'var(--team-fire)',
  water: 'var(--team-water)',
  terra: 'var(--team-earth)',
  zephyr: 'var(--team-air)',
  ignis: 'var(--team-fire)',
  thalassa: 'var(--team-water)'
};

async function bootstrapApp() {
  const appContainer = document.getElementById('app');

  // 1. Initialize 3D Engine
  stage.init();

  // The Learn track's 3D benches render through the same loop the campaign's
  // containment chamber does. Registered here rather than imported there, so a
  // quest module stays loadable in plain Node for `npm run verify:learn`.
  setBenchHost({
    mount: viewer => stage.setQuestScene(viewer),
    unmount: viewer => {
      if (stage.activeQuestViewer === viewer) stage.exitQuestScene();
    }
  });

  // 2. Setup HUD & Navigation immediately
  setupHud();

  // 3. Start Client Router immediately (foreground displays with zero network delay)
  const router = new Router(appContainer);
  router.init();

  // 4. Fetch Initial Bootstrap Config & User State asynchronously
  try {
    const raw = await api.bootstrap();
    const boot = (raw && typeof raw === 'object') ? raw : {};

    if (boot.config || boot.teams) {
      session.setConfigAndTeams(boot.config || {}, boot.teams || []);
    }
    if (boot.events) session.events = boot.events;
    if (boot.activeQuest) session.activeQuest = boot.activeQuest;

    if (boot.player) {
      session.setUserData(boot.player);
      // Learn-track rows ride along on the bootstrap payload but are merged
      // separately: they carry no XP and must never go through setUserData.
      if (Array.isArray(boot.player.learn)) session.setLearnState(boot.player.learn);
      const teamId = boot.player.player?.team_id || boot.player.team_id;
      if (!teamId && (window.location.hash === '#/' || window.location.hash === '')) {
        window.location.hash = '#/onboarding';
      }
    } else if (session.token && boot.player === null && !boot.degraded) {
      // `degraded` means the proxy could not reach the backend and answered
      // with public config only. It does not know who is signed in, so a
      // missing player there is no evidence the token is dead — clearing on it
      // logged students out every time Apps Script hiccupped.
      session.clear();
      if (window.location.hash !== '#/' && window.location.hash !== '#/demo') {
        window.location.hash = '#/login';
      }
    } else if (boot.degraded) {
      console.warn('Bootstrap served from fallback; keeping cached session.');
    }
  } catch (err) {
    console.error('Bootstrap call failed, continuing with cached session:', err);
  }
}

function setupHud() {
  const navEl = document.getElementById('hud-nav');
  const statsEl = document.getElementById('hud-stats');
  const xpVal = document.getElementById('hud-xp-val');
  const xpFill = document.getElementById('hud-xp-fill');
  const lvlBadge = document.getElementById('hud-level-badge');
  const teamBadge = document.getElementById('hud-team-badge');

  const userBtn = document.getElementById('user-btn');
  const userMenu = document.getElementById('user-dropdown');
  const userName = document.getElementById('user-display-name');
  const adminLink = document.getElementById('admin-link');
  const logoutBtn = document.getElementById('logout-btn');

  const tierToggle = document.getElementById('gfx-tier-toggle');
  const motionToggle = document.getElementById('motion-toggle');
  const soundToggle = document.getElementById('sound-toggle');

  // Graphics tier button
  tierToggle?.addEventListener('click', () => {
    tierManager.cycleTier();
  });

  // Motion toggle
  motionToggle?.addEventListener('click', () => {
    const next = !session.reduceMotion;
    session.setReduceMotion(next);
    motionToggle.textContent = next ? 'REDUCED MOTION' : 'MOTION';
  });
  if (motionToggle && session.reduceMotion) {
    motionToggle.textContent = 'REDUCED MOTION';
  }

  // Sound toggle
  const updateSoundBtn = () => {
    if (!soundToggle) return;
    const isMuted = session.sound?.muted;
    soundToggle.textContent = isMuted ? 'SOUND OFF' : 'SOUND ON';
    soundToggle.classList.toggle('warn', isMuted);
  };
  updateSoundBtn();

  soundToggle?.addEventListener('click', () => {
    const nextMuted = !session.sound?.muted;
    session.setSound({ muted: nextMuted });
    updateSoundBtn();
    if (!nextMuted) soundscape.playToggleClack();
  });

  // Delegated UI foley listeners across entire application
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target) return;

    if (target.closest('.btn-primary')) {
      soundscape.playKeyCapThunk();
    } else if (target.closest('.nav-btn')) {
      soundscape.playNavRelayClick();
    } else if (target.closest('.choice-option') || target.closest('[role="tab"]') || target.closest('.btn-secondary') || target.closest('.btn-chip')) {
      soundscape.playToggleClack();
    }
  });

  // User menu toggle
  userBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    userMenu?.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    userMenu?.classList.add('hidden');
  });

  logoutBtn?.addEventListener('click', () => {
    session.clear();
    window.location.hash = '#/';
  });

  // Navigation buttons — data-target is the route name itself
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      if (target) window.location.hash = `#/${target}`;
    });
  });

  // Subscribe to session changes to update HUD
  session.subscribe((s) => {
    if (s.player) {
      navEl?.classList.remove('hidden');
      statsEl?.classList.remove('hidden');
      userBtn?.classList.remove('hidden');
      if (userName) userName.textContent = (s.player.display_name || 'CREW').toUpperCase();

      const totalXp = s.xp || 0;
      const prog = levelProgress(totalXp);

      if (xpVal) xpVal.textContent = String(totalXp);
      if (lvlBadge) {
        lvlBadge.textContent = `LVL ${prog.level}`;
        lvlBadge.title = `${prog.into} / ${prog.needed} XP toward level ${prog.level + 1}`;
      }
      if (xpFill) xpFill.style.width = `${prog.pct}%`;

      if (teamBadge && s.team) {
        // The guild livery comes from the palette, never from the sheet: a stale
        // accent_hex in the Teams tab used to leak a bright web colour into the HUD.
        const tid = String(s.team.team_id || '').toLowerCase();
        const livery = TEAM_LIVERY[tid] || 'var(--accent-bronze)';
        teamBadge.textContent = (s.team.name || s.team.team_id || '').toUpperCase();
        teamBadge.style.borderColor = livery;
        teamBadge.style.color = livery;
      }

      if (adminLink) {
        if (s.isAdmin) adminLink.classList.remove('hidden');
        else adminLink.classList.add('hidden');
      }
    } else {
      navEl?.classList.add('hidden');
      statsEl?.classList.add('hidden');
      userBtn?.classList.add('hidden');
    }
  });

  session.notify();
}

window.addEventListener('DOMContentLoaded', bootstrapApp);
