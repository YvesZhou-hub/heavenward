# HEAVENWARD / 问天 — Art Bible

## Visual identity

The world is a moonlit mountain passage toward a pale golden heavenly eclipse. Weathered black stone gives the player a stable foreground; jade mist and steep distant silhouettes carry the scale. The palette is midnight jade/green-black, antique pale gold and warm ivory, with restrained cinnabar, water blue and violet accents. Use a bright focal point against a quiet dark field. Do not turn later cultivation into a denser wall of glow.

Materials should remain recognizable: worn bronze, translucent jade, silk, paper fiber, bark, stone and restrained celestial light. The illustration language is finely detailed, painterly Chinese fantasy generated with the authorized built-in image tool. It is not claimed to be hand-painted by a human. Faces, beasts, weapons and gestures must have readable silhouettes at actual game size; details are subordinate to the subject.

The environment provides dark negative space on the left for the menu and a stone battle terrace below. Rules, titles, costs, grades, numbers, interaction states and EN/ZH text remain live interface layers. Never flatten a complete playable card into an image. Artwork must not contain readable gameplay writing, labels, UI, logos or watermarks. Paper-surface defects found during this run received a recorded targeted repair rather than being accepted as text.

## Shape and subject language

| Path | Visual subjects and motion |
|---|---|
| Fire | Embers, phoenix shapes, marks and branching fire; expansion followed by a focused detonation |
| Wood | Roots, seeds, fresh growth and living plants; gradual opening and returning life |
| Earth | Heavy stones, terraced foundations and shields; stable mass deliberately spent as force |
| Water | Springs, currents and a surrounding tidal field; flexible flow and three distinct sea states |
| Metal | Fine needles, sharpened bronze/gold edges and hard protective shells |
| Sword | Clear jade/ivory blades, intent halos and directed flying volleys |
| Wind | Crane silhouettes, airy sleeves, spirals and released paper; directional motion and sudden Gale |
| Blood | Cinnabar silk, controlled red droplets and fractured red jade; a deliberate cost with a visible payoff |
| Summoning | Distinct wolf, crane, vine, treant and ancestral-beast bodies; shared direction without losing individual identity |
| Strength | Training tools, fists, disciplined posture and immense foundations; decisive physical impact |
| Refinement | Furnaces, ash, purified edges and reconstructed armor; spent material returns in another form |
| Formation | Prepared geometry, suspended stones, concealed lightning and constellations; stillness before release |
| Wisdom | Observation, blank pages, mirrors, compasses and strategic placement; clarity and intentional selection |

Path identity is carried by subject and shape as well as color. Different cards now have distinct subject compositions; grade changes retain a card's identity and do not require new artwork.

## Current asset implementation and provenance

The production import has completed. `docs/PRODUCTION_ASSET_MANIFEST.json` is marked `draft: false` and contains **127 registered outputs**: 103 card illustrations, 18 enemy illustrations, five summon illustrations and one player portrait. `src/game/art-index.json` maps the 127 stable identities to files. All manifest output paths existed when checked. The earlier `docs/ASSET_MANIFEST.json` records the original three-asset visual benchmark; it is not the current per-card coverage inventory.

The canonical environment remains `public/art/environment.webp`. Card and entity images are individual WebP crops under `public/art/`, imported by `scripts/prepare-production-art.ts`. The raw sheets and source records remain under `assets/source/`:

- `generation-record.json`: original environment, 16-subject technique benchmark and six-character benchmark.
- `cards-01-04-record.json` and `cards-05-07-record.json`: dedicated card-sheet prompts, exact identity order, source/tool information and inspection notes.
- `entity-record.json`: dedicated enemy and summon production sheets.
- `repairs-record.json`: targeted three-card paper-surface repair, with replacement identities and crop information.

The tool was the authorized built-in `image_gen.imagegen` / `image_gen__imagegen`. Its returned fields exposed image data and the saved output hint, without a selectable or returned model identifier. The requested `gpt-image-2.5-sunburst` identity therefore remains **unverifiable**; do not describe these files as confirmed Sunburst, Flare or another named model. No paid fallback API was used by this production workflow. Prompts and actual source references make the process auditable, but do not promise deterministic image reproduction.

Requested sheet dimensions were not guaranteed by the built-in tool. Most square sheets arrived at 1254×1254. In cards 05/06/07 the last row starts at y=928/927/940 respectively; quarter-grid assumptions would produce bad crops. The import uses recorded/reviewed boundaries and insets, preserves source images, optimizes delivery images, and registers dimensions and SHA-256 hashes. Future replacements must update the stable mapping and manifests and be reviewed in the actual card, not only as a large sheet.

The lead has reviewed integrated imagery separately. This Art Bible records intent and provenance; it does not independently certify the lead's screenshots, all native browsers, performance or commercial visual acceptance.

## Interface, typography and motion

Use Cormorant Garamond for English display typography, DM Sans for compact interface text and Noto Serif SC for Chinese. Fonts are bundled through local Fontsource packages, not fetched from a font service during gameplay. Keep English titles and Chinese line-height/density legible independently. A selected card, target preview and committed enemy Intent should dominate the current decision; decoration must yield to them. Never shrink critical rules merely to preserve a decorative silhouette.

Card frames are reusable live components. Keep cost, title, artwork, Path, category, grade, rules and retained/temporary state visually distinct. Hover/focus inspection must retain battle context, and input should remain available through clicks and keys as well as drag. Use spatial grouping and symbols in addition to color.

Motion should communicate anticipation → action → impact → readable aftermath. Distinguish Armor absorption, real HP loss, Dodge, Protective Qi, healing, Exhaust and Active Discard. Signature effects need their own restrained composition; do not change engine outcomes with animation speed. Reduced motion must preserve information. Current CSS effects and synthesized sound are an implemented foundation, not evidence that every signature system has completed its final audiovisual review.

## Fonts, icons, audio and dependency notices

| Source | Local evidence | Recorded license/provenance |
|---|---|---|
| Cormorant Garamond 5.3.0 | `docs/licenses/@fontsource-cormorant-garamond-5.3.0-LICENSE` | OFL-1.1 per installed package; retain the supplied font notice |
| DM Sans 5.3.0 | `docs/licenses/@fontsource-dm-sans-5.3.0-LICENSE` | OFL-1.1 per installed package; retain the supplied font notice |
| Noto Serif SC 5.3.0 | `docs/licenses/@fontsource-noto-serif-sc-5.3.0-LICENSE` | OFL-1.1 per installed package; retain the supplied font notice |
| Lucide React 0.577.0 | `docs/licenses/lucide-react-0.577.0-LICENSE` | ISC, including the supplied MIT notice for Feather-derived portions |
| Ambient sound and SFX | `src/game/audio.ts` | Original oscillator synthesis in the project; no third-party recordings or samples referenced |
| Next.js, React, build/runtime dependencies | `docs/DEPENDENCY_LICENSES.json`, `docs/licenses/`, lockfile | Installed package versions and copied notices; Next/React are MIT, while other packages have their own recorded licenses |
| AI-created illustrations | Source records and both asset manifests | Actual built-in tool and source lineage recorded; no fabricated human authorship, model identity or legal-clearance certificate |

The inventory is a provenance record, not a blanket legal-clearance assertion. Ship the relevant notices with the distributed project and refresh the inventory when dependencies or assets change. Review transitive/native notices as well as the top-level dependency names. A release must not silently discard copied notices during packaging.

