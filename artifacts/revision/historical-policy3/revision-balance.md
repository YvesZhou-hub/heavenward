# Human 0.2 paired balance diagnostics

Synthetic constructed diagnostic combat decks; these are not ordinary acquired builds or human playtests.

Identical seeds, base-card positions, deck size, grade sum, nominal merchant value, HP and Yuan across all builds at each realm. Card-specific Innate behavior remains active.

board-aware is the shared greedy visible-hand/committed-intent heuristic, including the value of removing visible Dodge; strike-spam plays only affordable Strike cards. Neither reads hidden draw order. No optimal-policy claim.

Policy 2 mistakenly valued a free probe into visible Dodge at zero, ending turns with playable Flying Swords. Policy 3 corrects that public-board valuation. The first report is preserved as revision-balance-policy2.json; this is a policy correction, not a game balance change.

| Policy | Combats | Wins | Losses | Incomplete | Mean player turns | Mean HP lost | Mean actions |
|---|---:|---:|---:|---:|---:|---:|---:|
| strike-spam | 240 | 80 | 160 | 0 | 7.08 | 61.33 | 18.94 |
| board-aware | 240 | 223 | 17 | 0 | 5.41 | 20.93 | 26.75 |

| Build | Realm index | Encounter | Policy | Wins / runs | Mean turns | Mean HP lost | Mean remaining HP | Mean enemy HP lost | Mean Armor absorbed | Mean actions |
|---|---:|---|---|---:|---:|---:|---:|---:|---:|---:|
| pure-sword | 0 | normal | strike-spam | 8 / 8 | 3.63 | 12.25 | 59.75 | 28 | 0 | 9.63 |
| pure-sword | 0 | normal | board-aware | 8 / 8 | 2.5 | 4.75 | 67.25 | 28 | 2.5 | 10.38 |
| pure-sword | 0 | elite | strike-spam | 0 / 8 | 6 | 72 | 0 | 45.13 | 0 | 17.75 |
| pure-sword | 0 | elite | board-aware | 8 / 8 | 4.88 | 25.88 | 46.13 | 56 | 13.13 | 23.13 |
| pure-sword | 0 | cloud | strike-spam | 0 / 8 | 10 | 72 | 0 | 73.25 | 0 | 29 |
| pure-sword | 0 | cloud | board-aware | 8 / 8 | 8.63 | 39.13 | 32.88 | 129.5 | 10.75 | 42.63 |
| pure-sword | 2 | normal | strike-spam | 8 / 8 | 4.63 | 19.75 | 76.25 | 51 | 0 | 10.38 |
| pure-sword | 2 | normal | board-aware | 8 / 8 | 1.63 | 0 | 96 | 51 | 3.75 | 8.5 |
| pure-sword | 2 | elite | strike-spam | 0 / 8 | 8 | 96 | 0 | 93.63 | 0 | 20.63 |
| pure-sword | 2 | elite | board-aware | 8 / 8 | 2.63 | 4.13 | 91.88 | 103 | 9.38 | 20.5 |
| pure-sword | 2 | cloud | strike-spam | 0 / 8 | 10.25 | 96 | 0 | 109.25 | 0 | 25.63 |
| pure-sword | 2 | cloud | board-aware | 8 / 8 | 5.75 | 16.25 | 79.75 | 209.5 | 12.13 | 43.63 |
| pure-fire | 0 | normal | strike-spam | 8 / 8 | 3.63 | 12.25 | 59.75 | 28 | 0 | 9.63 |
| pure-fire | 0 | normal | board-aware | 8 / 8 | 2.63 | 4.13 | 67.88 | 28 | 3.13 | 8.13 |
| pure-fire | 0 | elite | strike-spam | 0 / 8 | 6 | 72 | 0 | 46 | 0 | 18.13 |
| pure-fire | 0 | elite | board-aware | 8 / 8 | 6.38 | 40.13 | 31.88 | 56 | 24.38 | 22.25 |
| pure-fire | 0 | cloud | strike-spam | 0 / 8 | 10 | 72 | 0 | 76.88 | 0 | 29.5 |
| pure-fire | 0 | cloud | board-aware | 0 / 8 | 11.63 | 72 | 0 | 117.25 | 15.75 | 43.25 |
| pure-fire | 2 | normal | strike-spam | 8 / 8 | 4.63 | 19.75 | 76.25 | 51 | 0 | 10.38 |
| pure-fire | 2 | normal | board-aware | 8 / 8 | 2.38 | 0 | 96 | 51 | 6 | 8.63 |
| pure-fire | 2 | elite | strike-spam | 0 / 8 | 8 | 96 | 0 | 93.63 | 0 | 20.63 |
| pure-fire | 2 | elite | board-aware | 8 / 8 | 4.5 | 12.63 | 83.38 | 103 | 24.88 | 18.38 |
| pure-fire | 2 | cloud | strike-spam | 0 / 8 | 10.25 | 96 | 0 | 108.63 | 0 | 25.5 |
| pure-fire | 2 | cloud | board-aware | 8 / 8 | 9.75 | 34.5 | 61.5 | 241 | 29.13 | 40.88 |
| sword-strength | 0 | normal | strike-spam | 8 / 8 | 3.63 | 12.25 | 59.75 | 28 | 0 | 9.63 |
| sword-strength | 0 | normal | board-aware | 8 / 8 | 2.13 | 3.38 | 68.63 | 28 | 1.88 | 10.63 |
| sword-strength | 0 | elite | strike-spam | 0 / 8 | 6 | 72 | 0 | 46 | 0 | 18.13 |
| sword-strength | 0 | elite | board-aware | 8 / 8 | 4.5 | 26.75 | 45.25 | 56 | 13.75 | 21.38 |
| sword-strength | 0 | cloud | strike-spam | 0 / 8 | 10 | 72 | 0 | 76.88 | 0 | 29.5 |
| sword-strength | 0 | cloud | board-aware | 8 / 8 | 7.13 | 37.88 | 34.13 | 119.5 | 3.13 | 34.63 |
| sword-strength | 2 | normal | strike-spam | 8 / 8 | 4.63 | 19.75 | 76.25 | 51 | 0 | 10.38 |
| sword-strength | 2 | normal | board-aware | 8 / 8 | 1.25 | 0 | 96 | 51 | 1.5 | 9.38 |
| sword-strength | 2 | elite | strike-spam | 0 / 8 | 8 | 96 | 0 | 93.63 | 0 | 20.63 |
| sword-strength | 2 | elite | board-aware | 8 / 8 | 2.38 | 2.5 | 93.5 | 103 | 9.5 | 17.38 |
| sword-strength | 2 | cloud | strike-spam | 0 / 8 | 10.25 | 96 | 0 | 109.25 | 0 | 25.63 |
| sword-strength | 2 | cloud | board-aware | 8 / 8 | 4.63 | 0 | 96 | 205 | 10.5 | 30.5 |
| wisdom-wind | 0 | normal | strike-spam | 8 / 8 | 3.63 | 12.25 | 59.75 | 28 | 0 | 9.63 |
| wisdom-wind | 0 | normal | board-aware | 8 / 8 | 4 | 5.38 | 66.63 | 28 | 10.63 | 12.5 |
| wisdom-wind | 0 | elite | strike-spam | 0 / 8 | 6 | 72 | 0 | 46 | 0 | 18.13 |
| wisdom-wind | 0 | elite | board-aware | 8 / 8 | 8.25 | 54.5 | 17.5 | 56 | 32.5 | 29.25 |
| wisdom-wind | 0 | cloud | strike-spam | 0 / 8 | 10 | 72 | 0 | 76.88 | 0 | 29.5 |
| wisdom-wind | 0 | cloud | board-aware | 0 / 8 | 12.38 | 72 | 0 | 99.5 | 20.63 | 47.88 |
| wisdom-wind | 2 | normal | strike-spam | 8 / 8 | 4.63 | 19.75 | 76.25 | 51 | 0 | 10.38 |
| wisdom-wind | 2 | normal | board-aware | 8 / 8 | 2.13 | 1.5 | 94.5 | 51 | 4.5 | 10.5 |
| wisdom-wind | 2 | elite | strike-spam | 0 / 8 | 8 | 96 | 0 | 93.63 | 0 | 20.63 |
| wisdom-wind | 2 | elite | board-aware | 8 / 8 | 4.38 | 10 | 86 | 103 | 26 | 24.75 |
| wisdom-wind | 2 | cloud | strike-spam | 0 / 8 | 10.25 | 96 | 0 | 108.63 | 0 | 25.5 |
| wisdom-wind | 2 | cloud | board-aware | 8 / 8 | 9.88 | 33.25 | 62.75 | 241 | 32.25 | 54.38 |
| sword-refinement | 0 | normal | strike-spam | 8 / 8 | 3.63 | 12.25 | 59.75 | 28 | 0 | 9.63 |
| sword-refinement | 0 | normal | board-aware | 8 / 8 | 3 | 3.13 | 68.88 | 28 | 7.88 | 14.25 |
| sword-refinement | 0 | elite | strike-spam | 0 / 8 | 6 | 72 | 0 | 46 | 0 | 18.13 |
| sword-refinement | 0 | elite | board-aware | 8 / 8 | 6.75 | 31.38 | 40.63 | 56 | 37.63 | 33.38 |
| sword-refinement | 0 | cloud | strike-spam | 0 / 8 | 10 | 72 | 0 | 76.88 | 0 | 29.5 |
| sword-refinement | 0 | cloud | board-aware | 7 / 8 | 13.88 | 65.5 | 6.5 | 146.75 | 31.38 | 71.88 |
| sword-refinement | 2 | normal | strike-spam | 8 / 8 | 4.63 | 19.75 | 76.25 | 51 | 0 | 10.38 |
| sword-refinement | 2 | normal | board-aware | 8 / 8 | 1.75 | 0.25 | 95.75 | 51 | 2.75 | 11.63 |
| sword-refinement | 2 | elite | strike-spam | 0 / 8 | 8 | 96 | 0 | 93.63 | 0 | 20.63 |
| sword-refinement | 2 | elite | board-aware | 8 / 8 | 3.88 | 6.38 | 89.63 | 103 | 26.63 | 27 |
| sword-refinement | 2 | cloud | strike-spam | 0 / 8 | 10.25 | 96 | 0 | 109.25 | 0 | 25.63 |
| sword-refinement | 2 | cloud | board-aware | 8 / 8 | 6.75 | 20.63 | 75.38 | 218.5 | 26.88 | 51 |

## Actual ordinary openings

- pure-sword: seed 4, river-spirit, won; commitCombat reached reward.
- pure-fire: seed 1, stone-guardian, won; commitCombat reached reward.
- sword-strength: seed 76, road-bandit, won; commitCombat reached reward.
- wisdom-wind: seed 116, road-bandit, won; commitCombat reached reward.
- sword-refinement: seed 192, blood-moth, lantern-acolyte, won; commitCombat reached reward.

## Limits

- Only two fixed legal budget points and three enemy definitions are compared.
- Policies are greedy and do not search all future legal sequences; a weak result can reflect the policy as well as the build.
- The Strike-only baseline is deliberately naive and does not test every Basic Mastery strategy.
- Constructed realm-2 decks have equal grades and prices, but their acquisition paths are not simulated.
- ordinaryOpenings proves actual offer acquisition and the first mandatory combat for each starting pair; it is not a complete run or proof that expanded diagnostic decks are routinely acquired.

computeMs is machine runtime only. Player turns and committed actions are measured; human minutes are not estimated.

Reproduce: `npx tsx scripts/revision-balance.ts 8`. Complete rows, deck budgets and deterministic action/resolution hashes are in `artifacts/revision-balance.json`.

## Interpretation

After correcting only the visible-Dodge policy, the board-aware policy wins 223/240 fights versus 80/240 for the deliberately naive Strike-only baseline. This does not prove that every Basic Mastery strategy is weak.

At Core Formation against Cloud, Sword/Strength wins 8/8 with 4.63 mean turns and 0 HP lost, versus Pure Sword at 5.75 turns and 16.25 HP lost. This fixed budget supports a measurable synergy.

Sword/Refinement also wins 8/8 Core Cloud fights, but needs 6.75 mean turns and 51 actions. It is viable in this comparison, while slower than Pure Sword; no universal hybrid advantage is claimed.

The unexpanded 12-card Qi decks for Fire and Wisdom/Wind lose all eight Cloud fights. Those deliberately minimal decks do not represent the stronger deck an ordinary run can acquire before its Tribulation.

The sample does not establish enjoyable difficulty or human completion time. The policy remains greedy, the expanded decks are constructed, and only three enemy definitions were compared.
