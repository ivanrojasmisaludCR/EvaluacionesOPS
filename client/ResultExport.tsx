import {useState} from 'react';
export function ResultExport({code,connected}:{code:string;connected:boolean}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(''),[error,setError]=useState(''),[done,setDone]=useState('');
 async function download(format:'xlsx'|'pdf'){
  if(busy)return;setBusy(format);setError('');setDone('');
  try{
   const response=await fetch(`/api/salas/${encodeURIComponent(code)}/exportar/${format}`,{credentials:'same-origin',signal:AbortSignal.timeout(180000)});
   if(!response.ok){const data=await response.json().catch(()=>null);throw Error(data?.error?.message||'No se pudo preparar el informe. Vuelve a intentarlo.');}
   const expected=format==='pdf'?'application/pdf':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
   if(!response.headers.get('content-type')?.includes(expected))throw Error('La respuesta no contiene el informe esperado. Vuelve a intentarlo.');
   const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=response.headers.get('content-disposition')?.match(/filename="([A-Za-z0-9_.-]+)"/)?.[1]||`agora-${code}.${format}`;
   document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
   setDone(`Archivo ${format==='xlsx'?'Excel':'PDF'} preparado para descargar.`);
  }catch(e){setError(e instanceof Error&&e.name!=='TypeError'&&e.name!=='TimeoutError'?e.message:'No se pudo descargar el informe. Comprueba la conexión y vuelve a intentarlo.');}
  finally{setBusy('');}
 }
 return <section className="result-export" aria-label="Exportación de resultados"><button className="primary" aria-expanded={open} aria-controls="export-options" onClick={()=>setOpen(!open)}>Exportar resultados</button>{open&&<div id="export-options" className="card export-options"><h2>Descargar el informe actual</h2><p>Incluye todas las preguntas, descriptores, valoraciones de rondas cerradas, consensos, observaciones y gráficos de todas las áreas.</p><p className="muted">Los pendientes se identifican. Las observaciones son la justificación guardada del consenso. Excel contiene gráficos como imágenes.</p><div className="export-buttons"><button className="secondary" disabled={!!busy||!connected} onClick={()=>void download('xlsx')}>{busy==='xlsx'?'Preparando Excel…':'Descargar Excel'}</button><button className="secondary" disabled={!!busy||!connected} onClick={()=>void download('pdf')}>{busy==='pdf'?'Preparando PDF…':'Descargar PDF'}</button></div>{busy&&<p role="status">Preparando el informe con los datos guardados. Puede tardar unos momentos.</p>}{done&&<p role="status">{done}</p>}{!connected&&<p className="muted">Recupera la conexión para exportar una versión actualizada.</p>}{error&&<p className="error" role="alert">{error}</p>}</div>}</section>;
}
