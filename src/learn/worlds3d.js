/**
 * worlds3d.js — Which Learn worlds you can walk on, and how to get there.
 *
 * The Learn road charts fourteen worlds. Ten of them — Tallow, Lanternfall, Ligar, Bellows, Ember Reach, Mirrowen, Kettle, Teeter, Verdigris and Brinewire — are built
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
import lanternfallData from '../three/world-data/lanternfall.json' with { type: 'json' };
import bellowsData from '../three/world-data/bellows.json' with { type: 'json' };
import emberData from '../three/world-data/ember.json' with { type: 'json' };
import mirrowenData from '../three/world-data/mirrowen.json' with { type: 'json' };
import kettleData from '../three/world-data/kettle.json' with { type: 'json' };
import teeterData from '../three/world-data/teeter.json' with { type: 'json' };
import verdigrisData from '../three/world-data/verdigris.json' with { type: 'json' };
import brinewireData from '../three/world-data/brinewire.json' with { type: 'json' };
import quicklightData from '../three/world-data/quicklight.json' with { type: 'json' };

/**
 * A walkable Learn world.
 *   key                   — the voyage's name for it (`DESTINATIONS`, `stage.worldFor`)
 *   enter(stage, siteId)  — put the player on the ground, optionally at a site
 *   siteForQuest(questId) — the site a quest is played at, or null
 */
const WORLDS_3D = {
  unit01: {
    id: 'unit01',
    worldName: 'Tallow',
    data: tallowData,
    enter(stage, siteId = null, playerPos = null, lookAtPos = null) {
      stage.enterTallowScene(siteId, playerPos, lookAtPos);
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
    worldName: 'Lanternfall',
    data: lanternfallData,
    enter(stage, siteId = null, playerPos = null, lookAtPos = null) {
      stage.enterLanternfallScene(siteId, playerPos, lookAtPos);
    },
    siteForQuest(questId) {
      return lanternfallData.sites.find(s => s.questId === questId) || null;
    },
    /** Light the site indicator for every quest the player has finished. */
    syncProgress(stage, isComplete) {
      for (const site of lanternfallData.sites) {
        if (!site.built) continue;
        stage.setLanternfallSiteComplete(site.questId, Boolean(isComplete(site.questId)));
      }
    }
  },
  unit04: {
    id: 'unit04',
    worldName: 'Bellows',
    data: bellowsData,
    enter(stage, siteId = null, playerPos = null, lookAtPos = null) {
      stage.enterBellowsScene(siteId, playerPos, lookAtPos);
    },
    siteForQuest(questId) {
      return bellowsData.sites.find(s => s.questId === questId) || null;
    },
    /** Light the site indicator for every quest the player has finished. */
    syncProgress(stage, isComplete) {
      for (const site of bellowsData.sites) {
        if (!site.built) continue;
        stage.setBellowsSiteComplete(site.questId, Boolean(isComplete(site.questId)));
      }
    }
  },
  unit05: {
    id: 'unit05',
    key: 'ember',
    worldName: 'Ember Reach',
    data: emberData,
    enter(stage, siteId = null, playerPos = null, lookAtPos = null) {
      stage.enterEmberScene(siteId, playerPos, lookAtPos);
    },
    siteForQuest(questId) {
      return emberData.sites.find(s => s.questId === questId) || null;
    },
    /** Light the site indicator for every quest the player has finished. */
    syncProgress(stage, isComplete) {
      for (const site of emberData.sites) {
        if (!site.built) continue;
        stage.setEmberSiteComplete(site.questId, Boolean(isComplete(site.questId)));
      }
    }
  },
  unit06: {
    id: 'unit06',
    key: 'mirrowen',
    worldName: 'Mirrowen',
    data: mirrowenData,
    enter(stage, siteId = null, playerPos = null, lookAtPos = null) {
      stage.enterMirrowenScene(siteId, playerPos, lookAtPos);
    },
    siteForQuest(questId) {
      return mirrowenData.sites.find(s => s.questId === questId) || null;
    },
    /** Light the site indicator for every quest the player has finished. */
    syncProgress(stage, isComplete) {
      for (const site of mirrowenData.sites) {
        if (!site.built) continue;
        stage.setMirrowenSiteComplete(site.questId, Boolean(isComplete(site.questId)));
      }
    }
  },
  unit07: {
    id: 'unit07',
    key: 'kettle',
    worldName: 'Kettle',
    data: kettleData,
    enter(stage, siteId = null, playerPos = null, lookAtPos = null) {
      stage.enterKettleScene(siteId, playerPos, lookAtPos);
    },
    /** The site for a quest, or null. Every bench of the plan has a host already, live or not; the boss and unknown ids have none. */
    siteForQuest(questId) {
      return kettleData.sites.find(s => s.questId === questId) || null;
    },
    /** Light the site indicator for every quest the player has finished. */
    syncProgress(stage, isComplete) {
      for (const site of kettleData.sites) {
        if (!site.built) continue;
        stage.setKettleSiteComplete(site.questId, Boolean(isComplete(site.questId)));
      }
    }
  },
  unit08: {
    id: 'unit08',
    key: 'teeter',
    worldName: 'Teeter',
    data: teeterData,
    enter(stage, siteId = null, playerPos = null, lookAtPos = null) {
      stage.enterTeeterScene(siteId, playerPos, lookAtPos);
    },
    /** The site for a quest, or null. Every bench of the plan has a host already, live or not; the boss and unknown ids have none. */
    siteForQuest(questId) {
      return teeterData.sites.find(s => s.questId === questId) || null;
    },
    /** Light the site indicator for every quest the player has finished. */
    syncProgress(stage, isComplete) {
      for (const site of teeterData.sites) {
        if (!site.built) continue;
        stage.setTeeterSiteComplete(site.questId, Boolean(isComplete(site.questId)));
      }
    }
  },
  unit09: {
    id: 'unit09',
    key: 'verdigris',
    worldName: 'Verdigris',
    data: verdigrisData,
    enter(stage, siteId = null, playerPos = null, lookAtPos = null) {
      stage.enterVerdigrisScene(siteId, playerPos, lookAtPos);
    },
    /** The site for a quest, or null. Every bench of the plan has a host already, live or not; the boss and unknown ids have none. */
    siteForQuest(questId) {
      return verdigrisData.sites.find(s => s.questId === questId) || null;
    },
    /** Light the site indicator for every quest the player has finished. */
    syncProgress(stage, isComplete) {
      for (const site of verdigrisData.sites) {
        if (!site.built) continue;
        stage.setVerdigrisSiteComplete(site.questId, Boolean(isComplete(site.questId)));
      }
    }
  },
  unit10: {
    id: 'unit10',
    key: 'brinewire',
    worldName: 'Brinewire',
    data: brinewireData,
    enter(stage, siteId = null, playerPos = null, lookAtPos = null) {
      stage.enterBrinewireScene(siteId, playerPos, lookAtPos);
    },
    /** The site for a quest, or null. Every bench of the plan has a host already, live or not; the boss and unknown ids have none. */
    siteForQuest(questId) {
      return brinewireData.sites.find(s => s.questId === questId) || null;
    },
    /** Light the site indicator for every quest the player has finished. */
    syncProgress(stage, isComplete) {
      for (const site of brinewireData.sites) {
        if (!site.built) continue;
        stage.setBrinewireSiteComplete(site.questId, Boolean(isComplete(site.questId)));
      }
    }
  },
  unit11: {
    id: 'unit11',
    key: 'quicklight',
    worldName: 'Quicklight',
    data: quicklightData,
    enter(stage, siteId = null, playerPos = null, lookAtPos = null) {
      stage.enterQuicklightScene(siteId, playerPos, lookAtPos);
    },
    siteForQuest(questId) {
      return quicklightData.sites.find(s => s.questId === questId) || null;
    },
    syncProgress(stage, isComplete) {
      for (const site of quicklightData.sites) {
        if (!site.built) continue;
        stage.setQuicklightSiteComplete(site.questId, Boolean(isComplete(site.questId)));
      }
    }
  },
  unit03: {
    id: 'unit03',
    worldName: 'Ligar',
    data: ligarData,
    enter(stage, siteId = null, playerPos = null, lookAtPos = null) {
      stage.enterLigarScene(siteId, playerPos, lookAtPos);
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
