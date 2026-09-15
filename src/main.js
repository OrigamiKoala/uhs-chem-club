/**
 * main.js — Application entry point and HUD synchronization
 */

import { api } from './api.js';
import { session } from './session.js';
import { stage } from './three/stage.js';
import { tierManager } from './three/tier.js';
import { Router } from './router.js';

async function bootstrapApp() {
  const appContainer = document.getElementById('app');

  // 1. Initialize 3D Engine
  stage.init();

  // 2. Setup HUD & Navigation immediately
  setupHud();

  // 3. Start Client Router immediately (foreground displays with zero network delay)
  const router = new Router(appContainer);
  router.init();

  // 4. Fetch Initial Bootstrap Config & User State asynchronously
  try {
    const boot = await api.bootstrap();
    if (boot.config || boot.teams) {
      session.setConfigAndTeams(boot.config || {}, boot.teams || []);
    }
    session.events = boot.events || {};
    session.activeQuest = boot.activeQuest || null;

    if (boot.player) {
      session.setUserData(boot.player);
      const teamId = boot.player.player?.team_id || boot.player.team_id;
      if (!teamId && (window.location.hash === '#/' || window.location.hash === '')) {
        window.location.hash = '#/onboarding';
      }
    } else if (session.token && boot.player === null) {
      session.clear();
      if (window.location.hash !== '#/' && window.location.hash !== '#/demo') {
        window.location.hash = '#/login';
      }
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

  // Graphics tier button
  tierToggle?.addEventListener('click', () => {
    tierManager.cycleTier();
  });

  // Motion toggle
  motionToggle?.addEventListener('click', () => {
    const next = !session.reduceMotion;
    session.setReduceMotion(next);
    motionToggle.textContent = next ? 'MOTION REDUCED' : 'MOTION ON';
  });
  if (motionToggle && session.reduceMotion) {
    motionToggle.textContent = 'MOTION REDUCED';
  }

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

  // Navigation buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      if (target === 'bridge') window.location.hash = '#/bridge';
      else if (target === 'starmap') window.location.hash = '#/starmap';
      else if (target === 'comms') window.location.hash = '#/leaderboard';
      else if (target === 'cargo') window.location.hash = '#/cargo';
      else if (target === 'quarters') window.location.hash = '#/quarters';
    });
  });

  // Subscribe to session changes to update HUD
  session.subscribe((s) => {
    if (s.player) {
      navEl?.classList.remove('hidden');
      statsEl?.classList.remove('hidden');
      userBtn?.classList.remove('hidden');
      if (userName) userName.textContent = (s.player.display_name || 'EXPLORER').toUpperCase();

      if (xpVal) xpVal.textContent = String(s.xp || 0);
      if (lvlBadge) lvlBadge.textContent = `LVL ${s.level || 1}`;

      const pct = Math.min(100, Math.round(((s.xp % 45) / 45) * 100));
      if (xpFill) xpFill.style.width = `${pct}%`;

      if (teamBadge && s.team) {
        teamBadge.textContent = s.team.name || s.team.team_id;
        teamBadge.style.background = s.team.color_hex || 'rgba(0, 229, 255, 0.2)';
        teamBadge.style.color = '#fff';
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
