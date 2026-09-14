'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { tr } from '@/game/i18n';
import type { Locale } from '@/game/types';
export function Tooltip({label,children,locale}:{label:React.ReactNode;children:React.ReactNode;locale:Locale}){
 const id=useId(),anchor=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null);
 const [host,setHost]=useState<Element|null>(null);
 const show=(target:HTMLElement)=>{setHost(target.closest('dialog')??document.body);setOpen(true);};
 const [open,setOpen]=useState(false),[position,setPosition]=useState({top:0,left:0});
 useEffect(()=>{if(!open)return;const place=()=>{const a=anchor.current?.getBoundingClientRect();if(!a)return;const width=Math.min(330,window.innerWidth-24),height=panel.current?.offsetHeight??150;setPosition({left:Math.max(12,Math.min(window.innerWidth-width-12,a.left+a.width/2-width/2)),top:a.top-height-10>=12?a.top-height-10:Math.min(window.innerHeight-height-12,a.bottom+10)});};place();const close=(e:Event)=>{if(!anchor.current?.contains(e.target as Node)&&!panel.current?.contains(e.target as Node))setOpen(false);};const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.stopPropagation();setOpen(false);anchor.current?.focus();}};window.addEventListener('resize',place);window.addEventListener('scroll',place,true);document.addEventListener('pointerdown',close);document.addEventListener('keydown',key,true);return()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',key,true);};},[open]);
 return <><button ref={anchor} className="keyword-trigger" type="button" aria-expanded={open} aria-controls={open?id:undefined} onMouseEnter={e=>show(e.currentTarget)} onFocus={e=>show(e.currentTarget)} onBlur={e=>{if(!panel.current?.contains(e.relatedTarget as Node))setOpen(false);}} onClick={e=>{e.stopPropagation();show(e.currentTarget);}}>{label}</button>{open&&host&&createPortal(<div ref={panel} id={id} className="keyword-tooltip" role="region" style={position} onClick={e=>e.stopPropagation()}><button className="tooltip-close" aria-label={tr(locale,'close')} onClick={()=>setOpen(false)}><X size={15}/></button>{children}</div>,host)}</>;
}
