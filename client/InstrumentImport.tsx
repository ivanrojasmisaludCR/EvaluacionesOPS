import { useState } from 'react';
import { ApiError,message,requestId } from './api.ts';
import type { InstrumentSummary } from '../server/catalog.ts';
import type { ExcelImport } from '../server/excel-import.ts';
type Preview=ExcelImport & {changes:{retained:number;added:number;removed:number}};
export function InstrumentImport({versions,onClose}:{versions:InstrumentSummary[];onClose:()=>void}){
 const [file,setFile]=useState<File|null>(null),[target,setTarget]=useState(''),[preview,setPreview]=useState<Preview|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[submission,setSubmission]=useState(requestId);
 const reset=()=>{setPreview(null);setError('');setSubmission(requestId());};
 const publications=versions.filter(v=>v.status==='published');
 async function upload(action:'validar'|'guardar'){
  if(!file)return;setBusy(true);setError('');
  try{
   const response=await fetch('/api/instrumentos/importacion/'+action,{method:'POST',credentials:'same-origin',signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','X-File-Name':encodeURIComponent(file.name),...(target?{'X-Base-Version-Id':encodeURIComponent(target)}:{}),...(action==='guardar'?{'X-Preview-Hash':preview!.fileHash,'X-Import-Request-Id':submission}:{})},body:file});
   const data=await response.json();if(!response.ok)throw new ApiError(data.error?.message||'No se pudo importar el archivo.',response.status);
   if(action==='guardar'){location.assign('/instrumentos/'+encodeURIComponent(data.versionId));return;}
   setPreview(data);
  }catch(e){setError(e instanceof ApiError?e.message:'No se pudo contactar con Ágora. Conservamos el archivo y puedes reintentar la misma importación.');}
  finally{setBusy(false);}
 }
 return <section className="card import-panel"><div className="section-heading"><div><div className="eyebrow">CARGA DESDE EXCEL</div><h2>Importar instrumento</h2></div><button className="text-button" disabled={busy} onClick={onClose}>Cerrar importación</button></div><p className="muted">Completa la plantilla, revisa el contenido y guárdalo como borrador. Tú decides cuándo publicarlo.</p><a className="button secondary" href="/api/instrumentos/plantilla.xlsx" download>Descargar plantilla Excel</a>
 <div className="import-fields"><div><label htmlFor="import-target">Destino de la importación</label><select id="import-target" value={target} disabled={busy} onChange={e=>{setTarget(e.target.value);reset();}}><option value="">Nuevo instrumento</option>{publications.map(v=><option key={v.versionId} value={v.versionId}>Nueva edición de {v.name}{v.edition?` · ${v.edition}`:''} · v{v.version}</option>)}</select><p className="editor-small muted">{target?'Conservaremos los identificadores de las preguntas con el mismo código. Los talleres anteriores seguirán usando su edición.':'Se creará un instrumento independiente. Para actualizar uno existente, elige su publicación de origen.'}</p></div><div><label htmlFor="import-file">Archivo Excel (.xlsx)</label><input id="import-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy} onChange={e=>{const next=e.target.files?.[0]||null;setFile(next);reset();if(next&&next.size>2*1024*1024)setError('El archivo no puede superar 2 MiB.');}}/><p className="editor-small muted">Hojas Ficha y Preguntas · hasta 200 preguntas de madurez · máximo 2 MiB.</p></div></div>
 <button className="primary" disabled={busy||!file||file.size>2*1024*1024} onClick={()=>void upload('validar')}>{busy?'Procesando…':'Revisar archivo'}</button>{error&&<p className="error" role="alert">{error}</p>}
 {preview&&<div className="import-preview"><div className="section-heading"><div><div className="eyebrow">VISTA PREVIA</div><h3>{preview.name||'Instrumento sin nombre'}</h3><p className="muted">Edición {preview.metadata.edition||'pendiente'} · {preview.questions.length} preguntas · todavía no se ha guardado.</p></div><span className={'version-badge '+(preview.canImport?'published':'draft')}>{preview.canImport?'Listo para importar':'Requiere correcciones'}</span></div>
 {preview.metadata.description&&<p>{preview.metadata.description}</p>}{preview.metadata.reference&&<p className="import-reference"><strong>Documento de referencia:</strong> {preview.metadata.reference}</p>}
 {preview.warnings.map((w,i)=><p key={i} className="import-warning">{w}</p>)}
 {preview.errors.length>0?<div className="import-errors" role="alert"><h4>Corrige estos campos en el Excel y vuelve a revisarlo</h4><ul>{preview.errors.map((e,i)=><li key={i}><strong>{e.sheet}{e.cell?'!'+e.cell:''}:</strong> {e.message}</li>)}</ul></div>:<p className="import-changes">{target?`${preview.changes.retained} códigos conservados · ${preview.changes.added} preguntas nuevas · ${preview.changes.removed} preguntas retiradas en la nueva edición.`:'Se creará un instrumento con '+preview.questions.length+' preguntas.'}</p>}
 <div className="import-question-list" aria-label="Preguntas de la vista previa">{preview.questions.map((q,i)=><details key={i}><summary><span className="question-number">{i+1}</span><strong>{q.code||'Sin código'}</strong><span>{q.text||'Pregunta pendiente'}</span></summary><div className="import-question-detail"><p className="eyebrow">{q.area} · {q.domain}</p>{q.levels.map(l=><p key={l.value}><strong>Nivel {l.value}:</strong> {l.text||'Descriptor pendiente'}</p>)}</div></details>)}</div>
 <div className="import-confirm"><p className="muted">La importación se guardará como borrador. Puedes revisar las preguntas en el editor antes de publicar.</p><button className="primary" disabled={busy||!preview.canImport} onClick={()=>void upload('guardar')}>{busy?'Guardando…':'Importar como borrador'}</button></div></div>}
 </section>;
}
