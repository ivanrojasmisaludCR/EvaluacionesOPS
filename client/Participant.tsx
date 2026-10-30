import { useEffect, useState } from 'react';
import { api, ApiError, message, requestId, useRoom } from './api.ts';
import { GroupResults, Question, Consensus, Distribution, Connection } from './Room.tsx';
export function Participant({code}:{code:string}){
 const [entered,setEntered]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[input,setInput]=useState(code);
 useEffect(()=>{if(/^[A-F0-9]{6}$/.test(code))api(`/salas/${code}/estado?view=participant`).then(()=>setEntered(true)).catch(()=>{});},[code]);
 if(entered)return <Voting code={code}/>;
 return <main className="narrow participant-entry"><a className="back" href="/">← Inicio</a><section className="card"><div className="eyebrow">TU VOZ EN EL TALLER</div><h1>Entra a la sala</h1><p className="muted">Responde a tu ritmo. El grupo verá los resultados cuando termine la votación.</p><form onSubmit={async e=>{e.preventDefault();if(input!==code){location.assign('/participar/'+input);return;}setBusy(true);setError('');try{await api(`/salas/${code}/ingreso`,{});setEntered(true);}catch(e){setError(message(e));}finally{setBusy(false);}}}><label htmlFor="join-code">Código de sala</label><input id="join-code" autoComplete="off" maxLength={6} pattern="[A-Fa-f0-9]{6}" value={input} onChange={e=>setInput(e.target.value.toUpperCase())} required/><button className="primary" disabled={busy}>{busy?'Entrando…':'Entrar a la sala'}</button></form>{error&&<p className="error" role="alert">{error}</p>}<small>Tu acceso se conserva en este navegador durante el taller. No necesitas crear una cuenta.</small></section></main>;
}
function Voting({code}:{code:string}){
 const {state:s,error:loadError,connected,refresh}=useRoom(code,undefined,'participant');const [selected,setSelected]=useState<number|null>(null),[pending,setPending]=useState<any>(null),[error,setError]=useState(''),[sending,setSending]=useState(false);
 const key=s?`agora-pending-${code}-${s.question.id}`:'';
 useEffect(()=>{
  if(!s)return;let stored:any=null;
  try{stored=JSON.parse(localStorage.getItem(key)||'null');}catch{}
  setPending(stored);setSelected(stored?.value??s.ownVote?.value??null);setError('');
 },[key]);
 useEffect(()=>{if(s?.ownVote&&!pending)setSelected(s.ownVote.value);},[s?.ownVote?.voteId]);
 async function send(){
  if(!s||selected===null)return;
  const body=pending||{questionId:s.question.id,round:s.round,value:selected,requestId:requestId()};
  setPending(body);try{localStorage.setItem(key,JSON.stringify(body));}catch{}
  setSending(true);setError('');
  try{await api(`/salas/${code}/votos`,body);setPending(null);try{localStorage.removeItem(key);}catch{}await refresh();}
  catch(e){setError(message(e));if(e instanceof ApiError&&e.status!==0){setPending(null);try{localStorage.removeItem(key);}catch{}await refresh();}}
  finally{setSending(false);}
 }
 if(!s)return <main className="narrow"><p role="status">{loadError||'Recuperando la sala…'}</p><a href={'/participar/'+code}>Volver a entrar</a></main>;
 const saved=s.ownVote?.value===selected&&!pending;
 return <main className="participant"><div className="mobile-context"><span>Sala <strong>{code}</strong></span><Connection connected={connected}/></div><p className="participant-institution">{s.workshop.institucion}</p>{loadError&&<p className="error" role="alert">{loadError}</p>}<section className="card mobile-question"><Question state={s}/>{s.phase==='preparacion'?<Distribution state={s}/>:<><fieldset className="options" disabled={sending||s.phase!=='votacion-abierta'}><legend>Selecciona el nivel que mejor describe la situación</legend>{s.question.levels.map((l:any)=><label className={'option '+(selected===l.value?'selected':'')} data-level={l.value} key={l.value}><input type="radio" name="answer" checked={selected===l.value} onChange={()=>{setSelected(l.value);setError('');if(pending){setPending(null);try{localStorage.removeItem(key);}catch{}}}} value={l.value}/><span className="level-number" aria-hidden="true">{l.value}</span><span><strong>Nivel {l.value}</strong><span className="descriptor">{l.text}</span></span></label>)}</fieldset>{s.phase==='votacion-abierta'&&<div className="vote-submit"><p className={saved?'saved':'muted'} role="status">{saved?`Respuesta guardada: nivel ${s.ownVote.value}`:pending?'Envío pendiente de confirmación. Reintenta para comprobar si se guardó.':'Puedes cambiar tu respuesta hasta que cierre la votación.'}</p>{error&&<p className="error" role="alert">{error}</p>}<button className="primary" disabled={selected===null||sending||!connected||saved} onClick={()=>void send()}>{sending?'Guardando…':pending?'Reintentar envío':'Enviar respuesta'}</button></div>}{s.phase!=='votacion-abierta'&&<><p className="closed-note">{s.ownVote?`Tu respuesta guardada: nivel ${s.ownVote.value}`:'No registraste una respuesta en esta ronda.'}</p><Distribution state={s}/></>}</>}<Consensus value={s.consensus}/></section><GroupResults groups={s.groups}/><a className="button secondary room-results-link" href={`/resultados/${code}?view=participant`}>Ver resultados del taller</a><p className="footnote">{s.instrument.name} · v{s.instrument.version}{s.instrument.edition?` · Edición ${s.instrument.edition}`:''}<br/>No hay premios por rapidez. Tómate tiempo para leer.</p></main>;
}
export function Projector({code}:{code:string}){
 const [token]=useState(()=>{const k=`agora-projection-${code}`;let t=location.hash.slice(1);try{if(t){sessionStorage.setItem(k,t);history.replaceState(null,'',location.pathname);}else t=sessionStorage.getItem(k)||'';}catch{}return t;});
 const {state:s,error,connected}=useRoom(code,token);
 if(!s)return <main className="narrow"><p role="status">{error||'Abriendo proyección…'}</p><p>Abre esta vista desde el botón «Abrir proyector» del facilitador.</p></main>;
 return <main className="projector"><div className="page-heading"><div><div className="eyebrow">SALA {code}</div><p>{s.workshop.institucion}</p></div><Connection connected={connected}/></div><div className="projector-layout"><div className="projector-results"><section className="card"><Question state={s}/><div className="stats"><div><strong>{s.participantCount}</strong><span>Participantes</span></div><div><strong>{s.responseCount}</strong><span>Respuestas</span></div></div><Distribution state={s}/><Consensus value={s.consensus}/></section><GroupResults groups={s.groups}/><a className="button secondary room-results-link" href={`/resultados/${code}?view=projector#${token}`} target="_blank" rel="noreferrer">Ver resultados generales ↗</a></div><section className="card projector-join" aria-label="Entrar al taller"><div className="eyebrow">PARTICIPA DESDE TU CELULAR</div><h2>Escanea para participar</h2>{s.qr&&connected?<img className="projector-qr" src={s.qr} alt={`QR para participar en la sala ${code}`}/>:<p className="qr-placeholder" role="status">No se puede comprobar el enlace. El QR aparecerá cuando la conexión esté disponible.</p>}<p className="muted">Código de sala</p><div className="projector-room-code">{code}</div>{s.joinUrl&&connected&&<><a className="projector-join-url" href={s.joinUrl}>{s.joinUrl}</a><p className="muted">También puedes abrir esta dirección para entrar al taller.</p></>}</section></div><p className="footnote">Evaluación parcial · Acuerdos preliminares sujetos a revisión humana</p></main>;
}
