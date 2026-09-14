# Final human-0.3.0 performance evidence

Measured 2026-09-14T06:17:54.795Z. Rules/content: **human-0.3.0**. Core: **3**. Completed with **zero browser errors**.

Exact exported entry SHA256: `2a7b6572be0f6fd8d7144af29e3a4a148582f64c6443a22a8859dc8c310b76b1`. The served HTML matched the local export byte-for-byte and the export remained unchanged through measurement. Report SHA256: `a5a200c4f2c20446d2ea05af7a7a699fb034f3e1f7855e75c6dfcc9ad606fbb4`.

## Environment and scope

Chromium 153.0.8010.12, headless at 1366 × 768 and device scale 1, on Apple M4, 16 GiB RAM, macOS 26.5, Node v24.15.0. Localhost static production export; no CPU or network throttling. Root confirmed the multi-browser suite had finished and paused other agent browser/CPU workloads before this run. Background OS activity was not controlled.

The browser first completed a real two-round starting draft (five offers per round), selected one of three authored branches, and persisted combat in v2 storage with numeric grades. Timing then used a validated controlled battle with three enemies, three summons, statuses and sufficient HP/Yuan to measure ten actions. This is not a human session-duration measurement.

## Responsiveness

| Sample | Count | Mean | p95 | Maximum |
|---|---:|---:|---:|---:|
| Idle frame interval | 241 | 16.67 ms | 16.80 ms | 16.80 ms |
| Action/VFX frame interval | 241 | 16.67 ms | 16.80 ms | 16.80 ms |
| Browser event to confirmed paint | 10 | 43.68 ms | 45.20 ms | 45.20 ms |
| Playwright action round trip | 10 | 318.33 ms | 344.17 ms | 344.17 ms |

The two four-second frame windows each averaged approximately 60 requestAnimationFrame callbacks per second, with **0 intervals above 20 ms**. This measures headless scheduling stability, not physical display FPS or GPU capability. All ten input samples produced exactly one committed play and one save revision: eight enemy-target clicks, one self-target click and one self double-click. Browser latency includes save-confirmation polling plus the next frame; it is not a Web Vitals INP measurement. Automation latency also includes Playwright/IPC overhead.

Fresh-context local navigation loaded 27 requests / 1,597,202 CDP encoded bytes. Browser loadEventEnd was 114.20 ms; automation-to-ready including its network-idle wait was 741.05 ms. These are localhost results, not internet load estimates.

## Repeated navigation and capacity

| Collection/menu cycles | Used JS heap | DOM nodes | Attached elements | Event listeners |
|---|---:|---:|---:|---:|
| 0 | 5,768,636 B | 132 | 91 | 332 |
| 10 | 6,076,608 B | 132 | 91 | 332 |
| 25 | 6,122,464 B | 132 | 91 | 332 |
| 50 | 6,187,308 B | 132 | 91 | 332 |

After forced garbage collection at the same menu state, used heap increased by 418,672 B over 50 collection/menu cycles; DOM and listener counts remained stable. This bounded workload does not prove absence of all memory leaks. The collection exposed 107 collectible cards.

The accelerated Seven-Star Array fixture generated 1,000 uniquely identified Flying Swords, placed ten in hand and 990 in discard, then resolved and exhausted all 1,000 for exactly 2,000 enemy HP loss. Generation took 0.90 ms; per-play mean 2.22 ms / p95 3.41 ms; serialization 0.99 ms for 551,921 B. Retained count 998, boosted enemy HP and manual reintroduction of overflow tokens are explicitly diagnostic fixture controls, not an ordinary run.

## Export size

All values below are bytes. Gzip values are computed locally for JS/CSS; the test server serves uncompressed content. Full export size is not the initial page transfer.

| Scope | Files | All raw assets | JS raw | JS gzip | CSS raw | CSS gzip |
|---|---:|---:|---:|---:|---:|---:|
| Current revision | 581 | 22,878,449 | 877,406 | 290,038 | 264,423 | 83,420 |
| Preserved legacy | 571 | 22,634,239 | 734,059 | 234,219 | 245,605 | 79,455 |
| Entire export | 1152 | 45,512,688 | 1,611,465 | 524,257 | 510,028 | 162,875 |

## Reproduction and historical evidence

`PERFORMANCE_ORIGIN=http://127.0.0.1:3212 npm run qa:performance` after building and serving the frozen static export. Raw measurements and methodology are in `artifacts/performance.json`; script fixtures have two passing tests.

The original v1 report remains at `artifacts/revision/performance-v1.json`. The earlier concurrent-load sample is preserved separately as `artifacts/revision/performance-concurrent-0.3.json`; it is superseded by this isolated run. Neither earlier profile is a controlled before/after comparison: UI/build and/or workload differ. No Firefox/WebKit timing, mobile hardware benchmark, human completion time or broad leak-free claim is inferred.
