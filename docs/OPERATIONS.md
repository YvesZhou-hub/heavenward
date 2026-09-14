# Build, release and recovery operations

## Local build

Use the project root and the Node version in `.nvmrc` (24.15.0 was verified). Install exactly with `npm ci`. Run the gates listed in `QA_EVIDENCE.md`, then `npm run build`. Next exports only the static application and `public/` assets into `out/`; TypeScript/core/source PNGs, test fixtures, credentials and localStorage are not web payloads.

`npm start` serves port3210. The QA production server uses `node scripts/serve-static.mjs 3211`. Do not run two servers on the same port. Both bind to127.0.0.1. First-load fonts/images/scripts are static resources; no API/environment variable is needed. `.env.example` documents this. The app explicitly says saved on this device; it does not advertise cloud sync.

## Evidence to retain per release

Retain the source revision, lockfile, Node/npm versions, `out/index.html` and application/asset hashes, core/E2E/pixel reports, production profiling JSON and known limits. `artifacts/performance.json` includes the exact HTML hash and observed machine/browser. Pixel comparisons depend on browser/OS/font rasterization; do not treat a different platform's difference as automatically valid or automatically defective.

The delivered source includes generated-source/provenance records and dependency notices. Before distributing a web-only package, include the applicable font/icon/framework notices alongside that package rather than assuming the source repository travels with it. Do not infer blanket rights clearance from a package SPDX identifier or an image-model label that the tool did not expose.

## Authorized Vercel release procedure

The user-authorized initial deployment is complete; see `DEPLOYMENT.md`. No purchase or Git push was performed. For a subsequent authorized release:

1. Refresh the destination project/account configuration, hosting-plan terms and suitability. The initial deployment verified an active Hobby plan; refresh it for later releases. Do not assume a free plan permits the intended commercial use.
2. Run the exact local production gates, inspect `vercel.json` and the deployment output selection, and preserve build/source evidence. No secret is required for gameplay; deployment credentials belong only in the deployment environment.
3. Deploy through the authorized Vercel tool/CLI and inspect the deployment's real final status. A created deployment ID or green local build is not a Ready production result.
4. Open the canonical URL on the real deployment. Verify200 responses for page/scripts/font/art, fresh English start, active Chinese switching, a real played combat action, refresh/resume and terminal persistence in an isolated test context. Record the deployed build identity and final status.
5. Explain that this website origin has a separate local save from localhost/127.0.0.1. No cloud transfer or account-linked continuity exists.

## Recovery and rollback

A visible storage error is not permission to clear saves. Export the diagnostic JSON first; preserve its primary/mirror/head/terminal values. Retry/reload only through the existing recovery controls. A valid current mirror may recover the same committed revision; older snapshots must not resurrect a ended run. Do not erase permanent-death records or test accounts as cleanup.

For a local code rollback, stop the active local server and restore a previously tested source/build while keeping browser site data intact. Check the save schema/rules/content compatibility before resuming. The current release accepts schema1 and rejects unknown versions; future migrations need explicit fixture-based validation. A rolled-back executable must not silently overwrite a newer incompatible save.

For a hosted rollback, select only a known tested deployment after the user authorizes the release action, verify current origin/assets and repeat persistence smoke checks. Keep evidence for both versions. This document is a procedure, not a claim that any deployment or rollback was performed.
