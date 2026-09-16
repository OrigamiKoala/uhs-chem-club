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
  base_xp: 660,
  stage_count: 20,
  item_pool: 'hint_chip,spare_coolant,overclock_module,resonance_key'
};

var DEFAULT_STAGES = [
  {
    quest_id: 'q1',
    stage_index: 0,
    kind: 'arrow',
    xp: 15,
    max_attempts: 9999,
    hint_text: 'Draw an arrow from the red donor to the blue acceptor.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_lp1', to: 'blue_c1' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 1 — Target Lock',
      prompt: 'Drag a line from the crowded red zone to the hungry blue zone.',
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
    hint_text: 'Draw an arrow from the red donor to the blue acceptor.',
    hint_cost: 1,
    answer_json: JSON.stringify({ from: 'red_lp1', to: 'blue_c1' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 2 — Electrons & Charge',
      prompt: 'Opposites attract! Connect the negative red cloud to the positive blue center.',
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
    hint_text: 'Connect the extreme red donor to the extreme blue acceptor.',
    hint_cost: 2,
    answer_json: JSON.stringify({ from: 'red_extreme', to: 'blue_extreme' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 3 — Comparing Densities',
      prompt: 'Multiple reactive spots: connect the deepest red donor to the deepest blue acceptor.',
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
    hint_text: 'Select the primary reactive site and connect to the acceptor center.',
    hint_cost: 2,
    answer_json: JSON.stringify({ from: 'red_extreme', to: 'blue_extreme' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 4 — Competing Sites',
      prompt: 'Ignore weak distractions: connect the brightest red donor into the deepest blue core.',
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
    hint_text: 'Rotate the view to find an open path.',
    hint_cost: 3,
    answer_json: JSON.stringify({ from: 'red_nu', to: 'blue_open' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 5 — Steric Hindrance',
      prompt: 'Trace the path into the open target. Avoid the crowded obstacle!',
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
    hint_text: 'Rotate the view to find an open path.',
    hint_cost: 3,
    answer_json: JSON.stringify({ from: 'red_nu', to: 'blue_open' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 6 — Bulky Group Shielding',
      prompt: 'Bulky groups block one route. Rotate view and connect to the open flank!',
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
    hint_text: 'Rotate the view to find an open path.',
    hint_cost: 4,
    answer_json: JSON.stringify({ from: 'red_supreme', to: 'blue_accessible' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 7 — Final Synthesis Route',
      prompt: 'Find the strongest red donor and trace an open path into the unhindered blue target!',
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
    hint_text: 'Ignore the spectator. Connect the red donor to the blue acceptor.',
    hint_cost: 3,
    answer_json: JSON.stringify({ from: 'red_base', to: 'blue_acid' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 8 — Three\'s Company',
      prompt: 'Three molecules in the chamber! Connect the active red donor directly to the hungry blue acceptor, ignoring the quiet spectator.',
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
    hint_text: 'Connect the strongest red donor to the blue target.',
    hint_cost: 3,
    answer_json: JSON.stringify({ from: 'red_strong', to: 'blue_target' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 9 — The Tug-of-War',
      prompt: 'Two givers want the same blue prize! Connect the strongest red donor to the hungry blue receiver.',
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
    hint_text: 'Connect the helper donor to the blue target to activate it.',
    hint_cost: 3,
    answer_json: JSON.stringify({ from: 'red_base', to: 'blue_proton' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 10 — The Team Relay',
      prompt: 'A molecule needs help! Connect the helper red donor into the blue target to activate it.',
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
    hint_text: '1st arrow: Red donor into blue center. 2nd arrow: Bond into leaving group.',
    hint_cost: 3,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'bond_c_cl', expectedTo: 'cl_leave' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 11 — The Knockout Punch',
      prompt: 'Multi-step reaction! Draw 2 arrows in order: 1st: Red donor ➔ Blue center. 2nd: Connected bond ➔ Departing group.',
      moleculeId: 'stage11_pair',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['red_nu', 'blue_c', 'bond_c_cl', 'cl_leave'],
      steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'bond_c_cl', expectedTo: 'cl_leave' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 11,
    kind: 'multi_arrow',
    xp: 35,
    max_attempts: 9999,
    hint_text: '1st arrow: Red donor into center. 2nd arrow: Double bond to outer atom.',
    hint_cost: 3,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'bond_c_o', expectedTo: 'red_o' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 12 — The Rooftop Bounce',
      prompt: 'Two-step sequence! Arrow 1: Red donor ➔ Blue center. Arrow 2: Double bond ➔ Outer atom.',
      moleculeId: 'stage12_pair',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['red_nu', 'blue_c', 'bond_c_o', 'red_o'],
      steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'bond_c_o', expectedTo: 'red_o' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 12,
    kind: 'multi_arrow',
    xp: 35,
    max_attempts: 9999,
    hint_text: '1st arrow: Red donor into blue target. 2nd arrow: Bond back onto adjacent atom.',
    hint_cost: 3,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_base', expectedTo: 'blue_h' }, { order: 2, expectedFrom: 'bond_o_h', expectedTo: 'red_o_acid' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 13 — The Hot Potato',
      prompt: 'Two-step relay! Arrow 1: Red donor ➔ Blue target. Arrow 2: Old bond ➔ Adjacent atom.',
      moleculeId: 'stage13_pair',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['red_base', 'blue_h', 'bond_o_h', 'red_o_acid'],
      steps: [{ order: 1, expectedFrom: 'red_base', expectedTo: 'blue_h' }, { order: 2, expectedFrom: 'bond_o_h', expectedTo: 'red_o_acid' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 13,
    kind: 'multi_arrow',
    xp: 40,
    max_attempts: 9999,
    hint_text: '1: Donor to center. 2: Double bond to outer atom. 3: Outer atom kicks off leaving group.',
    hint_cost: 4,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'bond_c_o', expectedTo: 'red_o' }, { order: 3, expectedFrom: 'red_o', expectedTo: 'cl_leave' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 14 — The Trampoline Kick-Back',
      prompt: '3-Step sequence! 1: Red donor ➔ Blue center. 2: Double bond ➔ Outer atom. 3: Outer atom ➔ Departing group.',
      moleculeId: 'stage14_pair',
      multiArrow: true,
      maxArrows: 3,
      anchors: ['red_nu', 'blue_c', 'bond_c_o', 'red_o', 'cl_leave'],
      steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'bond_c_o', expectedTo: 'red_o' }, { order: 3, expectedFrom: 'red_o', expectedTo: 'cl_leave' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 14,
    kind: 'multi_arrow',
    xp: 40,
    max_attempts: 9999,
    hint_text: '1: First donor to blue target. 2: Second donor to activated center.',
    hint_cost: 4,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_o_carbonyl', expectedTo: 'blue_proton' }, { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_activated_c' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 15 — The Key to the Lock',
      prompt: 'Unlock then enter! Arrow 1: Red donor ➔ Blue target (unlock). Arrow 2: Second donor ➔ Activated center (enter).',
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
    hint_text: '1: Donor into center. 2: Double bond to outer atom. 3: Outer atom kicks off leaving group.',
    hint_cost: 4,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'bond_c_o', expectedTo: 'red_o' }, { order: 3, expectedFrom: 'red_o', expectedTo: 'blue_ethoxide' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 16 — The Soap Maker',
      prompt: '3-Step sequence! 1: Red donor ➔ Blue center. 2: Double bond ➔ Outer atom. 3: Outer atom ➔ Departing group.',
      moleculeId: 'stage16_trio',
      multiArrow: true,
      maxArrows: 3,
      anchors: ['red_nu', 'blue_c', 'bond_c_o', 'red_o', 'blue_ethoxide'],
      steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'bond_c_o', expectedTo: 'red_o' }, { order: 3, expectedFrom: 'red_o', expectedTo: 'blue_ethoxide' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 16,
    kind: 'multi_arrow',
    xp: 40,
    max_attempts: 9999,
    hint_text: '1: Donor to ring center. 2: Ring bond snaps open to ring atom.',
    hint_cost: 4,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c_ring' }, { order: 2, expectedFrom: 'bond_ring', expectedTo: 'red_o_ring' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 17 — The Snapping Spring',
      prompt: 'Release trapped strain! Arrow 1: Red donor ➔ Ring center. Arrow 2: Ring bond ➔ Ring atom.',
      moleculeId: 'stage17_pair',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['red_nu', 'blue_c_ring', 'bond_ring', 'red_o_ring'],
      steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c_ring' }, { order: 2, expectedFrom: 'bond_ring', expectedTo: 'red_o_ring' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 17,
    kind: 'multi_arrow',
    xp: 45,
    max_attempts: 9999,
    hint_text: '1: Donor to target. 2: Adjacent bond to center. 3: Reactive center to substrate.',
    hint_cost: 4,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_base', expectedTo: 'blue_h_alpha' }, { order: 2, expectedFrom: 'bond_c_h', expectedTo: 'blue_c_carbonyl' }, { order: 3, expectedFrom: 'c_alpha', expectedTo: 'blue_target' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 18 — The Domino Chain',
      prompt: '3-Step cascade! 1: Red donor ➔ Target atom. 2: Adjacent bond ➔ Center. 3: Reactive center ➔ Substrate.',
      moleculeId: 'stage18_pair',
      multiArrow: true,
      maxArrows: 3,
      anchors: ['red_base', 'blue_h_alpha', 'bond_c_h', 'blue_c_carbonyl', 'c_alpha', 'blue_target'],
      steps: [{ order: 1, expectedFrom: 'red_base', expectedTo: 'blue_h_alpha' }, { order: 2, expectedFrom: 'bond_c_h', expectedTo: 'blue_c_carbonyl' }, { order: 3, expectedFrom: 'c_alpha', expectedTo: 'blue_target' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 18,
    kind: 'multi_arrow',
    xp: 45,
    max_attempts: 9999,
    hint_text: '1: Leaving group departs to make vacancy. 2: Donor fills the open spot.',
    hint_cost: 4,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'bond_c_cl', expectedTo: 'red_cl' }, { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_carbocation' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 19 — Musical Chairs',
      prompt: 'Leave first, enter second! Arrow 1: Bond ➔ Departing group (leave). Arrow 2: Red donor ➔ Empty blue center (enter).',
      moleculeId: 'stage19_pair',
      multiArrow: true,
      maxArrows: 2,
      anchors: ['bond_c_cl', 'red_cl', 'red_water', 'blue_carbocation'],
      steps: [{ order: 1, expectedFrom: 'bond_c_cl', expectedTo: 'red_cl' }, { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_carbocation' }]
    })
  },
  {
    quest_id: 'q1',
    stage_index: 19,
    kind: 'multi_arrow',
    xp: 50,
    max_attempts: 9999,
    hint_text: '1: Catalyst to target. 2: Core donor to central acceptor. 3: Leaving group departs.',
    hint_cost: 5,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_cat', expectedTo: 'blue_proton' }, { order: 2, expectedFrom: 'red_core', expectedTo: 'blue_c_scaffold' }, { order: 3, expectedFrom: 'bond_leave', expectedTo: 'red_depart' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 20 — The Master Conductor',
      prompt: 'Grand Finale Synthesis! 1: Catalyst donor ➔ Target atom. 2: Core donor ➔ Central acceptor. 3: Bond ➔ Departing group.',
      moleculeId: 'stage20_multi',
      multiArrow: true,
      maxArrows: 3,
      anchors: ['red_cat', 'blue_proton', 'red_core', 'blue_c_scaffold', 'bond_leave', 'red_depart'],
      steps: [{ order: 1, expectedFrom: 'red_cat', expectedTo: 'blue_proton' }, { order: 2, expectedFrom: 'red_core', expectedTo: 'blue_c_scaffold' }, { order: 3, expectedFrom: 'bond_leave', expectedTo: 'red_depart' }]
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
