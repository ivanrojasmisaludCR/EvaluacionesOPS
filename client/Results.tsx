import {useEffect,useState} from 'react';
import {api,ApiError,message,useRoom} from './api.ts';
import {Connection} from './Room.tsx';
import {Radar} from './Radar.tsx';
import {ResultExport} from './ResultExport.tsx';
import type {AreaResult,DomainResult,ResultsSummary} from '../server/results.ts';
const number=(value:number|null,digits=0)=>value===null?'—':value.toLocaleString('es-CR',{minimumFractionDigits:digits,maximumFractionDigits:digits});
function ResultsList(){
 const [rooms,setRooms]=useState<any[]|null>(null),[error,setError]=useState(''),[denied,setDenied]=useState(false);
 useEffect(()=>{api('/talleres').then(setRooms).catch(e=>{setError(message(e));setDenied(e instanceof ApiError&&e.status===401);});},[]);
 return <main className="dashboard results-library"><div className="page-heading"><div><div className="eyebrow">SEGUIMIENTO DEL TALLER</div><h1>Resultados</h1><p className="muted">Consulta el avance, los puntajes por dominio y los gráficos de radar en cualquier momento.</p></div></div>{denied?<section className="card"><p>Ingresa como facilitador para elegir un taller. Si participas en una sala, abre los resultados desde esa sala.</p><a className="button primary" href="/facilitador">Ingresar como facilitador</a></section>:error?<p className="error" role="alert">{error}</p>:!rooms?<p role="status">Cargando talleres…</p>:rooms.length===0?<section className="card"><h2>No hay talleres todavía</h2><a href="/facilitador">Crear un taller</a></section>:<div className="workshops">{rooms.map(room=><a className="card workshop-link" key={room.code} href={'/resultados/'+room.code}><div className="eyebrow">{room.pais} · {room.fecha}</div><h2>{room.institucion}</h2><p className="muted">Sala {room.code}</p><span>Consultar resultados →</span></a>)}</div>}</main>;
}
function DomainTable({domains}:{domains:DomainResult[]}){
 return <div className="results-table-scroll"><table className="results-table"><caption>Resultados actuales por dominio</caption><thead><tr><th scope="col">Dominio</th><th scope="col">Consensos</th><th scope="col">Suma actual</th><th scope="col">Promedio actual</th><th scope="col">Nivel actual</th><th scope="col">Estado</th></tr></thead><tbody>{domains.map(d=><tr key={d.id}><th scope="row">{d.domain}</th><td>{d.completed} / {d.total}</td><td>{d.completed?d.sum:'—'}</td><td>{number(d.currentAverage,d.currentAverage===null?0:2)}</td><td>{number(d.currentScore)}</td><td><span className={'result-status '+(d.complete?'complete':'')}>{d.complete?'Completo':d.completed?'Parcial':'Pendiente'}</span></td></tr>)}</tbody></table></div>;
}
function ResultsRoom({code,token,participant,projector}:{code:string;token?:string;participant:boolean;projector:boolean}){
 const {state:s,error,connected}=useRoom(code,token,participant?'participant':undefined);
 const [selected,setSelected]=useState('');
 if(!s)return <main className="narrow"><h1>Resultados del taller</h1><p role="status">{error||'Cargando los consensos guardados…'}</p><a href={participant?'/participar/'+code:'/facilitador'}>{participant?'Entrar a la sala':'Ingresar como facilitador'}</a></main>;
 const r:ResultsSummary=s.results;
 if(!r)return <main className="narrow"><p role="alert">Recarga la página para consultar los resultados de la versión actual.</p></main>;
 const current:AreaResult|undefined=r.areas.find(a=>a.id===selected)||r.areas[0];
 const domains=current?r.domains.filter(d=>d.area===current.area):[];
 const isAdmin='projectionToken' in s;
 const back=participant?'/participar/'+code:projector?'/proyectar/'+code:isAdmin?'/sala/'+code:'/participar/'+code;
 return <main className="dashboard results-page"><a className="back" href={back}>← Volver a la sala</a><div className="page-heading"><div><div className="eyebrow">SALA {code} · {s.instrument.name} · V{s.instrument.version}</div><h1>Resultados del taller</h1><h2 className="results-institution">{s.workshop.institucion}</h2><p className="muted">{s.workshop.pais} · {s.workshop.fecha}{s.instrument.edition?` · Edición ${s.instrument.edition}`:''}</p></div><Connection connected={connected}/></div>
  {isAdmin&&<ResultExport code={code} connected={connected}/>}
  {(!connected||error)&&<p className="error" role="alert">{error||'Sin conexión con la aplicación.'} Se muestra el último estado recibido; los resultados pueden haber cambiado.</p>}
  <section className="results-progress" aria-label="Avance del instrumento"><div><strong>{r.completedQuestions} / {r.totalQuestions}</strong><span>Preguntas con consenso</span></div><div><strong>{r.completedDomains} / {r.totalDomains}</strong><span>Dominios completos</span></div><div><strong>{r.completedAreas} / {r.totalAreas}</strong><span>Áreas completas</span></div></section>
  <div className={'results-notice '+(r.complete?'complete':'')}><strong>{r.complete?'Todos los consensos registrados':'Resultado parcial'}</strong><p>{r.complete?'Se completaron las preguntas de este instrumento. Los acuerdos siguen sujetos a revisión humana.':'Los puntajes actuales usan los consensos disponibles. Cambiarán a medida que avance el taller.'}</p>{r.lastConsensusAt&&<small>Último consenso: {new Date(r.lastConsensusAt).toLocaleString('es-CR')}</small>}</div>
  <section className="card results-overview" aria-label="Resumen general"><div><div className="eyebrow">RESUMEN GENERAL</div><h2>Perfil por área</h2><p className="muted">Escala de madurez: 1 a 5. Cada área promedia los niveles actuales de sus dominios.</p><div className="area-scores">{r.areas.map(area=><article key={area.id} className="area-score"><h3>{area.area}</h3><strong>{number(area.currentScore,1)}</strong><p>{area.completedQuestions} de {area.totalQuestions} preguntas con consenso</p><span className={'result-status '+(area.complete?'complete':'')}>{area.complete?'Completo':area.currentScore===null?'Pendiente':'Parcial'}</span></article>)}</div></div><Radar title="Radar de áreas" axes={r.areas.map(area=>({id:area.id,label:area.area,value:area.currentScore,complete:area.complete}))}/></section>
  <section className="card results-detail" aria-label="Detalle por dominio"><div className="section-heading"><div><div className="eyebrow">DETALLE POR DOMINIO</div><h2>Resultados de cada área</h2></div><div className="results-area-select"><label htmlFor="results-area">Área a consultar</label><select id="results-area" value={current?.id||''} onChange={e=>setSelected(e.target.value)}>{r.areas.map(a=><option key={a.id} value={a.id}>{a.area}</option>)}</select></div></div>{current&&<><Radar title={'Radar de dominios de '+current.area} axes={domains.map(d=>({id:d.id,label:d.domain,value:d.currentScore,complete:d.complete}))}/><DomainTable domains={domains}/></>}</section>
  <details className="card results-method"><summary>Cómo se calculan estos resultados</summary><p>Se utilizan los consensos guardados por el facilitador. Los votos individuales orientan la discusión y no se suman en este resumen.</p><p>Cada dominio divide la suma de sus consensos entre el número de preguntas con consenso y redondea a un nivel entero. El área promedia esos niveles de dominio, con igual peso para cada dominio, y redondea a un decimal.</p><p>Los pendientes se excluyen del cálculo, sin contarlos como cero. Mientras falten preguntas o dominios, se indica resultado parcial. No se calcula un puntaje único que mezcle todas las áreas.</p><p>Se usan los nombres y agrupamientos de la versión del instrumento con que comenzó este taller. El resumen no certifica equivalencia con todas las fórmulas del Excel original.</p></details>
 </main>;
}
function ResultsRoute({code}:{code:string}){
 const view=new URLSearchParams(location.search).get('view'),projector=view==='projector',participant=view==='participant';
 const [token]=useState(()=>{if(!projector)return undefined;const key=`agora-projection-${code}`;let value=location.hash.slice(1);try{if(value){sessionStorage.setItem(key,value);history.replaceState(null,'',location.pathname+location.search);}else value=sessionStorage.getItem(key)||'';}catch{}return value;});
 if(projector&&!token)return <main className="narrow"><h1>Resultados del taller</h1><p>Abre esta consulta desde la proyección autorizada de la sala.</p></main>;
 return <ResultsRoom code={code} token={token} participant={participant} projector={projector}/>;
}
export function Results({code}:{code?:string}){return code?<ResultsRoute code={code}/>:<ResultsList/>;}
