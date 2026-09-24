/**
 * worlds3d.js — Which Learn worlds you can walk on, and how to get there.
 *
 * The Learn road charts ten worlds. Two of them — Tallow and Ligar — are built
 * as places you stand in, at T4. This file is the registry that says so, and it
 * is the only thing that needs editing when another world is built.
 *
 * It holds no content: which quests exist and what order they come in is
 * `curriculum.js`, and where things stand on the ground is the world's own JSON.
 * Nothing here pays XP, records progress or touches the campaign rails.
 */

import { tierAtLeast } from '../three/tier.js';
import tallowData from '../three/world-data/tallow.json' with { type: 'json' };
import ligarData from '../three/world-data/ligar.json' with { type: 'json' };

/**
 * A walkable Learn world.
 *   enter(stage, siteId)  — put the player on the ground, optionally at a site
 *   siteForQuest(questId) — the site a quest is played at, or null
 */
const WORLDS_3D = {
  unit01: {
    id: 'unit01',
    worldName: 'Tallow',
    data: tallowData,
    enter(stage, siteId = null) {
      stage.enterTallowScene(siteId);
    },
    siteForQuest(questId) {
      return tallowData.sites.find(s => s.questId === questId) || null;
    },
    /** Light the site indicator for every quest the player has finished. */
    syncProgress(stage, isComplete) {
      for (const site of tallowData.sites) {
        if (!site.built) continue;
        stage.setTallowSiteComplete(site.questId, Boolean(isComplete(site.questId)));
      }
    }
  },
  unit02: {
    id: 'unit02',
    worldName: 'Ligar',
    data: ligarData,
    enter(stage, siteId = null) {
      stage.enterLigarScene(siteId);
    },
    siteForQuest(questId) {
      return ligarData.sites.find(s => s.questId === questId) || null;
    },
    /** Light the site indicator for every quest the player has finished. */
    syncProgress(stage, isComplete) {
      for (const site of ligarData.sites) {
        if (!site.built) continue;
        stage.setLigarSiteComplete(site.questId, Boolean(isComplete(site.questId)));
      }
    }
  }
};

/** The 3D world for a Learn world id, or null when it is charted only. */
export function world3dFor(worldId) {
  return WORLDS_3D[worldId] || null;
}

/**
 * True when this client should walk this world rather than read its quest list.
 * T4 only: at T3 and below the Learn road is the screens it has always been,
 * and every quest in it is played and completed exactly as before.
 */
export function canWalk(worldId) {
  return tierAtLeast('T4') && Boolean(WORLDS_3D[worldId]);
}

/** Every walkable world id, for the star map's Learn tab. */
export function walkableWorldIds() {
  return Object.keys(WORLDS_3D);
}
