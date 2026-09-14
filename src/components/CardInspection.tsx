'use client';
import { CARDS, PATHS } from '@/game/content';
import { CATEGORY_NAMES, tr } from '@/game/i18n';
import { cardKeywords, cardRole, targetInstruction } from '@/game/card-view';
import { KEYWORD_GLOSSARY } from '@/game/encyclopedia';
import { describeCard, playableReason } from '@/game/combat';
import { gradeLabel } from '@/game/grades';
import { ui } from '@/game/ui-copy';
import type { CardInstance, Combat, Locale } from '@/game/types';
import { Card } from './Card';
import { Dialog } from './Dialog';
import { MechanicIcon } from './MechanicIcon';
import { Tooltip } from './Tooltip';
import { useGradeDisplay } from './GradeContext';
export function CardInspection({card,locale,combat,onClose}:{card:CardInstance;locale:Locale;combat?:Combat;onClose:()=>void}){
 const def=CARDS[card.defId],gradeStyle=useGradeDisplay(),keywords=cardKeywords(def);
 if(def.effects.some(e=>'pursuit' in e))keywords.push('pursuit');
 if(def.category==='status')keywords.push('statusCard');
 const current=describeCard(card,locale,combat),base=describeCard({...card,tempGrade:undefined,costDelta:undefined,retained:0},locale);
 return <Dialog locale={locale} title={def.name[locale]} wide onClose={onClose}><div className="inspection"><Card card={card} locale={locale} combat={combat} large/><div className="inspection-copy"><span className="eyebrow"><MechanicIcon id={def.path}/> {PATHS.find(p=>p.id===def.path)?.name[locale]??CATEGORY_NAMES.basic[locale]} · {CATEGORY_NAMES[def.category][locale]}</span><div className="inspection-facts"><span>{ui(locale,cardRole(def))}</span><span>{ui(locale,'rulesType',{type:ui(locale,def.kind)})}</span><span>{['divine','token','status'].includes(def.category)?tr(locale,'ungraded'):gradeLabel(card.tempGrade??card.grade,locale,gradeStyle)}</span></div><p>{current}</p>{combat&&base!==current&&<details><summary>{ui(locale,'sourceValues')}</summary><p>{base}</p></details>}<div className="keyword-list">{[...new Set(keywords)].filter(id=>KEYWORD_GLOSSARY[id]).map(id=><Tooltip key={id} locale={locale} label={<><MechanicIcon id={id}/>{KEYWORD_GLOSSARY[id].name[locale]}</>}><h3>{KEYWORD_GLOSSARY[id].name[locale]}</h3><p>{KEYWORD_GLOSSARY[id].description[locale]}</p></Tooltip>)}</div><p className="muted">{ui(locale,'typeHint')}</p>{combat&&<p className="muted">{ui(locale,'previewTarget')}</p>}<blockquote>{def.flavor[locale]}</blockquote>{combat&&playableReason(combat,card)&&<p className="card-reason">{playableReason(combat,card)?.[locale]}</p>}{combat&&<p>{targetInstruction(card,locale)}</p>}</div></div></Dialog>;
}
