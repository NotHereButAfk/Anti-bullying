# After the Bell — Chapter Edition

A single-player, offline, choice-driven school story about bullying, belonging, boundaries, and accountability. This replaces the short shuffled-event prototype with an authored scene graph and character memory system.

## Play

Download or clone the complete repository, then open `index.html` in a modern browser. Keep `src/` and `stories/` beside it. No packages, account, API key, or real AI model are needed. If a browser restricts local files or storage, use the optional local server with Node 18 or newer:

```sh
npm start
```

Open `http://127.0.0.1:4173`. No `npm install` is required. There is no public deployment configured by this change.

## What is implemented

- 61 authored scenes across five chronological chapters, with 135 authored choices.
- Three perspectives: targeted student, bystander, or a student changing past harmful behavior.
- Four environment-specific openings and four distinct conflict arcs.
- Four club activities with different dialogue and decisions.
- Names, pronouns, personality, existing connections, custom school name, and a cosmetic portrait creator.
- Conditional routes, relationship-specific memories, delayed report follow-ups, and kept/missed promises.
- Six closing scenes plus individual epilogues for five characters.
- Journal, route history, one-choice rewind, keyboard controls, mobile layout, reading-size settings, and reduced-motion support.
- Autosave, three manual slots, validated JSON import/export, and a last-known-good backup.

One playthrough visits only some of the scenes. Paths can converge. This is **not** ten million unique written stories or unlimited AI generation. The seed currently changes one supporting invitation; most variation comes from character/world choices and decisions. Cosmetic appearance does not determine victimization, worth, or access to support.

## Previous version and saves

The exact previous `index.html` is preserved at `legacy/index.html` in the repository. Earlier local save keys are not overwritten. The creator can import an earlier character's settings, but it does not claim to migrate an incompatible old story position into the new graph. Browser storage belongs to the browser/profile/origin; moving between file URLs and a local server may change which saves are visible. Export JSON for portable backups.

## Controls

Use the mouse or Tab/Enter to make choices. Number keys select visible choices when focus is not in a form, button, or dialog. Save & load opens slots and import/export. Rewind restores the prior state including memories and pending consequences. People, Journal, and Path show only your current route. There are no timed choices or penalties for pausing.

## Project structure

```text
index.html                 Semantic game shell and character creator
src/engine.js              Pure deterministic state transitions and validation
src/app.js                 DOM presentation, accessible controls, save slots
src/styles.css             Responsive visual-novel layout and CSS illustration
stories/semester.js        Authored scenes, dialogue, choices, routes, consequences
tests/engine.test.js       Node regression tests and 5,000 complete simulations
tests/browser_smoke.py     Chromium DOM/UI smoke checks (optional Playwright)
tools/serve.js             Dependency-free local preview server
docs/AUTHORING.md          How to extend the narrative graph
docs/TEST_REPORT.md        What was actually tested and limitations
legacy/index.html          Previous playable edition, preserved unchanged
```

## Test

```sh
npm test
npm run check
```

Node's built-in runner is used; no production dependencies are installed. The optional browser smoke test requires Python Playwright and Chromium. See `docs/TEST_REPORT.md` for the distinction between injected DOM tests and unverified native storage/file navigation.

## Content and design boundaries

Fictional bullying, exclusion, online harassment, and non-graphic intimidation. No graphic violence, slurs, victim-blaming score, forced forgiveness, or requirement to confront someone alone. Support remains available without evidence or a confidence threshold. The game is not a clinical tool, legal guide, or promise about how every school responds.

No network requests are made by gameplay. Input is rendered with text nodes rather than interpreted as HTML. Names and story choices remain local. Avoid entering real classmates' private information.

## Known scope limits

This is a complete playable short chapter-based game, not a full school-life simulator. No custom map builder, voice acting, live NPC language model, multi-year timeline, or multiplayer. Some scenes reconverge and personality/culture have lighter effects than perspective, conflict, and chosen route. There has not been a cross-browser or accessibility-expert audit.
