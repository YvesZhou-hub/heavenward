# Implementation status — 2026-09-14

**Playable Human Realm build0.1.0 is deployed at https://heavenward.vercel.app (production READY). Commercial V1.0 acceptance is not complete.** The complete original 47 sections and 22 master requirements remain preserved in `docs/source`, with the detailed per-requirement implementation/access/evidence/localization/polish mapping in `REQUIREMENT_MATRIX.md`.

## Implemented and reachable

| Area | Implementation and normal access | Evidence |
|---|---|---|
| Mortal life | New life → two five-choice drafts → five realms × four stages → four breakthrough gates → final Ascension/death → History | `run.ts`; run tests; twenty ordinary-rule bot completions |
| Content | 13 Paths, 31 archetype tags, 79 Dao +13 Immortal +8 Divine +2 Basic designs; one combat-only Flying Sword Token | `content.ts`; content validation; ordinary acquisition across bot batches |
| Rules | Four zones, draw-five/hand-ten overflow, exact Basics, eight grades/realm+one, active/natural discard, actual Retain, refinement, each-hit damage, summons/Intercept, Command/Sacrifice, Tidal and five authored boss mechanics | `combat.ts`, `rules.ts`; core invariants and interaction tests |
| Surrounding game | Road choices, weighted offers, Merchant buy/sell/escalating upgrades, mutually exclusive Rest, four authored Events, Inheritance, full-deck replacement, required minimum-deck foundation drafts | `run.ts`, `Game.tsx`; run and browser flows |
| Decision interface | Click/target, drag, keyboard, cancel, same-resolver HP/Armor/individual-hit preview, inspection, upgrade comparison, searchable/filterable piles, visible intents and status help | Shared `Card`, `DeckBrowser`, `Dialog`; browser fixtures and screenshots |
| Language and learning | Fresh English default; saved active-run EN/ZH switching; localized rules/logs/statuses; three interactive guide lessons, mechanism references and two unlocked lore entries | `i18n.ts`, bilingual definitions, `FieldGuide.tsx`; layout and localization coverage |
| Art | 103 dedicated card illustrations +18 enemies +5 summons +1 Wanderer, plus environment. Sources, exact prompts, actual dimensions, crops and hashes retained | `PRODUCTION_ASSET_MANIFEST.json`:127 mapped files, no mismatched hashes; original environment in `ASSET_MANIFEST.json` |
| Reliability | Serializable paused effects; checksummed primary/mirror/head, stale-write detection, Web Locks, terminal markers, refresh and multitab sync; optional audio cannot block play | save/replay tests and browser corruption, quota, multitab, image/offline/audio failure cases |
| Build | Static Next production export; no runtime API keys, model service, database or account; local launcher and Vercel configuration | Typecheck/lint/build; production browser and performance records in `QA_EVIDENCE.md` |

## Release gates remain separate

- **Rules and route reachability:** automated evidence exists. It does not replace a representative human full-run playtest.
- **Content and balance:** all required systems/Paths have authored access. Encounter identities and route cadence repeat across realms; twenty bot runs all won. Human difficulty, economy, variety and enjoyment acceptance remain open. Neither source supplied the referenced earlier commercial-pool numeric target.
- **Art and presentation:** dedicated art coverage/import/provenance records are present. The built-in generator does not expose the requested model identity; GPT Image 2.5/Sunburst cannot be certified. Mechanic-specific sound/animation polish and a full editorial/accessibility review remain open.
- **Platform:** automated Chromium/Firefox/WebKit coverage is documented separately from native desktop applications. Native Safari interaction was blocked by macOS lock; a displayed screenshot is not an interactive pass.
- **Persistence evolution:** current schema1/replay work. There is no prior shipped schema to migrate, and no cross-version full-run replay or cloud implementation is claimed. The no-Web-Locks optimistic fallback has a simultaneous-write limitation.
- **Release operations:** local build and license inventory are included. The user-authorized personal-test deployment is verified READY on an active Hobby account. Commercial plan suitability remains a later-release gate; see `DEPLOYMENT.md`.

See `QA_EVIDENCE.md` for actual test statuses and measurements, `KNOWN_ISSUES.md` for precise limits, and `NEXT_ACTIONS.md` for the remaining work. Later Spirit/Immortal World gameplay is intentionally future scope; it is not a missing Human Realm route.
