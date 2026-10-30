import { useEffect, useRef, useState } from 'react';

const destinations=[
 {label:'Inicio',href:'/',description:'Entrada a Ágora'},
 {label:'Talleres',href:'/facilitador',description:'Crear y retomar talleres'},
 {label:'Resultados',href:'/resultados',description:'Avance, dominios y gráficos de radar'},
 {label:'Instrumentos',href:'/instrumentos',description:'Crear, editar y publicar versiones'},
 {label:'Importar Excel',href:'/instrumentos#importar',description:'Cargar preguntas desde la plantilla'},
 {label:'Conexión y QR',href:'/conexion',description:'Comprobar y renovar el enlace público'},
 {label:'Participar',href:'/participar',description:'Entrar a una sala con su código'},
];
export function Navigation(){
 const details=useRef<HTMLDetailsElement>(null);
 const [hash,setHash]=useState(location.hash);
 useEffect(()=>{
  const changed=()=>setHash(location.hash);
  const outside=(e:PointerEvent)=>{if(e.target instanceof Node&&!details.current?.contains(e.target))details.current?.removeAttribute('open');};
  window.addEventListener('hashchange',changed);document.addEventListener('pointerdown',outside);
  return ()=>{window.removeEventListener('hashchange',changed);document.removeEventListener('pointerdown',outside);};
 },[]);
 const path=location.pathname;
 const current=path.startsWith('/instrumentos')?(hash==='#importar'?'/instrumentos#importar':'/instrumentos'):path.startsWith('/sala/')?'/facilitador':path.startsWith('/participar')?'/participar':path;
 return <details className="site-menu" ref={details} onKeyDown={e=>{if(e.key==='Escape'){details.current?.removeAttribute('open');details.current?.querySelector('summary')?.focus();}}}>
  <summary><span aria-hidden="true">☰</span><span>Menú</span></summary>
  <nav className="site-menu-links" aria-label="Navegación principal">
   {destinations.map(item=><a key={item.href} href={item.href} aria-current={current===item.href?'page':undefined} onClick={()=>details.current?.removeAttribute('open')}><strong>{item.label}</strong><small>{item.description}</small></a>)}
  </nav>
 </details>;
}
