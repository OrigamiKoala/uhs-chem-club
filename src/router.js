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
import { renderLearn } from './screens/learn.js';
import { renderLearnWorld } from './screens/learn-world.js';
import { renderLearnQuest, disposeLearnQuest } from './screens/learn-quest.js';
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
  '/learn': 'starmap',
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
  '/learn': '/art/starmap.jpg',
  '/cargo': '/art/cargo.jpg',
  '/inventory': '/art/cargo.jpg',
  '/quarters': '/art/quarters.jpg',
  '/settings': '/art/quarters.jpg',
  '/leaderboard': '/art/comms.jpg',
  '/comms': '/art/comms.jpg',
  '/admin': '/art/airlock.jpg'
};

const ROUTE_NAV = {
  '/bridge': 'bridge',
  '/starmap': 'starmap',
  '/quest': 'starmap',
  '/learn': 'learn',
  '/leaderboard': 'leaderboard',
  '/comms': 'leaderboard',
  '/inventory': 'inventory',
  '/cargo': 'inventory',
  '/quarters': 'quarters',
  '/settings': 'quarters'
};

const ROUTES = {
  '/': { render: renderLanding, auth: false },
  '/landing': { render: renderLanding, auth: false },
  '/cold-open': { render: renderOnboarding, auth: true },
  '/register': { render: renderRegister, auth: false },
  '/login': { render: renderLogin, auth: false },
  '/demo': { render: renderDemo, auth: false },
  '/onboarding': { render: renderOnboarding, auth: true },
  '/bridge': { render: renderBridge, auth: true },
  '/starmap': { render: renderStarMap, auth: false },
  '/quest': { render: renderQuest, auth: true },
  '/learn': { render: renderLearn, auth: true },
  '/leaderboard': { render: renderLeaderboard, auth: false },
  '/comms': { render: renderLeaderboard, auth: false },
  '/cargo': { render: renderInventory, auth: true },
  '/inventory': { render: renderInventory, auth: true },
  '/quarters': { render: renderQuarters, auth: true },
  '/settings': { render: renderSettings, auth: true },
  '/admin': { render: renderAdmin, auth: true, admin: true }
};

/**
 * Routes with a path parameter. Matched only after an exact hit fails, in order,
 * so a literal route can always shadow a pattern. Every segment that starts with
 * ":" is captured into `params` and handed to the render function.
 */
const PARAM_ROUTES = [
  { pattern: ['learn', ':worldId'], render: renderLearnWorld, auth: true, nav: 'learn', room: 'starmap', backdrop: '/art/crucible.jpg' },
  { pattern: ['learn', ':worldId', ':questId'], render: renderLearnQuest, auth: true, nav: 'learn', room: 'quest', backdrop: '/art/crucible.jpg' }
];

function matchParamRoute(raw) {
  const parts = raw.replace(/^\/+/, '').split('/').filter(Boolean);
  for (const def of PARAM_ROUTES) {
    if (def.pattern.length !== parts.length) continue;
    const params = {};
    let hit = true;
    for (let i = 0; i < def.pattern.length; i++) {
      const seg = def.pattern[i];
      if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(parts[i]);
      else if (seg !== parts[i]) { hit = false; break; }
    }
    if (hit) return { def, params };
  }
  return null;
}

/** True for any route that mounts a Learn quest game module. */
function isLearnQuestRoute(raw) {
  const m = matchParamRoute(raw);
  return Boolean(m && m.def.render === renderLearnQuest);
}

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

    let params = {};
    let routeDef = ROUTES[raw];

    if (!routeDef) {
      const matched = matchParamRoute(raw);
      if (matched) {
        routeDef = matched.def;
        params = matched.params;
      }
    }

    if (!routeDef) {
      // Unknown hash — normalize the URL instead of silently rendering the landing page
      window.location.hash = '#/';
      return;
    }

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

    // A mounted Learn quest owns 3D resources and listeners of its own, so it is
    // torn down on every navigation that is not back into the same quest.
    if (!isLearnQuestRoute(raw)) disposeLearnQuest();

    // If leaving quest scene or navigating to ship compartments
    if (raw !== '/quest' && raw !== '/demo' && !isLearnQuestRoute(raw)) {
      if (stage.mode === 'quest' || stage.mode === 'world') {
        stage.enterShipScene(ROUTE_ROOM[raw] || 'bridge');
      } else if (stage.mode === 'ship' && stage.cameraRig) {
        stage.cameraRig.moveTo(ROUTE_ROOM[raw] || 'bridge');
      }
    }


    // Crossfade soundscape room ambient bed
    soundscape.setRoom(ROUTE_ROOM[raw] || routeDef.room || 'bridge');

    // Update fallback backdrop for T1
    const backdropEl = document.getElementById('fallback-backdrop');
    if (backdropEl) {
      const bg = ROUTE_BACKDROPS[raw] || routeDef.backdrop || '/art/cockpit.jpg';
      backdropEl.style.backgroundImage = `url("${bg}")`;
    }

    // Render screen
    this.appContainer.innerHTML = '';
    routeDef.render(this.appContainer, params);

    // Ensure all muted banner & inline videos play reliably after innerHTML mount
    this.appContainer.querySelectorAll('video').forEach(v => {
      v.muted = true;
      v.play().catch(() => {});
    });

    // Update active nav button
    const activeNav = ROUTE_NAV[raw] || routeDef.nav || null;
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
