# Contributing to Heavenward

Thanks for your interest in Heavenward. Bug reports, gameplay suggestions, translations and code changes are welcome. By participating you agree to follow the [code of conduct](CODE_OF_CONDUCT.md).

## Before you start

- **Bugs and ideas:** open an issue with the matching form. Check the [live build](https://heavenward.vercel.app) and existing issues first.
- **Larger changes** such as new mechanics, cards or systems: open an issue to agree on the direction before writing code.
- **Security problems:** do not open an issue; follow [SECURITY.md](SECURITY.md).

## Licensing of contributions

Source code is licensed under the [Apache License, Version 2.0](LICENSE). As described in Section 5 of that license, any contribution you intentionally submit is provided under the same license, without additional terms.

Game art, the game icon, art source files and design briefs are reserved; see [LICENSE-ASSETS.md](LICENSE-ASSETS.md). Please do not submit new or replacement art, audio recordings or third-party assets in a pull request. Propose them in an issue instead, so rights and provenance can be settled first.

Every first-party source file (`.ts`, `.tsx`, `.mts`, `.js`, `.mjs`, `.css`) starts with this header, and `npm run lint` fails without it:

```ts
// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0
```

Use `/* … */` comments in CSS. Generated files (`next-env.d.ts`) and the preserved build in `public/legacy/` are exempt.

## Development setup

Install Node.js from `.nvmrc` (24.15.0) and run `npm ci`. `npm run dev` serves <http://127.0.0.1:3210>; on macOS, **Start Heavenward.command** does the same. Runtime gameplay needs no API keys or generative services.

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
| Illustrations | `public/art/` (maintainers only) | `docs/ART_BIBLE.md`, asset manifests |

[docs/README.md](docs/README.md) indexes every document and marks which ones are historical.

## Branches and commits

Fork the repository, or use a branch if you have write access. Never commit directly to `main`. Make one focused branch per change, named `<type>/<short-description>`, for example `balance/armor-decay`.

Commit messages and pull request titles use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `type(scope): summary`.

- Types: `feat`, `fix`, `balance` (numbers only), `refactor`, `perf`, `test`, `docs`, `chore`, `ci`.
- Scopes: `combat`, `run`, `content`, `save`, `ui`, `i18n`, `art`, `deploy`, `repo`.
- Example: `feat(combat): halve unspent player Armor at turn start`.

Do not force-push `main` or other shared history.

## Pull requests

Open a pull request against `main` and fill in the template: the resulting behavior, the checks you actually ran, and the save/localization impact. Maintainers add a label (`gameplay`, `balance`, `content`, `localization`, `save-compat`, `infrastructure`, `bug`, `documentation`); labels group the generated release notes.

The `Typecheck, lint, tests and build` CI check must pass before merging. Pull requests are squash-merged, so the pull request title becomes the commit on `main`. Maintainers review, merge and deploy.

## Required checks

Before opening a pull request, run `npm run typecheck`, `npm run lint`, `npm test`, `npm run validate:content` and `npm run build` (`npm run check` runs all but content validation). CI runs the same checks on `main` pushes and pull requests, using pinned GitHub Actions with read-only repository permissions. It does not deploy.

Browser and visual checks are separate: follow the README for interface changes and inspect every intentional snapshot change. Never update baselines only to make a check pass. The browser suite also rewrites the tracked 0.3 evidence in `artifacts/revision/screenshots/`; restore it with `git checkout -- artifacts/revision/screenshots` unless you mean to replace that evidence.

## Gameplay invariants

Changes to combat or card content must keep resolution deterministic and leave state untouched when an action is rejected. Changes to persisted data need an explicit migration or compatibility path. Interface and wording changes must cover English, Simplified Chinese and Vietnamese. Do not describe human playtests or editorial reviews as done unless they actually happened.

## Versioning

Three identifiers change for different reasons:

- **Release version:** `version` in `package.json`, recorded in [CHANGELOG.md](CHANGELOG.md) and tagged `vX.Y.Z`. Bump the patch for fixes, balance and copy; bump the minor for new content or systems.
- **Rules/content identity:** `RULES_VERSION` and `CONTENT_VERSION` in `src/game/run.ts`, `CONTENT_VERSION` in `src/game/content.ts` and `RULES.version` in `src/game/rules.ts`. Saves and combat replays must match them exactly: changing one makes existing runs fail `validateSave` unless `src/game/save.ts` gains a migration with fixture tests. A rule tweak that keeps the persisted shape may keep the identity; say so in the changelog, because combat replays recorded before it no longer reproduce.
- **Save envelope:** `version` checked by `validateSave` in `src/game/save.ts`. Change it only with a migration.

## Changelog

Every player-visible or compatibility-relevant pull request adds a line under `## [Unreleased]` in `CHANGELOG.md`. A release moves those lines under a dated version heading.

## Repository hygiene

Commit source, `package-lock.json`, tests, and required runtime assets with their provenance and licenses. Never commit environment files, credentials, `node_modules`, `.next`, `out`, `.vercel` or generated recordings. Selected historical QA evidence is tracked on purpose; new diagnostics normally stay ignored unless deliberately kept for review. Do not attach real player save exports to fixtures, issues or pull requests.

Fresh clones already contain the runtime artwork and need no asset generation. The historical `art:prepare` command reads from an external source directory and is not part of installation or the production build; do not regenerate or replace illustrations as routine setup.

## For maintainers: releasing and deploying

Production is the Vercel project `heavenward` (scope `yves-projects-de611e27`), served at <https://heavenward.vercel.app>. Deployment credentials stay on maintainer machines and are never committed.

1. Merge the release pull request: `package.json` version bumped and the changelog section dated.
2. On an up-to-date `main`, run `npm ci`, the required checks, and the browser suite for interface changes. `deploy:prepare` reports `matchesProfiledBuild: false` until `npm run qa:performance` re-profiles the new build into the tracked `artifacts/performance.json`; that is informational, not a gate.
3. Tag the release: `git tag -a vX.Y.Z -m "vX.Y.Z"` and `git push origin vX.Y.Z`.
4. Package and deploy the tested export:
   ```sh
   npm run deploy:prepare
   vercel deploy --prebuilt --prod --yes --scope yves-projects-de611e27
   npm run deploy:record
   npm run deploy:verify
   ```
   `deploy:record` fails unless production is READY and writes `artifacts/deployment/vercel-status.json`; `deploy:verify` compares the live site with the local payload.
5. Play a real combat turn on the live site, then record the deployment in `docs/DEPLOYMENT.md` through a `docs/deploy-vX.Y.Z` pull request. `artifacts/` is git-ignored, so stage the regenerated evidence with `git add -u artifacts/deployment`.
6. Publish release notes: `gh release create vX.Y.Z --generate-notes --verify-tag`.

To roll back, run `vercel rollback <previous-deployment-url> --scope yves-projects-de611e27` with a deployment already recorded as verified, then repeat the live checks. See [docs/OPERATIONS.md](docs/OPERATIONS.md) for save-safe recovery.
