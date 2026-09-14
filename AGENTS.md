<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# HEAVENWARD project guide

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing anything: it maps each kind of change to its source file and defines branches, commit titles, versioning and the release procedure. [docs/README.md](docs/README.md) says which documents are current.

- Work on a `<type>/<short-description>` branch and open a pull request; never push to `main` directly.
- `npm run check` plus `npm run validate:content` must pass. Run the browser suite for interface changes.
- Player-facing text ships in English, Simplified Chinese and Vietnamese together.
- Do not change `RULES_VERSION`, `CONTENT_VERSION`, `RULES.version` or the save envelope without a migration in `src/game/save.ts`; existing saves would stop loading.
- Add a `CHANGELOG.md` line under `Unreleased` for anything a player would notice.
- Never regenerate approved art, clear real saves, or deploy to Vercel unless the owner asks.
