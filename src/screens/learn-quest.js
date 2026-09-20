/**
 * learn-quest.js — Host for one Learn quest.
 *
 * The host does four things and nothing else: check the gating, load the quest's
 * game module, give it a container and a context, and record what it reports.
 * Everything a player sees inside the frame belongs to the quest module — each
 * Learn quest is a game, built the way the Charge Gardens was built.
 *
 * The host is also the wall between the Learn track and the campaign's XP rails.
 * It records stages and completions through `learn/progress.js` and the learn
 * endpoints, which pay nothing and never reach Standings.
 */

import { api } from '../api.js';
import { stage } from '../three/stage.js';
import { esc } from '../ui/layout.js';
import { getWorld, getQuest, loadQuestModule, ARENAS } from '../learn/curriculum.js';
import {
  isWorldOpen, isQuestOpen, isQuestComplete, questProgress,
  markStage, markQuestComplete
} from '../learn/progress.js';
import { canWalk, world3dFor } from '../learn/worlds3d.js';
import { setBenchSite } from '../learn/engine/bench-host.js';
import { benchIsBuilt } from '../learn/engine/instruments.js';

/** The mounted game, so a navigation can tear it down. */
let active = null;

/** Called by the router whenever it leaves a learn quest route. */
export function disposeLearnQuest() {
  if (!active) return;
  try {
    active.mounted?.dispose?.();
  } catch (err) {
    console.error('Learn quest dispose failed:', err);
  }
  if (stage.mode === 'quest') stage.exitQuestScene();
  document.body.classList.remove('bench-deployed');
  // Whatever stood the walk down, give it back. The router calls this on every
  // navigation away from a quest route, including back out onto the flat.
  stage.setWalkSuspended?.(false);
  setBenchSite(null);
  active = null;
}

function shell({ world, quest, body, inWorld, overWorld }) {
  const mod = inWorld ? ' learn-quest-inworld' : (overWorld ? ' learn-quest-overworld' : '');
  return `
    <div class="screen-container m-screen m-learn-quest${mod}">
      <div class="learn-host-bar plate">
        <a href="#/learn/${esc(world.id)}" class="btn-secondary learn-host-back m-tap" style="text-decoration: none;">${esc(world.world)}</a>
        <div class="learn-host-id">
          <span class="eyebrow">${esc(world.unit)}</span>
          <span class="learn-host-title">${esc(quest.title)}</span>
        </div>
      </div>
      <div id="learn-quest-mount" class="learn-quest-mount">${body || ''}</div>
    </div>
  `;
}

/** Shown for a quest that is charted but has no game module yet. */
function buildPlate(world, quest) {
  return `
    <section class="glass-panel learn-build-plate">
      <h2 class="section-title">${esc(quest.title)}</h2>
      <p class="page-sub">${esc(quest.line)}</p>
      <div class="learn-build-note">
        <span>Coming soon.</span>
      </div>
      <a href="#/learn/${esc(world.id)}" class="btn-secondary" style="text-decoration: none;">Back to ${esc(world.world)}</a>
    </section>
  `;
}

export function renderLearnQuest(container, params = {}) {
  disposeLearnQuest();

  const world = getWorld(params.worldId);
  if (!world) {
    window.location.hash = '#/learn';
    return;
  }

  const quest = getQuest(world.id, params.questId);
  if (!quest || !isWorldOpen(world)) {
    window.location.hash = `#/learn/${world.id}`;
    return;
  }

  // A quest that is sealed behind the one before it is never mounted. The world
  // screen is the only place that decides what a player may open.
  if (!isQuestOpen(world, quest) && !isQuestComplete(quest)) {
    window.location.hash = `#/learn/${world.id}`;
    return;
  }

  // On a world that is built as a place, the player is put in front of the site
  // either way. What differs is the instrument: a bench that is BUILT keeps the
  // world behind the frame and bolts its screens to the bench, while a bench
  // that is DRAWN — the sampler scope, which is a microscope — is worked as a
  // page, because there is nothing in the world to stand the picture against.
  const walkable = canWalk(world.id);
  // Configure learn quest frame to use 2D overlay (`learn-quest-overworld`) in T4 rather than deploying into CSS3D in-world bench panels
  const inWorld = false;
  if (walkable) {
    const w3d = world3dFor(world.id);
    const site = w3d.siteForQuest(quest.id);
    if (site) {
      w3d.enter(stage, site.id);
      setBenchSite(quest.id);
      // Remembered so that stepping back out of the bench returns the player to
      // the site rather than to the pad they landed on.
      try { sessionStorage.setItem('avalon_learn_last_site', site.id); } catch (e) {}
    } else {
      w3d.enter(stage, null);
      setBenchSite(null);
    }
    w3d.syncProgress(stage, qid => {
      const q = world.quests.find(x => x.id === qid);
      return q ? isQuestComplete(q) : false;
    });
    stage.setWalkSuspended?.(true);

    /* THE BRIEFING MUST NOT BLACK OUT THE BENCH.
       A modal on this product paints a near-opaque scrim over the whole glass,
       which is right for a dialog over a page and wrong over an instrument the
       player is being told to look at: the transmission that says "read the
       needle on all four" was itself hiding all four. With a bench standing in
       the world, the transmission docks down one side and lets the light
       through, and `fitDeployedAim` slides the bench out from behind it. */
    if (benchIsBuilt(quest.id)) document.body.classList.add('bench-deployed');
    else document.body.classList.remove('bench-deployed');
  }

  container.innerHTML = shell({ world, quest, body: '', inWorld: false, overWorld: walkable });
  const mountPoint = container.querySelector('#learn-quest-mount');

  if (quest.status !== 'live') {
    mountPoint.innerHTML = buildPlate(world, quest);
    return;
  }

  const prog = questProgress(quest);

  const ctx = {
    world,
    quest,
    stagesCleared: prog.cleared,
    isComplete: prog.complete,

    /** One stage cleared. Local first; the server call is telemetry. */
    reportStage(stageIndex) {
      if (typeof stageIndex !== 'number') return;
      markStage(world.id, quest.id, stageIndex);
      api.learnStage(world.id, quest.id, stageIndex).catch(() => {});
    },

    /** The quest is finished. Idempotent — a replay records nothing new. */
    reportComplete() {
      markQuestComplete(world.id, quest.id);
      api.learnComplete(world.id, quest.id).catch(() => {});
    },

    exit() {
      window.location.hash = `#/learn/${world.id}`;
    }
  };

  const token = {};
  active = { world: world.id, quest: quest.id, token, mounted: null };

  loadQuestModule(quest).then(mod => {
    // The player may have navigated away while the module was in flight.
    if (!active || active.token !== token) return;
    if (!mod) {
      mountPoint.innerHTML = buildPlate(world, quest);
      return;
    }
    mountPoint.innerHTML = '';
    try {
      active.mounted = mod.mount(mountPoint, ctx) || null;
    } catch (err) {
      console.error(`Learn quest "${quest.key}" failed to mount:`, err);
      mountPoint.innerHTML = `
        <section class="glass-panel learn-build-plate">
          <div class="stage-error-banner">
            <span class="banner-mark" aria-hidden="true">!!</span>
            <span class="banner-body">This site would not come online. Try again, or take another quest.</span>
          </div>
          <a href="#/learn/${esc(world.id)}" class="btn-secondary" style="text-decoration: none;">Back to ${esc(world.world)}</a>
        </section>
      `;
    }
  });
}
