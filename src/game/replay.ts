import { CARDS, ENEMIES } from './content';
import { createCombat, endTurn, playCard, resolveChoice } from './combat';
import { CONTENT_VERSION, RULES_VERSION } from './run';
import type { Combat, CombatConfig, TidalState } from './types';

export type CombatAction =
 | {type:'playCard';uid:string;targetId?:string;turn:number}
 | {type:'endTurn';tidal?:TidalState;turn:number}
 | {type:'resolveChoice';ids:string[];turn:number};
export interface CombatReplay {
 format:'heavenward-combat-replay';schema:1;rulesVersion:string;contentVersion:string;
 config:CombatConfig;actions:CombatAction[];expectedState?:Combat;
}
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const integer=(value:unknown,min=0,max=Number.MAX_SAFE_INTEGER):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=min&&value<=max;
const text=(value:unknown):value is string=>typeof value==='string'&&value.length>0;
/** Stable JSON ignores property insertion order while preserving hidden deck order. */
export function canonicalCombatJSON(value:unknown):string{
 return JSON.stringify(value,(_key,item)=>object(item)?Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);
}
function validConfig(value:unknown):value is CombatConfig{
 if(!object(value)||!integer(value.seed,0,4294967295)||!integer(value.realm,0,4)||!integer(value.maxHp,1)||!integer(value.hp,1,value.maxHp)||!Array.isArray(value.deck)||!Array.isArray(value.enemies)||!value.enemies.length)return false;
 const cards=value.deck;
 return cards.every(card=>object(card)&&text(card.uid)&&text(card.defId)&&Object.hasOwn(CARDS,card.defId)&&!['token','status'].includes(CARDS[card.defId].category)&&integer(card.grade,0,7)&&(CARDS[card.defId].category!=='divine'||card.grade===0)&&card.retained===0)&&new Set(cards.map(card=>card.uid)).size===cards.length&&value.enemies.every(id=>text(id)&&Object.hasOwn(ENEMIES,id));
}
function validAction(value:unknown):value is CombatAction{
 if(!object(value)||!integer(value.turn,1))return false;
 if(value.type==='playCard')return text(value.uid)&&(value.targetId===undefined||text(value.targetId));
 if(value.type==='endTurn')return value.tidal===undefined||['rising','tranquil','raging'].includes(String(value.tidal));
 return value.type==='resolveChoice'&&Array.isArray(value.ids)&&value.ids.every(text)&&new Set(value.ids).size===value.ids.length;
}
/** Replays only the installed rules/content version; rejected/no-op actions fail loudly. */
export function replayCombat(input:unknown):Combat{
 if(!object(input)||input.format!=='heavenward-combat-replay'||input.schema!==1)throw new Error('Unsupported combat replay format');
 if(input.rulesVersion!==RULES_VERSION||input.contentVersion!==CONTENT_VERSION)throw new Error('Replay requires the exact installed rules and content versions');
 if(object(input.expectedState)&&input.expectedState.rulesMigration!==undefined)throw new Error('Migrated combat is a snapshot continuation, not a replay from the original opening');
 if(!validConfig(input.config)||!Array.isArray(input.actions)||!input.actions.every(validAction))throw new Error('Invalid combat replay configuration or action');
 let state=createCombat(structuredClone(input.config));
 for(const [index,action] of input.actions.entries()){
  if(action.turn!==state.turn)throw new Error(`Replay action ${index} expects turn ${action.turn}; current turn is ${state.turn}`);
  const next=action.type==='playCard'?playCard(state,action.uid,action.targetId):action.type==='endTurn'?endTurn(state,action.tidal):resolveChoice(state,action.ids);
  if(next===state||next.actions.length!==state.actions.length+1)throw new Error(`Replay action ${index} (${action.type}) was rejected`);
  if(canonicalCombatJSON(next.actions.at(-1))!==canonicalCombatJSON(action))throw new Error(`Replay action ${index} differs from the engine's accepted action`);
  state=next;
 }
 if(input.expectedState!==undefined&&canonicalCombatJSON(state)!==canonicalCombatJSON(input.expectedState))throw new Error('Replay final state differs from the recorded state');
 return state;
}
/** The original opening config is required; a damaged final save cannot infer opening HP. */
export function createCombatReplay(config:CombatConfig,final:Combat):CombatReplay{
 if(final.rulesMigration)throw new Error('Migrated combat is a snapshot continuation, not a replay from the original opening');
 const replay:CombatReplay={format:'heavenward-combat-replay',schema:1,rulesVersion:RULES_VERSION,contentVersion:CONTENT_VERSION,config:structuredClone(config),actions:structuredClone(final.actions) as CombatAction[],expectedState:structuredClone(final)};
 replayCombat(replay);
 return replay;
}
