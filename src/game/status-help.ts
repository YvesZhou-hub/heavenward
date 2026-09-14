import type { Status, Text } from './types';
import { RULES } from './rules';
const t = (en: string, zh: string, vi: string): Text => ({ en, 'zh-CN': zh, vi });
export const STATUS_SHORT: Record<Status, Text> = {
  strength: t('STR', '力', 'LỰC'), fortify: t('FTY', '坚', 'CỐ'), weak: t('WEAK', '虚', 'YẾU'),
  vulnerable: t('VULN', '易', 'TỔN'), poison: t('PSN', '毒', 'ĐỘC'), pierce: t('PIER', '破', 'XUYÊN'),
  protectiveQi: t('QI', '罡', 'KHÍ'), swordIntent: t('SWD', '剑', 'KIẾM'), tidalMomentum: t('TIDE', '潮', 'TRIỀU'),
  windMomentum: t('WIND', '风', 'PHONG'), bleeding: t('BLEED', '血', 'MÁU'), flame: t('FLAME', '炎', 'VIÊM'),
  seed: t('SEED', '种', 'HẠT'), regen: t('REGEN', '生', 'SINH'), dodge: t('DODGE', '闪', 'NÉ'),
  reduction: t('GUARD', '减', 'GIẢM'), basicPower: t('MASTERY', '精通', 'THÔNG'), basicCost: t('COST', '耗', 'PHÍ'),
  link: t('LINK', '链', 'KẾT'), restriction: t('SEAL', '禁', 'CẤM'), energyDebt: t('DEBT', '债', 'NỢ'),
};
export const STATUS_HELP: Record<Status, Text> = {
  strength: t(`Each stack adds 1 damage to every Attack hit. Maximum ${RULES.statusCaps.strength}.`, `每层使每段攻击伤害+1，上限${RULES.statusCaps.strength}层。`, `Mỗi tầng cộng 1 sát thương cho từng đòn Tấn Công. Tối đa ${RULES.statusCaps.strength} tầng.`),
  fortify: t('Each stack increases Armor gained by 10%, rounded down.', '每层使获得的护甲增加10%，向下取整。', 'Mỗi tầng tăng 10% Giáp nhận được, làm tròn xuống.'),
  weak: t('Attack damage dealt is reduced by 25%, rounded down.', '造成的攻击伤害降低25%，向下取整。', 'Sát thương Tấn Công gây ra giảm 25%, làm tròn xuống.'),
  vulnerable: t('External damage received is increased by 50%. Direct HP loss is unaffected.', '受到的外部伤害增加50%，不影响直接失去生命。', 'Sát thương bên ngoài nhận vào tăng 50%. Không ảnh hưởng mất sinh lực trực tiếp.'),
  poison: t('At the end of the owner’s turn, take external damage equal to stacks, then lose 1 stack.', '自身回合结束时受到等同层数的外部伤害，然后失去1层。', 'Cuối lượt của chủ thể, nhận sát thương bên ngoài bằng số tầng, rồi mất 1 tầng.'),
  pierce: t(`Each stack adds 1 Attack damage. A hit that causes HP loss consumes all stacks. Maximum ${RULES.statusCaps.pierce}.`, `每层使攻击伤害+1；某一段攻击造成生命损失时消耗全部层数。上限${RULES.statusCaps.pierce}层。`, `Mỗi tầng cộng 1 sát thương Tấn Công. Đòn gây mất sinh lực tiêu hết các tầng. Tối đa ${RULES.statusCaps.pierce} tầng.`),
  protectiveQi: t(`Each stack reduces every external hit by 1. At the owner’s turn end, halve stacks and round down. Maximum ${RULES.statusCaps.protectiveQi}.`, `每层使每段外部伤害-1；自身回合结束时层数减半并向下取整。上限${RULES.statusCaps.protectiveQi}层。`, `Mỗi tầng giảm 1 sát thương của từng đòn bên ngoài. Cuối lượt của chủ thể, giảm một nửa số tầng và làm tròn xuống. Tối đa ${RULES.statusCaps.protectiveQi} tầng.`),
  swordIntent: t(`Each stack adds 1 damage per Sword Attack hit. Maximum ${RULES.statusCaps.swordIntent}.`, `每层使剑道攻击每段伤害+1，上限${RULES.statusCaps.swordIntent}层。`, `Mỗi tầng cộng 1 sát thương cho từng đòn Tấn Công Kiếm Đạo. Tối đa ${RULES.statusCaps.swordIntent} tầng.`),
  tidalMomentum: t(`At ${RULES.tidalThreshold}, finish the current effect, then awaken Tidal Domain. While active, retain up to ${RULES.statusCaps.tidalMomentum} Momentum.`, `达到${RULES.tidalThreshold}层时，当前效果结算后唤醒潮汐领域。领域存在时可保有至多${RULES.statusCaps.tidalMomentum}潮势。`, `Đạt ${RULES.tidalThreshold} tầng: giải quyết xong hiệu ứng hiện tại rồi đánh thức Lĩnh Vực Thủy Triều. Khi lĩnh vực tồn tại, giữ tối đa ${RULES.statusCaps.tidalMomentum} Triều Thế.`),
  windMomentum: t(`Each ${RULES.galeThreshold} stacks are consumed to trigger Gale: ${RULES.galeDamage} external damage to every enemy, before power bonuses.`, `每积攒${RULES.galeThreshold}层自动消耗，触发狂风：对所有敌人造成${RULES.galeDamage}点外部伤害，持续能力可增加伤害。`, `Mỗi ${RULES.galeThreshold} tầng được tiêu để kích Cuồng Phong: gây ${RULES.galeDamage} sát thương bên ngoài cho mọi địch, trước phần tăng từ năng lực.`),
  bleeding: t(`At ${RULES.bleedingThreshold} stacks, consume ${RULES.bleedingThreshold} to deal ${RULES.bleedingDamage} external damage to that target.`, `达到${RULES.bleedingThreshold}层时，消耗${RULES.bleedingThreshold}层对该目标造成${RULES.bleedingDamage}点外部伤害。`, `Đạt ${RULES.bleedingThreshold} tầng: tiêu ${RULES.bleedingThreshold} tầng để gây ${RULES.bleedingDamage} sát thương bên ngoài cho mục tiêu đó.`),
  flame: t('Explosive Flame remains until a technique detonates or spreads it. It does not deal damage by itself.', '爆炎留在目标身上，可被术法引爆或蔓延，本身不会自动造成伤害。', 'Bạo Viêm lưu trên mục tiêu để thuật pháp kích nổ hoặc lan truyền; tự nó không gây sát thương.'),
  seed: t(`At the start of your turn, Seeds grow by 1. At ${RULES.seedThreshold}, consume ${RULES.seedThreshold} to deal ${RULES.seedDamage} external damage and heal you for ${RULES.seedHeal}.`, `你的回合开始时生长1层；达到${RULES.seedThreshold}层时消耗${RULES.seedThreshold}层，造成${RULES.seedDamage}点外部伤害并为你回复${RULES.seedHeal}点生命。`, `Đầu lượt của bạn, Hạt Giống tăng 1 tầng. Đạt ${RULES.seedThreshold} tầng: tiêu ${RULES.seedThreshold}, gây ${RULES.seedDamage} sát thương bên ngoài và hồi cho bạn ${RULES.seedHeal} sinh lực.`),
  regen: t('Recover HP equal to stacks at the start of the owner’s turn.', '自身回合开始时回复等同层数的生命。', 'Đầu lượt của chủ thể, hồi sinh lực bằng số tầng.'),
  dodge: t('Negate the next external hit and consume 1 stack.', '抵消下一段外部伤害，并消耗1层。', 'Vô hiệu đòn sát thương bên ngoài tiếp theo và tiêu 1 tầng.'),
  reduction: t('Reduce each external hit by this amount before Intercept and Protective Qi.', '在拦截与罡气之前，按层数减少每段外部伤害。', 'Giảm sát thương mỗi đòn bên ngoài theo số tầng, trước Chặn Đòn và Cương Khí Hộ Thể.'),
  basicPower: t('Basic Mastery increases the base effect of Basic Strike and Defense. It is separate from Strength and never changes a card’s category.', '基础精通提高基础打击与防御的基础效果，与力量独立，不会改变卡牌类别。', 'Tinh Thông Cơ Bản tăng hiệu ứng gốc của Đả Kích và Phòng Ngự Cơ Bản. Chỉ số này độc lập với Sức Mạnh và không đổi loại bài.'),
  basicCost: t('Increases the Dao Yuan cost of Basic cards for this combat; Basic Mastery records the separate effect bonus.', '本场战斗增加基础牌道元消耗；效果加成另由基础精通记录。', 'Tăng phí Đạo Nguyên của bài Cơ Bản trong trận này; phần tăng hiệu ứng được ghi riêng ở Tinh Thông Cơ Bản.'),
  link: t(`While active, echoes ${RULES.linkPercent}% of actual damage received to the linked unit as external damage. Armor and damage prevention apply.`, `生效期间，将实际所受伤害的${RULES.linkPercent}%作为外部伤害传给链接者，可被护甲和防御机制抵挡。`, `Khi còn hiệu lực, truyền ${RULES.linkPercent}% sát thương thực nhận sang người liên kết dưới dạng sát thương bên ngoài. Giáp và cơ chế phòng ngự vẫn áp dụng.`),
  restriction: t('Restricted cards remain playable. Backlash occurs only if the restricting boss survives the card’s completed resolution.', '被禁制的牌仍可使用；整张牌结算后，若施加禁制的首领仍存活，才会反噬。', 'Bài bị cấm vẫn dùng được. Phản phệ chỉ xảy ra nếu trùm đặt cấm còn sống sau khi toàn bộ lá bài giải quyết xong.'),
  energyDebt: t('Reduces Dao Yuan available at the start of the next turn, then clears.', '下回合开始时减少可用道元，随后清除。', 'Giảm Đạo Nguyên có thể dùng ở đầu lượt tiếp theo, rồi xóa.'),
};
export const ENEMY_PORTRAIT: Record<string, number> = {
  'thorn-stalker':2,'river-spirit':2,'gale-thief':1,'blood-moth':4,'lantern-acolyte':5,'jade-hunter':1,'script-devourer':5,'road-bandit':1,'jade-beetle':2,'thorn-spirit':2,'river-eel':2,'iron-disciple':1,'wind-marauder':1,'blood-acolyte':4,'stone-guardian':2,'hollow-monk':5,'brood-matriarch':2,'blade-master':1,'cloud-wisp':3,'cloud-beastmaster':3,'link-cultivator':4,'restriction-soul':5,'thunder-judge':3,'mirror-hermit':5,
};
