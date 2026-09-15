// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

'use client';
import { ArrowRight, Check, Compass } from 'lucide-react';
import { ENEMIES, REALMS } from '@/game/content';
import { isPeak, NODE_NAMES, roadView, stageIndex, STAGES, type Run } from '@/game/run';
import { tr } from '@/game/i18n';
import { ui } from '@/game/ui-copy';
import type { Locale } from '@/game/types';
import { MechanicIcon } from './MechanicIcon';
const nodeIcon={combat:'attack',elite:'strength',merchant:'skill',rest:'wood',inheritance:'wisdom',event:'formation',tribulation:'energyDebt'};
export function RoadMap({run,locale,onEnter}:{run:Run;locale:Locale;onEnter:(id:string)=>void}){
 const view=roadView(run),last=view.history.at(-1);
 return <section className="road-scene revised-road"><div className="scene-title"><span className="eyebrow">{REALMS[run.realm].name[locale]} · {STAGES[stageIndex(run)][locale]}</span><h1>{tr(locale,'road')}</h1><p>{tr(locale,'roadHint')}</p></div>
 <div className="road-progress">{REALMS.map((realm,i)=><div className={`${run.realm===i?'active':''} ${run.realm>i?'complete':''}`} key={i}><span>{run.realm>i?<Check size={14}/>:i+1}</span><small>{realm.name[locale]}</small></div>)}</div>
 <div className="branch-map" aria-label={ui(locale,'pathChoice')}>
  <div className="current-node"><Compass size={24}/><strong>{ui(locale,'currentLocation')}</strong><small>{last?NODE_NAMES[last.kind][locale]:STAGES[0][locale]}</small></div>
  <svg className="branch-lines" viewBox="0 0 1000 150" preserveAspectRatio="none" aria-hidden="true">{view.next.map((node,i)=>{const x=(i+.5)*1000/view.next.length;return <path key={node.id} d={`M 500 0 C 500 80 ${x} 70 ${x} 150`}/>;})}</svg>
  <div className="branch-options">{view.next.map((node,i)=><button key={node.id} className={`branch-node node-${node.kind}`} onClick={()=>onEnter(node.id)}><span className="branch-seal"><MechanicIcon id={nodeIcon[node.kind]} size={30}/></span><small>{String(i+1).padStart(2,'0')}</small><h2>{NODE_NAMES[node.kind][locale]}</h2><p>{node.hint[locale]}</p><span className="node-cta">{tr(locale,'enter')}<ArrowRight size={16}/></span></button>)}</div>
 </div>
 {isPeak(run)&&<aside className="omen"><MechanicIcon id="energyDebt" size={22}/><div><span>{tr(locale,'omen')}</span><p>{ENEMIES[run.bossId]?.omen?.[locale]}</p></div></aside>}
 {view.history.length>0&&<details className="road-history"><summary>{ui(locale,'history')} · {view.history.length}</summary><ol>{view.history.map(node=><li key={node.id}><Check size={13}/>{REALMS[node.realm].name[locale]} · {NODE_NAMES[node.kind][locale]}</li>)}</ol></details>}
 </section>;
}
