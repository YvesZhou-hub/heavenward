// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

/** Original synthesized audio: no recordings, third-party samples, or network. */
export class GameAudio {
 private context:AudioContext|null=null;private musicGain:GainNode|null=null;private sfx=.5;private voices:OscillatorNode[]=[];
 async unlock(music:number,sfx:number){if(!this.context){this.context=new AudioContext();this.musicGain=this.context.createGain();this.musicGain.gain.value=0;this.musicGain.connect(this.context.destination);[110,164.81,220,293.66].forEach((hz,i)=>{const o=this.context!.createOscillator(),g=this.context!.createGain();o.type='sine';o.frequency.value=hz;o.detune.value=i%2?-3:3;g.gain.value=.013;o.connect(g);g.connect(this.musicGain!);o.start();this.voices.push(o);});}await this.context.resume();this.volume(music,sfx);}
 volume(music:number,sfx:number){this.sfx=sfx;if(this.context&&this.musicGain)this.musicGain.gain.setTargetAtTime(music,this.context.currentTime,.3);}
 play(kind:'card'|'hit'|'turn'|'reward'|'heal'|'exhaust'|'death'){if(!this.context||this.context.state!=='running')return;const ctx=this.context,o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);const frequencies={card:520,hit:155,turn:340,reward:740,heal:610,exhaust:240,death:80};o.type=kind==='hit'?'triangle':'sine';o.frequency.setValueAtTime(frequencies[kind],ctx.currentTime);o.frequency.exponentialRampToValueAtTime(frequencies[kind]*(kind==='reward'?1.5:.55),ctx.currentTime+.23);g.gain.setValueAtTime(this.sfx*.11,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.3);o.start();o.stop(ctx.currentTime+.32);}
 close(){this.voices.forEach(o=>o.stop());void this.context?.close();this.context=null;this.voices=[];}
}
