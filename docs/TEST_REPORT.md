# Test report — Chapter Edition

## Content inventory

61 authored scenes, 135 authored choices, five chapters, six closing scenes, five relationship epilogues. The narration/dialogue corpus contains approximately 6,260 words before interpolation (excluding choice labels and code).

## Executed checks

- Node v22.16.0: all 11 `node:test` regression tests passed.
- `npm run check`: all three JavaScript syntax checks passed.
- 5,000 seeded simulated complete runs: all 61 scenes and all six endings were reached; 5,000 distinct observed choice histories; runs contained 14–18 choices. This is sampled coverage, not exhaustive enumeration of all states.
- Regression tests cover immutable choices, unavailable/post-ending commands, setting/perspective branches, cosmetic independence, kept/missed promises, help without evidence, duplicate follow-up prevention, consent correction, new accountability routes, save tampering, and deterministic reload/replay.
- Chromium via Python Playwright: actual DOM/scripts tested on a 1440×1050 viewport, plus 390×844 mobile with the largest reading size.
- Browser checks passed for creator, delayed consequences, rewind, manual slot restore, journal/path content, fresh-document resume, endings, stray keys after completion, JSON export/import, invalid import protection, all three perspective playthroughs, HTML-like input, unavailable-storage handling, and horizontal overflow.
- No uncaught JavaScript errors were observed in the tested browser sessions.

## Important environment limitations

This environment blocks normal browser navigation to local files and localhost by policy. Tests therefore injected the actual HTML/CSS/scripts into a Chromium document and provided an in-memory implementation of the Storage interface. Fresh-document restore reused that stored data. **Native browser storage persistence, file:// loading, and full HTTP end-to-end navigation were not verified.** The local server was started, and JavaScript syntax was checked, but that is not a substitute for navigation testing.

Browser smoke tests and their limitations are reproducible in `tests/browser_smoke.py`. They require optional development tools (Python Playwright and Chromium); the game does not.

No test was run on the owner's Surface laptop, no cross-browser test was performed, and no accessibility-expert or sensitivity-reader review is claimed. All current accessibility behavior still deserves human testing.

## Visual inspection

Creator and story screenshots were inspected at desktop size. Text, choice controls, chapter rail, avatar, and notebook were visible and unclipped. A mobile screenshot was captured after the no-horizontal-overflow assertion. No custom external font or image assets are required.

## Safe publishing

The earlier `index.html` is preserved by its existing Git blob under `legacy/index.html`. New saves use a separate v3 key and do not rewrite v1/v2 saves. The character importer copies settings only. A current-head lease should be used when updating main so concurrent changes are not overwritten.
