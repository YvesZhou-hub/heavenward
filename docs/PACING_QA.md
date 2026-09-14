# Human Realm pacing and run/save QA

## Route decision

Each realm contains eight Dao Road decisions, two per minor stage. Only the immediately reachable alternatives are generated for display. The route cadence is authored and is independent of build power.

| Depth | Stage | Immediately reachable choices |
|---|---|---|
| 0 | Early | Normal combat |
| 1 | Early | Normal combat / Merchant / Event |
| 2 | Middle | Rest / Elite |
| 3 | Middle | Normal combat / Elite |
| 4 | Late | Merchant / Normal combat / Event |
| 5 | Late | Elite / Rest |
| 6 | Peak | Rest / Inheritance |
| 7 | Peak | Heavenly Tribulation |

Depth zero guarantees an ordinary opening encounter. Depth three guarantees a second combat decision; choosing an Elite does not remove the gate. This prevents a realm from being completed through events, rest and inheritance alone. Spirit Transformation uses the same cadence, so reaching it is followed by two required fights and the Ascension Tribulation. The shortest full run has 15 combats over 40 route nodes. Players may deliberately choose more combats and Elites.

Normal and Elite choices use the curated encounter groups exported by content. Cloud Wisps are summoned minions, not independent ordinary route encounters. Route logic does not construct arbitrary duplicate-enemy groups from the entire enemy registry.

## Correctness evidence

`tests/run.test.ts` contains controlled progression fixtures. These deliberately resolve combat victories to isolate realm, deck, reward, shop and terminal transitions; they are **not** normal-play victories or balance evidence.

The run tests cover:

- Two five-choice starting rounds and the exact 5 Strike / 5 Defense / 2 Dao deck.
- Curated encounters, mandatory battle gates and all 20 minor stages.
- Immutable/idempotent reward handling, stale combat commits, and full-deck replacement.
- Four Divine breakthrough opportunities, obligatory minimum-deck foundation drafts and the fifth final Ascension.
- Xuan upgrades at Spirit Transformation, Divine grade exclusions, sale limits, minimum deck size, escalating upgrade costs and duplicate purchase protection.
- Mutually exclusive Rest options, paid Event upgrade restrictions, rare Event offer fidelity and insufficient-resource rejection.
- Permanent loss, idempotent History recording, immutable recorded statistics and content-only unlocks.

`tests/save.test.ts` uses a memory storage implementation plus real combat actions. A controlled ordinary deck supplies an Exchange a Thought card to inspect the otherwise difficult-to-target middle of a queued choice. It tests an actual resolver pause, resolving-card ownership, save/restore, and equality of the continued result.

Save coverage includes fresh English defaults, malformed/unknown JSON, settings/meta/resource validation, card ownership, source versions, all zones including a currently resolving card, real action round trips, locale changes without RNG/deck changes, checksum rejection, current-mirror recovery, stale-head rejection, interrupted writes, terminal tombstones, stale-tab revisions, simulated Web Locks concurrency and storage failures.

Browser Web Locks is the serialization boundary for concurrent tabs. The non-Web-Locks fallback performs optimistic revision checking but cannot supply a cross-tab atomic compare-and-swap; simultaneous-write behavior on a browser without Web Locks remains a compatibility limitation. The save is not a cheat-proof competitive ledger, and the checksum is corruption detection rather than authentication.

## Ordinary automated runs

Reproduction:

```sh
npx tsx scripts/simulate.ts 12
npx tsx scripts/simulate.ts 8 --sacrifice
```

Artifacts:

- `artifacts/bot-runs.json`: 12 seeded runs, rotating Ember Blade, Living Fortress, Tide Reader and Blade Furnace preferences.
- `artifacts/bot-runs-sacrifice.json`: eight separately labelled runs whose policy gives offered Ancestral Offering a high acquisition priority.

Both batches use the actual `newRun`, starting offers, route generator, rewards, shops, events, upgrades and combat actions. They do not modify player HP, enemy HP, card grades, permanent decks, statistics, rewards or terminal outcomes. The bot reads visible Hand, committed enemy Intents and legally revealed choice IDs. It does not use unknown Draw order to select an action. Diagnostic turn/action limits report an incomplete run rather than awarding a win or discarding valid effects.

| Evidence | General policy | Sacrifice-priority policy |
|---|---:|---:|
| Runs | 12 | 8 |
| Ascensions | 12 | 8 |
| Deaths | 0 | 0 |
| Diagnostic/save-contract failures | 0 | 0 |
| Acquired archetypes | 30 of 31 | 27 of 31 |
| Archetypes observed in actual offers | 31 of 31 | 31 of 31 |
| Ancestral Offering activated | 0 runs | 2 runs |

Across the two policies, all 31 authored archetype tags were actually acquired through the ordinary route. Sacrifice was observed but declined by the general policy; the second policy demonstrates that ordinary offers can be selected and the three-summon sacrifice can be activated without fixture grants. Artifacts list the cards played and combat event types observed per run. This demonstrates reachability, not that every Path/archetype combination is equally strong.

The general batch completed exactly 15 combats per run, with 26–94 Player Turn endings, 34–38 cards acquired, and Xuan reached through upgrades. Those are headless bot counts, not measured human session lengths. The bot favors efficient optional nodes and does not exercise all possible route branches in each run.

A separate reward-generator test samples 10,800 ordinary offer cards with a deliberately Sword-heavy deck. It observes all 79 Dao Arts and every ordinary archetype, demonstrating that weighting permits pivots. This sampling has no combat component and must not be described as 300 completed runs.

## Balance interpretation and remaining evidence

Twenty automated Ascensions with no losses in these small, selected deterministic batches suggest the present heuristic bot finds a forgiving route. They establish that final Ascension is reachable using ordinary rules; they do not establish calibrated challenge, player enjoyment, commercial balance or human completion time. Difficulty tuning and human playtesting remain explicit release work. Do not conceal this result by reporting only selected dramatic battles.

The latest local full-project check during this QA pass passed TypeScript, ESLint and 91 unit/integration tests. Browser E2E, visual layout, audio, performance, assets and deployment have separate evidence and should be reported independently by their owners.
