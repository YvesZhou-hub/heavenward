# Vercel deployment — 2026-09-14

**READY / production** — https://heavenward.vercel.app

User authorization:the explicit follow-up “部署到vercel” authorizes this deployment. Account:yveszhou-hub; team:Yves' projects (`yves-projects-de611e27`). A separate new `heavenward` project was linked; no existing application was replaced. No GitHub repository push, domain purchase or plan upgrade was performed.

## Deployed artifact

- Project:`prj_u6Gz9tI73YfisQYlbA11Io4LDA8i`
- Deployment:`dpl_6D66Unwvz7cG8D1do955QbRXKa8T`
- Canonical URL:https://heavenward.vercel.app
- Immutable deployment URL:https://heavenward-2s8t61d6e-yves-projects-de611e27.vercel.app
- Vercel inspector:https://vercel.com/yves-projects-de611e27/heavenward/6D66Unwvz7cG8D1do955QbRXKa8T
- Target:production; verified state:READY via deploy output, `vercel inspect` and REST metadata.
- Framework:Next.js16.3.5 static export; no deployed functions. Existing local source is uncommitted; no commit SHA is invented.
- Entry HTML SHA-256:`4f4f86637ff2f076f98b9639d9014f5e38dd630a6bd9a2c611508bf42c9a8b62`, identical to the locally tested/profiled build.
- Prepared static payload:598 files,22,774,155 bytes, including required copied dependency/font/icon notices. CLI upload reported approximately7MB after platform transfer handling; these are different measures.
- CLI53.2.0 completed upload→Ready/alias in about55s. The prebuilt artifact was not recompiled by Next on Vercel; platform retrieval/finalization is not another game build.

`node scripts/prepare-vercel.mjs` copies the tested `out/` into Build Output API v3, adds `/notices/THIRD_PARTY_NOTICES.txt` and license files, and records every packaged file/hash in `artifacts/deployment/payload.json`. Only the static output is uploaded with `vercel deploy --prebuilt --prod`; source PNGs, supplied briefs, diagnostics and environment files are excluded. The script clears only its generated `.vercel/output` before future repackaging; `.vercel/project.json` remains intact.

Reference:[Vercel Build Output API](https://vercel.com/docs/build-output-api) and [configuration](https://vercel.com/docs/build-output-api/configuration).

## Live verification — PASS

`artifacts/deployment/http-verification.json`:145 checks passed. The canonical HTML,127 mapped illustrations, landscape, icon, referenced script/style/font files and notice file were verified. Development-only `.env`, original source art and original brief paths correctly return404.

One platform transformation is explicitly recorded instead of falsely claiming every raw byte is identical:the Turbopack runtime contains the complete byte-identical original9688-byte bundle plus a439-byte Vercel Toolbar opt-in append. It first checks `__vercel_toolbar=1`, then loads the platform feedback script with the actual deployment ID. The verifier accepts only this exact reviewed append after the exact original prefix; arbitrary JavaScript changes still fail. Both actual/expected hashes remain in the evidence. See `runtime-difference.json` and [Vercel Toolbar settings](https://vercel.com/docs/vercel-toolbar/managing-toolbar).

`artifacts/deployment-smoke/results.json`:3/3 Chromium live UI tests passed in13.46s with no unexpected console errors or JavaScript exceptions. The fresh normal test covers English launch→two drafts→actual combat→Chinese/English switch preserving state/RNG→refresh/resume. Two clearly controlled fixtures verify permanent death/history/noContinue and final Ascension/unlocks/persistence. These terminal fixtures are not balance results. Screenshots were visually reviewed and retained with the smoke summary.

`vercel logs dpl_6D66Unwvz7cG8D1do955QbRXKa8T --no-follow --no-branch --level error --since 1h --json --scope yves-projects-de611e27` returned no error rows after live verification. This is a bounded post-deploy scan, not ongoing monitoring; no new log drain or monitor was configured.

## Plan and save boundaries

The live account API reports an active **Hobby** plan. This deployment is the personal playable-test build, with no payments or monetization. Current Vercel documentation restricts Hobby to personal non-commercial use; a later commercial release must use an appropriate plan. No paid upgrade was authorized or performed. [Hobby plan terms](https://vercel.com/docs/plans/hobby)

The website has a different origin from localhost/127.0.0.1, so its browser-local save is separate. No cloud transfer or cross-device save exists. Deployment READY does not close the documented human balance, native Safari, editorial or audiovisual commercial-acceptance gates.

## Repeat deployment

For the existing verified artifact:

```sh
node scripts/prepare-vercel.mjs
vercel deploy --prebuilt --prod --yes --scope yves-projects-de611e27
```

For changed game code, build and execute the affected local gates first, then prepare/deploy and repeat live verification. Read the new deployment ID from the real result; do not reuse the ID in this historical record. `scripts/verify-deployment.mjs` uses the current sanitized `artifacts/deployment/vercel-status.json` for its exact platform-append comparison.
