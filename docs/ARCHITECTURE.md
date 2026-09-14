# Architecture and operational decisions

## Boundaries

Next.js 16.3.5 + React 19.3.0 + TypeScript deliver one static-exported client application. There is no Next server, API route, authentication, model endpoint or required remote service. All game mutations pass through the domain modules; React renders committed state. This makes a future engine/front-end migration possible without rewriting the rules in UI components.

- `src/game/content.ts` contains stable, bilingual authored definitions. `types.ts` separates definitions from uniquely owned instances.
- `rules.ts` contains explicit tuning constants. `combat.ts` is a pure seeded transition system with a serializable resolution queue. Choices pause the queue; actual cards remain owned by a zone or `resolvingCard`. Preview runs the same resolver on a clone and suppresses unknown information.
- `run.ts` owns seeded offers, node eligibility, progression, deck/grade/Divine constraints, economy, terminals and content-only meta progression.
- `save.ts` validates the entire persisted payload, envelopes it with a checksum and coordinates revisions. `components/store.ts` presents stable React external-store snapshots and serializes UI commits.
- `replay.ts` replays a current-version combat from original `CombatConfig` plus recorded actions. It validates the exact expected state and RNG. Cross-version full-run migration/replay is not implemented.
- `Card.tsx` is shared by hand, offers, collection, piles, inspection and comparison. `Game.tsx` renders the phase machine. `BattleVfx.tsx` paints presentation-only canvas feedback with requestAnimationFrame; it neither advances gameplay RNG nor schedules React updates every frame.
- `audio.ts` synthesizes sound locally with Web Audio. Audio unlock is optional and never blocks starting a run. `i18n.ts`, bilingual `Text` definitions and status-help provide presentation copy independently of gameplay state.

## Persistence contract

The current first-release schema is version 1. The primary snapshot and mirror contain the same committed revision; a small head marker identifies authority. A terminal marker prevents an older active snapshot from reviving a completed life. Recovery never silently substitutes a different older revision or resets the player. Unknown versions and malformed shapes fail visibly. There was no earlier shipped schema, so no invented legacy migration exists.

Web Locks protects same-origin writers. Stale expected revisions reject a mutation and refresh the local snapshot. Browser storage events notify other tabs. Firefox can surface exceptions thrown inside native lock callbacks as page errors even when the outer promise is caught; the callback returns a discriminated result and errors are rethrown outside that native boundary. Without Web Locks, optimistic revision checks cannot guarantee atomic simultaneous writes; this remains a compatibility limit.

Commits have a UI action lock. A failed storage write leaves the prior committed snapshot visible and offers diagnostic export/retry. Permanent-death and Ascension history writes are idempotent. Diagnostics contain local gameplay/settings, not credentials; no credentials are required by this application.

## Build and assets

`npm ci` uses the lockfile. `npm run build` exports `out/`. The local static server binds only 127.0.0.1 and rejects traversal outside that directory. `npm start` uses port 3210; profiling uses 3211 to avoid the development origin. The launcher installs dependencies only when absent and opens the local game.

Fonts are self-hosted Fontsource subsets. First load needs web assets; after boot the engine remains usable offline. This is not an installed PWA and offline cold navigation/cache availability is not guaranteed. Failed decorative image/font requests leave CSS surfaces and readable system-font text; they do not interrupt rules or saves.

Image generation is a build-time activity only. Source PNGs and exact prompts/returned metadata are preserved in `assets/source`; `prepare-production-art.ts` crops reviewed atlas seams into individually addressable WebP assets and builds `art-index.json`. Rebuild from preserved sources with `npx tsx scripts/prepare-production-art.ts assets/source`. No live image generation is needed to play or build.

## Versioning and future work

Change schema/rules/content versions intentionally when their contracts change. Before a future schema ships, provide an explicit old→new migration, fixtures for the old shipped states, validation and failure-safe recovery. A checksum detects accidental corruption, not deliberate local editing. Server-authoritative anti-cheat/cloud saves are outside this local first-release architecture.

Current content shares encounter identities and road cadence across realms. Those decisions are visible content/tuning work, not a hidden adaptive mechanism. Later Spirit/Immortal World gameplay is deliberately future scope; Human Ascension ends the playable route.
