/**
 * Quests.gs — Quest manifests, stages, grading, hints, and completion for Avalon
 */

var DEFAULT_QUEST = {
  quest_id: 'q1',
  title: 'The Charge Gardens of Vareth-9',
  world: 'Vareth-9',
  blurb: 'Navigate luminous charge fog to awaken an abandoned alien terraforming lattice.',
  scene_id: 'charge_chamber',
  cover_image: '/art/q1_cover.webp',
  release_at: '2026-09-18T00:00:00Z',
  close_at: '2026-10-02T23:59:59Z',
  status: 'live',
  base_xp: 165,
  stage_count: 8,
  item_pool: 'hint_chip,spare_coolant,overclock_module,resonance_key'
};

var DEFAULT_STAGES = [
  {
    quest_id: 'q1',
    stage_index: 0,
    kind: 'choice',
    xp: 0,
    max_attempts: 3,
    hint_text: 'Select the scanner activation frequency.',
    hint_cost: 0,
    answer_json: JSON.stringify({ correct: ['a'] }),
    tolerance: 0,
    reveal_text: 'Atmospheric penetration complete. Scanner locking onto localized electrostatic potentials.',
    scene_config: JSON.stringify({
      title: 'Arrival at Vareth-9',
      prompt: 'Atmosphere dense with luminous ionized fog. Align your ship scanner to begin charge mapping.',
      options: [
        { id: 'a', label: 'Engage wideband electrostatic scanner' },
        { id: 'b', label: 'Fire optical lidar pulses' },
        { id: 'c', label: 'Descend blindly into the cloud' }
      ]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 1,
    kind: 'pick',
    xp: 10,
    max_attempts: 3,
    hint_text: 'Look for the brightest, most saturated yellow-green lobe protruding from the core.',
    hint_cost: 2,
    answer_json: JSON.stringify({ anchors: ['lp_o'] }),
    tolerance: 0,
    reveal_text: 'Scanner calibrated! High charge density detected on the outer lobe.',
    scene_config: JSON.stringify({
      title: 'Stage 1: Calibrate the Scanner',
      prompt: 'Orbit the charge cloud. Click or tap the most crowded, high-density lobe to lock calibration.',
      moleculeId: 'h2o',
      anchors: ['lp_o', 'h1', 'h2'],
      camera: { pos: [0, 0, 5], target: [0, 0, 0] }
    })
  },
  {
    quest_id: 'q1',
    stage_index: 2,
    kind: 'rank',
    xp: 15,
    max_attempts: 3,
    hint_text: 'Drag items from most lopsided/polarized to most symmetric sharing.',
    hint_cost: 3,
    answer_json: JSON.stringify({ order: ['hf', 'lih', 'h2'] }),
    tolerance: 0,
    reveal_text: 'Some pairs share evenly. Some don\'t. The lopsided ones are where things happen.',
    scene_config: JSON.stringify({
      title: 'Stage 2: Read the Lean',
      prompt: 'Three beacons detected (HF, LiH, H2). Rank them by polarity from most uneven density to most evenly shared.',
      items: [
        { id: 'hf', label: 'Beacon A (Fluoride Hydride): Intense charge pulled to one pole' },
        { id: 'lih', label: 'Beacon B (Lithium Hydride): Moderate polarization' },
        { id: 'h2', label: 'Beacon C (Diatomic Hydrogen): Completely symmetrical sharing' }
      ]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 3,
    kind: 'pick_multi',
    xp: 20,
    max_attempts: 3,
    hint_text: 'Select the electron-rich lone pair on the donor first, then the electron-poor carbon center on the receiver.',
    hint_cost: 4,
    answer_json: JSON.stringify({ anchors: ['lp_o', 'c1'], ordered: false }),
    tolerance: 0,
    reveal_text: 'Crowded places give. Starved places take. That\'s the whole game.',
    scene_config: JSON.stringify({
      title: 'Stage 3: Giver and Taker',
      prompt: 'Identify the active sites: select the most crowded donor lobe, and the most starved recipient site.',
      moleculeId: 'nu_sub_pair',
      anchors: ['lp_o', 'c1', 'cl1', 'h1'],
      camera: { pos: [0, 1, 6], target: [0, 0, 0] }
    })
  },
  {
    quest_id: 'q1',
    stage_index: 4,
    kind: 'arrow',
    xp: 25,
    max_attempts: 3,
    hint_text: 'Drag from the concentrated electron lobe (lp_o) towards the carbon electrophile center (c1).',
    hint_cost: 5,
    answer_json: JSON.stringify({ from: 'lp_o', to: 'c1' }),
    tolerance: 0,
    reveal_text: 'Charge flows along the potential gradient directly into the starved core.',
    scene_config: JSON.stringify({
      title: 'Stage 4: Route the Current',
      prompt: 'Drag a curved energy arrow from the crowded donor lone pair to the starved carbon center.',
      moleculeId: 'nu_sub_pair',
      anchors: ['lp_o', 'c1', 'cl1'],
      camera: { pos: [0, 1, 6], target: [0, 0, 0] }
    })
  },
  {
    quest_id: 'q1',
    stage_index: 5,
    kind: 'choice',
    xp: 25,
    max_attempts: 3,
    hint_text: 'As the new bond forms to the carbon, the leaving group bond must break to keep octet stability.',
    hint_cost: 5,
    answer_json: JSON.stringify({ correct: ['b'] }),
    tolerance: 0,
    reveal_text: 'Bond formed; leaving group displaced into solution with inverted stereochemistry.',
    scene_config: JSON.stringify({
      title: 'Stage 5: The Aftermath',
      prompt: 'Inspect the simulated outcome. Which molecular configuration accurately represents the displaced bond?',
      options: [
        { id: 'a', label: 'Carbon holds five active bonds simultaneously (Pentavalent)' },
        { id: 'b', label: 'New C-O bond formed; chloride ion departs with the shared pair' },
        { id: 'c', label: 'Both hydrogen atoms detach; carbon remains bonded to halogen' }
      ]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 6,
    kind: 'chain',
    xp: 40,
    max_attempts: 3,
    hint_text: 'Step 1: Nucleophile lone pair attacks carbon. Step 2: Carbon-chlorine bond cleaves to chlorine.',
    hint_cost: 8,
    answer_json: JSON.stringify({ steps: [{ from: 'lp_o', to: 'c1' }, { from: 'c_cl', to: 'cl' }] }),
    tolerance: 0,
    reveal_text: 'The derelict terraforming lattice unlocks with a resonant hum!',
    scene_config: JSON.stringify({
      title: 'Stage 6: The Lock',
      prompt: 'Execute the full substitution cascade: draw the attack arrow, followed by the leaving group departure arrow.',
      moleculeId: 'sn2_reaction',
      anchors: ['lp_o', 'c1', 'c_cl', 'cl'],
      camera: { pos: [0, 1, 6], target: [0, 0, 0] }
    })
  },
  {
    quest_id: 'q1',
    stage_index: 7,
    kind: 'chain',
    xp: 30,
    max_attempts: 3,
    hint_text: 'Scaffolding disabled. Nucleophile donor -> tertiary carbon center -> halide leaving group.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ from: 'lp_nu', to: 'c_sub' }, { from: 'c_br', to: 'br' }] }),
    tolerance: 0,
    reveal_text: 'Mastery verified! The unlit garden blooms with coherent emerald luminescence.',
    scene_config: JSON.stringify({
      title: 'Stage 7 (Bonus): The Unlit Garden',
      prompt: 'A challenging un-scaffolded substrate. Route both arrows correctly to claim the rare garden drop.',
      moleculeId: 'bonus_reaction',
      anchors: ['lp_nu', 'c_sub', 'c_br', 'br'],
      camera: { pos: [0, 1, 6], target: [0, 0, 0] }
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
    if (qs.length === 0) {
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
      if (player && player.role === 'Engineer') {
        hintCost = 0; // Engineer gets free hint
      }
      var calcXp = Math.floor(baseStageXp * mult) - hintCost;
      xpAwarded = Math.max(Math.floor(baseStageXp * 0.25), calcXp);

      // Check Xenobiologist perk: +10% XP on bonus stages (stage 7)
      if (player && player.role === 'Xenobiologist' && stageIndex >= 7) {
        xpAwarded = Math.floor(xpAwarded * 1.10);
      }
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
      epilogue: 'The crowded places you clicked are lone pairs and pi clouds. The starved places are electrophiles. The arrow you drew is curved-arrow notation — real nucleophilic substitution!'
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
