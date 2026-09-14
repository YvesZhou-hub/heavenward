# Canonical English / Simplified Chinese / Vietnamese glossary

Current revision: `human-0.3.0`. Runtime locale IDs are `en`, `zh-CN`, and `vi`. English is the first-launch default; explicit language and grade-display preferences persist. Changing presentation never changes IDs, RNG, deck order, committed Intents, or progress.

Names and rule summaries below are taken from current domain data. The full three-language definitions live in `src/game/encyclopedia.ts` (`KEYWORD_GLOSSARY`, alias `TRANSLATION_GLOSSARY`, and `DAO_ENCYCLOPEDIA`), `src/game/status-help.ts`, and executable card descriptions. Do not maintain a separate translated rules implementation.

## World and cultivation

| English | 简体中文 | Tiếng Việt | Meaning |
|---|---|---|---|
| HUMAN REALM | 人界 | NHÂN GIỚI | Complete playable World scope; later Worlds are not playable expansions. |
| Qi Refining | 炼气 | Luyện Khí | Cultivation realm 1; 3 normal Dao Yuan; removal floor 12; no maximum deck size. |
| Foundation Establishment | 筑基 | Trúc Cơ | Cultivation realm 2; 4 normal Dao Yuan; removal floor 14; no maximum deck size. |
| Core Formation | 结丹 | Kết Đan | Cultivation realm 3; 6 normal Dao Yuan; removal floor 16; no maximum deck size. |
| Nascent Soul | 元婴 | Nguyên Anh | Cultivation realm 4; 7 normal Dao Yuan; removal floor 18; no maximum deck size. |
| Spirit Transformation | 化神 | Hóa Thần | Cultivation realm 5; 8 normal Dao Yuan; removal floor 20; no maximum deck size. |
| Early | 初期 | Sơ kỳ | Minor cultivation stage. |
| Middle | 中期 | Trung kỳ | Minor cultivation stage. |
| Late | 后期 | Hậu kỳ | Minor cultivation stage. |
| Peak | 巅峰 | Đỉnh phong | Minor cultivation stage. |
| The Dao Road | 道途 | Đạo Lộ | Shows three immediate branches at ordinary steps and the committed route history; the Tribulation gate has one branch. |
| HEAVENLY OMEN | 天象预兆 | ĐIỀM TRỜI | Authored warning before the selected Tribulation. |
| Spirit stones | 灵石 | Linh thạch | Currency for this run. |
| Life | 生命 | Sinh lực | At zero, combat ends in permanent run death. |

Spirit Transformation still contains encounters and a final Ascension Tribulation. Reaching that realm alone does not complete the life.

## Grade presentation and card categories

Numeric grades 1–8 are the default. Letter and traditional labels are display preferences for the same stored grades 0–7; grade differs from rarity and category.

| Numeric | Letter | Traditional English | 简体中文 | Tiếng Việt |
|---|---|---|---|---|
| 1 | F | Ding | 丁 | Đinh |
| 2 | E | Bing | 丙 | Bính |
| 3 | D | Yi | 乙 | Ất |
| 4 | C | Jia | 甲 | Giáp |
| 5 | B | Huang | 黄 | Hoàng |
| 6 | A | Xuan | 玄 | Huyền |
| 7 | S | Di | 地 | Địa |
| 8 | SS | Tian | 天 | Thiên |

| English | 简体中文 | Tiếng Việt | Stable category |
|---|---|---|---|
| Basic | 基础 | Cơ Bản | basic |
| Dao Art | 道术 | Đạo Thuật | dao |
| Immortal Art | 仙术 | Tiên Thuật | immortal |
| Divine Ability | 神通 | Thần Thông | divine |
| Token | 衍生 | Phái Sinh | token |
| Status Card | 状态牌 | Bài Trạng Thái | status |

Existing smaller decks may advance without forced additions; the realm minimum only limits voluntary removals. All card rewards can be skipped.

There are six categories. Status cards, Tokens, and Divine Abilities have no grade. Temporary Status cards and Tokens cannot enter the permanent deck. Divine Abilities require being drawn and activated; simply owning one is not a passive combat bonus. Above-realm upgrades stop at one grade above the current normal grade.

## Paths and archetypes

| Path | 道 | Đạo | Archetypes | 流派 | Lưu phái |
|---|---|---|---|---|---|
| Fire | 火道 | Hỏa Đạo | Explosive Flame; Spreading Flame | 爆炎; 蔓延烈焰 | Bạo Viêm; Lửa Lan |
| Wood | 木道 | Mộc Đạo | Regrowth; Seeds / Rooting; Living Plants | 回春; 种子与生根; 草木灵植 | Hồi Xuân; Hạt Giống / Bén Rễ; Linh Thực |
| Earth | 土道 | Thổ Đạo | Fortification; Mountain Breaker | 坚壁; 崩山 | Kiên Bích; Băng Sơn Quyết |
| Water | 水道 | Thủy Đạo | Flow; Tidal Domain | 流转; 潮汐领域 | Lưu Chuyển; Lĩnh Vực Thủy Triều |
| Metal | 金道 | Kim Đạo | Armor Pierce; Protective Qi | 破甲; 罡气护体 | Xuyên Giáp; Cương Khí Hộ Thể |
| Sword | 剑道 | Kiếm Đạo | Sword Intent; Flying Swords | 剑意; 飞剑 | Kiếm Ý; Phi Kiếm |
| Wind | 风道 | Phong Đạo | Gale; Pursuit | 狂风; 追击 | Cuồng Phong; Truy Kích |
| Blood | 血道 | Huyết Đạo | Lifesteal; Bleeding; Self-Harm | 汲血; 流血; 自损 | Hút Sinh Lực; Chảy Máu; Tự Tổn |
| Summoning | 奴道 | Nô Đạo | Numerical Superiority; Commands; Overwhelm; Sacrifice | 众势; 号令; 压制; 献祭 | Thế Đông; Hiệu Lệnh; Áp Đảo; Hiến Tế |
| Strength | 力道 | Lực Đạo | Battle Intent; Brute Force | 战意; 蛮力 | Chiến Ý; Man Lực |
| Refinement | 炼道 | Luyện Đạo | Refining; Re-Refinement; Recovery | 炼化; 重炼; 回收 | Luyện Hóa; Lâm Trận Trọng Luyện; Thu Hồi |
| Formation | 阵道 | Trận Đạo | Formation Setup | 布阵 | Bố Trận |
| Wisdom | 智道 | Trí Đạo | Hidden Schemes; Calculation & Deduction | 暗谋; 运筹与推演 | Ám Kế; Tính Toán và Suy Diễn |

Wind contains **Gale / 狂风 / Cuồng Phong** and **Pursuit / 追击 / Truy Kích**. Wisdom contains **Calculation & Deduction / 运筹与推演 / Tính Toán và Suy Diễn** and **Hidden Schemes / 暗谋 / Ám Kế**. The stable archetype ID `discard` now labels Hidden Schemes. Old discard designs keep their card IDs and art: `swallow-slip`, `ragged-banner`, `empty-sleeve`, and `sky-unbound` belong to Wisdom.

The Strength Path (`strength`, 力道) and Strength status (力量) are separate concepts. Basic Mastery is **基础精通 / Tinh Thông Cơ Bản**, not a renamed Strength stack.

## Canonical combat keywords

The boundary column is a current English reference excerpt. All three complete rule descriptions are authored in `KEYWORD_GLOSSARY`; the UI selects the requested locale directly.

| ID | English | 简体中文 | Tiếng Việt | Mechanical boundary |
|---|---|---|---|---|
| strength | Strength | 力量 | Sức Mạnh | Each stack adds 1 damage to every Attack hit. Maximum 10. |
| fortify | Fortify | 坚固 | Kiên Cố | Each stack increases Armor gained by 10%, rounded down. |
| weak | Weak | 虚弱 | Suy Yếu | Attack damage dealt is reduced by 25%, rounded down. |
| vulnerable | Vulnerable | 易伤 | Dễ Tổn Thương | External damage received is increased by 50%. Direct HP loss is unaffected. |
| poison | Poison | 中毒 | Trúng Độc | At the end of the owner’s turn, take external damage equal to stacks, then lose 1 stack. |
| pierce | Armor Pierce | 破甲 | Xuyên Giáp | Each stack adds 1 Attack damage. A hit that causes HP loss consumes all stacks. Maximum 6. |
| protectiveQi | Protective Qi | 罡气护体 | Cương Khí Hộ Thể | Each stack reduces every external hit by 1. At the owner’s turn end, halve stacks and round down. Maximum 5. |
| swordIntent | Sword Intent | 剑意 | Kiếm Ý | Each stack adds 1 damage per Sword Attack hit. Maximum 10. |
| tidalMomentum | Tidal Momentum | 潮势 | Triều Thế | At 4, finish the current effect, then awaken Tidal Domain. While active, retain up to 5 Momentum. |
| windMomentum | Wind Momentum | 风势 | Phong Thế | Each 3 stacks are consumed to trigger Gale: 3 external damage to every enemy, before power bonuses. |
| bleeding | Bleeding | 流血 | Chảy Máu | At 10 stacks, consume 10 to deal 12 external damage to that target. |
| flame | Explosive Flame | 爆炎 | Bạo Viêm | Explosive Flame remains until a technique detonates or spreads it. It does not deal damage by itself. |
| seed | Seeds | 种子 | Hạt Giống | At the start of your turn, Seeds grow by 1. At 3, consume 3 to deal 5 external damage and heal you for 2. |
| regen | Regeneration | 再生 | Tái Sinh | Recover HP equal to stacks at the start of the owner’s turn. |
| dodge | Dodge | 闪避 | Né Tránh | Negate the next external hit and consume 1 stack. |
| reduction | Damage Reduction | 减伤 | Giảm Sát Thương | Reduce each external hit by this amount before Intercept and Protective Qi. |
| basicPower | Basic Mastery | 基础精通 | Tinh Thông Cơ Bản | Basic Mastery increases the base effect of Basic Strike and Defense. It is separate from Strength and never changes a card’s category. |
| basicCost | Basic Dao Yuan Surcharge | 基础耗元增加 | Phụ Phí Đạo Nguyên Cơ Bản | Increases the Dao Yuan cost of Basic cards for this combat; Basic Mastery records the separate effect bonus. |
| link | Damage Link | 伤害链接 | Liên Kết Sát Thương | While active, echoes 35% of actual damage received to the linked unit as external damage. Armor and damage prevention apply. |
| restriction | Restriction | 禁制 | Cấm Chế | Restricted cards remain playable. Backlash occurs only if the restricting boss survives the card’s completed resolution. |
| energyDebt | Dao Yuan Debt | 道元负债 | Nợ Đạo Nguyên | Reduces Dao Yuan available at the start of the next turn, then clears. |
| daoYuan | Dao Yuan | 道元 | Đạo Nguyên | Pays card costs. Refill at the start of your turn; ordinary unspent Yuan does not carry over. Some effects raise this combat’s maximum. |
| armor | Armor | 护甲 | Giáp | Absorbs external damage before HP is lost. Your remaining Armor clears at the start of your next turn. Direct HP loss bypasses it. |
| activeDiscard | Active Discard | 主动弃牌 | Chủ Động Bỏ Bài | Discard caused explicitly by a card or enemy effect. It triggers Hidden Schemes on-discard effects. Natural end-turn discard, overflow and top-deck filtering do not. |
| retain | Retain | 保留 | Giữ Lại | Keeps this card in hand through the natural end-turn discard. Each real retained turn can strengthen Formation effects. Playing or actively discarding it ends its preparation. |
| exhaust | Exhaust | 消耗 | Tiêu Hao | Moves a combat card to the Exhaust pile. It will not join the normal reshuffle; recovery effects can still retrieve it. Your permanent deck is unchanged. |
| refine | Re-Refinement | 重炼 | Trọng Luyện | Temporarily raises a card’s grade for this combat. It does not change the saved permanent grade. Status cards and Divine Abilities are ungraded. |
| intercept | Intercept | 拦截 | Chặn Đòn | Up to 3 living summons intercept 20% each of incoming external damage to you. Direct HP loss bypasses Intercept. |
| summon | Summon | 召唤物 | Vật Triệu Hồi | A separate ally with its own HP, attack and statuses. Its automatic trigger is turn end, counterattack or enemy Armor breaking. Commands use the summon’s own attack stats. |
| tidalDomain | Tidal Domain | 潮汐领域 | Lĩnh Vực Thủy Triều | Choose Rising Tide, Tranquil Sea or Raging Tide when awakened and at turn end. It acts only if at least 1 Dao Yuan remains; that Yuan is checked, not spent. A Domain uses no summon slot. |
| gale | Gale | 狂风 | Cuồng Phong | Each 3 Wind Momentum triggers 3 external damage to all enemies before Gale power bonuses. Gale is not an Attack and does not gain Strength or Sword Intent. |
| nextWindDiscount | Next Wind Discount | 下张风道减耗 | Giảm Phí Phong Đạo Kế Tiếp | Reduces the Dao Yuan cost of your next Wind card this turn, to a minimum of 0. Playing that card consumes the discount; an unused discount expires at turn end. |
| lifesteal | Lifesteal | 汲血 | Hút Sinh Lực | Restores HP from actual HP damage dealt by the attack. Damage absorbed by Armor, negated or overkilled does not increase the healing. |
| directLoss | Direct HP Loss | 直接失去生命 | Mất Sinh Lực Trực Tiếp | A resource payment or explicitly direct loss. It bypasses Armor, Intercept, Dodge and Protective Qi. It is different from preventable external damage returned by Damage Link. |
| command | Command | 号令 | Hiệu Lệnh | Orders living summons to attack the chosen enemy. Each summon uses its own attack and statuses; the player’s Strength is not copied to it. |
| sacrifice | Sacrifice | 献祭 | Hiến Tế | Consumes the stated number of living summons only when enough are present, then summons the named replacement if listed. Sacrifice removes companions; it is not an incoming hit. |
| mountainBreak | Mountain Breaker | 崩山 | Băng Sơn | Consumes all current Armor and converts it to the listed damage. You lose that Armor even if the attack is defended, so read enemy intent before committing. |
| pursuit | Pursuit | 追击 | Truy Kích | Pursuit checks this turn’s play history. Wind Slash requires any earlier Wind card; Chasing Blade must be your third play; Flowing Guard requires the immediately previous card to be an Attack. Bonuses change the original effect, not its hit count. |
| calculation | Calculation & Deduction | 运筹与推演 | Tính Toán và Suy Diễn | Wisdom controls future access through drawing, searching, inspecting and ordering the top of the draw pile, and recovering discarded cards. Only explicitly revealed cards become known. |
| hiddenSchemes | Hidden Schemes | 暗谋 | Ám Kế | Wisdom turns deliberate discard and pile manipulation into draw, Dao Yuan and timing advantages. Trigger text identifies exactly what Active Discard grants. |
| basic | Basic | 基础 | Cơ Bản | Strike and Defense are the only Basic cards. Basic Mastery can strengthen them; other cards never become Basic merely because they are low grade. |
| divine | Divine Ability | 神通 | Thần Thông | An ungraded card awarded by a breakthrough. Draw it and pay its cost to activate its persistent combat effect. Owning it in the deck alone gives no passive bonus. |
| token | Token | 衍生 | Phái Sinh | A generated combat-only card. Flying Sword costs 0, attacks for 2 and Exhausts. Generated cards enter the discard pile if your 10-card hand is full. |
| statusCard | Status Card | 状态牌 | Bài Trạng Thái | A temporary harmful combat card. It cannot be learned, rewarded, traded, graded or kept in the permanent deck. Read its own play, draw or turn-end rule before handling it. |

Caps are deliberately different: **Strength 10, Armor Pierce 6, Protective Qi 5, Sword Intent 10, Tidal Momentum 5**. Damage Reduction is flat damage prevention, not a percentage. Tidal Domain checks at least one unused Dao Yuan at Player Turn end and does not spend that Yuan.

## Temporary Status cards

| ID | English | 简体中文 | Tiếng Việt | Executable rule excerpt |
|---|---|---|---|---|
| qi-disorder | Qi Disorder | 气乱 | Khí Loạn | Unplayable. Temporary: removed when combat ends. |
| meridian-disruption | Meridian Disruption | 经脉紊乱 | Kinh Mạch Rối Loạn | When drawn, before hand overflow: Lose 1 current Dao Yuan (minimum 0). Unplayable. Exhaust after triggering. Temporary: removed when combat ends. |
| internal-injury | Internal Injury | 内伤 | Nội Thương | At the end of your turn while in hand: Lose 2 HP directly. Unplayable. Exhaust after triggering. Temporary: removed when combat ends. |
| heart-demon | Heart Demon | 心魔 | Tâm Ma | Exhaust. Temporary: removed when combat ends. |
| scorched-meridian | Scorched Meridian | 灼脉 | Chước Mạch | When drawn, before hand overflow: Deal 2 damage. Unplayable. Exhaust after triggering. Temporary: removed when combat ends. |
| cloud-obscuration | Cloud Obscuration | 云障 | Vân Chướng | When drawn, before hand overflow: Gain 1 Weak. Unplayable. Exhaust after triggering. Temporary: removed when combat ends. |

Only an actual draw fires `onDraw`; direct insertion into Hand does not. Draw hooks resolve even when the hand would otherwise overflow. Natural end-turn discard does not activate Hidden Schemes. Internal Injury resolves while still in hand before natural cleanup. Heart Demon is deliberately playable; the other five Status designs are unplayable.

## Writing and QA conventions

- Keep poetic flavor separate from executable rule text. No locale may invent targeting, timing, damage categories, or acquisition routes.
- Preserve stable IDs and named variables. Store event codes and values so old logs render in the newly selected language.
- Use complete sentence templates, not concatenated translated fragments. Domain Vietnamese lookup throws on an unauthored string; it never silently falls back to English.
- Display only the active locale on cards. Encyclopedia entries provide explanations without changing the combat state.
- Grade labels must use the current display preference; numerical mechanics never depend on its wording.
- `tests/localization.test.ts` traverses content, events, enemy Intents, powers, copy, glossary and help in all three locales, checks placeholders and flags English/CJK contamination where inappropriate. `tests/content.test.ts` checks mechanical references and executable descriptions.
- Automated coverage does not establish native-speaker editorial approval, accessibility, readable narrow layouts, or human enjoyment. Browser and human review are separate evidence.
