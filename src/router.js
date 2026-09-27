/**
 * router.js — Hash-based client router for Avalon
 */

import { session } from './session.js';
import { stage } from './three/stage.js';
import { closeModal } from './ui/modal.js';
import { canWalk, world3dFor } from './learn/worlds3d.js';
import { getWorld, getQuest } from './learn/curriculum.js';
import { isQuestOpen, isQuestComplete } from './learn/progress.js';
import { soundscape } from './audio/soundscape.js';
import { gameMode } from './game-mode.js';

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
import { renderCrewProfile } from './screens/crew-profile.js';
import { renderVoyageHud } from './screens/voyage.js';

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
  { pattern: ['crew', ':playerId'], render: renderCrewProfile, auth: false, nav: 'leaderboard', room: 'comms', backdrop: '/art/comms.jpg' },
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

/**
 * True for a route that is standing on a Learn world's ground.
 *
 * Walking from the yard into a bench and back out again must not pass through
 * the ship: both routes live on the same planet, so the world scene is kept and
 * only the camera moves.
 */
function isWalkableLearnRoute(raw) {
  const m = matchParamRoute(raw);
  if (!m) return false;
  return canWalk(m.params.worldId);
}

/**
 * Where a route would put the player, as a voyage target, or null for a route
 * that stays aboard. Erebus for the campaign quest; a Learn world that is
 * built as a place for its world route and every quest route in it. A quest
 * route lands the ship on that world and leads the player to the quest's
 * bench — the bench is a place on the ground, and they walk to it.
 */
function voyageTargetFor(raw) {
  if (raw === '/quest') return { key: 'erebus', hash: '#/quest' };
  const m = matchParamRoute(raw);
  if (!m || m.def.pattern[0] !== 'learn' || !m.params.worldId) return null;
  if (!canWalk(m.params.worldId)) return null;
  const w3d = world3dFor(m.params.worldId);
  if (!w3d) return null;
  const key = String(w3d.worldName).toLowerCase();
  const hash = `#/learn/${m.params.worldId}`;
  if (m.params.questId) {
    // Lead to the bench only if the quest there is one the player may open;
    // the world screen, not a chevron, is where a sealed quest says so.
    const world = getWorld(m.params.worldId);
    const quest = getQuest(m.params.worldId, m.params.questId);
    const open = world && quest && (isQuestOpen(world, quest) || isQuestComplete(quest));
    if (!open) return { key, hash };
    const site = w3d.siteForQuest(m.params.questId);
    const at = site && (site.approachPos || site.pos);
    return {
      key, hash,
      waypoint: at ? { x: at[0], z: at[2], label: site.label } : null
    };
  }
  return { key, hash };
}

export class Router {
  constructor(appContainer) {
    this.appContainer = appContainer;
    this.booted = false;
    window.addEventListener('hashchange', () => this.handleRoute());
    // The ship is down and the player has walked off it: draw the route they
    // flew for, now that they are standing on its ground.
    window.addEventListener('voyage:arrived', (e) => {
      const hash = e.detail?.hash;
      if (!hash || window.location.hash === hash) this.handleRoute();
      else window.location.hash = hash;
    });
  }

  init() {
    this.handleRoute();
    this.booted = true;
  }

  /**
   * AT T4, GOING TO A WORLD IS A FLIGHT. A player aboard the Avalon who asks
   * for a world (the star map, a Learn road key, the bridge's quest key) is
   * not put on the ground: the ship flies there and lands, and the route is
   * drawn once they have walked off it (`voyage:arrived`). Never on the first
   * route of a page load — a reload onto a world is standing on it.
   */
  tryVoyage(raw) {
    if (!this.booted) return false;
    const target = voyageTargetFor(raw);
    if (!target) return false;
    // Standing on a world the ship is parked on, bound for another: go
    // aboard first, and it lifts off from here.
    const v = stage.voyage;
    if (stage.mode === 'world' && v?.parked && v.parked.world === stage.activeWorld && v.parked.key !== target.key) {
      stage.enterShipScene('bridge');
    }
    if (!stage.canVoyage(target.key)) return false;
    const res = stage.requestVoyage(target);
    if (!res) return false;
    if (`#${raw}` !== target.hash) {
      try { history.replaceState(null, '', target.hash); } catch (e) {}
    }
    soundscape.setRoom('bridge');
    this.appContainer.innerHTML = '';
    renderVoyageHud(this.appContainer);
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    return true;
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

    // A signed-in player on a phone should be playing full screen. The gesture
    // that got them here may already have been spent (a sign-in awaits the
    // network; a returning player with a stored token made no gesture at all),
    // so this arms their next tap instead. Once per page load, and never after
    // they have taken the screen back with the FULL key.
    if (routeDef.auth && session.token) gameMode.armOnNextGesture();

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

    if (this.tryVoyage(raw)) return;

    // If leaving quest scene or navigating to ship compartments
    if (raw !== '/quest' && raw !== '/demo' && !isLearnQuestRoute(raw) && !isWalkableLearnRoute(raw)) {
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
