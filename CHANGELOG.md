# Changelog

Player-visible and compatibility-relevant changes, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Release numbers are the `package.json` version; see [Versioning](CONTRIBUTING.md#versioning) for how they relate to the save/replay identifiers.

## [Unreleased]

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

[Unreleased]: https://github.com/YvesZhou-hub/heavenward/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/YvesZhou-hub/heavenward/releases/tag/v0.3.0
