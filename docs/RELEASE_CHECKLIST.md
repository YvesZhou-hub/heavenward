# Human Realm release checklist

This is an independent-gate checklist, not a score. Current project version is 0.1.0. A checked implementation item does not label the complete product commercial-ready. Evidence must describe the exact build, environment and test type; after changes, rerun the affected checks. Test states are PASS, FAIL, BLOCKED or NOT RUN.

## A. Gameplay and content

- [x] Both authoritative documents are preserved; `REQUIREMENT_MATRIX.md` covers all 47 design sections and 22 master requirements with normal access, implementation and evidence.
- [x] All five Human realms/four stages, 13 Paths, seven Road node types, four breakthrough opportunities and final Ascension exist in the ordinary rules.
- [x] The pool has 102 permanent designs and one combat Token; grades and translations are not counted as separate designs.
- [x] Ordinary-rule headless acquisition/Ascension evidence exists in `PACING_QA.md` and bot artifacts, separate from controlled victory fixtures.
- [ ] Resolve the commercial card-count planning target from an actual source; neither preserved brief supplies the earlier numeric target.
- [ ] Complete representative ordinary human runs and tune pacing, economy, difficulty and archetype choices. Twenty bot wins with zero losses is disclosed, not a balanced-release certificate.
- [ ] Verify complete source-system use through legitimate gameplay, including advanced synergies, optional node choices, Divine-free play and final terminal persistence.

## B. Rules, persistence and reproduction

- [x] Source worked examples and core edge cases have automated coverage: Pierce hit-by-hit, FLOOR, Qi decay, overflow, Active Discard, Tidal, summons/Intercept, Self-Harm/Link, Retain, temporary grades and special bosses.
- [x] Save validation, queued choices, reward ownership, terminal markers, corruption recovery and stale revisions have test coverage.
- [x] Current-version combat replay validates original configuration/actions, reproduces the complete final state and rejects version mismatch; a real card/choice/turn test exists.
- [x] Attach the final post-change results for `npm run typecheck`, `npm run lint`, `npm run validate:content`, `npm test` and `npm run build`. Final92-test PASS and54 production browser passes are recorded in `QA_EVIDENCE.md` and machine-readable artifacts.
- [x] Attach final browser save/resume, multiple-tab, storage-failure and terminal-state evidence. Memory-storage and simulated-lock tests are labeled simulations.
- [ ] Resolve or document supported-browser behavior without Web Locks; optimistic revision checking alone is not a cross-tab atomic guarantee.
- [ ] Publish version compatibility and migration behavior before changing a shipped save schema. Current incompatible versions are rejected; no prior-schema migration is claimed.
- [x] Verify diagnostic exports contain seed, RNG, content/rules versions, snapshot and actions; distinguish current-version reproduction from unsupported cross-version replay.

## C. Art, interaction and audiovisual quality

- [x] Production asset manifest is `draft: false`; 127 mapped images cover 103 cards, 18 enemies, five summons and the player. All output paths were present in the static import check.
- [x] Original source records, exact card order, repair provenance, dimensions/crops and hashes are registered. Old shared Path/category art is a benchmark, not the final card identity mapping.
- [x] Artwork and EN/ZH gameplay layers remain separate. No confirmed named image model is claimed: built-in tool model identity was not exposed.
- [x] Deck/pile Path-search filters and resolved multi-hit target previews are implemented.
- [ ] Link final integrated screenshots/recordings for the exact release build and inspect each primary surface at actual size. The lead's ongoing reviews must be recorded separately from this checklist.
- [ ] Confirm readable targets/Intents/costs, ten-card focus/inspection, upgrade comparisons, sale/replacement consequences and no clipped essential actions.
- [ ] Finish and review signature-system anticipation/impact/aftermath and audio mixing. Separate persistent music/SFX settings, mute, unlock behavior, speed and reduced motion must work without changing rules.
- [x] Confirm every production URL/map and repair replacement survives a clean production build and unavailable-asset fallback tests.

## D. English, Chinese and accessibility

- [x] English is the first-launch default; explicit saved language choice does not mutate combat/RNG.
- [x] Content names/flavor, rules descriptions, logs, powers, statuses and current interface controls have bilingual implementations and automated coverage.
- [x] Menu/settings Field Guide implements three bilingual lessons with questions, three advanced references and two readable earned lore passages; two introductory combat tips also remain available.
- [ ] Perform full-flow editorial review in both languages; do not claim native-speaker sign-off that did not occur.
- [x] Record EN/ZH layout checks at 1280×720, 1366×768, 1920×1080 and high DPI with ten cards, long text, multiple enemies, three summons, Tidal and many statuses.
- [ ] Verify keyboard/focus/cancel paths, screen-reader names, non-color-only information, glyph coverage, locale punctuation, dialog usability and reduced motion.
- [ ] Verify progressive onboarding and advanced mechanics guidance remain consistent with the real resolver.

## E. Native compatibility and performance

- [ ] Record actual browser versions and results for modern Chromium, Firefox and Safari. Label Playwright WebKit/Firefox or device emulation accurately; it is not native Safari or a real device certification.
- [ ] Record the declared reference machine, frame times/FPS, interaction latency, initial transfer, memory growth, scene-transition leaks and long valid combos.
- [x] Verify keyboard/pointer controls and essential buttons remain reachable at every required resolution after final CSS changes.
- [ ] Keep simulation timing, browser rendering timing, build success and deployment readiness as separate evidence categories.

## F. Distribution, operations and authorized deployment

- [x] `DEPENDENCY_LICENSES.json` and `docs/licenses/` record installed packages and copied notices. Fontsource fonts are OFL-1.1; Lucide's notice includes ISC and MIT/Feather portions; audio is original synthesis without recorded samples.
- [x] Asset manifests state actual generation provenance; no paid external image API or named model identity is invented.
- [x] Check the distributed build/package retains all required dependency, font, icon and asset notices; resolve actual outstanding rights questions rather than asserting blanket legal clearance.
- [x] Document setup, production build/start, rules, content authoring, locale glossary, saves, assets, diagnostics, release notes and rollback/recovery procedures.
- [x] Supply a secret-free environment example and accurate cloud boundary. Local gameplay must continue without API keys; cloud save is not implemented merely because an adapter interface exists.
- [ ] Verify current hosting terms/plan suitability for the intended commercial release and record operational dependencies. Do not purchase or upgrade a plan without authorization.
- [x] Confirm the lead's current user authorization for the exact deployment destination and public-release scope. A successful local build does not itself authorize publishing, purchases or account changes.
- [x] When authorized, create the real deployment, inspect its final status, verify the canonical URL and run production smoke tests. Report deployment completion separately from local checks.
- [ ] Keep monetization out of scope unless explicitly requested; do not add fake payment flows.

## Final local evidence

`QA_EVIDENCE.md` records54/54 production browser tests, seven pixel comparisons,92 core tests, final typecheck/lint/content/build, actual generation/import hash checks, a recorded ordinary opening, and successful isolated performance diagnostics. The reference machine/browser versions and measurement limits are attached. Native Safari interaction remains BLOCKED by Mac lock; human balance/editorial/audio acceptance and public deployment remain open.

## Release decision

**Commercial V1.0 acceptance remains open.** Production art coverage is now implemented and recorded. A full ordinary-rule route is reachable. Human balance, final audiovisual/editorial/accessibility acceptance, native-device performance acceptance and complete release operations still require concrete closure. The lead must fill final PASS/FAIL/BLOCKED/NOT RUN results from actual artifacts after the last changes; this document neither invents results nor authorizes a public release.

## Deployment follow-up

Explicit user authorization was received and production deployment is READY at https://heavenward.vercel.app. The static payload includes notices;145 HTTP/path checks and3 live browser smoke cases passed. The account is active Hobby:personal testing only, with commercial plan acceptance still open. See `DEPLOYMENT.md`.
