# Human Realm rules decisions

Rules version3 / `human-0.3.0` (latest September14 revision); save envelope remains2. These explicit decisions fill gaps in the authoritative47-section design and record the latest user overrides. Earlier capped-deck/mandatory-foundation decisions are superseded, not silently retained.

## Damage and reactions

- Each hit resolves independently: attack base → source Strength/Pierce and Sword/Basic modifiers → floor Weak → floor Vulnerable → flat Reduction → one-hit Dodge → Intercept → Protective Qi → Armor → HP. Percentages floor at the named step, never once at the end.
- External damage receives Vulnerable and defensive mitigation but never attack-only bonuses. Summons are independent attackers. Direct HP Loss bypasses the entire damage resolver. Lifesteal heals actual HP damage, not blocked or overkill damage.
- Pierce is consumed only after an attack hit causes actual HP loss. A multi-hit sequence reevaluates the current stacks per hit. Sword Intent finishers consume Intent before their hit, so the normal per-hit Intent bonus is not added twice.
- Each living summon intercepts 20%; calculate the combined portion once, then distribute quotient plus remainders in summon creation order. Summons apply their own defensive modifiers. Overkill does not return to the owner or redistribute. Intercept packets cannot intercept again. A one-hit Dodge stops the original packet before Intercept.
- Damage Link returns its percentage of resolved Armor + HP damage and does not reduce the original hit. The linked packet is external damage and can be mitigated/intercepted. Linked packets carry a causal flag and cannot produce another link. Counter and Armor-break automatic summons each trigger at most once per player-turn cycle; Command is independent of that limit and may add a printed flat grade bonus to each summon's attack.
- A damage packet completes its immediate reactions and lifesteal, then death is checked before the next queued effect. Dead sources and targets cannot act. Player death wins a simultaneous lethal tie, producing a terminal loss. Restriction retaliation is skipped when its source was killed by the card. Completed combat returns the resolving card to its proper zone.

## Turn timing

- Player Armor resets at the start of the next Player Turn, before start-turn powers. Enemy Armor resets at the beginning of that enemy's action. Defensive Armor therefore survives through the opposing turn.
- End Player Turn: expire next-Wind discount → temporary hand-card end hooks and their Exhaust reactions → selected Tidal state → automatic turn-end summons → natural discard and actual Retain counting → summon end effects → player Poison → Protective Qi halving → Weak/Vulnerable/Restriction duration decrement → enemy actions in stable creation order → next Player Turn.
- A unit's Poison ticks for its current stacks, then loses one. Protective Qi halves at the end of its owner's turn, as required (including the player's turn before enemy actions). Weak and Vulnerable are durations and decrement at the owner's turn end. Strength, Pierce, Sword Intent, Fortify, marks, and Momentum do not decay otherwise.
- Start Player Turn: Armor reset → energy refill minus debt → healing powers and Regeneration → start-turn buffs → Seed growth/bloom → draw five plus power bonuses → generated start-turn Flying Swords. New ordinary enemy minions first act on the following enemy phase. Cloud-bound Wisps instead wait for their living master’s commands and follow-ups.
- Regeneration status heals its current amount and loses one at turn start. The Endless Vitality power is persistent and does not decay.

## Thresholds and persistent effects

- Strength caps at **10**. The other existing caps remain unchanged: Pierce **6**, Protective Qi **5**, Sword Intent **10**, Tidal Momentum **5**. Strength adds to every Attack hit; a base-2 Flying Sword with Strength 10 deals 12 before target defenses. Summons use their own Strength.
- Thresholds resolve after the current card/effect sequence, including its choice and discard/exhaust triggers. Wind consumes three per Gale (3 external AoE damage); Bleeding consumes ten per burst (12 external single-target damage). Both can repeat if enough resource exists. These unresolved source balance numbers live in `src/game/rules.ts`.
- On the first Tidal threshold, finish the card, consume four Momentum, create the Domain, and ask for its initial state. The Domain never occupies a summon slot. Once active, future Momentum is retained up to five; it does not create duplicate Domains or get consumed again at four.
- The initial Tidal state applies that turn. On subsequent End Turn presses, choose again. Tidal activates only at one or more unspent Dao Yuan, which is not consumed. All three source formulas and lowest/highest current HP targeting are exact. Ties use enemy creation order.
- Seeds grow by one at Player Turn start; each marked enemy reaching three consumes three, deals 5 external damage, and heals 2. Seed Garden adds growth. Marks do not bloom on the turn they are planted. Flame has no decay; Detonate consumes the target's marks and Spread copies them to the other living enemies.
- Divine cards cost their printed Dao Yuan, activate only after being drawn and played, and Exhaust. Maximum-energy effects increase current energy by the same amount. Realm energy is 3/4/6/7/8. Acquisition and slot limits belong to run progression. Divine cards use cost 4 as a documented exception to the source's typical 5–6 range, making first-breakthrough Divine rewards playable at Foundation Establishment.

## Card zones and choices

- Shuffle uses seeded xorshift32 and Fisher–Yates. Innates are stably prioritized within the shuffled deck. Opening hand remains five, even with six or more Innates. Unchosen Innates remain in the hidden Draw pile. No unknown order is exposed by engine previews.
- Any hand entry above ten cards goes to Discard. Generated Flying Swords have no per-turn cap, are zero-cost grade-zero Tokens, and Exhaust on play. Run deck copies exclude all combat tokens, temporary Status cards, and temporary grades.
- Active Discard is an explicit effect, including enemy-forced discard. Natural turn-end and hand-overflow moves never activate discard triggers. Enemy discard removes the visible leftmost cards deterministically. Scry's inspected-card disposal is deck manipulation, not discard from Hand, and has no Active Discard trigger.
- Retained turns count only actual end-turn boundaries while the card remains in Hand. The count resets whenever the card leaves Hand. Formation cost reduction activates at the printed threshold. Temporary hand cost reductions expire at turn end or when played.
- Re-Refinement advances one temporary grade, capped at current realm + one (maximum grade 7). Divine Abilities, Tokens, and Status cards are ineligible. Too-high permanent cards remain visible but unplayable; the engine never silently down-grades them.
- Choice effects pause a serializable queue. Active Discard requires the displayed count; recovery, Exhaust, refinement, Scry, and search allow up to the displayed count. Reorder requires every revealed card exactly once; selection order becomes top-to-bottom without shuffling the unseen tail. Invalid/duplicate IDs leave state unchanged. Finishing a choice resumes the original effect queue in order. Search selects from the Draw pile and shuffles the remainder; Scry discards chosen revealed cards and preserves remaining order.
- Played cards live in `resolvingCard` until effects finish, then enter Discard or Exhaust. Exhaust-trigger draw cannot draw the currently resolving card. The power's own Exhaust triggers its newly activated Exhaust effects.
- Preview uses the same resolver on a deep clone, suppresses hidden draws and search, and flags hidden or choice-dependent outcomes as uncertain. It returns known HP damage, Armor damage, self HP loss, and individual resolved hits without consuming the real RNG.

## Summons and bespoke bosses

- There are three normal summon slots. Replaying the same summon at full slots heals the matching summon by one quarter of base maximum HP (minimum two) without raising its maximum. A different summon at full slots fails visibly; Sacrifice uses oldest living summons, requires its printed count, and does not touch Tidal Domain.
- Two summons grant the printed Numerical Superiority team bonus; three double it. Overwhelm requires at least two. Persistent summon Strength applies to existing and future summons.
- Cloud Beastmaster redirects 25% of post-Dodge damage to living Cloud Wisps; sharing does not recursively share. Each Wisp death grants its living Beastmaster 4 Armor. Damage Link status counts owner-turn duration; it returns 35% by default (configurable), so Bind Fates gives one protected player-turn window after its own end-turn decrement. Restriction distinguishes Attack and Skill and causes 3 external backlash damage only if its source survives the card.
- Enemy identities receive explicit realm HP scaling of 1 + 0.42 × realm index. The Cloud heavy hit has separately authored damage scaling 26 + 3 × realm index. Player upgrades never scale enemy damage. No player action secretly changes a committed boss action; the announced next action changes only when the current action completes.

## Pursuit and committed play history

- `Combat.playHistory` records one entry for each validated and paid player card: turn, uid, definition, path, rules kind, actual paid cost, and one-based ordinal within the turn. Conditions snapshot prior entries after validation/payment and before appending the current card. Choice continuations retain that snapshot.
- Wind Slash: cost 1, damage 5, +3 if any earlier Wind card was committed this turn. Wind Step: cost 0, next Wind card this turn costs 1 less. Chasing Blade: cost 1, damage 4, +4 only as the exact third committed card. Flowing Guard: cost 1, Armor 4, +4 only when the immediately previous card was an Attack. Printed grade upgrades add separately. Pursuit changes the existing packet; it never adds a second hit or a second Strength application.
- The next-Wind discount stacks by the effect’s printed amount, survives other paths, floors cost at zero, and is consumed by the next committed Wind card even when that card already costs zero. It expires at End Player Turn. Hover, selection cancellation, invalid targets, failed plays, and previews neither spend discounts nor append history.
- Triggered effects/copies, active-discard effects, damage hits, draws, generation, and summon actions do not count as new player card plays. A generated or recovered card counts once when actually played. Heart Demon is a playable Status card and counts normally.
- Wisdom Hidden Schemes retains the four old discard-card IDs (`swallow-slip`, `ragged-banner`, `empty-sleeve`, `sky-unbound`) with Wisdom ownership. Calculation and Deduction are archetype vocabulary for draw/search/recovery/Scry/Reorder; no extra resource was added.

## Temporary Status cards

All six definitions are category `status`, combat-only, grade 0, never upgraded, and excluded from permanent decks, rewards, purchases, and inheritance.

| Card | Exact hook and lifecycle |
| --- | --- |
| Qi Disorder | Unplayable hand clog. Natural discard moves it to Discard normally. |
| Meridian Disruption | On Draw, lose 1 current Dao Yuan, floor 0; then Exhaust. |
| Internal Injury | Unplayable. While in hand at End Player Turn, lose 2 HP directly; then Exhaust. |
| Heart Demon | Pay 1 Dao Yuan to play; no other effect; Exhaust. |
| Scorched Meridian | On Draw, take 2 External non-Attack damage, respecting normal prevention; then Exhaust. |
| Cloud Obscuration | On Draw, gain 1 Weak for the current player turn; then Exhaust. |

- Draw hooks fire **before** hand overflow. A drawn automatic-Exhaust status does not occupy a hand slot. Directly adding, generating, searching, or recovering a card into Hand is not Draw and does not fire its Draw hook.
- All end-of-turn hand hooks happen before natural discard. Each eligible instance triggers once at that boundary, including eligible cards drawn by an Exhaust reaction during the boundary. An Internal Injury already overflowed to Discard does not trigger from that zone.
- Auto-Exhaust uses the same real Exhaust operation and triggers Refinement. It may cause a finite chain of further draws and Exhausts. Player death stops benefits and pending actions; healing cannot resurrect the player.
- Status insertion into Draw shuffles that pile with the combat RNG. Preview marks hidden insertion/draw results uncertain without consuming actual RNG. Status cleanup removes every status from Hand/Draw/Discard/Exhaust and the resolving zone at terminal combat; cleanup itself is not a new Exhaust event.

## Cloud action contract and warnings

- The exact repeating cycle is Setup (two Wisps + one Void Image/Dodge) → Pressure (8 Attack + one Cloud Obscuration shuffled into Draw) → Command (each living Wisp hits for base 3 + printed bonus 2) → Warning (no damage) → Heavy (26 + 3 × realm index, only half current Armor available).
- Cloud-bound Wisps show **Await Command** and take no independent normal actions while a Cloud Beastmaster lives. This explicit balance decision keeps the two-Wisp heavy phase at base 26 + 3 + 3 = 32, before defenses. Standalone/Brood Wisps retain ordinary intents and resume them if their master dies.
- A boss Attack action triggers one base-3 follow-up from each living Wisp **after the entire action**, not after each hit. Follow-up packets do not recursively trigger this rule. Command is a special action, not a boss Attack, and cannot also trigger follow-ups. Dead sources cannot perform queued follow-ups.
- Void Image consumes one positive External hit, whether Attack or non-Attack. Direct HP Loss bypasses it. Cloud sharing sends 25% of post-Dodge incoming damage to living Wisps, distributes integer remainders in creation order, and never recursively shares or redistributes overkill. Each real Wisp death grants its living master 4 Armor once.
- Half-Armor is distinct from Armor Pierce and complete Armor bypass. Blocking capacity is `floor(currentArmor × 0.5)`. Only the absorbed amount is consumed: 30 damage against 20 Armor blocks 10, loses 20 HP, and leaves 10 Armor. Other damage modifiers and defensive reactions retain their existing order.
- Warning explicitly announces the next Heavy’s realm-adjusted amount, half-Armor rule, current living beast count, and potential combined raw damage. Executing Warning causes no damage and advances to a full player turn before Heavy. Ordinary unannounced future intents remain hidden.

## Inspection API and diagnostic evidence

- `pursuitState(state, card)` returns the three condition booleans plus `condition`, `met`, `bonus`, `nextOrdinal`, and optional `previousPlay` without mutation.
- `enemyIntentThreat(state, enemyId)` returns `{warning, main, hits, followups, followupTotal, total, armorFraction?}`. Its only future-action exception is the explicitly announced Cloud Warning.
- `describeEnemyIntent(state, enemyId, locale)` describes the entire currently committed action, including Status insertion, Command, follow-ups and the explicit warning. `enemyAttackValue` includes authored realm scaling and current source attack modifiers.
- `previewEnemyAction` resolves one committed enemy action on a clone using **current defenses**, excluding the player end-turn decay and other enemy actions. It returns known HP/Armor/hits and uncertainty. It is an immediate-action diagnostic, not a promise about the whole upcoming enemy phase.
- All generated card, power, combat-event, playable-reason and intent text supports `en`, `zh-CN`, and `vi`. Numeric grade presentation is a UI preference and does not alter resolver arithmetic.
- The pre-change baseline is reproducible in `artifacts/revision/cloud-v1-baseline.ts` against source extracted from the archived v1 resolver. Its paired 64-seed report uses a legal grade-0 12-card deck at 72 HP. Strike-only boss rush lost 64/64; defense-and-board won 64/64 (mean final HP 48.11). This specific diagnostic **does not reproduce** the reported easy Strike rush. Scripted policies are diagnostics, not human win-rate estimates.

## Explicit play targets and Scarlet Requiem

- Every `CardDef.target` declares `self`, `enemy`, `allEnemies`, `randomEnemy` or `none`. Pure `validateCardPlay` checks the target before resource costs. A mismatch returns the identical combat state: no payment, RNG, history, discount or zone change. Single-enemy cards require an explicit living enemy; self permits player/omitted target, none requires omission, and AoE/random permit omission or a living enemy. `playCard`, previews and UI actions share this boundary. Unmigrated combat-version2 actions are rejected until migration.
- Scarlet Requiem applies its printed Bleeding and single damage packet, then normal Exhaust. It has no intrinsic lifesteal or heal at any grade. Independent passives such as an Exhaust-triggered heal remain independent effects.

## Permanent decks, rewards and transactions

- There is **no maximum permanent deck size**. Rewards and purchases append the chosen instance without forcing or secretly performing a replacement. Starting remains five Strike, five Guard and two selected techniques; no Basic is automatically removed. The independent four-Divine limit and ten-card hand limit remain.
- Realm values12/14/16/18/20 are **permanent-removal floors**. A legitimate twelve-card deck may advance unchanged below the new realm floor. It cannot remove further cards until the final deck meets the current floor. This grandfathering is accepted by save validation; advancing never forces filler or restarts a run.
- Every reward can be skipped, including Divine and foundation offers. Five ordinary choices permit zero or one acquisition. Optional foundation rounds may be offered for the shortfall; Skip leaves all remaining foundation rounds. Starting drafts remain the two explicit starting selections.
- `canRemovePermanentCards` / `removePermanentCards` validate all requested UIDs, sale quota, funds, additions and the **final** deck of a batch or swap before any mutation. Invalid operations leave deck, gold and counters unchanged. Merchant sales delegate to this boundary; three total sales remain the visit limit. A swap at the floor is evaluated atomically, without an invalid intermediate smaller deck.
- `ECONOMY` configures per-card override/category/rarity/grade prices without visit RNG. No Divine purchases. Merchant upgrades cost35+10×realm for the first and70+15×realm for the second; a pure quote binds run/revision/card UID/cost. Rest permits one free upgrade or `min(missing HP, floor(max HP×0.25))` healing. Preview/cancel spends nothing.

## Progression receipts and compatibility

- The26-node route contains10 normal,3 Elite,5 Tribulations and8 utility visits. Realm lengths are5/5/5/5/6; minor stage is `floor(depth×4/realmLength)`, capped at3. Initial depth0→1 in a five-node realm stays Early; depth1→2 first enters Middle. The UI receives next choices/hints and durable current/visited context.
- A minor-stage receipt is created only after safely resolving a node and crossing a stage boundary. Its additional HP, maxHP, energy, grade and currency grants are explicitly zero. Its durable ID/read acknowledgement consumes no RNG. Only the latest receipt can be presented as unread; acknowledging a later major never resurfaces older minor notices, while the historical records remain intact. It does not pretend that a stage marker grants a major breakthrough package.
- Major victory commits real growth once, then stores a receipt separately from pending reward choices. First-four packages add12 maxHP, capped30% healing of the new maximum, gold80/95/110/125 and the actual realm energy/grade change; final Ascension grants140 gold and opens no further realm. `continueBreakthrough` changes only the durable receipt view; repeated Continue cannot repay grants or regenerate offers. `pendingChoices.count` means displayed options; `maxAcquisitions:1` and `roundsRemaining` distinguish optional acquisitions from choices. Terminal retirement closes pending receipts.
- Numeric grades1–8, letters F/E/D/C/B/A/S/SS and traditional Ding–Tian are display choices over mechanical grade0–7. English/numeric are defaults; explicit settings persist without changing rules, costs, deck order or RNG. UI-supplied visible active time is distinct from bot compute time and imported legacy wall time.
- Frozen v1 remains available at `/legacy/v1/index.html` with its original storage. Explicit new-version choice preserves original envelopes/archive and compatible meta/settings; it never converts an active v1 fight to new rules.
- Local rules0.2 saves migrate in memory to0.3, retaining resolved HP/RNG/zones/owned IDs/paid history and stored offers. Exact old v2 primary/mirror/head/terminal bytes are archived before the first rewritten commit; archive failure leaves originals untouched. Missing receipt history becomes empty rather than inventing past grants. Only queued Scarlet-owned effects are normalized and its own old heal dropped; independent passives remain. A persisted notice identifies snapshot continuation. Migrated combat is explicitly rejected by opening-config replay; an old seed is not promised to reproduce new rules.

These tunable values and passing engine tests do not establish human balance, pacing, editorial, audiovisual or commercial acceptance. Current evidence and remaining gates are in `REVISION_QA.md`.
