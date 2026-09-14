# Human Realm content authoring

`src/game/content.ts` is the curated source of card definitions, Path identities, grades, realm limits, summon definitions, encounters, and Heavenly Omens. Its data version is `CONTENT_VERSION`, currently `human-0.3.0`. Values are configuration; mechanics belong in the deterministic combat resolver. English (`en`), Simplified Chinese (`zh-CN`), and Vietnamese (`vi`) share the same definitions and rules.

The current pool contains 83 Dao Arts, 14 Immortal Arts, eight Divine Abilities, two Basic designs, one combat-only Flying Sword token, and six temporary Status cards: 114 definitions. Every Path has at least six mechanically distinct Dao Arts. Grade variants do not contribute to this count. The 103 original IDs and their dedicated illustrations remain stable; the eleven new definitions explicitly alias existing art through `CARD_ART_ALIASES`. Counts and automated acquisition evidence do not establish commercial balance or human playtest approval.

## Authoring contract

Each `CardDef` has a stable ID; three-language `name` and `flavor`; a Path, category, kind, rarity, archetype and Dao Yuan cost; and executable `effects`. Do not duplicate rules prose in content. The UI calls `describeCard` from the combat module, so displayed values use the same grade and resource inputs as resolution. `content-vi.json` is a strict authored domain catalog, not an English fallback. `encyclopedia.ts` provides 13 Dao entries and 44 canonical keyword definitions.

Every definition explicitly declares its primary `target`: `self`, `enemy`, `allEnemies`, `randomEnemy`, or `none`. The constructors require a target argument; it is never inferred from an incidental effect. Enemy attacks with self healing/Armor stay enemy-targeted. Ancient Grove, Gravel Snare and Phantom Lattice primarily benefit the player and remain self-targeted despite secondary global enemy effects. Banked Coals needs a selected enemy for its Flame. All six Status cards declare no target; Heart Demon can still be played to Exhaust. No current card invents a random-target mechanic merely to populate the union. Actual play uses shared validation, while a preview can observe a particular enemy independently of the activation target.

`amount` is the stored grade-zero value (numeric grade 1, letter F, traditional Ding). `upgrade` is the amount added per effective grade; `scale` is a resource multiplier and must not be reused for grade arithmetic. Most damage/Armor grades add two or three, resources and draw add one, and summon grades add two maximum HP. For selection effects, upgrade increases the permitted selection count. Re-Refinement still increases each selected card by one temporary grade, bounded by the realm rule. Divine Abilities, Tokens, and Status cards carry no grade. Flying Sword remains cost zero, base damage two, and Exhaust.

Each graded card has at least one explicit upgrade benefit. Status caps may make a particular grade improvement redundant in a particular battle; that is visible through the dynamic card model. Five Weapons Return always selects up to five Attack cards from Exhaust; grades add a Dao Yuan rebate, rather than changing the source's five-card limit.

`perRetained` adds a value for each Player Turn boundary actually retained. `condition: 'retained'` with `threshold` gates a prepared payoff. `retainCost` unlocks a cost reduction after its specified number of actual retained turns. Time in hand or a draw does not count.

`onDiscard` resolves only for Active Discard. Ragged Banner has Retain, so enemy-forced discard can hit it during an ordinary enemy turn after natural cleanup. Natural end-turn discard and overflow must never trigger it. `innate` affects the real opening draw; Still Sword Heart makes this keyword reachable without a test fixture.

The legacy fallback artwork indices 0–12 are ordered Fire, Wood, Earth, Water, Metal, Sword, Wind, Blood, Summoning, Strength, Refinement, Formation, Wisdom. Basic is 13; Immortal is 14; Divine is 15. The UI first resolves dedicated art by stable card ID, then explicit aliases for new IDs. Fallback indices alone are not distinct artwork. Generated assets and review status belong in the separate asset manifest.

`Effect.pursuit` adds its bonus to the original damage or Armor packet, never a second hit. `priorWind` means any earlier Wind card this turn; `thirdPlay` means exactly the third committed play; `previousAttack` means the immediately previous card was an Attack of any Path. `nextWindDiscount` applies only to the next Wind card this turn and expires if unused.

`onDraw`, `onTurnEnd`, `autoExhaust`, and `unplayable` define temporary Status behavior. Actual draw hooks run before overflow; directly adding a card to Hand does not trigger `onDraw`. Internal Injury resolves before natural turn-end disposal. `reorder` exposes a specified group and requires every revealed ID once, in chosen top-to-bottom order; `scry` separately filters optional cards while keeping the remaining order.

## Acquisition boundaries

- `STARTING_CARD_IDS`: 42 explicitly eligible Dao Arts across all Paths. Two seeded offers of five eligible cards each supply the two selected Dao Arts alongside five Strike and five Defense.
- `DAO_CARD_IDS`: every ordinary Dao Art. All specified archetypes have an ordinary reward route. Reward weights may favor a build but must remain nonzero for other Paths.
- `IMMORTAL_CARD_IDS`: rare combat/Elite, Inheritance, permitted events and rare Merchant offers. At least one authored payoff exists per Path; Wisdom has two after the stable-ID discard migration.
- `DIVINE_CARD_IDS`: only eligible breakthrough Tribulations. Never concatenate this list into normal combat, Elite, Merchant, Event, or Inheritance pools. Maximum four Human Realm slots; no grade, no upgrade, no final-Ascension reward needed.
- `flying-sword`: combat token only. Exclude from permanent acquisition, sale, upgrade, History acquisition counts, and postcombat decks.
- `STATUS_CARD_IDS`: six harmful temporary cards introduced by announced enemy effects. Exclude from every collection, reward, merchant, permanent upgrade, and permanent-deck path.

Divine cost is four Dao Yuan in this content set. The source gives five to six as a typical range, not a minimum. Four lets the first legitimate reward be activated at Foundation Establishment's four Dao Yuan without requiring an unrelated Flow card. Drawing and paying still matters; activation is never passive at combat entry.

Permanent decks have no maximum size. All reward choices can be skipped. The realm minima 12/14/16/18/20 are voluntary-removal floors; advancing with a smaller existing deck does not force new cards. Acquisition viability must be tested against the actual run generator. A category membership test or developer-supplied deck alone does not establish that a complete ordinary run can obtain a desired build.

## Archetypes and bridges

| Path | Ordinary enablers and decisions | Payoff / bridge |
|---|---|---|
| Fire | Ember Brand plants Flame; Cinder Fuse consumes it | Wildfire Thread spreads marks; Ashen Sun detonates each enemy separately |
| Wood | Spring Return / Living Sap sustain; Rootbind plants Seeds | Verdant Harvest uses Seeds; Thorn Familiar contributes to summon count, Intercept, Commands and Sacrifice |
| Earth | Stone Rampart and Rooted Stance build Armor | Mountain Breaker spends all Armor for AoE; preserving Armor remains a valid alternative |
| Water | Hidden Spring, Unbroken Flow and Clear Channel manage costs | Ripple Guard / Ebb Cut build Momentum; leave one unused Dao Yuan for the three-state Domain |
| Metal | Hone the Edge builds Pierce; Threefold Needles resolves hits separately | Golden Breath blunts small hits; Indestructible Golden Body replenishes Qi |
| Sword | Still Sword Heart builds Intent; Flying Arsenal creates tokens | Each Flying Sword benefits from Sword Intent and naturally triggers Refinement Exhaust |
| Wind | Storm Script / Wind Shears build Gale; Wind Step prepares the next Wind cost | Wind Slash checks earlier Wind, Chasing Blade exact third play, Flowing Guard immediately previous Attack; Pursuing Tempest rewards sequencing |
| Blood | Crimson Fang steals actual HP damage; Red Mist builds Bleeding | Open Vein / Blood Oath / Feast of Scars exchange direct HP loss for resources |
| Summoning | Reed Wolf acts at turn end; Thorn Vine counters; Iron Crane follows Armor breaks | Shared Standard, Encirclement, Beast Command, and Ancestral Offering are all ordinary Dao Arts |
| Strength | Battle Roar / Crushing Blow grow offense; Strength caps at 10 | Fundamentals grants Basic Mastery; Heavy Foundations adds both Basic Mastery and Basic cost |
| Refinement | Burn Impurities and Ash Insight select Exhaust; Crucible Shell rewards it | Reclaim the Edge and Five Weapons Return recover Attacks; Re-Refinement grants temporary grades |
| Formation | Hidden Thunder Array / Mountain Seal grow by retained turns | Silent Array gets cheaper; Phantom Lattice and Heaven-Earth Array unlock prepared effects |
| Wisdom | Calculation & Deduction covers draw, search, top-deck ordering and discard recovery | Hidden Schemes covers Active Discard, triggers and pile/resource manipulation; stable IDs Swallow Slip, Ragged Banner, Empty Sleeve and Sky Unbound now belong here |

Scarlet Requiem costs 3, applies 6 Bleeding and deals 16 damage, then Exhausts. Its existing Bleeding upgrade (+1) and damage upgrade (+3) remain. Its lifesteal was removed from every grade; the Bleeding archetype and all three flavors now reflect that change. Crimson Fang and other healing/passive rules are unchanged.

## Persistent power registry

| Effect ID | Meaning of `amount` |
|---|---|
| `flameEngine` | Flame added after a Fire Attack to its target |
| `seedGarden` | Additional growth for already planted Seeds at Player Turn start |
| `swordFoundry` | Flying Swords generated at Player Turn start |
| `gale` | Additional damage per Gale |
| `refiningArmor` | Armor per exhausted card, including Flying Swords |
| `basicTempering` | Additional Basic damage/Armor; each activation also adds one Basic Dao Yuan cost |
| `formationPatience` | Armor per card actually retained at the turn boundary |
| `regen` | HP healed at Player Turn start |
| `protectiveCycle` | Protective Qi gained at Player Turn start |
| `swordIntentMultiplier` | Damage contribution of each Sword Intent stack |
| `refiningDraw` | Cards drawn per exhausted card |
| `selfHarmDraw` | Cards drawn each time the player deliberately loses HP |
| `summonStrength` | Explicit Strength bonus for existing and subsequently created player summons |
| `numericalSuperiority` | Turn-start team Strength with two summons; doubled with three |
| `refiningStrength` | Strength gained per exhausted card |
| `refiningHeal` | Healing per exhausted card |
| `foresight` | Extra cards drawn at Player Turn start |

A new power requires an engine handler, a three-language dynamic description in `combat-text.ts`, and trigger tests. An arbitrary new string is not an implemented power. `tests/content.test.ts` checks that content uses registered IDs and that no card receives generic fallback power prose.

## Encounters and Tribulations

`normalEncounterIds` and `eliteEncounterIds` are arrays of enemy-ID groups. `bossEncounterIds` is a list of individual authored boss IDs. Enemy IDs never share the summon registry: enemy `summon` effects instantiate `ENEMIES[id]`; player `summon` effects instantiate `SUMMONS[id]`.

Normal encounters pressure different decisions through Armor, Poison, healing, multi-hit attacks, Protective Qi, dodge, forced discard, and self-buffing. Four Elites provide marked-prey burst, accumulating Strength, an allied brood, and hand disruption. Realm scaling belongs in combat setup; it must not rewrite a committed Intent during the Player Turn.

Five authored Tribulations are available for build-sensitive weighted selection:

- Cloud-Void Beastmaster follows Setup → Pressure → Command → Warning → Heavy. Setup creates two Cloud Wisps and one Dodge. Pressure attacks for 8 and adds Cloud Obscuration to Draw; its attack also commands the bound Wisps' follow-ups. Command orders bound Wisps to attack. Warning gives a full preparation turn. Heavy has authored raw damage 26/29/32/35/38 by realm and ignores half the target's Armor, not all Armor. Bound Wisps await their master rather than taking independent turns.
- Blood-Link Cultivator has an intermittent link. Linked damage remains external damage, subject to defenses. Its defensive interval gives a timing alternative to attacking the link.
- Restriction-Soul Cultivator alternates restricted Attack and Skill windows, taxes next-turn Dao Yuan, and consumes a companion. A restricted card remains playable and a killing blow avoids backlash.
- Thunder Judge alternates a charge, a large hit, many small hits, and a quiet debuff turn. The fixed cadence gives preparation value.
- Mirror Hermit uses a fixed evasion / Strength / double-strike / exposed-strike sequence. Its name does not imply an unimplemented copying or procedural mirroring system.

All six Status cards have an announced injector: Cloud Pressure → Cloud Obscuration; Script Devourer → Qi Disorder; Blood-Link → Internal Injury; Restriction-Soul → Meridian Disruption; Thunder Judge → Scorched Meridian; Mirror Hermit → Heart Demon. Each boss has a three-language Omen explaining the approaching decision. Affinities are selection hints, not promises of hard counters.

## Validation and limits

Run `npm run validate:content` and `npx vitest run tests/localization.test.ts`. Tests cover exact source Basics/token, meaningful distinctness after stripping numerical tuning, references, grade benefits, Path and starting access, category exclusions, bridge content, summons, encounter validity, boss/status hooks, all three locales, and executable descriptions. Run combat and progression tests for timing, damage, rewards and cleanup.

Current human-0.3.0/core-3/policy-4 diagnostics live in `artifacts/revision-balance.*`, `artifacts/bot-runs-v2.json`, and `artifacts/bot-runs-sacrifice-v2.json`; the final evidence note is `artifacts/revision/rules-diagnostics-0.3.md`. Their embedded source hashes identify the rules actually tested. Eight baseline ordinary runs ascended and acquired all 30 playable archetypes collectively; four sacrifice-prioritized trajectories also ascended, with actual Sacrifice executions in three. These are 12 policy trajectories across eight distinct seeds, not 12 independent seeds. All passed the real progression/save contracts, including optional acquisition, uncapped 36–39-card final decks, and five Tribulations. Equal-budget constructed combat comparisons remain separate: board-aware won 223/240 fights, including 17 losses in minimal realm-0 Cloud matchups; Strike-only won 80/240. Prior policy-3 outputs are archived byte-for-byte under `artifacts/revision/historical-policy3/`. These samples do not establish human enjoyment, optimal play, universal hybrid superiority, or human completion time.

This document does not assert human playtest approval, balanced ordinary-run win rates, native-speaker editorial approval, finished card-by-card artwork, or commercial release readiness. Those require separate measured evidence and release gates.

Post-run provenance: a later `getPendingProgression` presentation-query correction is documented in `artifacts/revision/rules-diagnostic-postrun-delta.json`. The simulations were not rerun for that query-only change; original tested hashes remain authoritative.
