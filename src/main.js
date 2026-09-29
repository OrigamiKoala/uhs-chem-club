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
import { gameMode } from './game-mode.js';
import { showToast } from './ui/toast.js';
import { nextLevelRequisition } from './progression/requisitions.js';
import { progressionFeed } from './progression/feed.js';
import { initPwaAndOrientation } from './pwa-install.js';

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

  // 0. Full-screen play. Installed to a Home Screen there is no chrome to
  //    hide, so this reports game mode as already on from the first frame.
  gameMode.init();

  // Initialize PWA installation prompts and mobile orientation enforcement
  initPwaAndOrientation();

  // 1. Initialize 3D Engine
  stage.init();

  // The Learn track's 3D benches render through the same loop the campaign's
  // containment chamber does. Registered here rather than imported there, so a
  // quest module stays loadable in plain Node for `npm run verify:learn`.
  setBenchHost({
    mount: viewer => stage.setQuestScene(viewer),
    unmount: viewer => {
      if (stage.activeQuestViewer === viewer) stage.exitQuestScene();
    },
    // Where that quest's bench physically stands, when the player walked to it.
    deployment: questId => stage.benchDeployment(questId)
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
  const soundToggle = document.getElementById('sound-toggle');
  const fullscreenToggle = document.getElementById('fullscreen-toggle');

  // 3D toggle button (3D On / 3D Off)
  const sync3DBtn = () => {
    const label = document.getElementById('gfx-tier-label');
    if (label) label.textContent = tierManager.is3D() ? '3D ON' : '3D OFF';
    const dot = tierToggle?.querySelector('.gfx-dot');
    if (dot) dot.classList.toggle('is-off', !tierManager.is3D());
  };
  tierToggle?.addEventListener('click', () => {
    tierManager.toggle3D();
    const is3D = tierManager.is3D();
    showToast(is3D ? 'Graphics: 3D On' : 'Graphics: 3D Off', 'info');
    sync3DBtn();
  });
  tierManager.subscribe(() => sync3DBtn());
  sync3DBtn();

  // Full-screen key. Only shown on a touch device (CSS in mobile-game.css)
  // where element fullscreen is actually supported.
  if (fullscreenToggle) {
    const syncFullscreenBtn = (active) => {
      fullscreenToggle.textContent = active ? 'WINDOW' : 'FULL';
      fullscreenToggle.classList.toggle('active', Boolean(active));
    };
    // If standalone or unable to element-fullscreen, full-screen key is hidden;
    // PWA installation is handled prominently by the flaunted install button.
    if (gameMode.isStandalone() || !gameMode.canFullscreen()) {
      fullscreenToggle.classList.add('hidden');
    } else {
      syncFullscreenBtn(gameMode.active);
      gameMode.subscribe(syncFullscreenBtn);
      fullscreenToggle.addEventListener('click', () => { gameMode.toggle(); });
    }
  }

  // Sound toggle (compact icon)
  const SOUND_ON_ICON = '<svg class="hud-sound-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
  const SOUND_OFF_ICON = '<svg class="hud-sound-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><line x1="22" y1="9" x2="16" y2="15"></line><line x1="16" y1="9" x2="22" y2="15"></line></svg>';

  const updateSoundBtn = () => {
    if (!soundToggle) return;
    const isMuted = Boolean(session.sound?.muted);
    soundToggle.innerHTML = isMuted ? SOUND_OFF_ICON : SOUND_ON_ICON;
    soundToggle.title = isMuted ? 'Sound: Muted (click to unmute)' : 'Sound: Enabled (click to mute)';
    soundToggle.setAttribute('aria-label', isMuted ? 'Sound muted, click to unmute' : 'Sound active, click to mute');
    soundToggle.classList.toggle('warn', isMuted);
    soundToggle.classList.toggle('is-muted', isMuted);
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

  // Mobile menu and sidebar
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileSidebar = document.getElementById('mobile-sidebar');
  const mobileBackdrop = document.getElementById('mobile-sidebar-backdrop');
  const mobileSidebarClose = document.getElementById('mobile-sidebar-close');
  const mobileSidebarBrand = document.getElementById('mobile-sidebar-brand');
  const mobileSidebarProfile = document.getElementById('mobile-sidebar-profile');
  const mobileSidebarName = document.getElementById('mobile-sidebar-name');
  const mobileSidebarAvatar = document.getElementById('mobile-sidebar-avatar-glyph');
  const mobileSidebarLevel = document.getElementById('mobile-sidebar-level');
  const mobileSidebarTeam = document.getElementById('mobile-sidebar-team');
  const mobileSidebarXp = document.getElementById('mobile-sidebar-xp');
  const mobileSidebarXpFill = document.getElementById('mobile-sidebar-xp-fill');
  const mobileSidebarAdmin = document.getElementById('mobile-sidebar-admin-link');
  const mobileSidebarLogout = document.getElementById('mobile-sidebar-logout-btn');
  const mobileSidebarLogin = document.getElementById('mobile-sidebar-login-btn');

  const openMobileSidebar = () => {
    mobileSidebar?.classList.add('open');
    mobileBackdrop?.classList.add('open');
    mobileSidebar?.setAttribute('aria-hidden', 'false');
    mobileMenuBtn?.classList.add('is-open');
    mobileMenuBtn?.setAttribute('aria-expanded', 'true');
    soundscape.playToggleClack();
  };

  const closeMobileSidebar = () => {
    mobileSidebar?.classList.remove('open');
    mobileBackdrop?.classList.remove('open');
    mobileSidebar?.setAttribute('aria-hidden', 'true');
    mobileMenuBtn?.classList.remove('is-open');
    mobileMenuBtn?.setAttribute('aria-expanded', 'false');
  };

  mobileMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mobileSidebar?.classList.contains('open')) {
      closeMobileSidebar();
    } else {
      openMobileSidebar();
    }
  });

  mobileSidebarClose?.addEventListener('click', closeMobileSidebar);
  mobileBackdrop?.addEventListener('click', closeMobileSidebar);
  mobileSidebarBrand?.addEventListener('click', () => {
    closeMobileSidebar();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileSidebar?.classList.contains('open')) {
      closeMobileSidebar();
    }
  });

  // Close sidebar on any nav button or link click inside it
  mobileSidebar?.querySelectorAll('.nav-btn, .sidebar-link-btn, #mobile-sidebar-login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      closeMobileSidebar();
    });
  });

  mobileSidebarLogout?.addEventListener('click', () => {
    session.clear();
    closeMobileSidebar();
    window.location.hash = '#/';
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && mobileSidebar?.classList.contains('open')) {
      closeMobileSidebar();
    }
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
    updateSoundBtn();
    if (s.player) {
      navEl?.classList.remove('hidden');
      statsEl?.classList.remove('hidden');
      userBtn?.classList.remove('hidden');
      if (userName) userName.textContent = (s.player.display_name || 'CREW').toUpperCase();

      const totalXp = s.xp || 0;
      const prog = levelProgress(totalXp);
      const title = levelTitle(prog.level);
      const nextReq = nextLevelRequisition(prog.level);

      // Sync mobile sidebar profile
      mobileSidebarProfile?.classList.remove('hidden');
      mobileSidebarLogout?.classList.remove('hidden');
      mobileSidebarLogin?.classList.add('hidden');
      const displayName = s.player.display_name || 'CREW';
      if (mobileSidebarName) mobileSidebarName.textContent = displayName.toUpperCase();
      if (mobileSidebarAvatar) mobileSidebarAvatar.textContent = (displayName[0] || 'C').toUpperCase();
      if (mobileSidebarLevel) mobileSidebarLevel.textContent = `LVL ${prog.level}`;
      if (mobileSidebarXp) mobileSidebarXp.textContent = `${totalXp} XP`;
      if (mobileSidebarXpFill) mobileSidebarXpFill.style.width = `${prog.pct}%`;
      if (mobileSidebarTeam && s.team) {
        const tid = String(s.team.team_id || '').toLowerCase();
        const livery = TEAM_LIVERY[tid] || 'var(--accent-bronze)';
        mobileSidebarTeam.textContent = (s.team.name || s.team.team_id || '').toUpperCase();
        mobileSidebarTeam.style.borderColor = livery;
        mobileSidebarTeam.style.color = livery;
      }
      if (mobileSidebarAdmin) {
        if (s.isAdmin) mobileSidebarAdmin.classList.remove('hidden');
        else mobileSidebarAdmin.classList.add('hidden');
      }

      // Smooth count-up unless reduced-motion is requested
      if (xpVal) {
        const targetXp = totalXp;
        const startXp = Number(xpVal.getAttribute('data-val') || xpVal.textContent || '0');
        xpVal.setAttribute('data-val', String(targetXp));

        if (s.reduceMotion || Math.abs(targetXp - startXp) <= 1) {
          xpVal.textContent = String(targetXp);
        } else {
          const duration = 600;
          const startTime = performance.now();
          const step = (now) => {
            const progress = Math.min(1, (now - startTime) / duration);
            const current = Math.round(startXp + (targetXp - startXp) * progress);
            xpVal.textContent = String(current);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      }

      if (lvlBadge) {
        lvlBadge.innerHTML = `<span class="lvl-num">LVL ${prog.level}</span><span class="lvl-title"> · ${title.toUpperCase()}</span>`;
        lvlBadge.title = nextReq
          ? `Level ${prog.level + 1} Requisition: ${nextReq.name} (${prog.into}/${prog.needed} XP)`
          : `${prog.into} / ${prog.needed} XP toward level ${prog.level + 1}`;
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
      mobileSidebarProfile?.classList.add('hidden');
      mobileSidebarLogout?.classList.add('hidden');
      mobileSidebarLogin?.classList.remove('hidden');
      mobileSidebarAdmin?.classList.add('hidden');
    }
  });

  session.notify();

  window.addEventListener('hashchange', () => {
    closeMobileSidebar();
    progressionFeed.setSafe(true);
    progressionFeed.flush();
  });
}

window.addEventListener('DOMContentLoaded', bootstrapApp);
