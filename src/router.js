/**
 * router.js — Hash-based client router for Avalon
 */

import { session } from './session.js';
import { stage } from './three/stage.js';

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
  '/settings': { render: renderSettings, auth: false },
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

    const routeDef = ROUTES[raw] || ROUTES['/'];

    // Auth gating
    if (routeDef.auth && !session.token) {
      window.location.hash = '#/login';
      return;
    }

    // Redirect to onboarding if logged in but no team chosen
    if (session.token && session.player && !session.player.team_id && raw !== '/onboarding' && raw !== '/login') {
      window.location.hash = '#/onboarding';
      return;
    }

    // If leaving quest scene, exit quest mode
    if (raw !== '/quest' && raw !== '/demo' && stage.mode === 'quest') {
      stage.exitQuestScene();
    }

    // Render screen
    this.appContainer.innerHTML = '';
    routeDef.render(this.appContainer);

    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const target = btn.getAttribute('data-target');
      if (raw.includes(target)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    window.scrollTo(0, 0);
  }
}
