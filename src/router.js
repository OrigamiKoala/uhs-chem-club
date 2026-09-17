/**
 * router.js — Hash-based client router for Avalon
 */

import { session } from './session.js';
import { stage } from './three/stage.js';
import { closeModal } from './ui/modal.js';
import { soundscape } from './audio/soundscape.js';

import { renderLanding } from './screens/landing.js';
import { renderRegister } from './screens/register.js';
import { renderLogin } from './screens/login.js';
import { renderOnboarding } from './screens/onboarding.js';
import { renderBridge } from './screens/bridge.js';
import { renderStarMap } from './screens/starmap.js';
import { renderQuest } from './screens/quest.js';
import { renderDemo } from './screens/demo.js';
import { renderLeaderboard } from './screens/leaderboard.js';
import { renderInventory } from './screens/inventory.js';
import { renderQuarters } from './screens/quarters.js';
import { renderSettings } from './screens/settings.js';
import { renderAdmin } from './screens/admin.js';

const ROUTE_ROOM = {
  '/': 'cockpit',
  '/login': 'cockpit',
  '/register': 'cockpit',
  '/onboarding': 'cockpit',
  '/bridge': 'bridge',
  '/starmap': 'starmap',
  '/quest': 'quest',
  '/demo': 'quest',
  '/inventory': 'cargo',
  '/cargo': 'cargo',
  '/quarters': 'quarters',
  '/settings': 'quarters',
  '/leaderboard': 'comms',
  '/comms': 'comms',
  '/admin': 'bridge'
};

const ROUTE_BACKDROPS = {
  '/': '/art/cockpit.jpg',
  '/login': '/art/cockpit.jpg',
  '/register': '/art/cockpit.jpg',
  '/onboarding': '/art/cockpit.jpg',
  '/bridge': '/art/cockpit.jpg',
  '/starmap': '/art/starmap.jpg',
  '/quest': '/art/crucible.jpg',
  '/demo': '/art/crucible.jpg',
  '/cargo': '/art/cargo.jpg',
  '/inventory': '/art/cargo.jpg',
  '/quarters': '/art/quarters.jpg',
  '/settings': '/art/quarters.jpg',
  '/leaderboard': '/art/comms.jpg',
  '/comms': '/art/comms.jpg',
  '/admin': '/art/airlock.jpg'
};

/** Which HUD nav button should light up for a given route. */
const ROUTE_NAV = {
  '/bridge': 'bridge',
  '/starmap': 'starmap',
  '/quest': 'starmap',
  '/leaderboard': 'leaderboard',
  '/comms': 'leaderboard',
  '/inventory': 'inventory',
  '/cargo': 'inventory',
  '/quarters': 'quarters',
  '/settings': 'quarters'
};

const ROUTES = {
  '/': { render: renderLanding, auth: false },
  '/register': { render: renderRegister, auth: false },
  '/login': { render: renderLogin, auth: false },
  '/demo': { render: renderDemo, auth: false },
  '/onboarding': { render: renderOnboarding, auth: true },
  '/bridge': { render: renderBridge, auth: true },
  '/starmap': { render: renderStarMap, auth: false },
  '/quest': { render: renderQuest, auth: true },
  '/leaderboard': { render: renderLeaderboard, auth: false },
  '/comms': { render: renderLeaderboard, auth: false },
  '/cargo': { render: renderInventory, auth: true },
  '/inventory': { render: renderInventory, auth: true },
  '/quarters': { render: renderQuarters, auth: true },
  '/settings': { render: renderSettings, auth: true },
  '/admin': { render: renderAdmin, auth: true, admin: true }
};

export class Router {
  constructor(appContainer) {
    this.appContainer = appContainer;
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    this.handleRoute();
  }

  handleRoute() {
    let raw = window.location.hash.slice(1);
    if (!raw || raw === '') raw = '/';

    if (!ROUTES[raw]) {
      // Unknown hash — normalize the URL instead of silently rendering the landing page
      window.location.hash = '#/';
      return;
    }
    const routeDef = ROUTES[raw];

    // Auth gating
    if (routeDef.auth && !session.token) {
      window.location.hash = '#/login';
      return;
    }

    // Already signed in: redirect guest auth routes (/login, /register) to bridge/onboarding
    if (session.token && session.player && (raw === '/login' || raw === '/register')) {
      const dest = session.teamId ? '#/bridge' : '#/onboarding';
      window.location.hash = dest;
      return;
    }

    // Already signed in: redirect landing page (/) to bridge/onboarding
    if (session.token && session.player && raw === '/') {
      const dest = session.teamId ? '#/bridge' : '#/onboarding';
      window.location.hash = dest;
      return;
    }

    // Redirect to onboarding if logged in but no team chosen
    if (session.token && session.player && !session.teamId && raw !== '/onboarding' && raw !== '/login' && raw !== '/admin') {
      window.location.hash = '#/onboarding';
      return;
    }

    // Admin gating
    if (routeDef.admin && !session.isAdmin) {
      window.location.hash = '#/bridge';
      return;
    }

    // A dialog must never survive a navigation
    closeModal();

    // If leaving quest scene, exit quest mode
    if (raw !== '/quest' && raw !== '/demo' && stage.mode === 'quest') {
      stage.exitQuestScene();
    }

    // Crossfade soundscape room ambient bed
    soundscape.setRoom(ROUTE_ROOM[raw] || 'bridge');

    // Update fallback backdrop for T1
    const backdropEl = document.getElementById('fallback-backdrop');
    if (backdropEl) {
      const bg = ROUTE_BACKDROPS[raw] || '/art/cockpit.jpg';
      backdropEl.style.backgroundImage = `url("${bg}")`;
    }

    // Render screen
    this.appContainer.innerHTML = '';
    routeDef.render(this.appContainer);

    // Update active nav button
    const activeNav = ROUTE_NAV[raw] || null;
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const target = btn.getAttribute('data-target');
      const isActive = Boolean(target) && target === activeNav;
      btn.classList.toggle('active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });

    window.scrollTo(0, 0);
  }
}
