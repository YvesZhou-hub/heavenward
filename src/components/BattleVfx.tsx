// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

'use client';
import { useEffect,useRef } from 'react';
import type { CombatEvent } from '@/game/types';
/** Presentation-only animation; neither reads nor advances the gameplay RNG. */
export function BattleVfx({events,speed,reduced}:{events:CombatEvent[];speed:number;reduced:boolean}){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;let frame=0;const rect=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio,2);canvas.width=rect.width*ratio;canvas.height=rect.height*ratio;ctx.scale(ratio,ratio);if(reduced||events.length===0)return;
 const start=performance.now(),duration=650/speed;const effects=events.filter(e=>['damage','armor','heal','dodge','directLoss','intercept','gale','bleeding','seedBloom','sacrifice','exhaust'].includes(e.code)).slice(-12);
 const animate=(time:number)=>{const p=Math.min(1,(time-start)/duration);ctx.clearRect(0,0,rect.width,rect.height);effects.forEach((event,index)=>{const player=event.values?.target==='player',x=rect.width*(player?.22:.7)+(index%3-1)*18,y=rect.height*.44;const color=event.code==='heal'?'#b2d9a0':event.code==='armor'||event.code==='intercept'?'#a1cfd2':event.code==='dodge'?'#c9d9ce':event.code==='exhaust'||event.code==='directLoss'?'#c6a6d4':'#e9bb79';ctx.globalAlpha=(1-p)*.9;ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1.5;
  if(event.code==='armor'||event.code==='heal'){ctx.beginPath();ctx.ellipse(x,y,35+p*25,65+p*15,0,0,Math.PI*2);ctx.stroke();}else if(event.code==='damage'){ctx.beginPath();ctx.moveTo(rect.width*(player?.7:.22),y+20);ctx.quadraticCurveTo(rect.width*.47,y-30,x,y);ctx.stroke();}
  for(let n=0;n<8;n++){const angle=n*Math.PI/4+index,r=8+p*55;ctx.fillRect(x+Math.cos(angle)*r,y+Math.sin(angle)*r,2,2);}const value=event.values?.hp??event.values?.amount;if(typeof value==='number'&&value>0){ctx.font='600 22px Georgia';ctx.textAlign='center';ctx.fillText(`${event.code==='heal'||event.code==='armor'?'+':'−'}${value}`,x,y-30-p*45);}
 });ctx.globalAlpha=1;if(p<1)frame=requestAnimationFrame(animate);else ctx.clearRect(0,0,rect.width,rect.height);};frame=requestAnimationFrame(animate);return()=>cancelAnimationFrame(frame);
 },[events,speed,reduced]);return <canvas ref={ref} className="battle-vfx" aria-hidden="true"/>;}
