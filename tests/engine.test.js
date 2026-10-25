'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/engine.js');
const B = require('../stories/semester.js');
const act = (s, id) => E.choose(s, id, B);
function play(profile, ids) {
  let s = E.create(profile, B);
  for (const id of ids) s = act(s, id);
  return s;
}
function generator(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
const communityPath = ['help', 'morgan', 'listen', 'write', 'check', 'record', 'pause', 'company', 'club', 'consent', 'promise'];
const base = { name: 'Alex', role: 'target', setting: 'city', support: 'new', conflict: 'rumors', interest: 'art', seed: 13 };

test('Content contains 61 real scenes, five chapters and six closing scenes', () => {
  assert.equal(Object.keys(B.scenes).length, 61);
  assert.equal(Object.values(B.scenes).filter(s => s.ending).length, 6);
  assert.equal(B.chapters.length, 5);
  assert.deepEqual(E.validateBook(B), []);
  for (const scene of Object.values(B.scenes)) {
    const words = scene.text.map(p => p.text).join(' ').split(/\s+/).length;
    assert.ok(words >= 45, scene.title + ' has too little authored text');
  }
});

test('Different environments and perspectives enter genuinely different scenes', () => {
  for (const setting of E.OPTIONS.setting) {
    for (const role of E.OPTIONS.role) {
      let s = E.create({ setting, role }, B);
      assert.equal(s.scene, 'open_' + setting);
      s = act(s, E.available(s, B)[0].id);
      assert.equal(s.scene, { target: 'target_intro', bystander: 'witness_intro', former: 'repair_intro' }[role]);
    }
  }
});

test('Cosmetics and pronouns never change initial relationships or harm eligibility', () => {
  const a = E.create({ ...base, skin: 'light', pronouns: 'he/him' }, B);
  const b = E.create({ ...base, skin: 'deep', pronouns: 'she/her', outfit: 'purple' }, B);
  assert.deepEqual(a.people, b.people);
  assert.deepEqual(a.flags, b.flags);
  assert.deepEqual(E.available(a, B), E.available(b, B));
});

test('Choices are immutable; illegal choices and post-ending choices are rejected', () => {
  const s = E.create(base, B);
  const before = E.serialize(s);
  act(s, 'help');
  assert.equal(E.serialize(s), before);
  assert.throws(() => act(s, 'invented-choice'));
  let current = s;
  while (!current.finished) current = act(current, E.available(current, B)[0].id);
  assert.throws(() => act(current, 'anything'));
});

test('A kept promise triggers a different scene and memory from a missed promise', () => {
  const before = play(base, communityPath);
  assert.equal(before.scene, 'c3_followup');
  assert.equal(before.queue[0].id, 'promise_result');
  const kept = act(before, 'keep');
  const missed = act(before, 'continue');
  assert.equal(kept.scene, 'c4_kept');
  assert.equal(missed.scene, 'c4_missed');
  const keptLater = act(kept, 'continue');
  const missedLater = act(missed, 'repair');
  assert.equal(keptLater.flags.reliable, true);
  assert.equal(missedLater.flags.missed_promise, true);
  assert.notEqual(keptLater.people.morgan.trust, missedLater.people.morgan.trust);
  assert.equal(keptLater.resolved.filter(x => x === 'promise_result').length, 1);
  assert.equal(E.deserialize(E.serialize(kept), B).resolved.length, kept.resolved.length);
});

test('Support is available without evidence, friendship, or confidence thresholds', () => {
  let s = play(base, ['help', 'adult', 'listen', 'rest', 'support']);
  assert.equal(s.scene, 'c2_report');
  assert.equal(s.flags.documented, undefined);
  s = act(s, 'plan');
  assert.equal(s.flags.reported, true);
  assert.equal(s.scene, 'c2_crossroads');
  assert.ok(E.available(s, B).some(c => c.id === 'support'));
  s = act(s, 'support');
  s = act(s, 'review');
  assert.equal(s.flags.followup_ready, true);
  assert.equal(s.resolved.filter(x => x === 'adult_followup').length, 1);
});

test('Consent can be corrected; correction does not erase a remembered breach', () => {
  let s = play(base, communityPath.slice(0, -2));
  assert.equal(s.scene, 'club_art');
  s = act(s, 'rush');
  s = act(s, 'rush');
  assert.equal(s.flags.published_early, true);
  s = act(s, 'continue');
  s = act(s, 'check');
  assert.equal(s.flags.consent_issue, false);
  assert.ok(s.people.morgan.memories.some(m => m.tag === 'published'));
});

test('New harmful actions unlock accountability even for a bystander', () => {
  let s = play({ ...base, role: 'bystander' }, ['help', 'morgan', 'listen', 'rest', 'repeat', 'delay', 'alone']);
  assert.equal(s.scene, 'c2_crossroads');
  assert.equal(s.flags.harm, true);
  assert.ok(E.available(s, B).some(c => c.id === 'repair'));
});

test('Save replay validates memories, queues, profile, history and statistics', () => {
  const s = play(base, communityPath);
  assert.deepEqual(E.deserialize(E.serialize(s), B), s);
  const changes = [
    t => { t.state.stats.energy = 999; },
    t => { t.state.flags.invented = true; },
    t => { t.state.queue[0].due = -1; },
    t => { t.state.people.morgan.memories = []; },
    t => { t.state.profile.role = 'invented'; },
    t => { t.state.history[0].choice = 'invented'; },
    t => { t.state.scene = 'not-real'; },
    t => { t.state.history.push(null); },
    t => { t.version = 2; }
  ];
  for (const mutate of changes) {
    const envelope = JSON.parse(E.serialize(s)); mutate(envelope);
    assert.throws(() => E.deserialize(JSON.stringify(envelope), B));
  }
  assert.throws(() => E.deserialize('not-json', B));
  assert.throws(() => E.deserialize('x'.repeat(500001), B));
});

test('Same setup and choices reproduce the same route; reload never rerolls anything', () => {
  const a = play(base, communityPath);
  const b = play(base, communityPath);
  assert.deepEqual(a, b);
  assert.deepEqual(act(E.deserialize(E.serialize(a), B), 'keep'), act(b, 'keep'));
});

test('All scenes and endings are reachable across 5000 seeded complete playthroughs', () => {
  const random = generator(20261025);
  const seen = new Set();
  const endings = new Set();
  const signatures = new Set();
  let min = Infinity;
  let max = 0;
  for (let run = 0; run < 5000; run++) {
    const profile = { name: 'Test student', seed: run };
    for (const [key, values] of Object.entries(E.OPTIONS)) profile[key] = values[Math.floor(random() * values.length)];
    let s = E.create(profile, B);
    while (!s.finished) {
      seen.add(s.scene);
      const choices = E.available(s, B);
      assert.ok(choices.length, 'Dead end: ' + s.scene);
      assert.ok(s.step < 40, 'Loop: ' + s.scene);
      s = act(s, choices[Math.floor(random() * choices.length)].id);
      assert.ok(Object.values(s.stats).every(n => Number.isFinite(n) && n >= 0 && n <= 100));
    }
    seen.add(s.scene); endings.add(s.scene);
    min = Math.min(min, s.step); max = Math.max(max, s.step);
    signatures.add(s.history.map(h => h.from + ':' + h.choice).join('|'));
    if (run % 100 === 0) assert.deepEqual(E.deserialize(E.serialize(s), B), s);
  }
  assert.deepEqual(Object.keys(B.scenes).filter(id => !seen.has(id)), [], 'Unreachable authored content');
  assert.equal(endings.size, 6);
  console.log(JSON.stringify({ simulations: 5000, reachedScenes: seen.size, endings: endings.size,
    distinctObservedChoicePaths: signatures.size, shortestChoices: min, longestChoices: max }));
});
