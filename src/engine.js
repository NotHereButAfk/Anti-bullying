/* After the Bell: deterministic narrative engine. No DOM or network dependencies. */
(function (root) {
  'use strict';
  const VERSION = 3;
  const OPTIONS = {
    role: ['target', 'bystander', 'former'],
    setting: ['city', 'suburb', 'town', 'academy'],
    culture: ['mixed', 'competitive', 'supportive'],
    interest: ['art', 'games', 'sports', 'music'],
    support: ['new', 'friend', 'sibling'],
    conflict: ['rumors', 'online', 'exclusion', 'intimidation'],
    personality: ['quiet', 'outgoing', 'creative', 'determined'],
    pronouns: ['they/them', 'she/her', 'he/him'],
    skin: ['light', 'medium', 'deep'],
    hair: ['short', 'curly', 'long'],
    outfit: ['teal', 'purple', 'amber']
  };
  const CAST = {
    morgan: { name: 'Morgan', role: 'Artist · observant, values privacy' },
    riley: { name: 'Riley', role: 'Classmate · wants influence, responsible for their choices' },
    sam: { name: 'Sam', role: 'Club organizer · enthusiastic, sometimes rushes ahead' },
    jules: { name: 'Jules', role: 'Classmate · cautious, notices more than they say' },
    chen: { name: 'Ms. Chen', role: 'Counselor · listens, coordinates follow-up' }
  };
  const copy = value => JSON.parse(JSON.stringify(value));
  const clamp = value => Math.max(0, Math.min(100, value));
  function normalizeProfile(input = {}) {
    const p = {};
    for (const [key, allowed] of Object.entries(OPTIONS)) {
      p[key] = allowed.includes(input[key]) ? input[key] : allowed[0];
    }
    p.name = String(input.name || 'Alex').trim().slice(0, 24) || 'Alex';
    p.school = String(input.school || 'Northbridge High').trim().slice(0, 45) || 'Northbridge High';
    const seed = Number(input.seed);
    p.seed = Number.isSafeInteger(seed) && seed >= 0 ? seed >>> 0 : 1701;
    return p;
  }
  function matches(state, condition) {
    if (!condition) return true;
    if (Array.isArray(condition)) return condition.every(c => matches(state, c));
    if (condition.any) return condition.any.some(c => matches(state, c));
    if (condition.not) return !matches(state, condition.not);
    if (condition.flag) return state.flags[condition.flag] === (condition.value ?? true);
    if (condition.profile) return state.profile[condition.profile] === condition.value;
    if (condition.relationship) return state.people[condition.relationship].trust >= condition.min;
    if (condition.memory) return state.people[condition.memory].memories.some(m => m.tag === condition.tag);
    if (condition.route) return state.route === condition.route;
    return false;
  }
  function target(state, next) {
    if (typeof next === 'string') return next;
    if (Array.isArray(next)) {
      const route = next.find(r => matches(state, r.when));
      if (route) return route.next;
    }
    throw new Error('Story route has no matching destination.');
  }
  function remember(state, who, tag, text) {
    const person = state.people[who];
    if (!person) throw new Error('Unknown character: ' + who);
    if (!person.memories.some(m => m.tag === tag)) {
      person.memories.push({ tag, text, step: state.step });
    }
  }
  function apply(state, effect = {}) {
    for (const [key, value] of Object.entries(effect.stats || {})) {
      if (!(key in state.stats) || !Number.isFinite(value)) throw new Error('Invalid statistic.');
      state.stats[key] = clamp(state.stats[key] + value);
    }
    Object.assign(state.flags, effect.flags || {});
    for (const [who, delta] of Object.entries(effect.relationships || {})) {
      state.people[who].trust = clamp(state.people[who].trust + delta);
    }
    for (const m of effect.memories || []) remember(state, m.who, m.tag, m.text);
    if (effect.route) state.route = effect.route;
    for (const event of effect.queue || []) {
      if (!state.queue.some(q => q.id === event.id) && !state.resolved.includes(event.id)) {
        state.queue.push({ ...copy(event), due: state.step + event.after });
      }
    }
    for (const fact of effect.facts || []) {
      if (!state.facts.includes(fact)) state.facts.push(fact);
    }
  }
  function resolveConsequences(state) {
    const due = state.queue.filter(q => q.due <= state.step);
    state.queue = state.queue.filter(q => q.due > state.step);
    for (const q of due) {
      state.resolved.push(q.id);
      const outcome = matches(state, q.when) ? q : q.otherwise;
      if (!outcome) continue;
      apply(state, outcome.effect);
      state.updates.push({ id: q.id, text: outcome.text, step: state.step });
    }
  }
  function enter(state, id, book) {
    if (!book.scenes[id]) throw new Error('Missing scene: ' + id);
    state.scene = id;
    if (!state.visited.includes(id)) {
      state.visited.push(id);
      apply(state, book.scenes[id].enter);
    }
    state.finished = !!book.scenes[id].ending;
  }
  function create(input, book) {
    const profile = normalizeProfile(input);
    const state = {
      version: VERSION, contentVersion: book.version, profile,
      scene: '', step: 0, finished: false, route: 'undecided',
      stats: { energy: 65, voice: 40 },
      people: {}, flags: {}, facts: [], history: [], visited: [],
      queue: [], resolved: [], updates: []
    };
    for (const id of Object.keys(CAST)) state.people[id] = { trust: 30, memories: [] };
    if (profile.support === 'friend') {
      state.people.morgan.trust = 55;
      remember(state, 'morgan', 'old_friend', 'You knew each other before this semester.');
    }
    if (profile.role === 'former') {
      state.flags.past_harm = true;
      state.people.morgan.trust = 15;
      remember(state, 'morgan', 'past_harm', 'You previously helped Riley circulate an embarrassing picture.');
    }
    if (profile.personality === 'determined') state.stats.voice += 10;
    if (profile.personality === 'quiet') state.stats.energy += 5;
    // Seed determines which classmate offers a small later opportunity, not who deserves help.
    state.flags.peer_sam = (Math.imul(profile.seed, 1664525) + 1013904223 >>> 0) % 2 === 0;
    enter(state, 'open_' + profile.setting, book);
    return state;
  }
  function available(state, book) {
    return (book.scenes[state.scene].choices || []).filter(c => matches(state, c.when));
  }
  function choose(previous, choiceId, book) {
    if (previous.finished) throw new Error('The story has ended.');
    const choice = available(previous, book).find(c => c.id === choiceId);
    if (!choice) throw new Error('This choice is not available.');
    const state = copy(previous);
    const from = state.scene;
    state.step += 1;
    apply(state, choice.effect);
    resolveConsequences(state);
    const destination = target(state, choice.next);
    state.history.push({ from, to: destination, choice: choiceId, label: choice.label,
      note: choice.note || choice.label, step: state.step });
    enter(state, destination, book);
    return state;
  }
  function interpolate(text, state) {
    const p = state.profile;
    const names = { name: p.name, school: p.school, subject: p.role === 'target' ? p.name : 'Morgan',
      interest: { art: 'art', games: 'game-making', sports: 'sports', music: 'music' }[p.interest],
      peer: state.flags.peer_sam ? 'Sam' : 'Jules',
      projectObject: { art: 'display labels', games: 'playtest screen', sports: 'practice stations', music: 'microphone arrangement' }[p.interest],
      pastime: { art: 'a sketch you want to finish', games: 'a game idea you want to try', sports: 'a practice plan you enjoy', music: 'a song you keep replaying' }[p.interest],
      projectAction: { art: 'studies the drawing', games: 'tries the game', sports: 'joins a practice station', music: 'listens to the first notes' }[p.interest] };
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => names[key] ?? '?');
  }
  function passages(state, book) {
    return book.scenes[state.scene].text.filter(p => matches(state, p.when))
      .map(p => ({ ...p, text: interpolate(p.text, state) }));
  }
  function epilogues(state) {
    return Object.entries(CAST).map(([id, person]) => {
      const memories = state.people[id].memories;
      const last = memories.at(-1);
      let detail = last ? last.text : 'Your paths crossed, but this relationship remained mostly unexplored.';
      if (id === 'morgan' && state.flags.apology) detail += ' An apology is a beginning, not an obligation to forgive.';
      if (id === 'chen' && state.flags.reported) detail += ' The agreed follow-up remains part of the school’s responsibility.';
      return { name: person.name, text: detail };
    });
  }
  function serialize(state) { return JSON.stringify({ format: 'after-the-bell', version: VERSION, state }); }
  function deserialize(raw, book) {
    if (typeof raw !== 'string' || raw.length > 500000) throw new Error('Save file is too large or unreadable.');
    let envelope;
    try { envelope = JSON.parse(raw); } catch { throw new Error('This is not a valid JSON save.'); }
    const s = envelope?.state;
    if (envelope?.format !== 'after-the-bell' || envelope.version !== VERSION || !s || s.version !== VERSION) {
      throw new Error('This save belongs to another version. Earlier stories remain available in the legacy edition.');
    }
    if (s.contentVersion !== book.version || !s.profile || !book.scenes[s.scene] ||
        !Number.isInteger(s.step) || s.step < 0 || s.step > 150 || !Array.isArray(s.history) ||
        s.history.length !== s.step || !Array.isArray(s.visited) || s.visited.length > 150) {
      throw new Error('Save structure is invalid or incompatible.');
    }
    if (JSON.stringify(normalizeProfile(s.profile)) !== JSON.stringify(s.profile)) throw new Error('Invalid character data.');
    // Replaying the bounded history validates all flags, memories, queued consequences and statistics.
    let replay = create(s.profile, book);
    for (const h of s.history) {
      if (!h || h.from !== replay.scene || typeof h.choice !== 'string') throw new Error('Invalid story history.');
      replay = choose(replay, h.choice, book);
    }
    if (JSON.stringify(replay) !== JSON.stringify(s)) throw new Error('Save data does not match its story history.');
    return replay;
  }
  function validateBook(book) {
    const errors = [];
    const destinations = next => typeof next === 'string' ? [next] : Array.isArray(next) ? next.map(r => r.next) : [];
    for (const [id, scene] of Object.entries(book.scenes)) {
      if (!scene.title || !scene.text?.length || !Number.isInteger(scene.chapter)) errors.push(id + ': missing content');
      if (!scene.ending && !scene.choices?.length) errors.push(id + ': dead end');
      const ids = new Set();
      for (const c of scene.choices || []) {
        if (ids.has(c.id)) errors.push(id + ': duplicate choice');
        ids.add(c.id);
        if (!destinations(c.next).length) errors.push(id + ': missing destination');
        for (const dest of destinations(c.next)) if (!book.scenes[dest]) errors.push(id + ': unknown ' + dest);
      }
    }
    return errors;
  }
  const api = { VERSION, OPTIONS, CAST, normalizeProfile, matches, create, choose, available,
    passages, interpolate, epilogues, serialize, deserialize, validateBook };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BellEngine = api;
})(globalThis);
