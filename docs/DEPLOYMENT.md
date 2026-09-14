# Human Realm 0.3 production deployment — September14,2026

**VERIFIED READY** — [heavenward.vercel.app](https://heavenward.vercel.app/).

This is the integrated revision and latest targeting/deck/progression update, not commercial V1.0 acceptance. The user's explicit “部署到vercel” authorized publication. The existing linked project and plan were retained; no paid service, hosting-plan change or GitHub push was performed.

## Exact artifact

- Rules/content: `human-0.3.0`; combat schema3; save envelope2.
- Project: `prj_u6Gz9tI73YfisQYlbA11Io4LDA8i`.
- Deployment: `dpl_rDFCES7gVB23nc95QX5GDwLRpf2f`.
- Immutable URL: https://heavenward-e8u5wv8vr-yves-projects-de611e27.vercel.app
- Inspector: https://vercel.com/yves-projects-de611e27/heavenward/rDFCES7gVB23nc95QX5GDwLRpf2f
- Production READY independently inspected at2026-09-14T06:31:19.993Z; sanitized metadata in `artifacts/deployment/vercel-status.json`.
- Entry HTML SHA-256: `2a7b6572be0f6fd8d7144af29e3a4a148582f64c6443a22a8859dc8c310b76b1`.
- Local production build, isolated performance profile, static payload and live canonical HTML match exactly.
- Static payload:1,179 files /45,655,177 bytes including the preserved old app and dependency notices. No functions. CLI reused unchanged files and reported812.2KB transferred; transfer size is not total payload size.

The initial local repository had no commits. The delivery commit contains this record and the exact source; use `git log -1` for its SHA, also reported in the delivery message. No upstream Git repository was configured or pushed.

## Executed live checks

1. `node scripts/prepare-vercel.mjs` — PASS, packaged the tested export without recompiling.
2. `vercel deploy --prebuilt --prod --yes --scope yves-projects-de611e27` — PASS, Ready and canonical alias in17seconds.
3. `vercel inspect heavenward.vercel.app --scope yves-projects-de611e27 --json` — PASS, current production READY.
4. `node scripts/verify-deployment.mjs https://heavenward.vercel.app` — **145/145 PASS**. Live HTML, mapped art, referenced JS/CSS/fonts, icon and licenses match. Source/environment paths return404. The verifier allows only the exact reviewed Vercel cookie-opt-in toolbar append with this deployment ID; all other changes fail.
5. `E2E_BASE_URL=https://heavenward.vercel.app npx playwright test tests/browser/game.spec.ts --grep 'ordinary UI:' --workers=3 --reporter=json --output=output/playwright/live-rules3` — **3/3 PASS**, Chromium/Firefox/WebKit,0flaky,0skips;11.75seconds. Empty-profile launch, two drafts, combat, three-language switching and refresh/resume. Evidence: `artifacts/deployment/browser-live-ordinary.json`.
6. `node artifacts/deployment/revision-smoke.mjs` — PASS in another fresh isolated Chromium profile using ordinary UI only: enemy double-click selects without play, target click commits exactly once, one card/one energy consumed, End Turn resolves, all3 languages preserve gameplay/RNG, reload/Continue preserves actual played state. No console/runtime errors. Visible art and fonts finish loading before screenshots. Evidence: `artifacts/deployment/live-0.3/results.json` and three combat screenshots.

See [full local checks](REVISION_QA.md) for168unit tests,122browser passes and4explicit CDP-only skips, production build, visual inspection and diagnostic scope. Screenshots are actual browser captures, not generated art or simulations.

## Saves and remaining gates

The canonical origin is unchanged, so its existing browser-local data remains available. Public0.1 lives retain an explicit continue/export path at `/legacy/v1/index.html`; starting the new revision requires the user's explicit choice. Local0.2 snapshots migrate with original bytes archived, stable IDs/RNG preserved and a compatibility notice. No save was silently erased. Localhost and the website remain separate storage origins; cloud/cross-device save is not implemented.

No software or deployment blocker remains for this playable revision. Human newcomer sessions, native-language editorial review, human run-duration/balance measurements and the remaining commercial release gates are **NOT RUN / OPEN**, as detailed in [next actions](REVISION_NEXT_ACTIONS.md). No background monitoring or future human session is claimed.

[Historical0.1 deployment evidence](DEPLOYMENT_0_1.md) is retained separately and must not be mistaken for the current deployment.
