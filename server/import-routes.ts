import express, {type Express,type Request,type Response,type RequestHandler} from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Catalog } from './catalog.ts';
import { parseInstrumentXlsx,type ExcelImport } from './excel-import.ts';
import { fail, text } from './errors.ts';

function header(req:Request,name:string,required=false){
 const value=req.get(name);if(!value){if(required)fail(400,'CABECERA_REQUERIDA',`Falta ${name}.`);return undefined;}
 try{return decodeURIComponent(value);}catch{return fail(400,'CABECERA_INVALIDA',`${name} no es válido.`);}
}
function destinationPreview(parsed:ExcelImport,catalog:Catalog,baseVersionId?:string){
 const errors=[...parsed.errors],warnings=[...parsed.warnings];let retained=0,removed=0;
 if(baseVersionId){
  const base=catalog.get(baseVersionId);
  if(base.status!=='published')errors.push({sheet:'Destino',cell:'',message:'Seleccione una versión publicada para cargar otra edición.'});
  if(catalog.list().some(v=>v.instrumentId===base.instrumentId&&v.status==='draft'))errors.push({sheet:'Destino',cell:'',message:'Ya existe un borrador de este instrumento. Continúe o publique ese borrador antes de importar otra edición.'});
  const old=new Set(base.instrument.questions.filter(q=>q.code).map(q=>q.code!.toUpperCase())),incoming=new Set(parsed.questions.map(q=>q.code.toUpperCase()));
  retained=parsed.questions.filter(q=>old.has(q.code.toUpperCase())).length;removed=[...old].filter(code=>!incoming.has(code)).length;
  if(!old.size)warnings.push('La publicación de origen no tiene códigos de importación. Todas las preguntas recibirán identificadores nuevos.');
 }else if(catalog.list().some(v=>v.name.toLocaleLowerCase('es')===parsed.name.toLocaleLowerCase('es')))warnings.push('Ya existe un instrumento con este nombre. Para actualizarlo, seleccione «Nueva edición de un instrumento existente».');
 return {...parsed,errors,warnings,canImport:errors.length===0,changes:{retained,added:parsed.questions.length-retained,removed}};
}
export function registerInstrumentImports(app:Express,catalog:Catalog,admin:RequestHandler){
 app.get('/api/instrumentos/plantilla.xlsx',admin,(_req,res)=>{
  const name='plantilla-instrumentos-agora.xlsx';const local=resolve('public/templates',name),built=resolve('dist/templates',name);
  res.download(existsSync(local)?local:built,name);
 });
 const raw=express.raw({type:['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/octet-stream'],limit:'2mb'});
 async function parse(req:Request){
  if(!Buffer.isBuffer(req.body))fail(400,'ARCHIVO_REQUERIDO','Seleccione un archivo Excel .xlsx.');
  return parseInstrumentXlsx(req.body,header(req,'X-File-Name',true)!);
 }
 app.post('/api/instrumentos/importacion/validar',admin,raw,async(req:Request,res:Response)=>{
  const parsed=await parse(req);res.json(destinationPreview(parsed,catalog,header(req,'X-Base-Version-Id')));
 });
 app.post('/api/instrumentos/importacion/guardar',admin,raw,async(req:Request,res:Response)=>{
  const parsed=await parse(req);
  if(!parsed.canImport)fail(422,'EXCEL_CON_ERRORES','Corrija los errores del Excel antes de importar.');
  const previewHash=header(req,'X-Preview-Hash',true);
  if(previewHash!==parsed.fileHash)fail(409,'ARCHIVO_CAMBIADO','El archivo cambió después de la vista previa. Revíselo nuevamente.');
  const requestId=text(header(req,'X-Import-Request-Id',true),'Identificador de importación',80);
  const imported=catalog.importDraft(parsed,requestId,header(req,'X-Base-Version-Id'));res.status(201).json(imported);
 });
}
