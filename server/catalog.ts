import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { fail, text } from './errors.ts';
import type { ExcelImport,ImportMetadata } from './excel-import.ts';

export type Question={id:string;code?:string;number:number;text:string;area:string;domain:string;type:string;levels:{value:number;text:string}[];source:unknown};
export type Instrument={id:string;version:string;name:string;partial:boolean;source:unknown;metadata?:ImportMetadata;questions:Question[]};
export type InstrumentVersion={versionId:string;instrumentId:string;revision:number;editRevision:number;status:'draft'|'published';createdAt:string;publishedAt:string|null;instrument:Instrument};
export type InstrumentSummary=Omit<InstrumentVersion,'instrument'> & {name:string;version:string;edition?:string;questionCount:number};
type Row={version_id:string;instrument_id:string;revision:number;edit_revision:number;status:'draft'|'published';created_at:string;published_at:string|null;content:string};
export type DraftInput={name:string;questions:Question[];editRevision:number};
const convert=(r:Row):InstrumentVersion=>({versionId:r.version_id,instrumentId:r.instrument_id,revision:r.revision,editRevision:r.edit_revision,status:r.status,createdAt:r.created_at,publishedAt:r.published_at,instrument:JSON.parse(r.content)});
const draftText=(v:unknown,label:string,max:number)=>{if(typeof v!=='string'||v.length>max)fail(400,'CAMPO_INVALIDO',`${label}: debe ser texto de hasta ${max} caracteres.`);return (v as string).trim();};
function checkQuestions(value:unknown,previous:Instrument,publishing:boolean):Question[] {
 if(!Array.isArray(value)||value.length>200)fail(400,'PREGUNTAS_INVALIDAS','El instrumento admite hasta 200 preguntas.');
 const rows=value as any[];
 if(publishing&&rows.length===0)fail(400,'INSTRUMENTO_VACIO','Agregue al menos una pregunta antes de publicar.');
 const ids=new Set<string>();
 return rows.map((q,index)=>{
  if(!q||typeof q!=='object')return fail(400,'PREGUNTA_INVALIDA','La pregunta no es válida.');
  const id=text(q.id,'Identificador de pregunta',80);
  if(!/^[a-zA-Z0-9_-]+$/.test(id)||ids.has(id))fail(400,'ID_REPETIDO','Cada pregunta necesita un identificador único.');ids.add(id);
  if(q.type!=='madurez')fail(400,'TIPO_NO_DISPONIBLE','Esta entrega admite preguntas de madurez.');
  if(!Array.isArray(q.levels)||q.levels.length!==5||q.levels.some((l:any,i:number)=>!l||l.value!==i+1))fail(400,'ESCALA_INVALIDA','La escala debe tener exactamente los cinco niveles 1, 2, 3, 4 y 5, en ese orden.');
  const questionText=draftText(q.text,'Pregunta',10000),area=draftText(q.area,'Área',200),domain=draftText(q.domain,'Dominio',200);
  const levels=q.levels.map((l:any)=>({value:l.value,text:draftText(l.text,`Descriptor del nivel ${l.value}`,10000)}));
  if(publishing) {
   text(questionText,`Pregunta ${index+1}`,10000);text(area,`Área de la pregunta ${index+1}`);text(domain,`Dominio de la pregunta ${index+1}`);
   for(const l of levels)if(!l.text)fail(400,'DESCRIPTOR_FALTANTE',`Pregunta ${index+1}: complete el descriptor del nivel ${l.value}.`);
  }
  const old=previous.questions.find(p=>p.id===id);
  const changed=old&&(old.text.trim()!==questionText||old.area.trim()!==area||old.domain.trim()!==domain||old.levels.some((l,i)=>l.text.trim()!==levels[i].text));
  const source=old?(changed&&old.source?((old.source as any).customized?old.source:{customized:true,original:old.source}):old.source):null;
  return {id,...(old?.code?{code:old.code}:{}),number:index+1,text:questionText,area,domain,type:'madurez',levels,source};
 });
}
export class Catalog {
 db:DatabaseSync;
 defaultVersionId:string;
 constructor(db:DatabaseSync,seed:Instrument){
  this.db=db;this.defaultVersionId=`${seed.id}@${seed.version}`;
  this.db.exec('BEGIN IMMEDIATE');
  try{
   this.db.exec(`CREATE TABLE IF NOT EXISTS instrument_versions(version_id TEXT PRIMARY KEY,instrument_id TEXT NOT NULL,revision INTEGER NOT NULL,edit_revision INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL CHECK(status IN ('draft','published')),created_at TEXT NOT NULL,published_at TEXT,content TEXT NOT NULL,UNIQUE(instrument_id,revision));
   CREATE UNIQUE INDEX IF NOT EXISTS one_draft_per_instrument ON instrument_versions(instrument_id) WHERE status='draft';
   CREATE TABLE IF NOT EXISTS import_receipts(request_id TEXT PRIMARY KEY,file_hash TEXT NOT NULL,base_version_id TEXT,result_version_id TEXT NOT NULL REFERENCES instrument_versions(version_id),created_at TEXT NOT NULL);
   PRAGMA user_version=3;`);
   if(!db.prepare('SELECT 1 FROM instrument_versions WHERE version_id=?').get(this.defaultVersionId)) {
    const now=new Date().toISOString();db.prepare('INSERT INTO instrument_versions VALUES(?,?,?,?,?,?,?,?)').run(this.defaultVersionId,seed.id,1,0,'published',now,now,JSON.stringify(seed));
   }
   this.db.exec('COMMIT');
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 private transaction<T>(fn:()=>T):T{this.db.exec('BEGIN IMMEDIATE');try{const result=fn();this.db.exec('COMMIT');return result;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 get(versionId:string):InstrumentVersion{const row=this.db.prepare('SELECT * FROM instrument_versions WHERE version_id=?').get(versionId) as Row|undefined;if(!row)return fail(404,'INSTRUMENTO_NO_EXISTE','No se encontró esa versión del instrumento.');return convert(row);}
 list():InstrumentSummary[]{return (this.db.prepare('SELECT * FROM instrument_versions ORDER BY created_at DESC,revision DESC').all() as Row[]).map(r=>{const {instrument,...v}=convert(r);return {...v,name:instrument.name,version:instrument.version,...(instrument.metadata?{edition:instrument.metadata.edition}:{}),questionCount:instrument.questions.length};});}
 create(name:string):InstrumentVersion{
  const instrument:Instrument={id:randomUUID(),version:'1.0.0',name:text(name,'Nombre del instrumento'),partial:true,source:{kind:'custom'},questions:[]};
  const versionId=randomUUID();this.db.prepare('INSERT INTO instrument_versions VALUES(?,?,?,?,?,?,?,?)').run(versionId,instrument.id,1,0,'draft',new Date().toISOString(),null,JSON.stringify(instrument));return this.get(versionId);
 }
 importDraft(parsed:ExcelImport,requestId:string,baseVersionId?:string):InstrumentVersion{
  text(requestId,'Identificador de importación',80);
  if(!/^[A-Za-z0-9_-]{8,80}$/.test(requestId))fail(400,'IMPORTACION_INVALIDA','Identificador de importación no válido.');
  if(!parsed.canImport||parsed.errors.length)fail(422,'EXCEL_CON_ERRORES','Corrija los errores del Excel antes de importar.');
  return this.transaction(()=>{
   const receipt=this.db.prepare('SELECT * FROM import_receipts WHERE request_id=?').get(requestId) as any;
   if(receipt){if(receipt.file_hash!==parsed.fileHash||(receipt.base_version_id||undefined)!==baseVersionId)fail(409,'IMPORTACION_CONFLICTO','El identificador de importación corresponde a otro archivo o destino.');return this.get(receipt.result_version_id);}
   const base=baseVersionId?this.get(baseVersionId):undefined;
   if(base&&base.status!=='published')fail(409,'VERSION_NO_PUBLICADA','Seleccione una versión publicada para importar una nueva edición.');
   if(base&&this.db.prepare("SELECT 1 FROM instrument_versions WHERE instrument_id=? AND status='draft'").get(base.instrumentId))fail(409,'BORRADOR_EXISTENTE','Ya existe un borrador de este instrumento. Continúe o publique ese borrador antes de importar otra edición.');
   const instrumentId=base?.instrumentId||randomUUID();
   let revision=1,version='1.0.0';
   if(base){const latest=this.db.prepare('SELECT * FROM instrument_versions WHERE instrument_id=? ORDER BY revision DESC LIMIT 1').get(instrumentId) as Row;const last=convert(latest),parts=last.instrument.version.split('.').map(Number);revision=last.revision+1;version=`${parts[0]}.${parts[1]}.${parts[2]+1}`;}
   const previous=base?.instrument||{id:instrumentId,version,name:parsed.name,partial:true,source:null,questions:[]};
   const existing=new Map(previous.questions.filter(q=>q.code).map(q=>[q.code!.toUpperCase(),q.id]));
   const imported:Question[]=parsed.questions.map((q,index)=>({id:existing.get(q.code.toUpperCase())||randomUUID(),code:q.code,number:index+1,text:q.text,area:q.area,domain:q.domain,type:'madurez',levels:q.levels,source:{kind:'excel-import',fileName:parsed.fileName,sha256:parsed.fileHash,sheet:'Preguntas',row:q.row,code:q.code}}));
   const checked=checkQuestions(imported,previous,true).map((q,i)=>({...q,code:imported[i].code,source:imported[i].source}));
   const instrument:Instrument={id:instrumentId,version,name:text(parsed.name,'Nombre del instrumento'),metadata:parsed.metadata,partial:true,source:{kind:'excel-import',fileName:parsed.fileName,sha256:parsed.fileHash,...(base?{basedOn:{id:base.instrumentId,version:base.instrument.version}}:{})},questions:checked};
   const id=randomUUID(),now=new Date().toISOString();this.db.prepare('INSERT INTO instrument_versions VALUES(?,?,?,?,?,?,?,?)').run(id,instrumentId,revision,0,'draft',now,null,JSON.stringify(instrument));
   this.db.prepare('INSERT INTO import_receipts VALUES(?,?,?,?,?)').run(requestId,parsed.fileHash,baseVersionId||null,id,now);return this.get(id);
  });
 }
 private expected(v:InstrumentVersion,editRevision:unknown){if(!Number.isInteger(editRevision)||editRevision!==v.editRevision)fail(409,'EDICION_CONFLICTO','El instrumento cambió en otra pestaña. Conserve sus cambios y vuelva a abrir la versión guardada.');}
 save(versionId:string,input:DraftInput):InstrumentVersion{
  return this.transaction(()=>{
   const v=this.get(versionId);if(v.status!=='draft')fail(409,'VERSION_INMUTABLE','Una versión publicada no se puede modificar. Cree un nuevo borrador.');this.expected(v,input.editRevision);
   const instrument:Instrument={...v.instrument,name:text(input.name,'Nombre del instrumento'),questions:checkQuestions(input.questions,v.instrument,false)};
   this.db.prepare('UPDATE instrument_versions SET content=?,edit_revision=edit_revision+1 WHERE version_id=?').run(JSON.stringify(instrument),versionId);return this.get(versionId);
  });
 }
 publish(versionId:string,editRevision:number):InstrumentVersion{
  return this.transaction(()=>{
   const v=this.get(versionId);this.expected(v,editRevision);if(v.status==='published')return v;
   text(v.instrument.name,'Nombre del instrumento');checkQuestions(v.instrument.questions,v.instrument,true);
   this.db.prepare("UPDATE instrument_versions SET status='published',published_at=? WHERE version_id=?").run(new Date().toISOString(),versionId);return this.get(versionId);
  });
 }
 draft(versionId:string):InstrumentVersion{
  return this.transaction(()=>{
   const original=this.get(versionId);if(original.status==='draft')return original;
   const existing=this.db.prepare("SELECT * FROM instrument_versions WHERE instrument_id=? AND status='draft'").get(original.instrumentId) as Row|undefined;if(existing)return convert(existing);
   const latest=this.db.prepare('SELECT * FROM instrument_versions WHERE instrument_id=? ORDER BY revision DESC LIMIT 1').get(original.instrumentId) as Row;
   const last=convert(latest),parts=last.instrument.version.split('.').map(Number);const version=`${parts[0]}.${parts[1]}.${parts[2]+1}`;
   const instrument:Instrument={...original.instrument,version,source:{kind:'customized',basedOn:{id:original.instrument.id,version:original.instrument.version}}};
   const id=randomUUID();this.db.prepare('INSERT INTO instrument_versions VALUES(?,?,?,?,?,?,?,?)').run(id,original.instrumentId,last.revision+1,0,'draft',new Date().toISOString(),null,JSON.stringify(instrument));return this.get(id);
  });
 }
}
