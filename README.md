# HEAVENWARD · 问天

A cultivation roguelike deckbuilder in English (default), 简体中文 and Tiếng Việt. Build one mortal life through five realms and twenty cultivation stages. The fifth Tribulation ends the Human Realm in Ascension.

[Play online](https://heavenward.vercel.app). Version history: [CHANGELOG.md](CHANGELOG.md). Verified release status and exact deployment are recorded in [deployment evidence](docs/DEPLOYMENT.md); implementation, test evidence and remaining human release gates are in [revision status](docs/REVISION_2026_09_14.md) and [revision QA](docs/REVISION_QA.md). This is an integrated playable revision, not commercial V1.0 acceptance.

## Run locally

Source repository: [YvesZhou-hub/heavenward](https://github.com/YvesZhou-hub/heavenward). See [contribution, versioning and release conventions](CONTRIBUTING.md) and the [documentation index](docs/README.md). GitHub CI runs the core checks on main pushes and pull requests; it does not publish to Vercel.

Use Node24.15.0 (`.nvmrc`) and npm:

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:3210>, or use **Start Heavenward.command** on this Mac. For the static production export, stop the development server, run `npm run build`, then `npm start`. No API key, account, database or runtime AI is needed.

## Play

Start with five Strikes, five Defenses and two Dao Arts chosen from separate five-card drafts. The Dao Road reveals completed history and immediately reachable branches. The authored route has26 chosen nodes:10 normal fights,3 Elites,5 Tribulations and8 utility visits.

Click a card to select it. Drag SELF cards onto your portrait or double-click them; drag ENEMY cards onto a living enemy. Double-clicking an enemy-target card enters target selection. AoE and untargeted cards retain their declared target modes. A blank drop or Esc cancels. Unaffordable cards remain draggable; failed target/cost validation spends nothing. Touch drag and target taps use the same rules.

Keys1–9/0 select cards, Tab focuses a target, Enter confirms the focused control, E ends the turn and Esc cancels. The eye button opens full card/keyword inspection. Piles and the permanent deck are searchable; hidden Draw order stays hidden. Settings offer numeric1–8, letterF–SS or traditional grade names without changing mechanics.

Normal rewards offer exactly five distinct cards: take zero or one. Permanent decks have **no maximum size** and rewards never force replacements. Realm removal floors12/14/16/18/20 govern sales/removal; a smaller existing deck can advance and decline every reward. Strike and Defense remain valid permanent choices, including upgraded Basic support builds.

Merchant and Rest upgrades use visual selection → actual before/after comparison → confirmation. Merchants allow two increasingly priced upgrades and three sales per visit. Rest offers one mutually exclusive capped25% heal or free eligible upgrade. Breakthrough receipts show actual granted growth separately from optional Divine/foundation choices. Divine Abilities are ungraded, drawn-and-paid powers obtained only from eligible Tribulations, with four Human Realm slots.

Strength caps at10 per Attack hit. Wisdom contains Calculation and Hidden Schemes; Wind rewards Gale/Pursuit sequencing. Six temporary Status cards expire after combat. The Cloud-Void Beastmaster has visible beast pressure, Commands and a real warning before its heavy attack. Scarlet Requiem costs3, deals16 base damage, applies6 Bleeding and Exhausts; it has no intrinsic healing.

The114 definitions include107 permanent designs, one Flying Sword Token and six temporary Status cards. Thirteen Paths and cross-Path freedom remain. Approved illustrations are preserved; newer cards use recorded original-art aliases. Local fonts, synthesized audio and reduced-motion controls are included.

## Verify

```sh
npm run typecheck
npm run lint
npm test
npm run validate:content
npm run build
```

Install browser engines if needed: `npx playwright install chromium firefox webkit`. Test the static build in separate terminals:

```sh
node scripts/serve-static.mjs 3212
E2E_BASE_URL=http://127.0.0.1:3212 npx playwright test --workers=3
# Run profiling after other browser workloads finish:
npm run qa:performance
```

[QA evidence](docs/REVISION_QA.md) distinguishes real browser actions, controlled UI fixtures, constructed combat diagnostics, ordinary bot runs and unrun human sessions. Human fun, economy and60–100-minute pacing targets are not established by bot speed.

## Saves and release

Saves belong to each browser origin. Localhost and the public website have separate data. Do not clear site storage as routine repair; export diagnostics first. Checksums, mirrors, terminal markers and concurrent-tab transactions protect committed progress.

Public0.1 runs remain available in the preserved `/legacy/v1/index.html` build. Local0.2 snapshots migrate to current rules without replaying resolved outcomes; original bytes are archived before overwrite, and the UI identifies snapshot continuation. IDs, HP and RNG are preserved. Old pending Scarlet-owned healing is removed; independent passives remain valid. An old seed is not claimed to reproduce a different rules version.

Deployment uses the linked Vercel project and static Build Output workflow from a tagged `main`: `npm run deploy:prepare`, `vercel deploy --prebuilt --prod --yes --scope yves-projects-de611e27`, `npm run deploy:record`, then `npm run deploy:verify`. Only the prepared static payload is deployed. The full procedure, including rollback, is in [CONTRIBUTING.md](CONTRIBUTING.md#releasing-and-deploying).

See [rules decisions](docs/RULE_DECISIONS.md), [content guide](docs/CONTENT_GUIDE.md), [art provenance](docs/ART_BIBLE.md), [known issues](docs/KNOWN_ISSUES.md) and [remaining release gates](docs/REVISION_NEXT_ACTIONS.md).
