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
  base_xp: 650,
  stage_count: 20,
  item_pool: 'hint_chip,spare_coolant,overclock_module,resonance_key'
};

/**
 * The reveal at the end of Quest 1. This is the one place the real vocabulary is
 * introduced, because by now the player has built the intuition to hang it on.
 * Kept identical to the client-side fallback in src/screens/quest.js.
 */
var QUEST1_EPILOGUE = [
  'Here is the chemistry you were actually doing.',
  '',
  'Every red cloud was a spot with extra electrons — a region of negative charge. Every blue spot was electron-poor and positively charged. Opposite charges attract, so reactions start where the reddest region meets the bluest one.',
  '',
  'The lines you drew are called curved arrows, and chemists use exactly this notation. An arrow shows a pair of electrons moving from where they are to where they are going.',
  '',
  'When two blue targets competed, geometry decided the winner: bulky groups physically block incoming molecules, so reactions take the open route. That is called steric hindrance.',
  '',
  'In the multi-step stages you were writing a reaction mechanism — the exact order in which bonds form and break. That is the core skill of organic chemistry, and you just did twenty of them.'
].join('\n');

var DEFAULT_STAGES = [
  {
    quest_id: 'q1',
    stage_index: 0,
    kind: 'arrow',
    xp: 15,
    max_attempts: 9999,
    hint_text: 'Charge travels from negative (red) to positive (blue). Look at the colors.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_lp1', to: 'blue_c1' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 1 — Target Lock',
      prompt: 'Two sites are glowing. Drag an arrow from the red giver to the blue receiver.',
      moleculeId: 'stage1_pair',
      anchors: ['red_lp1', 'blue_c1']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 1,
    kind: 'arrow',
    xp: 15,
    max_attempts: 9999,
    hint_text: 'The blue center can only hold so many bonds. Adding a new bond will push the old group out.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_lp1', to: 'blue_c1' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 2 — Making Room',
      prompt: 'The blue center already has an attached group. Connect the red giver to the blue center to displace it.',
      moleculeId: 'stage2_pair',
      anchors: ['red_lp1', 'blue_c1']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 2,
    kind: 'arrow',
    xp: 20,
    max_attempts: 9999,
    hint_text: 'Look at the brightness of the charges. The strongest pair reacts before the weaker ones.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_extreme', to: 'blue_extreme' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 3 — Four Live Sites',
      prompt: 'Four sites are glowing. Connect the brightest red giver to the deepest blue receiver.',
      moleculeId: 'stage3_pair',
      anchors: ['red_weak', 'red_extreme', 'blue_extreme', 'blue_weak']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 3,
    kind: 'arrow',
    xp: 20,
    max_attempts: 9999,
    hint_text: 'Compare the brightness of the sites. The strongest pair will react first.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_extreme', to: 'blue_extreme' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 4 — Decoys',
      prompt: 'Four sites are present, and two are decoys. Connect the strongest red giver to the strongest blue receiver.',
      moleculeId: 'stage4_pair',
      anchors: ['red_weak', 'red_extreme', 'blue_extreme', 'blue_weak']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 4,
    kind: 'arrow',
    xp: 25,
    max_attempts: 9999,
    hint_text: 'Both blue sites pull equally hard. Rotate the view to see which one has an open approach.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_nu', to: 'blue_open' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 5 — The Trap',
      prompt: 'Two blue sites pull equally, but one is blocked. Rotate the chamber to find the unblocked route.',
      moleculeId: 'stage5_pair',
      anchors: ['red_nu', 'blue_open', 'blue_blocked']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 5,
    kind: 'arrow',
    xp: 25,
    max_attempts: 9999,
    hint_text: 'Look closely at the atoms around each blue site. One is crowded and one is out in the open.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_nu', to: 'blue_open' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 6 — Fenced In',
      prompt: 'Bulky groups surround the upper site. Rotate the chamber to connect to the open blue site below.',
      moleculeId: 'stage6_pair',
      anchors: ['red_nu', 'blue_open', 'blue_blocked']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 6,
    kind: 'arrow',
    xp: 30,
    max_attempts: 9999,
    hint_text: 'Find the brightest red spot. For the blue target, it must be both hungry and unblocked.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_supreme', to: 'blue_accessible' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 7 — Six Sites, One Answer',
      prompt: 'Six sites are visible. Connect the strongest red giver to the open, unblocked blue receiver.',
      moleculeId: 'stage7_pair',
      anchors: ['red_weak1', 'red_weak2', 'red_supreme', 'blue_accessible', 'blue_caged', 'blue_weak']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 7,
    kind: 'arrow',
    xp: 30,
    max_attempts: 9999,
    hint_text: 'One of the three molecules is inactive and barely glowing. Ignore it.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_base', to: 'blue_acid' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 8 — Three in the Chamber',
      prompt: 'Three molecules are present. Connect the active red giver to the blue receiver, ignoring the bystander.',
      moleculeId: 'stage8_trio',
      anchors: ['red_base', 'blue_acid', 'spectator_mid']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 8,
    kind: 'arrow',
    xp: 30,
    max_attempts: 9999,
    hint_text: 'Both red givers are aimed at the same blue receiver. Compare their intensity.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_strong', to: 'blue_target' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 9 — The Race',
      prompt: 'Two red givers compete for one blue receiver. Connect the stronger giver to the target.',
      moleculeId: 'stage9_trio',
      anchors: ['red_strong', 'red_weak', 'blue_target']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 9,
    kind: 'arrow',
    xp: 35,
    max_attempts: 9999,
    hint_text: 'The large molecule on the right is not reactive enough yet. It needs to be activated first.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_base', to: 'blue_proton' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 10 — Warm-Up Act',
      prompt: 'The main structure is unreactive on its own. Transfer to the helper site first to activate it.',
      moleculeId: 'stage10_trio',
      anchors: ['red_base', 'blue_proton', 'blue_substrate']
    })
  },
  {
    quest_id: 'q1',
    stage_index: 10,
    kind: 'multi_arrow',
    xp: 35,
    max_attempts: 9999,
    hint_text: 'Decide which step must happen first. The leaving piece cannot depart until the newcomer arrives.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 11 — One In, One Out',
      prompt: 'Draw two arrows in sequence. Attach the incoming piece first, then displace the leaving piece.',
      moleculeId: 'stage11_pair',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['red_nu', 'blue_c', 'red_cl', 'blue_scavenger'],
      steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 11,
    kind: 'multi_arrow',
    xp: 35,
    max_attempts: 9999,
    hint_text: 'Attack the center first. The incoming bond forces the double bond to open up.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_o', expectedTo: 'blue_h' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 12 — The Double Link',
      prompt: 'Two atoms share a double bond. Push into the center first to swing the double bond open. Two arrows.',
      moleculeId: 'stage12_pair',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['red_nu', 'blue_c', 'red_o', 'blue_h'],
      steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_o', expectedTo: 'blue_h' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 12,
    kind: 'multi_arrow',
    xp: 35,
    max_attempts: 9999,
    hint_text: 'Look at the two transfer steps. Each arrow moves a loosely held piece to its partner.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_base1', expectedTo: 'blue_h1' }, { order: 2, expectedFrom: 'red_base2', expectedTo: 'blue_h2' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 13 — Passing It Along',
      prompt: 'Transfer the piece across the chamber in two sequential steps. Two arrows.',
      moleculeId: 'stage13_pair',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['red_base1', 'blue_h1', 'red_base2', 'blue_h2'],
      steps: [{ order: 1, expectedFrom: 'red_base1', expectedTo: 'blue_h1' }, { order: 2, expectedFrom: 'red_base2', expectedTo: 'blue_h2' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 13,
    kind: 'multi_arrow',
    xp: 40,
    max_attempts: 9999,
    hint_text: 'Attack the center first to attach the new group, then release the leaving group.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 14 — Add, Then Drop',
      prompt: 'The center is occupied. Add the new piece first, then expel the old group. Two arrows.',
      moleculeId: 'stage14_pair',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['red_nu', 'blue_c', 'red_cl', 'blue_scavenger'],
      steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 14,
    kind: 'multi_arrow',
    xp: 40,
    max_attempts: 9999,
    hint_text: 'The giver on the left cannot attack the center directly until the center is activated.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_o_carbonyl', expectedTo: 'blue_proton' }, { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_activated_c' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 15 — Wake It Up First',
      prompt: 'The main center is unreactive. Transfer to the helper site first to activate it, then attack. Two arrows.',
      moleculeId: 'stage15_trio',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['red_o_carbonyl', 'blue_proton', 'red_water', 'blue_activated_c'],
      steps: [{ order: 1, expectedFrom: 'red_o_carbonyl', expectedTo: 'blue_proton' }, { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_activated_c' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 15,
    kind: 'multi_arrow',
    xp: 40,
    max_attempts: 9999,
    hint_text: 'Identify the incoming group and the leaving group. New attachments form before old ones break.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_ethoxide', expectedTo: 'blue_proton' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 16 — Cutting the Tail',
      prompt: 'Attack the center first, then release the leaving tail. Two arrows.',
      moleculeId: 'stage16_trio',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['red_nu', 'blue_c', 'red_ethoxide', 'blue_proton'],
      steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_ethoxide', expectedTo: 'blue_proton' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 16,
    kind: 'multi_arrow',
    xp: 40,
    max_attempts: 9999,
    hint_text: 'The tight three-membered ring opens when attacked. Step 1 relieves the ring strain.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c_ring' }, { order: 2, expectedFrom: 'red_o_ring', expectedTo: 'blue_proton' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 17 — Ring Opening',
      prompt: 'The three-membered ring is under high strain. Attack a corner to snap it open, then neutralize. Two arrows.',
      moleculeId: 'stage17_pair',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['red_nu', 'blue_c_ring', 'red_o_ring', 'blue_proton'],
      steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c_ring' }, { order: 2, expectedFrom: 'red_o_ring', expectedTo: 'blue_proton' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 17,
    kind: 'multi_arrow',
    xp: 45,
    max_attempts: 9999,
    hint_text: 'The middle position becomes reactive only after its attached group is removed.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_base', expectedTo: 'blue_h_alpha' }, { order: 2, expectedFrom: 'c_alpha', expectedTo: 'blue_target' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 18 — Domino',
      prompt: 'Remove the outer group first to generate a reactive center, then attack the target. Two arrows.',
      moleculeId: 'stage18_pair',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['red_base', 'blue_h_alpha', 'c_alpha', 'blue_target'],
      steps: [{ order: 1, expectedFrom: 'red_base', expectedTo: 'blue_h_alpha' }, { order: 2, expectedFrom: 'c_alpha', expectedTo: 'blue_target' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 18,
    kind: 'multi_arrow',
    xp: 45,
    max_attempts: 9999,
    hint_text: 'The center is completely blocked. An incoming piece cannot attach until the existing group leaves.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger' }, { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_carbocation' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 19 — Leave, Then Fill',
      prompt: 'The crowded center has no room for an incoming group. The leaving group must depart first. Two arrows.',
      moleculeId: 'stage19_pair',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['red_cl', 'blue_scavenger', 'red_water', 'blue_carbocation'],
      steps: [{ order: 1, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger' }, { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_carbocation' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 19,
    kind: 'multi_arrow',
    xp: 50,
    max_attempts: 9999,
    hint_text: 'The central scaffold is inactive until the small helper donates charge to it.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_cat', expectedTo: 'blue_proton' }, { order: 2, expectedFrom: 'red_core', expectedTo: 'blue_c_scaffold' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 20 — Grand Finish',
      prompt: 'Activate the scaffold with the helper first, then connect the core piece. Two arrows.',
      moleculeId: 'stage20_multi',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['red_cat', 'blue_proton', 'red_core', 'blue_c_scaffold'],
      steps: [{ order: 1, expectedFrom: 'red_cat', expectedTo: 'blue_proton' }, { order: 2, expectedFrom: 'red_core', expectedTo: 'blue_c_scaffold' }]
    })
  }
];

var Quests = {
  seedQuestsIfEmpty: function() {
    var q = Db.getAll('Quests');
    if (q.length === 0) {
      Db.append('Quests', DEFAULT_QUEST);
    } else if (Number(q[0].stage_count || 0) < 20) {
      Db.update('Quests', function(item) { return item.quest_id === 'q1'; }, {
        stage_count: 20,
        base_xp: 660
      });
    }
    var qs = Db.getAll('QuestStages');
    var needsRebuild = qs.length === 0 || qs[0].kind === 'choice' || qs.length < 20;
    if (needsRebuild) {
      var ss = getDb_();
      var s = ss.getSheetByName('QuestStages');
      if (s) {
        s.clear();
        s.appendRow(DB_SCHEMA.QuestStages);
      }
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
    var wrongOrder = false;
    var incomplete = false;

    if (stage.kind === 'multi_arrow') {
      var expectedSteps = answer.steps || [];
      var userArrows = (payload && payload.arrows ? payload.arrows : []).slice().sort(function(a, b) {
        return (a.order || 0) - (b.order || 0);
      });
      if (userArrows.length < expectedSteps.length) {
        incomplete = true;
      } else {
        var matches = true;
        for (var si = 0; si < expectedSteps.length; si++) {
          var act = userArrows[si];
          var exp = expectedSteps[si];
          if (!act || act.from !== exp.expectedFrom || act.to !== exp.expectedTo) {
            matches = false;
            break;
          }
        }
        if (matches) {
          isCorrect = true;
        } else {
          var matchedPairs = expectedSteps.every(function(exp) {
            return userArrows.some(function(act) {
              return act.from === exp.expectedFrom && act.to === exp.expectedTo;
            });
          });
          if (matchedPairs) wrongOrder = true;
        }
      }
    } else if (stage.kind === 'pick') {
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
    } else if (stage.kind === 'arrow' || !stage.kind) {
      var pFrom = payload ? (payload.from || (payload.arrows && payload.arrows[0] ? payload.arrows[0].from : null)) : null;
      var pTo = payload ? (payload.to || (payload.arrows && payload.arrows[0] ? payload.arrows[0].to : null)) : null;
      if (pFrom && pTo && answer) {
        if (pFrom === answer.from && pTo === answer.to) {
          isCorrect = true;
        }
      } else if (payload && answer) {
        if (payload.from === answer.from && payload.to === answer.to) {
          isCorrect = true;
        } else if (payload.startPos && payload.endPos) {
          var solMap = {
            0: { s: [-1.4, 0.2, 0], t: [1.8, 0, 0] },
            1: { s: [-1.5, 0.3, 0], t: [1.1, 0, 0] },
            2: { s: [-0.8, -1.2, 0], t: [1.3, -0.3, 0] },
            3: { s: [-0.8, -1.2, 0], t: [1.3, -0.3, 0] },
            4: { s: [-1.4, 0.2, 0], t: [1.0, -1.0, 0], b: [2.0, 1.1, 0] },
            5: { s: [-1.5, 0.2, 0], t: [1.6, -0.9, 0], b: [1.8, 1.2, 0] },
            6: { s: [-0.4, 0, 0], t: [1.6, -0.8, 0], b: [2.0, 1.2, 0] }
          };
          var sol = solMap[stageIndex];
          if (sol) {
            var sDist = Math.sqrt(Math.pow(payload.startPos[0]-sol.s[0], 2) + Math.pow(payload.startPos[1]-sol.s[1], 2) + Math.pow((payload.startPos[2]||0)-sol.s[2], 2));
            var eDist = Math.sqrt(Math.pow(payload.endPos[0]-sol.t[0], 2) + Math.pow(payload.endPos[1]-sol.t[1], 2) + Math.pow((payload.endPos[2]||0)-sol.t[2], 2));
            var bDist = sol.b ? Math.sqrt(Math.pow(payload.endPos[0]-sol.b[0], 2) + Math.pow(payload.endPos[1]-sol.b[1], 2) + Math.pow((payload.endPos[2]||0)-sol.b[2], 2)) : 999;
            if (sDist <= 1.35 && eDist <= 1.35 && bDist > 1.35) {
              isCorrect = true;
            }
          }
        }
      }
    } else if (stage.kind === 'chain') {
      if (payload && payload.steps && answer.steps) {
        isCorrect = JSON.stringify(payload.steps) === JSON.stringify(answer.steps);
      }
    }

    // XP calculation.
    // Flat, once per stage:
    //  - the client grades locally and shows "+N XP" before this call returns, so an
    //    attempt-count multiplier here would contradict what the player was just told;
    //  - a stage already cleared pays nothing, so replaying it (the Prev button) is
    //    practice, not an XP faucet.
    var xpAwarded = 0;
    var baseStageXp = Number(stage.xp || 0);

    if (isCorrect) {
      var alreadyCleared = false;
      for (var pi = 0; pi < prior.length; pi++) {
        if (String(prior[pi].correct).toUpperCase() === 'TRUE') {
          alreadyCleared = true;
          break;
        }
      }
      xpAwarded = alreadyCleared ? 0 : baseStageXp;
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
      var existingProgress = Db.findOne('Progress', function(pr) {
        return pr.player_id === playerId && pr.quest_id === questId;
      });
      var priorReached = existingProgress ? Number(existingProgress.stage_reached || 0) : 0;
      Db.update('Progress', function(pr) {
        return pr.player_id === playerId && pr.quest_id === questId;
      }, {
        stage_reached: Math.max(priorReached, stageIndex + 1),
        updated_at: now
      });
    }

    return {
      correct: isCorrect,
      wrongOrder: wrongOrder,
      incomplete: incomplete,
      xpAwarded: xpAwarded,
      revealText: isCorrect ? stage.reveal_text : '',
      attemptsLeft: 9999,
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

    // Finishing the same quest twice must not mint a second reward item.
    var priorProgress = Db.findOne('Progress', function(pr) {
      return pr.player_id === playerId && pr.quest_id === questId;
    });
    if (priorProgress && priorProgress.completed_at) {
      return {
        totalXp: Number(priorProgress.xp_earned || 0),
        awardedItem: priorProgress.items_awarded || '',
        newLevel: Scoring.computeLevel(Scoring.computePlayerTotalXp(playerId)),
        alreadyCompleted: true,
        epilogue: QUEST1_EPILOGUE
      };
    }

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
      epilogue: QUEST1_EPILOGUE
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
