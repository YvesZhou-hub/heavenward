// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

'use client';
import { useState } from 'react';
import { CARDS, PATHS } from '@/game/content';
import { describeCard } from '@/game/combat';
import { tr } from '@/game/i18n';
import type { CardInstance,Locale } from '@/game/types';
import { Card } from './Card';
export function DeckBrowser({cards,locale,onInspect}:{cards:CardInstance[];locale:Locale;onInspect:(card:CardInstance)=>void}){const [path,setPath]=useState('all'),[search,setSearch]=useState('');const filtered=cards.filter(c=>(path==='all'||CARDS[c.defId].path===path)&&`${CARDS[c.defId].name[locale]} ${describeCard(c,locale)}`.toLowerCase().includes(search.toLowerCase()));return <><div className="collection-controls"><select aria-label={tr(locale,'allPaths')} value={path} onChange={e=>setPath(e.target.value)}><option value="all">{tr(locale,'allPaths')}</option>{PATHS.map(p=><option key={p.id} value={p.id}>{p.name[locale]}</option>)}</select><input aria-label={tr(locale,'search')} placeholder={tr(locale,'search')} value={search} onChange={e=>setSearch(e.target.value)}/><span>{filtered.length} / {cards.length}</span></div><div className="card-grid">{filtered.map(c=><Card key={c.uid} card={c} locale={locale} onClick={()=>onInspect(c)} onInspect={()=>onInspect(c)}/>)}</div>{filtered.length===0&&<p className="empty-state">{tr(locale,'empty')}</p>}</>;}
