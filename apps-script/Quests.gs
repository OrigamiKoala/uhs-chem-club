/**
 * Quests.gs — Quest manifests, stages, grading, hints, and completion for Avalon
 */

var DEFAULT_QUEST = {
  quest_id: 'q1',
  title: 'The Charge Gardens of Erebus',
  world: 'Erebus',
  blurb: 'Survey paired molecular structures across the Erebus anomaly.',
  scene_id: 'reaction_chamber',
  cover_image: '/art/q1_cover.webp',
  release_at: '2026-09-18T00:00:00Z',
  close_at: '2026-10-02T23:59:59Z',
  status: 'live',
  base_xp: 165,
  stage_count: 7,
  item_pool: 'hint_chip,spare_coolant,overclock_module,resonance_key'
};

var DEFAULT_STAGES = [
  {
    quest_id: 'q1',
    stage_index: 0,
    kind: 'arrow',
    xp: 15,
    max_attempts: 3,
    hint_text: 'Draw an arrow from the red donor to the blue acceptor.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_lp1', to: 'blue_c1' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 1',
      prompt: 'Drag an arrow from the electron-rich lone pair (red) to the electron-deficient carbon center (blue).',
      moleculeId: 'stage1_pair',
      anchors: ['red_lp1', 'blue_c1']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 1,
    kind: 'arrow',
    xp: 15,
    max_attempts: 3,
    hint_text: 'Draw an arrow from the red donor to the blue acceptor.',
    hint_cost: 1,
    answer_json: JSON.stringify({ from: 'red_lp1', to: 'blue_c1' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 2',
      prompt: 'Connect the electron donor (red) to the polarized target site (blue).',
      moleculeId: 'stage2_pair',
      anchors: ['red_lp1', 'blue_c1']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 2,
    kind: 'arrow',
    xp: 20,
    max_attempts: 3,
    hint_text: 'Connect the extreme red donor to the extreme blue acceptor.',
    hint_cost: 2,
    answer_json: JSON.stringify({ from: 'red_extreme', to: 'blue_extreme' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 3',
      prompt: 'Multiple reactive sites: route the arrow between the strongest donor (extreme red) and the strongest electrophile (extreme blue).',
      moleculeId: 'stage3_pair',
      anchors: ['red_weak', 'red_extreme', 'blue_extreme', 'blue_weak']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 3,
    kind: 'arrow',
    xp: 20,
    max_attempts: 3,
    hint_text: 'Select the primary reactive site and connect to the electrophilic center.',
    hint_cost: 2,
    answer_json: JSON.stringify({ from: 'red_extreme', to: 'blue_extreme' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 4',
      prompt: 'Select the primary reactive site (extreme red) and connect to the electrophilic center (extreme blue).',
      moleculeId: 'stage4_pair',
      anchors: ['red_weak', 'red_extreme', 'blue_extreme', 'blue_weak']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 4,
    kind: 'arrow',
    xp: 25,
    max_attempts: 3,
    hint_text: 'Rotate the view to find an open path.',
    hint_cost: 3,
    answer_json: JSON.stringify({ from: 'red_nu', to: 'blue_open' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 5',
      prompt: 'Steric hindrance: orbit the view to find the open, accessible target site (blue) and connect from the donor (red).',
      moleculeId: 'stage5_pair',
      anchors: ['red_nu', 'blue_open', 'blue_blocked']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 5,
    kind: 'arrow',
    xp: 25,
    max_attempts: 3,
    hint_text: 'Rotate the view to find an open path.',
    hint_cost: 3,
    answer_json: JSON.stringify({ from: 'red_nu', to: 'blue_open' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 6',
      prompt: 'Bulky groups shield one site: orbit the view to target the accessible center (blue).',
      moleculeId: 'stage6_pair',
      anchors: ['red_nu', 'blue_open', 'blue_blocked']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 6,
    kind: 'arrow',
    xp: 30,
    max_attempts: 3,
    hint_text: 'Rotate the view to find an open path.',
    hint_cost: 4,
    answer_json: JSON.stringify({ from: 'red_supreme', to: 'blue_accessible' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 7',
      prompt: 'Master challenge: identify the unhindered active site among multiple centers and route the arrow from the strongest donor.',
      moleculeId: 'stage7_pair',
      anchors: ['red_weak1', 'red_weak2', 'red_supreme', 'blue_accessible', 'blue_caged', 'blue_weak']
    })
  }
];

var Quests = {
  seedQuestsIfEmpty: function() {
    var q = Db.getAll('Quests');
    if (q.length === 0) {
      Db.append('Quests', DEFAULT_QUEST);
    }
    var qs = Db.getAll('QuestStages');
    var needsRebuild = qs.length === 0 || qs[0].kind === 'choice';
    if (needsRebuild) {
      for (var i = 0; i < DEFAULT_STAGES.length; i++) {
        Db.append('QuestStages', DEFAULT_STAGES[i]);
      }
    }
  },

  getManifest: function(questId) {
    Quests.seedQuestsIfEmpty();
    var cacheKey = 'quest:' + questId + ':manifest';
    var cached = Cache.get(cacheKey);
    if (cached) return cached;

    var quest = Db.findOne('Quests', function(q) { return q.quest_id === questId; });
    if (!quest) throw { code: 'NOT_FOUND', message: 'Quest not found.' };

    var stages = Db.find('QuestStages', function(s) { return s.quest_id === questId; });
    stages.sort(function(a, b) { return Number(a.stage_index) - Number(b.stage_index); });

    // Sanitize: strip answer_json!
    var sanitizedStages = stages.map(function(st) {
      var cfg = {};
      try {
        cfg = JSON.parse(st.scene_config || '{}');
      } catch (e) {}
      return {
        stage_index: Number(st.stage_index),
        kind: st.kind,
        xp: Number(st.xp),
        max_attempts: Number(st.max_attempts || 3),
        hint_cost: Number(st.hint_cost || 0),
        scene_config: cfg
      };
    });

    var result = {
      quest: quest,
      stages: sanitizedStages
    };

    Cache.put(cacheKey, result, 600);
    return result;
  },

  startQuest: function(playerId, questId) {
    var quest = Db.findOne('Quests', function(q) { return q.quest_id === questId; });
    if (!quest) throw { code: 'NOT_FOUND', message: 'Quest not found.' };
    if (quest.status !== 'live') throw { code: 'QUEST_CLOSED', message: 'Quest is not active.' };

    var player = Db.findOne('Players', function(p) { return p.player_id === playerId; });
    var runId = generateId('run');
    var now = isoNow();

    var progress = Db.findOne('Progress', function(pr) {
      return pr.player_id === playerId && pr.quest_id === questId;
    });

    if (!progress) {
      Db.append('Progress', {
        player_id: playerId,
        quest_id: questId,
        stage_reached: 0,
        completed_at: '',
        xp_earned: 0,
        hints_used: 0,
        items_awarded: '',
        updated_at: now
      });
    }

    // Active event modifiers
    var activeEvent = Events.getTeamActiveEvent(player.team_id);

    return {
      runId: runId,
      startedAt: now,
      eventModifiers: activeEvent ? {
        name: activeEvent.name,
        effect_code: activeEvent.effect_code,
        polarity: activeEvent.polarity
      } : null
    };
  },

  gradeStage: function(playerId, questId, stageIndex, payload, elapsedMs, hintUsed, gfxTier) {
    stageIndex = Number(stageIndex);
    Quests.seedQuestsIfEmpty();

    var stage = Db.findOne('QuestStages', function(s) {
      return s.quest_id === questId && Number(s.stage_index) === stageIndex;
    });
    if (!stage) throw { code: 'STAGE_NOT_FOUND', message: 'Stage not found.' };

    var player = Db.findOne('Players', function(p) { return p.player_id === playerId; });

    // Check prior attempts
    var prior = Db.find('Submissions', function(sub) {
      return sub.player_id === playerId && sub.quest_id === questId && Number(sub.stage_index) === stageIndex;
    });
    var attemptNo = prior.length + 1;
    var maxAttempts = Number(stage.max_attempts || 3);

    // Evaluate answer
    var answer = JSON.parse(stage.answer_json || '{}');
    var isCorrect = false;

    if (stage.kind === 'pick') {
      if (payload && payload.anchors && answer.anchors) {
        isCorrect = payload.anchors.length === answer.anchors.length &&
          payload.anchors[0] === answer.anchors[0];
      }
    } else if (stage.kind === 'pick_multi') {
      if (payload && payload.anchors && answer.anchors) {
        if (answer.ordered) {
          isCorrect = JSON.stringify(payload.anchors) === JSON.stringify(answer.anchors);
        } else {
          var pSorted = payload.anchors.slice().sort();
          var aSorted = answer.anchors.slice().sort();
          isCorrect = JSON.stringify(pSorted) === JSON.stringify(aSorted);
        }
      }
    } else if (stage.kind === 'choice') {
      if (payload && payload.correct && answer.correct) {
        isCorrect = payload.correct[0] === answer.correct[0];
      }
    } else if (stage.kind === 'rank') {
      if (payload && payload.order && answer.order) {
        isCorrect = JSON.stringify(payload.order) === JSON.stringify(answer.order);
      }
    } else if (stage.kind === 'arrow') {
      if (payload && answer) {
        isCorrect = payload.from === answer.from && payload.to === answer.to;
      }
    } else if (stage.kind === 'chain') {
      if (payload && payload.steps && answer.steps) {
        isCorrect = JSON.stringify(payload.steps) === JSON.stringify(answer.steps);
      }
    }

    // XP calculation
    var xpAwarded = 0;
    var baseStageXp = Number(stage.xp || 0);

    if (isCorrect) {
      var mult = attemptNo === 1 ? 1.25 : attemptNo === 2 ? 1.0 : 0.75;
      var hintCost = hintUsed ? Number(stage.hint_cost || 0) : 0;
      var calcXp = Math.floor(baseStageXp * mult) - hintCost;
      xpAwarded = Math.max(Math.floor(baseStageXp * 0.25), calcXp);
    }

    var subId = generateId('sub');
    var now = isoNow();

    Db.append('Submissions', {
      submission_id: subId,
      ts: now,
      player_id: playerId,
      quest_id: questId,
      stage_index: stageIndex,
      attempt_no: attemptNo,
      payload_json: JSON.stringify(payload || {}),
      correct: isCorrect ? 'TRUE' : 'FALSE',
      xp_awarded: xpAwarded,
      elapsed_ms: elapsedMs || 0,
      hint_used: hintUsed ? 'TRUE' : 'FALSE',
      gfx_tier: gfxTier || 'T2',
      ip_hash: ''
    });

    // Update progress cache
    if (isCorrect) {
      Db.update('Progress', function(pr) {
        return pr.player_id === playerId && pr.quest_id === questId;
      }, {
        stage_reached: stageIndex + 1,
        updated_at: now
      });
    }

    return {
      correct: isCorrect,
      xpAwarded: xpAwarded,
      revealText: isCorrect ? stage.reveal_text : '',
      attemptsLeft: Math.max(0, maxAttempts - attemptNo),
      nextStage: isCorrect ? stageIndex + 1 : stageIndex
    };
  },

  getHint: function(playerId, questId, stageIndex) {
    stageIndex = Number(stageIndex);
    var stage = Db.findOne('QuestStages', function(s) {
      return s.quest_id === questId && Number(s.stage_index) === stageIndex;
    });
    if (!stage) throw { code: 'STAGE_NOT_FOUND', message: 'Stage not found.' };

    var player = Db.findOne('Players', function(p) { return p.player_id === playerId; });
    var cost = Number(stage.hint_cost || 0);
    if (player && player.role === 'Engineer') {
      cost = 0;
    }

    var cfg = {};
    try { cfg = JSON.parse(stage.scene_config || '{}'); } catch (e) {}

    return {
      hintText: stage.hint_text,
      cost: cost,
      highlightAnchors: cfg.anchors ? cfg.anchors.slice(0, 2) : []
    };
  },

  completeQuest: function(playerId, questId) {
    var quest = Db.findOne('Quests', function(q) { return q.quest_id === questId; });
    if (!quest) throw { code: 'NOT_FOUND', message: 'Quest not found.' };

    var subs = Db.find('Submissions', function(s) {
      return s.player_id === playerId && s.quest_id === questId && s.correct === 'TRUE';
    });

    var totalStageXp = 0;
    for (var i = 0; i < subs.length; i++) {
      totalStageXp += Number(subs[i].xp_awarded || 0);
    }

    var completionBonus = 40;
    var onTimeBonus = 25;
    var questXp = totalStageXp + completionBonus + onTimeBonus;

    // Award a random item from quest item_pool
    var items = (quest.item_pool || 'hint_chip').split(',');
    var awardedItem = items[Math.floor(Math.random() * items.length)].trim();

    var now = isoNow();
    Db.update('Progress', function(pr) {
      return pr.player_id === playerId && pr.quest_id === questId;
    }, {
      completed_at: now,
      xp_earned: questXp,
      items_awarded: awardedItem,
      updated_at: now
    });

    // Add item to inventory
    var existingInv = Db.findOne('Inventory', function(inv) {
      return inv.player_id === playerId && inv.item_id === awardedItem;
    });
    if (existingInv) {
      Db.update('Inventory', function(inv) { return inv.inv_id === existingInv.inv_id; }, {
        qty: Number(existingInv.qty) + 1
      });
    } else {
      Db.append('Inventory', {
        inv_id: generateId('inv'),
        player_id: playerId,
        item_id: awardedItem,
        qty: 1,
        acquired_at: now,
        source: 'quest_complete_' + questId
      });
    }

    var totalXp = Scoring.computePlayerTotalXp(playerId);
    var newLevel = Scoring.computeLevel(totalXp);

    return {
      totalXp: questXp,
      awardedItem: awardedItem,
      newLevel: newLevel,
      epilogue: 'Quest complete! Here is the chemistry behind what you just discovered:\n\n1. Electron Density & Curved Arrows: The red regions represent high electron density (lone pairs / negative charge), while blue regions represent electron deficiency (positive partial charges / electrophiles). The arrows you drew match standard curved-arrow notation in organic chemistry, tracking the physical flow of electrons from source to target.\n\n2. Extremes & Selectivity: When multiple reactive sites compete, reactions preferentially proceed between the most electron-rich donor (strongest nucleophile) and most electron-poor center (strongest electrophile).\n\n3. Steric Hindrance: Physical geometry matters! Even when a site has strong positive charge, surrounding bulky groups (like methyl or isopropyl clusters) can physically block incoming molecules, steering reactions toward open, unhindered pathways.'
    };
  },

  gradeDemo: function(stageIndex, payload) {
    var answerAnchors = ['lp_o'];
    var isCorrect = false;
    if (payload && payload.anchors && payload.anchors.length > 0) {
      isCorrect = payload.anchors[0] === answerAnchors[0];
    }
    return {
      correct: isCorrect,
      revealText: isCorrect
        ? 'Scanner calibrated! High charge density detected on the outer lone-pair lobe.'
        : 'Scanner distortion: that area does not contain peak charge density. Try orbiting to the bright protruding lobe.'
    };
  }
};
