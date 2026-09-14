## Change

Describe the player-visible problem and resulting behavior. Link the issue if one exists.

## Verification

List commands actually run and PASS / FAIL / NOT RUN results. Include browser screenshots for interface changes and distinguish controlled fixtures from ordinary play.

## Compatibility

Describe save/rules/localization impact, migrations and any remaining limitations. State explicitly if none apply.

## Checklist

- [ ] Title follows `type(scope): summary` and a label is set
- [ ] `npm run check` and `npm run validate:content` pass locally
- [ ] Player-facing text covers English, 简体中文 and Tiếng Việt, or no text changed
- [ ] Rules/content identifiers and the save envelope are unchanged, or a migration with fixture tests is included
- [ ] `CHANGELOG.md` lists the change under `Unreleased`, or it is not player-visible
- [ ] Browser suite and intentional snapshot changes were inspected for interface changes, or none apply
