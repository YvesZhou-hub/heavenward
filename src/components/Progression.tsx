// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

'use client';
import { ArrowRight, Crown, X } from 'lucide-react';
import { REALMS } from '@/game/content';
import { STAGES, type ProgressionReceipt } from '@/game/run';
import { gradeLabel } from '@/game/grades';
import { CATEGORY_NAMES, tr } from '@/game/i18n';
import { ui } from '@/game/ui-copy';
import type { Locale } from '@/game/types';
import { useGradeDisplay } from './GradeContext';

/** Render the committed receipt; no reward or growth formulas live in the UI. */
export function Progression({receipt,locale,onContinue}:{receipt:ProgressionReceipt;locale:Locale;onContinue:()=>void}){
 const style=useGradeDisplay();
 const position=(at:ProgressionReceipt['from'])=>`${REALMS[at.realm].name[locale]} · ${STAGES[at.stage][locale]}`;
 const from=position(receipt.from),to=receipt.to?position(receipt.to):tr(locale,'ascended');
 if(receipt.kind==='minor')return <aside className="stage-notice" role="status" aria-live="polite"><div><strong>{ui(locale,'stageAdvanced')}</strong><p>{from} <ArrowRight size={14}/> {to}</p><small>{ui(locale,'noStats')}</small></div><button aria-label={tr(locale,'close')} onClick={onContinue}><X size={18}/></button></aside>;
 return <section className="progression-scene" aria-labelledby="breakthrough-title"><Crown size={42} strokeWidth={1}/><span className="eyebrow">{tr(locale,'human')}</span><h1 id="breakthrough-title">{receipt.to?tr(locale,'breakthrough'):tr(locale,'ascended')}</h1><p className="progression-route"><span>{from}</span><ArrowRight size={22}/><strong>{to}</strong></p>
 <div className="progression-rewards"><h2>{ui(locale,'received')}</h2><p className="progression-gold">{ui(locale,'receivedStones',{n:receipt.grants.gold})}</p><dl>
 <dt>{ui(locale,'maxHealth')}</dt><dd>{receipt.before.maxHp} → {receipt.after.maxHp}</dd>
 <dt>{tr(locale,'hp')}</dt><dd>{receipt.before.hp} → {receipt.after.hp}<small>{ui(locale,'receivedHealing',{n:receipt.grants.healing})}</small></dd>
 <dt>{ui(locale,'maxEnergy')}</dt><dd>{receipt.before.energy} → {receipt.after.energy}</dd>
 <dt>{ui(locale,'normalGradeLabel')}</dt><dd>{gradeLabel(receipt.before.normalGrade,locale,style)} → {gradeLabel(receipt.after.normalGrade,locale,style)}</dd>
 </dl><p className="muted">{ui(locale,'paidOnce')}</p></div>
 {receipt.pendingChoices&&<aside className="progression-pending"><h2>{ui(locale,'stillToChoose')}</h2><p>{receipt.pendingChoices.kind==='divine'?CATEGORY_NAMES.divine[locale]:tr(locale,'inheritance')}</p><p>{ui(locale,'optionalReward',{options:receipt.pendingChoices.count,count:receipt.pendingChoices.maxAcquisitions})}</p></aside>}
 <button className="primary-button" onClick={onContinue}>{tr(locale,'continue')}<ArrowRight size={18}/></button></section>;
}
