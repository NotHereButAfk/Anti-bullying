# Extending the story

## Keep content separate from the engine

Add original scenes in `stories/semester.js`. Do not duplicate state calculations in UI event handlers. A scene has a stable ID, chapter number, title, place, text passages, choices, and optionally `ending: true`.

The helper `p(text, when)` creates narration. `d(speaker, text, when)` creates dialogue. `c(id, label, next, effect, when, note)` creates a choice. `add(id, chapter, title, place, text, choices, extra)` registers a scene. Conditions are optional; a condition array means every condition must match.

## Conditions

```js
{ flag: 'reported' }
{ not: { flag: 'reported' } }
{ profile: 'role', value: 'target' }
{ relationship: 'morgan', min: 45 }
{ memory: 'morgan', tag: 'listened' }
{ route: 'community' }
{ any: [{ flag: 'harm' }, { profile: 'role', value: 'former' }] }
```

Do not gate essential help behind a friendship or confidence score. A relationship threshold can change whether a private conversation is welcome, but it must not imply that anybody owes access or forgiveness.

`next` may be a scene ID or an ordered list of `{when, next}` entries. Include an unconditional fallback when appropriate. Every reachable non-ending must have an available choice.

## Effects

Use flags for explicit facts, relationships for bounded affinity, and tagged memories for things a specific person actually experienced. A memory tag is recorded at most once per character.

```js
{
  flags: { promised: true },
  relationships: { morgan: 5 },
  memories: [{ who: 'morgan', tag: 'promise', text: 'You promised a private check-in.' }],
  facts: ['A review date was agreed.'],
  queue: [{
    id: 'unique_followup', after: 2,
    when: { flag: 'promise_kept' },
    text: 'Your earlier commitment returns.',
    effect: { flags: { reliable: true } },
    otherwise: {
      text: 'The missed commitment was noticed.',
      effect: { flags: { missed_promise: true } }
    }
  }]
}
```

A queued event is scheduled relative to the choice that creates it. `after: 2` resolves after two additional decisions. Resolved IDs prevent duplicate application. Conditions are evaluated when due, not when scheduled. Rewind reconstructs the entire route from the initial profile, so it also reverses scheduled/resolved consequences.

## Personalized text

Supported placeholders include `{{name}}`, `{{school}}`, `{{subject}}`, `{{interest}}`, `{{peer}}`, `{{projectObject}}`, `{{pastime}}`, and `{{projectAction}}`. Use role-specific conditional passages when the target/bystander grammar or situation changes substantially. Do not pretend a player attended a scene their route skipped.

## Save compatibility

The envelope is version 3 and the current book is `semester-1.0`. Loading replays a bounded choice history and compares the resulting state, validating memories and pending consequences as well as the visible scene. This is consistency checking, not anti-cheat security.

Content changes that alter state transitions can invalidate old saves. Bump `contentVersion`, implement a deliberate migration, or preserve a compatible edition. Never silently discard a user's valid save. Keep former editions' storage keys separate.

## Editorial checks

Give characters interests beyond the incident. Let the affected student choose company, privacy, and distance. Do not make a public speech the only successful path. Explain adult responsibilities instead of implying students must solve everything. Never reward escalating harassment as a hidden optimal route. Acknowledge repair without granting automatic forgiveness.

After adding a scene, run `npm test` and extend coverage rather than just increasing the scene-count assertion. Review all entry contexts, dates, pronouns, evidence references, and callbacks manually. Random playthrough testing does not prove every possible state combination is consistent.
