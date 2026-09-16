/**
 * End-to-end smoke test of the API surface a new student touches:
 * bootstrap → register → team → quest grade (incl. replay) → complete → leaderboard.
 * Runs the real serverless handler with fake req/res objects.
 */
import handler from '../api/[...route].js';

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
const team = await call('player/create', { token, teamId: 'fire', avatar: { visor: 'gold' } });
check('claims team', team.json.ok === true && team.json.data.team.team_id === 'fire');
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
check('level derived', me.json.data.level === Math.max(1, Math.floor(Math.sqrt(me.json.data.xp / 45)) + 1));

const renamed = await call('player/rename', { token, displayName: 'Nova Prime' });
check('rename works', renamed.json.data.player.display_name === 'Nova Prime');

console.log('\ncompletion');
const comp = await call('quest/complete', { token, questId: 'q1' });
check('epilogue present', typeof comp.json.data.epilogue === 'string' && comp.json.data.epilogue.length > 200);
check('epilogue has paragraphs', comp.json.data.epilogue.includes('\n'));
check('quest xp is 650', comp.json.data.totalXp === 650, `got ${comp.json.data.totalXp}`);
check('level is a number', Number.isFinite(comp.json.data.newLevel));

console.log('\nmanifest + leaderboard');
const man = await call('quest/manifest', { questId: 'q1' });
check('manifest has 20 stages', man.json.data.stages.length === 20);
check('manifest base xp matches', man.json.data.quest.base_xp === 650);
const stageXpSum = man.json.data.stages.reduce((s, x) => s + x.xp, 0);
check('stage xp sums to base xp', stageXpSum === 650, `sum=${stageXpSum}`);
const lb = await call('leaderboard', {});
check('leaderboard returns teams + players', lb.json.data.teams.length === 4 && lb.json.data.individual.length > 0);

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
