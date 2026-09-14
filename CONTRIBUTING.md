# Working on HEAVENWARD

This is a private game repository. Keep approved artwork, the existing stack and unrelated work intact. Runtime gameplay uses no API keys or generative service.

Use Node from `.nvmrc` and install with `npm ci`. Make a focused branch for each change, commit a clear description, and open a pull request describing the resulting behavior, actual validation and save/localization impact. Do not force-push shared history. Merge and production deployment require the repository owner's authorization.

Before a pull request, run `npm run typecheck`, `npm run lint`, `npm test`, `npm run validate:content` and `npm run build`. CI executes those same checks on main pushes and pull requests using pinned GitHub Actions with read-only repository permissions. It does not deploy. Browser/visual checks remain separate: follow README instructions and inspect every intentional snapshot change; never update baselines solely to make a check pass.

Changes to combat or card content must preserve deterministic resolution and rejected-action purity. Changes to persisted data need an explicit migration or compatibility path. UI and wording changes must cover English, Simplified Chinese and Vietnamese. Never report unavailable human/editorial sessions as completed.

Commit source, `package-lock.json`, tests, required runtime assets and their provenance/licenses. Exclude real environment files, credentials, `node_modules`, `.next`, `out`, `.vercel` and generated recordings. Selected historical QA evidence is explicitly tracked; new diagnostics normally stay ignored unless intentionally retained for review. Do not upload real player save exports as fixtures.

Fresh clones already contain the approved runtime artwork and do not need asset generation. The historical `art:prepare` command defaults to an external source directory and is not part of installation or production build. Consult `docs/ART_BIBLE.md` and asset manifests before changing that pipeline; do not regenerate or replace approved illustrations as routine setup.

Vercel publishing uses the documented manual static prebuilt workflow. Keep account linkage and deployment credentials local. Repository visibility and collaborator access must remain private unless the owner explicitly requests a change.
