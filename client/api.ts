import { useEffect, useRef, useState, useCallback } from 'react';
export class ApiError extends Error {status:number;constructor(message:string,status:number){super(message);this.status=status;}}
export async function api(path:string,body?:unknown,method?:string,token?:string) {
 let response:Response;
 try{response=await fetch('/api'+path,{method:method||(body===undefined?'GET':'POST'),credentials:'same-origin',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});}
 catch{throw new ApiError('No se pudo contactar con la sala. Tu envío sigue pendiente; puedes reintentarlo.',0);}
 const data=await response.json();if(!response.ok)throw new ApiError(data.error?.message||'No se pudo completar la acción.',response.status);return data;
}
export const message=(e:unknown)=>e instanceof Error?e.message:'No se pudo completar la acción.';
export function requestId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');}
export function useRoom(code:string,token?:string,view?:'participant') {
 const [state,setState]=useState<any>(null),[error,setError]=useState(''),[connected,setConnected]=useState(false);
 const sequence=useRef(0);
 const refresh=useCallback(async()=>{
  const id=++sequence.current;
  try{const data=await api(`/salas/${code}/estado${view?'?view=participant':''}`,undefined,undefined,token);if(id===sequence.current){setState(data);setConnected(true);setError('');}}
  catch(e){if(id===sequence.current){setConnected(false);setError(message(e));}}
 },[code,token,view]);
 useEffect(()=>{
  let alive=true,socket:WebSocket|undefined,timer:ReturnType<typeof setTimeout>|undefined;
  setState(null);setError('');setConnected(false);void refresh();
  function connect(){if(!alive)return;socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/api/salas/${code}/ws`);socket.onopen=()=>socket?.send(JSON.stringify({token,view}));socket.onmessage=()=>void refresh();socket.onclose=()=>{if(alive){setConnected(false);timer=setTimeout(connect,2000);}};socket.onerror=()=>socket?.close();}
  connect();const interval=setInterval(()=>{if(navigator.onLine)void refresh();},5000);
  const offline=()=>setConnected(false);const online=()=>void refresh();const visible=()=>{if(document.visibilityState==='visible')void refresh();};
  window.addEventListener('offline',offline);window.addEventListener('online',online);document.addEventListener('visibilitychange',visible);
  return()=>{alive=false;++sequence.current;clearTimeout(timer);clearInterval(interval);socket?.close();window.removeEventListener('offline',offline);window.removeEventListener('online',online);document.removeEventListener('visibilitychange',visible);};
 },[code,token,view,refresh]);
 return {state,error,connected,refresh};
}
