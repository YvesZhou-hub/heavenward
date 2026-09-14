# Final human-0.3.0 rules diagnostics

Rules/content: **human-0.3.0**. Core: **3**. Bot policy: **4**. Generated 2026-09-14T04:49:34.098Z. Each JSON report records hashes of the tested rules and diagnostic sources.

One bounded pass; no combat balance or policy scoring changes were made in response to these results. Policy 4 adapts explicit targets, durable Continue receipts, optional acquisition and uncapped decks.

## Ordinary generated runs

| Sample | Trajectories | Ascensions | Deaths | Diagnostic failures | Archetypes acquired |
|---|---:|---:|---:|---:|---:|
| Baseline | 8 | 8 | 0 | 0 | 30/30 |
| Sacrifice-prioritized | 4 | 4 | 0 | 0 | 27/30 |

The 12 trajectories use eight distinct seeds: the targeted sample reuses the first four with a Summoning-oriented policy. Every run reached all five realms and cleared five Tribulations through actual transitions. Baseline final decks contain 36–39 cards. Three of the four targeted trajectories acquired and played Ancestral Offering and recorded a Sacrifice event; the fourth did not acquire it. All 30 archetypes were acquired from actual offers by the baseline sample alone.

These runs use ordinary starting offers, rewards, purchases, rests and encounters. They do not use constructed decks, modified HP, debug victories or hidden draw-order inspection. Save validation ran across normal transitions. The greedy bot favors healing, summons and useful offered cards; 12/12 wins does not demonstrate suitable human difficulty.

## Equal-budget constructed fights

Five builds × two realm/grade budgets × three enemy definitions × eight paired seeds × two policies = 480 fights. Realm-0 decks contain five Strikes, five Defenses and two common Arts; realm-2 decks contain the same ten Basics and six common Arts. Grade sums, nominal merchant prices, HP and Yuan match at each realm. Expanded decks are constructed diagnostics, not evidence of their ordinary acquisition.

| Policy | Wins | Losses | Incomplete | Mean turns | Mean HP lost | Mean actions |
|---|---:|---:|---:|---:|---:|---:|
| strike-spam | 80/240 | 160 | 0 | 7.08 | 61.33 | 18.94 |
| board-aware | 223/240 | 17 | 0 | 5.41 | 20.93 | 26.75 |

All 17 board-aware losses came from the minimal realm-0 Cloud fixtures: Pure Fire lost 8/8; Wisdom/Wind lost 8/8; Sword/Refinement lost 1/8. Those opening decks have no cards or upgrades earned before an ordinary Tribulation. All five expanded realm-2 Cloud builds won 8/8.

| Realm-2 Cloud build | Wins | Mean turns | Mean HP lost | Mean actions |
|---|---:|---:|---:|---:|
| pure-sword | 8/8 | 5.75 | 16.25 | 43.63 |
| pure-fire | 8/8 | 9.75 | 34.5 | 40.88 |
| sword-strength | 8/8 | 4.63 | 0 | 30.5 |
| wisdom-wind | 8/8 | 9.88 | 33.25 | 54.38 |
| sword-refinement | 8/8 | 6.75 | 20.63 | 51 |

Sword/Strength is faster and takes less HP damage than Pure Sword in this specific comparison. Sword/Refinement and Wisdom/Wind require more actions and take more HP damage here; the sample does not support universal hybrid superiority. The Strike-only policy deliberately ignores Defense and every Art, so it is a naive baseline rather than a test of every Basic Mastery strategy.

Five additional actual starting drafts found the intended pairs at seeds 4, 1, 76, 116 and 192. Each won its first mandatory ordinary fight and reached a stored reward. This proves those openings are available through normal offers, not that every expanded diagnostic deck is routinely acquired.

## Reward generator sampling

Three controlled deck profiles × 300 seeds × 12 batches × five distinct offers = 54,000 offers. This is generator sampling, not combat or acquisition evidence. Every profile observed all 97 collectible Dao/Immortal definitions. No Basic, token, temporary status or Divine card entered these ordinary reward batches.

| Profile | Offers | Definitions observed | Off-Path share | Sword offers |
|---|---:|---:|---:|---:|
| neutral | 18000 | 97/97 | 100.00% | 1171 |
| sword | 18000 | 97/97 | 74.34% | 2911 |
| mixed | 18000 | 97/97 | 56.28% | 986 |

The neutral profile has no Paths, so its 100% off-Path share is expected. Sword-profile weighting increases observed Sword offers from 1,171 to 2,911 while preserving positive off-Path access.

## Reproduction and provenance

- `npx tsx scripts/revision-balance.ts 8` → `artifacts/revision-balance.json` / `.md`
- `npx tsx scripts/reward-seed-report.ts` → `artifacts/revision/reward-seed-report.json`
- `npx tsx scripts/simulate.ts 8` → `artifacts/bot-runs-v2.json`
- `npx tsx scripts/simulate.ts 4 --sacrifice` → `artifacts/bot-runs-sacrifice-v2.json`

The `v2` filenames are retained for existing consumers; embedded rules/content versions and policy metadata are authoritative. Prior human-0.2.0/policy-3 reports are preserved under `artifacts/revision/historical-policy3/` with SHA256 manifest. All recorded source hashes were rechecked against the checkout after the run.

Machine compute time is not human play duration. These headless rule simulations do not verify browser performance, mobile usability, native-speaker editorial quality or enjoyment. Final browser profiling is tracked separately.

A later presentation-query correction in `run.ts` makes `getPendingProgression` show only the newest unread receipt. It prevents stale minor banners after major Continue; the owning agent reported no grants, RNG, acquisition or combat changes. **The simulations were not rerun after this query change.** Their tested source hashes remain untouched. Exact old/new hashes and unchanged-input checks are recorded in `rules-diagnostic-postrun-delta.json`.
