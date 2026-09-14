# Changelog

Player-visible and compatibility-relevant changes, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Release numbers are the `package.json` version; see [Versioning](CONTRIBUTING.md#versioning) for how they relate to the save/replay identifiers.

## [Unreleased]

## [0.3.1] - 2026-09-14

### Changed

- Unspent player Armor now halves, rounded down, at the start of your next turn instead of clearing (11 → 5 → 2 → 1 → 0). Enemy Armor still resets when the enemy acts.
- The Armor keyword, the first Field Guide lesson and the first-combat tutorial hint describe the new rule in all three languages.

### Compatibility

- Rules/content identity stays `human-0.3.0`, so existing saves load unchanged; runs in progress use the new rule from their next turn.
- Combat replays recorded with 0.3.0 no longer reproduce, because turn-start Armor differs.

## [0.3.0] - 2026-09-14

Human Realm integrated revision and the first release tracked in this repository. Production: [heavenward.vercel.app](https://heavenward.vercel.app), recorded in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Added

- English, Simplified Chinese and Vietnamese in every flow.
- 114 card definitions: 107 permanent designs, one Flying Sword Token and six temporary Status cards across thirteen Paths.
- Explicit play targets with click, drag, double-click, keyboard and touch input; failed validation spends nothing.
- Durable breakthrough receipts, searchable piles and permanent deck, and selectable grade display.

### Changed

- Permanent decks have no maximum size; every reward can be skipped and realm floors restrict removal only.
- Merchant and Rest upgrades use a before/after comparison with confirmation.

### Compatibility

- Rules/content `human-0.3.0`, combat schema 3, save envelope 2.
- Local 0.2 saves migrate as snapshot continuations with the original bytes archived; 0.1 lives remain playable at `/legacy/v1/index.html`.

Full record: [docs/REVISION_2026_09_14.md](docs/REVISION_2026_09_14.md).

[Unreleased]: https://github.com/YvesZhou-hub/heavenward/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/YvesZhou-hub/heavenward/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/YvesZhou-hub/heavenward/releases/tag/v0.3.0
