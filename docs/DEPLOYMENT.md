# Production deployments

Newest first. Releases follow [CONTRIBUTING.md](../CONTRIBUTING.md#releasing-and-deploying). Project: `prj_u6Gz9tI73YfisQYlbA11Io4LDA8i`, scope `yves-projects-de611e27`.

## 0.3.1 — September 14, 2026

**VERIFIED READY** — [heavenward.vercel.app](https://heavenward.vercel.app/). Unspent player Armor halves at turn start; see [CHANGELOG.md](../CHANGELOG.md). The owner's request to sync GitHub and deploy to Vercel authorized this release.

### Exact artifact

- Source: tag `v0.3.1`, commit `566f6df` on `main`. Rules/content `human-0.3.0`; combat schema 3; save envelope 2.
- Deployment: `dpl_9JRbFUm8F65QZEnh7eP4vVTwcRmK`.
- Immutable URL: https://heavenward-32cbnllpr-yves-projects-de611e27.vercel.app
- Production READY recorded at 2026-09-14T11:23:40Z by `npm run deploy:record` in `artifacts/deployment/vercel-status.json`.
- Entry HTML SHA-256: `04e14363a7006152b898a9eaf0a461ed68bbdd04cad5eee9c683dadfbbf922df`.
- Static payload: 1,179 files / 45,655,358 bytes including the preserved old app and dependency notices. No functions. `matchesProfiledBuild` is false because `artifacts/performance.json` still profiles the 0.3.0 build; performance was not re-profiled for this release.
- Rollback target: the 0.3.0 deployment `dpl_rDFCES7gVB23nc95QX5GDwLRpf2f` below.

### Executed checks

1. On `main` at `566f6df`: `npm ci`, `npm run typecheck`, `npm run lint`, `npx vitest run` (169 tests), `npm run validate:content`, `npm run build` — PASS. The export contains the halving rule and new copy, not the old "clears" text.
2. Playwright on the release branch (identical runtime), Chromium/Firefox/WebKit — 121 passed, 4 CDP-only skips, 1 WebKit failure in the resilience fresh-life helper whenever the random opening hand has no Strike. That is a test expectation bug (wrong `targetId` for Defense), fixed in #3; visual baselines passed.
3. `npm run deploy:prepare`, `vercel deploy --prebuilt --prod --yes --scope yves-projects-de611e27`, `npm run deploy:record` — PASS, READY production, canonical alias updated.
4. `npm run deploy:verify` — **145/145 PASS** (`artifacts/deployment/http-verification.json`).
5. Ordinary play on the live site in a fresh browser profile: new life, two drafts, first combat. The first-combat hint shows the new Armor text; three Defenses give 15 Armor, River Spirit's 3×3 is fully absorbed (6 left) and turn 2 starts with 3 Armor at 72/72 HP. No console errors.

Not run for this release: live three-engine Playwright, `artifacts/deployment/revision-smoke.mjs`, performance re-profiling and human sessions.

### Saves

The canonical origin is unchanged, so existing browser-local saves remain and continue under the new rule from their next turn. Combat replays recorded under 0.3.0 no longer reproduce.

## 0.3.0 — September 14, 2026 (superseded by 0.3.1)

Human Realm integrated revision and latest targeting/deck/progression update, not commercial V1.0 acceptance. The user's explicit “部署到vercel” authorized publication. The existing linked project and plan were retained; no paid service, hosting-plan change or GitHub push was performed.

### Exact artifact

- Rules/content: `human-0.3.0`; combat schema3; save envelope2.
- Project: `prj_u6Gz9tI73YfisQYlbA11Io4LDA8i`.
- Deployment: `dpl_rDFCES7gVB23nc95QX5GDwLRpf2f`.
- Immutable URL: https://heavenward-e8u5wv8vr-yves-projects-de611e27.vercel.app
- Inspector: https://vercel.com/yves-projects-de611e27/heavenward/rDFCES7gVB23nc95QX5GDwLRpf2f
- Production READY independently inspected at2026-09-14T06:31:19.993Z; the sanitized metadata was kept in `artifacts/deployment/vercel-status.json` until 0.3.1 replaced it.
- Entry HTML SHA-256: `2a7b6572be0f6fd8d7144af29e3a4a148582f64c6443a22a8859dc8c310b76b1`.
- Local production build, isolated performance profile, static payload and live canonical HTML match exactly.
- Static payload:1,179 files /45,655,177 bytes including the preserved old app and dependency notices. No functions. CLI reused unchanged files and reported812.2KB transferred; transfer size is not total payload size.

The initial local repository had no commits. The delivery commit contains this record and the exact source; it is tagged `v0.3.0` (the tag points at the following CI/docs-only commit `b84f5b1`, whose runtime is identical). No upstream Git repository was configured or pushed at the time.

### Executed live checks

1. `node scripts/prepare-vercel.mjs` — PASS, packaged the tested export without recompiling.
2. `vercel deploy --prebuilt --prod --yes --scope yves-projects-de611e27` — PASS, Ready and canonical alias in17seconds.
3. `vercel inspect heavenward.vercel.app --scope yves-projects-de611e27 --json` — PASS, current production READY.
4. `node scripts/verify-deployment.mjs https://heavenward.vercel.app` — **145/145 PASS**. Live HTML, mapped art, referenced JS/CSS/fonts, icon and licenses match. Source/environment paths return404. The verifier allows only the exact reviewed Vercel cookie-opt-in toolbar append with this deployment ID; all other changes fail.
5. `E2E_BASE_URL=https://heavenward.vercel.app npx playwright test tests/browser/game.spec.ts --grep 'ordinary UI:' --workers=3 --reporter=json --output=output/playwright/live-rules3` — **3/3 PASS**, Chromium/Firefox/WebKit,0flaky,0skips;11.75seconds. Empty-profile launch, two drafts, combat, three-language switching and refresh/resume. Evidence: `artifacts/deployment/browser-live-ordinary.json`.
6. `node artifacts/deployment/revision-smoke.mjs` — PASS in another fresh isolated Chromium profile using ordinary UI only: enemy double-click selects without play, target click commits exactly once, one card/one energy consumed, End Turn resolves, all3 languages preserve gameplay/RNG, reload/Continue preserves actual played state. No console/runtime errors. Visible art and fonts finish loading before screenshots. Evidence: `artifacts/deployment/live-0.3/results.json` and three combat screenshots.

See [full local checks](REVISION_QA.md) for168unit tests,122browser passes and4explicit CDP-only skips, production build, visual inspection and diagnostic scope. Screenshots are actual browser captures, not generated art or simulations.

### Saves and remaining gates

The canonical origin is unchanged, so its existing browser-local data remains available. Public0.1 lives retain an explicit continue/export path at `/legacy/v1/index.html`; starting the new revision requires the user's explicit choice. Local0.2 snapshots migrate with original bytes archived, stable IDs/RNG preserved and a compatibility notice. No save was silently erased. Localhost and the website remain separate storage origins; cloud/cross-device save is not implemented.

No software or deployment blocker remains for this playable revision. Human newcomer sessions, native-language editorial review, human run-duration/balance measurements and the remaining commercial release gates are **NOT RUN / OPEN**, as detailed in [next actions](REVISION_NEXT_ACTIONS.md). No background monitoring or future human session is claimed.

[Historical0.1 deployment evidence](DEPLOYMENT_0_1.md) is retained separately and must not be mistaken for the current deployment.
