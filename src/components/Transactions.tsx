// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

'use client';
import { useState } from 'react';
import { ArrowRight, Flame, Moon } from 'lucide-react';
import { CARDS, REALMS } from '@/game/content';
import { confirmUpgrade, previewUpgrade, restPreview, restHeal, salePrice, sell, type Run, type UpgradePreview } from '@/game/run';
import { tr } from '@/game/i18n';
import { gradeLabel } from '@/game/grades';
import { ui } from '@/game/ui-copy';
import type { CardInstance, Locale } from '@/game/types';
import { Card } from './Card';
import { Dialog } from './Dialog';
import { useGradeDisplay } from './GradeContext';
export type Service='upgrade'|'sell'|'rest';
export function TransactionDialog({run,locale,service,onClose,onCommit,onInspect}:{run:Run;locale:Locale;service:Service;onClose:()=>void;onCommit:(next:Run)=>Promise<void>;onInspect:(c:CardInstance)=>void}){
 const [quote,setQuote]=useState<UpgradePreview|null>(null),[sale,setSale]=useState<{card:CardInstance;revision:number}|null>(null),[pending,setPending]=useState(false),[failure,setFailure]=useState(false);
 const gradeDisplay=useGradeDisplay(),minimum=REALMS[run.realm].minDeck,heal=restPreview(run);
 const title=service==='rest'?tr(locale,'heal'):service==='sell'?sale?tr(locale,'confirmSell'):ui(locale,'chooseSale'):quote?tr(locale,'compare'):ui(locale,'chooseUpgrade');
 const cards=run.deck.filter(c=>!['token','status'].includes(CARDS[c.defId].category));
 async function commit(next:Run){if(pending)return;if(next===run){setFailure(true);return;}setPending(true);await onCommit(next);onClose();}
 const reason=(value:UpgradePreview['reason'])=>value==='funds'?ui(locale,'notEnough',{n:Math.max(0,(quote?.cost??0)-run.gold)}):value==='limit'?ui(locale,'limit'):value==='grade'?ui(locale,'maxGrade',{grade:gradeLabel(Math.min(7,run.realm+1),locale,gradeDisplay)}):ui(locale,'unavailable');
 return <Dialog locale={locale} title={title} wide={service!=='rest'} onClose={onClose}>
 {failure&&<p role="alert" className="card-reason">{ui(locale,'stale')}</p>}
 {service==='rest'?<div className="rest-confirm"><Moon size={48}/><p>{heal.heal?ui(locale,'healActual',{n:heal.heal}):ui(locale,'fullHealth')}</p><strong>{heal.hpBefore} / {run.maxHp} <ArrowRight size={20}/> {heal.hpAfter} / {run.maxHp}</strong><p>{ui(locale,'restChoice')}</p><div className="scene-actions"><button className="secondary-button" onClick={onClose}>{tr(locale,'back')}</button><button className="primary-button" disabled={pending||!heal.available} onClick={()=>void commit(restHeal(run))}>{ui(locale,'confirmRest')}</button></div></div>:
 service==='upgrade'&&quote&&quote.before&&quote.after?<>
 <p className="dialog-note">{ui(locale,'previewOnly')}</p><div className="comparison"><div><h3>{tr(locale,'current')} · {gradeLabel(quote.before.grade,locale,gradeDisplay)}</h3><Card card={quote.before} locale={locale} large onInspect={()=>onInspect(quote.before!)}/></div><ArrowRight size={30}/><div><h3>{tr(locale,'after')} · {gradeLabel(quote.after.grade,locale,gradeDisplay)}</h3><Card card={quote.after} locale={locale} large onInspect={()=>onInspect(quote.after!)}/></div></div>
 <div className="upgrade-changes"><p>{ui(locale,'unchanged')} · {CARDS[quote.before.defId].cost} {tr(locale,'energy')}</p><p>{ui(locale,'normalGrade',{grade:gradeLabel(run.realm,locale,gradeDisplay)})}</p><p>{ui(locale,'maxGrade',{grade:gradeLabel(Math.min(7,run.realm+1),locale,gradeDisplay)})}</p><p>{tr(locale,'stones')}: {run.gold} → {Math.max(0,run.gold-quote.cost)} · {ui(locale,'allowance',{n:run.phase==='rest'?1:2-run.shop.upgraded})}</p></div>
 {!quote.available&&<p className="card-reason">{reason(quote.reason)}</p>}<div className="scene-actions"><button className="secondary-button" onClick={()=>setQuote(null)}>{ui(locale,'another')}</button><button className="primary-button" disabled={pending||!quote.available} onClick={()=>void commit(confirmUpgrade(run,quote))}><Flame size={17}/>{ui(locale,'confirmUpgrade')} · {quote.cost} {tr(locale,'stones')}</button></div></>:
 service==='sell'&&sale?<div className="sale-confirm"><Card card={sale.card} locale={locale} large onInspect={()=>onInspect(sale.card)}/><div><p>{tr(locale,'confirmSellHint')}</p><dl><dt>{tr(locale,'stones')}</dt><dd>{run.gold} → {run.gold+salePrice(sale.card)} <span>(+{salePrice(sale.card)})</span></dd><dt>{tr(locale,'deck')}</dt><dd>{run.deck.length} → {run.deck.length-1} ({ui(locale,'deckMinimum',{current:run.deck.length,minimum})})</dd><dt>{ui(locale,'allowance',{n:3-run.shop.sold})}</dt><dd>{3-run.shop.sold} → {Math.max(0,2-run.shop.sold)}</dd></dl><div className="scene-actions"><button className="secondary-button" onClick={()=>setSale(null)}>{ui(locale,'another')}</button><button className="danger-button" disabled={pending||run.shop.sold>=3||run.deck.length<=minimum} onClick={()=>void commit(run.revision===sale.revision?sell(run,sale.card.uid):run)}>{tr(locale,'sell')} · +{salePrice(sale.card)}</button></div></div></div>:
 <><p className="dialog-note">{service==='upgrade'?ui(locale,'previewOnly'):ui(locale,'deckMinimum',{current:run.deck.length,minimum})}</p>{service==='upgrade'&&<p className="dialog-note">{ui(locale,'maxGrade',{grade:gradeLabel(Math.min(7,run.realm+1),locale,gradeDisplay)})}</p>}<div className="visual-picker">{cards.map((card,index)=>{const preview=previewUpgrade(run,card.uid,locale),eligible=service==='sell'?run.shop.sold<3&&run.deck.length>minimum:preview.available||preview.reason==='funds';return <div className={`picker-option ${!eligible?'ineligible':''}`} key={card.uid}><Card card={card} locale={locale} onClick={()=>eligible&&(service==='sell'?setSale({card,revision:run.revision}):setQuote(preview))} onInspect={()=>onInspect(card)} label={ui(locale,'copies',{n:index+1})}/><button className="card-action" disabled={!eligible} onClick={()=>service==='sell'?setSale({card,revision:run.revision}):setQuote(preview)}>{service==='sell'?`${tr(locale,'sell')} +${salePrice(card)}`:eligible?tr(locale,'compare'):tr(locale,'upgrade')}</button>{!eligible&&<p className="picker-reason">{service==='sell'?run.shop.sold>=3?ui(locale,'limit'):ui(locale,'deckMinimum',{current:run.deck.length,minimum}):preview.reason==='grade'?ui(locale,'maxGrade',{grade:gradeLabel(Math.min(7,run.realm+1),locale,gradeDisplay)}):reason(preview.reason)}</p>}</div>;})}</div></>}
 </Dialog>;
}
