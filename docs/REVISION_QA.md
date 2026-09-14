# September14 revision verification

Final rules/content `human-0.3.0`, combat schema3, save envelope2. The integrated local release gate passed. Deployment is recorded separately in DEPLOYMENT.md. This is not commercial V1.0 acceptance.

| Executed check | Result / evidence |
|---|---|
| `npm run typecheck` | PASS — [log](../artifacts/revision/typecheck-final.log) |
| `npm run lint` | PASS, zero warnings — [log](../artifacts/revision/lint-final.log) |
| `npm test` | **168 PASS,0 failed** — [JSON](../artifacts/revision/unit-final.json) |
| `npm run validate:content` | PASS — [log](../artifacts/revision/content-final.log) |
| `npm run build` | PASS, static export — [log](../artifacts/revision/production-build.log) |
| `E2E_BASE_URL=http://127.0.0.1:3212 npx playwright test --workers=3 --reporter=json --output=output/playwright/verified-rules3` | **122 PASS,0 failed,0 flaky;4 explicit skips** — [JSON](../artifacts/revision/browser-verified.json). Chromium,Firefox,WebKit. The two CDP touch-specific tests run in Chromium; those same tests are skipped in Firefox/WebKit because their CDP transport is unavailable. Mouse/keyboard/inspection run in all engines. |
| Reviewed visual comparisons | Seven Chromium baseline images inspected after hierarchy/grade/rules/intent-lane changes; existing0.001 pixel tolerance retained. Added heading/intent and peer-intent geometry assertions. [Review and hashes](../artifacts/revision/pixel-review-0.3.json) |
| `npm run qa:performance` after browser workloads stopped | PASS against exact frozen HTML. Headless mean frame interval16.67ms; action-to-confirmed-paint43.68ms mean/45.2ms p95; stable DOM/listener counts over50 cycles. [Scope and limits](../artifacts/revision/performance-0.3.md), [raw report](../artifacts/performance.json). No device-FPS or human-duration claim. |
| `npx tsx scripts/reward-seed-report.ts` |54,000 sampled offers; no duplicates/ineligible entries, all97 Dao/Immortal definitions observed per profile. [Report](../artifacts/revision/reward-seed-report.json) |
| `npx tsx scripts/revision-balance.ts 8` |480 constructed paired fights:223/240 board-aware wins versus80/240 Strike-only,0 incomplete. All17 board-aware losses are minimal early Cloud fixtures. [Report](../artifacts/revision-balance.md) |
| `npx tsx scripts/simulate.ts 8`; `npx tsx scripts/simulate.ts 4 --sacrifice` |8/8 ordinary Ascensions with30/30 archetypes acquired;4/4 targeted Ascensions,3/4 actually played Ancestral Offering.12 trajectories span8 distinct seeds. [Evidence and limits](../artifacts/revision/rules-diagnostics-0.3.md) |

The reports retain actual execution hashes. A later presentation-only latest-receipt query fix is explicitly recorded in [post-run provenance](../artifacts/revision/rules-diagnostic-postrun-delta.json), with a passing regression; the prior simulations were not falsely relabeled as rerun.

## Gameplay/UI coverage

The tests exercise explicit SELF/ENEMY/AoE/none targeting, target-before-cost errors, zero-cost play at zero resources, pure rejection, duplicate input, touch drag with edge scrolling, enemy double-click selection/cancel, stale combat selections across tabs and modal timing. Firefox exposed a real second-click fall-through from rewards into the next route; repeat-click capture fixed it and the complete rerun passed.

Uncapped purchases/rewards preserve every existing UID;105-card browser decks and150-card save validation pass. All26 route nodes can be completed with every reward skipped and the original12 cards. Removal floors12/14/16/18/20 apply atomically to final permanent decks, including batches/swaps. Combat Exhaust/Status/Summons do not count as permanent removal.

Strength10, individual hits, Weak/Vulnerable and summon independence pass. Wisdom discard causes, Wind history/discount purity, all six Status triggers and cleanup, Cloud dodge/sharing/follow-ups/Commands/warning/half-Armor resolution pass. Scarlet Requiem has no intrinsic heal at any grade; independent healing still works. Upgraded Basics retain Brute Force support.

Merchant/Rest comparison, cancellation, stale quotes, duplicate confirmation, capped healing and visit exclusivity pass. Major receipts show actual paid growth separately from optional choices; Continue and reload never regrant rewards. Minor receipts add no fictional stats. An acknowledged latest receipt cannot resurface older notices. Final Ascension can resume its unread receipt, then remains terminal. Confirming a new life records the old terminal life exactly once.

## Screenshots

Real screenshots are under [revision screenshots](../artifacts/revision/screenshots/), including:

- Five rewards: [English](../artifacts/revision/screenshots/chromium-reward-en.png), [中文](../artifacts/revision/screenshots/chromium-reward-zh-CN.png), [Tiếng Việt](../artifacts/revision/screenshots/chromium-reward-vi.png).
- Ten-card hands in all3 languages, negative-card inspection, three summons, narrow Vietnamese layout and actual touch insufficient-resource feedback.
-105-card collections in all3 languages, [major receipt](../artifacts/revision/screenshots/incremental-chromium-major-receipt.png), [minor notice](../artifacts/revision/screenshots/incremental-chromium-minor-notice.png), shared upgrade/sale previews and Cloud intents.

Compact long descriptions can truncate, particularly in crowded ten-card hands; full inspection is accessible. These agent/browser checks do not constitute native-speaker or human art-director approval.

## Save compatibility

Public0.1 is preserved at `/legacy/v1/index.html`. The real legacy browser test creates an old life, continues it, exports it and explicitly starts a new revision while retaining original bytes. It passes across all3 engines.

Local0.2 snapshots migrate to0.3 without recomputing resolved HP, RNG, zones, IDs or paid history. Original primary/mirror/head/terminal bytes are archived before overwrite; archive failure preserves originals. Pending Scarlet-owned healing is removed; independent passives remain. The persistent notice identifies snapshot continuation. Old initial-config replay is rejected rather than claiming cross-version seed equivalence. Fresh profiles default to English and numeric grades; language/grade changes do not alter gameplay/RNG.

## Unrun human gates

Newcomer sessions, human fight/full-run duration, fun/economy/difficulty acceptance, native three-language editorial review, screen-reader/native-device testing and listened-to audio/final audiovisual acceptance are **NOT RUN**. The60/80–90/100-minute targets remain targets, not measurements. Minimal early Cloud results need human investigation; legal stronger builds may race the boss. Commercial V1.0 and remaining content/distribution acceptance are open. See [newcomer protocol](NEWCOMER_PLAYTEST.md), [known issues](KNOWN_ISSUES.md) and [next actions](REVISION_NEXT_ACTIONS.md).

Historical failing checkpoints and prior-version reports are retained as diagnostics; the final passing result above supersedes them. No check was disabled to obtain a pass.
