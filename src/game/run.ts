import { CARDS, ENEMIES, REALMS, eliteEncounterIds, normalEncounterIds } from './content';
import { createCombat, describeCard } from './combat';
import { RULES } from './rules';
import type { CardDef, CardInstance, Combat, Grade, Locale, Text } from './types';

export const RULES_VERSION = 'human-0.3.0';
export const CONTENT_VERSION = 'human-0.3.0';
export type NodeKind = 'combat'|'elite'|'event'|'merchant'|'rest'|'inheritance'|'tribulation';
export type RunPhase = 'starting'|'road'|'combat'|'reward'|'merchant'|'rest'|'event'|'inheritance'|'breakthrough'|'dead'|'ascended';
export interface RoadNode { id:string; kind:NodeKind; encounter?:string[]; eventId?:number; hint?:Text; }
export interface RoadVisit {node:RoadNode;realm:number;depth:number;}
export interface ProgressionReceipt {
  id:string; kind:'minor'|'major'; from:{realm:number;stage:number}; to:{realm:number;stage:number}|null;
  grants:{maxHp:number;healing:number;gold:number;energy:number;normalGrade:number};
  before:{hp:number;maxHp:number;energy:number;normalGrade:number;removalFloor:number};
  after:{hp:number;maxHp:number;energy:number;normalGrade:number;removalFloor:number};
  pendingChoices:{kind:'divine'|'foundation';count:number;maxAcquisitions:1;roundsRemaining:number;optional:true}|null;
  acknowledged:boolean; view:'notice'|'receipt'|'choices'|'complete';
}
export interface Run {
  id:string; seed:number; rng:number; rulesVersion:string; contentVersion:string; revision:number;
  startedAt:number; activeMs:number; endedAt?:number; phase:RunPhase; realm:number; depth:number; serial:number;
  hp:number; maxHp:number; gold:number; deck:CardInstance[]; startingRound:number; offers:CardInstance[];
  nodes:RoadNode[]; visited:NodeKind[]; routeHistory:RoadVisit[]; current:RoadNode|null; combat:Combat|null; bossId:string;
  rewardKind:'normal'|'divine'|'foundation'; draftRemaining:number; shop:{sold:number;upgraded:number;purchased:string[]};
  stats:{combats:number;elites:number;tribulations:number;cards:number;gold:number}; journal:{code:string;value?:string|number}[];
  progressionReceipts:ProgressionReceipt[];
  compatibility?:{fromRulesVersion:'human-0.2.0';fromContentVersion:'human-0.2.0';mode:'snapshot-continuation';noticeAcknowledged:boolean;};
}
export interface RunSummary {id:string;seed:number;realm:number;outcome:'dead'|'ascended';duration:number;durationKind:'active'|'legacy-wall';stats:Run['stats'];paths:string[];cause:Text;}
export interface Meta { history:RunSummary[]; discovered:string[]; unlocks:string[]; }
export const emptyMeta = ():Meta=>({history:[],discovered:['strike','defense'],unlocks:[]});
export const OFFER_COUNTS={starting:5,normal:5,elite:5,inheritance:5,merchant:5,divine:3,rare:5,foundation:5} as const;
export const STAGES:Text[]=[{en:'Early','zh-CN':'初期',vi:"Sơ kỳ"},{en:'Middle','zh-CN':'中期',vi:"Trung kỳ"},{en:'Late','zh-CN':'后期',vi:"Hậu kỳ"},{en:'Peak','zh-CN':'巅峰',vi:"Đỉnh phong"}];
export const NODE_NAMES:Record<NodeKind,Text>={combat:{en:'Encounter','zh-CN':'遭遇',vi:"Giao chiến"},elite:{en:'Elite','zh-CN':'精英',vi:"Tinh anh"},event:{en:'Unknown','zh-CN':'奇遇',vi:"Kỳ ngộ"},merchant:{en:'Merchant','zh-CN':'坊市',vi:"Thương nhân"},rest:{en:'Rest site','zh-CN':'歇脚处',vi:"Điểm nghỉ"},inheritance:{en:'Inheritance','zh-CN':'传承',vi:"Truyền thừa"},tribulation:{en:'Heavenly Tribulation','zh-CN':'天劫',vi:"Thiên kiếp"}};
export const NODE_DESCRIPTION:Record<NodeKind,Text>={combat:{en:'Face a wandering foe. Earn spirit stones and a technique.','zh-CN':'迎战道途之敌，获取灵石与术法。',vi:"Đối mặt kẻ địch trên đường. Nhận linh thạch và một thuật pháp."},elite:{en:'A dangerous opponent guards an exceptional reward.','zh-CN':'强敌守护着罕见的术法。',vi:"Một đối thủ nguy hiểm đang giữ phần thưởng quý hiếm."},event:{en:'A chance meeting. Its price is not yet known.','zh-CN':'一段未卜的缘分，代价尚不可知。',vi:"Một cuộc gặp bất ngờ. Cái giá vẫn chưa rõ."},merchant:{en:'Buy, sell, or refine the techniques in your deck.','zh-CN':'购入、出售或提升牌组中的术法。',vi:"Mua, bán hoặc nâng cấp thuật pháp trong bộ bài."},rest:{en:'Recover your wounds or upgrade one card.','zh-CN':'疗伤，或免费提升一张牌。',vi:"Hồi phục vết thương hoặc nâng cấp một lá bài."},inheritance:{en:'An old master left a lesson for someone yet to come.','zh-CN':'前人留下的道法，静待后来之人。',vi:"Một bậc tiền bối để lại bài học cho người đến sau."},tribulation:{en:'The heavens judge your cultivation. Victory opens the next realm.','zh-CN':'天地试道，渡劫后方可更进一步。',vi:"Trời cao thử thách tu vi của bạn. Chiến thắng mở ra cảnh giới tiếp theo."}};
export const EVENTS:{name:Text;story:Text;options:{label:Text;description:Text}[]}[]=[
 {name:{en:'The ferryman without a face','zh-CN':'无面渡者',vi:"Người lái đò vô diện"},story:{en:'A paper boat waits on a river of stars. The ferryman holds out two bowls: one filled with blood, the other with moonlight.','zh-CN':'纸舟泊在星河上。渡者递来两只碗，一只盛血，一只盛月光。',vi:"Một chiếc thuyền giấy đợi trên dòng sông sao. Người lái đò đưa ra hai bát: một chứa máu, một chứa ánh trăng."},options:[{label:{en:'Leave a little blood','zh-CN':'赠一滴心血',vi:"Để lại một chút máu"},description:{en:'Lose 8 HP. Gain 55 spirit stones.','zh-CN':'失去8点生命，获得55灵石。',vi:"Mất 8 HP. Nhận 55 linh thạch."}},{label:{en:'Drink the moonlight','zh-CN':'饮一口月光',vi:"Uống ánh trăng"},description:{en:'Recover 10 HP. Leave peacefully.','zh-CN':'回复10点生命，安然离去。',vi:"Hồi 10 HP. Rời đi bình yên."}}]},
 {name:{en:'A sword beneath the roots','zh-CN':'树下遗剑',vi:"Thanh kiếm dưới rễ cây"},story:{en:'Roots have grown through a nameless cultivator’s sword. The inscription is still warm: “Nothing is lost that can be passed on.”','zh-CN':'无名修士的剑已被树根缠绕。剑铭犹温：“传于后人，便未曾失去。”',vi:"Rễ cây quấn quanh thanh kiếm của một tu sĩ vô danh. Dòng chữ khắc vẫn còn ấm: “Điều được truyền lại sẽ không mất đi.”"},options:[{label:{en:'Receive the old lesson','zh-CN':'承接旧学',vi:"Tiếp nhận bài học xưa"},description:{en:'Choose a technique at your current grade.','zh-CN':'选择一张当前品阶的术法。',vi:"Chọn một thuật pháp ở phẩm hiện tại."}},{label:{en:'Leave an offering','zh-CN':'留下一份敬意',vi:"Để lại lễ vật"},description:{en:'Pay 20 spirit stones. Heal 25% of maximum HP.','zh-CN':'支付20灵石，回复25%生命上限。',vi:"Trả 20 linh thạch. Hồi 25% HP tối đa."}}]},
 {name:{en:'The broken alchemy furnace','zh-CN':'残炉余火',vi:"Lò luyện đan tan vỡ"},story:{en:'A small flame has burned here for a hundred winters. Feed it a spirit stone and the stone begins to sing.','zh-CN':'一点炉火熬过了百年寒冬。投入一枚灵石，石中竟传来清鸣。',vi:"Một ngọn lửa nhỏ cháy qua trăm mùa đông. Thả linh thạch vào, viên đá bắt đầu cất tiếng."},options:[{label:{en:'Tend the furnace','zh-CN':'温养炉火',vi:"Chăm sóc ngọn lửa"},description:{en:'Pay 25 spirit stones. Upgrade one card.','zh-CN':'支付25灵石，提升一张牌。',vi:"Trả 25 linh thạch. Nâng cấp một lá bài."}},{label:{en:'Gather the embers','zh-CN':'收集余烬',vi:"Gom tàn lửa"},description:{en:'Gain 25 spirit stones.','zh-CN':'获得25灵石。',vi:"Nhận 25 linh thạch."}}]},
 {name:{en:'The reflection that stayed','zh-CN':'未散之影',vi:"Bóng phản chiếu còn lại"},story:{en:'Your reflection remains kneeling after you stand. “What will you carry into the next life?” it asks.','zh-CN':'你已起身，水中的倒影却仍跪坐着。“下一世，你要带走什么？”它问。',vi:"Bạn đứng dậy nhưng bóng phản chiếu vẫn quỳ. Nó hỏi: “Bạn sẽ mang gì sang kiếp sau?”"},options:[{label:{en:'The strength to continue','zh-CN':'继续前行之力',vi:"Sức mạnh để tiếp tục"},description:{en:'Recover 15 HP.','zh-CN':'回复15点生命。',vi:"Hồi 15 HP."}},{label:{en:'A new understanding','zh-CN':'一份新的领悟',vi:"Một nhận thức mới"},description:{en:'Lose 5 HP. Choose a rare technique.','zh-CN':'失去5点生命，选择一张罕见术法。',vi:"Mất 5 HP. Chọn một thuật pháp hiếm."}}]}
];

export function random(r:{rng:number}):number { let x=r.rng>>>0; x^=x<<13; x^=x>>>17; x^=x<<5; r.rng=x>>>0; return r.rng/4294967296; }
function weighted<T>(r:Run,values:T[],weight:(v:T)=>number):T { const sum=values.reduce((s,v)=>s+weight(v),0);let n=random(r)*sum;for(const v of values){n-=weight(v);if(n<0)return v;}return values[values.length-1]; }
function pick<T>(r:Run,items:T[]):T{return items[Math.floor(random(r)*items.length)];}
export function instance(r:Run,id:string,grade=r.realm):CardInstance {return {uid:`${r.seed}-${++r.serial}`,defId:id,grade:(CARDS[id].category==='divine'?0:grade) as Grade,retained:0};}
export type OfferSource='starting'|'normal'|'elite'|'inheritance'|'merchant'|'divine'|'rare';
/** Basics and Tokens cannot dilute the profile; multiplicity reflects the real deck. */
export function deckProfile(r:Run){
 const cards=r.deck.map(c=>CARDS[c.defId]).filter(c=>c&&!['basic','token','status'].includes(c.category));
 const paths:Record<string,number>={},archetypes:Record<string,number>={};
 for(const card of cards){paths[card.path]=(paths[card.path]??0)+1;archetypes[card.archetype]=(archetypes[card.archetype]??0)+1;}
 return{size:cards.length,paths,archetypes};
}
export function offerWeight(r:Run,c:CardDef,source:OfferSource='normal',profile=deckProfile(r)):number{
 const denominator=Math.max(1,profile.size);
 const affinity=(profile.paths[c.path]??0)/denominator,archetype=(profile.archetypes[c.archetype]??0)/denominator;
 const utility=c.effects.some(e=>['draw','energy','recover','scry','search','costReduce','heal','armor'].includes(e.op));
 const bridge=c.effects.some(e=>e.op==='flyingSwords'&&!!profile.paths.refinement||e.op==='draw'&&!!profile.paths.wind||e.op==='energy'&&!!profile.paths.water||e.op==='armor'&&!!profile.archetypes.mountain||e.op==='summon'&&(!!profile.paths.summoning||!!profile.paths.wood)||e.op==='mountainBreak'&&!!profile.paths.earth||e.status==='swordIntent'&&!!profile.paths.sword);
 const rarity=c.rarity==='rare'?.6:c.rarity==='uncommon'?1:1.8;
 const category=c.category==='immortal'?(source==='elite'||source==='inheritance'?1.4:.15):1;
 // A positive off-Path floor always allows pivots; no class/Path lock exists.
 return rarity*category*(1+1.8*affinity+1.2*archetype+(utility?.2:0)+(bridge?.45:0));
}
export function drawOffers(r:Run,count:number=OFFER_COUNTS.normal,source:OfferSource='normal'):CardInstance[]{
 let pool=Object.values(CARDS).filter(c=>source==='divine'?c.category==='divine'&&!r.deck.some(x=>x.defId===c.id):source==='starting'?c.category==='dao'&&c.starting:source==='rare'?c.category==='immortal'||c.category==='dao'&&c.rarity==='rare':c.category==='dao'||c.category==='immortal');
 const result:CardInstance[]=[],profile=deckProfile(r);
 while(result.length<count&&pool.length){const c=weighted(r,pool,c=>offerWeight(r,c,source,profile));result.push(instance(r,c.id,source==='starting'?0:r.realm));pool=pool.filter(p=>p.id!==c.id);}
 return result;
}
function chooseBoss(r:Run){const bosses=Object.values(ENEMIES).filter(e=>e.boss);r.bossId=weighted(r,bosses,b=>1+(b.affinity?.filter(p=>r.deck.some(c=>CARDS[c.defId].path===p)).length??0)*.2).id;}
export interface BreakthroughPackage {fromRealm:number;toRealm:number|null;gold:number;maxHpGain:number;healFraction:number;divineChoices:number;energyBefore:number;energyAfter:number;normalGradeBefore:Grade;normalGradeAfter:Grade;maxUsableGradeAfter:Grade;}
/** Five explicit gates; the final package ends the life rather than opening another realm. */
export const BREAKTHROUGH_PACKAGES:readonly BreakthroughPackage[]=[
 {fromRealm:0,toRealm:1,gold:80,maxHpGain:12,healFraction:.3,divineChoices:3},
 {fromRealm:1,toRealm:2,gold:95,maxHpGain:12,healFraction:.3,divineChoices:3},
 {fromRealm:2,toRealm:3,gold:110,maxHpGain:12,healFraction:.3,divineChoices:3},
 {fromRealm:3,toRealm:4,gold:125,maxHpGain:12,healFraction:.3,divineChoices:3},
 {fromRealm:4,toRealm:null,gold:140,maxHpGain:0,healFraction:0,divineChoices:0},
].map(row=>({...row,energyBefore:RULES.energy[row.fromRealm],energyAfter:RULES.energy[row.toRealm??row.fromRealm],normalGradeBefore:row.fromRealm as Grade,normalGradeAfter:(row.toRealm??row.fromRealm) as Grade,maxUsableGradeAfter:Math.min(5,(row.toRealm??row.fromRealm)+1) as Grade}));
export function getLastBreakthrough(run:Run){
 if(!['breakthrough','ascended'].includes(run.phase))return null;
 const receipt=BREAKTHROUGH_PACKAGES[run.phase==='ascended'?4:run.realm-1];if(!receipt)return null;
 const hpBefore=run.combat?.player.hp??run.hp;
 return{...receipt,hpBefore,hpAfter:run.hp,actualHealing:Math.max(0,run.hp-hpBefore),maxHpBefore:run.maxHp-receipt.maxHpGain,maxHpAfter:run.maxHp};
}
export function getPendingProgression(run:Run):ProgressionReceipt|null{const latest=run.progressionReceipts.at(-1);return latest&&!latest.acknowledged?latest:null;}
export function acknowledgeProgression(run:Run,id:string):Run{
 const found=run.progressionReceipts.find(receipt=>receipt.id===id);if(!found||found.kind!=='minor'||found.acknowledged)return run;
 const r=clone(run);r.progressionReceipts.find(receipt=>receipt.id===id)!.acknowledged=true;changed(r,'progression-read',id);return r;
}
export function acknowledgeCompatibility(run:Run):Run{
 if(!run.compatibility||run.compatibility.noticeAcknowledged)return run;const r=clone(run);r.compatibility!.noticeAcknowledged=true;changed(r,'compatibility-read',r.compatibility!.fromRulesVersion);return r;
}
/** Grants and offers were committed before this screen; Continue only changes its durable view. */
export function continueBreakthrough(run:Run,id:string):Run{
 const found=run.progressionReceipts.find(receipt=>receipt.id===id);
 if(!found||found.kind!=='major'||found.view!=='receipt'||!['breakthrough','ascended'].includes(run.phase))return run;
 const r=clone(run),receipt=r.progressionReceipts.find(receipt=>receipt.id===id)!;receipt.acknowledged=true;receipt.view=r.phase==='ascended'?'complete':'choices';changed(r,'breakthrough-continue',id);return r;
}
function progressionState(r:Run){return{hp:r.hp,maxHp:r.maxHp,energy:RULES.energy[r.realm],normalGrade:r.realm,removalFloor:REALMS[r.realm].minDeck};}
const scenery=(en:string,zh:string,vi:string):Text=>({en,'zh-CN':zh,vi});
export const ENCOUNTER_HINTS:Record<string,Text>={
 'road-bandit':scenery('Bootsteps stop beyond the bend. A blade catches moonlight, then waits behind a patient guard.','转角外的脚步忽然停住。刀锋掠过月色，又隐在耐心的守势之后。','Tiếng giày dừng sau khúc quanh. Lưỡi đao lóe dưới trăng rồi ẩn sau thế thủ kiên nhẫn.'),
 'thorn-stalker':scenery('Sweet rot hangs among the thorns. Something beneath the roots grows stronger the longer you linger.','棘丛间浮着甜腻的腐气。根下之物正随你的驻足一点点生长。','Mùi mục ngọt lẩn trong bụi gai. Thứ dưới rễ cây càng mạnh khi bạn nấn ná.'),
 'stone-guardian':scenery('Stone grinds against stone at an ancient gate. The silence between its heavy steps may hide an opening.','古门前传来岩石相碾之声。沉重脚步之间的寂静，或许藏着破绽。','Đá nghiến trên đá trước cổng cổ. Khoảng lặng giữa những bước chân nặng có thể là sơ hở.'),
 'river-spirit':scenery('Ripples travel against the current. Several small waves gather where a single footstep touches the water.','涟漪逆流而上。一足落水之处，数重细浪已悄然聚拢。','Gợn nước đi ngược dòng. Nhiều đợt sóng nhỏ tụ lại nơi một bước chân chạm nước.'),
 'iron-disciple':scenery('A golden breath clouds the cold air. Knuckles tighten slowly behind that thin, stubborn veil.','一口金息凝在寒空。薄而坚韧的气幕之后，指节正缓缓收紧。','Hơi thở vàng đọng trong khí lạnh. Sau màn khí mỏng bền bỉ, những đốt tay siết lại.'),
 'gale-thief':scenery('Loose pages rise in a wind you cannot feel. Light footsteps circle just beyond the edge of sight.','无风处，散页自行飘起。轻浅脚步徘徊在视线之外。','Những trang rời bay lên dù không có gió. Bước chân nhẹ vòng quanh ngoài tầm mắt.'),
 'blood-moth,lantern-acolyte':scenery('The scent of blood follows a wavering lantern. Wings and footsteps approach together through the mist.','血腥气随摇曳灯火而来。雾里，振翅声与脚步声一同逼近。','Mùi máu theo ngọn đèn chập chờn. Tiếng cánh và bước chân cùng tiến qua sương.'),
 'jade-hunter':scenery('Jade dust marks the path like a trail of stars. Somewhere above, a hunter has already chosen where to strike.','玉屑如星痕散在路上。高处的猎手，早已选定落枪之地。','Bụi ngọc rải trên đường như dấu sao. Trên cao, người thợ săn đã chọn nơi ra đòn.'),
 'hollow-monk':scenery('A hollow bell rings without a hand to strike it. After each note, the ruined temple becomes unnaturally still.','空钟无人自鸣。每一声余响之后，残寺都静得异乎寻常。','Chuông rỗng tự ngân không người gõ. Sau mỗi tiếng, ngôi chùa đổ nát im lặng khác thường.'),
 'brood-matriarch':scenery('The earth moves beneath a nest of pale roots. One breath answers another, and then another.','苍白根须结成的巢穴下，泥土正在蠕动。一声喘息，引来更多回应。','Đất chuyển dưới tổ rễ nhợt nhạt. Một hơi thở gọi đáp một hơi khác, rồi thêm nữa.'),
 'script-devourer':scenery('Ink drains from an abandoned scroll. The blank space seems hungry for the thought you were about to finish.','弃卷上的墨迹正缓缓褪去。那片空白，仿佛正等着吞下你未尽的念头。','Mực rút khỏi cuộn sách bỏ quên. Khoảng trắng như đang đói ý nghĩ bạn chưa kịp hoàn thành.'),
};
type RoadStep='combat'|'elite'|'utility'|'tribulation';
export const ROAD_PLAN:readonly (readonly RoadStep[])[]=[
 ['combat','utility','combat','utility','tribulation'],
 ['combat','utility','elite','combat','tribulation'],
 ['combat','utility','combat','utility','tribulation'],
 ['combat','utility','elite','combat','tribulation'],
 ['combat','utility','elite','combat','utility','tribulation'],
];
export const roadLength=(realm:number)=>ROAD_PLAN[realm].length;
export const stageIndex=(r:Pick<Run,'realm'|'depth'>)=>Math.min(3,Math.floor(r.depth*4/roadLength(r.realm)));
export const isPeak=(r:Pick<Run,'realm'|'depth'>)=>stageIndex(r)===3;
export function roadView(r:Run){return{next:r.nodes.map(({id,kind,hint})=>({id,kind,hint:hint??NODE_DESCRIPTION[kind]})),current:r.current?{id:r.current.id,kind:r.current.kind}:null,history:r.routeHistory.map(v=>({realm:v.realm,depth:v.depth,id:v.node.id,kind:v.node.kind}))};}
function prepareRoad(r:Run){
 r.phase='road';r.combat=null;r.current=null;r.offers=[];
 const step=ROAD_PLAN[r.realm][r.depth];
 if(!step)throw new Error('Invalid route position');
 let kinds:NodeKind[];
 if(step==='utility'){
  const pool:NodeKind[]=['rest','merchant','event','inheritance']; kinds=[];
  while(kinds.length<3){const selected=pick(r,pool);kinds.push(selected);pool.splice(pool.indexOf(selected),1);}
 }else kinds=step==='tribulation'?['tribulation']:[step,step,step];
 const used=new Set<string>();
 r.nodes=kinds.map((kind,i)=>{
  let foes:string[]|undefined;
  if(kind==='combat'||kind==='elite'){
   const groups=(kind==='elite'?eliteEncounterIds:normalEncounterIds).filter(group=>!used.has(group.join(',')));
   foes=[...pick(r,groups)];used.add(foes.join(','));
  }else if(kind==='tribulation')foes=[r.bossId];
  const hint=kind==='tribulation'?(ENEMIES[r.bossId].omen??NODE_DESCRIPTION[kind]):foes?(ENCOUNTER_HINTS[foes.join(',')]??NODE_DESCRIPTION[kind]):NODE_DESCRIPTION[kind];
  return{id:`${r.realm}-${r.depth}-${i}`,kind,encounter:foes,eventId:kind==='event'?Math.floor(random(r)*EVENTS.length):undefined,hint};
 });
}
export function newRun(seed:number,startedAt=0):Run {
  const r:Run={id:`${seed}-${startedAt}`,seed,rng:seed>>>0||1,rulesVersion:RULES_VERSION,contentVersion:CONTENT_VERSION,revision:0,startedAt,activeMs:0,phase:'starting',realm:0,depth:0,serial:0,hp:72,maxHp:72,gold:65,deck:[],startingRound:0,offers:[],nodes:[],visited:[],routeHistory:[],current:null,combat:null,bossId:'',rewardKind:'normal',draftRemaining:0,shop:{sold:0,upgraded:0,purchased:[]},stats:{combats:0,elites:0,tribulations:0,cards:0,gold:0},journal:[],progressionReceipts:[]};
  for(let i=0;i<5;i++)r.deck.push(instance(r,'strike',0));for(let i=0;i<5;i++)r.deck.push(instance(r,'defense',0));r.offers=drawOffers(r,OFFER_COUNTS.starting,'starting');return r;
}
const clone=(r:Run)=>structuredClone(r);
function changed(r:Run,code:string,value?:string|number){r.revision++;r.journal.push({code,value});}
export function chooseStarting(run:Run,uid:string):Run{if(run.phase!=='starting')return run;const r=clone(run);const card=r.offers.find(c=>c.uid===uid);if(!card)return run;r.deck.push(card);r.stats.cards++;r.startingRound++;changed(r,'starting',card.defId);if(r.startingRound===2){chooseBoss(r);prepareRoad(r);}else r.offers=drawOffers(r,OFFER_COUNTS.starting,'starting');return r;}
export function enterNode(run:Run,id:string):Run{if(run.phase!=='road')return run;const r=clone(run);const node=r.nodes.find(n=>n.id===id);if(!node)return run;r.current=node;r.nodes=[];changed(r,'node',node.kind);
  if(node.encounter){r.phase='combat';r.combat=createCombat({seed:Math.floor(random(r)*4294967295)||1,realm:r.realm,hp:r.hp,maxHp:r.maxHp,deck:r.deck,enemies:node.encounter});}
  else if(node.kind==='merchant'){r.phase='merchant';r.shop={sold:0,upgraded:0,purchased:[]};r.offers=drawOffers(r,OFFER_COUNTS.merchant,'merchant');}
  else if(node.kind==='inheritance'){r.phase='inheritance';r.rewardKind='normal';r.offers=drawOffers(r,OFFER_COUNTS.inheritance,'inheritance');}
  else r.phase=node.kind as RunPhase;return r;
}
function rememberNode(r:Run){if(r.current){r.visited.push(r.current.kind);r.routeHistory.push({node:structuredClone(r.current),realm:r.realm,depth:r.depth});}}
function finishNode(r:Run){
 const from={realm:r.realm,stage:stageIndex(r)},before=progressionState(r);rememberNode(r);r.depth++;
 if(r.depth>=roadLength(r.realm))throw new Error('Tribulation must be resolved through breakthrough.');
 if(stageIndex(r)!==from.stage)r.progressionReceipts.push({id:`${r.id}:minor:${r.realm}:${stageIndex(r)}`,kind:'minor',from,to:{realm:r.realm,stage:stageIndex(r)},grants:{maxHp:0,healing:0,gold:0,energy:0,normalGrade:0},before,after:{...before},pendingChoices:null,acknowledged:false,view:'notice'});
 prepareRoad(r);
}
export function commitCombat(run:Run,combat:Combat):Run{if(run.phase!=='combat'||run.combat?.seed!==combat.seed||combat.actions.length<=run.combat.actions.length)return run;const r=clone(run);r.combat=structuredClone(combat);r.hp=combat.player.hp;changed(r,'combat',combat.turn);
  if(combat.phase==='lost'){r.phase='dead';return r;}
  if(combat.phase==='won'){
    const kind=r.current!.kind;const rewardPackage=BREAKTHROUGH_PACKAGES[r.realm];const gold=kind==='tribulation'?rewardPackage.gold:kind==='elite'?45+r.realm*8:22+r.realm*5;r.gold+=gold;r.stats.gold+=gold;
    if(kind==='tribulation'){
      const from={realm:r.realm,stage:stageIndex(r)},before=progressionState(r);r.stats.tribulations++;rememberNode(r);
      if(r.realm===4){r.phase='ascended';r.offers=[];r.draftRemaining=0;}
      else{r.realm=rewardPackage.toRealm!;r.depth=0;r.maxHp+=rewardPackage.maxHpGain;r.hp=Math.min(r.maxHp,r.hp+Math.floor(r.maxHp*rewardPackage.healFraction));r.phase='breakthrough';r.rewardKind='divine';r.offers=drawOffers(r,rewardPackage.divineChoices,'divine');r.draftRemaining=Math.max(0,REALMS[r.realm].minDeck-r.deck.length);}
      const after=progressionState(r);r.progressionReceipts.push({id:`${r.id}:major:${from.realm}`,kind:'major',from,to:r.phase==='ascended'?null:{realm:r.realm,stage:0},grants:{maxHp:after.maxHp-before.maxHp,healing:after.hp-before.hp,gold,energy:after.energy-before.energy,normalGrade:after.normalGrade-before.normalGrade},before,after,pendingChoices:r.phase==='ascended'?null:{kind:'divine',count:r.offers.length,maxAcquisitions:1,roundsRemaining:1,optional:true},acknowledged:false,view:'receipt'});return r;
    }
    if(kind==='elite')r.stats.elites++;else r.stats.combats++;r.phase='reward';r.rewardKind='normal';r.offers=drawOffers(r,kind==='elite'?OFFER_COUNTS.elite:OFFER_COUNTS.normal,kind==='elite'?'elite':'normal');
  }return r;
}
function advanceBreakthroughRewards(r:Run,skipFoundation=false){
 r.draftRemaining=skipFoundation?0:Math.max(0,REALMS[r.realm].minDeck-r.deck.length);
 const receipt=[...r.progressionReceipts].reverse().find(item=>item.kind==='major');
 if(r.draftRemaining>0){r.rewardKind='foundation';r.offers=drawOffers(r,OFFER_COUNTS.foundation,'normal');if(receipt)receipt.pendingChoices={kind:'foundation',count:r.offers.length,maxAcquisitions:1,roundsRemaining:r.draftRemaining,optional:true};}
 else{if(receipt){receipt.pendingChoices=null;receipt.view='complete';}chooseBoss(r);prepareRoad(r);}
}
export function takeReward(run:Run,uid:string|null,_obsoleteReplacementUid?:string):Run{
  void _obsoleteReplacementUid;
  if(!['reward','inheritance','breakthrough'].includes(run.phase))return run;const r=clone(run);const card=uid?r.offers.find(c=>c.uid===uid):null;if(uid&&!card)return run;
  if(r.phase==='breakthrough'&&r.progressionReceipts.some(receipt=>receipt.kind==='major'&&receipt.view==='receipt'))return run;
  if(card){
    if(CARDS[card.defId].category==='divine'&&(r.phase!=='breakthrough'||r.rewardKind!=='divine'||r.deck.filter(c=>CARDS[c.defId].category==='divine').length>=4))return run;
    r.deck.push(card);r.stats.cards++;
  }changed(r,'reward',card?.defId??'skip');r.offers=[];
  if(r.phase==='breakthrough')advanceBreakthroughRewards(r,r.rewardKind==='foundation'&&!card);else finishNode(r);return r;
}
export function restPreview(run:Run){const heal=Math.min(run.maxHp-run.hp,Math.floor(run.maxHp*.25));return{available:run.phase==='rest'&&run.current?.eventId!==99,hpBefore:run.hp,hpAfter:run.hp+heal,heal};}
export function restHeal(run:Run):Run{const preview=restPreview(run);if(!preview.available)return run;const r=clone(run);r.hp=preview.hpAfter;changed(r,'rest',preview.heal);finishNode(r);return r;}
export function canUpgrade(r:Run,c:CardInstance){return !!CARDS[c.defId]&&!['divine','token','status'].includes(CARDS[c.defId].category)&&c.grade<Math.min(7,r.realm+1);}
export const ECONOMY={cardBaseOverrides:{} as Record<string,number>,categoryBase:{basic:24,dao:30,immortal:85,divine:0,token:0,status:0},rarityBonus:{common:0,uncommon:8,rare:28},gradeStep:12,saleRatio:.35,divineSale:65,upgradeBase:35,upgradeRealmStep:10,secondUpgradeBase:70,secondUpgradeRealmStep:15} as const;
export function upgradeCost(r:Run){return r.shop.upgraded===0?ECONOMY.upgradeBase+r.realm*ECONOMY.upgradeRealmStep:ECONOMY.secondUpgradeBase+r.realm*ECONOMY.secondUpgradeRealmStep;}
export function price(c:CardInstance){const d=CARDS[c.defId];return (ECONOMY.cardBaseOverrides[c.defId]??ECONOMY.categoryBase[d.category])+ECONOMY.rarityBonus[d.rarity]+c.grade*ECONOMY.gradeStep;}
export function salePrice(c:CardInstance){return CARDS[c.defId].category==='divine'?ECONOMY.divineSale:Math.floor(price(c)*ECONOMY.saleRatio);}
export interface UpgradePreview {runId:string;revision:number;uid:string;available:boolean;reason:'phase'|'missing'|'grade'|'limit'|'funds'|null;cost:number;goldBefore:number;goldAfter:number;before:CardInstance|null;after:CardInstance|null;beforeText:string;afterText:string;}
/** Pure quote, shared by Rest and Merchant; opening/canceling never changes RNG or state. */
export function previewUpgrade(r:Run,uid:string,locale:Locale='en'):UpgradePreview{
 const card=r.deck.find(c=>c.uid===uid),cost=r.phase==='merchant'?upgradeCost(r):0;
 const reason=!['rest','merchant'].includes(r.phase)?'phase':!card?'missing':!canUpgrade(r,card)?'grade':r.phase==='merchant'&&r.shop.upgraded>=2?'limit':r.gold<cost?'funds':null;
 const before=card?structuredClone(card):null,after=before&&canUpgrade(r,card!)?{...before,grade:(before.grade+1) as Grade}:null;
 return{runId:r.id,revision:r.revision,uid,available:reason===null,reason,cost,goldBefore:r.gold,goldAfter:r.gold-cost,before,after,beforeText:before?describeCard(before,locale):'',afterText:after?describeCard(after,locale):''};
}
/** The revision and card identity make stale/double confirmation an atomic no-op. */
export function confirmUpgrade(run:Run,quote:Pick<UpgradePreview,'runId'|'revision'|'uid'|'cost'>):Run{
 if(quote.runId!==run.id||quote.revision!==run.revision)return run;
 const checked=previewUpgrade(run,quote.uid);if(!checked.available||quote.cost!==checked.cost)return run;
 const r=clone(run),card=r.deck.find(c=>c.uid===quote.uid)!;
 if(r.phase==='merchant'){r.gold-=checked.cost;r.shop.upgraded++;}
 card.grade=(card.grade+1) as Grade;changed(r,'upgrade',quote.uid);if(r.phase==='rest')finishNode(r);return r;
}
export function upgrade(run:Run,uid:string):Run{return confirmUpgrade(run,previewUpgrade(run,uid));}
/** UI supplies visible/unpaused elapsed time in small monotonic ticks; never bot wall time. */
export function recordActiveTime(run:Run,elapsedMs:number):Run{
 if(['dead','ascended'].includes(run.phase)||!Number.isSafeInteger(elapsedMs)||elapsedMs<=0||elapsedMs>60000||!Number.isSafeInteger(run.activeMs+elapsedMs))return run;
 const r=clone(run);r.activeMs+=elapsedMs;return r;
}
export function buy(run:Run,uid:string,_obsoleteReplacementUid?:string):Run{void _obsoleteReplacementUid;if(run.phase!=='merchant')return run;const r=clone(run);const c=r.offers.find(c=>c.uid===uid);if(!c||r.shop.purchased.includes(uid)||!['dao','immortal'].includes(CARDS[c.defId].category)||r.gold<price(c))return run;
  r.gold-=price(c);r.deck.push(c);r.shop.purchased.push(uid);r.stats.cards++;changed(r,'buy',uid);return r;
}
export interface PermanentRemovalContext {kind:'sale'|'event'|'swap';additions?:CardInstance[];cost?:number;proceeds?:number;}
function removalPlan(run:Run,uids:readonly string[],context:PermanentRemovalContext){
 if(!['sale','event','swap'].includes(context.kind))return null;
 if(!uids.length||new Set(uids).size!==uids.length||uids.some(uid=>!run.deck.some(card=>card.uid===uid)))return null;
 if(run.deck.filter(card=>uids.includes(card.uid)).some(card=>!Object.hasOwn(CARDS,card.defId)||['token','status'].includes(CARDS[card.defId].category)))return null;
 const additions=context.additions??[],cost=context.cost??0,proceeds=context.kind==='sale'?run.deck.filter(card=>uids.includes(card.uid)).reduce((sum,card)=>sum+salePrice(card),0):context.proceeds??0;
 if(![cost,proceeds].every(value=>Number.isSafeInteger(value)&&value>=0)||run.gold<cost||!Number.isSafeInteger(run.gold-cost+proceeds)||!Number.isSafeInteger(run.stats.gold+proceeds))return null;
 if(context.kind==='sale'?(run.phase!=='merchant'||run.shop.sold+uids.length>3||additions.length>0||cost!==0||context.proceeds!==undefined):run.phase!=='event')return null;
 if(context.kind==='swap'&&additions.length===0||context.kind==='event'&&additions.length>0)return null;
 if(additions.some(card=>!Object.hasOwn(CARDS,card.defId)||!['basic','dao','immortal'].includes(CARDS[card.defId].category)||!card.uid||!Number.isInteger(card.grade)||card.grade<0||card.grade>7||card.retained!==0||card.tempGrade!==undefined||card.costDelta!==undefined))return null;
 const deck=[...run.deck.filter(card=>!uids.includes(card.uid)),...additions];
 if(deck.length<REALMS[run.realm].minDeck||new Set(deck.map(card=>card.uid)).size!==deck.length)return null;
 return{deck,cost,proceeds};
}
/** Validate the final deck of a batch/swap, never its intermediate removal state. */
export function canRemovePermanentCards(run:Run,uids:readonly string[],context:PermanentRemovalContext):boolean{return removalPlan(run,uids,context)!==null;}
export function removePermanentCards(run:Run,uids:readonly string[],context:PermanentRemovalContext):Run{
 const plan=removalPlan(run,uids,context);if(!plan)return run;
 const r=clone(run);r.deck=structuredClone(plan.deck);r.gold+=plan.proceeds-plan.cost;r.stats.gold+=plan.proceeds;r.stats.cards+=(context.additions??[]).length;
 if(context.kind==='sale')r.shop.sold+=uids.length;changed(r,`remove-${context.kind}`,uids.join(','));return r;
}
export function sell(run:Run,uid:string):Run{return removePermanentCards(run,[uid],{kind:'sale'});}
export function leaveMerchant(run:Run){if(run.phase!=='merchant')return run;const r=clone(run);changed(r,'leave');finishNode(r);return r;}
export function chooseEvent(run:Run,option:number):Run{if(run.phase!=='event'||![0,1].includes(option))return run;const r=clone(run);const e=r.current?.eventId??0;changed(r,'event',`${e}:${option}`);
  if(e===0){if(option===0){if(r.hp<=8)return run;r.hp-=8;r.gold+=55;r.stats.gold+=55;}else r.hp=Math.min(r.maxHp,r.hp+10);}
  if(e===1){if(option===0){r.phase='inheritance';r.rewardKind='normal';r.offers=drawOffers(r);return r;}if(r.gold<20)return run;r.gold-=20;r.hp=Math.min(r.maxHp,r.hp+Math.floor(r.maxHp*.25));}
  if(e===2){if(option===0){if(r.gold<25||!r.deck.some(c=>canUpgrade(r,c)))return run;r.gold-=25;r.phase='rest';r.current={...r.current!,eventId:99};return r;}r.gold+=25;r.stats.gold+=25;}
  if(e===3){if(option===0)r.hp=Math.min(r.maxHp,r.hp+15);else{if(r.hp<=5)return run;r.hp-=5;r.phase='inheritance';r.rewardKind='normal';r.offers=drawOffers(r,OFFER_COUNTS.rare,'rare');return r;}}
  finishNode(r);return r;
}
export function eventDisabled(r:Run,option:number):boolean{const e=r.current?.eventId??0;return e===0&&option===0&&r.hp<=8||e===1&&option===1&&r.gold<20||e===2&&option===0&&(r.gold<25||!r.deck.some(c=>canUpgrade(r,c)))||e===3&&option===1&&r.hp<=5;}
export function retire(run:Run):Run{const r=clone(run);if(['dead','ascended'].includes(r.phase))return run;r.phase='dead';for(const receipt of r.progressionReceipts){receipt.acknowledged=true;if(receipt.kind==='major'){receipt.view='complete';receipt.pendingChoices=null;}}changed(r,'retired');return r;}
export function updateMeta(meta:Meta,run:Run,_now:number):Meta{void _now;const m=structuredClone(meta);m.discovered=[...new Set([...m.discovered,...run.deck.map(c=>c.defId)])];if(['dead','ascended'].includes(run.phase)&&!m.history.some(h=>h.id===run.id)){
  const paths=[...new Set(run.deck.map(c=>CARDS[c.defId].path).filter(p=>p!=='basic'))];m.history.unshift({id:run.id,seed:run.seed,realm:run.realm,outcome:run.phase as 'dead'|'ascended',duration:run.activeMs,durationKind:'active',stats:structuredClone(run.stats),paths,cause:run.journal.at(-1)?.code==='retired'?{en:'Journey relinquished','zh-CN':'自行归隐',vi:"Đã từ bỏ hành trình"}:run.combat?.enemies.find(e=>e.hp>0)?.name??{en:'The final heavens','zh-CN':'终劫',vi:"Thiên kiếp cuối cùng"}});
  m.unlocks=[...new Set([...m.unlocks,'ink-cardback',...(run.stats.tribulations>0?['tribulation-lore']:[]),...(run.phase==='ascended'?['ascendant-cardback','spirit-realm-lore']:[])])];}return m;}
