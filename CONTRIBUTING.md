# Working on HEAVENWARD

Keep approved artwork, the existing stack and unrelated work intact. Runtime gameplay uses no API keys or generative service.

## Setup

Use Node from `.nvmrc` and install with `npm ci`. `npm run dev` serves <http://127.0.0.1:3210>; **Start Heavenward.command** does the same on this Mac.

## Where to change things

| Change | Source of truth | Keep in sync |
|---|---|---|
| Balance numbers (hand size, draw, energy, thresholds, caps) | `src/game/rules.ts` | `docs/RULE_DECISIONS.md` |
| Cards, enemies, encounters, summons, Paths | `src/game/content.ts` | `src/game/content-vi.json`, `docs/CONTENT_GUIDE.md` |
| Combat resolution and turn order | `src/game/combat.ts` | `docs/RULE_DECISIONS.md`, `tests/combat*.test.ts` |
| Road, rewards, economy, progression | `src/game/run.ts` | `tests/run.test.ts` |
| Save format and migrations | `src/game/save.ts` | `tests/save.test.ts`, [Versioning](#versioning) |
| Interface and rules copy | `src/game/i18n.ts`, `ui-copy.ts`, `combat-text.ts`, `status-help.ts`, `encyclopedia.ts`, `src/components/FieldGuide.tsx` | `docs/LOCALIZATION_GLOSSARY.md` |
| Components and layout | `src/components/`, `app/globals.css` | Browser suite and visual baselines |
| Illustrations | `public/art/` | `docs/ART_BIBLE.md`, asset manifests |

[docs/README.md](docs/README.md) indexes every document and marks which ones are historical.

## Branches and commits

Never commit directly to `main`. Make one focused branch per change, named `<type>/<short-description>`, for example `balance/armor-decay`.

Commit messages and pull request titles use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `type(scope): summary`.

- Types: `feat`, `fix`, `balance` (numbers only), `refactor`, `perf`, `test`, `docs`, `chore`, `ci`.
- Scopes: `combat`, `run`, `content`, `save`, `ui`, `i18n`, `art`, `deploy`, `repo`.
- Example: `feat(combat): halve unspent player Armor at turn start`.

Do not force-push `main` or other shared history.

## Pull requests

Open a pull request against `main` and fill in the template: the resulting behavior, the checks actually run, and save/localization impact. Add the matching label (`gameplay`, `balance`, `content`, `localization`, `save-compat`, `infrastructure`, `bug`, `documentation`); labels group the generated release notes.

The `Typecheck, lint, tests and build` CI check must pass. Pull requests are squash-merged, so the pull request title becomes the commit on `main`. Merge and production deployment require the repository owner's authorization.

## Required checks

Before a pull request, run `npm run typecheck`, `npm run lint`, `npm test`, `npm run validate:content` and `npm run build` (`npm run check` runs all but content validation). CI executes those same checks on `main` pushes and pull requests using pinned GitHub Actions with read-only repository permissions. It does not deploy.

Browser and visual checks remain separate: follow the README instructions for interface changes and inspect every intentional snapshot change. Never update baselines solely to make a check pass.

## Gameplay invariants

Changes to combat or card content must preserve deterministic resolution and rejected-action purity. Changes to persisted data need an explicit migration or compatibility path. UI and wording changes must cover English, Simplified Chinese and Vietnamese. Never report unavailable human/editorial sessions as completed.

## Versioning

Three identifiers change for different reasons:

- **Release version** — `version` in `package.json`, recorded in [CHANGELOG.md](CHANGELOG.md) and tagged `vX.Y.Z`. Bump the patch for fixes, balance and copy; bump the minor for new content or systems.
- **Rules/content identity** — `RULES_VERSION` and `CONTENT_VERSION` in `src/game/run.ts`, `CONTENT_VERSION` in `src/game/content.ts` and `RULES.version` in `src/game/rules.ts`. Saves and combat replays must match them exactly: changing one makes existing runs fail `validateSave` unless `src/game/save.ts` gains a migration with fixture tests. A rule tweak that keeps the persisted shape may keep the identity; say so in the changelog, because combat replays recorded before it no longer reproduce.
- **Save envelope** — `version` checked by `validateSave` in `src/game/save.ts`. Change it only with a migration.

## Changelog

Every player-visible or compatibility-relevant pull request adds a line under `## [Unreleased]` in `CHANGELOG.md`. A release moves those lines under a dated version heading.

## Releasing and deploying

Production is the linked Vercel project `heavenward` (scope `yves-projects-de611e27`), served at <https://heavenward.vercel.app>. Only the owner authorizes a release.

1. Merge the release pull request: `package.json` version bumped and the changelog section dated.
2. On an up-to-date `main`, run `npm ci`, the required checks, and the browser suite for interface changes.
3. Tag the release: `git tag -a vX.Y.Z -m "vX.Y.Z"` and `git push origin vX.Y.Z`.
4. Package and deploy the tested export:
   ```sh
   npm run deploy:prepare
   vercel deploy --prebuilt --prod --yes --scope yves-projects-de611e27
   npm run deploy:record
   npm run deploy:verify
   ```
   `deploy:record` fails unless production is READY and writes `artifacts/deployment/vercel-status.json`; `deploy:verify` compares the live site with the local payload.
5. Play a real combat turn on the live site, then record the deployment in `docs/DEPLOYMENT.md` through a `docs/deploy-vX.Y.Z` pull request.
6. Publish release notes: `gh release create vX.Y.Z --generate-notes --verify-tag`.

To roll back, run `vercel rollback <previous-deployment-url> --scope yves-projects-de611e27` with a deployment already recorded as verified, then repeat the live checks. See [docs/OPERATIONS.md](docs/OPERATIONS.md) for save-safe recovery.

## Repository hygiene

Commit source, `package-lock.json`, tests, required runtime assets and their provenance/licenses. Exclude real environment files, credentials, `node_modules`, `.next`, `out`, `.vercel` and generated recordings. Selected historical QA evidence is explicitly tracked; new diagnostics normally stay ignored unless intentionally retained for review. Do not upload real player save exports as fixtures or issue attachments.

Fresh clones already contain the approved runtime artwork and do not need asset generation. The historical `art:prepare` command defaults to an external source directory and is not part of installation or production build. Consult `docs/ART_BIBLE.md` and asset manifests before changing that pipeline; do not regenerate or replace approved illustrations as routine setup.

Keep Vercel account linkage and deployment credentials local. Repository visibility and collaborator access change only at the owner's explicit request.
