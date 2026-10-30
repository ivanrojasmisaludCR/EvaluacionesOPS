import {useEffect,useRef,useState,type FormEvent} from 'react';
import {api,ApiError,message,requestId} from './api.ts';

const labels:Record<string,string>={starting:'Creando enlace de Cloudflare',checking:'Comprobando enlace público',online:'Enlace público disponible',offline:'Enlace público sin conexión',error:'No se pudo abrir el enlace',disabled:'Dirección pendiente',stale:'La dirección guardada ya no corresponde a esta red',configured:'Dirección LAN configurada'};
export function ConnectionSettings({onSaved}:{onSaved?:()=>void}){
 const [config,setConfig]=useState<any>(null),[url,setUrl]=useState(''),[error,setError]=useState(''),[denied,setDenied]=useState(false),[busy,setBusy]=useState(false),[available,setAvailable]=useState(false);
 const sequence=useRef(0),acting=useRef(false),pending=useRef<string|null>(null);
 const remote=location.hostname.endsWith('.trycloudflare.com');
 async function load(initial=false){
  if(acting.current)return;const id=++sequence.current;
  try{const value=await api('/config');if(id!==sequence.current)return;setAvailable(true);setConfig(value);setDenied(false);setError('');if(initial)setUrl(value.manualUrl||value.suggestions[0]||'');}
  catch(e){if(id!==sequence.current)return;setAvailable(false);setDenied(e instanceof ApiError&&e.status===401);setError(e instanceof ApiError&&e.status===0?'No se pudo contactar con la aplicación. Comprueba la red y que Docker esté iniciado.':message(e));}
 }
 useEffect(()=>{void load(true);const timer=setInterval(()=>void load(),10000);return()=>{clearInterval(timer);++sequence.current;};},[]);
 async function action(kind:'comprobar'|'generar'|'lan'){
  acting.current=true;++sequence.current;setBusy(true);setError('');
  try{
   let value;
   if(kind==='lan')value=await api('/config',{publicUrl:url},'PATCH');
   else {if(kind==='generar')pending.current??=requestId();value=await api('/conexion/'+kind,kind==='generar'?{requestId:pending.current}:{});if(kind==='generar')pending.current=null;}
   setAvailable(true);setConfig(value);onSaved?.();
  }catch(e){setAvailable(false);setError(e instanceof ApiError&&e.status===0?'No se pudo contactar con la aplicación. Comprueba la red y que Docker esté iniciado.':message(e));}
  finally{acting.current=false;setBusy(false);}
 }
 if(denied)return <section className="card"><p>Ingresa para administrar la conexión y el QR.</p><a className="button primary" href="/facilitador">Ingresar como facilitador</a></section>;
 if(!config)return <section className="connection-settings"><p role="status">{error||'Comprobando la aplicación…'}</p><button className="secondary" onClick={()=>void load(true)}>Reintentar conexión</button></section>;
 const connection=config.connection;const publicUrl=available?config.publicUrl:'';
 return <section className="connection-settings" aria-label="Estado de conexión">
  <div className={'connection-app'+(available?'':' unavailable')}><strong>{available?'Aplicación disponible':'Aplicación sin conexión'}</strong><span>{connection.runtime==='docker'?'Instalación Docker':'Instalación local'} · Los talleres se conservan en esta instalación.</span></div>
  <div className={'public-connection '+(available?connection.status:'offline')} role="status"><strong>{available?(labels[connection.status]||connection.status):'No se puede comprobar el enlace'}</strong>{connection.checkedAt&&<small>Última comprobación: {new Date(connection.checkedAt).toLocaleTimeString('es-CR')}</small>}</div>
  {connection.error&&<p className="import-warning">{connection.error}</p>}
  {connection.mode==='cloudflare'?<>
   {publicUrl?<><label>Dirección pública verificada</label><a className="connection-url" href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a><p className="muted">El QR de todas las salas utiliza este enlace. Los teléfonos pueden conectarse desde cualquier red con Internet.</p></>:<p className="muted">El QR se habilitará cuando el enlace responda desde esta instalación.</p>}
   {connection.lastUrl&&connection.lastUrl!==config.publicUrl&&<p className="muted connection-previous">Última dirección registrada, sin validar actualmente:<br/>{connection.lastUrl}</p>}
   <div className="connection-actions"><button className="secondary" disabled={busy} onClick={()=>void action('comprobar')}>{busy?'Comprobando…':'Comprobar conexión'}</button><button className="primary" disabled={busy||remote||connection.status==='starting'} onClick={()=>void action('generar')}>Generar nuevo enlace</button></div>
   {remote&&<p className="import-warning">Para generar otro enlace, abre esta pantalla desde la computadora del facilitador usando la dirección local de la aplicación. Así podrás ver el nuevo enlace cuando el anterior se cierre.</p>}
   <p className="muted connection-help">Cloudflare intentará recuperar el mismo enlace si vuelve la red. Al generar otro enlace o reiniciar el túnel, comparte el nuevo QR. Los participantes deberán entrar otra vez; las respuestas y consensos ya guardados se conservan.</p>
  </>:<>
   <p className="muted">El enlace automático de Cloudflare se habilita en la instalación Docker.</p>
   <form onSubmit={(e:FormEvent)=>{e.preventDefault();void action('lan');}}><label htmlFor="connection-manual-url">Dirección para compartir</label><input id="connection-manual-url" type="url" list="connection-addresses" value={url} onChange={e=>setUrl(e.target.value)} required disabled={config.urlLocked} placeholder="http://192.168.1.20:3000"/><datalist id="connection-addresses">{config.suggestions.map((s:string)=><option key={s} value={s}/>)}</datalist>{config.urlLocked?<p className="muted">Dirección fijada en la configuración de arranque.</p>:<button className="secondary" disabled={busy}>Guardar dirección LAN</button>}</form>
   <button className="secondary" disabled={busy} onClick={()=>void action('comprobar')}>Comprobar conexión</button><p className="muted connection-help">En modo LAN, comprueba la dirección desde un teléfono en la misma red antes de compartirla.</p>
  </>}
  {error&&<p className="error" role="alert">{error}</p>}
 </section>;
}
export function Network({onSaved}:{onSaved:()=>void}){return <details className="network-settings"><summary>Conexión y dirección del QR</summary><ConnectionSettings onSaved={onSaved}/><a href="/conexion">Abrir panel de conexión</a></details>;}
export function ConnectionPage(){return <main className="dashboard connection-page"><a className="back" href="/facilitador">← Talleres</a><div className="page-heading"><div><div className="eyebrow">ACCESO PARA LOS PARTICIPANTES</div><h1>Conexión y QR</h1><p className="muted">Comprueba la aplicación y el enlace que comparten todas las salas.</p></div></div><div className="card"><ConnectionSettings/></div></main>;}
