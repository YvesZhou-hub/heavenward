'use client';
import { useSyncExternalStore } from 'react';
import { loadSave, SAVE_KEY, saveWithLock, type SaveData } from '@/game/save';
type Snapshot={data:SaveData|null;error:string|null;busy:boolean;notice:string|null};
const server:Snapshot={data:null,error:null,busy:false,notice:null};
let snapshot:Snapshot|undefined;const listeners=new Set<()=>void>();
const emit=()=>listeners.forEach(fn=>fn());
function getSnapshot(){if(!snapshot){const loaded=loadSave(localStorage);snapshot={data:loaded.data,error:loaded.error,busy:false,notice:loaded.recovered?'recovered':null};}return snapshot;}
function reload(){const loaded=loadSave(localStorage);snapshot={data:loaded.data,error:loaded.error,busy:false,notice:'changed'};emit();}
function subscribe(fn:()=>void){listeners.add(fn);function storage(e:StorageEvent){if(e.key===SAVE_KEY)reload();}window.addEventListener('storage',storage);return()=>{listeners.delete(fn);window.removeEventListener('storage',storage);};}
export function useGameSave(){return useSyncExternalStore(subscribe,getSnapshot,()=>server);}
export async function commitSave(data:SaveData):Promise<SaveData|null>{
 const before=getSnapshot();if(before.busy||before.error||!before.data)return null;
 snapshot={...before,busy:true,notice:null};emit();
 try{
  const saved=await saveWithLock(data,before.data.revision);snapshot={data:saved,error:null,busy:false,notice:null};emit();return saved;
 }catch(e){
  if(e instanceof Error&&e.message==='save-conflict'){reload();return null;}
  snapshot={...before,busy:false,error:e instanceof Error?e.message:'save-error'};emit();return null;
 }
}
export function reloadSave(){reload();}
