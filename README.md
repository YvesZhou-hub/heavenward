# HEAVENWARD · 问天

[![CI](https://github.com/YvesZhou-hub/heavenward/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/YvesZhou-hub/heavenward/actions/workflows/ci.yml)
[![Code license: Apache-2.0](https://img.shields.io/badge/code-Apache--2.0-blue)](LICENSE)
[![Art: all rights reserved](https://img.shields.io/badge/art-all%20rights%20reserved-lightgrey)](LICENSE-ASSETS.md)
[![Play online](https://img.shields.io/badge/play-heavenward.vercel.app-c8a46b)](https://heavenward.vercel.app)

A cultivation roguelike deckbuilder for the browser, in English, 简体中文 and Tiếng Việt. Build one mortal life through five realms and twenty cultivation stages; the fifth Tribulation ends the Human Realm in Ascension.

**[Play at heavenward.vercel.app](https://heavenward.vercel.app)**. No account or download is needed, and progress is saved in your browser.

> **Status:** playable preview of the Human Realm. Balance, pacing and native-language review are still in progress; see [known issues](docs/KNOWN_ISSUES.md) and the [changelog](CHANGELOG.md).

## How to play

### A run

You start with five Strikes, five Defenses and two Dao Arts chosen from separate five-card drafts. The Dao Road shows your completed history and the branches you can reach next. A full route has 26 chosen nodes: 10 normal fights, 3 Elites, 5 Tribulations and 8 utility visits.

### Controls

- Click a card to select it. Drag self-target cards onto your portrait or double-click them; drag enemy-target cards onto a living enemy. Double-clicking an enemy-target card enters target selection.
- Area and untargeted cards keep their own target modes. Dropping on empty space or pressing Esc cancels. A card you cannot afford can still be dragged, and a failed play spends nothing. Touch drags and taps follow the same rules.
- Keys 1–9 and 0 select cards, Tab focuses a target, Enter confirms, E ends the turn and Esc cancels.
- The eye button opens full card and keyword details. Piles and your permanent deck are searchable, while the draw order stays hidden. Settings switch grade names between numbers 1–8, letters F–SS and traditional names without changing the rules.

### Rewards and growth

- Normal rewards offer five distinct cards; take one or none. Permanent decks have **no maximum size**, and rewards never force a replacement. Realm minimums of 12/14/16/18/20 cards limit only selling and removal.
- Merchants and Rest sites show a before/after comparison before an upgrade. Merchants allow two upgrades at rising prices and three sales per visit; Rest offers either a heal of up to 25% or a free upgrade.
- Breakthrough receipts show the growth you received. Divine Abilities come only from eligible Tribulations, have no grade and fill up to four Human Realm slots.

### Content

114 card definitions across thirteen Paths: 107 permanent designs, one Flying Sword Token and six temporary Status cards, with free cross-Path building. Strength caps at 10 per Attack hit, Wisdom rewards Calculation and Hidden Schemes, and Wind rewards Gale and Pursuit sequencing. Unspent Armor halves at the start of your next turn. The game includes local fonts, synthesized audio and reduced-motion settings.

## Getting started

Requirements: Node.js 24.15.0 (see `.nvmrc`) and npm.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:3210>. On macOS you can double-click **Start Heavenward.command** instead.

For the static production export, stop the development server, then run `npm run build` and `npm start`. No API keys, accounts, database or runtime AI services are required.

## Testing

```sh
npm run typecheck
npm run lint
npm test
npm run validate:content
npm run build
```

`npm run lint` also checks that every source file carries the license header. For browser tests, install the engines once with `npx playwright install chromium firefox webkit`, then test the static build from two terminals:

```sh
node scripts/serve-static.mjs 3212
E2E_BASE_URL=http://127.0.0.1:3212 npx playwright test --workers=3
# After other browser workloads finish:
npm run qa:performance
```

[Revision QA](docs/REVISION_QA.md) explains what the automated checks do and do not establish.

## Saves

Saves live in each browser's local storage, so `localhost` and the public website keep separate progress. Checksums, mirrored snapshots and cross-tab coordination protect committed progress. If the game reports a storage problem, export the diagnostics before clearing any site data.

Lives started in version 0.1 remain playable in the preserved build at `/legacy/v1/index.html`. Local 0.2 saves migrate to the current rules as snapshot continuations: the original bytes are archived first, and IDs, HP and random state are preserved.

## Project structure

```text
app/             Next.js entry point (static export)
src/game/        Rules engine, content, runs, saves and localization
src/components/  React interface
public/art/      Game art (all rights reserved, see LICENSE-ASSETS.md)
tests/           Vitest unit tests and Playwright browser tests
scripts/         Build, QA, license and deployment tooling
docs/            Rules, content, operations and release records
```

Start with the [documentation index](docs/README.md) to find the current rules, content guide and art bible.

## Contributing

Bug reports, gameplay suggestions and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, checks and versioning rules, and follow the [code of conduct](CODE_OF_CONDUCT.md). Releases are listed in the [changelog](CHANGELOG.md).

## Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md), not in public issues.

## License

- **Source code** is licensed under the [Apache License, Version 2.0](LICENSE); see also [NOTICE](NOTICE).
- **Game art, the game icon, art source files and design briefs** are not open source. All rights are reserved; see [LICENSE-ASSETS.md](LICENSE-ASSETS.md).
- **Third-party** libraries, fonts and icons keep their own licenses, listed in [docs/DEPENDENCY_LICENSES.json](docs/DEPENDENCY_LICENSES.json).
