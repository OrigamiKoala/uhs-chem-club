/**
 * End-to-end smoke test of the API surface a new student touches:
 * bootstrap → register → team → quest grade (incl. replay) → complete → leaderboard.
 * Runs the real serverless handler with fake req/res objects.
 */
import handler from '../api/[...route].js';
import { levelForXp } from '../src/progression/levels.js';

function call(path, body) {
  return new Promise((resolve) => {
    let status = 200;
    const chunks = [];
    const req = {
      method: 'POST',
      url: `/api/${path}`,
      body,
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    };
    const res = {
      setHeader() {},
      get statusCode() { return status; },
      set statusCode(v) { status = v; },
      end(data) {
        chunks.push(data);
        resolve({ status, json: JSON.parse(chunks.join('')) });
      }
    };
    handler(req, res);
  });
}

let failures = 0;
function check(name, cond, extra = '') {
  if (cond) console.log(`  ok   ${name}`);
  else { console.log(`  FAIL ${name} ${extra}`); failures++; }
}

const boot = await call('bootstrap', {});
console.log('bootstrap');
check('returns config', !!boot.json.data.config);
check('four teams', boot.json.data.teams.length === 4, JSON.stringify(boot.json.data.teams.map(t => t.team_id)));
check('20 stages', boot.json.data.activeQuest.stages.length === 20);
check('no player when anonymous', boot.json.data.player === null);

console.log('\nregister');
const badPw = await call('auth/register', { email: 'a@b.com', password: 'short', displayName: 'Tester' });
check('rejects short password', badPw.json.ok === false && badPw.json.error.code === 'PASSWORD_TOO_SHORT');

const reg = await call('auth/register', { email: 'student@example.com', password: 'correct-horse', displayName: 'AstraNova' });
check('creates account', reg.json.ok === true, JSON.stringify(reg.json));
const token = reg.json.data.token;
check('issues token', !!token);
check('starts with no team', !reg.json.data.player.team_id);

console.log('\nlogin');
const badLogin = await call('auth/login', { identifier: 'student@example.com', password: 'wrong-password' });
check('rejects wrong password', badLogin.json.ok === false && badLogin.status === 401);
const login = await call('auth/login', { identifier: 'AstraNova', password: 'correct-horse' });
check('accepts display name + password', login.json.ok === true, JSON.stringify(login.json.error || {}));
check('returns salt for caching', !!login.json.data.salt);
const cached = await call('auth/login', { identifier: 'AstraNova', password: 'correct-horse', cachedSalt: login.json.data.salt });
check('cached-salt login works', cached.json.ok === true);

console.log('\nteam selection');
const team = await call('player/create', {
  token,
  teamId: 'fire',
  avatar: { visor: 'gold' },
  background: 'salvager',
  trinket: 'trinket_1'
});
check('claims team', team.json.ok === true && team.json.data.team.team_id === 'fire');
check('saves background', team.json.data.player.background === 'salvager');
check('saves trinket', team.json.data.player.trinket === 'trinket_1');
check('cosmetic background and trinket grant zero xp', team.json.data.xp === 0);

const roster = await call('team/roster', { teamId: 'fire' });
check('returns team roster with trinkets', Array.isArray(roster.json.data.members) && roster.json.data.members.some(m => m.display_name === 'AstraNova' && m.trinket === 'trinket_1'));

const legacy = await call('player/create', { token, teamId: 'ignis' });
check('legacy alias normalizes to fire', legacy.json.data.team.team_id === 'fire');

console.log('\nbootstrap as signed-in player');
const boot2 = await call('bootstrap', { token });
check('player attached', !!boot2.json.data.player);
check('not admin by default', boot2.json.data.player.isAdmin === false);

console.log('\nquest grading');
const wrong = await call('quest/grade', { token, questId: 'q1', stageIndex: 0, payload: { from: 'blue_c1', to: 'red_lp1' } });
check('wrong arrow is not correct', wrong.json.data.correct === false && wrong.json.data.xpAwarded === 0);

const right = await call('quest/grade', { token, questId: 'q1', stageIndex: 0, payload: { from: 'red_lp1', to: 'blue_c1' } });
check('correct arrow awards 15 XP', right.json.data.correct === true && right.json.data.xpAwarded === 15,
  JSON.stringify(right.json.data));

const replay = await call('quest/grade', { token, questId: 'q1', stageIndex: 0, payload: { from: 'red_lp1', to: 'blue_c1' } });
check('replay awards 0 XP', replay.json.data.correct === true && replay.json.data.xpAwarded === 0,
  JSON.stringify(replay.json.data));

const blocked = await call('quest/grade', { token, questId: 'q1', stageIndex: 4, payload: { from: 'red_nu', to: 'blue_blocked' } });
check('blocked target flagged', blocked.json.data.blocked === true);

const multi = await call('quest/grade', {
  token, questId: 'q1', stageIndex: 10,
  payload: { arrows: [
    { from: 'red_nu', to: 'blue_c', order: 1 },
    { from: 'red_cl', to: 'blue_scavenger', order: 2 }
  ] }
});
check('multi-arrow in order is correct', multi.json.data.correct === true, JSON.stringify(multi.json.data));

const multiBad = await call('quest/grade', {
  token, questId: 'q1', stageIndex: 11,
  payload: { arrows: [{ from: 'red_nu', to: 'blue_c', order: 1 }] }
});
check('missing arrow is not correct', multiBad.json.data.correct === false);

console.log('\nprofile & progress');
const me = await call('player/me', { token });
check('me returns team', me.json.data.team.team_id === 'fire');
check('me returns progress', Array.isArray(me.json.data.progress) && me.json.data.progress.length > 0);
check("xp banked once", me.json.data.xp === 15 + 35, `xp=${me.json.data.xp}`);
check('level derived', me.json.data.level === levelForXp(me.json.data.xp));

const renamed = await call('player/rename', { token, displayName: 'Nova Prime' });
check('rename works', renamed.json.data.player.display_name === 'Nova Prime');

console.log('\ncompletion');
const comp = await call('quest/complete', { token, questId: 'q1' });
check('epilogue present', typeof comp.json.data.epilogue === 'string' && comp.json.data.epilogue.length > 200);
check('epilogue has paragraphs', comp.json.data.epilogue.includes('\n'));
check('quest xp is 715', comp.json.data.totalXp === 715, `got ${comp.json.data.totalXp}`);
check('level is a number', Number.isFinite(comp.json.data.newLevel));
check('first completion is not flagged as a repeat', comp.json.data.alreadyCompleted === false);

// Redoing a finished quest: progress stands, the award is not minted twice, and no
// stage pays out again.
const comp2 = await call('quest/complete', { token, questId: 'q1' });
check('re-completion is idempotent', comp2.json.data.alreadyCompleted === true);

// The baseline is taken *after* completion, not before it: completing a quest
// legitimately pays the 40 + 25 bonus, so comparing across that boundary would
// assert the total must not move for a reason that has nothing to do with replay.
const meCompleted = await call('player/me', { token });
check('completion bonus is banked', meCompleted.json.data.xp === me.json.data.xp + 65,
  `before=${me.json.data.xp} after=${meCompleted.json.data.xp}`);

const afterComplete = await call('quest/grade', {
  token, questId: 'q1', stageIndex: 0, payload: { from: 'red_lp1', to: 'blue_c1' }
});
check('replay after completion awards 0 XP',
  afterComplete.json.data.correct === true && afterComplete.json.data.xpAwarded === 0,
  JSON.stringify(afterComplete.json.data));

const meAfter = await call('player/me', { token });
check('xp unchanged by replay', meAfter.json.data.xp === meCompleted.json.data.xp,
  `before=${meCompleted.json.data.xp} after=${meAfter.json.data.xp}`);
const progAfter = (meAfter.json.data.progress || []).find(x => x.quest_id === 'q1');
check('progress does not regress', progAfter && progAfter.stage_reached === 20,
  JSON.stringify(progAfter));
check('completion timestamp kept', Boolean(progAfter && progAfter.completed_at));

// The Learn track: progress is recorded, and none of it touches XP. This is the
// check that keeps the study road out of the competition.
console.log('\nlearn track');
const xpBeforeLearn = meAfter.json.data.xp;

const lp0 = await call('learn/progress', { token });
check('learn progress starts empty', Array.isArray(lp0.json.data.learn) && lp0.json.data.learn.length === 0);

const ls1 = await call('learn/stage', { token, worldId: 'unit01', questId: 'q1-counting', stageIndex: 0 });
check('records a cleared stage', ls1.json.data.stages.includes(0), JSON.stringify(ls1.json.data));
check('learn/stage returns no xp field', !('xpAwarded' in ls1.json.data) && !('xp' in ls1.json.data));

await call('learn/stage', { token, worldId: 'unit01', questId: 'q1-counting', stageIndex: 1 });
const lsDup = await call('learn/stage', { token, worldId: 'unit01', questId: 'q1-counting', stageIndex: 1 });
check('re-clearing a stage does not duplicate it', lsDup.json.data.stages.length === 2, JSON.stringify(lsDup.json.data));

const lc1 = await call('learn/complete', { token, worldId: 'unit01', questId: 'q1-counting' });
check('first learn completion is not a repeat', lc1.json.data.alreadyCompleted === false);
const lc2 = await call('learn/complete', { token, worldId: 'unit01', questId: 'q1-counting' });
check('learn completion is idempotent', lc2.json.data.alreadyCompleted === true);
check('learn/complete returns no xp field', !('totalXp' in lc2.json.data) && !('xpAwarded' in lc2.json.data));

const meLearn = await call('player/me', { token });
check('learn activity pays no XP', meLearn.json.data.xp === xpBeforeLearn,
  `before=${xpBeforeLearn} after=${meLearn.json.data.xp}`);
check('learn rows stay out of quest progress',
  !(meLearn.json.data.progress || []).some(p => String(p.quest_id).startsWith('unit01')),
  JSON.stringify(meLearn.json.data.progress));
check('learn rows ride along on player/me',
  (meLearn.json.data.learn || []).some(r => r.quest_id === 'q1-counting'),
  JSON.stringify(meLearn.json.data.learn));

const lpAfter = await call('learn/progress', { token });
check('learn progress reads back', lpAfter.json.data.learn.length === 1);

const lpBad = await call('learn/stage', { token, worldId: '', questId: '', stageIndex: 0 });
check('learn/stage rejects a missing quest', lpBad.json.ok === false);

console.log('\nmanifest + leaderboard');
const man = await call('quest/manifest', { questId: 'q1' });
check('manifest has 20 stages', man.json.data.stages.length === 20);
check('manifest base xp matches', man.json.data.quest.base_xp === 650);
const stageXpSum = man.json.data.stages.reduce((s, x) => s + x.xp, 0);
check('stage xp sums to base xp', stageXpSum === 650, `sum=${stageXpSum}`);
const lb = await call('leaderboard', {});
check('leaderboard returns teams + players', lb.json.data.teams.length === 4 && lb.json.data.individual.length > 0);

// XP must actually reach the standings. A leaderboard that ignores what a player
// earned is the failure mode this suite exists to catch: the backend used to
// filter correct submissions with `correct === 'TRUE'` while Sheets stored a
// boolean, so every total read as zero and no guild score ever moved.
const meFinal = await call('player/me', { token });
const myRow = lb.json.data.individual.find(r => r.display_name === meFinal.json.data.player.display_name);
check('the player appears on the individual board', Boolean(myRow),
  JSON.stringify(lb.json.data.individual));
check('board XP matches player/me', myRow && myRow.xp === meFinal.json.data.xp,
  `board=${myRow && myRow.xp} me=${meFinal.json.data.xp}`);
check('earned XP is not zero', myRow && myRow.xp > 0, `xp=${myRow && myRow.xp}`);

const myTeam = lb.json.data.teams.find(t => t.team_id === 'fire');
check('the guild counts the player as active', myTeam && myTeam.active_members >= 1,
  JSON.stringify(myTeam));
check('the guild score moves with member XP', myTeam && myTeam.team_score > 0,
  JSON.stringify(myTeam));

console.log('\nprogression & loadout');
const progMe = await call('progression/me', { token });
check('progression/me returns ok', progMe.json.ok === true && Number.isFinite(progMe.json.data.level));

const loadoutResp = await call('loadout/set', { token, nameplate: 'brass', title: 'Voyager', pinnedPlates: ['clean_run_01'] });
check('loadout/set saves loadout', loadoutResp.json.ok === true && loadoutResp.json.data.loadout.nameplate === 'brass');

const profileResp = await call('profile/get', { token, playerId: meFinal.json.data.player.player_id });
check('profile/get returns public profile', profileResp.json.ok === true && profileResp.json.data.nameplate === 'brass');
check('profile/get includes title and pinned plates', profileResp.json.data.title === 'Voyager' && profileResp.json.data.pinned_plates.includes('clean_run_01'));

const guildFeedResp = await call('guild/feed', { token, teamId: 'fire' });
check('guild/feed returns events', guildFeedResp.json.ok === true && Array.isArray(guildFeedResp.json.data.events));

const lbGuild = await call('leaderboard', { token, scope: 'guild' });
check('leaderboard scope guild filters correctly', lbGuild.json.ok === true && lbGuild.json.data.individual.every(r => r.team_id === 'fire'));

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
