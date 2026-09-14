'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Locale } from '@/game/types';
import { tr } from '@/game/i18n';
export function Dialog({title,onClose,children,wide=false,dismissible=true,locale='en'}:{title:string;onClose:()=>void;children:React.ReactNode;wide?:boolean;dismissible?:boolean;locale?:Locale}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{const d=ref.current;d?.showModal();return()=>{d?.close();};},[]);return <dialog ref={ref} className={`dialog ${wide?'wide':''}`} onCancel={e=>{e.preventDefault();if(dismissible)onClose();}} onClick={e=>{if(dismissible&&e.target===e.currentTarget)onClose();}} aria-label={title}><div className="dialog-heading"><h2>{title}</h2>{dismissible&&<button className="icon-button" onClick={onClose} aria-label={tr(locale,'close')}><X size={22}/></button>}</div>{children}</dialog>;}
