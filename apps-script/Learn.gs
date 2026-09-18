/**
 * Learn.gs — Learn-track progress for Avalon.
 *
 * The Learn track is the study road: nine worlds, one per course unit, each made
 * of quests that are games. It is deliberately walled off from the competition:
 *
 *   - Rows are written to the LearnProgress tab ONLY. Nothing here writes to
 *     Submissions or Progress, which are the two tabs Scoring.computePlayerTotalXp
 *     reads, so no amount of studying can move a player up the leaderboard.
 *   - No function in this file returns an xp field, and none may be added. If the
 *     Learn track ever paid XP it would become the fastest way to farm Standings,
 *     and a slower student would be punished for reading carefully.
 *
 * One row per player per quest. `stages` is a comma-separated list of cleared
 * stage indices; `completed_at` is set once and never cleared.
 */

var Learn = {

  /** Every learn row for one player. */
  getProgress: function(playerId) {
    var rows = Db.find('LearnProgress', function(r) { return r.player_id === playerId; });
    return {
      learn: rows.map(function(r) {
        return {
          world_id: r.world_id,
          quest_id: r.quest_id,
          stages: String(r.stages || '').split(',').filter(function(s) { return s !== ''; }).map(Number),
          completed_at: r.completed_at || null
        };
      })
    };
  },

  _row: function(playerId, worldId, questId) {
    return Db.findOne('LearnProgress', function(r) {
      return r.player_id === playerId && r.world_id === worldId && r.quest_id === questId;
    });
  },

  /** Record one cleared stage. Idempotent, and worth nothing. */
  recordStage: function(playerId, worldId, questId, stageIndex) {
    if (!worldId || !questId) throw { code: 'BAD_REQUEST', message: 'worldId and questId are required.' };
    var idx = Number(stageIndex);
    if (!isFinite(idx) || idx < 0) throw { code: 'BAD_REQUEST', message: 'stageIndex must be a non-negative number.' };

    var now = new Date().toISOString();
    var row = this._row(playerId, worldId, questId);

    if (!row) {
      Db.append('LearnProgress', {
        player_id: playerId,
        world_id: worldId,
        quest_id: questId,
        stages: String(idx),
        completed_at: '',
        updated_at: now
      });
      return { world_id: worldId, quest_id: questId, stages: [idx] };
    }

    var stages = String(row.stages || '').split(',').filter(function(s) { return s !== ''; });
    if (stages.indexOf(String(idx)) === -1) stages.push(String(idx));

    Db.update('LearnProgress',
      function(r) { return r.player_id === playerId && r.world_id === worldId && r.quest_id === questId; },
      { stages: stages.join(','), updated_at: now }
    );

    return { world_id: worldId, quest_id: questId, stages: stages.map(Number) };
  },

  /**
   * Mark a quest finished. Idempotent — a replay reopens nothing and mints
   * nothing, exactly like Quests.completeQuest, except that there was never an
   * award to mint in the first place.
   */
  completeQuest: function(playerId, worldId, questId) {
    if (!worldId || !questId) throw { code: 'BAD_REQUEST', message: 'worldId and questId are required.' };

    var now = new Date().toISOString();
    var row = this._row(playerId, worldId, questId);

    if (!row) {
      Db.append('LearnProgress', {
        player_id: playerId,
        world_id: worldId,
        quest_id: questId,
        stages: '',
        completed_at: now,
        updated_at: now
      });
      return { world_id: worldId, quest_id: questId, alreadyCompleted: false, completed_at: now };
    }

    if (row.completed_at) {
      return { world_id: worldId, quest_id: questId, alreadyCompleted: true, completed_at: row.completed_at };
    }

    Db.update('LearnProgress',
      function(r) { return r.player_id === playerId && r.world_id === worldId && r.quest_id === questId; },
      { completed_at: now, updated_at: now }
    );

    return { world_id: worldId, quest_id: questId, alreadyCompleted: false, completed_at: now };
  }
};
