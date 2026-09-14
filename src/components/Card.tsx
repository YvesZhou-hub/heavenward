'use client';
import artIndex from '@/game/art-index.json';
import { Eye } from 'lucide-react';
import { CARDS, PATHS, CARD_ART_ALIASES } from '@/game/content';
import { cardCost, describeCard, playableReason, pursuitState } from '@/game/combat';
import { CATEGORY_NAMES, tr } from '@/game/i18n';
import { gradeLabel } from '@/game/grades';
import { cardRole } from '@/game/card-view';
import { ui } from '@/game/ui-copy';
import { KEYWORD_GLOSSARY } from '@/game/encyclopedia';
import { useGradeDisplay } from './GradeContext';
import { MechanicIcon } from './MechanicIcon';
import type { CardInstance, Combat, Locale } from '@/game/types';
type CardGestureHandlers=Pick<React.ButtonHTMLAttributes<HTMLButtonElement>,'onPointerDown'|'onPointerMove'|'onPointerUp'|'onPointerCancel'>;
export function Card({card,locale,combat,onClick,onDoubleClick,onInspect,onPickup,onDragCancel,gestures,selected=false,large=false,disabled=false,label,draggable=false}:{card:CardInstance;locale:Locale;combat?:Combat;onClick?:()=>void;onDoubleClick?:()=>void;onInspect?:()=>void;onPickup?:()=>void;onDragCancel?:()=>void;gestures?:CardGestureHandlers;selected?:boolean;large?:boolean;disabled?:boolean;label?:string;draggable?:boolean}){
 const def=CARDS[card.defId],path=PATHS.find(p=>p.id===def.path),art=def.art??(def.path==='basic'?13:Math.max(0,PATHS.findIndex(p=>p.id===def.path)));
 const grade=card.tempGrade??card.grade,reason=combat?playableReason(combat,card):null,gradeDisplay=useGradeDisplay(),role=cardRole(def),negative=def.category==='status';
 const artUrl=(artIndex as Record<string,string>)[def.id]??(artIndex as Record<string,string>)[CARD_ART_ALIASES[def.id]];
 const pursuit=combat?pursuitState(combat,card):null;const rules=describeCard(card,locale,combat);const cost=combat?cardCost(combat,card):def.cost;
 return <article className={`game-card ${large?'large':''} ${selected?'selected':''} ${reason?'unplayable':''} ${def.category}`} style={{'--path-color':path?.color??'#baa77e'} as React.CSSProperties} data-card={def.id}>
  <button className="card-face" {...gestures} onClick={onClick} onDoubleClick={onDoubleClick} disabled={disabled} draggable={draggable&&!disabled} onDragStart={e=>{e.dataTransfer.setData('text/heavenward-card',card.uid);e.dataTransfer.effectAllowed='copy';onPickup?.();}} onDragEnd={onDragCancel} aria-label={`${def.name[locale]}. ${rules}${reason?` ${reason[locale]}`:''}`}>
    <div className="card-art" style={artUrl?{backgroundImage:`url(${artUrl})`,backgroundSize:'cover',backgroundPosition:'center'}:{backgroundPosition:`${art%4*100/3}% ${Math.floor(art/4)*100/3}%`}}/>
    <span className="card-cost" aria-label={`${tr(locale,'energy')}: ${cost}`}>{'unplayable' in def&&def.unplayable?'—':cost}</span>
    <span className="card-path"><MechanicIcon id={negative?'status':def.path}/><span>{negative?CATEGORY_NAMES[def.category][locale]:path?.name[locale]??CATEGORY_NAMES[def.category][locale]}</span></span>
    <div className="card-title">{def.name[locale]}</div>
    <div className="card-type"><span>{CATEGORY_NAMES[def.category][locale]}</span><span>{['divine','token','status'].includes(def.category)?tr(locale,'ungraded'):gradeLabel(grade,locale,gradeDisplay)}</span></div>
    <div className="card-role"><MechanicIcon id={role} size={12}/>{ui(locale,role)}</div>
    <p className="card-rules">{rules}</p>
    {pursuit?.condition&&<div className={`pursuit-state ${pursuit.met?'met':'unmet'}`}>{pursuit.met?'✓':'○'} {ui(locale,pursuit.met?'met':'unmet')}</div>}<div className="card-foot"><span>{negative?ui(locale,'temporaryStatus'):card.retained>0?tr(locale,'retained',{n:card.retained}):card.tempGrade!==undefined?tr(locale,'temporary'):def.retain?KEYWORD_GLOSSARY.retain.name[locale]:def.exhaust?KEYWORD_GLOSSARY.exhaust.name[locale]:''}</span>{label&&<b>{label}</b>}</div>
  </button>
  {onInspect&&<button className="inspect-button" onClick={onInspect} aria-label={tr(locale,'inspect')}><Eye size={14}/></button>}
 </article>;
}
