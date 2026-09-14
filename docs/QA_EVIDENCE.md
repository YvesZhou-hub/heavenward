# QA evidence — local production build 0.1.0

Date:2026-09-14. Project:`/Users/yveszhou/Documents/game/heavenward`. Production format:Next.js static export in `out/`, served at `http://127.0.0.1:3211`. The initial local checkpoint was subsequently deployed with explicit user authorization; see `DEPLOYMENT.md` for current live evidence. These results establish the tested behavior; they do not establish commercial acceptance or human balance.

## Executed gates

| Check | Status | Actual result / evidence |
|---|---|---|
| TypeScript | PASS | `npm run typecheck`; final build also completed TypeScript |
| ESLint | PASS | `npm run lint`, zero warnings allowed |
| Content validation | PASS | `npm run validate:content`:8 tests |
| Unit/integration/invariant/replay | PASS | `npm test`:92 tests in five files, including100 seeded combat-invariant cases within the rule tests |
| Production export | PASS | `npm run build`:static `/`, not-found and icon routes; successful typecheck/static generation |
| Production E2E | PASS | **54/54** in Chromium, Firefox and WebKit; `artifacts/e2e-production.json` |
| Screenshot regression | PASS | Seven Chromium pixel baselines refreshed after a real layout fix, then compared without update; `artifacts/pixel-comparison-production.json` |
| Asset manifest | PASS |127 mapped optimized images; every path exists and SHA-256/bytes match final manifest; `draft:false` |
| Production dependency audit | PASS | `npm audit --omit=dev --json`:0 reported vulnerabilities at execution time; not a general security certification |
| Ordinary-rule bot reachability | PASS |12+8 runs,20 Ascensions,0 deaths,0 diagnostic failures; all31 authored archetypes acquired across batches; actual Sacrifice activation in2 runs |
| Native Safari interaction | BLOCKED | Native Safari displayed the game; CUA later returned `Mac is locked` and interaction could not continue. No native interaction pass claimed |
| Native Chrome/Firefox application matrix | NOT RUN | Playwright engines below are automated browser distributions; native application acceptance is separate |
| Human full-run balance/editorial/audio acceptance | NOT RUN | Automated policies and controlled fixtures do not establish enjoyment, difficulty or real player completion time |
| Public deployment | PASS |User-authorized production deployment READY at heavenward.vercel.app;145 HTTP/path checks and3 live browser cases passed; active Hobby plan verified for personal testing. See `DEPLOYMENT.md` |
| Legacy migration | NOT RUN | First shipped schema is1; unknown versions reject. No prior released schema migration is fabricated |

## Browser scope and screenshot review

Each of the three engines executed18 tests:15 normal/controlled UI cases plus3 resilience cases. Coverage includes a genuinely fresh English opening and ordinary two-draft/first-combat path, active EN/ZH switching without RNG changes, keyboard and drag targeting, individual-hit previews, Elite rewards, Merchant purchase/sale/comparison, exclusive Rest, Event/Inheritance, breakthrough/Divine activation, paused discard resolution, Tidal choices, refresh/mirror recovery, multitab updates, storage quota failure, permanent death and final Ascension.

Later-state browser tests explicitly seed controlled validated fixtures. Their accelerated HP/decks establish transitions and interaction, not legitimate full-run balance. The ordinary bot batches use actual unmodified run rewards, HP and rules, and a visible-hand/intent policy. Their20/20 win rate suggests forgiving difficulty and needs human investigation; it is not a reason to claim balance is finished.

Resilience tests abort real decorative image requests, play after boot with the context offline, and make AudioContext.resume never resolve. They require zero JavaScript errors and reject unexpected console diagnostics; only exact intentionally failed decorative image/font requests are accepted. First-load/offline cold navigation is not guaranteed and no PWA is claimed.

Worst-case layouts contain10 cards,3 enemies,3 summons, an active Tidal Domain, multiple player/enemy statuses, retained cards and powers. All six EN/ZH combinations at1280×720,1366×768,1920×1080 and English1440×900 at2× DPI verify no horizontal overflow, full End Turn visibility and no Tidal badge overlap with player HP. The seven Chromium views also have actual PNG regression comparisons. The1280 English hover check verifies the raised card text is above adjacent cards; long text scrolls within the card and full inspection is available.

Primary screenshots are under `output/playwright/` with engine prefixes. Representative final files:

- `chromium-controlled-worst-en-1280x720.png`
- `chromium-controlled-worst-zh-1366x768.png`
- `chromium-controlled-worst-zh-1920x1080.png`
- `chromium-controlled-worst-en-1440x900-2x.png`
- `chromium-controlled-hover-en-1280x720.png`
- `chromium-fresh-english-menu.png`
- `chromium-controlled-merchant-upgrade-comparison.png`
- `chromium-controlled-final-ascension.png`

The lead inspected rendered EN/ZH worst cases and repaired real crowding/visibility defects. The reviewer also inspected the corrected Tidal label and hover result. This remains separate from a complete native-editor and assistive-technology sign-off.

## Reproduction and durability

`artifacts/bot-runs.json` and `artifacts/bot-runs-sacrifice.json` record seeds, outcomes, choices and the stated policies; see `PACING_QA.md`. `artifacts/replay-choice-example.json` records a real three-action combat including a choice. `npx tsx scripts/replay.ts artifacts/replay-choice-example.json` reproduces exact state/RNG and emits SHA-256. Unsupported rules/content versions reject rather than pretending replay compatibility.

Production commands:

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run validate:content
npm run build
node scripts/serve-static.mjs 3211
```

In another terminal:

```sh
E2E_BASE_URL=http://127.0.0.1:3211 RESILIENCE_ORIGIN=http://127.0.0.1:3211 npx playwright test
npx tsx scripts/performance.ts
```

Pixel snapshots must be reviewed before accepting an intentional update. Do not use update mode to bypass an unexplained visual regression. Browser tests use isolated contexts, not the user's real browser save.

## Defects found and corrected

- End Turn outside the720/768-height worst-case viewport → constrained battle layout, compact status help and a side rail for summons.
- Tidal state badge obscuring the player HP value → moved badge into portrait space and added explicit non-overlap checks at all seven layouts.
- Firefox page error when a quota exception escaped a native Web Locks callback → callback returns a discriminated result; outer save layer handles failure without changing last committed gameplay.
- Audio resume could remain pending in Firefox and block a new life → optional audio unlock no longer gates gameplay; regression tested with a never-settling resume.
- Seed tooltip said end-of-turn although the resolver grows/blooms at start-of-player-turn → corrected both locales.
- Three generated paper surfaces had pseudo-writing → one targeted generation repaired the three assets, then final crops replaced their originals.

The completed isolated production measurements follow. Their limitations remain separate from functional PASS results.

## Final measured production diagnostics — PASS

Evidence:`artifacts/performance.json` has `completed:true` and `browserErrors:[]`. Its build hash identifies the tested production HTML. Reference machine:Apple M4,10 logical CPUs,16GiB physical memory,arm64,macOS26.5,Node24.15.0. Browser versions from `artifacts/browser-versions.json`:Playwright1.63.0; Chromium153.0.8010.12; Firefox155.0; Playwright WebKit26.6.

| Diagnostic | Observed result |
|---|---|
| Fresh localhost load |1,405,935 encoded transfer bytes /23 requests;716.93ms automation-to-ready |
| Idle rAF intervals |241 samples over4s; p95 16.7ms; maximum16.8ms; none above20ms |
| VFX/action rAF intervals |241 samples over4s; p95 16.7ms; maximum16.8ms; none above20ms |
| Target click to committed paint |10 samples; mean44.64ms; p95 46.10ms |
| Automation two-click round trip |Mean327.42ms; p95 350.15ms; includes browser automation/IPC and locator waiting |
|50 settled Collection/menu cycles |Post-GC JS heap5,110,828→5,341,920 bytes (+231,092); DOM nodes127, attached elements89, listeners331 stayed constant |
|1,000 Flying Sword capacity fixture |1,000 unique tokens generated and exhausted; exact2,000 damage; generation0.8845ms; play mean1.9603ms/p95 2.9603ms;439,879-byte serialization0.8044ms |

The browser fixture deliberately keeps10 Strike cards,3 summons,3 enemies, Tidal and many statuses alive for timing; it is a capacity test. The token stress fixture accelerates retained-turn count and manually reintroduces overflow tokens to measure1000 real resolver plays. Neither is ordinary balance evidence. rAF intervals in headless Chromium are scheduling diagnostics, not hardware display/GPU60FPS certification. Click-to-commit includes confirmation polling and another animation frame; it is not Web Vitals INP. Localhost transfer/time is not an internet loading estimate. Fifty scene cycles do not prove the absence of every long-session leak.

The profiler initially exposed a tsx/esbuild browser-evaluate serialization helper problem. Its instrumentation was corrected and the full measurement rerun successfully; no gameplay failure was hidden and no application source changed for those corrections.

## Ordinary opening recording

`output/demo/heavenward-opening.webm` is a silent browser recording of an unmodified fresh opening through the real UI:two starting drafts, a Road encounter, Strike/Defense, Simplified Chinese switch and End Turn toturn2. Random seed2889087474 and actual actions/errors are saved in `output/demo/record.json` (`errors:[]`). This is ordinary opening evidence, not a complete run. Still images:`output/demo/menu-en.png` and `output/demo/ordinary-combat-zh.png`. The lead inspected both rendered screens.

A final native Safari retry again returned `The Mac is locked`; the native interaction status remains BLOCKED. The user was asked to unlock earlier; no attempt was made to bypass the system lock.

## Authorized deployment update

The follow-up deployment is complete: https://heavenward.vercel.app, READY, dpl_6D66Unwvz7cG8D1do955QbRXKa8T. Live3/3 Chromium smoke tests pass;145 HTTP/asset/path checks pass with one explicitly reviewed Vercel opt-in-toolbar append preserved in the evidence. The original game bundle prefix and all mapped art match the tested local output. No error rows were returned by the bounded post-deployment error-log scan. Detailed provenance, Hobby-plan boundary and local/online save separation are in `DEPLOYMENT.md`.
