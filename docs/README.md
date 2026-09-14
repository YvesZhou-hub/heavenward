# Documentation index

Start with [CONTRIBUTING.md](../CONTRIBUTING.md) for workflow, versioning and releases, and [CHANGELOG.md](../CHANGELOG.md) for what changed. When a document disagrees with the code, the code and its tests win; fix the document in the same pull request.

## Rules and content — keep current

| Document | Use it for |
|---|---|
| [RULE_DECISIONS.md](RULE_DECISIONS.md) | Combat and run rules contracts, turn order, thresholds |
| [CONTENT_GUIDE.md](CONTENT_GUIDE.md) | Authoring cards, Paths, enemies, encounters and Omens |
| [LOCALIZATION_GLOSSARY.md](LOCALIZATION_GLOSSARY.md) | Canonical English / Simplified Chinese / Vietnamese terms and keyword text |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Module boundaries. Its persistence section predates save envelope 2; check `src/game/save.ts` |
| [ART_BIBLE.md](ART_BIBLE.md) | Visual identity and illustration rules, with `ASSET_MANIFEST.json` and `PRODUCTION_ASSET_MANIFEST.json` |

## Operations

| Document | Use it for |
|---|---|
| [OPERATIONS.md](OPERATIONS.md) | Build, save-safe recovery and rollback. Its schema notes predate envelope 2 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Record of the latest production deployment |
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | Open gates at the top; the 0.1 audit below is archived |
| `DEPENDENCY_LICENSES.json`, [licenses/](licenses/) | Third-party notices packaged by `npm run deploy:prepare` |

## 0.3 revision records

| Document | Use it for |
|---|---|
| [REVISION_2026_09_14.md](REVISION_2026_09_14.md) | What the 0.3 revision implemented |
| [REVISION_QA.md](REVISION_QA.md) | Verification evidence for 0.3 |
| [REVISION_NEXT_ACTIONS.md](REVISION_NEXT_ACTIONS.md) | Remaining release gates after 0.3 |
| [NEWCOMER_PLAYTEST.md](NEWCOMER_PLAYTEST.md) | Protocol for observed newcomer sessions (not yet run) |
| [PACING_QA.md](PACING_QA.md) | Route cadence and pacing diagnostics |
| [REQUIREMENT_MATRIX.md](REQUIREMENT_MATRIX.md) | Traceability from the source briefs to the implementation |

## Historical — do not treat as current

| Document | Why it is kept |
|---|---|
| [DEPLOYMENT_0_1.md](DEPLOYMENT_0_1.md) | First Vercel deployment (0.1) |
| [QA_EVIDENCE.md](QA_EVIDENCE.md) | Local production QA for 0.1.0 |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | 0.1.0 implementation snapshot |
| [NEXT_ACTIONS.md](NEXT_ACTIONS.md) | 0.1 backlog, superseded by `REVISION_NEXT_ACTIONS.md` |
| [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) | 0.1.0 commercial-gate checklist |
| [source/](source/) | Original design brief and master build brief, the authoritative inputs |
