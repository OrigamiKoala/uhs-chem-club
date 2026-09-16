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
    hint_text: 'Tap a glowing cloud. The scan readout tells you whether that site has charge to spare or is short of it.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_lp1', to: 'blue_c1' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 1 — Target Lock',
      prompt: 'Two sites are glowing. Tap each one to scan it, then drag a line from the site that gives to the site that takes.',
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
    hint_text: 'Scan the blue site and read its CLEARANCE. That number is how much room is left around it.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_lp1', to: 'blue_c1' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 2 — Making Room',
      prompt: 'Same move, new chamber — except the blue site already has something parked on it. Scan first, then connect, and watch what happens to the old tenant.',
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
    hint_text: 'Every scan reports a CHARGE number. These four are not equal — two of them are much stronger than the other two.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_extreme', to: 'blue_extreme' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 3 — Four Live Sites',
      prompt: 'Four sites are live and only one pairing is strong enough to fire. Scan them all before you commit.',
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
    hint_text: 'No new idea here. The whole stage is reading four numbers and picking two.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_extreme', to: 'blue_extreme' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 4 — Decoys',
      prompt: 'Four sites again, and two of them are decoys. You already know the rule — prove you can apply it.',
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
    hint_text: 'Strength decides nothing here: both blue sites scan the same. Look at the second number instead.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_nu', to: 'blue_open' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 5 — The Trap',
      prompt: 'Two blue sites, both starving, both exactly as strong as each other. Only one of them can actually be reached. Scan to find out which — spin the chamber if it helps.',
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
    hint_text: 'Do not trust position or brightness. Scan both blue sites and compare CLEARANCE.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_nu', to: 'blue_open' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 6 — Fenced In',
      prompt: 'Same trap, better disguised. This time the unreachable site is the one that looks most inviting.',
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
    hint_text: 'Two numbers decide this. CHARGE alone picks the giver; the taker has to win on CHARGE and CLEARANCE together.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_supreme', to: 'blue_accessible' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 7 — Six Sites, One Answer',
      prompt: 'Six live sites, and both rules you have worked out apply at once. Survey the whole chamber before you draw anything.',
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
    hint_text: 'One of the three has nothing worth giving and nothing worth taking. Its scan will read flat.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_base', to: 'blue_acid' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 8 — Three in the Chamber',
      prompt: 'Three molecules now, and one of them has nothing to do with this reaction. Scan around and find the odd one out.',
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
    hint_text: 'There is only one blue site, so the entire question is which red site wins the race to it.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_strong', to: 'blue_target' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 9 — The Race',
      prompt: 'Two givers, one prize, and they cannot both have it. Scan both and back the one that gets there first.',
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
    hint_text: 'Scan the large molecule on the right. Its CHARGE reading is low — it is not hungry enough to pull anything in.',
    hint_cost: 0,
    answer_json: JSON.stringify({ from: 'red_base', to: 'blue_proton' }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 10 — Warm-Up Act',
      prompt: 'The main target is too comfortable to react with anything yet. Something else has to happen first. Find the move that sets it up.',
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
    hint_text: 'Ask which of the two moves is even possible right now. One of them is not.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 11 — One In, One Out',
      prompt: 'Two arrows from here on, and the order is part of the answer. Scan all four sites, then work out which move cannot happen until the other one has.',
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
    hint_text: 'Find the double bar in the chamber. A double link can open up and dump its spare charge to one side — but only once it is pushed.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_o', expectedTo: 'blue_h' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 12 — The Double Link',
      prompt: 'Two atoms here are joined by a double bar. Something has to push before that bar can swing open. Two arrows.',
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
    hint_text: 'Scan the two blue sites. Each is a small piece loosely attached to a bigger molecule, ready to be pulled off.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_base1', expectedTo: 'blue_h1' }, { order: 2, expectedFrom: 'red_base2', expectedTo: 'blue_h2' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 13 — Passing It Along',
      prompt: 'A small piece has to travel across the chamber. It cannot jump the whole way — it moves one hop at a time. Two arrows.',
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
    hint_text: 'You have solved this shape before, in Stage 11. The molecule is different; the ordering question is identical.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 14 — Add, Then Drop',
      prompt: 'The center is already full, something new still has to get on, and something old has to come off. Two arrows, and only one order works.',
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
    hint_text: 'Compare the CHARGE of the giver on the left with the CHARGE of the center. The giver is not strong enough as things stand.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_o_carbonyl', expectedTo: 'blue_proton' }, { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_activated_c' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 15 — Wake It Up First',
      prompt: 'Scan the center of the big molecule before anything else. It is not hungry enough to pull anything in yet — so fix that. Two arrows.',
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
    hint_text: 'Scan the four sites and sort them: which is the newcomer arriving, and which is the piece on its way out?',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c' }, { order: 2, expectedFrom: 'red_ethoxide', expectedTo: 'blue_proton' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 16 — Cutting the Tail',
      prompt: 'A long tail hangs off this molecule and it is on its way out — but it will not let go until something takes its place. Two arrows.',
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
    hint_text: 'A ring of only three atoms forces its connections into a sharp corner. Everything in it is under tension.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c_ring' }, { order: 2, expectedFrom: 'red_o_ring', expectedTo: 'blue_proton' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 17 — Ring Opening',
      prompt: 'That three-cornered ring is bent far past comfortable and it is waiting for an excuse to snap open. Give it one. Two arrows.',
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
    hint_text: 'Scan the middle site. It is nearly neutral right now — which is exactly why it is worth a second look.',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_base', expectedTo: 'blue_h_alpha' }, { order: 2, expectedFrom: 'c_alpha', expectedTo: 'blue_target' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 18 — Domino',
      prompt: 'Nothing in this chamber is reactive enough to start on its own. One move has to create the site that makes the next move possible. Two arrows.',
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
    hint_text: 'Scan the center and read its CLEARANCE. Is there actually room for anything to move in right now?',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger' }, { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_carbocation' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 19 — Leave, Then Fill',
      prompt: 'Every chamber so far has been add-first, then drop. This one is the exception. Scan it and work out why it has to run the other way round.',
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
    hint_text: 'Start with the question you have asked nineteen times: what can actually react right now, and what needs waking up first?',
    hint_cost: 0,
    answer_json: JSON.stringify({ steps: [{ order: 1, expectedFrom: 'red_cat', expectedTo: 'blue_proton' }, { order: 2, expectedFrom: 'red_core', expectedTo: 'blue_c_scaffold' }] }),
    tolerance: 0,
    reveal_text: '',
    scene_config: JSON.stringify({
      title: 'Stage 20 — Grand Finish',
      prompt: 'Last chamber. Six sites, two arrows, and no new rules — everything you need you already worked out. Survey it and finish the run.',
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
